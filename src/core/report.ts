import fs from 'node:fs';
import path from 'node:path';
import type { CaptureMeta, Evidence, Finding, ToolResult } from './types.js';
import { VERSION } from './types.js';
import { ETHICS_NOTICE } from './policy.js';
import { Session } from './session.js';
import { domMap } from './dom.js';
import { networkAnalysis, type NetworkData } from './network.js';
import { scriptsAnalysis, type ScriptsData } from './scripts.js';
import { storageAnalysis } from './storage.js';
import { stackAnalysis, type StackData } from './stack.js';
import { authAnalysis, realtimeAnalysis, routesAnalysis, runtimeAnalysis, stateAnalysis, type RealtimeData, type RoutesData, type RuntimeData } from './appmap.js';
import { syncIfLive } from './live.js';
import { redactText } from './redact.js';

const cell = (s: unknown) => String(s ?? '').replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ').trim();
const cite = (e: Evidence) => `\`${e.file}${e.line ? `:${e.line}` : ''}\``;

function bullets(findings: Finding[]): string {
  if (!findings.length) return '_Sin hallazgos en esta área._\n';
  return (
    findings
      .map((f) => {
        const refs = f.evidence.slice(0, 3).map(cite).join(', ');
        return `- **${f.title}** [${f.id}]${f.confidence !== 'alta' ? ` _(confianza ${f.confidence})_` : ''}${f.detail ? `\n  ${f.detail.replace(/\n/g, '\n  ')}` : ''}${refs ? `\n  Evidencia: ${refs}` : ''}`;
      })
      .join('\n') + '\n'
  );
}

function listFiles(dir: string, base = dir, out: string[] = []): string[] {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) listFiles(full, base, out);
    else out.push(path.relative(base, full).replace(/\\/g, '/'));
  }
  return out;
}

export interface ReportOptions {
  pregunta?: string;
  /** Explicación redactada por el analista (Claude) a partir de la evidencia. Markdown. */
  analisis?: string;
  thirdPartyMaps?: boolean;
}

/** app_report: reúne todos los análisis en informe.md y evidence.json. */
export async function buildReport(session: Session, opts: ReportOptions = {}): Promise<ToolResult<{ informe: string; evidencia: string; hallazgos: number; incognitas: number }>> {
  await syncIfLive(session);
  const meta = session.readJson<CaptureMeta>('capture.json');
  const open = session.loadResult<CaptureMeta>('app_open');
  const view = domMap(session);
  const scripts = session.loadResult<ScriptsData>('app_scripts') ?? (await scriptsAnalysis(session, { thirdPartyMaps: opts.thirdPartyMaps }));
  const api = networkAnalysis(session);
  const routes = routesAnalysis(session);
  const realtime = realtimeAnalysis(session);
  const state = stateAnalysis(session);
  const runtime = runtimeAnalysis(session);
  const auth = authAnalysis(session);
  const storage = storageAnalysis(session);
  const stack = stackAnalysis(session);
  const flows = session.loadResult<any>('app_flows');
  const results = [open, routes, view, scripts, api, realtime, state, runtime, auth, storage, stack, flows].filter((r): r is ToolResult<any> => !!r);
  const findings = results.flatMap((r) => r.findings);
  const unknowns = results.flatMap((r) => r.unknowns.map((texto) => ({ herramienta: r.tool, texto })));
  const nd = api.data as NetworkData;
  const sd = stack.data as StackData;
  const rd = routes.data as RoutesData;
  const td = realtime.data as RealtimeData;
  const ud = runtime.data as RuntimeData;
  const pregunta = opts.pregunta?.trim() ? redactText(opts.pregunta.trim()) : '';
  const analisis = opts.analisis?.trim() ? redactText(opts.analisis.trim()) : '';

  const own = nd.endpoints.filter((e) => !e.terceros);
  const techs = sd.tecnologias.map((t) => `${t.nombre}${t.version ? ` ${t.version}` : ''}`);
  const recovered = scripts.data.scripts.filter((s) => s.fuentes > 0);
  const stores = (state.data.stores ?? []).map((s: any) => s.kind);
  const summary = [
    `**${meta.title || meta.host}** — ${rd.vistas.length} vista(s) registradas, ${rd.visitadas.length} ruta(s) visitadas. ${rd.enrutador}.`,
    techs.length ? `Tecnologías de cliente: ${techs.join(', ')}.` : 'No se identificó un framework de cliente.',
    `Renderizado: ${ud.renderizado}.${ud.wasm.length ? ` ${ud.wasm.length} módulo(s) WebAssembly.` : ''}${ud.workers.length ? ` ${ud.workers.length} worker(s).` : ''}`,
    `${scripts.data.scripts.length} scripts; ${recovered.length ? `código original recuperado de ${recovered.length} source map(s) (${recovered.reduce((s, x) => s + x.fuentes, 0)} módulos)` : 'sin source maps públicos'}.`,
    own.length ? `${own.length} endpoint(s) propios${nd.graphql.length ? `, ${nd.graphql.length} operación(es) GraphQL` : ''}.` : 'No se observaron llamadas a API propias.',
    td.websockets.length || td.sse.urls.length || td.sondeo.length ? `Tiempo real: ${td.websockets.length} WebSocket(s)${td.sse.urls.length ? `, ${td.sse.urls.length} flujo(s) SSE` : ''}${td.sondeo.length ? `, ${td.sondeo.length} endpoint(s) con sondeo` : ''}.` : 'Sin canales en tiempo real.',
    stores.length ? `Estado: ${stores.join(', ')}.` : 'No se localizó un almacén de estado accesible.',
    meta.authenticated ? 'El usuario inició sesión durante el análisis: la sesión se trató en modo privado.' : meta.barriers.length ? `Barreras detectadas y no superadas: ${meta.barriers.join(', ')}.` : '',
    flows ? `${flows.data.flujos.length} flujo(s) analizados (${flows.data.flujos.reduce((s: number, t: any) => s + t.pasos.length, 0)} pasos).` : '',
  ].filter(Boolean);

  const L: string[] = [];
  L.push(`# Informe de ingeniería inversa: ${meta.host}`, '');
  L.push(`> Generado por REA APP v${VERSION} el ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC. ${ETHICS_NOTICE}`, '');
  L.push('| Dato | Valor |', '|---|---|');
  L.push(`| Aplicación | ${cell(meta.url)} |`);
  L.push(`| Título | ${cell(meta.title)} |`, `| Estado HTTP inicial | ${meta.status} |`, `| Abierta | ${meta.capturedAt} |`, `| Navegador | ${cell(meta.browser)}${meta.visible ? ' (ventana visible)' : ''} |`);
  L.push(`| Sesión de usuario | ${meta.authenticated ? 'iniciada a mano por el usuario' : 'no iniciada'} |`);
  L.push(`| Modo privado | ${meta.private ? 'sí: sin capturas, texto del HTML oculto y dígitos enmascarados' : 'no'} |`);
  L.push(`| robots.txt | ${meta.robots.respected ? `respetado (${meta.robots.rule ?? 'sin regla aplicable'})` : 'no consultado a petición del usuario'} |`, '');
  if (!meta.private && session.exists('screenshots/pagina.png')) L.push('![Captura de la aplicación](screenshots/pagina.png)', '');

  L.push('## 1. Resumen', '', ...summary.map((s) => `- ${s}`), '');
  if (pregunta) L.push('### Pregunta planteada', '', `> ${pregunta.replace(/\n/g, '\n> ')}`, '');
  if (analisis) L.push('### Análisis', '', analisis, '');

  const by = (area: string) => findings.filter((f) => f.area === area);
  L.push('## 2. Arquitectura de la aplicación', '');
  L.push('### 2.1 Rutas y vistas', '', bullets(by('rutas')));
  if (rd.vistas.length) {
    L.push('| # | Vista | Ruta | Elementos | Formularios | Lienzos | Privada |', '|---|---|---|---|---|---|---|');
    for (const v of rd.vistas) L.push(`| ${v.n} | ${cell(v.name)} | \`${cell(v.route)}\` | ${v.elements} | ${v.forms} | ${v.canvases} | ${v.private ? 'sí' : 'no'} |`);
    L.push('');
  }
  L.push('### 2.2 Entorno de ejecución y renderizado', '', bullets(by('runtime')));
  L.push('### 2.3 Scripts y lógica de cliente', '', bullets(by('scripts')));
  if (scripts.data.pistas.length) {
    L.push('Puntos de entrada localizados en el código propio:', '', '| Tipo | Ubicación | Código |', '|---|---|---|');
    for (const p of scripts.data.pistas.slice(0, 30)) L.push(`| ${p.tipo} | \`${p.archivo}:${p.linea}\` | \`${cell(p.texto).replace(/`/g, "'")}\` |`);
    L.push('');
  }
  L.push('### 2.4 Estado', '', bullets(by('estado')));
  L.push('### 2.5 Estructura de la última vista', '', bullets(by('vista')));

  L.push('## 3. Datos y comunicación', '');
  L.push('### 3.1 API', '', bullets(by('api')));
  if (nd.endpoints.length) {
    L.push('| Método | Ruta | Origen | Estado | Parámetros | Autenticación | Desde | Disparado por | Evidencia |', '|---|---|---|---|---|---|---|---|---|');
    for (const e of nd.endpoints.slice(0, 80)) {
      L.push(
        `| ${e.metodo} | \`${cell(e.ruta)}\` | ${cell(e.origen)}${e.terceros ? ' (tercero)' : ''} | ${e.estados.join(', ')} | ${cell(Object.entries(e.parametros).map(([k, v]) => `${k}: ${v}`).join(', ')) || '—'} | ${cell(e.auth.join(', ')) || '—'} | ${cell(e.vistas.slice(0, 3).join(', ')) || '—'} | ${e.iniciadorOriginal ? cell(e.iniciadorOriginal) : e.iniciador ? `${cell(e.iniciador.fn)} (${cell(e.iniciador.url.split('/').pop())}:${e.iniciador.line})` : '—'} | ${e.lineas.slice(0, 2).map((l) => `\`network/requests.jsonl:${l}\``).join(', ')} |`,
      );
    }
    L.push('');
    for (const e of own.filter((x) => x.respuesta).slice(0, 20)) {
      L.push(`**\`${e.metodo} ${e.ruta}\`**${e.cuerpo ? ` — cuerpo enviado: \`${cell(e.cuerpo.replace(/\s+/g, ' ')).slice(0, 200).replace(/`/g, "'")}\`` : ''} — respuesta (esquema inferido, sin valores):`, '', '```ts', e.respuesta!, '```', '');
    }
  }
  if (nd.graphql.length) {
    L.push('**GraphQL**', '', '| Tipo | Operación | Variables | Endpoint | Evidencia |', '|---|---|---|---|---|');
    for (const g of nd.graphql.slice(0, 40)) L.push(`| ${g.type} | ${cell(g.name)} | ${cell(g.variables.join(', ')) || '—'} | ${cell(g.url)} | \`network/requests.jsonl:${g.linea}\` |`);
    L.push('');
  }
  L.push('### 3.2 Tiempo real', '', bullets(by('tiemporeal')));
  for (const ws of td.websockets) {
    L.push(`**${cell(ws.url)}** — ${ws.protocol || 'entramado desconocido'}${ws.latido ? `; latido ${ws.latido}` : ''}`, '', '| Dirección | Tipo de mensaje | Veces | Tamaño medio | Forma |', '|---|---|---|---|---|');
    for (const g of [...ws.groups].sort((a, b) => a.dir.localeCompare(b.dir) || b.count - a.count).slice(0, 40)) {
      L.push(`| ${g.dir} | \`${cell(g.key)}\` | ${g.count} | ${Math.round(g.bytes / g.count)} B | \`${cell(g.shape).slice(0, 160).replace(/`/g, "'")}\` |`);
    }
    L.push('');
  }
  L.push('### 3.3 Autenticación y sesión', '', bullets(by('auth')));
  L.push('### 3.4 Almacenamiento en el navegador', '', bullets(by('almacenamiento')));
  if (nd.terceros.length) {
    L.push('### 3.5 Terceros', '', '| Dominio | Categoría | Peticiones | Tipos |', '|---|---|---|---|');
    for (const t of nd.terceros.slice(0, 40)) L.push(`| ${cell(t.host)} | ${t.categoria} | ${t.peticiones} | ${t.tipos.join(', ')} |`);
    L.push('');
  }

  L.push('## 4. Flujos analizados', '', flows ? bullets(by('flujo')) : '_No se analizó ningún flujo. Usa `app_record` (el usuario actúa y REA APP observa) o `app_act` (acciones guiadas) para ver qué código responde a cada gesto._\n');

  L.push('## 5. Stack tecnológico', '', bullets(by('stack')));
  if (sd.tecnologias.length) {
    L.push('| Tecnología | Tipo | Versión | Detectada por |', '|---|---|---|---|');
    for (const t of sd.tecnologias) L.push(`| ${cell(t.nombre)} | ${t.tipo} | ${t.version ?? '—'} | ${cell(t.via)} |`);
    L.push('');
  }
  L.push('| Cabecera de seguridad | Presente | Valor | Para qué sirve |', '|---|---|---|---|');
  for (const s of sd.seguridad) L.push(`| \`${s.cabecera}\` | ${s.presente ? 'sí' : 'no'} | ${s.valor ? `\`${cell(s.valor).slice(0, 90).replace(/`/g, "'")}\`` : '—'} | ${s.nota} |`);
  L.push('');

  L.push('## 6. Evidencias', '', 'Cada hallazgo cita archivos de esta carpeta (`archivo:línea`).', '', '| ID | Hallazgo | Confianza | Evidencia |', '|---|---|---|---|');
  for (const f of findings) {
    L.push(`| ${f.id} | ${cell(f.title).slice(0, 140)} | ${f.confidence} | ${f.evidence.slice(0, 5).map((e) => `${cite(e)}${e.note ? ` ${cell(e.note).slice(0, 90)}` : ''}`).join('<br>') || '—'} |`);
  }
  L.push('');

  L.push('## 7. Incógnitas', '', 'Lo que este análisis **no** pudo confirmar:', '');
  for (const u of unknowns) L.push(`- (${u.herramienta}) ${u.texto}`);
  L.push('');

  const files = listFiles(session.dir);
  const group = (prefix: string) => files.filter((x) => x.startsWith(prefix)).length;
  L.push('## 8. Archivos de la sesión', '');
  L.push('- `informe.md`, `evidence.json`: este informe y sus datos estructurados.');
  L.push(`- \`captura.har\`: tráfico de red con cabeceras y cuerpos sensibles enmascarados${files.includes('captura.har') ? '' : ' (se escribe al cerrar la aplicación con app_close)'}.`);
  L.push(`- \`views/\` (${rd.vistas.length} vistas), \`flows/\` (${group('flows/')}), \`network/\` (${group('network/')}), \`runtime/\`, \`state/\`, \`storage/\`.`);
  L.push(`- \`scripts/raw/\` (${group('scripts/raw/')}), \`sources/\` (${group('sources/')} fuentes recuperadas o embellecidas), \`screenshots/\` (${group('screenshots/')}), \`analysis/\` (${group('analysis/')}).`);
  L.push('');

  const informe = session.write('informe.md', L.join('\n'));
  const evidencia = session.writeJson('evidence.json', {
    herramienta: 'rea-app',
    version: VERSION,
    generado: new Date().toISOString(),
    objetivo: meta,
    pregunta: pregunta || undefined,
    hallazgos: findings,
    incognitas: unknowns,
    rutas: rd,
    endpoints: nd.endpoints,
    graphql: nd.graphql,
    tiempoReal: td,
    estado: state.data,
    runtime: ud,
    autenticacion: auth.data,
    stack: sd,
    flujos: flows?.data.flujos ?? [],
    archivos: files,
  });
  return {
    tool: 'app_report',
    session: session.dir,
    findings: [],
    unknowns: unknowns.map((u) => u.texto),
    files: [informe, evidencia],
    data: { informe: session.abs(informe), evidencia: session.abs(evidencia), hallazgos: findings.length, incognitas: unknowns.length },
  };
}
