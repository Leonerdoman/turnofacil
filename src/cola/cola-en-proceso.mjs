import { seudonimo } from '../comun/seudonimo.mjs';

// Puerto ColaEntrantes con adaptador en proceso (OQ-H1-2): la plantilla no tiene SQS, así que el
// mensaje se entrega al Procesador en la misma invocación. Conserva grupo y deduplicación de ADR-009
// para que cambiar a la cola FIFO real sea cambiar solo este archivo.
export function crearColaEnProceso({ procesador, claveSeudonimo }) {
  return {
    async encolar(mensaje) {
      const atributos = { grupo: seudonimo(mensaje.telefono_remitente, claveSeudonimo), deduplicacion: mensaje.mensaje_id };
      let r;
      try {
        r = await procesador.procesar(mensaje, atributos);
      } catch {
        r = { ok: false };
      }
      if (!r?.ok) return { ok: false, error: { codigo: 'cola_no_disponible', detalle: 'la cola no aceptó el mensaje' } };
      return { ok: true, valor: atributos };
    },
  };
}
