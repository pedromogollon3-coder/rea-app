/**
 * Clasificación de mensajes de WebSocket: reconoce los entramados habituales y resume cada
 * mensaje como «tipo + forma». Nunca conserva el contenido.
 */
import { inferSchema, schemaToText, tryParseJson } from './schema.js';
import { redactText } from './redact.js';

export interface FrameMessage {
  /** Identificador del tipo de mensaje, p. ej. «type=quote» o «evento=join». */
  key: string;
  /** Forma del contenido (esquema compacto). */
  shape: string;
}

const DISCRIMINATORS = ['type', 'event', 'op', 'action', 'method', 'm', 'e', 'cmd', 'command', 'kind', 'msg', 'msgType', 'channel', 'topic', 'target', 'name', 't'];

const compact = (value: unknown) => schemaToText(inferSchema(value)).replace(/\s+/g, ' ').slice(0, 500);
const label = (v: unknown) => redactText(String(v)).replace(/\d{5,}/g, '#').slice(0, 40);

export const HEARTBEAT = /(^|=)(ping|pong|heartbeat|keep-?alive|hb|latido|h|2|3)$|latido/i;

function describeJson(value: unknown): FrameMessage {
  if (Array.isArray(value)) {
    const head = value[0];
    if (typeof head === 'string' && head.length <= 40) return { key: `evento=${label(head)}`, shape: compact(value.slice(1)) };
    return { key: `arreglo(${value.length})`, shape: compact(value) };
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const k of DISCRIMINATORS) {
      const v = obj[k];
      if ((typeof v === 'string' && v.length <= 60) || typeof v === 'number') return { key: `${k}=${label(v)}`, shape: compact(value) };
    }
    return { key: `claves=${Object.keys(obj).sort().slice(0, 6).join(',')}`, shape: compact(value) };
  }
  return { key: typeof value, shape: typeof value };
}

/** Devuelve el entramado detectado y los mensajes lógicos contenidos en un frame. */
export function classifyFrame(payload: string | Buffer, url = ''): { protocol: string; messages: FrameMessage[] } {
  if (typeof payload !== 'string') {
    return { protocol: 'binario', messages: [{ key: 'binario', shape: `binario (${payload.length} bytes)` }] };
  }
  const text = payload;

  // Entramado «~m~<longitud>~m~<contenido>» (el que usan los gráficos de TradingView).
  if (text.startsWith('~m~')) {
    const messages: FrameMessage[] = [];
    let pos = 0;
    while (pos < text.length && messages.length < 50) {
      const m = /^~m~(\d+)~m~/.exec(text.slice(pos, pos + 20));
      if (!m) break;
      const start = pos + m[0].length;
      const body = text.slice(start, start + Number(m[1]));
      pos = start + Number(m[1]);
      if (body.startsWith('~h~')) messages.push({ key: 'latido', shape: 'contador' });
      else {
        const json = tryParseJson(body);
        messages.push(json !== undefined ? describeJson(json) : { key: 'texto', shape: `texto (${body.length})` });
      }
    }
    if (messages.length) return { protocol: 'longitud-prefijada (~m~)', messages };
  }

  // Engine.IO / Socket.IO: dígitos de tipo de paquete y, opcionalmente, JSON.
  if (/socket\.io|engine\.io|[?&]EIO=/i.test(url)) {
    const m = /^(\d{1,2})([\s\S]*)$/.exec(text);
    if (m) {
      const [, code, rest] = m;
      if (!rest) return { protocol: 'socket.io', messages: [{ key: code === '2' || code === '3' ? 'latido' : `paquete=${code}`, shape: 'sin contenido' }] };
      const json = tryParseJson(rest.replace(/^[^\[{]*/, ''));
      if (Array.isArray(json) && typeof json[0] === 'string') return { protocol: 'socket.io', messages: [{ key: `evento=${label(json[0])}`, shape: compact(json.slice(1)) }] };
      if (json !== undefined) return { protocol: 'socket.io', messages: [{ key: `paquete=${code}`, shape: compact(json) }] };
    }
  }

  // SignalR: mensajes JSON separados por el carácter 0x1E.
  if (text.includes('\u001e')) {
    const messages = text
      .split('\u001e')
      .filter(Boolean)
      .slice(0, 50)
      .map((part): FrameMessage => {
        const json: any = tryParseJson(part);
        if (!json || typeof json !== 'object') return { key: 'texto', shape: `texto (${part.length})` };
        if (json.type === 6) return { key: 'latido', shape: '{ type: number }' };
        if (typeof json.target === 'string') return { key: `target=${label(json.target)}`, shape: compact(json) };
        return describeJson(json);
      });
    return { protocol: 'signalr', messages };
  }

  // STOMP: COMANDO, cabeceras, línea en blanco, cuerpo.
  const stomp = /^(CONNECT|CONNECTED|STOMP|SEND|SUBSCRIBE|UNSUBSCRIBE|MESSAGE|RECEIPT|ERROR|ACK|NACK|DISCONNECT)\r?\n/.exec(text);
  if (stomp) {
    const dest = /^destination:(.+)$/m.exec(text)?.[1]?.trim();
    return { protocol: 'stomp', messages: [{ key: `comando=${stomp[1]}${dest ? ` ${label(dest)}` : ''}`, shape: 'cabeceras + cuerpo' }] };
  }

  const json = tryParseJson(text);
  if (json !== undefined && json !== null && typeof json === 'object') return { protocol: 'json', messages: [describeJson(json)] };

  if (text.length <= 24 && /^[\w.:-]+$/.test(text)) {
    return { protocol: 'texto', messages: [{ key: /^(ping|pong|h|hb|heartbeat)$/i.test(text) ? 'latido' : `texto=${label(text)}`, shape: 'literal' }] };
  }
  return { protocol: 'texto', messages: [{ key: 'texto', shape: `texto (${text.length} caracteres)` }] };
}
