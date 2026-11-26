import { crearCanalEmulado } from './canal-emulado.mjs';

// Un solo adaptador activo por ambiente (ADR-002). H1 solo tiene el emulado; es el valor por defecto
// porque este ambiente no tiene cuenta de Meta. Segunda barrera: en producción el emulado no arranca (§ 10.6).
export function elegirCanal({ env = {}, almacen, reloj }) {
  const tipo = env.CANAL_WHATSAPP ?? 'emulado';
  if (tipo !== 'emulado') throw new Error(`adaptador de canal no disponible: ${tipo}`);
  if (env.ENTORNO === 'produccion') throw new Error('el canal emulado no puede arrancar en producción');
  return crearCanalEmulado({ almacen, reloj });
}
