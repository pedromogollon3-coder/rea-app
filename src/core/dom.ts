import type { ToolResult, Evidence } from './types.js';
import type { DomSnapshot } from './page-scripts.js';
import { Findings, lineOf, Session } from './session.js';

/** app_view: estructura de la página a partir de la captura. */
export function domMap(session: Session): ToolResult<DomSnapshot> {
  const dom = session.readJson<DomSnapshot>('dom/snapshot.json');
  const html = session.read('page.html');
  const f = new Findings('vista', 'VIS');
  const at = (open: string, note?: string): Evidence => ({ file: 'page.html', line: lineOf(html, open) ?? lineOf(html, open.slice(0, 40)), note });

  f.add(`Documento con ${dom.counts.elements} elementos y profundidad máxima ${dom.counts.maxDepth}`, {
    detail: `${dom.counts.stylesheets} hojas de estilo, ${dom.counts.iframes} iframes, ${dom.counts.shadowHosts} raíces shadow DOM.`,
    evidence: [{ file: 'dom/snapshot.json' }, { file: 'page.html', line: 1 }],
  });

  if (dom.sections.length) {
    const top = dom.sections.slice(0, 12);
    f.add(`${dom.sections.length} secciones o regiones identificadas`, {
      detail: top.map((s) => `${s.role ? `${s.tag}[role=${s.role}]` : s.tag}${s.label ? ` «${s.label}»` : ''} → ${s.selector}`).join('; '),
      evidence: top.slice(0, 6).map((s) => at(s.open, s.selector)),
    });
  } else {
    f.unknown('La página no usa elementos semánticos (header, main, section…): la división en secciones no se pudo establecer.');
  }

  for (const form of dom.forms.slice(0, 8)) {
    const fields = form.fields.map((x) => `${x.name ?? x.id ?? x.tag}:${x.type ?? x.tag}${x.required ? '*' : ''}`).join(', ');
    f.add(`Formulario ${form.selector} (${form.method.toUpperCase()} ${form.action || 'sin action'})`, {
      detail: `Campos: ${fields || 'ninguno'}. Envío: ${form.submit.join(' / ') || 'sin botón'}.${form.action ? '' : ' Sin atributo action: probablemente lo gestiona JavaScript.'}`,
      evidence: [at(form.open, form.selector)],
    });
  }

  if (dom.buttons.length) {
    const free = dom.buttons.filter((b) => !b.inForm);
    f.add(`${dom.buttons.length} botones (${free.length} fuera de formularios)`, {
      detail: dom.buttons.slice(0, 12).map((b) => `«${b.text || 'sin texto'}» ${b.selector}`).join('; '),
      evidence: dom.buttons.slice(0, 5).map((b) => at(b.open, b.selector)),
    });
  }

  f.add(`${dom.links.total} enlaces: ${dom.links.internal} internos, ${dom.links.external} externos, ${dom.links.hashOnly} de ancla`, {
    evidence: [{ file: 'dom/snapshot.json' }],
  });

  for (const r of dom.repeated.slice(0, 6)) {
    f.add(`Componente repetido: ${r.count} × <${r.item}> dentro de ${r.container}`, {
      detail: `Estructura interna de cada elemento: ${r.structure}. Patrón típico de una lista renderizada desde datos.`,
      confidence: 'media',
      evidence: [at(r.open, `primer elemento de ${r.container}`)],
    });
  }

  if (dom.customElements.length) {
    f.add(`Elementos personalizados (Web Components): ${dom.customElements.join(', ')}`, { confidence: 'media', evidence: [{ file: 'dom/snapshot.json' }] });
  }

  const a = dom.a11y;
  const issues: string[] = [];
  const ev: Evidence[] = [];
  if (!a.lang) issues.push('falta el atributo lang en <html>');
  if (!a.hasMain) issues.push('no hay región <main>');
  if (a.h1Count !== 1) issues.push(`${a.h1Count} encabezados h1 (se espera 1)`);
  if (a.headingSkips) issues.push(`${a.headingSkips} saltos de nivel entre encabezados`);
  if (a.imagesWithoutAltCount) {
    issues.push(`${a.imagesWithoutAltCount} de ${a.imagesTotal} imágenes sin alt`);
    ev.push(...a.imagesWithoutAlt.slice(0, 3).map((i) => at(i.open, `imagen sin alt: ${i.selector}`)));
  }
  if (a.inputsWithoutLabel.length) {
    issues.push(`${a.inputsWithoutLabel.length} campos sin etiqueta`);
    ev.push(...a.inputsWithoutLabel.slice(0, 3).map((i) => at(i.open, `campo sin etiqueta: ${i.selector}`)));
  }
  if (a.buttonsWithoutName.length) {
    issues.push(`${a.buttonsWithoutName.length} controles sin nombre accesible`);
    ev.push(...a.buttonsWithoutName.slice(0, 3).map((i) => at(i.open, `sin nombre accesible: ${i.selector}`)));
  }
  if (a.duplicateIds.length) issues.push(`ids duplicados: ${a.duplicateIds.join(', ')}`);
  if (a.positiveTabindex) issues.push(`${a.positiveTabindex} elementos con tabindex positivo`);
  f.add(issues.length ? `Accesibilidad básica: ${issues.length} observaciones` : 'Accesibilidad básica: sin observaciones en las comprobaciones automáticas', {
    detail: `${issues.join('; ') || 'lang, main, h1, alt, etiquetas y nombres accesibles correctos'}. Idioma declarado: ${a.lang || 'ninguno'}; ${a.ariaAttributes} elementos con atributos ARIA o role.`,
    evidence: ev.length ? ev : [{ file: 'dom/snapshot.json' }],
  });

  f.unknown('La accesibilidad se revisó con comprobaciones estáticas básicas; contraste, orden de foco y lectores de pantalla no se evaluaron.');
  if (dom.counts.shadowHosts) f.unknown(`Hay ${dom.counts.shadowHosts} raíces shadow DOM cuyo contenido interno no se recorrió.`);
  if (dom.counts.iframes) f.unknown(`El contenido de los ${dom.counts.iframes} iframes (${[...new Set(dom.iframes)].join(', ')}) no se analizó.`);

  return session.saveResult({ tool: 'app_view', session: session.dir, findings: f.list, unknowns: f.unknowns, files: ['dom/snapshot.json', 'page.html'], data: dom });
}
