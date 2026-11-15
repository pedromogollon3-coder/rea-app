// Cliente de la API: añade el token de sesión y la cabecera anti-CSRF a cada llamada.

const CLAVE_TOKEN = 'faro.token';
let csrf = '';

function cabeceras(extra = {}) {
  const token = sessionStorage.getItem(CLAVE_TOKEN);
  return { ...(token ? { authorization: 'Bearer ' + token } : {}), ...(csrf ? { 'x-csrf-token': csrf } : {}), ...extra };
}

async function pedir(ruta, opciones = {}) {
  const res = await fetch(ruta, { ...opciones, headers: cabeceras(opciones.headers) });
  if (res.status === 401) throw new Error('no-autenticado');
  return res.json();
}

export async function iniciarSesion(usuario, clave) {
  const res = await fetch('/api/sesion', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ usuario, clave }) });
  if (!res.ok) throw new Error('Credenciales no válidas');
  const datos = await res.json();
  sessionStorage.setItem(CLAVE_TOKEN, datos.token);
  csrf = datos.csrf;
  return datos.usuario;
}

export async function recuperarSesion() {
  const datos = await pedir('/api/yo');
  csrf = datos.csrf;
  return datos.usuario;
}

export async function cerrarSesion() {
  await fetch('/api/sesion', { method: 'DELETE', headers: cabeceras() });
  sessionStorage.removeItem(CLAVE_TOKEN);
}

export const obtenerCuenta = () => pedir('/api/cuenta');
export const obtenerSaldo = () => pedir('/api/saldo');
export const obtenerSimbolos = () => pedir('/api/simbolos');
export const obtenerHistorico = (simbolo) => pedir('/api/historico/' + simbolo + '?velas=60');
export const obtenerOrdenes = () => pedir('/api/ordenes');

export function crearOrden(orden) {
  return pedir('/api/ordenes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(orden) });
}
