/**
 * Funciones que se ejecutan DENTRO de la página (vía page.evaluate / addInitScript).
 * Deben ser autocontenidas: no pueden usar nada definido fuera de su cuerpo.
 */

export function collectDom() {
  const cut = (s: string | null | undefined, n = 80) => (s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
  const cssPath = (el: Element): string => {
    const parts: string[] = [];
    let node: Element | null = el;
    while (node && parts.length < 5) {
      if (node.id && /^[A-Za-z][\w-]*$/.test(node.id)) {
        parts.unshift('#' + node.id);
        break;
      }
      const tag = node.tagName.toLowerCase();
      if (tag === 'html' || tag === 'body') {
        parts.unshift(tag);
        break;
      }
      const parent: Element | null = node.parentElement;
      let part = tag;
      if (parent) {
        const cur = node;
        const same = Array.from(parent.children).filter((c) => c.tagName === cur.tagName);
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(cur) + 1})`;
      }
      parts.unshift(part);
      node = parent;
    }
    return parts.join(' > ');
  };
  /** Etiqueta de apertura tal como aparece en el HTML serializado (para ubicar la línea). */
  const open = (el: Element) => {
    const shallow = (el.cloneNode(false) as Element).outerHTML;
    const close = shallow.lastIndexOf('</');
    return (close > 0 ? shallow.slice(0, close) : shallow).slice(0, 160);
  };
  const q = (sel: string) => Array.from(document.querySelectorAll(sel));
  const sig = (c: Element) =>
    c.tagName.toLowerCase() + (c.classList.length ? '.' + Array.from(c.classList).sort().join('.') : '');

  const sections = q('header, nav, main, section, article, aside, footer, [role="banner"], [role="navigation"], [role="main"], [role="search"], [role="contentinfo"], [role="dialog"]')
    .slice(0, 60)
    .map((el) => ({
      tag: el.tagName.toLowerCase(),
      role: el.getAttribute('role') ?? undefined,
      selector: cssPath(el),
      label: cut(el.getAttribute('aria-label') ?? el.querySelector('h1,h2,h3')?.textContent, 60),
      descendants: el.querySelectorAll('*').length,
      open: open(el),
    }));

  const headings = q('h1, h2, h3').slice(0, 60).map((el) => ({ level: Number(el.tagName[1]), text: cut(el.textContent, 70), open: open(el) }));

  const labelFor = (el: Element): string => {
    const id = el.getAttribute('id');
    const viaFor = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
    return cut(
      viaFor?.textContent ?? el.closest('label')?.textContent ?? el.getAttribute('aria-label') ?? el.getAttribute('placeholder') ?? el.getAttribute('title'),
      50,
    );
  };

  const forms = q('form').slice(0, 30).map((form) => ({
    selector: cssPath(form),
    action: form.getAttribute('action') ?? '',
    method: (form.getAttribute('method') ?? 'get').toLowerCase(),
    role: form.getAttribute('role') ?? undefined,
    fields: Array.from(form.querySelectorAll('input, select, textarea')).slice(0, 40).map((f) => ({
      tag: f.tagName.toLowerCase(),
      type: f.getAttribute('type') ?? (f.tagName === 'INPUT' ? 'text' : undefined),
      name: f.getAttribute('name') ?? undefined,
      id: f.getAttribute('id') ?? undefined,
      label: labelFor(f),
      required: f.hasAttribute('required'),
      selector: cssPath(f),
    })),
    submit: Array.from(form.querySelectorAll('button, input[type="submit"]')).slice(0, 5).map((b) => cut(b.textContent || b.getAttribute('value'), 40)),
    open: open(form),
  }));

  const buttons = q('button, [role="button"], input[type="button"], input[type="submit"]').slice(0, 60).map((b) => ({
    selector: cssPath(b),
    text: cut(b.textContent || b.getAttribute('value') || b.getAttribute('aria-label'), 40),
    type: b.getAttribute('type') ?? undefined,
    inForm: !!b.closest('form'),
    inlineHandler: b.hasAttribute('onclick'),
    open: open(b),
  }));

  const anchors = q('a[href]');
  const links = {
    total: anchors.length,
    internal: anchors.filter((a) => (a as HTMLAnchorElement).host === location.host).length,
    external: anchors.filter((a) => (a as HTMLAnchorElement).host && (a as HTMLAnchorElement).host !== location.host).length,
    hashOnly: anchors.filter((a) => (a.getAttribute('href') ?? '').startsWith('#')).length,
  };

  // Componentes repetidos: hermanos con la misma firma (etiqueta + clases) y contenido propio.
  const repeated: { container: string; item: string; count: number; structure: string; open: string }[] = [];
  const seen = new Set<Element>();
  for (const el of q('body *')) {
    const parent = el.parentElement;
    if (!parent || seen.has(parent)) continue;
    seen.add(parent);
    if (parent.children.length < 3) continue;
    const buckets = new Map<string, Element[]>();
    for (const k of Array.from(parent.children)) {
      if (/^(SCRIPT|STYLE|LINK|META|OPTION|BR|SOURCE|PATH|G|TR|TD|TH|COL)$/.test(k.tagName)) continue;
      const s = sig(k);
      const list = buckets.get(s) ?? [];
      list.push(k);
      buckets.set(s, list);
    }
    for (const [s, els] of buckets) {
      if (els.length < 3 || els[0].querySelectorAll('*').length < 2) continue;
      repeated.push({
        container: cssPath(parent),
        item: s,
        count: els.length,
        structure: Array.from(els[0].querySelectorAll('*')).slice(0, 12).map(sig).join(', '),
        open: open(els[0]),
      });
    }
  }
  repeated.sort((a, b) => b.count * b.structure.length - a.count * a.structure.length);

  const imgs = q('img');
  const ids = q('[id]').map((e) => e.id);
  const dupIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  const levels = q('h1,h2,h3,h4,h5,h6').map((h) => Number(h.tagName[1]));
  const accessibleName = (el: Element) =>
    cut(el.textContent) || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title') || el.getAttribute('value') || (el.querySelector('img[alt]:not([alt=""])') ? 'img' : '');
  const a11y = {
    lang: document.documentElement.getAttribute('lang') ?? '',
    hasMain: !!document.querySelector('main, [role="main"]'),
    h1Count: document.querySelectorAll('h1').length,
    headingSkips: levels.filter((l, i) => i > 0 && l - levels[i - 1] > 1).length,
    imagesTotal: imgs.length,
    imagesWithoutAlt: imgs.filter((i) => !i.hasAttribute('alt')).slice(0, 10).map((i) => ({ selector: cssPath(i), open: open(i) })),
    imagesWithoutAltCount: imgs.filter((i) => !i.hasAttribute('alt')).length,
    inputsWithoutLabel: q('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea')
      .filter((f) => !labelFor(f))
      .slice(0, 10)
      .map((f) => ({ selector: cssPath(f), open: open(f) })),
    buttonsWithoutName: q('button, [role="button"], a[href]').filter((b) => !accessibleName(b)).slice(0, 10).map((b) => ({ selector: cssPath(b), open: open(b) })),
    duplicateIds: dupIds.slice(0, 10),
    positiveTabindex: q('[tabindex]').filter((e) => Number(e.getAttribute('tabindex')) > 0).length,
    ariaAttributes: q('[aria-label], [aria-labelledby], [aria-describedby], [aria-live], [role]').length,
  };

  const scripts = q('script').map((s, i) => {
    const type = s.getAttribute('type') ?? '';
    const src = s.getAttribute('src');
    const isJs = !type || /javascript|module|ecmascript/i.test(type);
    return {
      index: i,
      src: src ? (s as HTMLScriptElement).src : undefined,
      type: type || undefined,
      async: s.hasAttribute('async'),
      defer: s.hasAttribute('defer'),
      module: type === 'module',
      id: s.id || undefined,
      length: src ? 0 : (s.textContent ?? '').length,
      text: !src && isJs ? (s.textContent ?? '').slice(0, 400_000) : undefined,
      open: open(s),
    };
  });

  const custom = [...new Set(q('*').map((e) => e.tagName.toLowerCase()).filter((t) => t.includes('-')))].slice(0, 30);
  let maxDepth = 0;
  const walk = (el: Element, d: number) => {
    if (d > maxDepth) maxDepth = d;
    if (d < 60) for (const c of Array.from(el.children)) walk(c, d + 1);
  };
  if (document.body) walk(document.body, 1);

  const meta = (name: string) =>
    cut(document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)?.getAttribute('content'), 160);

  return {
    title: cut(document.title, 120),
    url: location.href,
    meta: { description: meta('description'), viewport: meta('viewport'), generator: meta('generator'), ogType: meta('og:type') },
    counts: {
      elements: document.querySelectorAll('*').length,
      maxDepth,
      iframes: q('iframe').length,
      shadowHosts: q('*').filter((e) => (e as HTMLElement).shadowRoot).length,
      stylesheets: q('link[rel="stylesheet"], style').length,
    },
    iframes: q('iframe').slice(0, 15).map((f) => {
      try {
        return new URL((f as HTMLIFrameElement).src).host;
      } catch {
        return '(sin src)';
      }
    }),
    customElements: custom,
    sections,
    headings,
    forms,
    buttons,
    links,
    repeated: repeated.slice(0, 12),
    a11y,
    scripts,
  };
}

export type DomSnapshot = ReturnType<typeof collectDom>;

/** Señales en tiempo de ejecución de frameworks, librerías y analítica. */
export function collectProbes() {
  const w = window as any;
  const safe = <T>(fn: () => T): T | undefined => {
    try {
      return fn();
    } catch {
      return undefined;
    }
  };
  const ver = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? String(v).slice(0, 30) : true);
  const has = (sel: string) => !!document.querySelector(sel);
  const found: Record<string, string | boolean> = {};
  const put = (name: string, value: unknown) => {
    if (value) found[name] = ver(value);
  };

  const sample = Array.from(document.querySelectorAll('body, body *')).slice(0, 800);
  const nodeKey = (re: RegExp) => sample.some((el) => Object.keys(el).some((k) => re.test(k)));

  put('React', safe(() => w.React?.version) || nodeKey(/^__react(Fiber|Container|Props)\$|^_reactRootContainer$/) || has('[data-reactroot]'));
  put('Preact', safe(() => !!w.preact) || nodeKey(/^__k$|^__preact/));
  put('Next.js', safe(() => w.next?.version) || safe(() => !!w.__NEXT_DATA__) || safe(() => !!w.__next_f) || has('#__next'));
  put('Remix', safe(() => !!w.__remixContext));
  put('Gatsby', has('#___gatsby'));
  put('Vue', safe(() => w.Vue?.version) || sample.some((el: any) => el.__vue__ || el.__vue_app__ || el.__vueParentComponent) || sample.some((el) => el.getAttributeNames().some((a) => a.startsWith('data-v-'))));
  put('Nuxt', safe(() => !!w.__NUXT__) || safe(() => !!w.$nuxt) || has('#__nuxt'));
  put('Angular', document.querySelector('[ng-version]')?.getAttribute('ng-version') || safe(() => !!w.ng?.getComponent));
  put('AngularJS', safe(() => w.angular?.version?.full));
  put('Svelte', sample.some((el) => /(^|\s)svelte-[a-z0-9]{5,}/.test(el.getAttribute('class') ?? '')) || safe(() => Object.keys(w).some((k) => k.startsWith('__sveltekit'))));
  put('Astro', has('astro-island'));
  put('Alpine.js', safe(() => w.Alpine?.version) || has('[x-data]'));
  put('htmx', safe(() => w.htmx?.version) || has('[hx-get], [hx-post]'));
  put('Ember', safe(() => w.Ember?.VERSION));
  put('Backbone', safe(() => w.Backbone?.VERSION));
  put('jQuery', safe(() => w.jQuery?.fn?.jquery));
  put('Lodash', safe(() => (w._?.VERSION && w._.chunk ? w._.VERSION : undefined)));
  put('Moment.js', safe(() => w.moment?.version));
  put('Axios', safe(() => w.axios?.VERSION || !!w.axios));
  put('GSAP', safe(() => w.gsap?.version));
  put('Three.js', safe(() => w.THREE?.REVISION));
  put('D3', safe(() => w.d3?.version));
  put('Bootstrap', safe(() => w.bootstrap?.Tooltip?.VERSION || !!w.bootstrap));
  put('Shopify', safe(() => !!w.Shopify));
  put('WordPress', has('link[href*="wp-content"], script[src*="wp-content"], script[src*="wp-includes"]'));
  put('webpack', safe(() => Object.keys(w).some((k) => /^webpackChunk|^webpackJsonp/.test(k))));
  put('Vite', has('script[type="module"][src*="/@vite/"], script[type="module"][src*="/assets/index-"]'));
  put('Sentry', safe(() => !!w.Sentry || !!w.__SENTRY__));
  put('Google Tag Manager', safe(() => Array.isArray(w.dataLayer) && has('script[src*="googletagmanager.com"]')));
  put('Google Analytics', safe(() => !!w.gtag || !!w.ga || !!w.GoogleAnalyticsObject));
  put('Meta Pixel', safe(() => !!w.fbq));
  put('Matomo', safe(() => !!w._paq));
  put('Plausible', safe(() => !!w.plausible));
  put('Mixpanel', safe(() => !!w.mixpanel));
  put('Amplitude', safe(() => !!w.amplitude));
  put('Hotjar', safe(() => !!w.hj));
  put('Microsoft Clarity', safe(() => !!w.clarity));
  put('Segment', safe(() => !!w.analytics?.track));

  return {
    found,
    generator: document.querySelector('meta[name="generator"]')?.getAttribute('content')?.slice(0, 80) ?? '',
    serviceWorker: safe(() => !!navigator.serviceWorker?.controller) ?? false,
    manifest: has('link[rel="manifest"]'),
  };
}

/** Claves de almacenamiento. Los valores salen de la página solo para clasificarlos; nunca se guardan. */
export async function collectStorage() {
  const dump = (s: Storage) => {
    const out: { key: string; value: string }[] = [];
    for (let i = 0; i < Math.min(s.length, 200); i++) {
      const key = s.key(i) ?? '';
      out.push({ key, value: (s.getItem(key) ?? '').slice(0, 4000) });
    }
    return out;
  };
  let local: { key: string; value: string }[] = [];
  let session: { key: string; value: string }[] = [];
  try {
    local = dump(localStorage);
    session = dump(sessionStorage);
  } catch {
    /* almacenamiento bloqueado */
  }
  const databases: { name: string; version: number; stores: { name: string; keyPath: string; autoIncrement: boolean; indexes: string[]; count: number }[] }[] = [];
  try {
    const list = indexedDB.databases ? await indexedDB.databases() : [];
    for (const info of list.slice(0, 10)) {
      if (!info.name) continue;
      const db = await new Promise<IDBDatabase | null>((resolve) => {
        const req = indexedDB.open(info.name as string);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
        req.onblocked = () => resolve(null);
      });
      if (!db) continue;
      const stores = [];
      for (const name of Array.from(db.objectStoreNames).slice(0, 30)) {
        const store = db.transaction(name, 'readonly').objectStore(name);
        const count = await new Promise<number>((resolve) => {
          const r = store.count();
          r.onsuccess = () => resolve(r.result);
          r.onerror = () => resolve(-1);
        });
        stores.push({
          name,
          keyPath: Array.isArray(store.keyPath) ? store.keyPath.join('+') : String(store.keyPath ?? ''),
          autoIncrement: store.autoIncrement,
          indexes: Array.from(store.indexNames),
          count,
        });
      }
      databases.push({ name: info.name, version: db.version, stores });
      db.close();
    }
  } catch {
    /* IndexedDB no disponible */
  }
  let cacheNames: string[] = [];
  try {
    cacheNames = (await caches.keys()).slice(0, 20);
  } catch {
    /* Cache API no disponible */
  }
  return { local, session, databases, cacheNames };
}

/** Barreras que la herramienta detecta y NO intenta superar. */
export function detectBarriers() {
  const out: string[] = [];
  const has = (sel: string) => !!document.querySelector(sel);
  if (has('iframe[src*="recaptcha"], iframe[src*="hcaptcha"], .g-recaptcha, .h-captcha, iframe[src*="challenges.cloudflare.com"], [class*="cf-turnstile"], [id*="captcha" i]')) out.push('CAPTCHA');
  if (/just a moment|checking your browser|attention required|verif(y|ying) you are human|access denied|are you a robot/i.test(document.title)) out.push('desafío anti-bot');
  if (has('input[type="password"]')) out.push('formulario de inicio de sesión');
  if (has('input[autocomplete^="cc-"], input[name*="cardnumber" i], input[name*="card-number" i], iframe[src*="js.stripe.com"], iframe[src*="paypal.com"]')) out.push('formulario de pago');
  return out;
}

/** Instala un MutationObserver que resume los cambios del DOM. */
export function installMutationLog() {
  const w = window as any;
  if (w.__reaMut) return;
  const cut = (s: string | null | undefined, n = 80) => (s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
  const cssPath = (el: Element | null): string => {
    const parts: string[] = [];
    let node: Element | null = el;
    while (node && parts.length < 5) {
      if (node.id && /^[A-Za-z][\w-]*$/.test(node.id)) {
        parts.unshift('#' + node.id);
        break;
      }
      const tag = node.tagName.toLowerCase();
      if (tag === 'html' || tag === 'body') {
        parts.unshift(tag);
        break;
      }
      const parent: Element | null = node.parentElement;
      let part = tag;
      if (parent) {
        const cur = node;
        const same = Array.from(parent.children).filter((c) => c.tagName === cur.tagName);
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(cur) + 1})`;
      }
      parts.unshift(part);
      node = parent;
    }
    return parts.join(' > ') || '(documento)';
  };
  const describe = (n: Node) => {
    if (n.nodeType !== 1) return `#texto(${(n.textContent ?? '').trim().length})`;
    const el = n as Element;
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.classList.length ? '.' + Array.from(el.classList).join('.') : '');
  };
  const log = { records: 0, added: [] as any[], removed: [] as any[], attrs: [] as any[], text: [] as any[] };
  w.__reaMut = log;
  const CAP = 300;
  new MutationObserver((records) => {
    for (const r of records) {
      log.records++;
      const target = r.target.nodeType === 1 ? (r.target as Element) : r.target.parentElement;
      if (r.type === 'childList') {
        r.addedNodes.forEach((n) => {
          if (log.added.length < CAP) log.added.push({ t: Date.now(), parent: cssPath(target), node: describe(n), descendants: n.nodeType === 1 ? (n as Element).querySelectorAll('*').length : 0 });
        });
        r.removedNodes.forEach((n) => {
          if (log.removed.length < CAP) log.removed.push({ t: Date.now(), parent: cssPath(target), node: describe(n) });
        });
      } else if (r.type === 'attributes') {
        if (log.attrs.length < CAP) log.attrs.push({ t: Date.now(), target: cssPath(target), attr: r.attributeName, value: cut(target?.getAttribute(r.attributeName ?? ''), 60) });
      } else if (log.text.length < CAP) {
        log.text.push({ t: Date.now(), target: cssPath(target), length: (r.target.textContent ?? '').length });
      }
    }
  }).observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
}

export function readMutationLog(reset: boolean) {
  const log = (window as any).__reaMut;
  if (!log) return null;
  const copy = JSON.parse(JSON.stringify(log));
  if (reset) {
    log.records = 0;
    log.added.length = 0;
    log.removed.length = 0;
    log.attrs.length = 0;
    log.text.length = 0;
  }
  return copy as { records: number; added: any[]; removed: any[]; attrs: any[]; text: any[] };
}
