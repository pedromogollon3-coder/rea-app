// Aplicación de ejemplo de REA APP: un terminal de mercados ficticio con acceso, rutas sin recarga,
// API autenticada, WebSocket de precios, Server-Sent Events, lienzo, WebAssembly y un worker.
// La usan las pruebas y `npm run demo`. Nada de lo que muestra es real.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(here, 'public');

/** Credenciales de prueba de la aplicación de ejemplo (no sirven en ningún otro sitio). */
export const DEMO_USER = 'demo';
export const DEMO_PASS = 'faro-demo-2026';
/** Datos «privados» de ejemplo: las pruebas comprueban que no llegan a los archivos de salida. */
export const DEMO_IBAN = 'ES76 2100 0418 4502 0005 1332';
export const DEMO_HOLDER = 'Valentina Ordóñez Ferrán';

const SYMBOLS = [
  { codigo: 'SOL', nombre: 'Solaria Demo', ultimo: 148.2 },
  { codigo: 'LUNA', nombre: 'Lunar Ejemplo', ultimo: 62.75 },
  { codigo: 'MAR', nombre: 'Mareas Ficticias', ultimo: 23.4 },
];

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.wasm': 'application/wasm', '.txt': 'text/plain; charset=utf-8' };

// (module (func (export "sumar") (param i32 i32) (result i32) local.get 0 local.get 1 i32.add))
const WASM = Buffer.from([0, 97, 115, 109, 1, 0, 0, 0, 1, 7, 1, 96, 2, 127, 127, 1, 127, 3, 2, 1, 0, 7, 9, 1, 5, 115, 117, 109, 97, 114, 0, 0, 10, 9, 1, 7, 0, 32, 0, 32, 1, 106, 11]);

async function buildBundle() {
  const { build } = await import('esbuild');
  const result = await build({
    absWorkingDir: here,
    entryPoints: ['src/main.js'],
    outdir: 'assets',
    bundle: true,
    splitting: true,
    format: 'esm',
    minify: true,
    sourcemap: 'linked',
    write: false,
    logLevel: 'silent',
  });
  const files = new Map();
  for (const f of result.outputFiles) files.set('/assets/' + path.basename(f.path), f.text);
  return files;
}

function json(res, status, body, headers = {}) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

/** Inicia la aplicación de ejemplo. `port: 0` elige un puerto libre. */
export async function startDemoApp(port = 0) {
  const assets = await buildBundle();
  const sessions = new Map();
  const sockets = new Set();
  const streams = new Set();
  const timers = new Set();
  let orders = [
    { id: 1001, simbolo: 'SOL', lado: 'compra', cantidad: 5, estado: 'ejecutada' },
    { id: 1002, simbolo: 'MAR', lado: 'venta', cantidad: 12, estado: 'pendiente' },
  ];

  const sessionOf = (req) => {
    const sid = /(?:^|;\s*)sid=([^;]+)/.exec(req.headers.cookie ?? '')?.[1];
    const s = sid && sessions.get(sid);
    if (!s) return null;
    const bearer = /^Bearer (.+)$/.exec(req.headers.authorization ?? '')?.[1];
    return { ...s, sid, bearerOk: bearer === s.token };
  };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const p = url.pathname;

    if (p === '/robots.txt') {
      res.writeHead(200, { 'content-type': TYPES['.txt'] });
      return res.end('User-agent: *\nDisallow: /interno/\n');
    }
    if (assets.has(p)) {
      res.writeHead(200, { 'content-type': p.endsWith('.map') ? TYPES['.json'] : TYPES['.js'] });
      return res.end(assets.get(p));
    }
    if (p === '/calc.wasm') {
      res.writeHead(200, { 'content-type': TYPES['.wasm'] });
      return res.end(WASM);
    }

    if (p.startsWith('/api/')) {
      if (p === '/api/sesion' && req.method === 'POST') {
        const body = await readBody(req);
        if (body.usuario !== DEMO_USER || body.clave !== DEMO_PASS) return json(res, 401, { error: 'credenciales' });
        const sid = randomBytes(18).toString('hex');
        const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: DEMO_USER })).toString('base64url')}.${randomBytes(24).toString('base64url')}`;
        const csrf = randomBytes(16).toString('hex');
        sessions.set(sid, { token, csrf });
        return json(res, 200, { token, csrf, usuario: { id: 7, nombre: DEMO_HOLDER } }, { 'set-cookie': `sid=${sid}; Path=/; HttpOnly; SameSite=Strict` });
      }
      const s = sessionOf(req);
      if (p === '/api/yo') {
        if (!s || !s.bearerOk) return json(res, 401, { error: 'no-autenticado' });
        return json(res, 200, { csrf: s.csrf, usuario: { id: 7, nombre: DEMO_HOLDER } });
      }
      // EventSource no puede enviar cabeceras propias: los avisos se autentican solo con la cookie.
      if (!s || (!s.bearerOk && p !== '/api/avisos')) return json(res, 401, { error: 'no-autenticado' });
      if (p === '/api/sesion' && req.method === 'DELETE') {
        sessions.delete(s.sid);
        return json(res, 200, { ok: true }, { 'set-cookie': 'sid=; Path=/; Max-Age=0' });
      }
      if (p === '/api/cuenta') return json(res, 200, { iban: DEMO_IBAN, titular: DEMO_HOLDER, divisa: 'EUR' });
      if (p === '/api/saldo') return json(res, 200, { disponible: 12345.67, retenido: 250, actualizado: new Date().toISOString() });
      if (p === '/api/simbolos') return json(res, 200, { lista: SYMBOLS });
      if (p.startsWith('/api/historico/')) {
        const base = SYMBOLS.find((x) => x.codigo === p.split('/').pop())?.ultimo ?? 50;
        const velas = Array.from({ length: Number(url.searchParams.get('velas') ?? 60) }, (_, i) => ({ t: Date.now() - (60 - i) * 60000, cierre: Math.round((base + Math.sin(i / 5) * base * 0.03) * 100) / 100 }));
        return json(res, 200, { simbolo: p.split('/').pop(), velas });
      }
      if (p === '/api/ordenes' && req.method === 'GET') return json(res, 200, { ordenes: orders });
      if (p === '/api/ordenes' && req.method === 'POST') {
        if (req.headers['x-csrf-token'] !== s.csrf) return json(res, 403, { error: 'csrf' });
        const body = await readBody(req);
        const orden = { id: 1001 + orders.length, simbolo: String(body.simbolo), lado: String(body.lado), cantidad: Number(body.cantidad), estado: 'pendiente' };
        orders = [...orders, orden];
        return json(res, 201, { orden });
      }
      if (p === '/api/avisos') {
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
        streams.add(res);
        const send = () => res.write(`event: aviso\ndata: ${JSON.stringify({ texto: 'Mercado abierto', nivel: 'info' })}\n\n`);
        send();
        const timer = setInterval(send, 700);
        timers.add(timer);
        req.on('close', () => {
          clearInterval(timer);
          timers.delete(timer);
          streams.delete(res);
        });
        return;
      }
      return json(res, 404, { error: 'no-encontrado' });
    }

    // Archivos estáticos; cualquier otra ruta sirve la aplicación (enrutado en el cliente).
    const rel = decodeURIComponent(p.slice(1));
    let file = path.join(PUBLIC, rel);
    if (!rel || !file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(PUBLIC, 'index.html');
    const headers = { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' };
    if (file.endsWith('.html')) {
      Object.assign(headers, { server: 'faro-app/1.0', 'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY', 'referrer-policy': 'same-origin', 'content-security-policy': "default-src 'self'; connect-src 'self' ws: wss:; script-src 'self' 'wasm-unsafe-eval'" });
    }
    res.writeHead(200, headers);
    res.end(fs.readFileSync(file));
  });

  // WebSocket mínimo (RFC 6455): precios del símbolo suscrito y latido.
  server.on('upgrade', (req, socket) => {
    if (req.url !== '/ws') return socket.destroy();
    const accept = createHash('sha1').update(req.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
    sockets.add(socket);
    let symbol = 'SOL';
    const send = (obj) => {
      const payload = Buffer.from(JSON.stringify(obj));
      if (!socket.destroyed && payload.length < 126) socket.write(Buffer.concat([Buffer.from([0x81, payload.length]), payload]));
    };
    const ticks = setInterval(() => {
      const base = SYMBOLS.find((x) => x.codigo === symbol)?.ultimo ?? 50;
      send({ type: 'tick', s: symbol, p: Math.round((base + (Math.random() - 0.5) * base * 0.02) * 100) / 100, t: Date.now() });
    }, 150);
    const pings = setInterval(() => send({ type: 'ping', t: Date.now() }), 500);
    timers.add(ticks);
    timers.add(pings);
    socket.on('data', (buf) => {
      // Decodifica frames de texto cortos enmascarados por el cliente.
      try {
        const len = buf[1] & 0x7f;
        if ((buf[0] & 0x0f) !== 1 || len >= 126) return;
        const mask = buf.subarray(2, 6);
        const data = Buffer.from(buf.subarray(6, 6 + len).map((b, i) => b ^ mask[i % 4]));
        const msg = JSON.parse(data.toString());
        if (msg.type === 'subscribe' && Array.isArray(msg.symbols)) symbol = String(msg.symbols[0]);
      } catch {
        /* frame no reconocido */
      }
    });
    socket.on('error', () => {});
    socket.on('close', () => {
      clearInterval(ticks);
      clearInterval(pings);
      timers.delete(ticks);
      timers.delete(pings);
      sockets.delete(socket);
    });
  });

  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
  const actual = server.address().port;
  return {
    port: actual,
    url: `http://localhost:${actual}`,
    close: () =>
      new Promise((resolve) => {
        for (const t of timers) clearInterval(t);
        for (const s of sockets) s.destroy();
        for (const r of streams) r.destroy();
        server.closeAllConnections?.();
        server.close(() => resolve());
      }),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const demo = await startDemoApp(Number(process.env.PORT ?? 4174));
  console.log(`Aplicación de ejemplo de REA APP en ${demo.url}\nAcceso de prueba: usuario «${DEMO_USER}», contraseña «${DEMO_PASS}»\nPruébala con:  /rea-app ${demo.url} ¿cómo llegan los precios al gráfico?\nCtrl+C para detenerla.`);
}
