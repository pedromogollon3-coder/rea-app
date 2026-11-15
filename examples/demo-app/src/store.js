// Almacén de estado mínimo con la misma interfaz que Redux (getState, dispatch, subscribe).

const inicial = {
  sesion: { usuario: null, iniciada: false },
  mercado: { simbolos: [], seleccionado: 'SOL', precios: {} },
  ordenes: { lista: [], enviando: false },
  ui: { ruta: '/', tema: 'oscuro' },
};

function reducir(estado, accion) {
  switch (accion.type) {
    case 'sesion/iniciada':
      return { ...estado, sesion: { usuario: accion.usuario, iniciada: true } };
    case 'sesion/cerrada':
      return { ...estado, sesion: { usuario: null, iniciada: false } };
    case 'mercado/simbolos':
      return { ...estado, mercado: { ...estado.mercado, simbolos: accion.simbolos } };
    case 'mercado/seleccionado':
      return { ...estado, mercado: { ...estado.mercado, seleccionado: accion.simbolo } };
    case 'mercado/precio': {
      const serie = [...(estado.mercado.precios[accion.simbolo] ?? []), accion.precio].slice(-120);
      return { ...estado, mercado: { ...estado.mercado, precios: { ...estado.mercado.precios, [accion.simbolo]: serie } } };
    }
    case 'ordenes/cargadas':
      return { ...estado, ordenes: { ...estado.ordenes, lista: accion.lista } };
    case 'ui/ruta':
      return { ...estado, ui: { ...estado.ui, ruta: accion.ruta } };
    default:
      return estado;
  }
}

function crearAlmacen() {
  let estado = inicial;
  const oyentes = new Set();
  return {
    getState: () => estado,
    dispatch(accion) {
      estado = reducir(estado, accion);
      oyentes.forEach((fn) => fn());
      return accion;
    },
    subscribe(fn) {
      oyentes.add(fn);
      return () => oyentes.delete(fn);
    },
  };
}

export const store = crearAlmacen();
window.store = store;
