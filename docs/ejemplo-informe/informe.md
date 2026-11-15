# Informe de ingeniería inversa: localhost:4174

> Generado por REA APP v0.1.0 el 2026-11-15 21:46 UTC. REA APP está pensada para aplicaciones propias, autorizadas o de estudio. No introduce credenciales ni evade inicios de sesión, CAPTCHAs, pagos o protecciones anti-bot; no acciona operaciones con efectos reales; limita el ritmo de peticiones y enmascara tokens, cookies y datos personales.

| Dato | Valor |
|---|---|
| Aplicación | http://localhost:4174/ |
| Título | Faro Mercados — aplicación de ejemplo |
| Estado HTTP inicial | 200 |
| Abierta | 2026-11-15T21:46:10.860Z |
| Navegador | Chromium de Playwright 159.0.8154.6 |
| Sesión de usuario | iniciada a mano por el usuario |
| Modo privado | sí: sin capturas, texto del HTML oculto y dígitos enmascarados |
| robots.txt | respetado (sin regla aplicable) |

## 1. Resumen

- **Faro Mercados — aplicación de ejemplo** — 4 vista(s) registradas, 6 ruta(s) visitadas. History API (pushState): navegación sin recargar la página.
- No se identificó un framework de cliente.
- Renderizado: mixto: interfaz en DOM y zonas dibujadas en <canvas> (2D). 1 módulo(s) WebAssembly. 1 worker(s).
- 4 scripts; código original recuperado de 3 source map(s) (7 módulos).
- 11 endpoint(s) propios.
- Tiempo real: 1 WebSocket(s), 1 flujo(s) SSE, 1 endpoint(s) con sondeo.
- Estado: Redux.
- El usuario inició sesión durante el análisis: la sesión se trató en modo privado.
- 4 flujo(s) analizados (6 pasos).

### Pregunta planteada

> ¿Cómo llegan los precios al gráfico y qué ocurre al cambiar de símbolo?

### Análisis

**Es una aplicación de una sola página con enrutado por History API, estado en un almacén tipo Redux y precios empujados por WebSocket; el gráfico se dibuja en un `<canvas>` 2D a partir de ese estado.**

**Cómo llegan los precios al gráfico**

1. **Carga inicial.** Al entrar en `/mercado/:simbolo`, `vistaMercado` pide el histórico con `GET /api/historico/:simbolo?velas=60` (autenticada con cookie, `Authorization: Bearer` y cabecera anti-CSRF) [API] y abre el WebSocket con `conectarPrecios` (`sources/003-main/src/tiempo-real.js:6`) [FLU-01].
2. **Suscripción.** El cliente envía `{ type: "subscribe", symbols: [...] }` [TRE-03]. A partir de ahí el servidor empuja mensajes `type=tick` con forma `{ type, s, p, t }` a unos 6 por segundo [TRE-02], y un `type=ping` cada 0,5 s que el cliente responde con `type=pong` [TRE-01].
3. **Del mensaje al estado.** `alRecibirMensaje` (`tiempo-real.js:10`) convierte cada `tick` en una acción `mercado/precio` del almacén. El almacén guarda la serie por símbolo en `mercado.precios` [EST-01].
4. **Del estado al lienzo.** La vista está suscrita al almacén: en cada cambio redibuja el `<canvas id="grafico">` uniendo el histórico con los precios en vivo. Por eso el DOM apenas cambia: lo que se mueve está dentro del lienzo [RUN-01].
5. **Cálculo fuera del hilo principal.** La variación se calcula con la función `sumar` de un módulo WebAssembly [RUN-02] y la media móvil en un Web Worker (`/worker.js`) [RUN-03].

**Qué ocurre al cambiar de símbolo** [FLU-02]

El botón llama a `alCambiarSimbolo` → `seleccionarSimbolo` (`sources/003-main/src/vistas.js:81`), que hace tres cosas: actualiza `mercado.seleccionado` en el almacén, envía un nuevo `subscribe` por el mismo WebSocket (no se abre otra conexión) y navega con `pushState` a `/mercado/<símbolo>`. El enrutador vuelve a montar la vista, que pide el histórico del nuevo símbolo. En la traza se ven dos `subscribe`: uno desde `seleccionarSimbolo` y otro al montar la vista; es redundante pero inocuo.

**Otros hallazgos**

- La vista de órdenes es código cargado bajo demanda: el trozo `ordenes-*.js` solo se descarga al entrar en `/ordenes` [FLU-03].
- Enviar una orden es un `POST /api/ordenes` seguido de una recarga de la lista [FLU-06]. La herramienta se negó a pulsar ese botón [FLU-04]; el flujo se grabó mientras lo hacía el usuario.
- El saldo no llega por WebSocket: se sondea `GET /api/saldo` cada 0,6 s [TRE-05], y los avisos llegan por Server-Sent Events [TRE-04].
- El token de sesión está en `sessionStorage`, legible por JavaScript, además de la cookie `sid` HttpOnly [AUT-06].

**Inferido, no observado:** que el servidor filtre los `tick` por el símbolo suscrito (solo se vio un símbolo a la vez). La ruta `/ajustes/seguridad` está declarada en el código pero no se visitó.

## 2. Arquitectura de la aplicación

### 2.1 Rutas y vistas

- **Enrutado: History API (pushState): navegación sin recargar la página** [RUT-01]
  6 ruta(s) distintas visitadas; 1 documento(s) HTML cargados. / (carga), /acceso (replaceState), /panel (pushState), /mercado/LUNA (pushState), /mercado/MAR (pushState), /ordenes (pushState)
  Evidencia: `runtime/hooks.json`, `network/requests.jsonl`
- **4 vista(s) registradas** [RUT-02]
  1. inicio → /acceso (29 elementos, 1 formularios, 0 lienzos); 2. panel → /panel (50 elementos, 0 formularios, 0 lienzos, privada); 3. mercado → /mercado/LUNA (34 elementos, 0 formularios, 1 lienzos, privada); 4. órdenes → /ordenes (60 elementos, 1 formularios, 0 lienzos, privada)
  Evidencia: `views/01-inicio/dom.json`, `views/02-panel/dom.json`, `views/03-mercado/dom.json`
- **5 ruta(s) declaradas en el código** [RUT-03] _(confianza media)_
  /acceso, /panel, /mercado/:simbolo, /ordenes, /ajustes/seguridad. No visitadas todavía: /ajustes/seguridad.
  Evidencia: `sources/003-main/src/main.js:9`, `sources/003-main/src/main.js:10`, `sources/003-main/src/main.js:11`
- **Carga diferida de código en 2 ruta(s)** [RUT-04]
  /mercado/LUNA: worker.js; /ordenes: ordenes-64EE277D.js
  Evidencia: `network/requests.jsonl:19`, `network/requests.jsonl:21`

| # | Vista | Ruta | Elementos | Formularios | Lienzos | Privada |
|---|---|---|---|---|---|---|
| 1 | inicio | `/acceso` | 29 | 1 | 0 | no |
| 2 | panel | `/panel` | 50 | 0 | 0 | sí |
| 3 | mercado | `/mercado/LUNA` | 34 | 0 | 1 | sí |
| 4 | órdenes | `/ordenes` | 60 | 1 | 0 | sí |

### 2.2 Entorno de ejecución y renderizado

- **Renderizado: mixto: interfaz en DOM y zonas dibujadas en <canvas> (2D)** [RUN-01]
  Contextos de dibujo: 2 × 2d (mayor 960×280; #grafico).
  Evidencia: `runtime/hooks.json`
- **WebAssembly: 1 módulo(s) instanciados, 1 archivo(s) .wasm descargados (43 bytes)** [RUN-02]
  Módulo 1 (instantiateStreaming): exporta function sumar; importa nada.
  Evidencia: `runtime/hooks.json`, `network/requests.jsonl:18`
- **1 worker(s): Worker** [RUN-03]
  Worker http://localhost:4174/worker.js
  Evidencia: `runtime/hooks.json`

### 2.3 Scripts y lógica de cliente

- **Source map recuperado para main.js: 4 módulos originales** [SCR-01]
  De 4 fuentes listadas en el mapa (0 son dependencias de node_modules o no traen contenido). Código original en sources/003-main/.
  Evidencia: `sourcemaps/003-main.map`, `sources/003-main/src/router.js:1`, `sources/003-main/src/tiempo-real.js:1`
- **Source map recuperado para chunk-PQSTSWEX.js: 2 módulos originales** [SCR-02]
  De 2 fuentes listadas en el mapa (0 son dependencias de node_modules o no traen contenido). Código original en sources/004-chunk-PQSTSWEX/.
  Evidencia: `sourcemaps/004-chunk-PQSTSWEX.map`, `sources/004-chunk-PQSTSWEX/src/api.js:1`, `sources/004-chunk-PQSTSWEX/src/store.js:1`
- **Source map recuperado para ordenes-64EE277D.js: 1 módulos originales** [SCR-03]
  De 1 fuentes listadas en el mapa (0 son dependencias de node_modules o no traen contenido). Código original en sources/021-ordenes-64EE277D/.
  Evidencia: `sourcemaps/021-ordenes-64EE277D.map`, `sources/021-ordenes-64EE277D/src/ordenes.js:1`
- **4 scripts: 4 externos (0 de terceros) y 0 en línea** [SCR-04]
  11 KB de JavaScript; 1 minificados.
  Evidencia: `sources/index.json`, `scripts/raw/003-main.js:1`, `scripts/raw/004-chunk-PQSTSWEX.js:1`
- **Puntos de entrada en el código propio** [SCR-05] _(confianza media)_
  3 × almacenamiento local, 11 × manejador de evento, 2 × historial/ruteo, 1 × WebSocket, 4 × petición fetch
  Evidencia: `sources/003-main/src/main.js:23`, `sources/003-main/src/main.js:26`, `sources/003-main/src/router.js:31`

Puntos de entrada localizados en el código propio:

| Tipo | Ubicación | Código |
|---|---|---|
| almacenamiento local | `sources/003-main/src/main.js:23` | `localStorage.setItem('faro.tema', 'oscuro');` |
| manejador de evento | `sources/003-main/src/main.js:26` | `document.getElementById('salir').addEventListener('click', async function alSalir() {` |
| historial/ruteo | `sources/003-main/src/router.js:31` | `if (reemplazar) history.replaceState(null, '', camino);` |
| historial/ruteo | `sources/003-main/src/router.js:32` | `else history.pushState(null, '', camino);` |
| manejador de evento | `sources/003-main/src/router.js:37` | `window.addEventListener('popstate', pintar);` |
| manejador de evento | `sources/003-main/src/router.js:38` | `document.addEventListener('click', function alPulsarEnlace(event) {` |
| WebSocket | `sources/003-main/src/tiempo-real.js:8` | `socket = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');` |
| manejador de evento | `sources/003-main/src/tiempo-real.js:9` | `socket.addEventListener('open', () => suscribir(store.getState().mercado.seleccionado));` |
| manejador de evento | `sources/003-main/src/tiempo-real.js:10` | `socket.addEventListener('message', function alRecibirMensaje(event) {` |
| manejador de evento | `sources/003-main/src/tiempo-real.js:15` | `socket.addEventListener('close', () => (socket = null));` |
| manejador de evento | `sources/003-main/src/tiempo-real.js:28` | `fuente.addEventListener('aviso', (event) => {` |
| manejador de evento | `sources/003-main/src/vistas.js:27` | `nodo.querySelector('form').addEventListener('submit', async function alEnviarAcceso(event) {` |
| manejador de evento | `sources/003-main/src/vistas.js:65` | `fila.addEventListener('click', function alElegirSimbolo() {` |
| petición fetch | `sources/003-main/src/vistas.js:91` | `if (!calculadora) calculadora = (await WebAssembly.instantiateStreaming(fetch('/calc.wasm'))).instance.exports;` |
| manejador de evento | `sources/003-main/src/vistas.js:110` | `boton.addEventListener('click', function alCambiarSimbolo() {` |
| almacenamiento local | `sources/004-chunk-PQSTSWEX/src/api.js:7` | `const token = sessionStorage.getItem(CLAVE_TOKEN);` |
| petición fetch | `sources/004-chunk-PQSTSWEX/src/api.js:12` | `const res = await fetch(ruta, { ...opciones, headers: cabeceras(opciones.headers) });` |
| petición fetch | `sources/004-chunk-PQSTSWEX/src/api.js:18` | `const res = await fetch('/api/sesion', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ usuario, cl` |
| almacenamiento local | `sources/004-chunk-PQSTSWEX/src/api.js:21` | `sessionStorage.setItem(CLAVE_TOKEN, datos.token);` |
| petición fetch | `sources/004-chunk-PQSTSWEX/src/api.js:33` | `await fetch('/api/sesion', { method: 'DELETE', headers: cabeceras() });` |
| manejador de evento | `sources/021-ordenes-64EE277D/src/ordenes.js:42` | `raiz.querySelector('#nueva-orden').addEventListener('submit', async function enviarOrden(event) {` |

### 2.4 Estado

- **Almacén de estado Redux (window.store): 4 secciones** [EST-01]
  Secciones: sesion, mercado, ordenes, ui. Forma: {sesion:{usuario:{id:number,nombre:string},iniciada:boolean},mercado:{simbolos:[objeto,×3],seleccionado:string,precios:{LUNA:arreglo,MAR:arreglo}},ordenes:{lista:[objeto,×3],enviando:boolean},ui:{ruta:string,tema:string}}
  Evidencia: `state/snapshot.json`
- **2 globales añadidos a window por la aplicación** [EST-02]
  Objetos: store, FARO_CONFIG. Funciones y valores: ninguno.
  Evidencia: `state/snapshot.json`
- **Configuración o estado inicial en window.FARO_CONFIG** [EST-03] _(confianza media)_
  Forma: {entorno:string,api:string,funciones:{ordenesRapidas:boolean,graficoWebgl:boolean},sondeoSaldoMs:number}
  Evidencia: `state/snapshot.json`

### 2.5 Estructura de la última vista

- **Documento con 60 elementos y profundidad máxima 8** [VIS-01]
  1 hojas de estilo, 0 iframes, 0 raíces shadow DOM.
  Evidencia: `dom/snapshot.json`, `page.html:1`
- **5 secciones o regiones identificadas** [VIS-02]
  header → body > header; nav «Principal» → #menu; main «Órdenes» → #vista; section «Órdenes» → #vista > section; footer → body > footer
  Evidencia: `page.html:8`, `page.html:10`, `page.html:18`
- **Formulario #nueva-orden (GET sin action)** [VIS-03]
  Campos: simbolo:select, cantidad:number. Envío: Enviar orden. Sin atributo action: probablemente lo gestiona JavaScript.
  Evidencia: `page.html:22`
- **2 botones (1 fuera de formularios)** [VIS-04]
  «Salir» #salir; «Enviar orden» #enviar-orden
  Evidencia: `page.html:16`, `page.html:27`
- **3 enlaces: 3 internos, 0 externos, 0 de ancla** [VIS-05]
  Evidencia: `dom/snapshot.json`
- **Accesibilidad básica: sin observaciones en las comprobaciones automáticas** [VIS-06]
  lang, main, h1, alt, etiquetas y nombres accesibles correctos. Idioma declarado: es; 3 elementos con atributos ARIA o role.
  Evidencia: `dom/snapshot.json`

## 3. Datos y comunicación

### 3.1 API

- **Endpoint GET /api/avisos → 200 text/event-stream** [API-01]
  1 llamada(s) a http://localhost:4174. Autenticación: cookie. Se llama desde: /panel.
  Evidencia: `network/requests.jsonl:9`
- **Endpoint GET /api/cuenta → 200 application/json** [API-02]
  1 llamada(s) a http://localhost:4174. Forma de la respuesta: { iban: string titular: string divisa: string }. Autenticación: cookie, authorization: bearer, cabecera anti-CSRF x-csrf-token. Se llama desde: /panel. Lo dispara pedir en src/api.js:12.
  Evidencia: `network/requests.jsonl:7`, `sources/004-chunk-PQSTSWEX/src/api.js:12`
- **Endpoint GET /api/historico/LUNA → 200 application/json** [API-03]
  1 llamada(s) a http://localhost:4174. Parámetros de consulta: velas: número. Forma de la respuesta: { simbolo: string velas: { t: number cierre: number }[] }. Autenticación: cookie, authorization: bearer, cabecera anti-CSRF x-csrf-token. Se llama desde: /mercado/LUNA. Lo dispara pedir en src/api.js:12.
  Evidencia: `network/requests.jsonl:17`, `sources/004-chunk-PQSTSWEX/src/api.js:12`
- **Endpoint GET /api/historico/MAR → 200 application/json** [API-04]
  1 llamada(s) a http://localhost:4174. Parámetros de consulta: velas: número. Forma de la respuesta: { simbolo: string velas: { t: number cierre: number }[] }. Autenticación: cookie, authorization: bearer, cabecera anti-CSRF x-csrf-token. Se llama desde: /mercado/MAR. Lo dispara pedir en src/api.js:12.
  Evidencia: `network/requests.jsonl:20`, `sources/004-chunk-PQSTSWEX/src/api.js:12`
- **Endpoint GET /api/ordenes → 200 application/json** [API-05]
  2 llamada(s) a http://localhost:4174. Forma de la respuesta: { ordenes: { id: number simbolo: string lado: string cantidad: number estado: string }[] }. Autenticación: cookie, authorization: bearer, cabecera anti-CSRF x-csrf-token. Se llama desde: /ordenes. Lo dispara pedir en src/api.js:12.
  Evidencia: `network/requests.jsonl:22`, `network/requests.jsonl:24`, `sources/004-chunk-PQSTSWEX/src/api.js:12`
- **Endpoint POST /api/ordenes → 201 application/json** [API-06]
  1 llamada(s) a http://localhost:4174. Cuerpo enviado: { simbolo: string lado: string cantidad: number }. Forma de la respuesta: { orden: { id: number simbolo: string lado: string cantidad: number estado: string } }. Autenticación: cookie, authorization: bearer, cabecera anti-CSRF x-csrf-token. Se llama desde: /ordenes. Lo dispara pedir en src/api.js:12.
  Evidencia: `network/requests.jsonl:23`, `sources/004-chunk-PQSTSWEX/src/api.js:12`
- **Endpoint GET /api/saldo → 200 application/json** [API-07]
  7 llamada(s) a http://localhost:4174. Forma de la respuesta: { disponible: number retenido: number actualizado: string<fecha> }. Autenticación: cookie, authorization: bearer, cabecera anti-CSRF x-csrf-token. Se llama desde: /panel. Lo dispara pedir en src/api.js:12.
  Evidencia: `network/requests.jsonl:10`, `network/requests.jsonl:11`, `network/requests.jsonl:12`
- **Endpoint POST /api/sesion → 200 application/json** [API-08]
  1 llamada(s) a http://localhost:4174. Cuerpo enviado: { usuario: string clave: string }. Forma de la respuesta: { token: string<jwt> csrf: string usuario: { id: number nombre: string } }. Se llama desde: /acceso. Lo dispara iniciarSesion en src/api.js:18.
  Evidencia: `network/requests.jsonl:6`, `sources/004-chunk-PQSTSWEX/src/api.js:18`
- **Endpoint GET /api/simbolos → 200 application/json** [API-09]
  1 llamada(s) a http://localhost:4174. Forma de la respuesta: { lista: { codigo: string nombre: string ultimo: number }[] }. Autenticación: cookie, authorization: bearer, cabecera anti-CSRF x-csrf-token. Se llama desde: /panel. Lo dispara pedir en src/api.js:12.
  Evidencia: `network/requests.jsonl:8`, `sources/004-chunk-PQSTSWEX/src/api.js:12`
- **Endpoint GET /api/yo → 401 application/json** [API-10]
  1 llamada(s) a http://localhost:4174. Se llama desde: /acceso. Lo dispara pedir en src/api.js:12.
  Evidencia: `network/requests.jsonl:4`, `sources/004-chunk-PQSTSWEX/src/api.js:12`
- **Endpoint GET /calc.wasm → 200 application/wasm** [API-11]
  1 llamada(s) a http://localhost:4174. Autenticación: cookie. Se llama desde: /mercado/LUNA. Lo dispara cargarCalculadora en src/vistas.js:91.
  Evidencia: `network/requests.jsonl:18`, `sources/003-main/src/vistas.js:91`
- **WebSocket ws://localhost:4174/ws: 38 mensajes enviados, 150 recibidos** [API-12]
  Entramado json; 4 tipos de mensaje. El detalle del protocolo está en app_realtime.
  Evidencia: `network/websockets.json`
- **Sin llamadas a dominios de terceros durante la captura** [API-13]
  Evidencia: `network/requests.jsonl`
- **1 peticiones fallidas o con error HTTP** [API-14]
  HTTP 401 http://localhost:4174/api/yo
  Evidencia: `network/requests.jsonl:4`

| Método | Ruta | Origen | Estado | Parámetros | Autenticación | Desde | Disparado por | Evidencia |
|---|---|---|---|---|---|---|---|---|
| GET | `/api/avisos` | http://localhost:4174 | 200 | — | cookie | /panel | — | `network/requests.jsonl:9` |
| GET | `/api/cuenta` | http://localhost:4174 | 200 | — | cookie, authorization: bearer, cabecera anti-CSRF x-csrf-token | /panel | pedir en src/api.js:12 | `network/requests.jsonl:7` |
| GET | `/api/historico/LUNA` | http://localhost:4174 | 200 | velas: número | cookie, authorization: bearer, cabecera anti-CSRF x-csrf-token | /mercado/LUNA | pedir en src/api.js:12 | `network/requests.jsonl:17` |
| GET | `/api/historico/MAR` | http://localhost:4174 | 200 | velas: número | cookie, authorization: bearer, cabecera anti-CSRF x-csrf-token | /mercado/MAR | pedir en src/api.js:12 | `network/requests.jsonl:20` |
| GET | `/api/ordenes` | http://localhost:4174 | 200 | — | cookie, authorization: bearer, cabecera anti-CSRF x-csrf-token | /ordenes | pedir en src/api.js:12 | `network/requests.jsonl:22`, `network/requests.jsonl:24` |
| POST | `/api/ordenes` | http://localhost:4174 | 201 | — | cookie, authorization: bearer, cabecera anti-CSRF x-csrf-token | /ordenes | pedir en src/api.js:12 | `network/requests.jsonl:23` |
| GET | `/api/saldo` | http://localhost:4174 | 200 | — | cookie, authorization: bearer, cabecera anti-CSRF x-csrf-token | /panel | pedir en src/api.js:12 | `network/requests.jsonl:10`, `network/requests.jsonl:11` |
| POST | `/api/sesion` | http://localhost:4174 | 200 | — | — | /acceso | iniciarSesion en src/api.js:18 | `network/requests.jsonl:6` |
| GET | `/api/simbolos` | http://localhost:4174 | 200 | — | cookie, authorization: bearer, cabecera anti-CSRF x-csrf-token | /panel | pedir en src/api.js:12 | `network/requests.jsonl:8` |
| GET | `/api/yo` | http://localhost:4174 | 401 | — | — | /acceso | pedir en src/api.js:12 | `network/requests.jsonl:4` |
| GET | `/calc.wasm` | http://localhost:4174 | 200 | — | cookie | /mercado/LUNA | cargarCalculadora en src/vistas.js:91 | `network/requests.jsonl:18` |

**`GET /api/cuenta`** — respuesta (esquema inferido, sin valores):

```ts
{
  iban: string
  titular: string
  divisa: string
}
```

**`GET /api/historico/LUNA`** — respuesta (esquema inferido, sin valores):

```ts
{
  simbolo: string
  velas: {
    t: number
    cierre: number
  }[]
}
```

**`GET /api/historico/MAR`** — respuesta (esquema inferido, sin valores):

```ts
{
  simbolo: string
  velas: {
    t: number
    cierre: number
  }[]
}
```

**`GET /api/ordenes`** — respuesta (esquema inferido, sin valores):

```ts
{
  ordenes: {
    id: number
    simbolo: string
    lado: string
    cantidad: number
    estado: string
  }[]
}
```

**`POST /api/ordenes`** — cuerpo enviado: `{ simbolo: string lado: string cantidad: number }` — respuesta (esquema inferido, sin valores):

```ts
{
  orden: {
    id: number
    simbolo: string
    lado: string
    cantidad: number
    estado: string
  }
}
```

**`GET /api/saldo`** — respuesta (esquema inferido, sin valores):

```ts
{
  disponible: number
  retenido: number
  actualizado: string<fecha>
}
```

**`POST /api/sesion`** — cuerpo enviado: `{ usuario: string clave: string }` — respuesta (esquema inferido, sin valores):

```ts
{
  token: string<jwt>
  csrf: string
  usuario: {
    id: number
    nombre: string
  }
}
```

**`GET /api/simbolos`** — respuesta (esquema inferido, sin valores):

```ts
{
  lista: {
    codigo: string
    nombre: string
    ultimo: number
  }[]
}
```

### 3.2 Tiempo real

- **WebSocket ws://localhost:4174/ws: entramado json, 38 mensajes enviados y 150 recibidos en 18 s** [TRE-01]
  Tipos que envía el cliente: type=subscribe (3). Tipos que envía el servidor: type=tick (6.4/s). Latido: type=ping cada ~0.5 s. La conexión seguía abierta.
  Evidencia: `network/websockets.json`
- **Mensaje recibido «type=tick»: 115 veces (6.4/s)** [TRE-02]
  Forma: { type: string s: string p: number t: number }. Tamaño medio 53 bytes.
  Evidencia: `network/websockets.json`
- **Mensaje enviado «type=subscribe»: 3 veces** [TRE-03]
  Forma: { type: string symbols: string[] }. Tamaño medio 38 bytes.
  Evidencia: `network/websockets.json`
- **Server-Sent Events: 1 flujo(s)** [TRE-04]
  http://localhost:4174/api/avisos. Eventos recibidos por tipo: aviso (32).
  Evidencia: `runtime/hooks.json`, `network/requests.jsonl`
- **Sondeo periódico: GET http://localhost:4174/api/saldo cada ~0.6 s** [TRE-05] _(confianza media)_
  7 llamadas a intervalos regulares.
  Evidencia: `network/requests.jsonl:10`

**ws://localhost:4174/ws** — json; latido type=ping cada ~0.5 s

| Dirección | Tipo de mensaje | Veces | Tamaño medio | Forma |
|---|---|---|---|---|
| enviado | `type=pong` | 35 | 33 B | `{ type: string t: number }` |
| enviado | `type=subscribe` | 3 | 38 B | `{ type: string symbols: string[] }` |
| recibido | `type=tick` | 115 | 53 B | `{ type: string s: string p: number t: number }` |
| recibido | `type=ping` | 35 | 33 B | `{ type: string t: number }` |

### 3.3 Autenticación y sesión

- **Sesión iniciada por el usuario durante el análisis** [AUT-01]
  Modo privado: activado (sin capturas, texto del HTML oculto, dígitos enmascarados). REA APP nunca introduce credenciales: si hay sesión, la abrió el usuario en la ventana.
  Evidencia: `capture.json`
- **Formulario de acceso en /acceso: GET (gestionado por JavaScript)** [AUT-02]
  Campos: usuario:text, clave:password.
  Evidencia: `views/01-inicio/dom.json`
- **Las llamadas a la API se autentican con: cookie (15), authorization: bearer (14), cabecera anti-CSRF x-csrf-token (14)** [AUT-03]
  17 llamadas a la API propia; 2 sin ningún mecanismo de autenticación visible.
  Evidencia: `network/requests.jsonl:7`
- **Endpoint de sesión GET /api/yo → 401** [AUT-04] _(confianza media)_
  Respondió 401/403: exige una sesión válida.
  Evidencia: `network/requests.jsonl:4`
- **Endpoint de sesión POST /api/sesion → 200** [AUT-05] _(confianza media)_
  Establece cookies: sid.
  Evidencia: `network/requests.jsonl:6`
- **Credenciales de sesión guardadas en el navegador: sid (cookie HttpOnly SameSite=Strict, hex); faro.token (sessionStorage, jwt)** [AUT-06]
  1 son legibles por JavaScript (faro.token): cualquier script de la página puede leerlas.
  Evidencia: `storage/snapshot.json`
- **Protección anti-CSRF por cabecera: x-csrf-token** [AUT-07]
  Evidencia: `network/requests.jsonl`

### 3.4 Almacenamiento en el navegador

- **1 cookies** [ALM-01]
  sid [localhost; hex, 36 car.; HttpOnly; sin Secure; SameSite=Strict; de sesión]
  Evidencia: `storage/snapshot.json`
- **1 cookie(s) con nombre sensible sin HttpOnly o sin Secure** [ALM-02] _(confianza media)_
  sid
  Evidencia: `storage/snapshot.json`
- **localStorage: 1 claves** [ALM-03]
  faro.tema (texto, 6 car.)
  Evidencia: `storage/snapshot.json`
- **sessionStorage: 1 claves** [ALM-04]
  faro.token (jwt, 73 car., sensible)
  Evidencia: `storage/snapshot.json`
- **1 clave(s) de aspecto sensible en almacenamiento accesible por JavaScript** [ALM-05] _(confianza media)_
  faro.token (jwt). Cualquier script de la página puede leerlas.
  Evidencia: `storage/snapshot.json`

## 4. Flujos analizados

- **Flujo «abrir un mercado», paso 1 (clic en tr[data-simbolo="LUNA"]): respondió alElegirSimbolo; 2 peticiones, 1 mensajes WebSocket; 176 cambios en el DOM** [FLU-01]
  Manejador: alElegirSimbolo en src/vistas.js:65 escucha «click» en el propio elemento, y se ejecutó. Funciones ejecutadas (27, más 4 de fondo descartadas): resolver en src/router.js:12, pintar en src/router.js:20, a en src/router.js:26, navegar en src/router.js:30, alPulsarEnlace en src/router.js:38, conectarPrecios en src/tiempo-real.js:6, alRecibirMensaje en src/tiempo-real.js:10, suscribir en src/tiempo-real.js:18, $ en src/vistas.js:7, alElegirSimbolo en src/vistas.js:65. Peticiones: GET http://localhost:4174/api/historico/LUNA?velas=60 → 200 (desde pedir en src/api.js:12); GET http://localhost:4174/calc.wasm → 200 (desde cargarCalculadora en src/vistas.js:91). Mensajes enviados por WebSocket: type=subscribe ×1. Código cargado bajo demanda: worker.js. Ruta: pushState → http://localhost:4174/mercado/LUNA. DOM: +1 section en #vista; +28 #texto(24) en #usuario-activo; +26 #texto(5) en #variacion; +26 #texto(7) en #media; +6 #texto(15) en #avisos; 87 nodos eliminados; 2 atributos cambiados (#menu > a:nth-of-type(1)@class, #menu > a:nth-of-type(2)@class); 0 cambios de texto.
  Evidencia: `sources/003-main/src/vistas.js:65`, `sources/003-main/src/router.js:38`, `sources/003-main/src/router.js:12`
- **Flujo «cambiar de símbolo», paso 1 (clic en button[data-simbolo="MAR"]): respondió alCambiarSimbolo; 1 peticiones, 2 mensajes WebSocket; 188 cambios en el DOM** [FLU-02]
  Manejador: alCambiarSimbolo en src/vistas.js:110 escucha «click» en el propio elemento, y se ejecutó. Funciones ejecutadas (18, más 13 de fondo descartadas): resolver en src/router.js:12, pintar en src/router.js:20, a en src/router.js:26, navegar en src/router.js:30, alPulsarEnlace en src/router.js:38, conectarPrecios en src/tiempo-real.js:6, suscribir en src/tiempo-real.js:18, $ en src/vistas.js:7, seleccionarSimbolo en src/vistas.js:81, cargarCalculadora en src/vistas.js:90. Peticiones: GET http://localhost:4174/api/historico/MAR?velas=60 → 200 (desde pedir en src/api.js:12). Mensajes enviados por WebSocket: type=subscribe ×2. Ruta: pushState → http://localhost:4174/mercado/MAR. DOM: +1 section en #vista; +29 #texto(24) en #usuario-activo; +29 #texto(5) en #variacion; +29 #texto(7) en #media; +6 #texto(15) en #avisos; 94 nodos eliminados; 0 atributos cambiados; 0 cambios de texto.
  Evidencia: `sources/003-main/src/vistas.js:110`, `sources/003-main/src/router.js:38`, `sources/003-main/src/router.js:12`
- **Flujo «abrir órdenes», paso 1 (clic en a[href="/ordenes"]): respondió alPulsarEnlace; 1 peticiones; 77 cambios en el DOM** [FLU-03]
  Manejador: alPulsarEnlace en src/router.js:38 escucha «click» en #document, y se ejecutó. Funciones ejecutadas (14, más 13 de fondo descartadas): resolver en src/router.js:12, pintar en src/router.js:20, a en src/router.js:26, navegar en src/router.js:30, alPulsarEnlace en src/router.js:38, vistaOrdenes en src/vistas.js:151, cabeceras en src/api.js:6, pedir en src/api.js:11, obtenerOrdenes en src/api.js:41, pintarOrdenes en src/ordenes.js:5. Peticiones: GET http://localhost:4174/api/ordenes → 200 (desde pedir en src/api.js:12). Código cargado bajo demanda: ordenes-64EE277D.js. Ruta: pushState → http://localhost:4174/ordenes. DOM: +2 tr.fila-orden en #lista-ordenes; +1 section en #vista; +28 #texto(24) en #usuario-activo; +5 #texto(15) en #avisos; +1 #texto(5) en #variacion; 36 nodos eliminados; 2 atributos cambiados (#menu > a:nth-of-type(2)@class, #menu > a:nth-of-type(3)@class); 0 cambios de texto.
  Evidencia: `sources/003-main/src/router.js:38`, `sources/003-main/src/router.js:12`, `sources/003-main/src/router.js:20`
- **Flujo «abrir órdenes», paso 2 (clic en #enviar-orden): acción rechazada** [FLU-04]
  Motivo: el control («Enviar orden enviar-orden») puede ejecutar una operación con efectos reales: REA APP no la acciona. Para estudiarla, grábala con app_record mientras el usuario la hace.
  Evidencia: `flows/flujo-03.json`
- **Flujo «enviar una orden», paso 1 (escribir 1 caracteres en input type=number (#orden-cantidad)): sin función identificada; 0 peticiones; 8 cambios en el DOM** [FLU-05] _(confianza media)_
  No se encontró un manejador registrado directamente sobre el elemento. Ninguna función propia del paso se ejecutó (solo 7 de fondo). No disparó peticiones de datos. DOM: +3 #texto(24) en #usuario-activo; +1 #texto(15) en #avisos; 4 nodos eliminados; 0 atributos cambiados; 0 cambios de texto.
  Evidencia: `flows/flujo-04.json`
- **Flujo «enviar una orden», paso 2 (clic en button type=submit «Enviar orden» (#enviar-orden) y enviar el formulario): respondió enviarOrden; 2 peticiones; 19 cambios en el DOM** [FLU-06]
  Manejador: enviarOrden en src/ordenes.js:42 escucha «submit» en form#nueva-orden, y se ejecutó. Funciones ejecutadas (9, más 8 de fondo descartadas): alPulsarEnlace en src/router.js:38, cabeceras en src/api.js:6, pedir en src/api.js:11, obtenerOrdenes en src/api.js:41, crearOrden en src/api.js:43, pintarOrdenes en src/ordenes.js:5, o en src/ordenes.js:7, cargarOrdenes en src/ordenes.js:37, enviarOrden en src/ordenes.js:42. Peticiones: POST http://localhost:4174/api/ordenes → 201 (desde pedir en src/api.js:12); GET http://localhost:4174/api/ordenes → 200 (desde pedir en src/api.js:12). DOM: +3 tr.fila-orden en #lista-ordenes; +6 #texto(24) en #usuario-activo; +1 #texto(15) en #avisos; 9 nodos eliminados; 0 atributos cambiados; 0 cambios de texto.
  Evidencia: `sources/021-ordenes-64EE277D/src/ordenes.js:42`, `sources/003-main/src/router.js:38`, `sources/003-main/src/router.js:38`

## 5. Stack tecnológico

- **Servidor: faro-app/1.0** [STK-01]
  server: faro-app/1.0
  Evidencia: `network/requests.jsonl:1`
- **Sin analítica ni seguimiento de terceros observados** [STK-02]
  Evidencia: `analysis/app_api.json`, `stack/probes.json`
- **Cabeceras de seguridad: 4 de 8 presentes** [STK-03]
  Presentes: content-security-policy, x-content-type-options, x-frame-options, referrer-policy. Ausentes: strict-transport-security, permissions-policy, cross-origin-opener-policy, cross-origin-resource-policy. La página se sirve por HTTP sin cifrar.
  Evidencia: `network/requests.jsonl:1`

| Cabecera de seguridad | Presente | Valor | Para qué sirve |
|---|---|---|---|
| `content-security-policy` | sí | `default-src 'self'; connect-src 'self' ws: wss:; script-src 'self' 'wasm-unsafe-eval'` | limita de dónde se cargan scripts y recursos |
| `strict-transport-security` | no | — | fuerza HTTPS (HSTS) |
| `x-content-type-options` | sí | `nosniff` | evita la detección automática de tipo MIME |
| `x-frame-options` | sí | `DENY` | evita que la página se incruste en iframes ajenos |
| `referrer-policy` | sí | `same-origin` | controla qué referente se envía |
| `permissions-policy` | no | — | restringe APIs del navegador |
| `cross-origin-opener-policy` | no | — | aísla la ventana de otros orígenes |
| `cross-origin-resource-policy` | no | — | limita quién puede cargar los recursos |

## 6. Evidencias

Cada hallazgo cita archivos de esta carpeta (`archivo:línea`).

| ID | Hallazgo | Confianza | Evidencia |
|---|---|---|---|
| SES-01 | La aplicación respondió con estado 200 y título «Faro Mercados — aplicación de ejemplo» | alta | `capture.json`<br>`views/01-inicio/page.html:1`<br>`screenshots/01-inicio.png` |
| SES-02 | 5 peticiones durante la carga inicial | alta | `network/requests.jsonl` |
| SES-03 | Barrera detectada: formulario de inicio de sesión | media | `views/01-inicio/page.html` |
| RUT-01 | Enrutado: History API (pushState): navegación sin recargar la página | alta | `runtime/hooks.json`<br>`network/requests.jsonl` |
| RUT-02 | 4 vista(s) registradas | alta | `views/01-inicio/dom.json` /acceso<br>`views/02-panel/dom.json` /panel<br>`views/03-mercado/dom.json` /mercado/LUNA<br>`views/04-rdenes/dom.json` /ordenes |
| RUT-03 | 5 ruta(s) declaradas en el código | media | `sources/003-main/src/main.js:9` /acceso<br>`sources/003-main/src/main.js:10` /panel<br>`sources/003-main/src/main.js:11` /mercado/:simbolo<br>`sources/003-main/src/main.js:12` /ordenes<br>`sources/003-main/src/main.js:13` /ajustes/seguridad |
| RUT-04 | Carga diferida de código en 2 ruta(s) | alta | `network/requests.jsonl:19` cargado desde /mercado/LUNA<br>`network/requests.jsonl:21` cargado desde /ordenes |
| VIS-01 | Documento con 60 elementos y profundidad máxima 8 | alta | `dom/snapshot.json`<br>`page.html:1` |
| VIS-02 | 5 secciones o regiones identificadas | alta | `page.html:8` body > header<br>`page.html:10` #menu<br>`page.html:18` #vista<br>`page.html:19` #vista > section<br>`page.html:37` body > footer |
| VIS-03 | Formulario #nueva-orden (GET sin action) | alta | `page.html:22` #nueva-orden |
| VIS-04 | 2 botones (1 fuera de formularios) | alta | `page.html:16` #salir<br>`page.html:27` #enviar-orden |
| VIS-05 | 3 enlaces: 3 internos, 0 externos, 0 de ancla | alta | `dom/snapshot.json` |
| VIS-06 | Accesibilidad básica: sin observaciones en las comprobaciones automáticas | alta | `dom/snapshot.json` |
| SCR-01 | Source map recuperado para main.js: 4 módulos originales | alta | `sourcemaps/003-main.map`<br>`sources/003-main/src/router.js:1`<br>`sources/003-main/src/tiempo-real.js:1`<br>`sources/003-main/src/vistas.js:1`<br>`sources/003-main/src/main.js:1` |
| SCR-02 | Source map recuperado para chunk-PQSTSWEX.js: 2 módulos originales | alta | `sourcemaps/004-chunk-PQSTSWEX.map`<br>`sources/004-chunk-PQSTSWEX/src/api.js:1`<br>`sources/004-chunk-PQSTSWEX/src/store.js:1` |
| SCR-03 | Source map recuperado para ordenes-64EE277D.js: 1 módulos originales | alta | `sourcemaps/021-ordenes-64EE277D.map`<br>`sources/021-ordenes-64EE277D/src/ordenes.js:1` |
| SCR-04 | 4 scripts: 4 externos (0 de terceros) y 0 en línea | alta | `sources/index.json`<br>`scripts/raw/003-main.js:1`<br>`scripts/raw/004-chunk-PQSTSWEX.js:1`<br>`scripts/raw/019-worker.js:1`<br>`scripts/raw/021-ordenes-64EE277D.js:1` |
| SCR-05 | Puntos de entrada en el código propio | media | `sources/003-main/src/main.js:23` almacenamiento local: localStorage.setItem('faro.tema', 'oscuro');<br>`sources/003-main/src/main.js:26` manejador de evento: document.getElementById('salir').addEventListener('click', async func<br>`sources/003-main/src/router.js:31` historial/ruteo: if (reemplazar) history.replaceState(null, '', camino);<br>`sources/003-main/src/router.js:32` historial/ruteo: else history.pushState(null, '', camino);<br>`sources/003-main/src/router.js:37` manejador de evento: window.addEventListener('popstate', pintar); |
| API-01 | Endpoint GET /api/avisos → 200 text/event-stream | alta | `network/requests.jsonl:9` |
| API-02 | Endpoint GET /api/cuenta → 200 application/json | alta | `network/requests.jsonl:7`<br>`sources/004-chunk-PQSTSWEX/src/api.js:12` origen de la llamada: pedir en src/api.js:12 |
| API-03 | Endpoint GET /api/historico/LUNA → 200 application/json | alta | `network/requests.jsonl:17`<br>`sources/004-chunk-PQSTSWEX/src/api.js:12` origen de la llamada: pedir en src/api.js:12 |
| API-04 | Endpoint GET /api/historico/MAR → 200 application/json | alta | `network/requests.jsonl:20`<br>`sources/004-chunk-PQSTSWEX/src/api.js:12` origen de la llamada: pedir en src/api.js:12 |
| API-05 | Endpoint GET /api/ordenes → 200 application/json | alta | `network/requests.jsonl:22`<br>`network/requests.jsonl:24`<br>`sources/004-chunk-PQSTSWEX/src/api.js:12` origen de la llamada: pedir en src/api.js:12 |
| API-06 | Endpoint POST /api/ordenes → 201 application/json | alta | `network/requests.jsonl:23`<br>`sources/004-chunk-PQSTSWEX/src/api.js:12` origen de la llamada: pedir en src/api.js:12 |
| API-07 | Endpoint GET /api/saldo → 200 application/json | alta | `network/requests.jsonl:10`<br>`network/requests.jsonl:11`<br>`network/requests.jsonl:12`<br>`network/requests.jsonl:13`<br>`network/requests.jsonl:14` |
| API-08 | Endpoint POST /api/sesion → 200 application/json | alta | `network/requests.jsonl:6`<br>`sources/004-chunk-PQSTSWEX/src/api.js:18` origen de la llamada: iniciarSesion en src/api.js:18 |
| API-09 | Endpoint GET /api/simbolos → 200 application/json | alta | `network/requests.jsonl:8`<br>`sources/004-chunk-PQSTSWEX/src/api.js:12` origen de la llamada: pedir en src/api.js:12 |
| API-10 | Endpoint GET /api/yo → 401 application/json | alta | `network/requests.jsonl:4`<br>`sources/004-chunk-PQSTSWEX/src/api.js:12` origen de la llamada: pedir en src/api.js:12 |
| API-11 | Endpoint GET /calc.wasm → 200 application/wasm | alta | `network/requests.jsonl:18`<br>`sources/003-main/src/vistas.js:91` origen de la llamada: cargarCalculadora en src/vistas.js:91 |
| API-12 | WebSocket ws://localhost:4174/ws: 38 mensajes enviados, 150 recibidos | alta | `network/websockets.json` |
| API-13 | Sin llamadas a dominios de terceros durante la captura | alta | `network/requests.jsonl` |
| API-14 | 1 peticiones fallidas o con error HTTP | alta | `network/requests.jsonl:4` |
| TRE-01 | WebSocket ws://localhost:4174/ws: entramado json, 38 mensajes enviados y 150 recibidos en 18 s | alta | `network/websockets.json` |
| TRE-02 | Mensaje recibido «type=tick»: 115 veces (6.4/s) | alta | `network/websockets.json` |
| TRE-03 | Mensaje enviado «type=subscribe»: 3 veces | alta | `network/websockets.json` |
| TRE-04 | Server-Sent Events: 1 flujo(s) | alta | `runtime/hooks.json`<br>`network/requests.jsonl` |
| TRE-05 | Sondeo periódico: GET http://localhost:4174/api/saldo cada ~0.6 s | media | `network/requests.jsonl:10` |
| EST-01 | Almacén de estado Redux (window.store): 4 secciones | alta | `state/snapshot.json` |
| EST-02 | 2 globales añadidos a window por la aplicación | alta | `state/snapshot.json` |
| EST-03 | Configuración o estado inicial en window.FARO_CONFIG | media | `state/snapshot.json` |
| RUN-01 | Renderizado: mixto: interfaz en DOM y zonas dibujadas en <canvas> (2D) | alta | `runtime/hooks.json` |
| RUN-02 | WebAssembly: 1 módulo(s) instanciados, 1 archivo(s) .wasm descargados (43 bytes) | alta | `runtime/hooks.json`<br>`network/requests.jsonl:18` http://localhost:4174/calc.wasm |
| RUN-03 | 1 worker(s): Worker | alta | `runtime/hooks.json` |
| AUT-01 | Sesión iniciada por el usuario durante el análisis | alta | `capture.json` |
| AUT-02 | Formulario de acceso en /acceso: GET (gestionado por JavaScript) | alta | `views/01-inicio/dom.json` #acceso |
| AUT-03 | Las llamadas a la API se autentican con: cookie (15), authorization: bearer (14), cabecera anti-CSRF x-csrf-token (14) | alta | `network/requests.jsonl:7` |
| AUT-04 | Endpoint de sesión GET /api/yo → 401 | media | `network/requests.jsonl:4` |
| AUT-05 | Endpoint de sesión POST /api/sesion → 200 | media | `network/requests.jsonl:6` |
| AUT-06 | Credenciales de sesión guardadas en el navegador: sid (cookie HttpOnly SameSite=Strict, hex); faro.token (sessionStorage, jwt) | alta | `storage/snapshot.json` |
| AUT-07 | Protección anti-CSRF por cabecera: x-csrf-token | alta | `network/requests.jsonl` |
| ALM-01 | 1 cookies | alta | `storage/snapshot.json` |
| ALM-02 | 1 cookie(s) con nombre sensible sin HttpOnly o sin Secure | media | `storage/snapshot.json` |
| ALM-03 | localStorage: 1 claves | alta | `storage/snapshot.json` |
| ALM-04 | sessionStorage: 1 claves | alta | `storage/snapshot.json` |
| ALM-05 | 1 clave(s) de aspecto sensible en almacenamiento accesible por JavaScript | media | `storage/snapshot.json` |
| STK-01 | Servidor: faro-app/1.0 | alta | `network/requests.jsonl:1` cabeceras del documento principal |
| STK-02 | Sin analítica ni seguimiento de terceros observados | alta | `analysis/app_api.json`<br>`stack/probes.json` |
| STK-03 | Cabeceras de seguridad: 4 de 8 presentes | alta | `network/requests.jsonl:1` cabeceras del documento principal |
| FLU-01 | Flujo «abrir un mercado», paso 1 (clic en tr[data-simbolo="LUNA"]): respondió alElegirSimbolo; 2 peticiones, 1 mensajes WebSocket; 176 cambi | alta | `sources/003-main/src/vistas.js:65` manejador de «click»: (anónima) · main.js:25:466 → original<br>`sources/003-main/src/router.js:38` manejador de «click»: (anónima) · main.js:1:948 → original<br>`sources/003-main/src/router.js:12` función ejecutada: z · main.js:1:272 → original<br>`sources/003-main/src/router.js:20` función ejecutada: f · main.js:1:382 → original<br>`sources/003-main/src/router.js:26` función ejecutada: (anónima) · main.js:1:604 → original |
| FLU-02 | Flujo «cambiar de símbolo», paso 1 (clic en button[data-simbolo="MAR"]): respondió alCambiarSimbolo; 1 peticiones, 2 mensajes WebSocket; 188 | alta | `sources/003-main/src/vistas.js:110` manejador de «click»: (anónima) · main.js:35:122 → original<br>`sources/003-main/src/router.js:38` manejador de «click»: (anónima) · main.js:1:948 → original<br>`sources/003-main/src/router.js:12` función ejecutada: z · main.js:1:272 → original<br>`sources/003-main/src/router.js:20` función ejecutada: f · main.js:1:382 → original<br>`sources/003-main/src/router.js:26` función ejecutada: (anónima) · main.js:1:604 → original |
| FLU-03 | Flujo «abrir órdenes», paso 1 (clic en a[href="/ordenes"]): respondió alPulsarEnlace; 1 peticiones; 77 cambios en el DOM | alta | `sources/003-main/src/router.js:38` manejador de «click»: (anónima) · main.js:1:948 → original<br>`sources/003-main/src/router.js:12` función ejecutada: z · main.js:1:272 → original<br>`sources/003-main/src/router.js:20` función ejecutada: f · main.js:1:382 → original<br>`sources/003-main/src/router.js:26` función ejecutada: (anónima) · main.js:1:604 → original<br>`sources/003-main/src/router.js:30` función ejecutada: d · main.js:1:769 → original |
| FLU-04 | Flujo «abrir órdenes», paso 2 (clic en #enviar-orden): acción rechazada | alta | `flows/flujo-03.json` |
| FLU-05 | Flujo «enviar una orden», paso 1 (escribir 1 caracteres en input type=number (#orden-cantidad)): sin función identificada; 0 peticiones; 8 c | media | `flows/flujo-04.json` |
| FLU-06 | Flujo «enviar una orden», paso 2 (clic en button type=submit «Enviar orden» (#enviar-orden) y enviar el formulario): respondió enviarOrden;  | alta | `sources/021-ordenes-64EE277D/src/ordenes.js:42` manejador de «submit»: (anónima) · ordenes-64EE277D.js:19:234 → original<br>`sources/003-main/src/router.js:38` manejador de «click»: (anónima) · main.js:1:948 → original<br>`sources/003-main/src/router.js:38` función ejecutada: (anónima) · main.js:1:940 → original<br>`sources/004-chunk-PQSTSWEX/src/api.js:6` función ejecutada: a · chunk-PQSTSWEX.js:1:25 → original<br>`sources/004-chunk-PQSTSWEX/src/api.js:11` función ejecutada: s · chunk-PQSTSWEX.js:1:150 → original |

## 7. Incógnitas

Lo que este análisis **no** pudo confirmar:

- (app_open) La red no queda en reposo: la aplicación mantiene conexiones abiertas o peticiones periódicas (habitual en aplicaciones en tiempo real).
- (app_open) Solo se conoce lo que se ha cargado hasta ahora: cada vista y cada flujo hay que visitarlos (app_snapshot, app_record, app_act) para que entren en el análisis.
- (app_routes) 1 ruta(s) aparecen en el código pero no se visitaron: su vista y sus datos no están analizados.
- (app_routes) Las rutas que exigen permisos, parámetros concretos o datos que esta cuenta no tiene pueden existir sin haberse visto.
- (app_view) La accesibilidad se revisó con comprobaciones estáticas básicas; contraste, orden de foco y lectores de pantalla no se evaluaron.
- (app_scripts) No se reconoció ningún framework o librería: puede ser JavaScript sin dependencias o una tecnología que no está en las firmas.
- (app_scripts) Los módulos cargados de forma diferida (import dinámico tras una interacción) solo aparecen si se cargaron durante la captura.
- (app_api) Los esquemas se infieren de las respuestas observadas: campos opcionales, paginación y errores no vistos pueden faltar.
- (app_api) No se conoce la lógica del servidor (validación, autorización, límites): solo su comportamiento visible desde el navegador.
- (app_api) Hay endpoints que respondieron 401/403: requieren una sesión que la herramienta no intenta obtener.
- (app_realtime) Solo se ven los tipos de mensaje que circularon durante la sesión; el protocolo puede tener más. El significado de cada campo se infiere de su nombre y forma.
- (app_state) Se registra la forma del estado (claves y tipos) en el momento de la última vista, nunca sus valores ni cómo cambia con el tiempo.
- (app_runtime) Lo que se dibuja dentro de un <canvas> no existe en el DOM: no hay elementos que inspeccionar ni selectores para accionarlo; solo se ve qué código y qué datos lo alimentan.
- (app_runtime) El código dentro de WebAssembly no se analiza: solo se conoce su interfaz (qué importa y qué exporta).
- (app_runtime) El código que corre en workers queda fuera de la cobertura de funciones y de la instrumentación de la página.
- (app_auth) No se conoce la duración de la sesión, la política de renovación ni las comprobaciones del servidor: solo lo que se vio en esta visita.
- (app_auth) Los valores de tokens y cookies no se registran en ningún momento; solo sus nombres, tipo y ubicación.
- (app_storage) Los valores están enmascarados a propósito: solo se conocen nombres, tipos y longitudes.
- (app_storage) Solo se ve el almacenamiento tras la carga inicial; lo que se escribe al iniciar sesión o interactuar no aparece.
- (app_stack) No se identificó el framework de cliente.
- (app_stack) No se identificó CDN ni proveedor de alojamiento por las cabeceras.
- (app_stack) El stack de servidor (lenguaje, base de datos, infraestructura) solo se infiere de cabeceras y puede estar oculto o falseado.
- (app_flows) Flujo «abrir órdenes», paso 2 (clic en #enviar-orden): no se ejecutó por los límites éticos, así que su efecto no se conoce.
- (app_flows) Flujo «enviar una orden», paso 1 (escribir 1 caracteres en input type=number (#orden-cantidad)): no se identificó qué código responde (puede ser comportamiento nativo, CSS o código en un worker).
- (app_flows) La cobertura indica qué funciones se ejecutaron en cada paso, no su orden exacto ni los valores que manejaron. El código que corre en workers o WebAssembly no aparece.
- (app_flows) En los flujos grabados a mano la atribución es por ventanas de tiempo (~0,3 s): los efectos de dos gestos muy seguidos pueden mezclarse.

## 8. Archivos de la sesión

- `informe.md`, `evidence.json`: este informe y sus datos estructurados.
- `captura.har`: tráfico de red con cabeceras y cuerpos sensibles enmascarados (se escribe al cerrar la aplicación con app_close).
- `views/` (4 vistas), `flows/` (4), `network/` (2), `runtime/`, `state/`, `storage/`.
- `scripts/raw/` (4), `sources/` (8 fuentes recuperadas o embellecidas), `screenshots/` (2), `analysis/` (12).
