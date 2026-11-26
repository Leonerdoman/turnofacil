// Textos borrador de las plantillas (api-contract § 3.4). {{n}} se reemplaza por la variable n.
export const PLANTILLAS = {
  recordatorio_dia_antes_v1:
    'Hola {{1}}, te recordamos tu cita de {{2}} en {{3}} mañana a las {{4}}. Responde SÍ para confirmar o CANCELO si no puedes ir. Si no quieres recibir más recordatorios, escribe STOP.',
  recordatorio_dos_horas_v1:
    'Hola {{1}}, tu cita de {{2}} en {{3}} es hoy a las {{4}}. Si no puedes ir, responde CANCELO. Para no recibir más recordatorios, escribe STOP.',
  aviso_a_duena_v1: 'Aviso TurnoFácil: {{1}} {{2}} su cita de {{3}} del {{4}} a las {{5}}.',
};

export function renderizarPlantilla(nombre, variables = []) {
  // Si la variable ya termina en punto ("3:00 p. m."), no se repite el punto del texto (como en § 10.2).
  return PLANTILLAS[nombre].replace(/\{\{(\d+)\}\}(\.?)/g, (_, n, punto) => {
    const valor = variables[Number(n) - 1] ?? '';
    return punto && valor.endsWith('.') ? valor : valor + punto;
  });
}
