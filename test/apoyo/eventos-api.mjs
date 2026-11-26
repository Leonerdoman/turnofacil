import { crearHandler } from '../../src/arranque.mjs';
import { crearTablaMemoria, crearRepositorioMemoria } from '../../src/datos/repositorio-memoria.mjs';
import { crearAlmacenEmuladoMemoria } from '../../src/canal/almacen-emulado-memoria.mjs';

// Clave solo de prueba, generada en cada corrida (nunca en el código de src/).
export const CLAVE = `prueba-${crypto.randomUUID()}-${crypto.randomUUID()}`;

export function armar({ env = { CLAVE_CANAL_EMULADO: CLAVE } } = {}) {
  const tabla = crearTablaMemoria();
  const repo = crearRepositorioMemoria(tabla);
  const almacen = crearAlmacenEmuladoMemoria(tabla);
  const lineas = [];
  const handler = crearHandler({ repo, almacen, env, salida: (l) => lineas.push(l) });
  return { tabla, repo, almacen, lineas, handler };
}

// Evento API Gateway HTTP 2.0 armado a mano.
export function evento({ metodo = 'GET', ruta, query, cuerpo, clave = CLAVE, headers = {} }) {
  const h = { 'content-type': 'application/json', ...headers };
  if (clave !== null) h['x-clave-prueba'] = clave;
  return {
    version: '2.0',
    rawPath: ruta,
    headers: h,
    queryStringParameters: query,
    body: cuerpo === undefined ? undefined : typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
    isBase64Encoded: false,
    requestContext: { requestId: 'req-1', http: { method: metodo, path: ruta } },
  };
}

export const postMensaje = (cuerpo, opciones = {}) =>
  evento({ metodo: 'POST', ruta: '/prueba/canal-emulado/mensajes', cuerpo, ...opciones });
export const getEnviados = (query, opciones = {}) =>
  evento({ ruta: '/prueba/canal-emulado/mensajes-enviados', query, ...opciones });
export const getSalon = (opciones = {}) => evento({ ruta: '/prueba/canal-emulado/salon-de-prueba', ...opciones });

export const cuerpo = (r) => JSON.parse(r.body);
