// Zona fija America/Bogota: -05:00 sin cambio de hora (RFC § 2.1.4).
const DESFASE_MS = 5 * 60 * 60 * 1000;

export function ahoraColombia(fecha = new Date()) {
  const local = new Date(fecha.getTime() - DESFASE_MS);
  return local.toISOString().replace('Z', '-05:00');
}

const ISO = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})?)?$/;

function aFecha(texto) {
  if (typeof texto !== 'string' || !ISO.test(texto)) return null;
  let normal = texto;
  if (!normal.includes('T')) normal += 'T00:00:00-05:00';
  else if (!/(Z|[+-]\d{2}:\d{2})$/.test(normal)) normal += '-05:00';
  const ms = Date.parse(normal);
  return Number.isNaN(ms) ? null : new Date(ms);
}

export function esIso(texto) {
  return aFecha(texto) !== null;
}

// Lleva cualquier fecha ISO al formato con -05:00 que se guarda, para comparar como texto.
export function aColombia(texto) {
  const f = aFecha(texto);
  return f ? ahoraColombia(f) : null;
}
