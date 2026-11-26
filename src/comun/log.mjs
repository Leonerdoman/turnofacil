import { ahoraColombia } from './hora.mjs';

// Campos que nunca se registran (ADR-007, api-contract § 10.6).
const PROHIBIDOS = new Set(['telefono', 'telefono_remitente', 'destino', 'texto', 'clave', 'numero_duena', 'nombre_clienta']);

export function crearLog({ componente, salida = (linea) => console.log(linea) }) {
  function escribir(nivel, evento, campos = {}) {
    const registro = { ts: ahoraColombia(), nivel, componente, evento };
    for (const [k, v] of Object.entries(campos)) {
      if (!PROHIBIDOS.has(k) && v !== undefined) registro[k] = v;
    }
    salida(JSON.stringify(registro));
  }
  return {
    info: (evento, campos) => escribir('INFO', evento, campos),
    warn: (evento, campos) => escribir('WARN', evento, campos),
    error: (evento, campos) => escribir('ERROR', evento, campos),
    hijo: (otro) => crearLog({ componente: otro, salida }),
  };
}
