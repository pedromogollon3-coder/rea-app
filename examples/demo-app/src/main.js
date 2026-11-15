import * as api from './api.js';
import { store } from './store.js';
import { definirRuta, iniciarRouter, navegar, pintar } from './router.js';
import { vistaAcceso, vistaMercado, vistaOrdenes, vistaPanel } from './vistas.js';
import { desconectarPrecios, escucharAvisos } from './tiempo-real.js';

window.FARO_CONFIG = { entorno: 'demo', api: '/api', funciones: { ordenesRapidas: false, graficoWebgl: false }, sondeoSaldoMs: 600 };

definirRuta('/acceso', vistaAcceso, { privada: false });
definirRuta('/panel', vistaPanel);
definirRuta('/mercado/:simbolo', vistaMercado);
definirRuta('/ordenes', vistaOrdenes);
definirRuta('/ajustes/seguridad', vistaPanel);

function reflejarSesion() {
  const { usuario, iniciada } = store.getState().sesion;
  document.getElementById('menu').hidden = !iniciada;
  document.getElementById('salir').hidden = !iniciada;
  document.getElementById('usuario-activo').textContent = iniciada ? usuario.nombre : '';
}

async function arrancar() {
  localStorage.setItem('faro.tema', 'oscuro');
  iniciarRouter();
  store.subscribe(reflejarSesion);
  document.getElementById('salir').addEventListener('click', async function alSalir() {
    await api.cerrarSesion();
    desconectarPrecios();
    store.dispatch({ type: 'sesion/cerrada' });
    navegar('/acceso');
  });
  try {
    const usuario = await api.recuperarSesion();
    store.dispatch({ type: 'sesion/iniciada', usuario });
    escucharAvisos();
  } catch {
    /* sin sesión: el router lleva a /acceso */
  }
  let avisos = store.getState().sesion.iniciada;
  store.subscribe(() => {
    if (store.getState().sesion.iniciada && !avisos) {
      avisos = true;
      escucharAvisos();
    }
  });
  pintar();
}

arrancar();
