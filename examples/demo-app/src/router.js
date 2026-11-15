// Enrutador con History API: cambia de vista sin recargar la página.
import { store } from './store.js';

const rutas = [];

export function definirRuta(patron, vista, { privada = true } = {}) {
  const claves = [];
  const expresion = new RegExp('^' + patron.replace(/:(\w+)/g, (_m, clave) => (claves.push(clave), '([^/]+)')) + '$');
  rutas.push({ patron, expresion, claves, vista, privada });
}

export function resolver(camino) {
  for (const ruta of rutas) {
    const m = ruta.expresion.exec(camino);
    if (m) return { ruta, parametros: m.slice(1) };
  }
  return null;
}

export function pintar() {
  const camino = location.pathname;
  const encontrada = resolver(camino);
  const { iniciada } = store.getState().sesion;
  if (!encontrada || (encontrada.ruta.privada && !iniciada)) return navegar(iniciada ? '/panel' : '/acceso', true);
  store.dispatch({ type: 'ui/ruta', ruta: camino });
  document.querySelectorAll('[data-ruta]').forEach((a) => a.classList.toggle('activa', camino.startsWith(a.getAttribute('href').split('/').slice(0, 2).join('/'))));
  encontrada.ruta.vista(document.getElementById('vista'), ...encontrada.parametros);
}

export function navegar(camino, reemplazar = false) {
  if (reemplazar) history.replaceState(null, '', camino);
  else history.pushState(null, '', camino);
  pintar();
}

export function iniciarRouter() {
  window.addEventListener('popstate', pintar);
  document.addEventListener('click', function alPulsarEnlace(event) {
    const enlace = event.target.closest('a[data-ruta]');
    if (!enlace) return;
    event.preventDefault();
    navegar(enlace.getAttribute('href'));
  });
}
