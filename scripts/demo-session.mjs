// Sesión de demostración de punta a punta contra la aplicación de ejemplo, usando la librería empaquetada.
// Hace de «usuario» con las credenciales de prueba de la aplicación de ejemplo (solo valen en ella).
// Uso: node scripts/demo-session.mjs [--visible] [--abierto] [--analisis archivo.md] [--salida carpeta]
//   --abierto  desactiva el modo privado y toma capturas (los datos de la aplicación de ejemplo son ficticios)
import fs from 'node:fs';
import { act, buildReport, LiveApp, scriptsAnalysis, startRecording, stopRecording } from '../dist/index.mjs';
import { DEMO_PASS, DEMO_USER, startDemoApp } from '../examples/demo-app/server.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const log = (r) => console.log(`── ${r.tool}: ${r.findings.length} hallazgos`);

const demo = await startDemoApp(Number(process.env.PORT ?? 4174));
let code = 0;
try {
  const open = flag('--abierto') ? { privacy: 'abierto', screenshots: 'siempre' } : {};
  log(await LiveApp.open(demo.url, { visible: flag('--visible'), outRoot: value('--salida'), ...open }));
  const app = LiveApp.require();
  log(await scriptsAnalysis(app.session));

  // El «usuario» inicia sesión por su cuenta: REA APP no participa en este paso.
  await app.page.fill('#usuario', DEMO_USER);
  await app.page.fill('#clave', DEMO_PASS);
  await app.page.click('#acceso button');
  await app.page.waitForFunction(() => /\d/.test(document.getElementById('saldo')?.textContent ?? ''));
  await app.page.waitForTimeout(2800);
  console.log(await app.status());
  await app.snapshot('panel');

  log(await act(app, [{ tipo: 'click', selector: 'tr[data-simbolo="LUNA"]' }], 'abrir un mercado'));
  await app.snapshot('mercado');
  log(await act(app, [{ tipo: 'click', selector: 'button[data-simbolo="MAR"]' }], 'cambiar de símbolo'));
  await app.page.waitForTimeout(1500);
  log(await act(app, [{ tipo: 'click', selector: 'a[href="/ordenes"]' }, { tipo: 'click', selector: '#enviar-orden' }], 'abrir órdenes'));

  // Una operación: la hace el «usuario» mientras se graba.
  await startRecording(app, 'enviar una orden');
  await app.page.fill('#orden-cantidad', '3');
  await app.page.waitForTimeout(400);
  await app.page.click('#enviar-orden');
  await app.page.waitForFunction(() => document.querySelectorAll('#lista-ordenes tr').length === 3);
  await app.page.waitForTimeout(700);
  log(await stopRecording(app));
  await app.snapshot('órdenes');

  const analisis = value('--analisis');
  const rep = await buildReport(app.session, { pregunta: '¿Cómo llegan los precios al gráfico y qué ocurre al cambiar de símbolo?', analisis: analisis ? fs.readFileSync(analisis, 'utf8') : undefined });
  await app.close();
  console.log(`\nInforme: ${rep.data.informe}\n${rep.data.hallazgos} hallazgos, ${rep.data.incognitas} incógnitas.`);
} catch (e) {
  console.error(e);
  code = 1;
  await LiveApp.current?.close().catch(() => {});
} finally {
  await demo.close();
}
process.exit(code);
