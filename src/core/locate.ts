import { SourceMapConsumer } from 'source-map-js';
import type { Evidence, Frame, NetEntry } from './types.js';
import { Session } from './session.js';
import { cleanSourcePath } from './scripts.js';

const DECLS = [
  /function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(/,
  /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/,
  /^\s*(?:export\s+)?(?:async\s+|static\s+)*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/,
];
const KEYWORDS = /^(if|for|while|switch|catch|function|return|await)$/;

/** Nombre de la función declarada en una línea de código, si lo hay. */
function declaredName(line: string): string | undefined {
  for (const re of DECLS) {
    const m = re.exec(line);
    if (m && !KEYWORDS.test(m[1])) return m[1];
  }
  return undefined;
}

/** Función que contiene la línea `index`: la declaración anterior más cercana con menos sangría. */
function enclosingFunction(lines: string[], index: number): string | undefined {
  const indent = (l: string) => l.length - l.trimStart().length;
  const own = indent(lines[index] ?? '');
  for (let i = index; i >= 0 && i > index - 80; i--) {
    const name = declaredName(lines[i]);
    if (name && (i === index || indent(lines[i]) < own)) return name;
  }
  return undefined;
}

export type Located = Evidence & { original?: string; originalName?: string };

/**
 * Traduce una posición en un script servido (URL, línea, columna) a un archivo de la sesión:
 * el módulo original si hay source map, o el script crudo si no.
 */
export class SourceLocator {
  private index: Record<string, { raw: string; map?: string; dir?: string; readable: string }> = {};
  private rawByUrl = new Map<string, string>();
  private consumers = new Map<string, any>();
  private pageUrl = '';

  constructor(private session: Session) {
    if (session.exists('sources/index.json')) this.index = session.readJson('sources/index.json');
    for (const e of session.readJsonl<NetEntry>('network/requests.jsonl')) if (e.bodyFile) this.rawByUrl.set(e.url, e.bodyFile);
    if (session.exists('capture.json')) this.pageUrl = String(session.readJson('capture.json').finalUrl).replace(/#.*$/, '');
  }

  get hasSourceMaps(): boolean {
    return Object.values(this.index).some((i) => i.map);
  }

  /**
   * @param callSite true si la posición es una llamada dentro de una función (p. ej. el origen de
   *   una petición) y no el inicio de la función: entonces se busca la función que la contiene.
   */
  locate(frame: Frame, callSite = false): Located {
    const url = frame.url.replace(/#.*$/, '');
    const where = `${frame.fn} · ${frame.url.split('/').pop()}:${frame.line}:${frame.column}`;
    if (url === this.pageUrl) {
      const served = this.session.exists('page-source.html');
      return { file: served ? 'page-source.html' : 'page.html', line: served ? frame.line : undefined, note: `${where} (script en línea)` };
    }
    const info = this.index[frame.url] ?? this.index[url];
    if (info?.map && info.dir) {
      try {
        let consumer = this.consumers.get(info.map);
        if (!consumer) {
          consumer = new SourceMapConsumer(this.session.readJson(info.map));
          this.consumers.set(info.map, consumer);
        }
        const pos = consumer.originalPositionFor({ line: frame.line, column: Math.max(0, frame.column - 1) });
        if (pos?.source && pos.line) {
          const rel = `${info.dir}/${cleanSourcePath(pos.source, 0)}`;
          let name: string | undefined = callSite ? undefined : (pos.name ?? undefined);
          const exists = this.session.exists(rel);
          if (exists) {
            // El nombre minificado no dice nada: se lee el nombre real en el código original.
            const lines = this.session.read(rel).split('\n');
            name = (callSite ? enclosingFunction(lines, pos.line - 1) : declaredName(lines[pos.line - 1] ?? '')) ?? name;
          }
          const original = `${name ?? (frame.fn.length > 2 ? frame.fn : '(anónima)')} en ${String(pos.source).replace(/^(?:[.][.][/])+/, "")}:${pos.line}`;
          if (exists) return { file: rel, line: pos.line, note: `${where} → original`, original, originalName: name };
          return { file: info.map, note: `${where} → ${original} (fuente no volcada)`, original };
        }
      } catch {
        /* mapa ilegible: se cae al script crudo */
      }
    }
    const raw = info?.raw ?? this.rawByUrl.get(frame.url) ?? this.rawByUrl.get(url);
    if (raw) return { file: raw, line: frame.line, note: `${where}${frame.column > 200 ? ` (columna ${frame.column}; script minificado)` : ''}` };
    return { file: 'network/requests.jsonl', note: `${where} (script no capturado)` };
  }
}
