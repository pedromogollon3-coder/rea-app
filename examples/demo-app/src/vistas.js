// Vistas de la aplicación: acceso, panel y mercado. La de órdenes se carga bajo demanda.
import * as api from './api.js';
import { store } from './store.js';
import { conectarPrecios, suscribir } from './tiempo-real.js';
import { navegar } from './router.js';

const $ = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
const moneda = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

export function vistaAcceso(raiz) {
  const nodo = $(`
    <section class="tarjeta">
      <h1>Acceso</h1>
      <form id="acceso">
        <label for="usuario">Usuario</label>
        <input id="usuario" name="usuario" autocomplete="username" />
        <label for="clave">Contraseña</label>
        <input id="clave" name="clave" type="password" autocomplete="current-password" />
        <button type="submit">Entrar</button>
        <p class="error" id="error-acceso" role="alert"></p>
      </form>
    </section>`);
  nodo.querySelector('form').addEventListener('submit', async function alEnviarAcceso(event) {
    event.preventDefault();
    try {
      const usuario = await api.iniciarSesion(nodo.querySelector('#usuario').value, nodo.querySelector('#clave').value);
      store.dispatch({ type: 'sesion/iniciada', usuario });
      navegar('/panel');
    } catch (err) {
      nodo.querySelector('#error-acceso').textContent = err.message;
    }
  });
  raiz.replaceChildren(nodo);
}

let sondeo = null;

export async function vistaPanel(raiz) {
  const nodo = $(`
    <section>
      <h1>Panel</h1>
      <div class="rejilla">
        <div class="tarjeta"><div class="etiqueta">Saldo disponible</div><div class="dato" id="saldo">—</div></div>
        <div class="tarjeta"><div class="etiqueta">Cuenta</div><div id="cuenta">—</div><div class="etiqueta" id="titular"></div></div>
      </div>
      <div class="tarjeta">
        <table>
          <thead><tr><th>Símbolo</th><th>Nombre</th><th>Último</th></tr></thead>
          <tbody id="simbolos"></tbody>
        </table>
      </div>
    </section>`);
  raiz.replaceChildren(nodo);
  const [cuenta, simbolos] = await Promise.all([api.obtenerCuenta(), api.obtenerSimbolos()]);
  nodo.querySelector('#cuenta').textContent = cuenta.iban;
  nodo.querySelector('#titular').textContent = cuenta.titular;
  store.dispatch({ type: 'mercado/simbolos', simbolos: simbolos.lista });
  nodo.querySelector('#simbolos').replaceChildren(
    ...simbolos.lista.map((s) => {
      const fila = $(`<tr class="fila-simbolo" data-simbolo="${s.codigo}"><td>${s.codigo}</td><td>${s.nombre}</td><td>${moneda(s.ultimo)}</td></tr>`);
      fila.addEventListener('click', function alElegirSimbolo() {
        seleccionarSimbolo(s.codigo);
      });
      return fila;
    }),
  );
  const refrescarSaldo = async () => {
    const saldo = await api.obtenerSaldo().catch(() => null);
    const destino = document.getElementById('saldo');
    if (saldo && destino) destino.textContent = moneda(saldo.disponible);
  };
  clearInterval(sondeo);
  sondeo = setInterval(refrescarSaldo, 600);
  refrescarSaldo();
}

export function seleccionarSimbolo(simbolo) {
  store.dispatch({ type: 'mercado/seleccionado', simbolo });
  suscribir(simbolo);
  navegar('/mercado/' + simbolo);
}

let calculadora = null;
let trabajador = null;

async function cargarCalculadora() {
  if (!calculadora) calculadora = (await WebAssembly.instantiateStreaming(fetch('/calc.wasm'))).instance.exports;
  return calculadora;
}

export async function vistaMercado(raiz, simbolo) {
  clearInterval(sondeo);
  const nodo = $(`
    <section>
      <h1>Mercado · <span id="simbolo-actual">${simbolo}</span></h1>
      <div class="pestanas">
        <button type="button" class="secundario" data-simbolo="SOL">SOL</button>
        <button type="button" class="secundario" data-simbolo="LUNA">LUNA</button>
        <button type="button" class="secundario" data-simbolo="MAR">MAR</button>
      </div>
      <div class="tarjeta"><canvas id="grafico" width="960" height="280"></canvas></div>
      <div class="tarjeta"><span class="etiqueta">Media móvil (calculada en un worker)</span> <strong id="media">—</strong> · <span class="etiqueta">Variación (WebAssembly)</span> <strong id="variacion">—</strong></div>
    </section>`);
  raiz.replaceChildren(nodo);
  nodo.querySelectorAll('[data-simbolo]').forEach((boton) =>
    boton.addEventListener('click', function alCambiarSimbolo() {
      seleccionarSimbolo(boton.dataset.simbolo);
    }),
  );
  store.dispatch({ type: 'mercado/seleccionado', simbolo });
  conectarPrecios();
  suscribir(simbolo);
  const historico = await api.obtenerHistorico(simbolo);
  const calc = await cargarCalculadora();
  if (!trabajador) trabajador = new Worker('/worker.js');
  trabajador.onmessage = (event) => {
    const destino = document.getElementById('media');
    if (destino) destino.textContent = moneda(event.data.media);
  };
  const lienzo = nodo.querySelector('#grafico');
  const ctx = lienzo.getContext('2d');
  const dibujar = function dibujarGrafico() {
    if (!lienzo.isConnected) return desuscribir();
    const vivos = store.getState().mercado.precios[simbolo] ?? [];
    const serie = [...historico.velas.map((v) => v.cierre), ...vivos].slice(-120);
    const min = Math.min(...serie);
    const max = Math.max(...serie);
    ctx.clearRect(0, 0, lienzo.width, lienzo.height);
    ctx.strokeStyle = '#2bb3a3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    serie.forEach((p, i) => {
      const x = (i / (serie.length - 1)) * lienzo.width;
      const y = lienzo.height - ((p - min) / (max - min || 1)) * (lienzo.height - 20) - 10;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.stroke();
    const variacion = calc.sumar(Math.round(serie[serie.length - 1] * 100), -Math.round(serie[0] * 100)) / 100;
    document.getElementById('variacion').textContent = (variacion >= 0 ? '+' : '') + variacion.toFixed(2);
    trabajador.postMessage({ simbolo, precios: serie, ventana: 20 });
  };
  const desuscribir = store.subscribe(dibujar);
  dibujar();
}

export async function vistaOrdenes(raiz) {
  clearInterval(sondeo);
  const modulo = await import('./ordenes.js');
  return modulo.vistaOrdenes(raiz);
}
