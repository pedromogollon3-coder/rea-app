import type { ToolResult } from './types.js';
import { Findings, Session } from './session.js';

interface StorageSnapshot {
  cookies: { nombre: string; dominio: string; httpOnly: boolean; secure: boolean; sameSite: string; persistente: boolean; caducaEnDias: number | null; tipo: string; longitud: number; sensible: boolean }[];
  localStorage: { clave: string; tipo: string; longitud: number; sensible: boolean }[];
  sessionStorage: { clave: string; tipo: string; longitud: number; sensible: boolean }[];
  indexedDB: { name: string; version: number; stores: { name: string; keyPath: string; autoIncrement: boolean; indexes: string[]; count: number }[] }[];
  cacheStorage: string[];
}

/** app_storage: nombres y tipos de lo que la página guarda en el navegador. Nunca valores. */
export function storageAnalysis(session: Session): ToolResult<StorageSnapshot> {
  const FILE = 'storage/snapshot.json';
  const s = session.readJson<StorageSnapshot>(FILE);
  const f = new Findings('almacenamiento', 'ALM');
  const ev = [{ file: FILE }];
  const kv = (list: StorageSnapshot['localStorage']) => list.map((e) => `${e.clave} (${e.tipo}, ${e.longitud} car.${e.sensible ? ', sensible' : ''})`).join('; ');

  if (s.cookies.length) {
    f.add(`${s.cookies.length} cookies`, {
      detail: s.cookies
        .map((c) => `${c.nombre} [${c.dominio}; ${c.tipo}, ${c.longitud} car.; ${c.httpOnly ? 'HttpOnly' : 'legible por JS'}; ${c.secure ? 'Secure' : 'sin Secure'}; SameSite=${c.sameSite}; ${c.persistente ? `caduca en ${c.caducaEnDias} días` : 'de sesión'}]`)
        .join('; '),
      evidence: ev,
    });
    const weak = s.cookies.filter((c) => c.sensible && (!c.httpOnly || !c.secure));
    if (weak.length) {
      f.add(`${weak.length} cookie(s) con nombre sensible sin HttpOnly o sin Secure`, { detail: weak.map((c) => c.nombre).join(', '), confidence: 'media', evidence: ev });
    }
  } else {
    f.add('La página no estableció cookies durante la captura', { evidence: ev });
  }
  if (s.localStorage.length) f.add(`localStorage: ${s.localStorage.length} claves`, { detail: kv(s.localStorage), evidence: ev });
  if (s.sessionStorage.length) f.add(`sessionStorage: ${s.sessionStorage.length} claves`, { detail: kv(s.sessionStorage), evidence: ev });
  const tokens = [...s.localStorage, ...s.sessionStorage].filter((e) => e.sensible);
  if (tokens.length) {
    f.add(`${tokens.length} clave(s) de aspecto sensible en almacenamiento accesible por JavaScript`, {
      detail: `${tokens.map((t) => `${t.clave} (${t.tipo})`).join(', ')}. Cualquier script de la página puede leerlas.`,
      confidence: 'media',
      evidence: ev,
    });
  }
  for (const db of s.indexedDB) {
    f.add(`IndexedDB «${db.name}» v${db.version}: ${db.stores.length} almacenes`, {
      detail: db.stores.map((st) => `${st.name} [clave: ${st.keyPath || '(externa)'}${st.autoIncrement ? ', autoincremental' : ''}; índices: ${st.indexes.join(', ') || 'ninguno'}; ${st.count} registros]`).join('; '),
      evidence: ev,
    });
  }
  if (s.cacheStorage.length) f.add(`Cache Storage: ${s.cacheStorage.join(', ')}`, { evidence: ev });
  if (!s.localStorage.length && !s.sessionStorage.length && !s.indexedDB.length) {
    f.add('Sin datos en localStorage, sessionStorage ni IndexedDB tras la carga', { evidence: ev });
  }

  f.unknown('Los valores están enmascarados a propósito: solo se conocen nombres, tipos y longitudes.');
  f.unknown('Solo se ve el almacenamiento tras la carga inicial; lo que se escribe al iniciar sesión o interactuar no aparece.');
  return session.saveResult({ tool: 'app_storage', session: session.dir, findings: f.list, unknowns: f.unknowns, files: [FILE], data: s });
}
