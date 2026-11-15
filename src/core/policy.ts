/**
 * Límites éticos del motor. Estas reglas se aplican en código, no solo en la documentación:
 *  - solo http/https;
 *  - ritmo de peticiones limitado por host;
 *  - robots.txt respetado salvo que el usuario lo desactive para un sitio propio;
 *  - los muros de acceso, CAPTCHAs, pagos y protecciones anti-bot se detectan y se reportan,
 *    nunca se intentan superar.
 */
import { VERSION } from './types.js';

export const USER_AGENT_SUFFIX = `rea-app/${VERSION}`;
export const DEFAULT_MIN_INTERVAL_MS = Number(process.env.REA_APP_MIN_INTERVAL_MS ?? 500);

export const ETHICS_NOTICE =
  'REA APP está pensada para aplicaciones propias, autorizadas o de estudio. No introduce credenciales ni evade inicios de sesión, CAPTCHAs, pagos o protecciones anti-bot; no acciona operaciones con efectos reales; limita el ritmo de peticiones y enmascara tokens, cookies y datos personales.';

export class PolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PolicyError';
  }
}

export function assertAllowedUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new PolicyError(`URL no válida: ${raw}`);
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new PolicyError(`Solo se admiten URLs http(s). Recibido: ${u.protocol}`);
  }
  if (u.username || u.password) {
    throw new PolicyError('No se admiten credenciales dentro de la URL.');
  }
  return u;
}

/** Garantiza un intervalo mínimo entre peticiones propias al mismo host. */
export class RateLimiter {
  private last = new Map<string, number>();
  constructor(public minIntervalMs = DEFAULT_MIN_INTERVAL_MS) {}

  async wait(host: string): Promise<void> {
    const now = Date.now();
    const next = Math.max(now, (this.last.get(host) ?? 0) + this.minIntervalMs);
    this.last.set(host, next);
    if (next > now) await new Promise((r) => setTimeout(r, next - now));
  }
}

export const limiter = new RateLimiter();

/** fetch con límite de ritmo, tiempo máximo y tamaño máximo. Solo GET. */
export async function politeFetch(
  url: string,
  opts: { timeoutMs?: number; maxBytes?: number } = {},
): Promise<{ ok: boolean; status: number; text: string; headers: Headers } | null> {
  const u = assertAllowedUrl(url);
  await limiter.wait(u.host);
  try {
    const res = await fetch(u, {
      headers: { 'user-agent': `Mozilla/5.0 (compatible; ${USER_AGENT_SUFFIX})` },
      signal: AbortSignal.timeout(opts.timeoutMs ?? 15000),
      redirect: 'follow',
    });
    const max = opts.maxBytes ?? 30 * 1024 * 1024;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > max) return null;
    return { ok: res.ok, status: res.status, text: buf.toString('utf8'), headers: res.headers };
  } catch {
    return null;
  }
}

interface RobotsGroup {
  agents: string[];
  rules: { allow: boolean; path: string }[];
}

export function parseRobots(text: string): RobotsGroup[] {
  const groups: RobotsGroup[] = [];
  let current: RobotsGroup | null = null;
  let lastWasAgent = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, '').trim();
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === 'user-agent') {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if ((key === 'allow' || key === 'disallow') && current) {
      lastWasAgent = false;
      if (value) current.rules.push({ allow: key === 'allow', path: value });
    } else {
      lastWasAgent = false;
    }
  }
  return groups;
}

function ruleMatches(rulePath: string, path: string): boolean {
  const anchored = rulePath.endsWith('$');
  const body = anchored ? rulePath.slice(0, -1) : rulePath;
  const re = new RegExp(
    '^' + body.split('*').map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + (anchored ? '$' : ''),
  );
  return re.test(path);
}

/** Decide si robots.txt permite la ruta (regla más específica gana; empate → permitir). */
export function robotsAllows(text: string, path: string, agent = 'rea-app'): { allowed: boolean; rule?: string } {
  const groups = parseRobots(text);
  const own = groups.filter((g) => g.agents.some((a) => a !== '*' && agent.toLowerCase().includes(a)));
  const pick = own.length ? own : groups.filter((g) => g.agents.includes('*'));
  let best: { allow: boolean; path: string } | null = null;
  for (const g of pick) {
    for (const r of g.rules) {
      if (!ruleMatches(r.path, path)) continue;
      if (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow)) best = r;
    }
  }
  if (!best) return { allowed: true };
  return { allowed: best.allow, rule: `${best.allow ? 'Allow' : 'Disallow'}: ${best.path}` };
}

export async function checkRobots(target: URL): Promise<{ allowed: boolean; rule?: string }> {
  const res = await politeFetch(new URL('/robots.txt', target).toString(), { timeoutMs: 8000, maxBytes: 512 * 1024 });
  if (!res || !res.ok) return { allowed: true };
  return robotsAllows(res.text, target.pathname + target.search);
}

/** Campos en los que la herramienta se niega a escribir. */
export const FORBIDDEN_INPUT =
  /(pass(word|wd)?|contrase|card|tarjeta|cvv|cvc|cc-|iban|ssn|otp|one-time|captcha)/i;

/** Controles en los que la herramienta se niega a hacer clic. */
export const FORBIDDEN_CLICK =
  /(captcha|pagar|pay\s*now|realizar\s+pago|checkout|comprar\s+ahora|buy\s+now|place\s+order|confirmar\s+(pedido|compra|pago))/i;

/**
 * Operaciones con efectos reales. En una aplicación (banca, trading, edición) REA APP nunca las
 * acciona por su cuenta: si interesa estudiarlas, las hace el usuario mientras se graba el flujo.
 */
export const FORBIDDEN_OPERATION =
  /\b(transferir|transferencia|transfer|enviar\s+dinero|send\s+money|wire|bizum|retirar|withdraw|depositar|deposit|comprar|buy|vender|sell|orden|order|operar|trade|invertir|invest|pagar|pay|firmar|sign|autorizar|authori[sz]e|confirmar|confirm|eliminar|borrar|delete|remove|cancelar\s+cuenta|close\s+account|dar\s+de\s+baja|publicar|publish|enviar|submit|send)\b/i;
