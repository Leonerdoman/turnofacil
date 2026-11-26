import { nuevoUlid } from '../comun/ulid.mjs';
import { ahoraColombia } from '../comun/hora.mjs';
import { esTelefono } from '../comun/telefono.mjs';
import { renderizarPlantilla } from './plantillas.mjs';

// Adaptador emulado del puerto CanalWhatsApp (api-contract § 4.1 y § 10.3).
// No llama a Meta: guarda lo enviado para leerlo con GET mensajes-enviados. Nunca devuelve ErrorCanal.
export function crearCanalEmulado({ almacen, reloj = () => new Date() }) {
  async function guardar({ destino, forma, codigo = null, plantilla = null, variables = null, texto, referencia }) {
    const mensaje_id = `emu.${nuevoUlid()}`;
    const enviado_en = ahoraColombia(reloj());
    const r = await almacen.guardarEnvio({
      mensaje_id,
      destino,
      enviado_en,
      forma,
      codigo,
      plantilla,
      variables,
      texto,
      tipo_mensaje: referencia?.tipo_mensaje ?? null,
      cita_id: referencia?.cita_id ?? null,
    });
    if (!r.ok) return r;
    return { ok: true, valor: { mensaje_id, aceptado_en: enviado_en } };
  }

  return {
    enviarTexto: ({ destino, codigo, texto, referencia }) => guardar({ destino, forma: 'texto', codigo, texto, referencia }),
    enviarPlantilla: ({ destino, plantilla, variables, referencia }) =>
      guardar({ destino, forma: 'plantilla', plantilla, variables, texto: renderizarPlantilla(plantilla, variables), referencia }),
    interpretarEntrante(m) {
      const valido =
        m && m.version === 1 && typeof m.mensaje_id === 'string' && esTelefono(m.telefono_remitente) &&
        typeof m.recibido_en === 'string' && (m.texto === null || typeof m.texto === 'string') &&
        (m.responde_a === null || m.responde_a === undefined || typeof m.responde_a === 'string');
      return valido ? [m] : [];
    },
    interpretarEstado: () => [],
  };
}
