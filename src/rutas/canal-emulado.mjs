import { json, error } from '../comun/http.mjs';
import { esTelefono } from '../comun/telefono.mjs';
import { esIso, ahoraColombia } from '../comun/hora.mjs';
import { nuevoUlid } from '../comun/ulid.mjs';
import { asegurarSalonDePrueba } from '../prueba/siembra.mjs';

const REMITENTES = ['duena', 'clienta', 'desconocido'];
const invalido = (detalle) => ({ respuesta: error(400, 'datos_invalidos', detalle) });

function leerCuerpo(evento) {
  if (!evento.body) return undefined;
  const texto = evento.isBase64Encoded ? Buffer.from(evento.body, 'base64').toString('utf8') : evento.body;
  try {
    return JSON.parse(texto);
  } catch {
    return undefined;
  }
}

function validarMensaje(cuerpo) {
  if (!cuerpo || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) return 'cuerpo: debe ser un objeto JSON';
  if (!REMITENTES.includes(cuerpo.remitente)) return 'remitente: debe ser duena, clienta o desconocido';
  if (!esTelefono(cuerpo.telefono)) return 'telefono: debe cumplir ^\\+573\\d{9}$';
  if (!('texto' in cuerpo)) return 'texto: es obligatorio (puede ser null)';
  if (cuerpo.texto !== null) {
    if (typeof cuerpo.texto !== 'string') return 'texto: debe ser texto o null';
    const largo = [...cuerpo.texto].length;
    if (largo < 1 || largo > 4096) return 'texto: debe tener entre 1 y 4096 caracteres';
  }
  const r = cuerpo.responde_a;
  if (r !== undefined && r !== null && (typeof r !== 'string' || !r.startsWith('emu.'))) return 'responde_a: debe empezar por emu.';
  return null;
}

// POST /prueba/canal-emulado/mensajes (api-contract § 10.1)
export async function recibirMensaje(evento, { repo, cola, log }) {
  const cuerpo = leerCuerpo(evento);
  const problema = validarMensaje(cuerpo);
  if (problema) return invalido(problema);

  await asegurarSalonDePrueba(repo, log);
  const busqueda = await repo.buscarSalonPorNumero(cuerpo.telefono);
  if (!busqueda.ok) return { respuesta: error(500, 'cola_no_disponible', 'la cola no aceptó el mensaje; se puede repetir') };
  const esDuena = busqueda.valor !== null;
  if ((cuerpo.remitente === 'duena') !== esDuena) {
    const detalle = cuerpo.remitente === 'duena'
      ? 'remitente: el número no es la dueña de ningún salón'
      : 'remitente: el número es la dueña de un salón';
    return { respuesta: error(422, 'remitente_inconsistente', detalle) };
  }

  const mensaje = {
    version: 1,
    mensaje_id: `emu.${nuevoUlid()}`,
    telefono_remitente: cuerpo.telefono,
    recibido_en: ahoraColombia(),
    texto: cuerpo.texto,
    responde_a: cuerpo.responde_a ?? null,
  };
  const encolado = await cola.encolar(mensaje);
  if (!encolado.ok) {
    return { respuesta: error(500, 'cola_no_disponible', 'la cola no aceptó el mensaje; se puede repetir'), correlacion_id: mensaje.mensaje_id };
  }
  return { respuesta: json(202, { mensaje_id: mensaje.mensaje_id, encolado_en: ahoraColombia() }), correlacion_id: mensaje.mensaje_id };
}

// GET /prueba/canal-emulado/mensajes-enviados (api-contract § 10.2)
export async function listarEnviados(evento, { almacen }) {
  const q = evento.queryStringParameters ?? {};
  if (!esTelefono(q.telefono)) return invalido('telefono: obligatorio, debe cumplir ^\\+573\\d{9}$ (el + va como %2B)');
  if (q.desde !== undefined && !esIso(q.desde)) return invalido('desde: debe ser una fecha ISO 8601');
  let limite = 20;
  if (q.limite !== undefined) {
    if (!/^\d+$/.test(q.limite) || Number(q.limite) < 1 || Number(q.limite) > 100) return invalido('limite: debe ser un entero entre 1 y 100');
    limite = Number(q.limite);
  }
  const r = await almacen.listarEnvios({ destino: q.telefono, desde: q.desde, limite });
  if (!r.ok) return { respuesta: error(500, 'almacen_no_disponible', 'no se pudo leer el almacén; se puede repetir') };
  return { respuesta: json(200, { telefono: q.telefono, mensajes: r.valor }) };
}

// GET /prueba/canal-emulado/salon-de-prueba (api-contract § 10.4)
export async function consultarSalonDePrueba(_evento, { repo, log }) {
  const r = await asegurarSalonDePrueba(repo, log);
  if (!r.ok || !r.valor) return { respuesta: error(404, 'salon_no_sembrado', 'el salón de prueba no está sembrado') };
  const { salon_id, nombre_salon, numero_duena, envio_activo } = r.valor;
  return { respuesta: json(200, { salon_id, nombre_salon, numero_duena, envio_activo }) };
}
