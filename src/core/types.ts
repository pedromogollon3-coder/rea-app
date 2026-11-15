/** Tipos compartidos por el motor, el servidor MCP y la CLI. */

export const VERSION = '0.1.0';

export type Area = 'sesion' | 'vista' | 'scripts' | 'api' | 'flujo' | 'rutas' | 'tiemporeal' | 'estado' | 'runtime' | 'auth' | 'almacenamiento' | 'stack';
export type Confidence = 'alta' | 'media' | 'baja';

/** Referencia a un archivo de la sesión (ruta relativa a la carpeta de salida). */
export interface Evidence {
  file: string;
  line?: number;
  note?: string;
}

export interface Finding {
  id: string;
  area: Area;
  title: string;
  detail?: string;
  confidence: Confidence;
  evidence: Evidence[];
}

/** Forma común de lo que devuelve cada herramienta. */
export interface ToolResult<T = unknown> {
  tool: string;
  session: string;
  findings: Finding[];
  /** Lo que no se pudo confirmar. */
  unknowns: string[];
  /** Archivos escritos (relativos a la sesión). */
  files: string[];
  data: T;
}

export interface OpenOptions {
  outRoot?: string;
  respectRobots?: boolean;
  timeoutMs?: number;
  minIntervalMs?: number;
  /** Ventana visible para que el usuario inicie sesión y use la aplicación. */
  visible?: boolean;
  /** 'auto': privado en cuanto se detecta una sesión iniciada. */
  privacy?: 'auto' | 'privado' | 'abierto';
  /** 'auto': capturas solo mientras la sesión no sea privada. */
  screenshots?: 'auto' | 'siempre' | 'nunca';
}

export interface NetEntry {
  n: number;
  /** Momento de la respuesta (ms desde epoch). */
  t: number;
  url: string;
  method: string;
  resourceType: string;
  status: number;
  mime: string;
  size: number;
  thirdParty: boolean;
  /** Ruta de la aplicación (pathname + hash) desde la que se hizo la petición. */
  from: string;
  /** Cómo se autentica la petición: nombres de mecanismos, nunca valores. */
  auth: string[];
  reqHeaders: Record<string, string>;
  resHeaders: Record<string, string>;
  query: Record<string, string>;
  /** Descripción del cuerpo enviado: nunca el valor crudo. */
  reqBody?: { kind: string; schema?: Schema; params?: string[]; graphql?: GraphQLOp; length: number };
  /** Esquema inferido del cuerpo JSON de la respuesta. */
  resSchema?: Schema;
  initiator?: Frame & { stack?: Frame[] };
  /** Archivo local con el cuerpo (solo scripts). */
  bodyFile?: string;
  failed?: string;
}

/** Posición en un script servido: línea y columna empiezan en 1. */
export interface Frame {
  fn: string;
  url: string;
  line: number;
  column: number;
}

/** Tipo de mensaje dentro de una conexión en tiempo real. */
export interface WsGroup {
  dir: 'enviado' | 'recibido';
  /** Clave que identifica el tipo: «type=quote», «evento=join», forma de las claves… */
  key: string;
  count: number;
  bytes: number;
  first: number;
  last: number;
  shape: string;
}

export interface WsRecord {
  url: string;
  opened: number;
  closed?: number;
  sent: number;
  received: number;
  /** Entramado detectado: json, socket.io, signalr, stomp, tradingview, texto, binario. */
  protocol: string;
  groups: WsGroup[];
  /** Mensajes enviados por el cliente, con su momento, para relacionarlos con las acciones. */
  sentLog: { t: number; key: string }[];
  samples: { dir: 'enviado' | 'recibido'; shape: string }[];
}

export interface GraphQLOp {
  type: string;
  name: string;
  variables: string[];
  query: string;
}

export type Schema =
  | { type: 'object'; props: Record<string, Schema>; truncated?: boolean }
  | { type: 'array'; items: Schema | null; length: number }
  | { type: 'string'; format?: string }
  | { type: 'number' | 'boolean' | 'null' | 'unknown' }
  | { type: 'union'; anyOf: Schema[] };

export interface CaptureMeta {
  version: string;
  url: string;
  finalUrl: string;
  host: string;
  title: string;
  capturedAt: string;
  status: number;
  browser: string;
  visible: boolean;
  robots: { respected: boolean; allowed: boolean; rule?: string };
  barriers: string[];
  /** Se vio un formulario de acceso y después dejó de verse: el usuario inició sesión. */
  authenticated: boolean;
  /** Modo privado: sin capturas, texto del HTML oculto y dígitos enmascarados. */
  private: boolean;
  consoleErrors: number;
  requestCount: number;
}

export type AppAction =
  | { tipo: 'click'; selector: string }
  | { tipo: 'escribir'; selector: string; texto: string }
  | { tipo: 'tecla'; tecla: string; selector?: string }
  | { tipo: 'hover'; selector: string }
  | { tipo: 'scroll'; selector?: string; y?: number }
  | { tipo: 'navegar'; ruta: string }
  | { tipo: 'esperar'; ms: number };

/** Gesto del usuario registrado por la página. Nunca incluye lo que se escribió. */
export interface UserEvent {
  t: number;
  kind: 'click' | 'escribir' | 'cambio' | 'envio' | 'tecla';
  selector: string;
  /** Descripción del elemento: etiqueta, tipo, rol y, solo en botones y enlaces, su texto. */
  target: string;
  /** Número de caracteres escritos, tecla especial (Enter, Escape…) o posición en un lienzo. */
  detail?: string;
}

export interface RouteEvent {
  t: number;
  kind: 'pushState' | 'replaceState' | 'popstate' | 'hashchange' | 'carga';
  url: string;
}

export interface RuntimeLog {
  routes: RouteEvent[];
  wasm: { t: number; via: string; bytes: number; exports: string[]; imports: string[] }[];
  workers: { t: number; kind: string; url: string }[];
  canvas: { t: number; context: string; width: number; height: number; selector: string }[];
  eventSources: { t: number; url: string }[];
  sse: Record<string, number>;
  apis: Record<string, number>;
  userEvents: UserEvent[];
}
