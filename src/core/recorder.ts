import fs from 'node:fs';
import type { BrowserContext, Page, Response, Request, CDPSession } from 'playwright';
import type { Frame, GraphQLOp, NetEntry, WsRecord } from './types.js';
import { classifyValue, privatizeUrl, redactCode, redactHeaders, redactHtml, redactUrl, SENSITIVE_NAME } from './redact.js';
import { inferSchema, tryParseJson } from './schema.js';
import { Session, slug } from './session.js';
import { classifyFrame } from './wsproto.js';

const MULTI_TLD = /^(co|com|org|net|gob|gov|edu|ac)\.[a-z]{2}$/;

/** Dominio registrable aproximado (sin lista de sufijos públicos). */
export function siteOf(hostname: string): string {
  if (/^[\d.]+$/.test(hostname) || hostname.includes(':') || !hostname.includes('.')) return hostname;
  const parts = hostname.split('.');
  const lastTwo = parts.slice(-2).join('.');
  return MULTI_TLD.test(lastTwo) ? parts.slice(-3).join('.') : lastTwo;
}

export function isThirdParty(url: string, pageHost: string): boolean {
  try {
    return siteOf(new URL(url).hostname) !== siteOf(pageHost.replace(/:\d+$/, ''));
  } catch {
    return false;
  }
}

function framesOf(initiator: any): Frame[] {
  const frames: Frame[] = [];
  let stack = initiator?.stack;
  while (stack && frames.length < 12) {
    for (const f of stack.callFrames ?? []) {
      if (f.url) frames.push({ fn: f.functionName || '(anónima)', url: f.url, line: f.lineNumber + 1, column: f.columnNumber + 1 });
    }
    stack = stack.parent;
  }
  if (!frames.length && initiator?.url) {
    frames.push({ fn: initiator.type === 'parser' ? '(HTML)' : '(script)', url: initiator.url, line: (initiator.lineNumber ?? 0) + 1, column: (initiator.columnNumber ?? 0) + 1 });
  }
  return frames;
}

export function describeBody(text: string, contentType: string): NetEntry['reqBody'] {
  const length = text.length;
  const parsed = /json|graphql/i.test(contentType) || /^[\[{]/.test(text.trim()) ? tryParseJson(text) : undefined;
  if (parsed !== undefined && parsed !== null && typeof parsed === 'object') {
    const first: any = Array.isArray(parsed) ? parsed[0] : parsed;
    if (first && typeof first.query === 'string' && /^\s*(query|mutation|subscription|\{)/.test(first.query)) {
      const m = /^\s*(query|mutation|subscription)?\s*([A-Za-z_]\w*)?/.exec(first.query);
      const graphql: GraphQLOp = {
        type: m?.[1] ?? 'query',
        name: first.operationName || m?.[2] || '(anónima)',
        variables: first.variables && typeof first.variables === 'object' ? Object.keys(first.variables) : [],
        query: redactCode(first.query).slice(0, 1500),
      };
      return { kind: 'graphql', graphql, schema: inferSchema(parsed), length };
    }
    return { kind: 'json', schema: inferSchema(parsed), length };
  }
  if (/x-www-form-urlencoded/i.test(contentType)) {
    return { kind: 'formulario', params: [...new URLSearchParams(text).keys()], length };
  }
  if (/multipart/i.test(contentType)) return { kind: 'multipart', length };
  return { kind: 'texto', length };
}

/** Mecanismos de autenticación de una petición: solo nombres, nunca valores. */
export function authOf(headers: Record<string, string>): string[] {
  const out: string[] = [];
  for (const [name, value] of Object.entries(headers)) {
    const lower = name.toLowerCase();
    if (lower === 'cookie') out.push('cookie');
    else if (lower === 'authorization') out.push(`authorization: ${(/^(\w+)\s/.exec(value)?.[1] ?? 'esquema propio').toLowerCase()}`);
    else if (/csrf|xsrf/.test(lower)) out.push(`cabecera anti-CSRF ${lower}`);
    else if (/(^x-|-)(api-?key|auth|token|session|signature)/.test(lower)) out.push(`cabecera ${lower}`);
  }
  return out;
}

/**
 * Observa la red de la aplicación durante toda la sesión. Guarda metadatos, esquemas y el
 * cuerpo de los scripts; nunca guarda cuerpos de respuestas de datos ni valores sensibles.
 */
export class NetworkRecorder {
  readonly entries: NetEntry[] = [];
  readonly websockets: WsRecord[] = [];
  consoleErrors = 0;
  /** En modo privado se ocultan además los números largos de las URLs. */
  privateMode = false;
  private pending: Promise<void>[] = [];
  private initiators = new Map<string, { frames: Frame[]; t: number }[]>();
  private counter = 0;
  private flushed = 0;
  cdp!: CDPSession;

  private constructor(
    private page: Page,
    private pageHost: string,
    private session: Session,
  ) {}

  static async attach(page: Page, context: BrowserContext, pageHost: string, session: Session): Promise<NetworkRecorder> {
    const rec = new NetworkRecorder(page, pageHost, session);
    rec.cdp = await context.newCDPSession(page);
    await rec.cdp.send('Network.enable');
    rec.cdp.on('Network.requestWillBeSent', (ev: any) => {
      const key = `${ev.request.method} ${ev.request.url}`;
      const list = rec.initiators.get(key) ?? [];
      list.push({ frames: framesOf(ev.initiator), t: Date.now() });
      rec.initiators.set(key, list);
    });
    page.on('response', (res) => rec.pending.push(rec.onResponse(res).catch(() => {})));
    page.on('requestfailed', (req) => rec.onFailed(req));
    page.on('console', (msg) => {
      if (msg.type() === 'error') rec.consoleErrors++;
    });
    page.on('pageerror', () => rec.consoleErrors++);
    page.on('websocket', (ws) => {
      const record: WsRecord = { url: rec.url(ws.url()), opened: Date.now(), sent: 0, received: 0, protocol: '', groups: [], sentLog: [], samples: [] };
      rec.websockets.push(record);
      const onFrame = (dir: 'enviado' | 'recibido', payload: string | Buffer) => {
        const now = Date.now();
        if (dir === 'enviado') record.sent++;
        else record.received++;
        const { protocol, messages } = classifyFrame(payload, ws.url());
        if (!record.protocol || record.protocol === 'texto') record.protocol = protocol;
        for (const msg of messages) {
          let group = record.groups.find((g) => g.dir === dir && g.key === msg.key);
          if (!group) {
            if (record.groups.length >= 120) continue;
            group = { dir, key: msg.key, count: 0, bytes: 0, first: now, last: now, shape: msg.shape };
            record.groups.push(group);
            if (record.samples.length < 12) record.samples.push({ dir, shape: `${msg.key}: ${msg.shape}` });
          }
          group.count++;
          group.bytes += Math.round(payload.length / messages.length);
          group.last = now;
          if (dir === 'enviado' && record.sentLog.length < 4000) record.sentLog.push({ t: now, key: msg.key });
        }
      };
      ws.on('framesent', (f) => onFrame('enviado', f.payload));
      ws.on('framereceived', (f) => onFrame('recibido', f.payload));
      ws.on('close', () => (record.closed = Date.now()));
    });
    return rec;
  }

  get count(): number {
    return this.entries.length;
  }

  private url(raw: string): string {
    const red = redactUrl(raw);
    return this.privateMode ? privatizeUrl(red) : red;
  }

  /** Espera a que terminen las respuestas en curso. */
  async settle(): Promise<void> {
    const pending = this.pending;
    this.pending = [];
    await Promise.allSettled(pending);
  }

  /** Añade al registro en disco las peticiones nuevas. La línea de cada una es su posición en `entries`. */
  flush(): void {
    const fresh = this.entries.slice(this.flushed);
    if (fresh.length) {
      const file = this.session.abs('network/requests.jsonl');
      fs.mkdirSync(this.session.abs('network'), { recursive: true });
      fs.appendFileSync(file, fresh.map((e) => JSON.stringify(e)).join('\n') + '\n');
      this.flushed = this.entries.length;
    } else if (!this.session.exists('network/requests.jsonl')) {
      this.session.write('network/requests.jsonl', '');
    }
    this.session.writeJson('network/websockets.json', this.websockets);
  }

  private base(req: Request, allHeaders?: Record<string, string>): NetEntry {
    const url = req.url();
    const query: Record<string, string> = {};
    try {
      for (const [k, v] of new URL(url).searchParams) query[k] = SENSITIVE_NAME.test(k) ? 'enmascarado' : classifyValue(v);
    } catch {
      /* URL opaca */
    }
    const reqHeaders = allHeaders ?? req.headers();
    const post = req.postData();
    const sent = this.initiators.get(`${req.method()} ${url}`)?.shift();
    const stack = sent?.frames;
    let from = '';
    try {
      const p = new URL(this.page.url());
      from = this.privateMode ? privatizeUrl(p.pathname + p.hash) : p.pathname + p.hash.replace(/[?&=].*$/, '');
    } catch {
      /* página cerrada */
    }
    const entry: NetEntry = {
      n: ++this.counter,
      t: sent?.t ?? Date.now(), // momento en que salió la petición
      url: this.url(url),
      method: req.method(),
      resourceType: req.resourceType(),
      status: 0,
      mime: '',
      size: 0,
      thirdParty: isThirdParty(url, this.pageHost),
      from,
      auth: authOf(reqHeaders),
      reqHeaders: redactHeaders(reqHeaders),
      resHeaders: {},
      query,
    };
    if (post) entry.reqBody = describeBody(post, reqHeaders['content-type'] ?? '');
    if (stack?.length) {
      const clean = stack.map((f) => ({ ...f, url: redactUrl(f.url) }));
      entry.initiator = { ...clean[0], stack: clean.slice(0, 8) };
    }
    return entry;
  }

  private async onResponse(res: Response): Promise<void> {
    const req = res.request();
    if (/^(data|blob|chrome-extension):/.test(req.url())) return;
    // allHeaders incluye las cabeceras que añade el navegador (Cookie), necesarias para saber cómo se autentica.
    const entry = this.base(req, await req.allHeaders().catch(() => undefined));
    const headers = await res.allHeaders().catch(() => res.headers());
    entry.status = res.status();
    entry.mime = (headers['content-type'] ?? '').split(';')[0].trim();
    entry.resHeaders = redactHeaders(headers);
    entry.size = Number(headers['content-length'] ?? 0);
    const type = entry.resourceType;
    const isData = type === 'xhr' || type === 'fetch';
    let mainDoc = false;
    try {
      mainDoc = type === 'document' && req.isNavigationRequest() && req.frame().parentFrame() === null;
    } catch {
      /* peticiones de service workers no tienen frame */
    }
    const streaming = /event-stream/i.test(entry.mime);
    const wasm = /wasm/i.test(entry.mime);
    const wantBody = !streaming && entry.status < 300 && (mainDoc || wasm || type === 'script' || /json/i.test(entry.mime) || (isData && /text|javascript|xml/i.test(entry.mime)));
    if (wantBody) {
      const body = await res.body().catch(() => undefined);
      if (body) {
        entry.size = body.length;
        if (mainDoc) {
          // HTML tal como lo sirvió el servidor: las posiciones de los scripts en línea se refieren a él.
          if (body.length < 8 * 1024 * 1024) this.session.write('page-source.html', redactHtml(body.toString('utf8')));
        } else if (type === 'script' && body.length < 12 * 1024 * 1024) {
          const name = slug(new URL(req.url()).pathname.split('/').pop() || 'script', 50).replace(/\.m?js$/, '');
          entry.bodyFile = this.session.write(`scripts/raw/${String(entry.n).padStart(3, '0')}-${name}.js`, redactCode(body.toString('utf8')));
        } else if (!wasm && type !== 'script' && body.length < 6 * 1024 * 1024) {
          const json = tryParseJson(body.toString('utf8'));
          if (json !== undefined) entry.resSchema = inferSchema(json);
        }
      }
    }
    this.entries.push(entry);
  }

  private onFailed(req: Request): void {
    if (/^(data|blob):/.test(req.url())) return;
    const entry = this.base(req);
    entry.failed = req.failure()?.errorText ?? 'falló';
    this.entries.push(entry);
  }
}
