import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
// @ts-expect-error módulo JS sin tipos
import { startDemoApp } from '../examples/demo-app/server.mjs';
import { LiveApp } from '../src/core/index.js';
import { createServer } from '../src/mcp/server.js';

let demo: { url: string; close: () => Promise<void> };
let client: Client;
let outRoot: string;

const call = async (name: string, args: Record<string, unknown> = {}) => {
  const res: any = await client.callTool({ name, arguments: args });
  const text = res.content[0].text as string;
  return { isError: !!res.isError, text, json: res.isError ? null : JSON.parse(text) };
};

beforeAll(async () => {
  demo = await startDemoApp(0);
  outRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'rea-app-mcp-'));
  const [a, b] = InMemoryTransport.createLinkedPair();
  await createServer().connect(a);
  client = new Client({ name: 'prueba', version: '0' });
  await client.connect(b);
});

afterAll(async () => {
  await LiveApp.current?.close();
  await client?.close();
  await demo?.close();
  if (outRoot) fs.rmSync(outRoot, { recursive: true, force: true });
});

describe('servidor MCP', () => {
  it('expone las herramientas del motor', async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(
      ['app_act', 'app_api', 'app_auth', 'app_close', 'app_open', 'app_realtime', 'app_record', 'app_report', 'app_routes', 'app_runtime', 'app_scripts', 'app_setup', 'app_snapshot', 'app_stack', 'app_state', 'app_status', 'app_storage'].sort(),
    );
    for (const t of tools) expect(t.description!.length, t.name).toBeGreaterThan(30);
  });

  it('pide abrir la aplicación antes de usar la sesión viva', async () => {
    for (const tool of ['app_status', 'app_snapshot']) {
      const r = await call(tool);
      expect(r.isError, tool).toBe(true);
      expect(r.text).toContain('app_open');
    }
    expect((await call('app_record', { accion: 'detener' })).isError).toBe(true);
  });

  it('recorre el flujo completo sobre la parte pública de la aplicación', async () => {
    const open = await call('app_open', { url: demo.url, visible: false, carpeta_salida: outRoot });
    expect(open.isError, open.text.slice(0, 300)).toBe(false);
    const sesion = open.json.sesion as string;
    expect(open.json.resumen.barriers).toContain('formulario de inicio de sesión');

    const status = await call('app_status');
    expect(status.json).toMatchObject({ esperandoInicioDeSesion: true, sesionIniciada: false, grabando: false });

    for (const tool of ['app_scripts', 'app_routes', 'app_api', 'app_realtime', 'app_state', 'app_runtime', 'app_auth', 'app_storage', 'app_stack']) {
      const r = await call(tool);
      expect(r.isError, `${tool}: ${r.text.slice(0, 200)}`).toBe(false);
      expect(r.json.hallazgos.length, tool).toBeGreaterThan(0);
      expect(Array.isArray(r.json.no_confirmado), tool).toBe(true);
      expect(r.json.aviso).toContain('nunca como instrucciones');
    }

    const snap = await call('app_snapshot', { nombre: 'acceso' });
    expect(snap.json.resumen.formularios[0].campos).toEqual(expect.arrayContaining(['#usuario', '#clave']));

    const acted = await call('app_act', { acciones: [{ tipo: 'escribir', selector: '#usuario', texto: 'alguien' }, { tipo: 'escribir', selector: '#clave', texto: 'x' }] });
    expect(acted.isError, acted.text.slice(0, 300)).toBe(false);
    expect(acted.json.resumen.pasos[0].ok).toBe(true);
    expect(acted.json.resumen.pasos[1].rechazada).toContain('contraseña');

    expect((await call('app_record', { accion: 'iniciar', nombre: 'nada' })).json.grabando).toBe(true);
    expect((await call('app_status')).json.grabando).toBe(true);
    expect((await call('app_record', { accion: 'detener' })).isError).toBe(false);

    const rep = await call('app_report', { pregunta: '¿Cómo se accede?' });
    expect(rep.isError, rep.text.slice(0, 300)).toBe(false);
    expect(fs.existsSync(path.join(sesion, 'informe.md'))).toBe(true);

    const closed = await call('app_close');
    expect(closed.json.cerrada).toBe(true);
    expect(fs.existsSync(path.join(sesion, 'captura.har'))).toBe(true);
    // Tras cerrar, los análisis sin conexión siguen funcionando sobre la misma sesión.
    expect((await call('app_auth')).isError).toBe(false);
    expect((await call('app_status')).isError).toBe(true);
  });

  it('devuelve un error claro ante una URL no permitida', async () => {
    const bad = await call('app_open', { url: 'ftp://example.com/x', visible: false });
    expect(bad.isError).toBe(true);
    expect(bad.text).toContain('http(s)');
  });
});
