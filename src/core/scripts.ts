import fs from 'node:fs';
import path from 'node:path';
import beautifyPkg from 'js-beautify';
import type { NetEntry, ToolResult, Evidence } from './types.js';
import type { DomSnapshot } from './page-scripts.js';
import { Findings, lineOf, Session, slug } from './session.js';
import { politeFetch } from './policy.js';
import { redactCode } from './redact.js';

const beautify: (code: string, opts?: object) => string = (beautifyPkg as any).js ?? (beautifyPkg as any).js_beautify ?? (beautifyPkg as any);

interface Signature {
  name: string;
  kind: 'framework' | 'librería' | 'empaquetador' | 'analítica';
  url?: RegExp;
  content?: RegExp;
  version?: RegExp;
}

export const SIGNATURES: Signature[] = [
  { name: 'React', kind: 'framework', url: /react(-dom)?[.@-](\d|prod|dev|min)/i, content: /Symbol\.for\(["']react\.(transitional\.)?element["']\)|__SECRET_INTERNALS_DO_NOT_USE|react-dom/ },
  { name: 'Next.js', kind: 'framework', url: /\/_next\/static\//, content: /__NEXT_DATA__|__next_f|next\/dist\// },
  { name: 'Vue', kind: 'framework', url: /vue(\.runtime)?(\.global)?(\.prod)?(\.min)?\.js/i, content: /__vue_app__|__v_isRef|__VUE_OPTIONS_API__|Vue\.js v\d/, version: /Vue\.js v([\d.]+)/ },
  { name: 'Nuxt', kind: 'framework', url: /\/_nuxt\//, content: /__NUXT__|nuxt\/dist/ },
  { name: 'Angular', kind: 'framework', content: /@angular\/core|ɵɵdefineComponent|ng-version|platformBrowserDynamic/ },
  { name: 'Svelte', kind: 'framework', url: /\/_app\/immutable\//, content: /svelte\/internal|SvelteComponent|__svelte/ },
  { name: 'Astro', kind: 'framework', url: /\/_astro\//, content: /astro-island|astro:load/ },
  { name: 'Alpine.js', kind: 'framework', url: /alpine(js)?(\.min)?\.js/i, content: /Alpine\.start\(|alpine:init/ },
  { name: 'htmx', kind: 'librería', url: /htmx(\.min)?\.js/i, content: /htmx:afterSwap|hx-swap/ },
  { name: 'jQuery', kind: 'librería', url: /jquery([.-][\d.]+)?(\.slim)?(\.min)?\.js/i, content: /jQuery v\d|jquery\.org\/license|\.fn\.jquery\b|jQuery\.fn\.init/, version: /jQuery (?:JavaScript Library )?v([\d.]+)/ },
  { name: 'Lodash', kind: 'librería', url: /lodash(\.min)?\.js/i, content: /lodash\.com\/license|__lodash_hash_undefined__/ },
  { name: 'Axios', kind: 'librería', url: /axios(\.min)?\.js/i, content: /isAxiosError|AxiosError|axios\/\d/, version: /axios\/([\d.]+)/ },
  { name: 'Redux', kind: 'librería', content: /@@redux\/INIT|redux-toolkit|reduxjs/ },
  { name: 'React Router', kind: 'librería', content: /react-router|UNSAFE_NavigationContext/ },
  { name: 'TanStack Query', kind: 'librería', content: /@tanstack\/(react-)?query|QueryClient\b/ },
  { name: 'Apollo Client', kind: 'librería', content: /ApolloClient|@apollo\/client/ },
  { name: 'Socket.IO', kind: 'librería', url: /socket\.io/i, content: /socket\.io-client|engine\.io/ },
  { name: 'Bootstrap', kind: 'librería', url: /bootstrap(\.bundle)?(\.min)?\.js/i, content: /Bootstrap v\d|getbootstrap\.com/, version: /Bootstrap v([\d.]+)/ },
  { name: 'GSAP', kind: 'librería', url: /gsap|TweenMax/i, content: /GreenSock|gsap\.registerPlugin/ },
  { name: 'Three.js', kind: 'librería', url: /three(\.module)?(\.min)?\.js/i, content: /THREE\.WebGLRenderer|WebGLRenderer\b.*REVISION/ },
  { name: 'D3', kind: 'librería', url: /d3(\.v\d)?(\.min)?\.js/i, content: /d3-selection|d3js\.org/ },
  { name: 'Moment.js', kind: 'librería', url: /moment(\.min)?\.js/i, content: /_isAMomentObject/ },
  { name: 'core-js', kind: 'librería', content: /__core-js_shared__|core-js\/(internals|modules)/ },
  { name: 'Workbox', kind: 'librería', content: /workbox-(core|routing|precaching)/ },
  { name: 'webpack', kind: 'empaquetador', content: /__webpack_require__|webpackChunk\w*|webpackJsonp/ },
  { name: 'Vite', kind: 'empaquetador', content: /__vite__mapDeps|__vitePreload|vite\/modulepreload-polyfill/ },
  { name: 'Parcel', kind: 'empaquetador', content: /parcelRequire/ },
  { name: 'Sentry', kind: 'analítica', url: /sentry(-cdn)?\.(io|com)|@sentry/i, content: /Sentry\.init\(|sentry-javascript|__SENTRY__/ },
  { name: 'Google Tag Manager', kind: 'analítica', url: /googletagmanager\.com\/gtm\.js/ },
  { name: 'Google Analytics', kind: 'analítica', url: /google-analytics\.com|googletagmanager\.com\/gtag\/js/ },
  { name: 'Meta Pixel', kind: 'analítica', url: /connect\.facebook\.net/ },
  { name: 'Hotjar', kind: 'analítica', url: /static\.hotjar\.com/ },
  { name: 'Stripe.js', kind: 'librería', url: /js\.stripe\.com/ },
];

const HINTS: { tipo: string; re: RegExp }[] = [
  { tipo: 'petición fetch', re: /\bfetch\s*\(/ },
  { tipo: 'XMLHttpRequest', re: /new\s+XMLHttpRequest\b/ },
  { tipo: 'WebSocket', re: /new\s+WebSocket\s*\(/ },
  { tipo: 'manejador de evento', re: /\.addEventListener\s*\(/ },
  { tipo: 'almacenamiento local', re: /\b(localStorage|sessionStorage)\s*\.\s*(setItem|getItem)\s*\(/ },
  { tipo: 'IndexedDB', re: /indexedDB\s*\.\s*open\s*\(/ },
  { tipo: 'historial/ruteo', re: /history\s*\.\s*(pushState|replaceState)\s*\(/ },
];

export interface ScriptInfo {
  url: string;
  origen: 'externo' | 'inline';
  terceros: boolean;
  bytes: number;
  minificado: boolean;
  archivo: string;
  legible: string;
  mapa: 'recuperado' | 'sin contenido' | 'no disponible' | 'no buscado';
  mapaArchivo?: string;
  fuentes: number;
  dirFuentes?: string;
  librerias: string[];
}

export interface ScriptsData {
  scripts: ScriptInfo[];
  detectado: { nombre: string; tipo: string; version?: string; via: string }[];
  paquetes: string[];
  pistas: { archivo: string; linea: number; tipo: string; texto: string }[];
}

function isMinified(code: string): boolean {
  const lines = code.split('\n');
  const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);
  return code.length > 600 && (code.length / lines.length > 220 || longest > 2500);
}

function findMapRef(code: string): string | undefined {
  const tail = code.slice(-4000);
  const all = [...tail.matchAll(/\/[/*]#\s*sourceMappingURL=([^\s*]+)/g)];
  return all.length ? all[all.length - 1][1] : undefined;
}

export function cleanSourcePath(src: string, i: number): string {
  const parts = src
    .replace(/^[a-z][a-z0-9+.-]*:\/\/+/i, '')
    .replace(/[?#].*$/, '')
    .split(/[\\/]+/)
    .filter((s) => s && s !== '.');
  // Los «..» iniciales (rutas relativas al directorio de salida del empaquetador) se descartan.
  while (parts[0] === '..') parts.shift();
  const p = parts.map((s) => (s === '..' ? '_' : s.replace(/[<>:"|?*\u0000-\u001f]/g, '_'))).join('/');
  return p || `fuente-${i}.js`;
}

function flattenMap(map: any): { sources: string[]; contents: (string | null)[] } {
  const sources: string[] = [];
  const contents: (string | null)[] = [];
  const add = (m: any) => {
    const root = m.sourceRoot ? String(m.sourceRoot).replace(/\/?$/, '/') : '';
    (m.sources ?? []).forEach((s: string, i: number) => {
      sources.push(root + s);
      contents.push(m.sourcesContent?.[i] ?? null);
    });
  };
  if (Array.isArray(map.sections)) for (const s of map.sections) if (s.map) add(s.map);
  add(map);
  return { sources, contents };
}

async function loadMap(ref: string, scriptUrl: string): Promise<any | null> {
  try {
    if (ref.startsWith('data:')) {
      const comma = ref.indexOf(',');
      const meta = ref.slice(0, comma);
      const payload = ref.slice(comma + 1);
      return JSON.parse(/;base64/i.test(meta) ? Buffer.from(payload, 'base64').toString('utf8') : decodeURIComponent(payload));
    }
    const res = await politeFetch(new URL(ref, scriptUrl).toString(), { maxBytes: 60 * 1024 * 1024 });
    if (!res?.ok) return null;
    return JSON.parse(res.text.replace(/^\)\]\}'[^\n]*\n/, ''));
  } catch {
    return null;
  }
}

/**
 * app_scripts: inventario de scripts, detección de frameworks y librerías,
 * recuperación de módulos originales desde source maps y embellecido del código minificado.
 */
export async function scriptsAnalysis(session: Session, opts: { thirdPartyMaps?: boolean; maxMaps?: number } = {}): Promise<ToolResult<ScriptsData>> {
  const entries = session.readJsonl<NetEntry>('network/requests.jsonl');
  const dom = session.readJson<DomSnapshot>('dom/snapshot.json');
  const probes = session.exists('stack/probes.json') ? session.readJson<{ found: Record<string, string | boolean> }>('stack/probes.json') : { found: {} };
  const f = new Findings('scripts', 'SCR');
  const files: string[] = [];
  const infos: ScriptInfo[] = [];
  const index: Record<string, { raw: string; map?: string; dir?: string; readable: string }> = {};
  const packages = new Set<string>();
  const detected = new Map<string, { nombre: string; tipo: string; version?: string; via: string; evidence: Evidence[] }>();
  const hints: ScriptsData['pistas'] = [];
  let mapsTried = 0;
  const maxMaps = opts.maxMaps ?? 30;

  const sources: { url: string; file: string; origen: 'externo' | 'inline'; terceros: boolean; header?: string }[] = [];
  for (const e of entries) {
    if (e.resourceType === 'script' && e.bodyFile) {
      sources.push({ url: e.url, file: e.bodyFile, origen: 'externo', terceros: e.thirdParty, header: e.resHeaders['sourcemap'] ?? e.resHeaders['x-sourcemap'] });
    }
  }
  for (const s of dom.scripts) {
    const file = (s as any).file as string | undefined;
    if (file) sources.push({ url: `${dom.url}#inline-${s.index}`, file, origen: 'inline', terceros: false });
  }

  for (const src of sources) {
    const code = session.read(src.file);
    const minified = isMinified(code);
    const name = slug(src.file.replace(/^scripts\/raw\//, '').replace(/\.js$/, ''), 60);
    const info: ScriptInfo = { url: src.url, origen: src.origen, terceros: src.terceros, bytes: code.length, minificado: minified, archivo: src.file, legible: src.file, mapa: 'no buscado', fuentes: 0, librerias: [] };

    // 1. Source map → módulos originales.
    const ref = src.header ?? findMapRef(code);
    const wantMap = (!src.terceros || opts.thirdPartyMaps) && mapsTried < maxMaps;
    if (wantMap && (ref || (minified && src.origen === 'externo'))) {
      mapsTried++;
      // Un mapa ya descargado en una pasada anterior se reutiliza: no se vuelve a pedir al servidor.
      const cached = `sourcemaps/${name}.map`;
      const map = session.exists(cached) ? session.readJson(cached) : await loadMap(ref ?? `${src.url.replace(/[?#].*$/, '')}.map`, src.url);
      if (map && (map.sources || map.sections)) {
        const { sources: names, contents } = flattenMap(map);
        // El mapa se guarda con su contenido embebido ya enmascarado (las posiciones no cambian de línea).
        for (const m of [map, ...(Array.isArray(map.sections) ? map.sections.map((s: any) => s.map) : [])]) {
          if (Array.isArray(m?.sourcesContent)) m.sourcesContent = m.sourcesContent.map((c: unknown) => (typeof c === 'string' ? redactCode(c) : c));
        }
        info.mapaArchivo = session.write(`sourcemaps/${name}.map`, JSON.stringify(map));
        const dir = `sources/${name}`;
        let written = 0;
        const firstFiles: string[] = [];
        names.forEach((s, i) => {
          const pkg = /node_modules\/((?:@[^/]+\/)?[^/]+)/.exec(s)?.[1];
          if (pkg) {
            packages.add(pkg);
            return; // el código de dependencias no se vuelca: solo se anota el paquete
          }
          const content = contents[i];
          if (content == null || written >= 3000) return;
          const rel = session.write(`${dir}/${cleanSourcePath(s, i)}`, redactCode(content));
          written++;
          if (firstFiles.length < 5) firstFiles.push(rel);
        });
        info.fuentes = written;
        info.mapa = written ? 'recuperado' : 'sin contenido';
        if (written) {
          info.dirFuentes = dir;
          info.legible = dir;
          files.push(dir);
          f.add(`Source map recuperado para ${src.url.split('/').pop()}: ${written} módulos originales`, {
            detail: `De ${names.length} fuentes listadas en el mapa (${names.length - written} son dependencias de node_modules o no traen contenido). Código original en ${dir}/.`,
            evidence: [{ file: info.mapaArchivo }, ...firstFiles.map((file) => ({ file, line: 1 }))],
          });
        } else {
          f.unknown(`El source map de ${src.url} no incluye sourcesContent: solo se conocen los nombres de ${names.length} archivos originales.`);
        }
      } else {
        info.mapa = 'no disponible';
      }
    }

    // 2. Sin fuentes originales: embellecer si está minificado.
    if (!info.fuentes && minified && code.length < 3 * 1024 * 1024) {
      try {
        info.legible = session.write(`sources/beautified/${name}.js`, beautify(code, { indent_size: 2, max_preserve_newlines: 2 }));
        files.push(info.legible);
      } catch {
        f.unknown(`No se pudo embellecer ${src.file}.`);
      }
    }

    // 3. Firmas de frameworks y librerías.
    const readable = info.fuentes ? '' : session.read(info.legible);
    for (const sig of SIGNATURES) {
      const byUrl = sig.url?.test(src.url);
      const m = sig.content ? sig.content.exec(code) : null;
      if (!byUrl && !m) continue;
      info.librerias.push(sig.name);
      const version = sig.version?.exec(code)?.[1] ?? /[@/-]v?(\d+\.\d+\.\d+)/.exec(byUrl ? src.url : '')?.[1];
      const prev = detected.get(sig.name);
      const ev: Evidence = m
        ? { file: info.fuentes ? src.file : info.legible, line: lineOf(info.fuentes ? code : readable, m[0]), note: `coincide «${m[0].slice(0, 50)}»` }
        : { file: src.file, note: `URL ${src.url}` };
      if (!prev) detected.set(sig.name, { nombre: sig.name, tipo: sig.kind, version, via: m ? 'contenido del script' : 'URL del script', evidence: [ev] });
      else {
        if (!prev.version && version) prev.version = version;
        if (prev.evidence.length < 3) prev.evidence.push(ev);
      }
    }

    // 4. Pistas en el código propio legible.
    if (!src.terceros && hints.length < 60) {
      const readableFiles = info.fuentes ? listFiles(session, info.dirFuentes!).slice(0, 80) : [info.legible];
      for (const file of readableFiles) {
        const lines = session.read(file).split('\n');
        for (let i = 0; i < lines.length && hints.length < 60; i++) {
          if (lines[i].length > 400) continue;
          for (const h of HINTS) {
            if (h.re.test(lines[i])) {
              hints.push({ archivo: file, linea: i + 1, tipo: h.tipo, texto: lines[i].trim().slice(0, 140) });
              break;
            }
          }
        }
      }
    }

    index[src.url] = { raw: src.file, map: info.mapaArchivo, dir: info.dirFuentes, readable: info.legible };
    infos.push(info);
  }

  // Señales en tiempo de ejecución (más fiables que las firmas de texto).
  for (const [name, value] of Object.entries(probes.found)) {
    const sig = SIGNATURES.find((s) => s.name === name);
    const prev = detected.get(name);
    const version = typeof value === 'string' ? value : undefined;
    const ev: Evidence = { file: 'stack/probes.json', note: 'señal en tiempo de ejecución' };
    if (prev) {
      prev.via = 'tiempo de ejecución + ' + prev.via;
      prev.version = version ?? prev.version;
      prev.evidence.unshift(ev);
    } else {
      detected.set(name, { nombre: name, tipo: sig?.kind ?? 'librería', version, via: 'tiempo de ejecución', evidence: [ev] });
    }
  }

  session.writeJson('sources/index.json', index);
  files.push('sources/index.json');

  const ext = infos.filter((i) => i.origen === 'externo');
  const third = infos.filter((i) => i.terceros);
  f.add(`${infos.length} scripts: ${ext.length} externos (${third.length} de terceros) y ${infos.length - ext.length} en línea`, {
    detail: `${Math.round(infos.reduce((s, i) => s + i.bytes, 0) / 1024)} KB de JavaScript; ${infos.filter((i) => i.minificado).length} minificados.`,
    evidence: [{ file: 'sources/index.json' }, ...infos.slice(0, 4).map((i) => ({ file: i.archivo, line: 1 }))],
  });
  const order = { framework: 0, empaquetador: 1, librería: 2, analítica: 3 } as Record<string, number>;
  for (const d of [...detected.values()].sort((a, b) => (order[a.tipo] ?? 9) - (order[b.tipo] ?? 9)).slice(0, 25)) {
    f.add(`${d.tipo[0].toUpperCase()}${d.tipo.slice(1)}: ${d.nombre}${d.version ? ` ${d.version}` : ''}`, {
      detail: `Detectado por ${d.via}.`,
      confidence: d.via.includes('tiempo de ejecución') ? 'alta' : 'media',
      evidence: d.evidence,
    });
  }
  if (packages.size) {
    f.add(`${packages.size} paquetes npm identificados por las rutas del source map`, {
      detail: [...packages].sort().slice(0, 60).join(', '),
      evidence: infos.filter((i) => i.mapaArchivo).slice(0, 3).map((i) => ({ file: i.mapaArchivo! })),
    });
  }
  const pretty = infos.filter((i) => i.legible.startsWith('sources/beautified/'));
  if (pretty.length) {
    f.add(`${pretty.length} scripts minificados sin source map fueron embellecidos`, {
      detail: 'Los nombres de variables siguen ofuscados: sirve para leer la estructura, no para recuperar nombres originales.',
      evidence: pretty.slice(0, 5).map((i) => ({ file: i.legible, line: 1 })),
    });
  }
  if (hints.length) {
    const kinds = new Map<string, number>();
    for (const h of hints) kinds.set(h.tipo, (kinds.get(h.tipo) ?? 0) + 1);
    f.add('Puntos de entrada en el código propio', {
      detail: [...kinds].map(([k, n]) => `${n} × ${k}`).join(', '),
      confidence: 'media',
      evidence: hints.slice(0, 12).map((h) => ({ file: h.archivo, line: h.linea, note: `${h.tipo}: ${h.texto}` })),
    });
  }

  if (!detected.size) f.unknown('No se reconoció ningún framework o librería: puede ser JavaScript sin dependencias o una tecnología que no está en las firmas.');
  const noMap = infos.filter((i) => !i.terceros && i.minificado && !i.fuentes);
  if (noMap.length) f.unknown(`${noMap.length} script(s) propios minificados no publican source map: su lógica solo se puede leer embellecida, con nombres ofuscados.`);
  if (third.length && !opts.thirdPartyMaps) f.unknown(`No se buscaron source maps de los ${third.length} scripts de terceros.`);
  f.unknown('Los módulos cargados de forma diferida (import dinámico tras una interacción) solo aparecen si se cargaron durante la captura.');

  const data: ScriptsData = {
    scripts: infos,
    detectado: [...detected.values()].map(({ evidence: _e, ...rest }) => rest),
    paquetes: [...packages].sort(),
    pistas: hints,
  };
  return session.saveResult({ tool: 'app_scripts', session: session.dir, findings: f.list, unknowns: f.unknowns, files, data });
}

export function listFiles(session: Session, relDir: string): string[] {
  const out: string[] = [];
  const walk = (rel: string) => {
    for (const ent of fs.readdirSync(session.abs(rel), { withFileTypes: true })) {
      const child = path.posix.join(rel, ent.name);
      if (ent.isDirectory()) walk(child);
      else if (/\.(m?[jt]sx?|vue|svelte)$/.test(ent.name)) out.push(child);
    }
  };
  walk(relDir);
  return out;
}
