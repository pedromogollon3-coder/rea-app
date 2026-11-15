import fs from 'node:fs';
import path from 'node:path';
import type { Finding, ToolResult, Area, Confidence, Evidence } from './types.js';

/** Carpeta de salida de un análisis: rea-app-out/<dominio>/<fecha>/ */
export class Session {
  constructor(public readonly dir: string) {}

  static create(host: string, outRoot?: string): Session {
    const root = path.resolve(outRoot ?? process.env.REA_APP_OUT ?? path.join(process.env.CLAUDE_PROJECT_DIR ?? process.cwd(), 'rea-app-out'));
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
    const safeHost = host.replace(/[^A-Za-z0-9.-]/g, '_');
    const dir = path.join(root, safeHost, stamp);
    fs.mkdirSync(dir, { recursive: true });
    return new Session(dir);
  }

  static open(dir: string): Session {
    const abs = path.resolve(dir);
    if (!fs.existsSync(path.join(abs, 'capture.json')) && !fs.existsSync(path.join(abs, 'trace'))) {
      throw new Error(`No hay una sesión de REA APP en ${abs}. Ejecuta primero app_open.`);
    }
    return new Session(abs);
  }

  abs(rel: string): string {
    const full = path.resolve(this.dir, rel);
    if (!full.startsWith(path.resolve(this.dir))) throw new Error(`Ruta fuera de la sesión: ${rel}`);
    return full;
  }

  exists(rel: string): boolean {
    return fs.existsSync(this.abs(rel));
  }

  write(rel: string, content: string | Buffer): string {
    const full = this.abs(rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
    return rel.replace(/\\/g, '/');
  }

  writeJson(rel: string, value: unknown): string {
    return this.write(rel, JSON.stringify(value, null, 2));
  }

  read(rel: string): string {
    return fs.readFileSync(this.abs(rel), 'utf8');
  }

  readJson<T = any>(rel: string): T {
    return JSON.parse(this.read(rel)) as T;
  }

  readJsonl<T = any>(rel: string): T[] {
    if (!this.exists(rel)) return [];
    return this.read(rel)
      .split('\n')
      .filter(Boolean)
      .map((l) => JSON.parse(l) as T);
  }

  saveResult<T>(result: ToolResult<T>): ToolResult<T> {
    this.writeJson(`analysis/${result.tool}.json`, result);
    return result;
  }

  loadResult<T = any>(tool: string): ToolResult<T> | null {
    const rel = `analysis/${tool}.json`;
    return this.exists(rel) ? this.readJson<ToolResult<T>>(rel) : null;
  }
}

/** Acumula hallazgos numerados (DOM-01, RED-02…) para una herramienta. */
export class Findings {
  readonly list: Finding[] = [];
  readonly unknowns: string[] = [];
  constructor(
    private area: Area,
    private prefix: string,
  ) {}

  add(title: string, opts: { detail?: string; confidence?: Confidence; evidence?: Evidence[] } = {}): Finding {
    const f: Finding = {
      id: `${this.prefix}-${String(this.list.length + 1).padStart(2, '0')}`,
      area: this.area,
      title,
      detail: opts.detail,
      confidence: opts.confidence ?? 'alta',
      evidence: opts.evidence ?? [],
    };
    this.list.push(f);
    return f;
  }

  unknown(text: string): void {
    this.unknowns.push(text);
  }
}

/** Número de línea (1-based) de la primera aparición de `needle` en `haystack`. */
export function lineOf(haystack: string, needle: string, from = 0): number | undefined {
  if (!needle) return undefined;
  const idx = haystack.indexOf(needle, from);
  if (idx === -1) return undefined;
  let line = 1;
  for (let i = 0; i < idx; i++) if (haystack.charCodeAt(i) === 10) line++;
  return line;
}

export function slug(input: string, max = 60): string {
  const s = input
    .replace(/^https?:\/\//, '')
    .replace(/[?#].*$/, '')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return (s.length > max ? s.slice(s.length - max) : s) || 'recurso';
}
