// Comprueba el servidor MCP empaquetado (dist/mcp.mjs) por stdio, igual que lo lanza Claude Code:
// lista las herramientas, abre la aplicación de ejemplo, genera el informe y la cierra.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { startDemoApp } from '../examples/demo-app/server.mjs';

const demo = await startDemoApp(0);
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'rea-app-mcp-check-'));
const client = new Client({ name: 'mcp-check', version: '0' });
let code = 0;
try {
  await client.connect(new StdioClientTransport({ command: process.execPath, args: ['dist/mcp.mjs'], stderr: 'ignore' }));
  const { tools } = await client.listTools();
  console.log(`Herramientas (${tools.length}): ${tools.map((t) => t.name).join(', ')}`);
  const call = async (name, args = {}) => {
    const r = await client.callTool({ name, arguments: args });
    if (r.isError) throw new Error(`${name}: ${r.content[0].text}`);
    return JSON.parse(r.content[0].text);
  };
  const open = await call('app_open', { url: demo.url, visible: false, carpeta_salida: out });
  console.log(`app_open   → ${open.hallazgos.length} hallazgos; barreras: ${open.resumen.barriers.join(', ') || 'ninguna'}`);
  const rep = await call('app_report');
  console.log(`app_report → ${rep.resumen.hallazgos} hallazgos, informe ${fs.existsSync(rep.resumen.informe) ? 'escrito' : 'AUSENTE'}`);
  const closed = await call('app_close');
  const har = fs.existsSync(path.join(closed.sesion, 'captura.har'));
  console.log(`app_close  → HAR ${har ? 'escrito' : 'AUSENTE'}`);
  if (tools.length !== 17 || !fs.existsSync(rep.resumen.informe) || !har) code = 1;
} catch (e) {
  console.error(e.message);
  code = 1;
} finally {
  await client.close().catch(() => {});
  await demo.close();
  fs.rmSync(out, { recursive: true, force: true });
}
console.log(code ? 'FALLÓ' : 'OK: el servidor MCP empaquetado responde por stdio');
process.exit(code);
