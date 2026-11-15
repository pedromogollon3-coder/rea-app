import type { Schema } from './types.js';

const MAX_DEPTH = 6;
const MAX_PROPS = 40;
const MAX_ITEMS = 25;

function stringFormat(v: string): string | undefined {
  if (/^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/.test(v)) return 'fecha';
  if (/^https?:\/\//.test(v)) return 'url';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) return 'uuid';
  if (/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v)) return 'email';
  if (/^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(v)) return 'jwt';
  return undefined;
}

/** Infiere la forma de un valor JSON. No conserva ningún valor, solo tipos y nombres de claves. */
export function inferSchema(value: unknown, depth = 0): Schema {
  if (value === null) return { type: 'null' };
  if (typeof value === 'string') {
    const format = stringFormat(value);
    return format ? { type: 'string', format } : { type: 'string' };
  }
  if (typeof value === 'number') return { type: 'number' };
  if (typeof value === 'boolean') return { type: 'boolean' };
  if (depth >= MAX_DEPTH) return { type: 'unknown' };
  if (Array.isArray(value)) {
    let items: Schema | null = null;
    for (const item of value.slice(0, MAX_ITEMS)) {
      const s = inferSchema(item, depth + 1);
      items = items ? mergeSchemas(items, s) : s;
    }
    return { type: 'array', items, length: value.length };
  }
  if (typeof value === 'object') {
    const props: Record<string, Schema> = {};
    const keys = Object.keys(value as object);
    for (const k of keys.slice(0, MAX_PROPS)) {
      props[k] = inferSchema((value as Record<string, unknown>)[k], depth + 1);
    }
    return keys.length > MAX_PROPS ? { type: 'object', props, truncated: true } : { type: 'object', props };
  }
  return { type: 'unknown' };
}

export function mergeSchemas(a: Schema, b: Schema): Schema {
  if (a.type === 'object' && b.type === 'object') {
    const props: Record<string, Schema> = { ...a.props };
    for (const [k, v] of Object.entries(b.props)) props[k] = props[k] ? mergeSchemas(props[k], v) : v;
    return { type: 'object', props, ...(a.truncated || b.truncated ? { truncated: true } : {}) };
  }
  if (a.type === 'array' && b.type === 'array') {
    const items = a.items && b.items ? mergeSchemas(a.items, b.items) : (a.items ?? b.items);
    return { type: 'array', items, length: Math.max(a.length, b.length) };
  }
  if (a.type === b.type) {
    if (a.type === 'string' && b.type === 'string' && a.format !== b.format) return { type: 'string' };
    return a;
  }
  const list = [...(a.type === 'union' ? a.anyOf : [a]), ...(b.type === 'union' ? b.anyOf : [b])];
  const seen = new Map<string, Schema>();
  for (const s of list) {
    const prev = seen.get(s.type);
    seen.set(s.type, prev ? mergeSchemas(prev, s) : s);
  }
  const anyOf = [...seen.values()];
  return anyOf.length === 1 ? anyOf[0] : { type: 'union', anyOf };
}

/** Representa el esquema como un tipo estilo TypeScript, legible en el informe. */
export function schemaToText(s: Schema | null | undefined, indent = 0): string {
  if (!s) return 'unknown';
  const pad = '  '.repeat(indent);
  switch (s.type) {
    case 'object': {
      const keys = Object.keys(s.props);
      if (!keys.length) return '{}';
      const body = keys
        .map((k) => `${pad}  ${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${schemaToText(s.props[k], indent + 1)}`)
        .join('\n');
      return `{\n${body}${s.truncated ? `\n${pad}  …` : ''}\n${pad}}`;
    }
    case 'array':
      return `${schemaToText(s.items, indent)}[]`;
    case 'string':
      return s.format ? `string<${s.format}>` : 'string';
    case 'union':
      return s.anyOf.map((x) => schemaToText(x, indent)).join(' | ');
    default:
      return s.type;
  }
}

export function tryParseJson(text: string): unknown | undefined {
  const t = text.trim();
  if (!t || !/^[\[{"]|^-?\d|^(true|false|null)$/.test(t)) return undefined;
  try {
    return JSON.parse(t);
  } catch {
    return undefined;
  }
}
