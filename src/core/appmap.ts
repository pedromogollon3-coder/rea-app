/**
 * Análisis propios de una aplicación web (sin conexión, sobre lo registrado en la sesión):
 * rutas y vistas, tiempo real, estado, entorno de ejecución y autenticación.
 */
import type { CaptureMeta, Evidence, NetEntry, RuntimeLog, ToolResult, WsGroup, WsRecord } from './types.js';
import type { StateSnapshot } from './app-scripts.js';
import type { ViewInfo } from './live.js';
import { Findings, Session } from './session.js';
import { listFiles } from './scripts.js';
import { templatePath } from './network.js';
import { HEARTBEAT } from './wsproto.js';

const REQ = 'network/requests.jsonl';
const HOOKS = 'runtime/hooks.json';

function load(session: Session) {
  return {
    meta: session.readJson<CaptureMeta>('capture.json'),
    entries: session.readJsonl<NetEntry>(REQ),
    runtime: (session.exists(HOOKS) ? session.readJson(HOOKS) : { routes: [], wasm: [], workers: [], canvas: [], eventSources: [], sse: {}, apis: {} }) as RuntimeLog,
    views: (session.exists('views/index.json') ? session.readJson('views/index.json') : []) as ViewInfo[],
    websockets: (session.exists('network/websockets.json') ? session.readJson('network/websockets.json') : []) as WsRecord[],
  };
}

const size = (bytes: number) => (bytes < 2048 ? `${bytes} bytes` : `${Math.round(bytes / 1024)} KB`);

const pathOf = (url: string) => {
  try {
    const u = new URL(url);
    return u.pathname + u.hash;
  } catch {
    return url;
  }
};

/** Archivos de código legible de la sesión: fuentes recuperadas, embellecidos y scripts sin minificar. */
function readableSources(session: Session): string[] {
  if (!session.exists('sources/index.json')) return [];
  const index = session.readJson<Record<string, { raw: string; dir?: string; readable: string }>>('sources/index.json');
  const out: string[] = [];
  for (const info of Object.values(index)) {
    if (info.dir) out.push(...listFiles(session, info.dir).slice(0, 400));
    else out.push(info.readable);
  }
  return [...new Set(out)].slice(0, 1200);
}

export interface RoutesData {
  enrutador: string;
  visitadas: { ruta: string; veces: number; via: string[] }[];
  declaradas: { ruta: string; archivo: string; linea: number }[];
  vistas: ViewInfo[];
  cargaDiferida: { ruta: string; scripts: string[] }[];
}

/** app_routes: rutas visitadas, tipo de enrutador, rutas declaradas en el código y carga diferida. */
export function routesAnalysis(session: Session): ToolResult<RoutesData> {
  const { entries, runtime, views } = load(session);
  const f = new Findings('rutas', 'RUT');

  const visited = new Map<string, { ruta: string; veces: number; via: Set<string> }>();
  for (const r of runtime.routes) {
    const ruta = templatePath(pathOf(r.url).replace(/\?.*$/, ''));
    const v = visited.get(ruta) ?? { ruta, veces: 0, via: new Set<string>() };
    v.veces++;
    v.via.add(r.kind);
    visited.set(ruta, v);
  }
  const visitadas = [...visited.values()].map((v) => ({ ruta: v.ruta, veces: v.veces, via: [...v.via] }));
  const kinds = new Set(runtime.routes.map((r) => r.kind));
  const docs = entries.filter((e) => e.resourceType === 'document' && !e.thirdParty && e.status < 400).length;
  const spa = kinds.has('pushState') || kinds.has('replaceState') || kinds.has('popstate');
  const hash = kinds.has('hashchange');
  const enrutador = spa ? 'History API (pushState): navegación sin recargar la página' : hash ? 'hash (#/ruta): navegación sin recargar la página' : docs > 1 ? 'navegación clásica: cada vista es un documento nuevo' : 'no determinado: solo se ha visto una ruta';
  f.add(`Enrutado: ${enrutador}`, {
    detail: `${visitadas.length} ruta(s) distintas visitadas; ${docs} documento(s) HTML cargados. ${visitadas.slice(0, 15).map((v) => `${v.ruta} (${v.via.join('/')})`).join(', ')}`,
    confidence: spa || hash || docs > 1 ? 'alta' : 'baja',
    evidence: [{ file: HOOKS }, { file: REQ }],
  });

  if (views.length) {
    f.add(`${views.length} vista(s) registradas`, {
      detail: views.map((v) => `${v.n}. ${v.name} → ${v.route} (${v.elements} elementos, ${v.forms} formularios, ${v.canvases} lienzos${v.private ? ', privada' : ''})`).join('; '),
      evidence: views.slice(0, 6).map((v) => ({ file: `${v.dir}/dom.json`, note: v.route })),
    });
  }

  // Rutas declaradas en el código legible.
  const declared = new Map<string, { ruta: string; archivo: string; linea: number }>();
  const patterns = [/\b\w*(?:[Rr]oute|[Rr]uta|[Pp]ath)\w*\(\s*["'`](\/[\w/:.*-]*)["'`]/g, /\bpath\s*:\s*["'`](\/[^"'`\s]*)["'`]/g,/<Route[^>]*\spath=["'{]+(\/[^"'}\s]*)/g, /\b(?:navigate|navegar|push|replace|redirect|goto)\(\s*["'`](\/[\w/:.-]*)["'`]/g, /\bto\s*[:=]\s*["'`{]+(\/[\w/:.-]*)["'`]/g];
  for (const file of readableSources(session)) {
    if (declared.size >= 120) break;
    const lines = session.read(file).split('\n');
    for (let i = 0; i < lines.length && declared.size < 120; i++) {
      if (lines[i].length > 600) continue;
      for (const re of patterns) {
        re.lastIndex = 0;
        let m: RegExpExecArray | null;
        // Se descartan los prefijos que se concatenan con algo más («/mercado/» + símbolo) y los archivos.
        while ((m = re.exec(lines[i]))) if (m[1].length > 1 && !m[1].endsWith('/') && !/\.(js|css|png|svg|json|ico|wasm)$/.test(m[1]) && !declared.has(m[1])) declared.set(m[1], { ruta: m[1], archivo: file, linea: i + 1 });
      }
    }
  }
  const declaradas = [...declared.values()];
  if (declaradas.length) {
    // «/mercado/:simbolo» se considera visitada si alguna ruta real encaja en el patrón.
    const seenPaths = runtime.routes.map((r) => pathOf(r.url).replace(/[?#].*$/, ''));
    const matches = (pattern: string) => {
      const re = new RegExp('^' + pattern.split(/(:\w+|\*)/).map((part) => (part.startsWith(':') ? '[^/]+' : part === '*' ? '.*' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('') + '/?$');
      return seenPaths.some((p) => re.test(p));
    };
    const unseen = declaradas.filter((d) => !matches(d.ruta));
    f.add(`${declaradas.length} ruta(s) declaradas en el código`, {
      detail: `${declaradas.slice(0, 30).map((d) => d.ruta).join(', ')}.${unseen.length ? ` No visitadas todavía: ${unseen.slice(0, 15).map((d) => d.ruta).join(', ')}.` : ''}`,
      confidence: 'media',
      evidence: declaradas.slice(0, 8).map((d) => ({ file: d.archivo, line: d.linea, note: d.ruta })),
    });
    if (unseen.length) f.unknown(`${unseen.length} ruta(s) aparecen en el código pero no se visitaron: su vista y sus datos no están analizados.`);
  } else {
    f.unknown('No se encontraron rutas declaradas en el código legible (ejecuta app_scripts, o el enrutador las define de otra forma).');
  }

  // Scripts que se cargaron después del arranque, por ruta.
  const firstNav = runtime.routes.find((r) => r.kind !== 'carga')?.t ?? Infinity;
  const lazy = new Map<string, Set<string>>();
  const lazyEv: Evidence[] = [];
  entries.forEach((e, i) => {
    if (e.resourceType !== 'script' || e.thirdParty || e.t < firstNav) return;
    const set = lazy.get(e.from) ?? new Set<string>();
    set.add(e.url.split('/').pop() ?? e.url);
    lazy.set(e.from, set);
    if (lazyEv.length < 6) lazyEv.push({ file: REQ, line: i + 1, note: `cargado desde ${e.from}` });
  });
  const cargaDiferida = [...lazy].map(([ruta, s]) => ({ ruta, scripts: [...s] }));
  if (cargaDiferida.length) {
    f.add(`Carga diferida de código en ${cargaDiferida.length} ruta(s)`, {
      detail: cargaDiferida.map((c) => `${c.ruta}: ${c.scripts.join(', ')}`).join('; '),
      evidence: lazyEv,
    });
  }
  f.unknown('Las rutas que exigen permisos, parámetros concretos o datos que esta cuenta no tiene pueden existir sin haberse visto.');
  return session.saveResult({ tool: 'app_routes', session: session.dir, findings: f.list, unknowns: f.unknowns, files: [HOOKS, 'views/index.json'], data: { enrutador, visitadas, declaradas, vistas: views, cargaDiferida } });
}

export interface RealtimeData {
  websockets: (Omit<WsRecord, 'sentLog'> & { duracionS: number; latido?: string })[];
  sse: { urls: string[]; eventos: Record<string, number> };
  sondeo: { endpoint: string; llamadas: number; cadaS: number }[];
}

const rate = (g: WsGroup) => {
  const span = (g.last - g.first) / 1000;
  return g.count > 2 && span > 0.5 ? `${(g.count / span).toFixed(1)}/s` : `${g.count}`;
};

/** app_realtime: protocolo de los WebSockets, Server-Sent Events y sondeo periódico. */
export function realtimeAnalysis(session: Session): ToolResult<RealtimeData> {
  const { entries, runtime, websockets } = load(session);
  const f = new Findings('tiemporeal', 'TRE');
  const WS = 'network/websockets.json';
  const now = Date.now();

  const wsData: RealtimeData['websockets'] = [];
  for (const ws of websockets) {
    const { sentLog: _log, ...rest } = ws;
    const duracionS = Math.round(((ws.closed ?? now) - ws.opened) / 1000);
    const beats = ws.groups.filter((g) => HEARTBEAT.test(g.key));
    const beat = beats[0];
    const latido = beat && beat.count > 1 ? `${beat.key} cada ~${((beat.last - beat.first) / 1000 / (beat.count - 1)).toFixed(1)} s` : beat ? beat.key : undefined;
    wsData.push({ ...rest, duracionS, latido });
    const top = (dir: 'enviado' | 'recibido') =>
      ws.groups
        .filter((g) => g.dir === dir && !HEARTBEAT.test(g.key))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    f.add(`WebSocket ${ws.url}: entramado ${ws.protocol || 'desconocido'}, ${ws.sent} mensajes enviados y ${ws.received} recibidos en ${duracionS} s`, {
      detail: [
        `Tipos que envía el cliente: ${top('enviado').map((g) => `${g.key} (${g.count})`).join(', ') || 'ninguno'}.`,
        `Tipos que envía el servidor: ${top('recibido').map((g) => `${g.key} (${rate(g)})`).join(', ') || 'ninguno'}.`,
        latido ? `Latido: ${latido}.` : 'No se identificó latido (ping/pong) a nivel de aplicación.',
        ws.closed ? 'La conexión se cerró durante la sesión.' : 'La conexión seguía abierta.',
      ].join(' '),
      evidence: [{ file: WS }],
    });
    for (const g of [...top('recibido').slice(0, 5), ...top('enviado').slice(0, 5)]) {
      f.add(`Mensaje ${g.dir} «${g.key}»: ${g.count} veces${g.dir === 'recibido' && g.count > 2 ? ` (${rate(g)})` : ''}`, {
        detail: `Forma: ${g.shape}. Tamaño medio ${Math.round(g.bytes / g.count)} bytes.`,
        evidence: [{ file: WS }],
      });
    }
    if (ws.protocol === 'binario') f.unknown(`El WebSocket ${ws.url} usa mensajes binarios (protobuf, MessagePack u otro formato): solo se conocen tamaños y frecuencias, no el contenido.`);
  }

  const esUrls = [...new Set([...runtime.eventSources.map((e) => e.url), ...entries.filter((e) => e.resourceType === 'eventsource' || /event-stream/.test(e.mime)).map((e) => e.url)])];
  if (esUrls.length) {
    f.add(`Server-Sent Events: ${esUrls.length} flujo(s)`, {
      detail: `${esUrls.join(', ')}. Eventos recibidos por tipo: ${Object.entries(runtime.sse).map(([k, v]) => `${k} (${v})`).join(', ') || 'ninguno registrado'}.`,
      evidence: [{ file: HOOKS }, { file: REQ }],
    });
  }

  // Sondeo: el mismo endpoint llamado repetidamente a intervalos regulares.
  const calls = new Map<string, { times: number[]; line: number }>();
  entries.forEach((e, i) => {
    if (e.resourceType !== 'xhr' && e.resourceType !== 'fetch') return;
    try {
      const u = new URL(e.url);
      const key = `${e.method} ${u.origin}${templatePath(u.pathname)}`;
      const c = calls.get(key) ?? { times: [], line: i + 1 };
      c.times.push(e.t);
      calls.set(key, c);
    } catch {
      /* ignorar */
    }
  });
  const sondeo: RealtimeData['sondeo'] = [];
  for (const [endpoint, c] of calls) {
    if (c.times.length < 4) continue;
    const gaps = c.times.slice(1).map((t, i) => t - c.times[i]);
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const dev = Math.sqrt(gaps.reduce((a, b) => a + (b - mean) ** 2, 0) / gaps.length);
    if (mean > 400 && dev / mean < 0.35) {
      sondeo.push({ endpoint, llamadas: c.times.length, cadaS: Math.round(mean / 100) / 10 });
      f.add(`Sondeo periódico: ${endpoint} cada ~${(mean / 1000).toFixed(1)} s`, { detail: `${c.times.length} llamadas a intervalos regulares.`, confidence: 'media', evidence: [{ file: REQ, line: c.line }] });
    }
  }

  if (!websockets.length && !esUrls.length && !sondeo.length) {
    f.add('Sin canales en tiempo real observados (ni WebSocket, ni SSE, ni sondeo)', { evidence: [{ file: WS }, { file: REQ }] });
  }
  f.unknown('Solo se ven los tipos de mensaje que circularon durante la sesión; el protocolo puede tener más. El significado de cada campo se infiere de su nombre y forma.');
  if (runtime.apis?.RTCPeerConnection) f.unknown('La aplicación abre conexiones WebRTC, cuyo tráfico no pasa por el registro de red.');
  return session.saveResult({ tool: 'app_realtime', session: session.dir, findings: f.list, unknowns: f.unknowns, files: [WS], data: { websockets: wsData, sse: { urls: esUrls, eventos: runtime.sse ?? {} }, sondeo } });
}

/** app_state: almacenes de estado y objetos globales de la aplicación (solo su forma). */
export function stateAnalysis(session: Session): ToolResult<StateSnapshot> {
  const FILE = 'state/snapshot.json';
  const s = session.exists(FILE) ? session.readJson<StateSnapshot>(FILE) : { stores: [], globals: [], hints: [] };
  const f = new Findings('estado', 'EST');
  const ev = [{ file: FILE }];
  const flat = (shape: any) => JSON.stringify(shape).replace(/"/g, '').slice(0, 700);

  for (const st of s.stores) {
    const keys = st.shape && typeof st.shape === 'object' && !Array.isArray(st.shape) ? Object.keys(st.shape) : [];
    f.add(`Almacén de estado ${st.kind} (${st.via})${keys.length ? `: ${keys.length} secciones` : ''}`, {
      detail: `${keys.length ? `Secciones: ${keys.join(', ')}. ` : ''}Forma: ${flat(st.shape)}${st.note ? `. ${st.note}` : ''}`,
      evidence: ev,
    });
  }
  if (!s.stores.length) {
    f.unknown('No se localizó un almacén de estado accesible (Redux, Pinia, Vuex, Apollo, TanStack Query). El estado puede vivir en componentes, en cierres (Zustand, signals) o en servicios, que no se pueden inspeccionar desde fuera.');
  }
  const objects = s.globals.filter((g) => g.type === 'objeto' || g.type === 'arreglo');
  if (s.globals.length) {
    f.add(`${s.globals.length} globales añadidos a window por la aplicación`, {
      detail: `Objetos: ${objects.slice(0, 25).map((g) => g.name).join(', ') || 'ninguno'}. Funciones y valores: ${s.globals.filter((g) => !objects.includes(g)).slice(0, 25).map((g) => g.name).join(', ') || 'ninguno'}.`,
      evidence: ev,
    });
  }
  const config = objects.filter((g) => /config|settings|env|initial|state|data|bootstrap|flags?|features?|props|context/i.test(g.name));
  for (const g of config.slice(0, 6)) {
    f.add(`Configuración o estado inicial en window.${g.name}`, { detail: `Forma: ${flat(g.shape)}`, confidence: 'media', evidence: ev });
  }
  const flags = objects.filter((g) => /flag|feature|toggle|experiment|ab[-_]?test/i.test(g.name + JSON.stringify(g.shape).slice(0, 2000)));
  if (flags.length) f.add(`Indicios de «feature flags» o experimentos: ${flags.map((g) => g.name).join(', ')}`, { confidence: 'baja', evidence: ev });
  if (s.hints.length) f.add(`Otras señales de gestión de estado: ${s.hints.join(', ')}`, { confidence: 'media', evidence: ev });
  f.unknown('Se registra la forma del estado (claves y tipos) en el momento de la última vista, nunca sus valores ni cómo cambia con el tiempo.');
  return session.saveResult({ tool: 'app_state', session: session.dir, findings: f.list, unknowns: f.unknowns, files: [FILE], data: s });
}

export interface RuntimeData {
  lienzos: { contexto: string; cantidad: number; mayor: string; selectores: string[] }[];
  wasm: { via: string; bytes: number; exports: number; imports: number; muestra: string[] }[];
  workers: { tipo: string; url: string }[];
  apis: Record<string, number>;
  renderizado: string;
}

/** app_runtime: cómo dibuja y dónde calcula la aplicación (lienzos, WebGL, WebAssembly, workers). */
export function runtimeAnalysis(session: Session): ToolResult<RuntimeData> {
  const { entries, runtime, views } = load(session);
  const f = new Findings('runtime', 'RUN');
  const ev = [{ file: HOOKS }];

  const byCtx = new Map<string, { n: number; w: number; h: number; sel: Set<string> }>();
  for (const c of runtime.canvas) {
    const g = byCtx.get(c.context) ?? { n: 0, w: 0, h: 0, sel: new Set<string>() };
    g.n++;
    if (c.width * c.height > g.w * g.h) {
      g.w = c.width;
      g.h = c.height;
    }
    g.sel.add(c.selector);
    byCtx.set(c.context, g);
  }
  const lienzos = [...byCtx].map(([contexto, g]) => ({ contexto, cantidad: g.n, mayor: `${g.w}×${g.h}`, selectores: [...g.sel].slice(0, 5) }));
  const gpu = lienzos.some((l) => /webgl|webgpu/.test(l.contexto));
  const bigCanvas = runtime.canvas.some((c) => c.width * c.height >= 300 * 200);
  // Lienzo dominante: algún lienzo ocupa más de la mitad de la ventana (1366×900).
  const canvasOnly = runtime.canvas.some((c) => c.width * c.height >= 0.55 * 1366 * 900);
  let renderizado = 'DOM: la interfaz son elementos HTML';
  if (bigCanvas && canvasOnly) renderizado = `lienzo (${gpu ? 'WebGL/WebGPU' : '2D'}): casi toda la interfaz se dibuja en <canvas>`;
  else if (bigCanvas) renderizado = `mixto: interfaz en DOM y zonas dibujadas en <canvas> (${gpu ? 'WebGL/WebGPU' : '2D'})`;
  f.add(`Renderizado: ${renderizado}`, {
    detail: lienzos.length ? `Contextos de dibujo: ${lienzos.map((l) => `${l.cantidad} × ${l.contexto} (mayor ${l.mayor}; ${l.selectores.join(', ')})`).join('; ')}.` : 'La aplicación no ha pedido ningún contexto de <canvas>.',
    evidence: ev,
  });
  if (bigCanvas) f.unknown('Lo que se dibuja dentro de un <canvas> no existe en el DOM: no hay elementos que inspeccionar ni selectores para accionarlo; solo se ve qué código y qué datos lo alimentan.');

  const wasmReq = entries.map((e, i) => ({ e, line: i + 1 })).filter((x) => /wasm/.test(x.e.mime) || /\.wasm(\?|$)/.test(x.e.url));
  const wasm = runtime.wasm.map((m) => ({ via: m.via, bytes: m.bytes, exports: m.exports.length, imports: m.imports.length, muestra: m.exports.slice(0, 25) }));
  if (runtime.wasm.length || wasmReq.length) {
    f.add(`WebAssembly: ${runtime.wasm.length} módulo(s) instanciados${wasmReq.length ? `, ${wasmReq.length} archivo(s) .wasm descargados (${size(wasmReq.reduce((s, x) => s + x.e.size, 0))})` : ''}`, {
      detail: runtime.wasm.map((m, i) => `Módulo ${i + 1} (${m.via}${m.bytes ? `, ${m.bytes} bytes` : ''}): exporta ${m.exports.slice(0, 20).join(', ')}${m.exports.length > 20 ? '…' : ''}; importa ${m.imports.slice(0, 12).join(', ') || 'nada'}.`).join(' ') || 'Descargado pero no se observó su instanciación.',
      evidence: [...ev, ...wasmReq.slice(0, 3).map((x) => ({ file: REQ, line: x.line, note: x.e.url }))],
    });
    f.unknown('El código dentro de WebAssembly no se analiza: solo se conoce su interfaz (qué importa y qué exporta).');
  }

  const workers = runtime.workers.map((wk) => ({ tipo: wk.kind, url: wk.url }));
  if (workers.length) {
    f.add(`${workers.length} worker(s): ${[...new Set(workers.map((wk) => wk.tipo))].join(', ')}`, {
      detail: workers.slice(0, 12).map((wk) => `${wk.tipo} ${wk.url}`).join('; '),
      evidence: ev,
    });
    f.unknown('El código que corre en workers queda fuera de la cobertura de funciones y de la instrumentación de la página.');
  }
  const others = Object.entries(runtime.apis ?? {}).filter(([k]) => !/^(Worker|SharedWorker|EventSource|serviceWorker)/.test(k));
  if (others.length) f.add(`Otras API de plataforma usadas: ${others.map(([k, v]) => `${k} (${v})`).join(', ')}`, { evidence: ev });
  if (!lienzos.length && !runtime.wasm.length && !workers.length) f.add('Sin lienzos, WebAssembly ni workers: toda la lógica corre en el hilo principal sobre el DOM', { evidence: ev });
  return session.saveResult({ tool: 'app_runtime', session: session.dir, findings: f.list, unknowns: f.unknowns, files: [HOOKS], data: { lienzos, wasm, workers, apis: runtime.apis ?? {}, renderizado } });
}

export interface AuthData {
  estado: { sesionIniciada: boolean; barreras: string[]; privado: boolean };
  esquemas: { mecanismo: string; peticiones: number }[];
  endpoints: { metodo: string; ruta: string; estados: number[]; estableceCookies: string[]; linea: number }[];
  proveedores: string[];
  almacenado: { donde: string; clave: string; tipo: string }[];
}

const AUTH_PATH = /(^|[/._-])(login|logout|signin|sign-in|signout|session|sessions|auth|oauth2?|authorize|token|refresh|sso|saml|mfa|2fa|otp|verify|challenge|password|me|whoami|userinfo|csrf)([/._-]|$)/i;
const IDP = /auth0\.com|okta\.com|accounts\.google\.com|login\.microsoftonline\.com|cognito|firebaseapp\.com|identitytoolkit|clerk\.|keycloak|onelogin|pingidentity|appleid\.apple\.com|facebook\.com\/.*oauth/i;

/** app_auth: cómo se autentica la aplicación, descrito sin secretos. */
export function authAnalysis(session: Session): ToolResult<AuthData> {
  const { meta, entries, views } = load(session);
  const f = new Findings('auth', 'AUT');
  const storage = session.exists('storage/snapshot.json') ? session.readJson('storage/snapshot.json') : { cookies: [], localStorage: [], sessionStorage: [] };

  f.add(meta.authenticated ? 'Sesión iniciada por el usuario durante el análisis' : meta.barriers.includes('formulario de inicio de sesión') ? 'La aplicación muestra un formulario de inicio de sesión (sin sesión iniciada)' : 'No se vio ningún formulario de inicio de sesión', {
    detail: `Modo privado: ${meta.private ? 'activado (sin capturas, texto del HTML oculto, dígitos enmascarados)' : 'no'}. REA APP nunca introduce credenciales: si hay sesión, la abrió el usuario en la ventana.`,
    evidence: [{ file: 'capture.json' }],
  });

  // Formularios de acceso vistos en las vistas registradas.
  for (const v of views) {
    const dom = session.exists(`${v.dir}/dom.json`) ? session.readJson(`${v.dir}/dom.json`) : null;
    const form = dom?.forms?.find((fm: any) => fm.fields.some((x: any) => x.type === 'password'));
    if (form) {
      f.add(`Formulario de acceso en ${v.route}: ${form.method.toUpperCase()} ${form.action || '(gestionado por JavaScript)'}`, {
        detail: `Campos: ${form.fields.map((x: any) => `${x.name ?? x.id ?? x.tag}:${x.type}`).join(', ')}.`,
        evidence: [{ file: `${v.dir}/dom.json`, note: form.selector }],
      });
    }
  }

  // Cómo se autentican las peticiones a la API propia.
  const own = entries.map((e, i) => ({ e, line: i + 1 })).filter((x) => !x.e.thirdParty && (x.e.resourceType === 'xhr' || x.e.resourceType === 'fetch'));
  const schemes = new Map<string, { n: number; line: number }>();
  for (const { e, line } of own) for (const a of e.auth ?? []) schemes.set(a, { n: (schemes.get(a)?.n ?? 0) + 1, line: schemes.get(a)?.line ?? line });
  const esquemas = [...schemes].map(([mecanismo, s]) => ({ mecanismo, peticiones: s.n })).sort((a, b) => b.peticiones - a.peticiones);
  if (esquemas.length) {
    const none = own.filter((x) => !(x.e.auth ?? []).length).length;
    f.add(`Las llamadas a la API se autentican con: ${esquemas.map((s) => `${s.mecanismo} (${s.peticiones})`).join(', ')}`, {
      detail: `${own.length} llamadas a la API propia; ${none} sin ningún mecanismo de autenticación visible.`,
      evidence: [...new Set([...schemes.values()].map((s) => s.line))].slice(0, 5).map((line) => ({ file: REQ, line })),
    });
  } else if (own.length) {
    f.add(`Las ${own.length} llamadas a la API propia no llevan credenciales visibles`, { evidence: [{ file: REQ }] });
  }

  // Endpoints relacionados con la sesión.
  const eps = new Map<string, AuthData['endpoints'][number]>();
  entries.forEach((e, i) => {
    if (e.thirdParty || e.resourceType === 'script' || e.resourceType === 'stylesheet' || e.resourceType === 'image') return;
    let u: URL;
    try {
      u = new URL(e.url);
    } catch {
      return;
    }
    const cookies = (e.resHeaders['set-cookie'] ?? '').split('\n').map((c) => c.split('=')[0].trim()).filter(Boolean);
    if (!AUTH_PATH.test(u.pathname) && !cookies.length && e.status !== 401 && e.status !== 403) return;
    const key = `${e.method} ${templatePath(u.pathname)}`;
    const ep = eps.get(key) ?? { metodo: e.method, ruta: templatePath(u.pathname), estados: [], estableceCookies: [], linea: i + 1 };
    if (!ep.estados.includes(e.status)) ep.estados.push(e.status);
    for (const c of cookies) if (!ep.estableceCookies.includes(c)) ep.estableceCookies.push(c);
    eps.set(key, ep);
  });
  const endpoints = [...eps.values()];
  for (const ep of endpoints.slice(0, 12)) {
    f.add(`Endpoint de sesión ${ep.metodo} ${ep.ruta} → ${ep.estados.join('/')}`, {
      detail: [ep.estableceCookies.length ? `Establece cookies: ${ep.estableceCookies.join(', ')}.` : '', ep.estados.some((s) => s === 401 || s === 403) ? 'Respondió 401/403: exige una sesión válida.' : ''].filter(Boolean).join(' ') || 'Ruta con nombre propio de autenticación.',
      confidence: AUTH_PATH.test(ep.ruta) ? 'alta' : 'media',
      evidence: [{ file: REQ, line: ep.linea }],
    });
  }

  const proveedores = [...new Set(entries.filter((e) => IDP.test(e.url)).map((e) => new URL(e.url).host))];
  if (proveedores.length) f.add(`Proveedor de identidad externo: ${proveedores.join(', ')}`, { detail: 'El inicio de sesión se delega (OAuth/OIDC/SAML) en un tercero.', evidence: [{ file: REQ }] });

  const almacenado: AuthData['almacenado'] = [
    ...storage.cookies.filter((c: any) => c.sensible).map((c: any) => ({ donde: `cookie${c.httpOnly ? ' HttpOnly' : ' legible por JS'}${c.secure ? ' Secure' : ''} SameSite=${c.sameSite}`, clave: c.nombre, tipo: c.tipo })),
    ...storage.localStorage.filter((e: any) => e.sensible).map((e: any) => ({ donde: 'localStorage', clave: e.clave, tipo: e.tipo })),
    ...storage.sessionStorage.filter((e: any) => e.sensible).map((e: any) => ({ donde: 'sessionStorage', clave: e.clave, tipo: e.tipo })),
  ];
  if (almacenado.length) {
    const js = almacenado.filter((a) => !a.donde.includes('HttpOnly'));
    f.add(`Credenciales de sesión guardadas en el navegador: ${almacenado.map((a) => `${a.clave} (${a.donde}, ${a.tipo})`).join('; ')}`, {
      detail: js.length ? `${js.length} son legibles por JavaScript (${js.map((a) => a.clave).join(', ')}): cualquier script de la página puede leerlas.` : 'Todas están en cookies HttpOnly: JavaScript no puede leerlas.',
      evidence: [{ file: 'storage/snapshot.json' }],
    });
  }
  const csrf = esquemas.filter((s) => /CSRF/.test(s.mecanismo));
  if (csrf.length) f.add(`Protección anti-CSRF por cabecera: ${csrf.map((s) => s.mecanismo.replace('cabecera anti-CSRF ', '')).join(', ')}`, { evidence: [{ file: REQ }] });

  f.unknown('No se conoce la duración de la sesión, la política de renovación ni las comprobaciones del servidor: solo lo que se vio en esta visita.');
  if (!meta.authenticated) f.unknown('Sin sesión iniciada no se puede describir cómo se autentican las llamadas de la zona privada.');
  f.unknown('Los valores de tokens y cookies no se registran en ningún momento; solo sus nombres, tipo y ubicación.');
  return session.saveResult({ tool: 'app_auth', session: session.dir, findings: f.list, unknowns: f.unknowns, files: [REQ, 'storage/snapshot.json'], data: { estado: { sesionIniciada: meta.authenticated, barreras: meta.barriers, privado: meta.private }, esquemas, endpoints, proveedores, almacenado } });
}
