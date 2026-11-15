import type { Browser, BrowserContext, CDPSession, Page } from 'playwright';
import type { CaptureMeta, Frame, OpenOptions, RuntimeLog, ToolResult } from './types.js';
import { VERSION } from './types.js';
import { assertAllowedUrl, checkRobots, limiter, PolicyError } from './policy.js';
import { Findings, Session, slug } from './session.js';
import { launchBrowser, newContext } from './browser.js';
import { NetworkRecorder } from './recorder.js';
import { collectDom, collectProbes, collectStorage, detectBarriers, installMutationLog, readMutationLog } from './page-scripts.js';
import { collectState, drainAppHooks, installAppHooks, serializeMasked } from './app-scripts.js';
import { classifyValue, maskDigits, privatizeUrl, redactCode, redactHar, redactHtml, redactUrl, SENSITIVE_NAME } from './redact.js';

export interface ViewInfo {
  n: number;
  name: string;
  t: number;
  url: string;
  route: string;
  title: string;
  elements: number;
  forms: number;
  buttons: number;
  canvases: number;
  private: boolean;
  dir: string;
  screenshot?: string;
}

export interface ScriptMeta {
  url: string;
  startLine: number;
  startColumn: number;
}

/** Función ejecutada, identificada por script y posición. */
export interface Executed {
  key: string;
  scriptId: string;
  name: string;
  count: number;
  startOffset: number;
  endOffset: number;
}

export interface Bucket {
  t0: number;
  t1: number;
  fns: Executed[];
}

const LOGIN = 'formulario de inicio de sesión';
const emptyRuntime = (): RuntimeLog => ({ routes: [], wasm: [], workers: [], canvas: [], eventSources: [], sse: {}, apis: {}, userEvents: [] });

function describeEntry(key: string, value: string) {
  return { clave: key, tipo: classifyValue(value), longitud: value.length, sensible: SENSITIVE_NAME.test(key) || classifyValue(value) === 'jwt' };
}

/** Aplica maskDigits a los textos visibles recogidos del DOM (modo privado). */
function maskTexts(node: any): any {
  if (Array.isArray(node)) return node.map(maskTexts);
  if (node && typeof node === 'object') {
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (typeof v === 'string' && /^(text|label|title|description|open)$/.test(k)) node[k] = maskDigits(v);
      else if (k === 'submit' && Array.isArray(v)) node[k] = v.map((s) => maskDigits(String(s)));
      else if (v && typeof v === 'object') maskTexts(v);
    }
  }
  return node;
}

/**
 * Sesión viva: un navegador que permanece abierto mientras se analiza la aplicación.
 * El usuario puede iniciar sesión y usarla a mano; el motor solo observa.
 */
export class LiveApp {
  static current: LiveApp | null = null;

  readonly runtime: RuntimeLog = emptyRuntime();
  readonly views: ViewInfo[] = [];
  readonly scripts = new Map<string, ScriptMeta>();
  /** Registro de mutaciones del DOM y cubos de cobertura; solo se llenan mientras se graba. */
  mutations: any[] = [];
  buckets: Bucket[] = [];
  collecting = false;
  closed = false;
  meta!: CaptureMeta;
  rec!: NetworkRecorder;
  cdp!: CDPSession;
  page!: Page;
  private context!: BrowserContext;
  private browser!: Browser;
  private sawLogin = false;
  private sticky = false;
  private timer: NodeJS.Timeout | null = null;
  private fast: NodeJS.Timeout | null = null;
  private busy: Promise<void> = Promise.resolve();
  private lastBucket = Date.now();
  private sources = new Map<string, { text: string; lines: number[] }>();

  private constructor(
    readonly session: Session,
    readonly target: URL,
    private opts: OpenOptions,
  ) {}

  /** app_open: abre la aplicación y deja el navegador vivo. */
  static async open(rawUrl: string, opts: OpenOptions = {}): Promise<ToolResult<CaptureMeta>> {
    const target = assertAllowedUrl(rawUrl);
    if (LiveApp.current && !LiveApp.current.closed) await LiveApp.current.close();
    const respect = opts.respectRobots ?? true;
    if (opts.minIntervalMs != null) limiter.minIntervalMs = Math.max(0, opts.minIntervalMs);
    const robots: CaptureMeta['robots'] = { respected: respect, allowed: true };
    if (respect) {
      const r = await checkRobots(target);
      robots.allowed = r.allowed;
      robots.rule = r.rule;
      if (!r.allowed) {
        throw new PolicyError(`robots.txt no permite analizar ${target.pathname} (${r.rule}). Si la aplicación es tuya o tienes autorización, repite con respetar_robots=false.`);
      }
    }
    const session = Session.create(target.host, opts.outRoot);
    const app = new LiveApp(session, target, opts);
    const visible = opts.visible ?? false;
    const { browser, label } = await launchBrowser(!visible);
    app.browser = browser;
    try {
      app.context = await newContext(browser, session.abs('captura.har'));
      await app.context.addInitScript(installMutationLog);
      await app.context.addInitScript(installAppHooks);
      app.page = await app.context.newPage();
      app.rec = await NetworkRecorder.attach(app.page, app.context, target.host, session);
      app.cdp = app.rec.cdp;
      app.cdp.on('Debugger.scriptParsed', (ev: any) => app.scripts.set(ev.scriptId, { url: ev.url, startLine: ev.startLine ?? 0, startColumn: ev.startColumn ?? 0 }));
      await app.cdp.send('Debugger.enable');
      await app.cdp.send('Debugger.setSkipAllPauses', { skip: true });
      await app.cdp.send('Profiler.enable');
      await app.cdp.send('Profiler.startPreciseCoverage', { callCount: true, detailed: false });

      await limiter.wait(target.host);
      let status = 0;
      const f = new Findings('sesion', 'SES');
      try {
        const res = await app.page.goto(target.href, { waitUntil: 'load', timeout: opts.timeoutMs ?? 45000 });
        status = res?.status() ?? 0;
      } catch (e) {
        const reason = String((e as Error).message).split('\n')[0];
        if (!app.rec.count) throw new Error(`No se pudo abrir ${target.href}: ${reason}`);
        f.unknown(`La navegación no terminó de cargar (${reason}); el análisis usa lo que alcanzó a llegar.`);
      }
      await app.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {
        f.unknown('La red no queda en reposo: la aplicación mantiene conexiones abiertas o peticiones periódicas (habitual en aplicaciones en tiempo real).');
      });

      app.meta = {
        version: VERSION,
        url: redactUrl(target.href),
        finalUrl: redactUrl(app.page.url()),
        host: target.host,
        title: '',
        capturedAt: new Date().toISOString(),
        status,
        browser: label,
        visible,
        robots,
        barriers: [],
        authenticated: false,
        private: opts.privacy === 'privado',
        consoleErrors: 0,
        requestCount: 0,
      };
      app.page.on('close', () => void app.finalize());
      app.timer = setInterval(() => void app.pump(), 1500);
      LiveApp.current = app;
      const view = await app.snapshot('inicio');

      f.add(`La aplicación respondió con estado ${status || 'desconocido'} y título «${app.meta.title || 'sin título'}»`, {
        detail: `${app.meta.finalUrl !== app.meta.url ? `Redirigió a ${app.meta.finalUrl}. ` : ''}El navegador queda abierto${visible ? ' y visible' : ' (sin ventana)'} para seguir analizando.`,
        evidence: [{ file: 'capture.json' }, { file: `${view.dir}/page.html`, line: 1 }, ...(view.screenshot ? [{ file: view.screenshot }] : [])],
      });
      f.add(`${app.rec.count} peticiones durante la carga inicial`, { evidence: [{ file: 'network/requests.jsonl' }] });
      for (const b of app.meta.barriers) {
        const login = b === LOGIN;
        f.add(`Barrera detectada: ${b}`, {
          detail: login
            ? visible
              ? 'REA APP no introduce credenciales. El usuario puede iniciar sesión por su cuenta en la ventana abierta; después, app_status confirmará que la sesión está iniciada y el análisis continuará en modo privado.'
              : 'REA APP no introduce credenciales. Para analizar la zona privada, vuelve a abrir con visible=true e inicia sesión a mano.'
            : 'REA APP la reporta y no intenta superarla.',
          confidence: 'media',
          evidence: [{ file: `${view.dir}/page.html` }],
        });
        if (!login) f.unknown(`Lo que hay detrás de «${b}» no se analizó: la herramienta no evade CAPTCHAs, pagos ni protecciones anti-bot.`);
      }
      f.unknown('Solo se conoce lo que se ha cargado hasta ahora: cada vista y cada flujo hay que visitarlos (app_snapshot, app_record, app_act) para que entren en el análisis.');
      return session.saveResult({ tool: 'app_open', session: session.dir, findings: f.list, unknowns: f.unknowns, files: ['capture.json', `${view.dir}/page.html`, 'network/requests.jsonl'], data: app.meta });
    } catch (e) {
      await browser.close().catch(() => {});
      LiveApp.current = null;
      throw e;
    }
  }

  /** Sesión viva actual; falla con un mensaje claro si no hay ninguna. */
  static require(): LiveApp {
    const app = LiveApp.current;
    if (!app || app.closed) throw new Error('No hay una aplicación abierta. Usa app_open(url) primero (o vuelve a abrirla si la ventana se cerró).');
    return app;
  }

  get isPrivate(): boolean {
    return this.meta.private;
  }

  url(raw: string): string {
    const red = redactUrl(raw);
    return this.isPrivate ? privatizeUrl(red) : red;
  }

  /** Ejecuta tareas sobre la página de una en una (el bombeo periódico y las herramientas no se pisan). */
  private exclusive<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.busy.then(fn, fn);
    this.busy = run.then(
      () => {},
      () => {},
    );
    return run;
  }

  /** Vuelve a evaluar barreras, sesión iniciada y modo privado. */
  async refreshState(): Promise<void> {
    const barriers = await this.page.evaluate(detectBarriers).catch(() => [] as string[]);
    const login = barriers.includes(LOGIN);
    if (login) this.sawLogin = true;
    this.meta.barriers = barriers;
    this.meta.authenticated = this.sawLogin && !login;
    const mode = this.opts.privacy ?? 'auto';
    if (mode === 'privado' || (mode === 'auto' && this.meta.authenticated)) this.sticky = true;
    this.meta.private = mode !== 'abierto' && this.sticky;
    this.rec.privateMode = this.meta.private;
    this.meta.finalUrl = this.url(this.page.url());
    this.meta.title = await this.page.title().then((t) => (this.meta.private ? maskDigits(t) : t).slice(0, 120)).catch(() => this.meta.title);
  }

  /** Recoge lo que la instrumentación de la página ha acumulado y, si se está grabando, un cubo de cobertura. */
  pump(): Promise<void> {
    if (this.closed) return Promise.resolve();
    return this.exclusive(async () => {
      // Se vigila el inicio de sesión para entrar en modo privado cuanto antes.
      if (!this.meta.private) await this.refreshState().catch(() => {});
      const drained = await this.page.evaluate(drainAppHooks).catch(() => null);
      if (drained) {
        const r = this.runtime;
        for (const e of drained.routes) r.routes.push({ ...e, url: this.url(e.url) });
        r.wasm.push(...drained.wasm);
        const absolute = (u: string) => {
          try {
            return new URL(u, this.page.url()).href;
          } catch {
            return u;
          }
        };
        for (const wk of drained.workers) r.workers.push({ ...wk, url: wk.url.startsWith('blob:') ? 'blob: (generado en el cliente)' : redactUrl(absolute(wk.url)) });
        r.canvas.push(...drained.canvas);
        for (const es of drained.eventSources) r.eventSources.push({ ...es, url: this.url(absolute(es.url)) });
        for (const [k, v] of Object.entries(drained.sse)) r.sse[k] = (r.sse[k] ?? 0) + v;
        for (const [k, v] of Object.entries(drained.apis)) r.apis[k] = (r.apis[k] ?? 0) + v;
        r.userEvents.push(...drained.userEvents);
        if (r.userEvents.length > 6000) r.userEvents.splice(0, r.userEvents.length - 6000);
      }
      if (this.collecting) {
        const log = await this.page.evaluate(readMutationLog, true).catch(() => null);
        if (log && this.mutations.length < 8000) {
          for (const kind of ['added', 'removed', 'attrs', 'text'] as const) for (const m of log[kind]) this.mutations.push({ ...m, kind });
        }
        await this.takeBucket();
      }
    });
  }

  /** Lee la cobertura acumulada desde la última lectura y pone los contadores a cero. */
  private async takeBucket(keep = true): Promise<Bucket> {
    const t0 = this.lastBucket;
    const t1 = Date.now();
    this.lastBucket = t1;
    const bucket: Bucket = { t0, t1, fns: [] };
    const coverage = await this.cdp.send('Profiler.takePreciseCoverage').catch(() => ({ result: [] as any[] }));
    for (const script of coverage.result) {
      const meta = this.scripts.get(script.scriptId);
      if (!meta || !/^https?:/.test(meta.url)) continue;
      for (const fn of script.functions) {
        const range = fn.ranges[0];
        if (!range || !range.count) continue;
        if (!fn.functionName && range.startOffset === 0) continue; // cuerpo del script completo
        bucket.fns.push({ key: `${script.scriptId}:${range.startOffset}`, scriptId: script.scriptId, name: fn.functionName || '(anónima)', count: range.count, startOffset: range.startOffset, endOffset: range.endOffset });
      }
    }
    if (keep && this.buckets.length < 4000) this.buckets.push(bucket);
    return bucket;
  }

  /** Empieza a acumular cobertura y mutaciones. Devuelve las funciones que se ejecutan en reposo (ruido de fondo). */
  async beginCollect(): Promise<Set<string>> {
    await this.pump();
    return this.exclusive(async () => {
      await this.page.evaluate(readMutationLog, true).catch(() => null);
      await this.takeBucket(false);
      await this.page.waitForTimeout(1000);
      const idle = await this.takeBucket(false);
      this.mutations = [];
      this.buckets = [];
      this.collecting = true;
      // Mientras se graba, la cobertura se lee en cubos cortos para atribuirla al gesto correcto.
      this.fast = setInterval(() => void this.pump(), 250);
      return new Set(idle.fns.map((f) => f.key));
    });
  }

  async endCollect(): Promise<void> {
    if (this.fast) clearInterval(this.fast);
    this.fast = null;
    await this.pump();
    this.collecting = false;
  }

  /** Texto y tabla de líneas de un script, para convertir desplazamientos en línea y columna. */
  private async sourceOf(scriptId: string): Promise<{ text: string; lines: number[] }> {
    let s = this.sources.get(scriptId);
    if (!s) {
      const text = (await this.cdp.send('Debugger.getScriptSource', { scriptId }).catch(() => ({ scriptSource: '' }))).scriptSource;
      const lines = [0];
      for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) lines.push(i + 1);
      s = { text, lines };
      if (this.sources.size < 60) this.sources.set(scriptId, s);
    }
    return s;
  }

  /** Posición (línea y columna desde 1) y fragmento de una función ejecutada. */
  async describe(fn: Executed): Promise<{ frame: Frame; snippet: string }> {
    const meta = this.scripts.get(fn.scriptId)!;
    const { text, lines } = await this.sourceOf(fn.scriptId);
    let lo = 0;
    let hi = lines.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lines[mid] <= fn.startOffset) lo = mid;
      else hi = mid - 1;
    }
    const column = fn.startOffset - lines[lo];
    return {
      frame: { fn: fn.name, url: redactUrl(meta.url), line: meta.startLine + lo + 1, column: (lo === 0 ? meta.startColumn : 0) + column + 1 },
      snippet: redactCode(text.slice(fn.startOffset, Math.min(fn.endOffset, fn.startOffset + 220))).replace(/\s+/g, ' '),
    };
  }

  /** app_snapshot: registra la vista actual (DOM, estado, almacenamiento y, si procede, captura). */
  async snapshot(name?: string): Promise<ViewInfo> {
    await this.pump();
    return this.exclusive(async () => {
      await this.refreshState();
      const page = this.page;
      const n = this.views.length + 1;
      const current = new URL(page.url());
      const route = this.isPrivate ? privatizeUrl(current.pathname + current.hash) : current.pathname + current.hash;
      const label = slug(name || route.replace(/^\//, '') || 'inicio', 40);
      const dir = `views/${String(n).padStart(2, '0')}-${label}`;
      const s = this.session;

      const html = redactHtml(this.isPrivate ? await page.evaluate(serializeMasked) : await page.content());
      s.write('page.html', html);
      s.write(`${dir}/page.html`, html);

      const dom = await page.evaluate(collectDom);
      for (const sc of dom.scripts) {
        if (sc.text) {
          const file = `scripts/raw/inline-${String(sc.index).padStart(2, '0')}.js`;
          s.write(file, redactCode(sc.text));
          (sc as any).file = file;
          delete sc.text;
        }
      }
      if (this.isPrivate) maskTexts(dom);
      dom.url = this.url(dom.url);
      s.writeJson('dom/snapshot.json', dom);
      s.writeJson(`${dir}/dom.json`, dom);
      s.writeJson('stack/probes.json', await page.evaluate(collectProbes));
      s.writeJson('state/snapshot.json', await page.evaluate(collectState).catch(() => ({ stores: [], globals: [], hints: [] })));

      const store = await page.evaluate(collectStorage);
      const cookies = await this.context.cookies();
      s.writeJson('storage/snapshot.json', {
        cookies: cookies.map((c) => ({
          nombre: c.name,
          dominio: c.domain,
          ruta: c.path,
          httpOnly: c.httpOnly,
          secure: c.secure,
          sameSite: c.sameSite,
          persistente: c.expires > 0,
          caducaEnDias: c.expires > 0 ? Math.round((c.expires - Date.now() / 1000) / 86400) : null,
          tipo: classifyValue(c.value),
          longitud: c.value.length,
          sensible: SENSITIVE_NAME.test(c.name) || c.httpOnly,
          valor: '[ENMASCARADO]',
        })),
        localStorage: store.local.map((e) => describeEntry(e.key, e.value)),
        sessionStorage: store.session.map((e) => describeEntry(e.key, e.value)),
        indexedDB: store.databases,
        cacheStorage: store.cacheNames,
      });

      const view: ViewInfo = {
        n,
        name: name || route || '/',
        t: Date.now(),
        url: this.url(page.url()),
        route,
        title: this.meta.title,
        elements: dom.counts.elements,
        forms: dom.forms.length,
        buttons: dom.buttons.length,
        canvases: await page.evaluate(() => document.querySelectorAll('canvas').length).catch(() => 0),
        private: this.isPrivate,
        dir,
      };
      const shots = this.opts.screenshots ?? 'auto';
      if (shots === 'siempre' || (shots === 'auto' && !this.isPrivate)) {
        view.screenshot = s.write(`screenshots/${String(n).padStart(2, '0')}-${label}.png`, await page.screenshot({ type: 'png' }));
        if (n === 1) s.write('screenshots/pagina.png', await page.screenshot({ type: 'png' }));
      }
      this.views.push(view);
      await this.syncLocked();
      return view;
    });
  }

  /** Captura de pantalla, solo si la política de la sesión lo permite (nunca en modo privado salvo petición expresa). */
  async screenshot(rel: string): Promise<string | undefined> {
    const shots = this.opts.screenshots ?? 'auto';
    if (shots === 'nunca' || (shots === 'auto' && this.isPrivate)) return undefined;
    const png = await this.page.screenshot({ type: 'png' }).catch(() => null);
    return png ? this.session.write(rel, png) : undefined;
  }

  /** Vuelca a disco lo acumulado (red, tiempo real, instrumentación, metadatos). */
  async sync(): Promise<void> {
    if (this.closed) return;
    await this.pump();
    await this.exclusive(() => this.syncLocked());
  }

  private async syncLocked(): Promise<void> {
    await this.rec.settle();
    this.rec.flush();
    this.meta.requestCount = this.rec.count;
    this.meta.consoleErrors = this.rec.consoleErrors;
    this.session.writeJson('runtime/hooks.json', { ...this.runtime, userEvents: this.runtime.userEvents.length });
    this.session.writeJson('views/index.json', this.views);
    this.session.writeJson('capture.json', this.meta);
  }

  /** app_status: dónde está la aplicación y qué se ha registrado. */
  async status() {
    await this.pump();
    await this.exclusive(() => this.refreshState());
    await this.sync();
    return {
      url: this.meta.finalUrl,
      titulo: this.meta.title,
      barreras: this.meta.barriers,
      sesionIniciada: this.meta.authenticated,
      esperandoInicioDeSesion: this.meta.barriers.includes(LOGIN),
      modoPrivado: this.meta.private,
      visible: this.meta.visible,
      peticiones: this.rec.count,
      websockets: this.rec.websockets.length,
      vistas: this.views.map((v) => `${v.n}. ${v.name} (${v.route})`),
      rutasVisitadas: [...new Set(this.runtime.routes.map((r) => r.url))].length,
    };
  }

  private async finalize(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    if (this.timer) clearInterval(this.timer);
    if (this.fast) clearInterval(this.fast);
    await this.busy.catch(() => {});
    await this.rec.settle().catch(() => {});
    this.rec.flush();
    this.meta.requestCount = this.rec.count;
    this.session.writeJson('runtime/hooks.json', { ...this.runtime, userEvents: this.runtime.userEvents.length });
    this.session.writeJson('views/index.json', this.views);
    this.session.writeJson('capture.json', this.meta);
    await this.context.close().catch(() => {}); // escribe el HAR
    if (this.session.exists('captura.har')) {
      try {
        const har = redactHar(this.session.readJson('captura.har'));
        if (this.isPrivate) for (const e of har.log?.entries ?? []) if (e.request?.url) e.request.url = privatizeUrl(e.request.url);
        this.session.writeJson('captura.har', har);
      } catch {
        this.session.write('captura.har', '{"log":{"entries":[],"comment":"HAR ilegible; se descartó para no dejar datos sin enmascarar"}}');
      }
    }
    await this.browser.close().catch(() => {});
    if (LiveApp.current === this) LiveApp.current = null;
  }

  /** app_close: cierra el navegador y deja la sesión lista para el análisis sin conexión. */
  async close(): Promise<void> {
    if (!this.closed) {
      await this.pump().catch(() => {});
      await this.exclusive(() => this.syncLocked()).catch(() => {});
    }
    await this.finalize();
  }
}

let last: Session | null = null;

/** Sesión indicada; si no, la de la aplicación abierta; si no, la última usada. */
export function resolveSession(dir?: string): Session {
  if (dir) return (last = Session.open(dir));
  if (LiveApp.current) return (last = LiveApp.current.session);
  if (last) return last;
  throw new Error('No hay ninguna sesión. Usa app_open(url) primero o indica la carpeta de la sesión.');
}

/** Si hay una aplicación abierta sobre esa sesión, vuelca a disco lo último antes de analizar. */
export async function syncIfLive(session: Session): Promise<void> {
  const app = LiveApp.current;
  if (app && !app.closed && app.session.dir === session.dir) await app.sync();
}
