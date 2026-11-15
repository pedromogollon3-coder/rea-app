import type { NetEntry, Schema, ToolResult, WsRecord, GraphQLOp, Frame } from './types.js';
import { Findings, Session } from './session.js';
import { mergeSchemas, schemaToText } from './schema.js';
import { SourceLocator } from './locate.js';

export interface Endpoint {
  metodo: string;
  origen: string;
  ruta: string;
  terceros: boolean;
  llamadas: number;
  estados: number[];
  mime: string;
  parametros: Record<string, string>;
  cuerpo?: string;
  respuesta?: string;
  respuestaEsquema?: Schema;
  iniciador?: Frame;
  /** Función y archivo originales (si hay source map). */
  iniciadorOriginal?: string;
  iniciadorArchivo?: { file: string; line?: number };
  /** Mecanismos de autenticación vistos en las llamadas (nombres). */
  auth: string[];
  /** Rutas de la aplicación desde las que se llamó. */
  vistas: string[];
  lineas: number[];
}

export interface NetworkData {
  endpoints: Endpoint[];
  graphql: (GraphQLOp & { url: string; linea: number })[];
  websockets: WsRecord[];
  terceros: { host: string; categoria: string; peticiones: number; tipos: string[] }[];
  recursos: { tipo: string; peticiones: number; bytes: number }[];
  fallidas: { url: string; error: string; linea: number }[];
}

const THIRD_PARTY: [RegExp, string][] = [
  [/google-analytics\.com|analytics\.google\.com|googletagmanager\.com|plausible\.io|matomo|mixpanel\.com|amplitude\.com|segment\.(io|com)|hotjar\.com|clarity\.ms|heap(analytics)?\.|posthog\.com|fullstory\.com/, 'analítica'],
  [/doubleclick\.net|googlesyndication\.com|adservice\.google|facebook\.net|facebook\.com\/tr|ads-twitter\.com|criteo\.|taboola\.|outbrain\./, 'publicidad'],
  [/fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit\.net|fonts\.bunny\.net/, 'fuentes'],
  [/cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com|ajax\.googleapis\.com|code\.jquery\.com|cdn\.tailwindcss\.com|esm\.sh/, 'CDN de librerías'],
  [/cloudfront\.net|akamai(hd|zed)?\.net|fastly\.net|cloudflare\.com|azureedge\.net|cdn\./, 'CDN'],
  [/sentry\.io|bugsnag\.com|datadoghq\.|newrelic\.com|nr-data\.net|logrocket\./, 'monitoreo de errores'],
  [/stripe\.com|paypal\.com|adyen\.com|braintreegateway\.com|mercadopago\./, 'pagos'],
  [/recaptcha|hcaptcha\.com|challenges\.cloudflare\.com/, 'anti-bot / CAPTCHA'],
  [/youtube\.com|ytimg\.com|vimeo\.com|player\./, 'vídeo'],
  [/intercom\.io|zendesk\.com|crisp\.chat|tawk\.to|hubspot\.com|drift\.com/, 'chat / soporte'],
  [/auth0\.com|okta\.com|accounts\.google\.com|firebaseapp\.com|cognito|clerk\./, 'identidad'],
  [/algolia\.(net|com)|algolianet\.com|typesense\./, 'búsqueda'],
];

function categorize(host: string): string {
  for (const [re, name] of THIRD_PARTY) if (re.test(host)) return name;
  return 'otro';
}

/** /users/123/orders/9f1c… → /users/:id/orders/:id */
export function templatePath(pathname: string): string {
  return (
    pathname
      .split('/')
      .map((seg) => {
        if (/^\d+$/.test(seg) || /^#+$/.test(seg)) return ':id';
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg)) return ':uuid';
        if (/^[0-9a-f]{16,}$/i.test(seg) || (/^[A-Za-z0-9_-]{22,}$/.test(seg) && /\d/.test(seg))) return ':hash';
        return seg;
      })
      .join('/') || '/'
  );
}

function isApiCall(e: NetEntry): boolean {
  if (e.failed) return false;
  if (e.resourceType === 'xhr' || e.resourceType === 'fetch' || e.resourceType === 'eventsource') return true;
  if (e.method !== 'GET' && e.resourceType !== 'ping') return true;
  return e.resourceType !== 'script' && /json/i.test(e.mime);
}

/** app_api: endpoints, parámetros, esquemas de respuesta, GraphQL, WebSockets y terceros. */
export function networkAnalysis(session: Session, extra: NetEntry[] = []): ToolResult<NetworkData> {
  const entries = [...session.readJsonl<NetEntry>('network/requests.jsonl'), ...extra];
  const websockets = session.exists('network/websockets.json') ? session.readJson<WsRecord[]>('network/websockets.json') : [];
  const f = new Findings('api', 'API');
  const FILE = 'network/requests.jsonl';
  const locator = new SourceLocator(session);

  const map = new Map<string, Endpoint>();
  const graphql: NetworkData['graphql'] = [];
  entries.forEach((e, i) => {
    const line = i + 1;
    if (!isApiCall(e)) return;
    let u: URL;
    try {
      u = new URL(e.url);
    } catch {
      return;
    }
    if (e.reqBody?.graphql) graphql.push({ ...e.reqBody.graphql, url: u.origin + u.pathname, linea: line });
    const ruta = templatePath(u.pathname);
    const key = `${e.method} ${u.origin}${ruta}`;
    let ep = map.get(key);
    if (!ep) {
      ep = { metodo: e.method, origen: u.origin, ruta, terceros: e.thirdParty, llamadas: 0, estados: [], mime: e.mime, parametros: {}, auth: [], vistas: [], lineas: [] };
      map.set(key, ep);
    }
    ep.llamadas++;
    if (!ep.estados.includes(e.status)) ep.estados.push(e.status);
    Object.assign(ep.parametros, e.query);
    if (ep.lineas.length < 5) ep.lineas.push(line);
    for (const a of e.auth ?? []) if (!ep.auth.includes(a)) ep.auth.push(a);
    if (e.from && !ep.vistas.includes(e.from) && ep.vistas.length < 8) ep.vistas.push(e.from);
    if (e.reqBody && !ep.cuerpo) {
      ep.cuerpo = e.reqBody.schema ? schemaToText(e.reqBody.schema) : e.reqBody.params ? `formulario(${e.reqBody.params.join(', ')})` : `${e.reqBody.kind}(${e.reqBody.length} caracteres)`;
    }
    if (e.resSchema) {
      ep.respuestaEsquema = ep.respuestaEsquema ? mergeSchemas(ep.respuestaEsquema, e.resSchema) : e.resSchema;
      ep.respuesta = schemaToText(ep.respuestaEsquema);
    }
    if (e.initiator && !ep.iniciador) {
      ep.iniciador = { fn: e.initiator.fn, url: e.initiator.url, line: e.initiator.line, column: e.initiator.column };
      const where = locator.locate(e.initiator, true);
      if (where.original) {
        ep.iniciadorOriginal = where.original;
        ep.iniciadorArchivo = { file: where.file, line: where.line };
      }
    }
  });
  const endpoints = [...map.values()].sort((a, b) => Number(a.terceros) - Number(b.terceros) || a.ruta.localeCompare(b.ruta));

  const own = endpoints.filter((e) => !e.terceros);
  for (const ep of own.slice(0, 20)) {
    const params = Object.entries(ep.parametros).map(([k, v]) => `${k}: ${v}`).join(', ');
    f.add(`Endpoint ${ep.metodo} ${ep.ruta} → ${ep.estados.join('/')} ${ep.mime || ''}`.trim(), {
      detail: [
        `${ep.llamadas} llamada(s) a ${ep.origen}.`,
        params ? `Parámetros de consulta: ${params}.` : '',
        ep.cuerpo ? `Cuerpo enviado: ${ep.cuerpo.replace(/\s+/g, ' ')}.` : '',
        ep.respuesta ? `Forma de la respuesta: ${ep.respuesta.replace(/\s+/g, ' ')}.` : '',
        ep.auth.length ? `Autenticación: ${ep.auth.join(', ')}.` : '',
        ep.vistas.length ? `Se llama desde: ${ep.vistas.join(', ')}.` : '',
        ep.iniciador ? `Lo dispara ${ep.iniciadorOriginal ?? `${ep.iniciador.fn} en ${ep.iniciador.url}:${ep.iniciador.line}`}.` : '',
      ].filter(Boolean).join(' '),
      evidence: [...ep.lineas.map((line) => ({ file: FILE, line })), ...(ep.iniciadorArchivo ? [{ ...ep.iniciadorArchivo, note: `origen de la llamada: ${ep.iniciadorOriginal}` }] : [])],
    });
  }
  if (!own.length) f.unknown('No se observaron llamadas a API propias hasta ahora: los datos vienen en el HTML inicial, por WebSocket, o se piden solo tras interactuar (usa app_act o app_record).');

  const seenOps = new Set<string>();
  for (const op of graphql) {
    const key = `${op.type} ${op.name}`;
    if (seenOps.has(key)) continue;
    seenOps.add(key);
    f.add(`GraphQL ${op.type} «${op.name}» en ${op.url}`, {
      detail: `Variables: ${op.variables.join(', ') || 'ninguna'}. Consulta: ${op.query.replace(/\s+/g, ' ').slice(0, 300)}`,
      evidence: [{ file: FILE, line: op.linea }],
    });
  }

  for (const ws of websockets) {
    f.add(`WebSocket ${ws.url}: ${ws.sent} mensajes enviados, ${ws.received} recibidos`, {
      detail: `Entramado ${ws.protocol || 'desconocido'}; ${ws.groups.length} tipos de mensaje. El detalle del protocolo está en app_realtime.`,
      evidence: [{ file: 'network/websockets.json' }],
    });
  }

  const hosts = new Map<string, { n: number; tipos: Set<string>; line: number }>();
  entries.forEach((e, i) => {
    if (!e.thirdParty) return;
    try {
      const host = new URL(e.url).host;
      const h = hosts.get(host) ?? { n: 0, tipos: new Set<string>(), line: i + 1 };
      h.n++;
      h.tipos.add(e.resourceType);
      hosts.set(host, h);
    } catch {
      /* ignorar */
    }
  });
  const terceros = [...hosts].map(([host, h]) => ({ host, categoria: categorize(host), peticiones: h.n, tipos: [...h.tipos] })).sort((a, b) => b.peticiones - a.peticiones);
  if (terceros.length) {
    f.add(`Llamadas a ${terceros.length} dominios de terceros`, {
      detail: terceros.slice(0, 20).map((t) => `${t.host} (${t.categoria}, ${t.peticiones})`).join('; '),
      evidence: [...hosts.values()].slice(0, 6).map((h) => ({ file: FILE, line: h.line })),
    });
  } else {
    f.add('Sin llamadas a dominios de terceros durante la captura', { evidence: [{ file: FILE }] });
  }

  const byType = new Map<string, { n: number; bytes: number }>();
  for (const e of entries) {
    const t = byType.get(e.resourceType) ?? { n: 0, bytes: 0 };
    t.n++;
    t.bytes += e.size;
    byType.set(e.resourceType, t);
  }
  const recursos = [...byType].map(([tipo, t]) => ({ tipo, peticiones: t.n, bytes: t.bytes })).sort((a, b) => b.bytes - a.bytes);

  const fallidas = entries.flatMap((e, i) => (e.failed || e.status >= 400 ? [{ url: e.url, error: e.failed ?? `HTTP ${e.status}`, linea: i + 1 }] : []));
  if (fallidas.length) {
    f.add(`${fallidas.length} peticiones fallidas o con error HTTP`, {
      detail: fallidas.slice(0, 8).map((x) => `${x.error} ${x.url}`).join('; '),
      evidence: fallidas.slice(0, 6).map((x) => ({ file: FILE, line: x.linea })),
    });
  }

  f.unknown('Los esquemas se infieren de las respuestas observadas: campos opcionales, paginación y errores no vistos pueden faltar.');
  f.unknown('No se conoce la lógica del servidor (validación, autorización, límites): solo su comportamiento visible desde el navegador.');
  if (own.some((e) => e.estados.some((s) => s === 401 || s === 403))) f.unknown('Hay endpoints que respondieron 401/403: requieren una sesión que la herramienta no intenta obtener.');

  const data: NetworkData = { endpoints, graphql, websockets, terceros, recursos, fallidas };
  return session.saveResult({ tool: 'app_api', session: session.dir, findings: f.list, unknowns: f.unknowns, files: [FILE, 'network/websockets.json', 'captura.har'], data });
}
