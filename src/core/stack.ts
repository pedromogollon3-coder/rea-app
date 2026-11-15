import type { CaptureMeta, NetEntry, ToolResult } from './types.js';
import type { DomSnapshot } from './page-scripts.js';
import type { ScriptsData } from './scripts.js';
import type { NetworkData } from './network.js';
import { Findings, Session } from './session.js';
import { networkAnalysis } from './network.js';

export interface StackData {
  tecnologias: { nombre: string; tipo: string; version?: string; via: string }[];
  servidor: Record<string, string>;
  cdn: string[];
  analitica: string[];
  seguridad: { cabecera: string; presente: boolean; valor?: string; nota: string }[];
}

const CDN_HEADERS: [string, RegExp | null, string][] = [
  ['cf-ray', null, 'Cloudflare'],
  ['x-vercel-id', null, 'Vercel'],
  ['x-nf-request-id', null, 'Netlify'],
  ['x-amz-cf-id', null, 'Amazon CloudFront'],
  ['x-served-by', /cache-/, 'Fastly'],
  ['x-fastly-request-id', null, 'Fastly'],
  ['x-akamai-transformed', null, 'Akamai'],
  ['x-azure-ref', null, 'Azure Front Door'],
  ['x-github-request-id', null, 'GitHub Pages'],
  ['fly-request-id', null, 'Fly.io'],
  ['x-render-origin-server', null, 'Render'],
  ['server', /cloudflare/i, 'Cloudflare'],
  ['server', /akamai/i, 'Akamai'],
  ['server', /vercel/i, 'Vercel'],
  ['server', /netlify/i, 'Netlify'],
  ['via', /cloudfront/i, 'Amazon CloudFront'],
  ['via', /varnish/i, 'Varnish'],
];

const SECURITY: [string, string][] = [
  ['content-security-policy', 'limita de dónde se cargan scripts y recursos'],
  ['strict-transport-security', 'fuerza HTTPS (HSTS)'],
  ['x-content-type-options', 'evita la detección automática de tipo MIME'],
  ['x-frame-options', 'evita que la página se incruste en iframes ajenos'],
  ['referrer-policy', 'controla qué referente se envía'],
  ['permissions-policy', 'restringe APIs del navegador'],
  ['cross-origin-opener-policy', 'aísla la ventana de otros orígenes'],
  ['cross-origin-resource-policy', 'limita quién puede cargar los recursos'],
];

/** app_stack: tecnologías, servidor, CDN, analítica y cabeceras de seguridad. */
export function stackAnalysis(session: Session): ToolResult<StackData> {
  const meta = session.readJson<CaptureMeta>('capture.json');
  const entries = session.readJsonl<NetEntry>('network/requests.jsonl');
  const dom = session.readJson<DomSnapshot>('dom/snapshot.json');
  const probes = session.readJson<{ found: Record<string, string | boolean>; generator: string; serviceWorker: boolean; manifest: boolean }>('stack/probes.json');
  const scripts = session.loadResult<ScriptsData>('app_scripts');
  const net = session.loadResult<NetworkData>('app_api') ?? networkAnalysis(session);
  const f = new Findings('stack', 'STK');
  const FILE = 'network/requests.jsonl';

  const docIndex = Math.max(0, entries.findIndex((e) => e.resourceType === 'document' && e.status >= 200 && e.status < 300));
  const doc = entries[docIndex];
  const h = doc?.resHeaders ?? {};
  const docEv = [{ file: FILE, line: docIndex + 1, note: 'cabeceras del documento principal' }];

  const tecnologias: StackData['tecnologias'] = scripts
    ? scripts.data.detectado
    : Object.entries(probes.found).map(([nombre, v]) => ({ nombre, tipo: 'detectado', version: typeof v === 'string' ? v : undefined, via: 'tiempo de ejecución' }));
  if (tecnologias.length) {
    f.add(`Tecnologías de cliente: ${tecnologias.map((t) => `${t.nombre}${t.version ? ` ${t.version}` : ''}`).join(', ')}`, {
      detail: scripts ? 'Detalle y evidencia por librería en los hallazgos de app_scripts.' : 'Solo señales en tiempo de ejecución; ejecuta app_scripts para el análisis de contenido.',
      evidence: [{ file: 'stack/probes.json' }, ...(scripts ? [{ file: 'analysis/app_scripts.json' }] : [])],
    });
  } else {
    f.unknown('No se identificó el framework de cliente.');
  }
  if (probes.generator || dom.meta.generator) {
    f.add(`Generador declarado: ${probes.generator || dom.meta.generator}`, { evidence: [{ file: 'stack/probes.json' }] });
  }
  if (probes.serviceWorker || probes.manifest) {
    f.add(`PWA: ${[probes.serviceWorker ? 'service worker activo' : '', probes.manifest ? 'manifiesto web' : ''].filter(Boolean).join(' y ')}`, { evidence: [{ file: 'stack/probes.json' }] });
  }

  const servidor: Record<string, string> = {};
  for (const k of ['server', 'x-powered-by', 'x-generator', 'x-aspnet-version', 'x-drupal-cache', 'x-shopify-stage', 'content-encoding', 'cache-control', 'alt-svc']) if (h[k]) servidor[k] = h[k];
  if (Object.keys(servidor).length) {
    f.add(`Servidor: ${servidor['server'] ?? 'no declarado'}${servidor['x-powered-by'] ? ` (${servidor['x-powered-by']})` : ''}`, {
      detail: Object.entries(servidor).map(([k, v]) => `${k}: ${v}`).join('; '),
      evidence: docEv,
    });
  } else {
    f.unknown('El servidor no declara su tecnología en las cabeceras.');
  }

  const cdn = new Set<string>();
  for (const [name, re, label] of CDN_HEADERS) if (h[name] && (!re || re.test(h[name]))) cdn.add(label);
  for (const t of net.data.terceros) if (t.categoria === 'CDN' || t.categoria === 'CDN de librerías') cdn.add(t.host);
  if (cdn.size) f.add(`CDN / alojamiento: ${[...cdn].join(', ')}`, { confidence: 'media', evidence: docEv });
  else f.unknown('No se identificó CDN ni proveedor de alojamiento por las cabeceras.');

  const analitica = new Set<string>();
  for (const t of net.data.terceros) if (['analítica', 'publicidad', 'monitoreo de errores'].includes(t.categoria)) analitica.add(`${t.host} (${t.categoria})`);
  for (const t of tecnologias) if (t.tipo === 'analítica') analitica.add(t.nombre);
  f.add(analitica.size ? `Analítica y seguimiento: ${[...analitica].join(', ')}` : 'Sin analítica ni seguimiento de terceros observados', {
    evidence: [{ file: 'analysis/app_api.json' }, { file: 'stack/probes.json' }],
  });

  const seguridad = SECURITY.map(([cabecera, nota]) => ({ cabecera, presente: !!h[cabecera], valor: h[cabecera]?.slice(0, 200), nota }));
  const missing = seguridad.filter((s) => !s.presente);
  const isHttps = meta.finalUrl.startsWith('https:');
  f.add(`Cabeceras de seguridad: ${seguridad.length - missing.length} de ${seguridad.length} presentes`, {
    detail: `Presentes: ${seguridad.filter((s) => s.presente).map((s) => s.cabecera).join(', ') || 'ninguna'}. Ausentes: ${missing.map((s) => s.cabecera).join(', ') || 'ninguna'}.${isHttps ? '' : ' La página se sirve por HTTP sin cifrar.'}`,
    evidence: docEv,
  });

  f.unknown('El stack de servidor (lenguaje, base de datos, infraestructura) solo se infiere de cabeceras y puede estar oculto o falseado.');
  const data: StackData = { tecnologias, servidor, cdn: [...cdn], analitica: [...analitica], seguridad };
  return session.saveResult({ tool: 'app_stack', session: session.dir, findings: f.list, unknowns: f.unknowns, files: ['stack/probes.json', FILE], data });
}
