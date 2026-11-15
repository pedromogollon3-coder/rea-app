/**
 * Funciones que se ejecutan DENTRO de la aplicación analizada (addInitScript / page.evaluate).
 * Deben ser autocontenidas: no pueden usar nada definido fuera de su cuerpo.
 */

/**
 * Instrumentación de la aplicación: rutas, WebAssembly, workers, lienzos, Server-Sent Events
 * y gestos del usuario. Se instala antes que el código de la página. Nunca registra lo que se
 * escribe: de un campo solo se anota cuántos caracteres tiene.
 */
export function installAppHooks() {
  const w = window as any;
  if (w.__reaApp || w.top !== w) return;
  const log = {
    routes: [] as any[],
    wasm: [] as any[],
    workers: [] as any[],
    canvas: [] as any[],
    eventSources: [] as any[],
    sse: {} as Record<string, number>,
    apis: {} as Record<string, number>,
    userEvents: [] as any[],
  };
  Object.defineProperty(w, '__reaApp', { value: log, enumerable: false, configurable: true });
  const now = () => Date.now();
  const safe = (fn: () => void) => {
    try {
      fn();
    } catch {
      /* la instrumentación nunca debe romper la página */
    }
  };
  const cap = (arr: any[], item: any, max = 2000) => {
    if (arr.length < max) arr.push(item);
  };
  const bump = (bag: Record<string, number>, key: string) => {
    bag[key] = (bag[key] ?? 0) + 1;
  };
  const cut = (s: string | null | undefined, n = 40) => (s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
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

  // Rutas: navegación sin recarga.
  safe(() => {
    log.routes.push({ t: now(), kind: 'carga', url: location.href });
    for (const k of ['pushState', 'replaceState'] as const) {
      const orig = history[k];
      history[k] = function (this: History, ...args: any[]) {
        const r = (orig as any).apply(this, args);
        cap(log.routes, { t: now(), kind: k, url: location.href }, 500);
        return r;
      } as any;
    }
    addEventListener('popstate', () => cap(log.routes, { t: now(), kind: 'popstate', url: location.href }, 500));
    addEventListener('hashchange', () => cap(log.routes, { t: now(), kind: 'hashchange', url: location.href }, 500));
  });

  // WebAssembly: tamaño, importaciones y exportaciones de cada módulo.
  safe(() => {
    const W = w.WebAssembly;
    if (!W) return;
    const describe = (module: any, via: string, bytes: number) =>
      safe(() =>
        cap(
          log.wasm,
          {
            t: now(),
            via,
            bytes,
            exports: W.Module.exports(module).slice(0, 300).map((e: any) => `${e.kind} ${e.name}`),
            imports: W.Module.imports(module).slice(0, 300).map((i: any) => `${i.kind} ${i.module}.${i.name}`),
          },
          50,
        ),
      );
    const size = (src: any) => (src && typeof src.byteLength === 'number' ? src.byteLength : 0);
    const wrap = (name: string, pick: (res: any, src: any) => any) => {
      const orig = W[name];
      if (typeof orig !== 'function') return;
      W[name] = function (this: any, src: any, ...rest: any[]) {
        const p = orig.call(this, src, ...rest);
        safe(() =>
          p.then(
            (res: any) => describe(pick(res, src), name, size(src)),
            () => {},
          ),
        );
        return p;
      };
    };
    wrap('instantiate', (res, src) => res?.module ?? src);
    wrap('instantiateStreaming', (res) => res.module);
    wrap('compile', (res) => res);
    wrap('compileStreaming', (res) => res);
  });

  // Constructores que revelan la arquitectura de ejecución.
  const spy = (name: string, onNew?: (args: any[], instance: any) => void) =>
    safe(() => {
      const Orig = w[name];
      if (typeof Orig !== 'function') return;
      const proxy: any = new Proxy(Orig, {
        construct(target: any, args: any[], newTarget: any): any {
          const instance: any = Reflect.construct(target, args, newTarget === proxy ? target : newTarget);
          safe(() => {
            bump(log.apis, name);
            onNew?.(args, instance);
          });
          return instance;
        },
      });
      w[name] = proxy;
    });
  spy('Worker', (args) => cap(log.workers, { t: now(), kind: 'Worker', url: String(args[0]).slice(0, 300) }, 100));
  spy('SharedWorker', (args) => cap(log.workers, { t: now(), kind: 'SharedWorker', url: String(args[0]).slice(0, 300) }, 100));
  spy('RTCPeerConnection');
  spy('AudioContext');
  spy('BroadcastChannel');
  spy('WebTransport');
  spy('EventSource', (args, es) => {
    cap(log.eventSources, { t: now(), url: String(args[0]).slice(0, 300) }, 50);
    const seen = new Set<string>(['open', 'error']);
    const listen = EventSource.prototype.addEventListener;
    const watch = (type: string) => {
      if (seen.has(type)) return;
      seen.add(type);
      listen.call(es, type, () => bump(log.sse, type));
    };
    watch('message');
    es.addEventListener = function (type: string, ...rest: any[]) {
      safe(() => watch(type));
      return (listen as any).call(this, type, ...rest);
    };
  });
  safe(() => {
    const sw = navigator.serviceWorker;
    if (!sw) return;
    const orig = sw.register;
    sw.register = function (this: ServiceWorkerContainer, ...args: any[]) {
      safe(() => {
        bump(log.apis, 'serviceWorker.register');
        cap(log.workers, { t: now(), kind: 'ServiceWorker', url: String(args[0]).slice(0, 300) }, 100);
      });
      return (orig as any).apply(this, args);
    } as any;
  });

  // Lienzos: qué contexto de dibujo pide la aplicación.
  const patchCanvas = (proto: any, prefix: string) =>
    safe(() => {
      const orig = proto.getContext;
      proto.getContext = function (this: any, type: string, ...rest: any[]) {
        const ctx = orig.call(this, type, ...rest);
        safe(() => {
          if (!ctx || this.__reaSeen) return;
          Object.defineProperty(this, '__reaSeen', { value: true, enumerable: false });
          cap(log.canvas, { t: now(), context: prefix + String(type), width: this.width, height: this.height, selector: this.isConnected ? cssPath(this) : '(fuera del DOM)' }, 200);
        });
        return ctx;
      };
    });
  patchCanvas(HTMLCanvasElement.prototype, '');
  if (w.OffscreenCanvas) patchCanvas(w.OffscreenCanvas.prototype, 'offscreen:');

  // Gestos del usuario (fase de captura, para verlos aunque la página detenga la propagación).
  const describe = (el: Element) => {
    const tag = el.tagName.toLowerCase();
    const parts = [tag];
    const type = el.getAttribute('type');
    const role = el.getAttribute('role');
    if (type) parts.push(`type=${type}`);
    if (role) parts.push(`role=${role}`);
    const actionable = el.closest('button, a, [role="button"], [role="tab"], [role="menuitem"], [role="link"], summary, label');
    // El texto solo se toma de controles (botones, enlaces, pestañas), nunca de campos ni de contenido.
    if (actionable && !/^(input|textarea|select)$/.test(tag)) {
      const text = cut(actionable.getAttribute('aria-label') || actionable.textContent).replace(/\d{3,}/g, '#');
      if (text) parts.push(`«${text}»`);
    }
    return parts.join(' ');
  };
  const SPECIAL = /^(Enter|Escape|Tab|Arrow(Up|Down|Left|Right)|PageUp|PageDown|Home|End|F\d{1,2})$/;
  safe(() => {
    const opts = { capture: true, passive: true } as const;
    document.addEventListener(
      'click',
      (e) => {
        const el = e.target as Element;
        if (!el || el.nodeType !== 1) return;
        const onCanvas = el.tagName === 'CANVAS' && el.clientWidth > 0;
        cap(log.userEvents, {
          t: now(),
          kind: 'click',
          selector: cssPath(el),
          target: describe(el),
          detail: onCanvas ? `lienzo en ${Math.round((e.offsetX / el.clientWidth) * 100)}%, ${Math.round((e.offsetY / el.clientHeight) * 100)}%` : undefined,
        });
      },
      opts,
    );
    document.addEventListener(
      'input',
      (e) => {
        const el = e.target as HTMLInputElement;
        if (!el || el.nodeType !== 1) return;
        const selector = cssPath(el);
        const length = typeof el.value === 'string' ? el.value.length : (el.textContent ?? '').length;
        const last = log.userEvents[log.userEvents.length - 1];
        if (last && last.kind === 'escribir' && last.selector === selector && now() - (last.end ?? last.t) < 3000) {
          last.detail = `${length} caracteres`;
          last.end = now();
        } else cap(log.userEvents, { t: now(), end: now(), kind: 'escribir', selector, target: describe(el), detail: `${length} caracteres` });
      },
      opts,
    );
    document.addEventListener(
      'change',
      (e) => {
        const el = e.target as Element;
        if (!el || el.nodeType !== 1 || !/^(select|input)$/i.test(el.tagName)) return;
        const type = (el.getAttribute('type') ?? el.tagName).toLowerCase();
        if (!/^(select|checkbox|radio|file|range|date|color)$/.test(type)) return;
        cap(log.userEvents, { t: now(), kind: 'cambio', selector: cssPath(el), target: describe(el), detail: type });
      },
      opts,
    );
    document.addEventListener('submit', (e) => cap(log.userEvents, { t: now(), kind: 'envio', selector: cssPath(e.target as Element), target: 'form' }), opts);
    document.addEventListener(
      'keydown',
      (e) => {
        const shortcut = (e.ctrlKey || e.metaKey) && e.key.length === 1;
        if (!SPECIAL.test(e.key) && !shortcut) return;
        const el = e.target as Element;
        const isEl = !!el && el.nodeType === 1;
        cap(log.userEvents, { t: now(), kind: 'tecla', selector: isEl ? cssPath(el) : '(documento)', target: isEl ? describe(el) : 'documento', detail: shortcut ? `Ctrl+${e.key.toUpperCase()}` : e.key });
      },
      opts,
    );
  });
}

/** Devuelve lo registrado por installAppHooks y vacía los búferes. */
export function drainAppHooks() {
  const log = (window as any).__reaApp;
  if (!log) return null;
  const copy = JSON.parse(JSON.stringify(log));
  for (const k of ['routes', 'wasm', 'workers', 'canvas', 'eventSources', 'userEvents']) log[k].length = 0;
  log.sse = {};
  log.apis = {};
  return copy as {
    routes: any[];
    wasm: any[];
    workers: any[];
    canvas: any[];
    eventSources: any[];
    sse: Record<string, number>;
    apis: Record<string, number>;
    userEvents: any[];
  };
}

/**
 * Estado de la aplicación: almacenes conocidos (Redux, Pinia, Vuex, cachés de consultas) y
 * objetos globales que la página añade a window. Solo la forma (claves y tipos), nunca valores.
 */
export function collectState() {
  const w = window as any;
  const shape = (v: any, depth: number): any => {
    if (v === null) return 'null';
    const t = typeof v;
    if (t !== 'object') return t === 'function' ? 'función' : t;
    if (depth <= 0) return Array.isArray(v) ? 'arreglo' : 'objeto';
    if (Array.isArray(v)) return v.length ? [shape(v[0], depth - 1), `×${v.length}`] : [];
    if (v instanceof Map || v instanceof Set) return `${v instanceof Map ? 'Map' : 'Set'}(${v.size})`;
    if (v instanceof Element) return 'elemento DOM';
    const out: Record<string, any> = {};
    const keys = Object.keys(v);
    for (const k of keys.slice(0, 30)) {
      try {
        out[k] = shape(v[k], depth - 1);
      } catch {
        out[k] = 'inaccesible';
      }
    }
    if (keys.length > 30) out['…'] = `${keys.length - 30} claves más`;
    return out;
  };
  const safe = <T>(fn: () => T): T | undefined => {
    try {
      return fn();
    } catch {
      return undefined;
    }
  };
  const stores: { kind: string; via: string; shape: any; note?: string }[] = [];
  const isRedux = (s: any) => s && typeof s.getState === 'function' && typeof s.dispatch === 'function' && typeof s.subscribe === 'function';
  const known = new Set<any>();

  // Redux expuesto en window.
  for (const name of ['store', '__store__', '__STORE__', '__REDUX_STORE__', 'reduxStore', 'appStore']) {
    const s = safe(() => w[name]);
    if (isRedux(s) && !known.has(s)) {
      known.add(s);
      stores.push({ kind: 'Redux', via: `window.${name}`, shape: shape(safe(() => s.getState()), 3) });
    }
  }

  // React: se recorre el árbol de fibras buscando un Provider con store o un cliente de consultas.
  safe(() => {
    const nodes = Array.from(document.querySelectorAll('body, body *')).slice(0, 400);
    let fiber: any = null;
    for (const el of nodes) {
      const key = Object.keys(el).find((k) => k.startsWith('__reactContainer$') || k.startsWith('__reactFiber$'));
      if (key) {
        fiber = (el as any)[key];
        break;
      }
      const legacy = (el as any)._reactRootContainer;
      if (legacy) {
        fiber = legacy._internalRoot?.current ?? legacy.current;
        break;
      }
    }
    if (!fiber) return;
    while (fiber.return) fiber = fiber.return;
    const queue = [fiber];
    let visited = 0;
    while (queue.length && visited < 6000) {
      const f = queue.shift();
      visited++;
      const props = f.memoizedProps;
      if (props && typeof props === 'object') {
        const store = props.store;
        if (isRedux(store) && !known.has(store)) {
          known.add(store);
          stores.push({ kind: 'Redux (react-redux)', via: 'Provider del árbol de React', shape: shape(safe(() => store.getState()), 3) });
        }
        const client = props.client;
        if (client && !known.has(client)) {
          if (typeof client.getQueryCache === 'function') {
            known.add(client);
            const queries: any[] = safe(() => client.getQueryCache().getAll()) ?? [];
            const keys = [...new Set(queries.map((q) => String(Array.isArray(q.queryKey) ? q.queryKey[0] : q.queryKey)))].slice(0, 25);
            stores.push({ kind: 'TanStack Query', via: 'QueryClientProvider', shape: { consultas: queries.length }, note: `Claves de consulta: ${keys.join(', ')}` });
          } else if (client.cache && typeof client.cache.extract === 'function') {
            known.add(client);
            const cache: Record<string, any> = safe(() => client.cache.extract()) ?? {};
            const types: Record<string, number> = {};
            for (const k of Object.keys(cache)) {
              const type = String(cache[k]?.__typename ?? k.split(':')[0]);
              types[type] = (types[type] ?? 0) + 1;
            }
            stores.push({ kind: 'Apollo Client', via: 'ApolloProvider', shape: types, note: 'Entidades en caché por tipo' });
          }
        }
      }
      if (f.child) queue.push(f.child);
      if (f.sibling) queue.push(f.sibling);
    }
  });

  // Vue 3: Pinia y Vuex colgados de la aplicación.
  safe(() => {
    for (const el of Array.from(document.querySelectorAll('body *')).slice(0, 400)) {
      const app = (el as any).__vue_app__;
      if (!app) continue;
      const gp = app.config?.globalProperties ?? {};
      if (gp.$pinia?.state?.value) stores.push({ kind: 'Pinia', via: 'app.config.globalProperties.$pinia', shape: shape(gp.$pinia.state.value, 3) });
      if (gp.$store?.state) stores.push({ kind: 'Vuex', via: 'app.config.globalProperties.$store', shape: shape(gp.$store.state, 3) });
      break;
    }
  });
  // Vue 2.
  safe(() => {
    const root = Array.from(document.querySelectorAll('body *'))
      .slice(0, 400)
      .find((el) => (el as any).__vue__);
    const store = root && (root as any).__vue__.$store;
    if (store?.state) stores.push({ kind: 'Vuex', via: 'instancia raíz de Vue', shape: shape(store.state, 3) });
  });

  // Globales añadidos por la aplicación (comparando con una ventana vacía).
  const globals: { name: string; type: string; shape: any }[] = [];
  safe(() => {
    const frame = document.createElement('iframe');
    frame.style.display = 'none';
    document.documentElement.appendChild(frame);
    const baseline = new Set(Object.getOwnPropertyNames(frame.contentWindow));
    frame.remove();
    for (const name of Object.getOwnPropertyNames(w)) {
      if (baseline.has(name) || /^(__rea|\d+$|webpackChunk|__playwright|__pw)/.test(name) || globals.length >= 80) continue;
      const v = safe(() => w[name]);
      if (v === undefined || v === null) continue;
      const t = typeof v;
      if (t === 'function') globals.push({ name, type: 'función', shape: 'función' });
      else if (t === 'object') globals.push({ name, type: Array.isArray(v) ? 'arreglo' : 'objeto', shape: known.has(v) ? 'almacén (ver arriba)' : shape(v, 2) });
      else globals.push({ name, type: t, shape: t });
    }
  });

  const hints: string[] = [];
  if (safe(() => w.__mobxGlobals || w.__mobxInstanceCount)) hints.push('MobX');
  if (safe(() => w.__APOLLO_CLIENT__)) hints.push('Apollo Client (window.__APOLLO_CLIENT__)');
  if (safe(() => w.ng?.getComponent)) hints.push('Angular (el estado vive en servicios y no se inspecciona)');
  return { stores, globals, hints };
}

export type StateSnapshot = ReturnType<typeof collectState>;

/** HTML del documento con el texto visible sustituido por puntos (modo privado). Conserva líneas y estructura. */
export function serializeMasked() {
  const clone = document.documentElement.cloneNode(true) as HTMLElement;
  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  while (walker.nextNode()) texts.push(walker.currentNode as Text);
  for (const t of texts) {
    const parent = t.parentElement?.tagName;
    if (parent === 'SCRIPT' || parent === 'STYLE') continue;
    t.data = t.data.replace(/[^\s]/g, '·');
  }
  for (const el of Array.from(clone.querySelectorAll('[value]'))) el.setAttribute('value', '·');
  for (const el of Array.from(clone.querySelectorAll('[title], [alt], [aria-label], [data-value]'))) {
    for (const a of ['title', 'alt', 'aria-label', 'data-value']) if (el.hasAttribute(a)) el.setAttribute(a, (el.getAttribute(a) ?? '').replace(/\d/g, '#'));
  }
  return '<!DOCTYPE html>' + clone.outerHTML;
}
