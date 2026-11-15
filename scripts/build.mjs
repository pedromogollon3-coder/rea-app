// Empaqueta el servidor MCP y la CLI en dist/. Todo va incluido salvo Playwright,
// de modo que el plugin arranca sin node_modules y solo necesita Playwright para abrir páginas.
import { build } from 'esbuild';
import fs from 'node:fs';

fs.rmSync('dist', { recursive: true, force: true });

const common = {
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  external: ['playwright'],
  legalComments: 'none',
  // Algunas dependencias empaquetadas son CommonJS y usan require().
  banner: { js: "import { createRequire as __reaCreateRequire } from 'node:module';\nconst require = __reaCreateRequire(import.meta.url);" },
};

await build({ ...common, entryPoints: ['src/mcp/main.ts'], outfile: 'dist/mcp.mjs' });
await build({ ...common, entryPoints: ['src/cli/index.ts'], outfile: 'dist/cli.mjs', banner: { js: `#!/usr/bin/env node\n${common.banner.js}` } });

await build({ ...common, entryPoints: ['src/core/index.ts'], outfile: 'dist/index.mjs' });

for (const f of ['dist/mcp.mjs', 'dist/cli.mjs', 'dist/index.mjs']) console.log(`${f}  ${(fs.statSync(f).size / 1024).toFixed(0)} KB`);
