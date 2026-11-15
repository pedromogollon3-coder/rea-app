import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { LiveApp } from '../core/index.js';
import { createServer } from './server.js';

// stdout está reservado al protocolo MCP: cualquier registro va a stderr.
console.log = (...args: unknown[]) => console.error(...args);

// Al terminar el servidor se cierra el navegador: la sesión del usuario nunca queda abierta ni guardada.
let closing = false;
const shutdown = async () => {
  if (closing) return;
  closing = true;
  await LiveApp.current?.close().catch(() => {});
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.stdin.on('close', shutdown);

const server = createServer();
await server.connect(new StdioServerTransport());
console.error('rea-app: servidor MCP listo (stdio)');
