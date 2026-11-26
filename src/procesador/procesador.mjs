import { TEXTOS } from './respuestas.mjs';

// Procesador mínimo de H1: clasifica al remitente solo por su número (ADR-006).
// Dueña → R-06 (H2 reemplaza esta rama por el intérprete). Cualquier otro número → no responde.
export function crearProcesador({ repo, canal, log }) {
  function fallo(r, mensaje) {
    log.error('fallo_almacen', { correlacion_id: mensaje.mensaje_id, error_tipo: r.error.codigo, resultado: 'error' });
    return { ok: false, error: r.error };
  }

  return {
    async procesar(mensaje) {
      const inicio = Date.now();
      const registro = await repo.registrarMensajeProcesado(mensaje.mensaje_id);
      if (!registro.ok) return fallo(registro, mensaje);
      if (registro.valor === 'ya_procesado') {
        log.info('mensaje_repetido', { correlacion_id: mensaje.mensaje_id, resultado: 'ya_procesado' });
        return { ok: true, valor: { clasificacion: null, resultado: 'ya_procesado' } };
      }

      const busqueda = await repo.buscarSalonPorNumero(mensaje.telefono_remitente);
      if (!busqueda.ok) return fallo(busqueda, mensaje);
      const salon = busqueda.valor;

      if (!salon) {
        log.info('remitente_clasificado', { correlacion_id: mensaje.mensaje_id, remitente: 'no_duena', resultado: 'sin_efecto', duracion_ms: Date.now() - inicio });
        return { ok: true, valor: { clasificacion: 'no_duena', resultado: 'sin_efecto' } };
      }

      log.info('remitente_clasificado', { correlacion_id: mensaje.mensaje_id, salon_id: salon.salon_id, remitente: 'duena' });
      log.info('comando_no_entendido', { correlacion_id: mensaje.mensaje_id, salon_id: salon.salon_id, resultado: 'no_entendido' });
      const envio = await canal.enviarTexto({
        destino: salon.numero_duena,
        codigo: 'R-06',
        texto: TEXTOS['R-06'],
        referencia: { salon_id: salon.salon_id, tipo_mensaje: 'respuesta_duena' },
      });
      if (!envio.ok) return fallo(envio, mensaje);
      log.info('respuesta_enviada', {
        correlacion_id: mensaje.mensaje_id, salon_id: salon.salon_id, codigo: 'R-06',
        mensaje_salida_id: envio.valor.mensaje_id, resultado: 'ok', duracion_ms: Date.now() - inicio,
      });
      return { ok: true, valor: { clasificacion: 'duena', resultado: 'no_entendido' } };
    },
  };
}
