// Worker de ejemplo: calcula la media móvil fuera del hilo principal.
self.onmessage = (event) => {
  const precios = event.data.precios;
  const ventana = event.data.ventana;
  const ultimos = precios.slice(-ventana);
  const media = ultimos.reduce((a, b) => a + b, 0) / (ultimos.length || 1);
  self.postMessage({ simbolo: event.data.simbolo, media });
};
