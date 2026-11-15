// npm run setup — instala Playwright (si falta) y descarga su Chromium.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd, args) => spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' }).status === 0;

if (!fs.existsSync(path.join(root, 'node_modules', 'playwright'))) {
  console.log('Instalando Playwright…');
  if (!run('npm', ['install', '--omit=dev', '--no-audit', '--no-fund'])) process.exit(1);
}
console.log('Descargando Chromium de Playwright…');
process.exit(run('npx', ['playwright', 'install', 'chromium']) ? 0 : 1);
