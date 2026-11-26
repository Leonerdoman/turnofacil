// Diseño de claves de la tabla única (pk, sk). Un solo lugar para todas las historias.
export const claves = {
  salon: (salonId) => ({ pk: `SALON#${salonId}`, sk: 'SALON' }),
  duena: (numero) => ({ pk: `DUENA#${numero}`, sk: 'SALON' }),
  mensaje: (mensajeId) => ({ pk: `MSG#${mensajeId}`, sk: 'MSG' }),
  auditoria: (salonId, ts, eventoId) => ({ pk: `AUDITORIA#${salonId}`, sk: `${ts}#${eventoId}` }),
  auditoriaPk: (salonId) => `AUDITORIA#${salonId}`,
  configCanalEmulado: () => ({ pk: 'CONFIG', sk: 'CANAL_EMULADO' }),
  envioEmulado: (destino, enviadoEn, mensajeId) => ({ pk: `EMU#${destino}`, sk: `${enviadoEn}#${mensajeId}` }),
  envioEmuladoPk: (destino) => `EMU#${destino}`,
};

// Quita los atributos de clave y de control antes de devolver un ítem.
export function sinClaves(item) {
  if (!item) return item;
  const { pk, sk, vence_en, ...resto } = item;
  return resto;
}
