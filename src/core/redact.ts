/**
 * Enmascarado de secretos y datos personales.
 * Todo texto que el motor escribe a disco o devuelve pasa por aquí.
 */

export const SENSITIVE_NAME =
  /(pass(word|wd)?|contrase|secret|token|auth|session|sess|sid$|^sid|cookie|csrf|xsrf|api[-_]?key|apikey|access[-_]?key|private|credential|signature|jwt|bearer|otp|pin$|ssn|dni|cedula|card|cvv|cvc|iban|email|correo|phone|telefono|tel$|address|direccion)/i;

const SENSITIVE_HEADERS = new Set([
  'cookie',
  'set-cookie',
  'authorization',
  'proxy-authorization',
  'x-api-key',
  'x-auth-token',
  'x-csrf-token',
  'x-xsrf-token',
]);

const JWT = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{4,}\b/g;
const BEARER = /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/gi;
const EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}\b/g;
const KNOWN_KEYS =
  /\b(sk-[A-Za-z0-9_-]{20,}|sk_(live|test)_[A-Za-z0-9]{16,}|pk_(live|test)_[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{35})\b/g;
const CARD = /\b(?:\d[ -]?){13,19}\b/g;
/** "token": "valor"  |  token=valor  (en JSON, cabeceras o cadenas de consulta) */
const KEY_VALUE =
  /(["']?[\w.-]*(?:password|passwd|secret|token|api[-_]?key|apikey|session[-_]?id|sessionid|csrf|xsrf|credential|access[-_]?key)[\w.-]*["']?\s*[:=]\s*)(["']?)([^"'\s&;,}<>]{6,})\2/gi;

function luhn(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/** Enmascara secretos reconocibles dentro de un texto libre. No cambia el número de líneas. */
export function redactText(input: string): string {
  if (!input) return input;
  return input
    .replace(JWT, '[JWT_ENMASCARADO]')
    .replace(BEARER, (_m, scheme) => `${scheme} [ENMASCARADO]`)
    .replace(KNOWN_KEYS, '[CLAVE_ENMASCARADA]')
    .replace(KEY_VALUE, (_m, pre, q) => `${pre}${q}[ENMASCARADO]${q}`)
    .replace(EMAIL, '[EMAIL_ENMASCARADO]')
    .replace(CARD, (m) => {
      const digits = m.replace(/\D/g, '');
      return digits.length >= 13 && digits.length <= 19 && luhn(digits) ? '[TARJETA_ENMASCARADA]' : m;
    });
}

const CODE_LITERAL =
  /((?:password|passwd|secret|token|api[-_]?key|apikey|access[-_]?key|client[-_]?secret)\w*["']?\s*[:=]\s*)(["'`])([^"'`\s]{12,})\2/gi;

/** Variante para código fuente: solo toca literales, no expresiones, para no romper la lectura. */
export function redactCode(input: string): string {
  if (!input) return input;
  return input
    .replace(JWT, '[JWT_ENMASCARADO]')
    .replace(BEARER, (_m, scheme) => `${scheme} [ENMASCARADO]`)
    .replace(KNOWN_KEYS, '[CLAVE_ENMASCARADA]')
    .replace(CODE_LITERAL, (_m, pre, q) => `${pre}${q}[ENMASCARADO]${q}`)
    .replace(EMAIL, '[EMAIL_ENMASCARADO]');
}

/** Variante para HTML: además oculta campos ocultos, campos sensibles y metas con tokens. */
export function redactHtml(input: string): string {
  if (!input) return input;
  const maskAttr = (tag: string, attr: string) =>
    tag.replace(new RegExp(`(\\s${attr}\\s*=\\s*)("[^"]*"|'[^']*')`, 'i'), (_m, pre) => `${pre}"[ENMASCARADO]"`);
  const html = input
    .replace(/<input\b[^>]*>/gi, (tag) => {
      const name = /\sname\s*=\s*["']?([^"'\s>]+)/i.exec(tag)?.[1] ?? '';
      const hidden = /\stype\s*=\s*["']?hidden/i.test(tag);
      return hidden || SENSITIVE_NAME.test(name) ? maskAttr(tag, 'value') : tag;
    })
    .replace(/<meta\b[^>]*>/gi, (tag) => (/(csrf|xsrf|token|api-?key)/i.test(tag) ? maskAttr(tag, 'content') : tag));
  return redactCode(html);
}

export type ValueKind =
  | 'vacío'
  | 'jwt'
  | 'json'
  | 'número'
  | 'booleano'
  | 'uuid'
  | 'fecha'
  | 'url'
  | 'hex'
  | 'base64'
  | 'texto';

/** Clasifica un valor sin revelarlo. */
export function classifyValue(v: string): ValueKind {
  if (v === '' || v == null) return 'vacío';
  if (/^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(v)) return 'jwt';
  if (/^(true|false)$/i.test(v)) return 'booleano';
  if (/^-?\d+(\.\d+)?$/.test(v)) return 'número';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) return 'uuid';
  if (/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2})?/.test(v)) return 'fecha';
  if (/^https?:\/\//i.test(v)) return 'url';
  if (/^[\[{]/.test(v.trim())) {
    try {
      JSON.parse(v);
      return 'json';
    } catch {
      /* no es JSON */
    }
  }
  if (/^[0-9a-f]{16,}$/i.test(v)) return 'hex';
  if (/^[A-Za-z0-9+/_-]{20,}={0,2}$/.test(v)) return 'base64';
  return 'texto';
}

/** Descripción segura de un valor: tipo y longitud, nunca el contenido. */
export function maskValue(v: string): { tipo: ValueKind; longitud: number; valor: string } {
  return { tipo: classifyValue(v), longitud: v.length, valor: '[ENMASCARADO]' };
}

function looksSecret(v: string): boolean {
  const k = classifyValue(v);
  return k === 'jwt' || ((k === 'hex' || k === 'base64') && v.length >= 24);
}

/** Enmascara valores sensibles en la cadena de consulta y credenciales en la URL. */
export function redactUrl(raw: string): string {
  if (raw.startsWith('data:')) return raw.slice(0, raw.indexOf(',') + 1 || 30) + '[…]';
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return redactText(raw);
  }
  if (u.username || u.password) {
    u.username = 'ENMASCARADO';
    u.password = '';
  }
  for (const [k, v] of [...u.searchParams.entries()]) {
    if (SENSITIVE_NAME.test(k) || looksSecret(v)) u.searchParams.set(k, 'ENMASCARADO');
  }
  if (u.hash && /(token|key|secret|code)=/i.test(u.hash)) u.hash = '#ENMASCARADO';
  return redactText(u.toString());
}

export function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    const lower = name.toLowerCase();
    if (lower === 'cookie' || lower === 'set-cookie') {
      // Se conservan los nombres de las cookies y sus atributos, nunca los valores.
      out[lower] = value
        .split(/\n/)
        .map((line) =>
          line
            .split(';')
            .map((part, i) => {
              const eq = part.indexOf('=');
              if (eq === -1) return part.trim();
              const key = part.slice(0, eq).trim();
              const isAttr = lower === 'set-cookie' && i > 0;
              return isAttr ? part.trim() : `${key}=[ENMASCARADO]`;
            })
            .join('; '),
        )
        .join('\n');
    } else if (SENSITIVE_HEADERS.has(lower) || /(token|secret|auth|api-?key|session)/i.test(lower)) {
      out[lower] = '[ENMASCARADO]';
    } else if (lower === 'referer' || lower === 'location') {
      out[lower] = redactUrl(value);
    } else {
      out[lower] = redactText(value);
    }
  }
  return out;
}

/** Limpia un HAR de Playwright: cabeceras, cookies, URLs y cuerpos enviados. */
export function redactHar(har: any): any {
  const entries = har?.log?.entries ?? [];
  const fixHeaders = (list: any[] | undefined) => {
    if (!Array.isArray(list)) return;
    for (const h of list) {
      const red = redactHeaders({ [h.name]: String(h.value ?? '') });
      h.value = Object.values(red)[0];
    }
  };
  for (const e of entries) {
    if (e.request) {
      e.request.url = redactUrl(String(e.request.url ?? ''));
      fixHeaders(e.request.headers);
      for (const c of e.request.cookies ?? []) c.value = '[ENMASCARADO]';
      for (const q of e.request.queryString ?? []) {
        if (SENSITIVE_NAME.test(q.name) || looksSecret(String(q.value))) q.value = '[ENMASCARADO]';
        else q.value = redactText(String(q.value));
      }
      if (e.request.postData) {
        const len = String(e.request.postData.text ?? '').length;
        e.request.postData.text = `[CUERPO_OMITIDO ${len} caracteres]`;
        for (const p of e.request.postData.params ?? []) p.value = '[ENMASCARADO]';
      }
    }
    if (e.response) {
      fixHeaders(e.response.headers);
      for (const c of e.response.cookies ?? []) c.value = '[ENMASCARADO]';
      if (e.response.redirectURL) e.response.redirectURL = redactUrl(String(e.response.redirectURL));
      if (e.response.content?.text) {
        e.response.content.text = '[CUERPO_OMITIDO]';
        delete e.response.content.encoding;
      }
    }
  }
  for (const p of har?.log?.pages ?? []) {
    if (p.title) p.title = redactUrl(String(p.title));
  }
  return har;
}

/** Oculta secuencias largas de dígitos (números de cuenta, importes, identificadores). */
export function maskDigits(input: string): string {
  return input ? input.replace(/\d[\d.,\s-]{2,}\d|\d{3,}/g, (m) => m.replace(/\d/g, '#')) : input;
}

/** Modo privado: además de lo sensible, oculta los números largos de la ruta y la consulta de una URL. */
export function privatizeUrl(raw: string): string {
  const mask = (s: string) => s.replace(/\d{4,}/g, (m) => '#'.repeat(Math.min(m.length, 8)));
  try {
    const u = new URL(raw);
    return `${u.origin}${mask(u.pathname)}${mask(u.search)}${mask(u.hash)}`;
  } catch {
    return mask(raw);
  }
}
