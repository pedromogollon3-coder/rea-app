import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Browser, BrowserContext } from 'playwright';
import { USER_AGENT_SUFFIX } from './policy.js';

export class BrowserMissingError extends Error {
  constructor(detail: string) {
    super(
      `No se pudo iniciar un navegador Chromium (${detail}). ` +
        'Ejecuta la herramienta app_setup, o `npm run setup` en la carpeta de rea-app, para instalar Playwright y Chromium.',
    );
    this.name = 'BrowserMissingError';
  }
}

type PW = typeof import('playwright');

async function loadPlaywright(): Promise<PW> {
  try {
    return await import('playwright');
  } catch {
    /* se intenta en otras carpetas */
  }
  const bases = [process.env.CLAUDE_PLUGIN_DATA, process.env.CLAUDE_PLUGIN_ROOT, process.cwd()].filter(
    (b): b is string => !!b,
  );
  for (const base of bases) {
    try {
      const req = createRequire(path.join(base, 'noop.js'));
      const mod: any = await import(pathToFileURL(req.resolve('playwright')).href);
      const pw = mod.chromium ? mod : mod.default;
      if (pw?.chromium) return pw as PW;
    } catch {
      /* siguiente */
    }
  }
  throw new BrowserMissingError('el paquete playwright no está instalado');
}

/**
 * Inicia Chromium sin modo sigiloso ni parches anti-detección.
 * Si el Chromium de Playwright no está descargado se usa Chrome o Edge del sistema.
 */
export async function launchBrowser(headless = true): Promise<{ browser: Browser; label: string }> {
  const pw = await loadPlaywright();
  const attempts: { label: string; opts: Record<string, unknown> }[] = [
    { label: 'Chromium de Playwright', opts: {} },
    { label: 'Google Chrome del sistema', opts: { channel: 'chrome' } },
    { label: 'Microsoft Edge del sistema', opts: { channel: 'msedge' } },
  ];
  let last = '';
  for (const a of attempts) {
    try {
      const browser = await pw.chromium.launch({ headless, ...a.opts });
      return { browser, label: `${a.label} ${browser.version()}` };
    } catch (e) {
      last = String((e as Error).message).split('\n')[0];
    }
  }
  throw new BrowserMissingError(last);
}

/** Contexto con un User-Agent que se identifica como rea-app. */
export async function newContext(browser: Browser, harPath?: string): Promise<BrowserContext> {
  const probe = await browser.newContext();
  const page = await probe.newPage();
  const ua = await page.evaluate(() => navigator.userAgent);
  await probe.close();
  return browser.newContext({
    userAgent: `${ua} ${USER_AGENT_SUFFIX}`,
    viewport: { width: 1366, height: 900 },
    ...(harPath ? { recordHar: { path: harPath, content: 'omit' as const } } : {}),
  });
}
