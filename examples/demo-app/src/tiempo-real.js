// Canal en tiempo real: precios por WebSocket y avisos por Server-Sent Events.
import { store } from './store.js';

let socket = null;

export function conectarPrecios() {
  if (socket) return;
  socket = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
  socket.addEventListener('open', () => suscribir(store.getState().mercado.seleccionado));
  socket.addEventListener('message', function alRecibirMensaje(event) {
    const msg = JSON.parse(event.data);
    if (msg.type === 'ping') socket.send(JSON.stringify({ type: 'pong', t: msg.t }));
    else if (msg.type === 'tick') store.dispatch({ type: 'mercado/precio', simbolo: msg.s, precio: msg.p });
  });
  socket.addEventListener('close', () => (socket = null));
}

export function suscribir(simbolo) {
  if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'subscribe', symbols: [simbolo] }));
}

export function desconectarPrecios() {
  if (socket) socket.close();
}

export function escucharAvisos() {
  const fuente = new EventSource('/api/avisos');
  fuente.addEventListener('aviso', (event) => {
    document.getElementById('avisos').textContent = JSON.parse(event.data).texto;
  });
  return fuente;
}
