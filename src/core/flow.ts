import type { CDPSession, Page } from 'playwright';
import type { AppAction, Evidence, Frame, RouteEvent, ToolResult, UserEvent } from './types.js';
import { assertAllowedUrl, checkRobots, FORBIDDEN_CLICK, FORBIDDEN_INPUT, FORBIDDEN_OPERATION, limiter, PolicyError } from './policy.js';
import { Findings } from './session.js';
import { LiveApp, type Executed, type ScriptMeta } from './live.js';
import { SourceLocator, type Located } from './locate.js';
import { redactCode, redactUrl } from './redact.js';
import { scriptsAnalysis } from './scripts.js';
import { HEARTBEAT } from './wsproto.js';

export interface FlowHandler {
  evento: string;
  nodo: string;
  funcion: string;
  fragmento: string;
  ejecutado: boolean;
  frame: Frame;
  donde: Located;
}

export interface FlowFunction {
  funcion: string;
  llamadas: number;
  fragmento: string;
  frame: Frame;
  donde: Located;
}

export interface FlowStep {
  paso: number;
  t: number;
  origen: 'usuario' | 'guiada';
  gesto: string;
  selector?: string;
  ok: boolean;
  rechazada?: string;
  error?: string;
  urlAntes?: string;
  urlDespues?: string;
  rutas: RouteEvent[];
  dom: { registros: number; anadidos: { donde: string; nodos: string; cantidad: number }[]; eliminados: number; atributos: { objetivo: string; atributo: string }[]; textos: number };
  peticiones: { metodo: string; url: string; estado: number; tipo: string; linea: number; iniciador?: string }[];
  /** Scripts cargados bajo demanda durante el paso. */
  trozos: string[];
  recursos: number;
  /** Mensajes enviados por WebSocket durante el paso, por tipo. */
  mensajes: { clave: string; veces: number }[];
  manejadores: FlowHandler[];
  funciones: FlowFunction[];
  /** Funciones que también se ejecutan con la aplicación en reposo (temporizadores, animación). */
  fondo: number;
  captura?: string;
}

export interface Flow {
  id: string;
  nombre: string;
  modo: 'manual' | 'guiada';
  cuando: string;
  duracionMs: number;
  pasos: FlowStep[];
}

interface Mark {
  action: AppAction;
  t0: number;
  t1: number;
  ok: boolean;
  refusal?: string;
  error?: string;
  urlBefore: string;
  urlAfter: string;
  listeners: RawListener[];
  screenshot?: string;
}

interface RawListener {
  evento: string;
  nodo: string;
  description: string;
  frame: Frame;
}

interface Active {
  name: string;
  mode: 'manual' | 'guiada';
  t0: number;
  idle: Set<string>;
  evStart: number;
  marks: Mark[];
}

const active = new WeakMap<LiveApp, Active>();

const EVENTS: Record<string, string[]> = {
  click: ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'submit'],
  escribir: ['input', 'keydown', 'keyup', 'keypress', 'change', 'beforeinput'],
  tecla: ['keydown', 'keyup', 'keypress', 'submit', 'change'],
  cambio: ['change', 'input', 'click'],
  envio: ['submit'],
  hover: ['mouseover', 'mouseenter', 'pointerenter', 'pointerover', 'mousemove'],
  scroll: ['scroll', 'wheel', 'scrollend'],
};

function fnName(description: string | undefined): string {
  const d = description ?? '';
  return /^(?:async\s+)?function\s*\*?\s*([\w$]+)/.exec(d)?.[1] ?? /^(?:async\s+)?([\w$]+)\s*\(/.exec(d)?.[1]?.replace(/^(function|if|for|while|switch)$/, '') ?? '';
}

/** Comprueba, antes de una acción guiada, que no cruza los límites éticos. */
export async function guard(page: Page, action: AppAction): Promise<string | null> {
  if (!('selector' in action) || !action.selector) return null;
  const loc = page.locator(action.selector).first();
  if (!(await loc.count())) return null; // el error de «no encontrado» lo da la propia acción
  const info = await loc.evaluate((el) => {
    const form = el.closest('form');
    const control = el.closest('button, a, [role="button"], [role="menuitem"], input[type="submit"], input[type="button"]') ?? el;
    return {
      desc: [el.tagName, el.getAttribute('type'), el.getAttribute('name'), el.id, el.getAttribute('autocomplete'), el.getAttribute('aria-label'), typeof el.className === 'string' ? el.className : ''].filter(Boolean).join(' '),
      label: [control.getAttribute('aria-label'), control.getAttribute('title'), control.getAttribute('value'), (control.textContent ?? '').trim().slice(0, 80), control.getAttribute('name'), control.id].filter(Boolean).join(' '),
      type: (el.getAttribute('type') ?? '').toLowerCase(),
      isSubmit: el.matches('button:not([type="button"]), input[type="submit"]') && !!form,
      formHasPassword: !!form?.querySelector('input[type="password"]'),
      formHasCard: !!form?.querySelector('input[autocomplete^="cc-"], input[name*="card" i], input[name*="cvv" i], input[name*="cvc" i]'),
      inCaptcha: !!el.closest('.g-recaptcha, .h-captcha, [class*="captcha" i], [id*="captcha" i]'),
    };
  });
  if (info.inCaptcha) return 'el elemento pertenece a un CAPTCHA: REA APP no interactúa con protecciones anti-bot';
  if (action.tipo === 'escribir' && (info.type === 'password' || FORBIDDEN_INPUT.test(info.desc))) {
    return 'el campo es de contraseña, pago o verificación: REA APP no escribe credenciales ni datos de pago. Si hace falta, el usuario lo hace a mano en la ventana';
  }
  if (action.tipo === 'click' || action.tipo === 'tecla') {
    if (info.formHasPassword && (info.isSubmit || action.tipo === 'tecla')) return 'el control envía un formulario de inicio de sesión: REA APP no inicia sesión; lo hace el usuario en la ventana';
    if (info.formHasCard && (info.isSubmit || action.tipo === 'tecla')) return 'el control envía un formulario de pago: REA APP no realiza pagos';
    if (action.tipo === 'click' && (FORBIDDEN_CLICK.test(info.label) || FORBIDDEN_OPERATION.test(info.label))) {
      return `el control («${info.label.slice(0, 40)}») puede ejecutar una operación con efectos reales: REA APP no la acciona. Para estudiarla, grábala con app_record mientras el usuario la hace`;
    }
  }
  return null;
}

async function listenersFor(app: LiveApp, selector: string | undefined, types: string[]): Promise<RawListener[]> {
  const out: RawListener[] = [];
  if (!types?.length) return out;
  const cdp: CDPSession = app.cdp;
  const scripts: Map<string, ScriptMeta> = app.scripts;
  let mark = '';
  try {
    if (selector && (await app.page.locator(selector).first().count())) {
      mark = `m${Date.now() % 100000}`;
      await app.page.locator(selector).first().evaluate((el, m) => el.setAttribute('data-rea-objetivo', m), mark);
    }
    const expression = `(() => { const out = []; let el = ${mark ? `document.querySelector('[data-rea-objetivo="${mark}"]')` : 'null'}; while (el) { out.push(el); el = el.parentElement; } out.push(document, window); return out; })()`;
    const { result } = await cdp.send('Runtime.evaluate', { expression, objectGroup: 'rea-app' });
    if (!result.objectId) return out;
    const { result: props } = await cdp.send('Runtime.getProperties', { objectId: result.objectId, ownProperties: true });
    for (const p of props) {
      if (!/^\d+$/.test(p.name) || !p.value?.objectId) continue;
      const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: p.value.objectId, depth: 0 });
      for (const l of listeners) {
        if (!types.includes(l.type)) continue;
        const meta = scripts.get(l.scriptId);
        if (!meta || !/^https?:/.test(meta.url)) continue;
        out.push({ evento: l.type, nodo: p.name === '0' && mark ? 'objetivo' : (p.value.description ?? p.value.className ?? 'nodo'), description: l.handler?.description ?? '', frame: { fn: '', url: meta.url, line: l.lineNumber + 1, column: l.columnNumber + 1 } });
      }
    }
  } catch {
    /* sin acceso a los manejadores */
  } finally {
    await cdp.send('Runtime.releaseObjectGroup', { objectGroup: 'rea-app' }).catch(() => {});
    if (mark) await app.page.locator(`[data-rea-objetivo="${mark}"]`).first().evaluate((el) => el.removeAttribute('data-rea-objetivo')).catch(() => {});
  }
  return out;
}

function describeAction(a: AppAction): string {
  switch (a.tipo) {
    case 'click':
      return `clic en ${a.selector}`;
    case 'escribir':
      return `escribir ${String(a.texto).length} caracteres en ${a.selector}`;
    case 'tecla':
      return `tecla ${a.tecla}${a.selector ? ` en ${a.selector}` : ''}`;
    case 'hover':
      return `pasar el cursor por ${a.selector}`;
    case 'scroll':
      return a.selector ? `desplazar hasta ${a.selector}` : `desplazar ${a.y ?? 800}px`;
    case 'navegar':
      return `navegar a ${a.ruta}`;
    case 'esperar':
      return `esperar ${a.ms} ms`;
  }
}

function describeEvent(e: UserEvent & { times?: number; submits?: boolean }): string {
  const where = `${e.target} (${e.selector})`;
  const tail = e.submits ? ' y enviar el formulario' : '';
  switch (e.kind) {
    case 'click':
      return `clic en ${where}${e.detail ? ` — ${e.detail}` : ''}${tail}`;
    case 'escribir':
      return `escribir ${e.detail ?? ''} en ${where}${tail}`;
    case 'cambio':
      return `cambiar ${e.detail ?? 'valor'} en ${where}${tail}`;
    case 'envio':
      return `enviar el formulario ${e.selector}`;
    case 'tecla':
      return `tecla ${e.detail}${e.times && e.times > 1 ? ` ×${e.times}` : ''} en ${where}${tail}`;
  }
}

/** Funde los gestos elementales en pasos con sentido (una ráfaga de teclas es un solo «escribir»). */
export function mergeEvents(events: UserEvent[]): (UserEvent & { times?: number; submits?: boolean })[] {
  const out: (UserEvent & { times?: number; submits?: boolean; end?: number })[] = [];
  for (const raw of events) {
    const e = { ...raw } as UserEvent & { times?: number; submits?: boolean; end?: number };
    const prev = out[out.length - 1];
    if (prev) {
      const gap = e.t - ((prev as any).end ?? prev.t);
      if (e.kind === 'escribir' && prev.kind === 'escribir' && prev.selector === e.selector && gap < 4000) {
        prev.detail = e.detail;
        (prev as any).end = (e as any).end ?? e.t;
        continue;
      }
      if (e.kind === 'tecla' && prev.kind === 'tecla' && prev.detail === e.detail && prev.selector === e.selector && gap < 1500) {
        prev.times = (prev.times ?? 1) + 1;
        (prev as any).end = e.t;
        continue;
      }
      if (e.kind === 'envio' && gap < 500) {
        prev.submits = true;
        continue;
      }
      if (e.kind === 'cambio' && prev.kind === 'click' && gap < 400) continue;
      if (e.kind === 'click' && prev.kind === 'click' && gap < 60 && /^label/.test(prev.target)) continue; // clic sintético del control asociado a un <label>
    }
    out.push(e);
  }
  return out.slice(0, 80);
}

/** app_record (iniciar): empieza a grabar lo que hace el usuario en la ventana. */
export async function startRecording(app: LiveApp, name: string, mode: 'manual' | 'guiada' = 'manual'): Promise<void> {
  if (active.has(app)) throw new Error('Ya hay una grabación en curso. Deténla con app_record(accion: "detener") antes de empezar otra.');
  const idle = await app.beginCollect();
  active.set(app, { name: name || 'flujo', mode, t0: Date.now(), idle, evStart: app.runtime.userEvents.length, marks: [] });
}

export function isRecording(app: LiveApp): boolean {
  return active.has(app);
}

function emptyDom(): FlowStep['dom'] {
  return { registros: 0, anadidos: [], eliminados: 0, atributos: [], textos: 0 };
}

/** app_record (detener): analiza lo grabado y lo relaciona paso a paso. */
export async function stopRecording(app: LiveApp): Promise<ToolResult<{ flujos: Flow[]; nuevo: Flow }>> {
  const rec = active.get(app);
  if (!rec) throw new Error('No hay ninguna grabación en curso. Empieza con app_record(accion: "iniciar").');
  await app.endCollect();
  active.delete(app);
  const tEnd = Date.now();
  await app.sync();
  const session = app.session;
  // Si durante el flujo se cargó código nuevo (trozos bajo demanda), se recuperan sus fuentes
  // antes de atribuir funciones, para citarlas por su nombre y archivo originales.
  if (session.exists('sources/index.json')) {
    const index = session.readJson<Record<string, unknown>>('sources/index.json');
    if (app.rec.entries.some((e) => e.bodyFile && !e.thirdParty && !(e.url in index))) await scriptsAnalysis(session).catch(() => {});
  }
  const locator = new SourceLocator(session);

  // 1. Pasos: las acciones guiadas tal cual, o los gestos del usuario fundidos.
  type Draft = { t0: number; t1: number; origen: 'usuario' | 'guiada'; gesto: string; selector?: string; kind: string; mark?: Mark };
  let drafts: Draft[];
  if (rec.mode === 'guiada') {
    drafts = rec.marks.map((m) => ({ t0: m.t0, t1: m.t1, origen: 'guiada', gesto: describeAction(m.action), selector: 'selector' in m.action ? m.action.selector : undefined, kind: m.action.tipo, mark: m }));
  } else {
    const events = mergeEvents(app.runtime.userEvents.slice(rec.evStart).filter((e) => e.t >= rec.t0));
    drafts = events.map((e, i) => ({ t0: e.t - 30, t1: Math.min(events[i + 1]?.t ?? tEnd, e.t + 15000) - 31, origen: 'usuario', gesto: describeEvent(e), selector: e.selector.startsWith('(') ? undefined : e.selector, kind: e.kind }));
  }

  const id = `flujo-${String((session.loadResult<{ flujos: Flow[] }>('app_flows')?.data.flujos.length ?? 0) + 1).padStart(2, '0')}`;
  const steps: FlowStep[] = [];
  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    const inWin = (t: number) => t >= d.t0 && t <= d.t1;
    const step: FlowStep = { paso: i + 1, t: d.t0, origen: d.origen, gesto: d.gesto, selector: d.selector, ok: d.mark ? d.mark.ok : true, rutas: [], dom: emptyDom(), peticiones: [], trozos: [], recursos: 0, mensajes: [], manejadores: [], funciones: [], fondo: 0 };
    steps.push(step);
    if (d.mark) {
      step.urlAntes = d.mark.urlBefore;
      step.urlDespues = d.mark.urlAfter;
      step.captura = d.mark.screenshot;
      if (d.mark.refusal) {
        step.rechazada = d.mark.refusal;
        continue;
      }
      if (d.mark.error) step.error = d.mark.error;
    }

    step.rutas = app.runtime.routes.filter((r) => inWin(r.t) && r.kind !== 'carga');

    // Peticiones: las de datos se listan; los recursos estáticos se cuentan.
    app.rec.entries.forEach((e, index) => {
      if (!inWin(e.t)) return;
      const data = e.resourceType === 'xhr' || e.resourceType === 'fetch' || e.resourceType === 'eventsource' || e.resourceType === 'document' || e.method !== 'GET';
      if (data) {
        if (step.peticiones.length < 25) {
          step.peticiones.push({ metodo: e.method, url: e.url, estado: e.status, tipo: e.resourceType, linea: index + 1, iniciador: e.initiator ? (locator.locate(e.initiator, true).original ?? `${e.initiator.fn} en ${e.initiator.url.split('/').pop()}:${e.initiator.line}`) : undefined });
        }
      } else {
        step.recursos++;
        if (e.resourceType === 'script' && step.trozos.length < 12) step.trozos.push(e.url.split('/').pop() ?? e.url);
      }
    });

    // Mensajes de WebSocket que salieron del cliente.
    const sent = new Map<string, number>();
    // Las respuestas al latido (pong) no son consecuencia del gesto: se omiten.
    for (const ws of app.rec.websockets) for (const m of ws.sentLog) if (inWin(m.t) && !HEARTBEAT.test(m.key)) sent.set(m.key, (sent.get(m.key) ?? 0) + 1);
    step.mensajes = [...sent].map(([clave, veces]) => ({ clave, veces })).sort((a, b) => b.veces - a.veces).slice(0, 12);

    // Cambios en el DOM.
    const groups = new Map<string, { donde: string; nodos: string; cantidad: number }>();
    const attrs = new Map<string, { objetivo: string; atributo: string }>();
    for (const m of app.mutations) {
      if (!inWin(m.t)) continue;
      step.dom.registros++;
      if (m.kind === 'added') {
        const key = `${m.parent}|${m.node}`;
        const g = groups.get(key) ?? { donde: m.parent, nodos: m.node, cantidad: 0 };
        g.cantidad++;
        groups.set(key, g);
      } else if (m.kind === 'removed') step.dom.eliminados++;
      else if (m.kind === 'attrs') {
        if (m.attr !== 'data-rea-objetivo') attrs.set(`${m.target}|${m.attr}`, { objetivo: m.target, atributo: m.attr });
      } else step.dom.textos++;
    }
    // Primero los elementos nuevos; los nodos de texto (a menudo refrescos periódicos) al final.
    const isText = (g: { nodos: string }) => Number(g.nodos.startsWith('#texto'));
    step.dom.anadidos = [...groups.values()].sort((a, b) => isText(a) - isText(b) || b.cantidad - a.cantidad).slice(0, 12);
    step.dom.atributos = [...attrs.values()].slice(0, 12);

    // Funciones ejecutadas: se separa lo que también corre en reposo.
    // Cada cubo de cobertura pertenece a un solo paso: el último que había empezado cuando el cubo se cerró
    // (un gesto dispara su código de inmediato, así que lo ejecutado en ese cubo es casi siempre suyo).
    const until = d.origen === 'guiada' ? d.t1 + 450 : (drafts[i + 1]?.t0 ?? Infinity);
    const agg = new Map<string, Executed>();
    for (const b of app.buckets) {
      if (b.t1 <= d.t0 || b.t1 > until) continue;
      for (const fn of b.fns) {
        const prev = agg.get(fn.key);
        if (prev) prev.count += fn.count;
        else agg.set(fn.key, { ...fn });
      }
    }
    const signal = [...agg.values()].filter((fn) => !rec.idle.has(fn.key));
    step.fondo = agg.size - signal.length;
    const described: FlowFunction[] = [];
    for (const fn of signal.slice(0, 40)) {
      const { frame, snippet } = await app.describe(fn);
      const donde = locator.locate(frame);
      described.push({ funcion: donde.originalName ?? frame.fn, llamadas: fn.count, fragmento: snippet, frame, donde });
    }
    step.funciones = described;

    // Manejadores registrados sobre el objetivo y sus ancestros.
    const raw = d.mark ? d.mark.listeners : await listenersFor(app, d.selector, EVENTS[d.kind] ?? []);
    step.manejadores = raw
      .slice(0, 12)
      .map((l) => {
        const frame: Frame = { ...l.frame, url: redactUrl(l.frame.url), fn: fnName(l.description) || '(anónima)' };
        const ran = described.find((x) => x.frame.url === frame.url && x.frame.line === frame.line && Math.abs(x.frame.column - frame.column) <= frame.fn.length + 16);
        const donde = locator.locate(frame);
        return { evento: l.evento, nodo: l.nodo, funcion: donde.originalName ?? (ran && frame.fn === '(anónima)' ? ran.funcion : frame.fn), fragmento: redactCode(l.description.slice(0, 220)).replace(/\s+/g, ' '), ejecutado: !!ran, frame, donde };
      })
      .sort((a, b) => Number(b.ejecutado) - Number(a.ejecutado));
  }

  const flow: Flow = { id, nombre: rec.name, modo: rec.mode, cuando: new Date(rec.t0).toISOString(), duracionMs: tEnd - rec.t0, pasos: steps };
  session.writeJson(`flows/${id}.json`, flow);
  const flows = [...(session.loadResult<{ flujos: Flow[] }>('app_flows')?.data.flujos ?? []), flow];
  const f = buildFindings(flows);
  if (!locator.hasSourceMaps) f.unknown('Sin source maps recuperados (ejecuta app_scripts antes de grabar): las funciones se citan por su posición en el script servido.');
  if (rec.mode === 'manual' && !steps.length) f.unknown(`Flujo «${rec.name}»: no se registró ningún gesto del usuario durante la grabación.`);
  return session.saveResult({ tool: 'app_flows', session: session.dir, findings: f.list, unknowns: f.unknowns, files: [`flows/${id}.json`, ...steps.flatMap((s) => (s.captura ? [s.captura] : []))], data: { flujos: flows, nuevo: flow } });
}

function buildFindings(flows: Flow[]): Findings {
  const f = new Findings('flujo', 'FLU');
  for (const flow of flows) {
    for (const s of flow.pasos) {
      const label = `Flujo «${flow.nombre}», paso ${s.paso} (${s.gesto})`;
      const file = `flows/${flow.id}.json`;
      if (s.rechazada) {
        f.add(`${label}: acción rechazada`, { detail: `Motivo: ${s.rechazada}.`, evidence: [{ file }] });
        f.unknown(`${label}: no se ejecutó por los límites éticos, así que su efecto no se conoce.`);
        continue;
      }
      if (!s.ok) {
        f.add(`${label}: no se pudo ejecutar`, { detail: s.error, confidence: 'baja', evidence: [{ file }] });
        continue;
      }
      const main = s.manejadores.find((h) => h.ejecutado) ?? s.manejadores[0];
      const named = s.funciones.filter((x) => x.funcion !== '(anónima)');
      const dom = s.dom;
      const parts = [
        main ? `Manejador: ${main.donde.original ?? (main.funcion || '(anónima)')} escucha «${main.evento}» en ${main.nodo === 'objetivo' ? 'el propio elemento' : main.nodo}${main.ejecutado ? ', y se ejecutó' : ''}.` : 'No se encontró un manejador registrado directamente sobre el elemento.',
        s.funciones.length ? `Funciones ejecutadas (${s.funciones.length}${s.fondo ? `, más ${s.fondo} de fondo descartadas` : ''}): ${(named.length ? named : s.funciones).slice(0, 10).map((x) => x.donde.original ?? x.funcion).join(', ')}.` : `Ninguna función propia del paso se ejecutó${s.fondo ? ` (solo ${s.fondo} de fondo)` : ''}.`,
        s.peticiones.length ? `Peticiones: ${s.peticiones.slice(0, 6).map((p) => `${p.metodo} ${p.url} → ${p.estado}${p.iniciador ? ` (desde ${p.iniciador})` : ''}`).join('; ')}.` : 'No disparó peticiones de datos.',
        s.mensajes.length ? `Mensajes enviados por WebSocket: ${s.mensajes.map((m) => `${m.clave} ×${m.veces}`).join(', ')}.` : '',
        s.trozos.length ? `Código cargado bajo demanda: ${s.trozos.join(', ')}.` : '',
        s.rutas.length ? `Ruta: ${s.rutas.map((r) => `${r.kind} → ${r.url}`).slice(0, 3).join('; ')}.` : '',
        dom.registros ? `DOM: ${dom.anadidos.map((a) => `+${a.cantidad} ${a.nodos} en ${a.donde}`).slice(0, 5).join('; ') || 'sin nodos nuevos'}; ${dom.eliminados} nodos eliminados; ${dom.atributos.length} atributos cambiados${dom.atributos.length ? ` (${dom.atributos.slice(0, 4).map((a) => `${a.objetivo}@${a.atributo}`).join(', ')})` : ''}; ${dom.textos} cambios de texto.` : 'El DOM no cambió (si la vista usa un lienzo, el cambio no es visible en el DOM).',
      ];
      const evidence: Evidence[] = [
        ...s.manejadores.slice(0, 3).map((h) => ({ file: h.donde.file, line: h.donde.line, note: `manejador de «${h.evento}»: ${h.donde.note ?? ''}` })),
        ...(named.length ? named : s.funciones).slice(0, 5).map((x) => ({ file: x.donde.file, line: x.donde.line, note: `función ejecutada: ${x.donde.note ?? x.funcion}` })),
        ...s.peticiones.slice(0, 4).map((p) => ({ file: 'network/requests.jsonl', line: p.linea, note: `${p.metodo} ${p.url}` })),
        { file },
        ...(s.captura ? [{ file: s.captura }] : []),
      ];
      const who = main?.ejecutado ? main.funcion || '(anónima)' : named[0]?.funcion;
      f.add(`${label}: ${who ? `respondió ${who}` : 'sin función identificada'}; ${s.peticiones.length} peticiones${s.mensajes.length ? `, ${s.mensajes.reduce((n, m) => n + m.veces, 0)} mensajes WebSocket` : ''}; ${dom.registros} cambios en el DOM`, {
        detail: parts.filter(Boolean).join(' '),
        confidence: main?.ejecutado || named.length ? 'alta' : 'media',
        evidence,
      });
      if (!s.manejadores.length && !s.funciones.length) f.unknown(`${label}: no se identificó qué código responde (puede ser comportamiento nativo, CSS o código en un worker).`);
    }
  }
  f.unknown('La cobertura indica qué funciones se ejecutaron en cada paso, no su orden exacto ni los valores que manejaron. El código que corre en workers o WebAssembly no aparece.');
  if (flows.some((x) => x.modo === 'manual')) f.unknown('En los flujos grabados a mano la atribución es por ventanas de tiempo (~0,3 s): los efectos de dos gestos muy seguidos pueden mezclarse.');
  return f;
}

/** app_act: ejecuta acciones guiadas sobre la aplicación abierta y analiza el flujo resultante. */
export async function act(app: LiveApp, actions: AppAction[], name = 'acciones guiadas'): Promise<ToolResult<{ flujos: Flow[]; nuevo: Flow }>> {
  if (!Array.isArray(actions) || !actions.length) throw new Error('app_act necesita al menos una acción.');
  if (actions.length > 25) throw new PolicyError('Máximo 25 acciones por llamada.');
  await startRecording(app, name, 'guiada');
  const rec = active.get(app)!;
  const page = app.page;
  try {
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const mark: Mark = { action, t0: 0, t1: 0, ok: false, urlBefore: app.url(page.url()), urlAfter: '', listeners: [] };
      rec.marks.push(mark);
      const selector = 'selector' in action ? action.selector : undefined;
      mark.refusal = (await guard(page, action).catch(() => null)) ?? undefined;
      if (!mark.refusal && action.tipo === 'navegar') {
        const dest = assertAllowedUrl(new URL(action.ruta, page.url()).toString());
        if (dest.host !== app.target.host) mark.refusal = `solo se navega dentro de ${app.target.host}`;
        else if (app.meta.robots.respected && !(await checkRobots(dest)).allowed) mark.refusal = 'robots.txt excluye esa ruta';
      }
      if (mark.refusal) {
        mark.t0 = mark.t1 = Date.now();
        mark.urlAfter = mark.urlBefore;
        continue;
      }
      mark.listeners = await listenersFor(app, selector, EVENTS[action.tipo] ?? []);
      await limiter.wait(app.target.host);
      await app.pump(); // frontera de cobertura: lo anterior queda fuera del paso
      mark.t0 = Date.now();
      try {
        const loc = selector ? page.locator(selector).first() : null;
        switch (action.tipo) {
          case 'click':
            await loc!.click({ timeout: 6000 });
            break;
          case 'escribir':
            await loc!.fill('', { timeout: 6000 });
            await loc!.pressSequentially(String(action.texto).slice(0, 200), { delay: 25 });
            break;
          case 'tecla':
            if (loc) await loc.press(action.tecla, { timeout: 6000 });
            else await page.keyboard.press(action.tecla);
            break;
          case 'hover':
            await loc!.hover({ timeout: 6000 });
            break;
          case 'scroll':
            if (loc) await loc.scrollIntoViewIfNeeded({ timeout: 6000 });
            else await page.mouse.wheel(0, action.y ?? 800);
            break;
          case 'navegar':
            await page.goto(new URL(action.ruta, page.url()).toString(), { waitUntil: 'load', timeout: 30000 });
            break;
          case 'esperar':
            await page.waitForTimeout(Math.min(Math.max(0, action.ms), 10000));
            break;
        }
        mark.ok = true;
      } catch (e) {
        mark.error = String((e as Error).message).split('\n')[0];
      }
      await page.waitForTimeout(450);
      await page.waitForLoadState('networkidle', { timeout: 3500 }).catch(() => {});
      await app.rec.settle();
      await app.pump();
      mark.t1 = Date.now();
      mark.urlAfter = app.url(page.url());
      mark.screenshot = await app.screenshot(`screenshots/flujo-${Date.now() % 1000000}-paso-${i + 1}.png`);
    }
  } catch (e) {
    await app.endCollect().catch(() => {});
    active.delete(app);
    throw e;
  }
  return stopRecording(app);
}
