import fs from 'node:fs';
import readline from 'node:readline';
import { parseArgs } from 'node:util';
import {
  act,
  authAnalysis,
  buildReport,
  domMap,
  ETHICS_NOTICE,
  isRecording,
  LiveApp,
  networkAnalysis,
  realtimeAnalysis,
  routesAnalysis,
  runSetup,
  runtimeAnalysis,
  scriptsAnalysis,
  Session,
  stackAnalysis,
  startRecording,
  stateAnalysis,
  stopRecording,
  storageAnalysis,
  VERSION,
  type AppAction,
  type ToolResult,
} from '../core/index.js';

const HELP = `rea-app ${VERSION} — ingeniería inversa de aplicaciones web con evidencia

Uso:
  rea-app explorar <url> [--pregunta "..."]        abre una ventana: tú inicias sesión y usas la aplicación;
                                                    Enter registra la vista, g graba un flujo, q termina e informa
  rea-app analizar <url> [--acciones <json|archivo>] [--pregunta "..."] [--visible]
                                                    análisis automático, sin intervención → informe.md
  rea-app rutas|api|tiempo-real|estado|runtime|auth|almacenamiento|stack|scripts|vista --sesion <carpeta>
  rea-app informe --sesion <carpeta> [--pregunta "..."] [--analisis <archivo>]
  rea-app setup                                     instala Chromium de Playwright
  rea-app mcp                                       inicia el servidor MCP (stdio)

Opciones:
  --salida <carpeta>     raíz de salida (por defecto ./rea-app-out)
  --sin-robots           no consultar robots.txt (solo aplicaciones propias o autorizadas)
  --privacidad <modo>    auto (por defecto) | privado | abierto
  --capturas <modo>      auto (por defecto) | siempre | nunca
  --intervalo <ms>       pausa mínima entre peticiones propias al mismo host (por defecto 500)
  --json                 imprime el resultado completo en JSON

Acciones (JSON): [{"tipo":"click","selector":"#tab-mercado"},{"tipo":"escribir","selector":"#filtro","texto":"sol"}]
Tipos: click, escribir, tecla, hover, scroll, navegar, esperar.

${ETHICS_NOTICE}`;

function print(r: ToolResult<any>, json: boolean): void {
  if (json) {
    console.log(JSON.stringify(r, null, 2));
    return;
  }
  console.log(`\n── ${r.tool} ──`);
  for (const f of r.findings) {
    const ev = f.evidence[0];
    console.log(`  [${f.id}] ${f.title}${ev ? `  (${ev.file}${ev.line ? `:${ev.line}` : ''})` : ''}`);
  }
  if (r.unknowns.length) console.log(`  Sin confirmar: ${r.unknowns.length} punto(s)`);
}

function readText(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return fs.existsSync(value) ? fs.readFileSync(value, 'utf8') : value;
}

function readActions(value: string | undefined): AppAction[] {
  const parsed = JSON.parse(readText(value) ?? 'null');
  if (!Array.isArray(parsed)) throw new Error('--acciones debe ser un arreglo JSON (o la ruta a un archivo que lo contenga).');
  return parsed as AppAction[];
}

const OFFLINE: Record<string, (s: Session) => ToolResult<any> | Promise<ToolResult<any>>> = {
  rutas: routesAnalysis,
  api: networkAnalysis,
  'tiempo-real': realtimeAnalysis,
  estado: stateAnalysis,
  runtime: runtimeAnalysis,
  auth: authAnalysis,
  almacenamiento: storageAnalysis,
  stack: stackAnalysis,
  scripts: (s) => scriptsAnalysis(s),
  vista: domMap,
};

async function finish(app: LiveApp, pregunta: string | undefined, analisis: string | undefined, json: boolean): Promise<void> {
  const s = app.session;
  await app.close();
  for (const run of [routesAnalysis, networkAnalysis, realtimeAnalysis, stateAnalysis, runtimeAnalysis, authAnalysis]) print(run(s), json);
  const rep = await buildReport(s, { pregunta, analisis });
  console.log(`\nInforme:   ${rep.data.informe}\nEvidencia: ${rep.data.evidencia}\n${rep.data.hallazgos} hallazgos, ${rep.data.incognitas} incógnitas.`);
}

/** Sesión interactiva: el usuario maneja la aplicación en la ventana y dirige el análisis desde el terminal. */
async function explore(app: LiveApp, json: boolean): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string) => new Promise<string>((resolve) => rl.question(q, (a) => resolve(a.trim())));
  console.log('\nLa aplicación está abierta en la ventana. Inicia sesión si hace falta (REA APP no toca tus credenciales) y úsala con normalidad.');
  console.log('  Enter      registrar la vista actual (puedes escribir antes un nombre)\n  g          empezar / terminar la grabación de un flujo\n  e          ver el estado\n  q          terminar y generar el informe\n');
  try {
    for (;;) {
      if (app.closed) {
        console.log('La ventana se cerró.');
        break;
      }
      const answer = await ask(isRecording(app) ? '[grabando] > ' : '> ');
      if (answer === 'q') break;
      if (answer === 'e') {
        console.log(await app.status());
      } else if (answer === 'g') {
        if (isRecording(app)) print(await stopRecording(app), json);
        else {
          const name = (await ask('Nombre del flujo: ')) || 'flujo';
          await startRecording(app, name);
          console.log('Grabando. Haz el flujo en la ventana y pulsa g para terminar.');
        }
      } else {
        const view = await app.snapshot(answer || undefined);
        console.log(`Vista ${view.n} registrada: ${view.name} (${view.route}) — ${view.elements} elementos${view.private ? ', modo privado' : ''}`);
      }
    }
    if (isRecording(app) && !app.closed) print(await stopRecording(app), json);
  } finally {
    rl.close();
  }
}

async function main(): Promise<number> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      pregunta: { type: 'string' },
      acciones: { type: 'string' },
      analisis: { type: 'string' },
      sesion: { type: 'string' },
      salida: { type: 'string' },
      intervalo: { type: 'string' },
      privacidad: { type: 'string' },
      capturas: { type: 'string' },
      visible: { type: 'boolean', default: false },
      'sin-robots': { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
      version: { type: 'boolean', short: 'v', default: false },
    },
  });
  const [command, arg] = positionals;
  const json = !!values.json;
  if (values.version) {
    console.log(VERSION);
    return 0;
  }
  if (values.help || !command) {
    console.log(HELP);
    return command ? 0 : 1;
  }
  const openOpts = (visible: boolean) => ({
    visible,
    outRoot: values.salida,
    respectRobots: !values['sin-robots'],
    minIntervalMs: values.intervalo ? Number(values.intervalo) : undefined,
    privacy: values.privacidad as 'auto' | 'privado' | 'abierto' | undefined,
    screenshots: values.capturas as 'auto' | 'siempre' | 'nunca' | undefined,
  });
  const session = () => {
    if (!values.sesion) throw new Error('Falta --sesion <carpeta>.');
    return Session.open(values.sesion);
  };

  if (command === 'explorar' || command === 'analizar') {
    if (!arg) throw new Error('Falta la URL.');
    const interactive = command === 'explorar';
    print(await LiveApp.open(arg, openOpts(interactive || !!values.visible)), json);
    const app = LiveApp.require();
    try {
      print(await scriptsAnalysis(app.session), json);
      if (interactive) await explore(app, json);
      else if (values.acciones) print(await act(app, readActions(values.acciones)), json);
      if (!app.closed) await app.snapshot('final');
    } finally {
      await finish(app, values.pregunta, readText(values.analisis), json);
    }
    return 0;
  }
  if (OFFLINE[command]) {
    print(await OFFLINE[command](session()), json);
    return 0;
  }
  switch (command) {
    case 'informe': {
      const rep = await buildReport(session(), { pregunta: values.pregunta, analisis: readText(values.analisis) });
      console.log(`Informe:   ${rep.data.informe}\nEvidencia: ${rep.data.evidencia}`);
      return 0;
    }
    case 'setup': {
      const r = runSetup();
      console.log(r.ok ? 'Chromium instalado.' : 'La instalación falló.');
      return r.ok ? 0 : 1;
    }
    case 'mcp':
      await import('../mcp/main.js');
      return -1; // el servidor sigue vivo
    default:
      console.error(`Comando desconocido: ${command}\n`);
      console.log(HELP);
      return 1;
  }
}

main()
  .then((code) => {
    if (code >= 0) process.exit(code);
  })
  .catch(async (e: Error) => {
    await LiveApp.current?.close().catch(() => {});
    console.error(`${e.name}: ${e.message}`);
    process.exit(1);
  });
