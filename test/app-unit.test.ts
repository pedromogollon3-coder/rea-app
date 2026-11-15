import { describe, expect, it } from 'vitest';
import { classifyFrame, HEARTBEAT } from '../src/core/wsproto.js';
import { maskDigits, privatizeUrl } from '../src/core/redact.js';
import { mergeEvents } from '../src/core/flow.js';
import { authOf } from '../src/core/recorder.js';
import { FORBIDDEN_OPERATION } from '../src/core/policy.js';
import { toActions } from '../src/mcp/server.js';
import type { UserEvent } from '../src/core/types.js';

describe('clasificación de mensajes WebSocket', () => {
  it('JSON con discriminador: tipo y forma, nunca valores', () => {
    const { protocol, messages } = classifyFrame(JSON.stringify({ type: 'tick', s: 'SOL', p: 148.2, cuenta: 'ES7621000418' }));
    expect(protocol).toBe('json');
    expect(messages[0].key).toBe('type=tick');
    expect(messages[0].shape).toContain('p: number');
    expect(JSON.stringify(messages)).not.toContain('ES7621000418');
    expect(JSON.stringify(messages)).not.toContain('148.2');
  });

  it('JSON sin discriminador se agrupa por sus claves', () => {
    expect(classifyFrame('{"b":1,"a":2}').messages[0].key).toBe('claves=a,b');
  });

  it('entramado con longitud prefijada (~m~), varios mensajes por frame y latido', () => {
    const body = JSON.stringify({ m: 'quote_add_symbols', p: ['qs_1', 'XYZ'] });
    const beat = '~h~42';
    const frame = `~m~${body.length}~m~${body}~m~${beat.length}~m~${beat}`;
    const { protocol, messages } = classifyFrame(frame);
    expect(protocol).toContain('~m~');
    expect(messages.map((m) => m.key)).toEqual(['m=quote_add_symbols', 'latido']);
    expect(HEARTBEAT.test(messages[1].key)).toBe(true);
  });

  it('Socket.IO: nombre del evento y latido', () => {
    const url = 'wss://x.test/socket.io/?EIO=4&transport=websocket';
    expect(classifyFrame('42["chat:mensaje",{"de":"ana","texto":"hola"}]', url)).toMatchObject({ protocol: 'socket.io', messages: [{ key: 'evento=chat:mensaje' }] });
    expect(classifyFrame('2', url).messages[0].key).toBe('latido');
    expect(classifyFrame('2').messages[0].key).toBe('texto=2'); // sin pista de Socket.IO es un texto cualquiera
  });

  it('SignalR, STOMP, texto y binario', () => {
    expect(classifyFrame('{"type":1,"target":"RecibirPrecio","arguments":[1]}\u001e{"type":6}\u001e').messages.map((m) => m.key)).toEqual(['target=RecibirPrecio', 'latido']);
    expect(classifyFrame('SUBSCRIBE\ndestination:/topic/precios\nid:0\n\n\u0000').messages[0].key).toBe('comando=SUBSCRIBE /topic/precios');
    expect(classifyFrame('ping').messages[0].key).toBe('latido');
    expect(classifyFrame(Buffer.from([1, 2, 3]))).toMatchObject({ protocol: 'binario', messages: [{ key: 'binario' }] });
  });
});

describe('modo privado', () => {
  it('oculta importes, cuentas e identificadores largos', () => {
    expect(maskDigits('Saldo: 12.345,67 €')).toBe('Saldo: ##.###,## €');
    expect(maskDigits('ES76 2100 0418 4502')).not.toMatch(/\d{3}/);
    expect(maskDigits('Paso 2 de 3')).toBe('Paso 2 de 3');
  });

  it('oculta los números de la ruta y la consulta, no el puerto', () => {
    expect(privatizeUrl('http://localhost:4174/cuentas/00491234/movimientos?desde=20260101&p=2')).toBe('http://localhost:4174/cuentas/########/movimientos?desde=########&p=2');
    expect(privatizeUrl('/cuentas/00491234')).toBe('/cuentas/########');
  });
});

describe('gestos del usuario', () => {
  const ev = (t: number, kind: UserEvent['kind'], selector: string, detail?: string, target = 'input'): UserEvent => ({ t, kind, selector, target, detail });

  it('funde ráfagas de escritura y de teclas, y asocia el envío al gesto que lo provoca', () => {
    const merged = mergeEvents([
      ev(0, 'escribir', '#q', '1 caracteres'),
      ev(120, 'escribir', '#q', '2 caracteres'),
      ev(260, 'escribir', '#q', '3 caracteres'),
      ev(900, 'tecla', '#q', 'ArrowDown'),
      ev(1100, 'tecla', '#q', 'ArrowDown'),
      ev(1500, 'tecla', '#q', 'Enter'),
      ev(1510, 'envio', '#f'),
      ev(9000, 'click', '#otro', undefined, 'button «Ver»'),
    ]);
    expect(merged.map((m) => m.kind)).toEqual(['escribir', 'tecla', 'tecla', 'click']);
    expect(merged[0].detail).toBe('3 caracteres');
    expect(merged[1].times).toBe(2);
    expect(merged[2].submits).toBe(true);
  });
});

describe('autenticación de una petición', () => {
  it('nombra los mecanismos sin exponer valores', () => {
    const auth = authOf({ cookie: 'sid=abc', authorization: 'Bearer eyJhbGciOi.x.y', 'x-csrf-token': 't0k3n', 'x-api-key': 'k', accept: '*/*' });
    expect(auth).toEqual(['cookie', 'authorization: bearer', 'cabecera anti-CSRF x-csrf-token', 'cabecera x-api-key']);
    expect(auth.join(' ')).not.toMatch(/abc|eyJ|t0k3n/);
  });
});

describe('límites de las acciones guiadas', () => {
  it('reconoce controles con efectos reales en español e inglés', () => {
    for (const label of ['Transferir', 'Enviar orden', 'Comprar', 'Sell', 'Place order', 'Confirmar', 'Eliminar cuenta', 'Pay', 'Firmar operación', 'Withdraw']) expect(FORBIDDEN_OPERATION.test(label), label).toBe(true);
    for (const label of ['Buscar', 'Ver detalle', 'Siguiente', 'Filtros', 'Panel', 'Ordenar por fecha', 'Mercado']) expect(FORBIDDEN_OPERATION.test(label), label).toBe(false);
  });

  it('valida las acciones que llegan por MCP', () => {
    expect(toActions([{ tipo: 'navegar', ruta: '/panel' }, { tipo: 'esperar' }])).toEqual([{ tipo: 'navegar', ruta: '/panel' }, { tipo: 'esperar', ms: 1000 }]);
    expect(() => toActions([{ tipo: 'click' }])).toThrow(/selector/);
    expect(() => toActions([{ tipo: 'escribir', selector: '#q' }])).toThrow(/texto/);
  });
});
