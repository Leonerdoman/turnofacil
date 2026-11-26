// Siembra idempotente del salón de prueba (api-contract § 10.4). No hay paso posterior al despliegue,
// así que corre en la primera petición de prueba de cada instancia (OQ-H1-5).
export const SALON_DE_PRUEBA = {
  nombre_salon: 'Salón de Prueba TurnoFácil',
  numero_duena: '+573000000001',
  envio_activo: true,
};

const sembrados = new WeakMap();

export async function asegurarSalonDePrueba(repo, log) {
  if (sembrados.has(repo)) return { ok: true, valor: sembrados.get(repo) };
  const alta = await repo.altaSalonSiNoExiste(SALON_DE_PRUEBA);
  if (!alta.ok) return alta;
  const { creado, salon } = alta.valor;
  if (creado) {
    const evento = await repo.agregarEvento({
      salon_id: salon.salon_id,
      tipo: 'alta_salon',
      operador: 'sistema:siembra-prueba',
      motivo: 'siembra del ambiente de prueba',
    });
    if (!evento.ok) return evento;
    log?.info('SalonDadoDeAlta', { salon_id: salon.salon_id, resultado: 'ok' });
  }
  sembrados.set(repo, salon);
  return { ok: true, valor: salon };
}
