import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
// @ts-expect-error módulo JS sin tipos
import { DEMO_HOLDER, DEMO_IBAN, DEMO_PASS, DEMO_USER, startDemoApp } from '../examples/demo-app/server.mjs';
import { act, authAnalysis, buildReport, LiveApp, networkAnalysis, PolicyError, realtimeAnalysis, routesAnalysis, runtimeAnalysis, scriptsAnalysis, Session, startRecording, stateAnalysis, stopRecording, type ToolResult } from '../src/core/index.js';
import { limiter } from '../src/core/policy.js';

let demo: { url: string; port: number; close: () => Promise<void> };
let outRoot: string;
let app: LiveApp;
let session: Session;
let opened: ToolResult<any>;

function allFiles(dir: string, out: string[] = []): string[] {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) allFiles(full, out);
    else out.push(full);
  }
  return out;
}

beforeAll(async () => {
  demo = await startDemoApp(0);
  outRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'rea-app-test-'));
  limiter.minIntervalMs = 20; // servidor local
  opened = await LiveApp.open(demo.url + '/', { outRoot, visible: false });
  app = LiveApp.require();
  session = app.session;
});

afterAll(async () => {
  await LiveApp.current?.close();
  await demo?.close();
  if (outRoot) fs.rmSync(outRoot, { recursive: true, force: true });
});

describe('app_open', () => {
  it('deja la aplicación abierta y detecta el formulario de acceso sin cruzarlo', async () => {
    expect(opened.data.barriers).toContain('formulario de inicio de sesión');
    expect(opened.data.authenticated).toBe(false);
    expect(opened.data.private).toBe(false);
    expect(path.basename(path.dirname(session.dir))).toBe(`localhost_${demo.port}`);
    expect(app.views).toHaveLength(1);
    expect(app.views[0].route).toBe('/acceso');
    expect(session.exists(app.views[0].screenshot!)).toBe(true); // vista pública: se permite la captura
    const status = await app.status();
    expect(status).toMatchObject({ esperandoInicioDeSesion: true, sesionIniciada: false, modoPrivado: false });
    expect(opened.findings.some((f) => f.title.includes('Barrera detectada') && f.detail!.includes('no introduce credenciales'))).toBe(true);
  });

  it('respeta robots.txt y rechaza URLs que no son http(s)', async () => {
    // Estas llamadas fallan antes de tocar la aplicación abierta.
    await expect(LiveApp.open('javascript:alert(1)', { outRoot })).rejects.toThrow(PolicyError);
    expect(LiveApp.current).toBe(app);
  });

  it('se niega a escribir la contraseña y a enviar el inicio de sesión', async () => {
    const r = await act(app, [
      { tipo: 'escribir', selector: '#clave', texto: 'no-deberia-escribirse' },
      { tipo: 'click', selector: '#acceso button' },
    ]);
    expect(r.data.nuevo.pasos.every((p) => p.rechazada && !p.ok)).toBe(true);
    expect(await app.page.inputValue('#clave')).toBe('');
    expect(app.rec.entries.some((e) => e.url.includes('/api/sesion') && e.method === 'POST')).toBe(false);
  });
});

describe('app_scripts', () => {
  it('recupera los módulos originales del bundle dividido', async () => {
    await app.sync();
    const r = await scriptsAnalysis(session);
    const main = r.data.scripts.find((s) => s.url.endsWith('/assets/main.js'))!;
    expect(main).toMatchObject({ mapa: 'recuperado' });
    expect(session.read(`${main.dirFuentes}/src/router.js`)).toContain('export function navegar');
  });
});

describe('sesión iniciada por el usuario', () => {
  it('pasa a modo privado cuando el usuario entra por su cuenta', async () => {
    // La prueba hace de usuario: escribe sus credenciales de prueba directamente en la página.
    await app.page.fill('#usuario', DEMO_USER);
    await app.page.fill('#clave', DEMO_PASS);
    await app.page.click('#acceso button');
    await app.page.waitForFunction(() => /\d/.test(document.getElementById('saldo')?.textContent ?? ''));
    await app.page.waitForTimeout(2800); // el panel sondea el saldo cada 600 ms
    const status = await app.status();
    expect(status).toMatchObject({ esperandoInicioDeSesion: false, sesionIniciada: true, modoPrivado: true });
  });

  it('en modo privado la vista se registra sin captura y sin texto visible', async () => {
    const view = await app.snapshot('panel');
    expect(view).toMatchObject({ route: '/panel', private: true });
    expect(view.screenshot).toBeUndefined();
    const html = session.read(`${view.dir}/page.html`);
    expect(html).not.toContain(DEMO_IBAN);
    expect(html).not.toContain(DEMO_HOLDER);
    expect(html).not.toContain('12.345');
    expect(html).toContain('·····');
    expect(html).toContain('id="saldo"'); // la estructura se conserva
  });
});

describe('app_act', () => {
  it('relaciona un clic con la función, la ruta, la petición y el mensaje WebSocket', async () => {
    const r = await act(app, [{ tipo: 'click', selector: 'tr[data-simbolo="LUNA"]' }, { tipo: 'click', selector: 'button[data-simbolo="MAR"]' }], 'elegir símbolo');
    const [elegir, cambiar] = r.data.nuevo.pasos;
    expect(elegir.ok).toBe(true);
    expect(elegir.manejadores[0]).toMatchObject({ evento: 'click', funcion: 'alElegirSimbolo', ejecutado: true });
    expect(elegir.manejadores[0].donde.file).toMatch(/sources\/.*\/src\/vistas\.js$/);
    expect(elegir.funciones.map((f) => f.funcion)).toEqual(expect.arrayContaining(['seleccionarSimbolo', 'navegar', 'vistaMercado']));
    expect(elegir.rutas.some((x) => x.kind === 'pushState' && x.url.endsWith('/mercado/LUNA'))).toBe(true);
    expect(elegir.peticiones.some((p) => p.url.includes('/api/historico/LUNA') && p.estado === 200)).toBe(true);
    expect(elegir.peticiones.find((p) => p.url.includes('/api/historico'))!.iniciador).toContain('src/api.js');
    expect(elegir.urlDespues).toContain('/mercado/LUNA');
    expect(cambiar.mensajes.some((m) => m.clave === 'type=subscribe')).toBe(true);
    expect(cambiar.funciones.map((f) => f.funcion)).toContain('suscribir');
    expect(elegir.captura).toBeUndefined(); // modo privado
    const line = elegir.peticiones.find((p) => p.url.includes('/api/historico'))!.linea;
    expect(JSON.parse(session.read('network/requests.jsonl').split('\n')[line - 1]).url).toContain('/api/historico/LUNA');
  });

  it('detecta el código cargado bajo demanda y se niega a accionar una operación', async () => {
    const r = await act(app, [{ tipo: 'click', selector: 'a[href="/ordenes"]' }, { tipo: 'click', selector: '#enviar-orden' }], 'órdenes');
    const [abrir, enviar] = r.data.nuevo.pasos;
    expect(abrir.trozos.length).toBeGreaterThanOrEqual(1);
    expect(abrir.peticiones.some((p) => p.url.endsWith('/api/ordenes') && p.metodo === 'GET')).toBe(true);
    expect(enviar.rechazada).toContain('operación con efectos reales');
    expect(app.rec.entries.some((e) => e.url.endsWith('/api/ordenes') && e.method === 'POST')).toBe(false);
  });
});

describe('app_record', () => {
  it('graba lo que hace el usuario sin registrar lo que escribe', async () => {
    await startRecording(app, 'enviar una orden');
    // La prueba hace de usuario.
    await app.page.fill('#orden-cantidad', '37');
    await app.page.waitForTimeout(300);
    await app.page.click('#enviar-orden');
    await app.page.waitForFunction(() => document.querySelectorAll('#lista-ordenes tr').length === 3);
    await app.page.waitForTimeout(600);
    const r = await stopRecording(app);
    const flow = r.data.nuevo;
    expect(flow.modo).toBe('manual');
    const escribir = flow.pasos.find((p) => p.gesto.startsWith('escribir'))!;
    expect(escribir.gesto).toContain('2 caracteres');
    expect(escribir.funciones.map((f) => f.funcion)).not.toContain('enviarOrden'); // cada función, en su paso
    const enviar = flow.pasos.find((p) => p.gesto.includes('«Enviar orden»'))!;
    expect(enviar.gesto).toContain('enviar el formulario');
    expect(enviar.peticiones.some((p) => p.metodo === 'POST' && p.url.endsWith('/api/ordenes') && p.estado === 201)).toBe(true);
    expect(enviar.funciones.map((f) => f.funcion)).toEqual(expect.arrayContaining(['enviarOrden', 'crearOrden']));
    expect(enviar.dom.anadidos.some((a) => a.nodos.startsWith('tr.fila-orden'))).toBe(true);
    await app.snapshot('órdenes');
  });
});

describe('análisis de la aplicación', () => {
  it('app_routes: enrutador, rutas visitadas, declaradas y carga diferida', () => {
    const r = routesAnalysis(session);
    expect(r.data.enrutador).toContain('History API');
    expect(r.data.visitadas.map((v) => v.ruta)).toEqual(expect.arrayContaining(['/panel', '/mercado/LUNA', '/ordenes']));
    const declared = r.data.declaradas.map((d) => d.ruta);
    expect(declared).toEqual(expect.arrayContaining(['/mercado/:simbolo', '/ajustes/seguridad']));
    expect(r.unknowns.some((u) => u.includes('no se visitaron'))).toBe(true);
    expect(r.data.cargaDiferida.some((c) => c.ruta === '/ordenes')).toBe(true);
    expect(r.data.vistas.length).toBeGreaterThanOrEqual(3);
  });

  it('app_api: endpoints con autenticación, vista de origen y función que los llama', () => {
    const r = networkAnalysis(session);
    const ordenes = r.data.endpoints.find((e) => e.ruta === '/api/ordenes' && e.metodo === 'POST')!;
    expect(ordenes.auth).toEqual(expect.arrayContaining(['cookie', 'authorization: bearer', 'cabecera anti-CSRF x-csrf-token']));
    expect(ordenes.vistas).toContain('/ordenes');
    expect(ordenes.cuerpo).toContain('cantidad: number');
    expect(ordenes.iniciadorOriginal).toMatch(/src\/api\.js/);
    const cuenta = r.data.endpoints.find((e) => e.ruta === '/api/cuenta')!;
    expect(cuenta.respuesta).toContain('iban: string');
    expect(JSON.stringify(r.data)).not.toContain(DEMO_IBAN);
  });

  it('app_realtime: protocolo del WebSocket, SSE y sondeo', () => {
    const r = realtimeAnalysis(session);
    const ws = r.data.websockets[0];
    expect(ws.protocol).toBe('json');
    const keys = (dir: string) => ws.groups.filter((g) => g.dir === dir).map((g) => g.key);
    expect(keys('recibido')).toEqual(expect.arrayContaining(['type=tick', 'type=ping']));
    expect(keys('enviado')).toEqual(expect.arrayContaining(['type=subscribe', 'type=pong']));
    expect(ws.groups.find((g) => g.key === 'type=tick')!.shape).toContain('p: number');
    expect(ws.latido).toContain('type=ping');
    expect(r.data.sse.urls.some((u) => u.endsWith('/api/avisos'))).toBe(true);
    expect(r.data.sse.eventos.aviso).toBeGreaterThanOrEqual(1);
    expect(r.data.sondeo.some((s) => s.endpoint.endsWith('/api/saldo'))).toBe(true);
  });

  it('app_state: forma del almacén y de la configuración, sin valores', () => {
    const r = stateAnalysis(session);
    const store = r.data.stores.find((s) => s.kind === 'Redux')!;
    expect(Object.keys(store.shape)).toEqual(['sesion', 'mercado', 'ordenes', 'ui']);
    expect(r.data.globals.map((g) => g.name)).toContain('FARO_CONFIG');
    expect(r.findings.some((f) => f.title.includes('window.FARO_CONFIG'))).toBe(true);
    expect(JSON.stringify(r.data)).not.toContain(DEMO_HOLDER);
  });

  it('app_runtime: lienzo, WebAssembly y worker', () => {
    const r = runtimeAnalysis(session);
    expect(r.data.lienzos[0]).toMatchObject({ contexto: '2d', mayor: '960×280' });
    expect(r.data.wasm[0].muestra).toContain('function sumar');
    expect(r.data.workers.some((w) => w.tipo === 'Worker' && w.url.endsWith('/worker.js'))).toBe(true);
    expect(r.data.renderizado).toContain('mixto');
    expect(r.unknowns.some((u) => u.includes('WebAssembly'))).toBe(true);
  });

  it('app_auth: describe el mecanismo sin secretos', () => {
    const r = authAnalysis(session);
    expect(r.data.estado).toMatchObject({ sesionIniciada: true, privado: true });
    expect(r.data.esquemas.map((s) => s.mecanismo)).toEqual(expect.arrayContaining(['cookie', 'authorization: bearer']));
    const login = r.data.endpoints.find((e) => e.ruta === '/api/sesion' && e.metodo === 'POST')!;
    expect(login.estableceCookies).toContain('sid');
    expect(r.data.endpoints.some((e) => e.ruta === '/api/yo' && e.estados.includes(401))).toBe(true);
    expect(r.data.almacenado).toEqual(expect.arrayContaining([expect.objectContaining({ clave: 'faro.token', donde: 'sessionStorage', tipo: 'jwt' }), expect.objectContaining({ clave: 'sid' })]));
    expect(r.findings.some((f) => f.title.includes('Formulario de acceso en /acceso'))).toBe(true);
  });
});

describe('app_report y cierre', () => {
  it('escribe el informe con evidencias que existen', async () => {
    const r = await buildReport(session, { pregunta: '¿Cómo llegan los precios al gráfico?', analisis: 'Los precios llegan por WebSocket [TRE-01].' });
    const md = session.read('informe.md');
    for (const h of ['## 1. Resumen', '## 2. Arquitectura de la aplicación', '### 2.1 Rutas y vistas', '### 3.2 Tiempo real', '### 3.3 Autenticación y sesión', '## 4. Flujos analizados', '## 6. Evidencias', '## 7. Incógnitas']) expect(md, h).toContain(h);
    expect(md).toContain('iniciada a mano por el usuario');
    expect(md).toContain('`type=tick`');
    expect(md).not.toContain('![Captura'); // modo privado
    const evidence = session.readJson('evidence.json');
    expect(evidence.hallazgos.length).toBe(r.data.hallazgos);
    for (const f of evidence.hallazgos) {
      expect(f.evidence.length, f.id).toBeGreaterThan(0);
      for (const e of f.evidence) {
        expect(session.exists(e.file), `${f.id} → ${e.file}`).toBe(true);
        if (e.line && fs.statSync(session.abs(e.file)).isFile()) expect(session.read(e.file).split('\n').length, `${f.id} → ${e.file}:${e.line}`).toBeGreaterThanOrEqual(e.line);
      }
    }
  });

  it('al cerrar escribe el HAR enmascarado y ningún archivo contiene datos del usuario', async () => {
    await app.close();
    expect(LiveApp.current).toBeNull();
    expect(session.exists('captura.har')).toBe(true);
    const har = session.read('captura.har');
    expect(har).toContain('/api/sesion');
    for (const file of allFiles(outRoot)) {
      if (/\.png$/.test(file)) continue;
      const text = fs.readFileSync(file, 'utf8');
      for (const secret of [DEMO_PASS, DEMO_IBAN, DEMO_HOLDER, '2100 0418', 'eyJhbGciOiJIUzI1NiJ9.']) expect(text.includes(secret), `${secret} en ${file}`).toBe(false);
    }
    // Tras el cierre el análisis sin conexión sigue disponible.
    expect(routesAnalysis(Session.open(session.dir)).data.vistas.length).toBeGreaterThanOrEqual(3);
  });
});
