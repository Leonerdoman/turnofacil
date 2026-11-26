import { createHash, timingSafeEqual } from 'node:crypto';

const MINIMO_BYTES = 32;

// Fuente de la clave (OQ-H1-3): variable CLAVE_CANAL_EMULADO o ítem CONFIG / CANAL_EMULADO de la tabla.
// Modos:
// - estricto: clave configurada de 32 bytes o más; se exige X-Clave-Prueba y se compara en tiempo constante.
// - abierto: sin clave configurada, fuera de producción; se atiende sin exigir el encabezado (riesgo aceptado,
//   ver .build/decisiones.md).
// - deshabilitado: ENTORNO=produccion o clave configurada más corta (falla cerrada); las rutas no existen (§ 10.6).
export async function cargarConfigCanalEmulado({ env = {}, repo }) {
  let clave = env.CLAVE_CANAL_EMULADO;
  let claveSeudonimo = env.CLAVE_SEUDONIMO;
  if (!clave || !claveSeudonimo) {
    const r = await repo.leerConfigCanalEmulado();
    if (r.ok && r.valor) {
      clave ||= r.valor.clave;
      claveSeudonimo ||= r.valor.clave_seudonimo;
    }
  }
  const configurada = typeof clave === 'string' && clave !== '';
  const valida = configurada && Buffer.byteLength(clave) >= MINIMO_BYTES;
  let modo = valida ? 'estricto' : configurada ? 'deshabilitado' : 'abierto';
  if (env.ENTORNO === 'produccion') modo = 'deshabilitado';
  return {
    modo,
    clave: valida ? clave : null,
    claveSeudonimo: claveSeudonimo || undefined,
  };
}

const sha256 = (v) => createHash('sha256').update(v).digest();

// Compara en tiempo constante los SHA-256 (mismo largo siempre). API Gateway 2.0 entrega encabezados en minúsculas.
export function verificarClave(evento, clave) {
  const recibida = evento?.headers?.['x-clave-prueba'];
  if (typeof recibida !== 'string' || recibida === '' || !clave) return false;
  return timingSafeEqual(sha256(recibida), sha256(clave));
}
