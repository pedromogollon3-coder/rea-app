import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Carpeta raíz del paquete (donde está package.json), tanto en dist/ como en src/. */
export function packageRoot(): string {
  if (process.env.CLAUDE_PLUGIN_ROOT && fs.existsSync(path.join(process.env.CLAUDE_PLUGIN_ROOT, 'package.json'))) return process.env.CLAUDE_PLUGIN_ROOT;
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  return process.cwd();
}

/**
 * Instala Playwright y su Chromium. Toda la salida va a stderr para no
 * interferir con el protocolo MCP, que usa stdout.
 */
export function runSetup(): { ok: boolean; log: string[] } {
  const root = packageRoot();
  const log: string[] = [];
  const run = (cmd: string, args: string[]) => {
    log.push(`$ ${cmd} ${args.join(' ')}  (en ${root})`);
    const r = spawnSync(cmd, args, { cwd: root, shell: process.platform === 'win32', stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
    const tail = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim().split('\n').slice(-6).join('\n');
    if (tail) log.push(tail);
    process.stderr.write(`${tail}\n`);
    return r.status === 0;
  };
  if (!fs.existsSync(path.join(root, 'node_modules', 'playwright'))) {
    if (!run('npm', ['install', '--omit=dev', '--no-audit', '--no-fund'])) return { ok: false, log };
  }
  const ok = run('npx', ['playwright', 'install', 'chromium']);
  return { ok, log };
}
