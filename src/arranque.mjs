import { error } from './comun/http.mjs';
import { crearLog } from './comun/log.mjs';
import { elegirCanal } from './canal/elegir-canal.mjs';
import { crearProcesador } from './procesador/procesador.mjs';
import { crearColaEnProceso } from './cola/cola-en-proceso.mjs';
import { cargarConfigCanalEmulado, verificarClave } from './prueba/clave.mjs';
import { recibirMensaje, listarEnviados, consultarSalonDePrueba } from './rutas/canal-emulado.mjs';

const RUTAS = {
  'POST /prueba/canal-emulado/mensajes': recibirMensaje,
  'GET /prueba/canal-emulado/mensajes-enviados': listarEnviados,
  'GET /prueba/canal-emulado/salon-de-prueba': consultarSalonDePrueba,
};

const noExiste = () => error(404, 'ruta_no_encontrada', 'la ruta no existe');

// Arma el handler con dependencias inyectadas: en Lambda las reales, en pruebas las de memoria.
export function crearHandler({ repo, almacen, env = {}, salida, reloj }) {
  const raiz = crearLog({ componente: 'canal_emulado', salida });
  const log = raiz.hijo('canal_emulado');
  // Segunda barrera (§ 10.6): en producción el canal emulado no arranca y el handler tampoco.
  const canal = elegirCanal({ env, almacen, reloj });
  const procesador = crearProcesador({ repo, canal, log: raiz.hijo('procesador') });
  let config = null;
  let cola = null;
  let avisado = false;

  async function configuracion() {
    // Se guarda solo en modo estricto; si no, se vuelve a leer en la siguiente petición
    // para que una clave agregada después a la tabla se aplique sin redesplegar.
    if (config?.modo === 'estricto') return config;
    config = await cargarConfigCanalEmulado({ env, repo });
    if (config.modo === 'abierto' && !avisado) {
      avisado = true;
      log.warn('clave_no_configurada', { resultado: 'rutas_sin_clave' });
    }
    cola = crearColaEnProceso({ procesador, claveSeudonimo: config.claveSeudonimo });
    return config;
  }

  return async function handler(evento) {
    const inicio = Date.now();
    const metodo = evento?.requestContext?.http?.method ?? 'GET';
    const ruta = evento?.rawPath ?? evento?.requestContext?.http?.path ?? '/';
    const trace_id = evento?.headers?.['x-amzn-trace-id'];
    let respuesta;
    let correlacion_id = evento?.requestContext?.requestId;
    let resultado = 'ok';

    try {
      const accion = RUTAS[`${metodo} ${ruta}`];
      const cfg = accion ? await configuracion() : null;
      if (!accion || cfg.modo === 'deshabilitado') {
        respuesta = noExiste();
        resultado = 'ruta_no_encontrada';
      } else if (cfg.modo === 'estricto' && !verificarClave(evento, cfg.clave)) {
        respuesta = error(401, 'clave_invalida', 'clave de prueba ausente o incorrecta');
        resultado = 'clave_invalida';
        log.warn('clave_invalida', { trace_id, ruta });
      } else {
        const r = await accion(evento, { repo, almacen, cola, log });
        respuesta = r.respuesta;
        correlacion_id = r.correlacion_id ?? correlacion_id;
        if (respuesta.statusCode >= 400) resultado = JSON.parse(respuesta.body).error.codigo;
      }
    } catch (e) {
      respuesta = error(500, 'error_interno', 'error inesperado');
      resultado = 'error_interno';
      log.error('error_interno', { trace_id, error_tipo: e?.name ?? 'Error' });
    }

    const campos = { metodo, ruta, estado_http: respuesta.statusCode, correlacion_id, trace_id, resultado, duracion_ms: Date.now() - inicio };
    if (respuesta.statusCode >= 500) log.error('peticion_canal_emulado', campos);
    else log.info('peticion_canal_emulado', campos);
    return respuesta;
  };
}

// Dependencias reales: una tabla DynamoDB para el repositorio y el almacén emulado.
export async function crearHandlerReal(env = process.env) {
  const { crearTablaDynamo, crearRepositorioDynamo } = await import('./datos/repositorio-dynamo.mjs');
  const { crearAlmacenEmuladoDynamo } = await import('./canal/almacen-emulado-dynamo.mjs');
  const tabla = await crearTablaDynamo({ nombre: env.TABLE_NAME });
  return crearHandler({
    repo: await crearRepositorioDynamo({ tabla }),
    almacen: crearAlmacenEmuladoDynamo({ tabla }),
    env,
  });
}
