import { claves, sinClaves } from '../datos/claves.mjs';
import { aColombia } from '../comun/hora.mjs';

const SIETE_DIAS_S = 7 * 24 * 60 * 60;
const ERROR_ALMACEN = { codigo: 'error_almacen', detalle: 'no se pudo acceder al almacén' };

// Almacén del canal emulado (api-contract § 10.3): por (destino, enviado_en), vence a los 7 días.
// La tabla no tiene TTL configurado, así que el vencimiento se filtra al leer (OQ-H1-6).
export function crearAlmacenEmulado({ tabla }) {
  return {
    async guardarEnvio(envio) {
      try {
        const vence_en = Math.floor(Date.parse(envio.enviado_en) / 1000) + SIETE_DIAS_S;
        await tabla.put({ ...claves.envioEmulado(envio.destino, envio.enviado_en, envio.mensaje_id), ...envio, vence_en });
        return { ok: true, valor: undefined };
      } catch {
        return { ok: false, error: ERROR_ALMACEN };
      }
    },
    async listarEnvios({ destino, desde, limite = 20, ahora = new Date() }) {
      try {
        const items = await tabla.query({
          pk: claves.envioEmuladoPk(destino),
          skDesde: desde ? aColombia(desde) : undefined,
          descendente: true,
          limite,
        });
        const ahoraS = Math.floor(ahora.getTime() / 1000);
        const vigentes = items.filter((i) => !(i.vence_en <= ahoraS));
        return { ok: true, valor: vigentes.map((i) => { const { destino: _d, ...m } = sinClaves(i); return m; }) };
      } catch {
        return { ok: false, error: ERROR_ALMACEN };
      }
    },
  };
}
