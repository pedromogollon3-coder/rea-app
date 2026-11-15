// Vista de órdenes. Se carga bajo demanda (import dinámico) al entrar en /ordenes.
import * as api from './api.js';
import { store } from './store.js';

function pintarOrdenes(cuerpo, lista) {
  cuerpo.replaceChildren(
    ...lista.map((o) => {
      const fila = document.createElement('tr');
      fila.className = 'fila-orden';
      fila.innerHTML = `<td>${o.id}</td><td>${o.simbolo}</td><td class="${o.lado === 'compra' ? 'sube' : 'baja'}">${o.lado}</td><td>${o.cantidad}</td><td>${o.estado}</td>`;
      return fila;
    }),
  );
}

export async function vistaOrdenes(raiz) {
  raiz.innerHTML = `
    <section>
      <h1>Órdenes</h1>
      <div class="tarjeta">
        <form id="nueva-orden">
          <label for="orden-simbolo">Símbolo</label>
          <select id="orden-simbolo" name="simbolo"><option>SOL</option><option>LUNA</option><option>MAR</option></select>
          <label for="orden-cantidad">Cantidad</label>
          <input id="orden-cantidad" name="cantidad" type="number" min="1" value="1" />
          <button type="submit" id="enviar-orden">Enviar orden</button>
        </form>
      </div>
      <div class="tarjeta">
        <table>
          <thead><tr><th>N.º</th><th>Símbolo</th><th>Lado</th><th>Cantidad</th><th>Estado</th></tr></thead>
          <tbody id="lista-ordenes"></tbody>
        </table>
      </div>
    </section>`;
  const cuerpo = raiz.querySelector('#lista-ordenes');
  const cargar = async function cargarOrdenes() {
    const datos = await api.obtenerOrdenes();
    store.dispatch({ type: 'ordenes/cargadas', lista: datos.ordenes });
    pintarOrdenes(cuerpo, datos.ordenes);
  };
  raiz.querySelector('#nueva-orden').addEventListener('submit', async function enviarOrden(event) {
    event.preventDefault();
    await api.crearOrden({ simbolo: raiz.querySelector('#orden-simbolo').value, lado: 'compra', cantidad: Number(raiz.querySelector('#orden-cantidad').value) });
    await cargar();
  });
  await cargar();
}
