import { claves, sinClaves } from './claves.mjs';
import { nuevoUlid } from '../comun/ulid.mjs';
import { ahoraColombia } from '../comun/hora.mjs';

// Puerto Repositorio (api-contract § 4.2, subconjunto de H1) sobre una tabla con
// get/put/query. La tabla cambia (memoria o DynamoDB); la lógica es la misma (ADR-005).
const ERROR_ALMACEN = { codigo: 'error_almacen', detalle: 'no se pudo acceder al almacén' };

async function resultado(fn) {
  try {
    return { ok: true, valor: await fn() };
  } catch {
    return { ok: false, error: ERROR_ALMACEN };
  }
}

export function crearRepositorio({ tabla }) {
  async function leerSalonPorNumero(numero) {
    const indice = await tabla.get(claves.duena(numero));
    if (!indice) return null;
    return sinClaves(await tabla.get(claves.salon(indice.salon_id)));
  }

  return {
    altaSalonSiNoExiste: ({ numero_duena, nombre_salon, envio_activo }) =>
      resultado(async () => {
        const salon = { salon_id: nuevoUlid(), nombre_salon, numero_duena, envio_activo, creado_en: ahoraColombia() };
        const gano = await tabla.put({ ...claves.duena(numero_duena), salon_id: salon.salon_id }, { siNoExiste: true });
        if (gano) {
          await tabla.put({ ...claves.salon(salon.salon_id), ...salon });
          return { creado: true, salon };
        }
        const existente = await leerSalonPorNumero(numero_duena);
        if (existente) return { creado: false, salon: existente };
        // El índice quedó escrito sin el salón (falla a mitad): se completa con los mismos datos.
        const indice = await tabla.get(claves.duena(numero_duena));
        const reparado = { ...salon, salon_id: indice.salon_id };
        await tabla.put({ ...claves.salon(reparado.salon_id), ...reparado });
        return { creado: false, salon: reparado };
      }),

    buscarSalonPorNumero: (telefono) => resultado(() => leerSalonPorNumero(telefono)),

    registrarMensajeProcesado: (mensajeId) =>
      resultado(async () => {
        const nuevo = await tabla.put({ ...claves.mensaje(mensajeId), procesado_en: ahoraColombia() }, { siNoExiste: true });
        return nuevo ? 'nuevo' : 'ya_procesado';
      }),

    agregarEvento: (evento) =>
      resultado(async () => {
        const ts = evento.ocurrido_en ?? ahoraColombia();
        const evento_id = evento.evento_id ?? nuevoUlid();
        const completo = { ...evento, evento_id, ocurrido_en: ts };
        await tabla.put({ ...claves.auditoria(evento.salon_id, ts, evento_id), ...completo }, { siNoExiste: true });
        return completo;
      }),

    listarEventos: (salonId) =>
      resultado(async () => (await tabla.query({ pk: claves.auditoriaPk(salonId) })).map(sinClaves)),

    leerConfigCanalEmulado: () => resultado(async () => sinClaves(await tabla.get(claves.configCanalEmulado()))),
  };
}
