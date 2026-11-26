import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearCanalEmulado } from '../src/canal/canal-emulado.mjs';
import { elegirCanal } from '../src/canal/elegir-canal.mjs';
import { crearAlmacenEmuladoMemoria } from '../src/canal/almacen-emulado-memoria.mjs';
import { crearRepositorioMemoria, crearTablaMemoria } from '../src/datos/repositorio-memoria.mjs';
import { crearProcesador } from '../src/procesador/procesador.mjs';
import { TEXTOS } from '../src/procesador/respuestas.mjs';
import { crearColaEnProceso } from '../src/cola/cola-en-proceso.mjs';
import { crearLog } from '../src/comun/log.mjs';

const ref = { salon_id: 'S1', tipo_mensaje: 'respuesta_duena' };

test('enviarTexto guarda el envío y devuelve EnvioAceptado con emu.<ULID>', async () => {
  const almacen = crearAlmacenEmuladoMemoria();
  const canal = crearCanalEmulado({ almacen });
  const r = await canal.enviarTexto({ destino: '+573000000001', codigo: 'R-06', texto: 'hola', referencia: ref });
  assert.equal(r.ok, true);
  assert.match(r.valor.mensaje_id, /^emu\.[0-9A-HJKMNP-TV-Z]{26}$/);
  assert.match(r.valor.aceptado_en, /-05:00$/);
  const [m] = (await almacen.listarEnvios({ destino: '+573000000001' })).valor;
  assert.deepEqual({ ...m, enviado_en: 'x' }, {
    mensaje_id: r.valor.mensaje_id, enviado_en: 'x', forma: 'texto', codigo: 'R-06',
    plantilla: null, variables: null, texto: 'hola', tipo_mensaje: 'respuesta_duena', cita_id: null,
  });
});

test('enviarPlantilla guarda el texto renderizado sin exigir aprobación', async () => {
  const almacen = crearAlmacenEmuladoMemoria();
  const canal = crearCanalEmulado({ almacen });
  const variables = ['Laura Gómez', 'tinte', 'Salón de Prueba TurnoFácil', '3:00 p. m.'];
  const r = await canal.enviarPlantilla({ destino: '+573000000150', plantilla: 'recordatorio_dia_antes_v1', variables, referencia: { salon_id: 'S1', cita_id: 'C1', tipo_mensaje: 'recordatorio_dia_antes' } });
  assert.equal(r.ok, true);
  const [m] = (await almacen.listarEnvios({ destino: '+573000000150' })).valor;
  assert.equal(m.forma, 'plantilla');
  assert.equal(m.codigo, null);
  assert.equal(m.cita_id, 'C1');
  assert.equal(m.texto, 'Hola Laura Gómez, te recordamos tu cita de tinte en Salón de Prueba TurnoFácil mañana a las 3:00 p. m. Responde SÍ para confirmar o CANCELO si no puedes ir. Si no quieres recibir más recordatorios, escribe STOP.');
});

test('interpretarEntrante devuelve el mensaje válido en una lista; interpretarEstado siempre []', () => {
  const canal = crearCanalEmulado({ almacen: crearAlmacenEmuladoMemoria() });
  const m = { version: 1, mensaje_id: 'emu.X', telefono_remitente: '+573000000001', recibido_en: '2026-11-25T10:00:00.000-05:00', texto: 'Hola', responde_a: null };
  assert.deepEqual(canal.interpretarEntrante(m), [m]);
  assert.deepEqual(canal.interpretarEntrante({ ...m, telefono_remitente: 'x' }), []);
  assert.deepEqual(canal.interpretarEstado({}), []);
});

test('almacén caído: error_almacen, nunca ErrorCanal', async () => {
  const tabla = crearTablaMemoria();
  tabla.fallar = true;
  const canal = crearCanalEmulado({ almacen: crearAlmacenEmuladoMemoria(tabla) });
  const r = await canal.enviarTexto({ destino: '+573000000001', codigo: 'R-06', texto: 'x', referencia: ref });
  assert.equal(r.ok, false);
  assert.equal(r.error.codigo, 'error_almacen');
});

test('elegirCanal: emulado por defecto; desconocido falla', () => {
  const almacen = crearAlmacenEmuladoMemoria();
  assert.ok(elegirCanal({ env: {}, almacen }).enviarTexto);
  assert.throws(() => elegirCanal({ env: { CANAL_WHATSAPP: 'meta' }, almacen }));
});

async function armar() {
  const tabla = crearTablaMemoria();
  const repo = crearRepositorioMemoria(tabla);
  const almacen = crearAlmacenEmuladoMemoria(tabla);
  const canal = crearCanalEmulado({ almacen });
  const lineas = [];
  const log = crearLog({ componente: 'procesador', salida: (l) => lineas.push(l) });
  const salon = (await repo.altaSalonSiNoExiste({ numero_duena: '+573000000001', nombre_salon: 'S', envio_activo: true })).valor.salon;
  return { tabla, repo, almacen, canal, log, lineas, salon, procesador: crearProcesador({ repo, canal, log }) };
}
const entrante = (tel, texto, id = 'emu.1') => ({ version: 1, mensaje_id: id, telefono_remitente: tel, recibido_en: '2026-11-25T10:00:00.000-05:00', texto, responde_a: null });

test('Procesador: la dueña recibe R-06 con los tres ejemplos', async () => {
  const { procesador, almacen, salon } = await armar();
  const r = await procesador.procesar(entrante('+573000000001', 'Hola'));
  assert.deepEqual(r.valor, { clasificacion: 'duena', resultado: 'no_entendido' });
  const [m] = (await almacen.listarEnvios({ destino: '+573000000001' })).valor;
  assert.equal(m.codigo, 'R-06');
  assert.equal(m.texto, TEXTOS['R-06']);
  assert.ok(m.texto.startsWith('No entendí el mensaje. Puedes escribir:'));
  assert.equal(m.tipo_mensaje, 'respuesta_duena');
  assert.ok(salon.salon_id);
});

test('Procesador: otro número no recibe nada; mismo mensaje_id se procesa una vez', async () => {
  const { procesador, almacen } = await armar();
  const r = await procesador.procesar(entrante('+573000000901', 'Vista'));
  assert.equal(r.valor.clasificacion, 'no_duena');
  assert.deepEqual((await almacen.listarEnvios({ destino: '+573000000901' })).valor, []);
  await procesador.procesar(entrante('+573000000001', 'Hola', 'emu.2'));
  const repetido = await procesador.procesar(entrante('+573000000001', 'Hola', 'emu.2'));
  assert.equal(repetido.valor.resultado, 'ya_procesado');
  assert.equal((await almacen.listarEnvios({ destino: '+573000000001' })).valor.length, 1);
});

test('Procesador: fallo del almacén devuelve error y registra ERROR sin datos personales', async () => {
  const { procesador, tabla, lineas } = await armar();
  tabla.fallar = true;
  const r = await procesador.procesar(entrante('+573000000001', 'Hola'));
  assert.equal(r.ok, false);
  assert.ok(lineas.some((l) => JSON.parse(l).nivel === 'ERROR'));
  assert.ok(lineas.every((l) => !l.includes('573000000001') && !l.includes('Hola')));
});

test('Cola en proceso: entrega con grupo = seudónimo y deduplicación = mensaje_id', async () => {
  const recibidos = [];
  const cola = crearColaEnProceso({ procesador: { procesar: async (m, attrs) => { recibidos.push(attrs); return { ok: true, valor: {} }; } } });
  const r = await cola.encolar(entrante('+573000000001', 'Hola', 'emu.9'));
  assert.equal(r.ok, true);
  assert.match(recibidos[0].grupo, /^[0-9a-f]{64}$/);
  assert.equal(recibidos[0].deduplicacion, 'emu.9');
});

test('Cola en proceso: fallo del Procesador → cola_no_disponible', async () => {
  const cola = crearColaEnProceso({ procesador: { procesar: async () => ({ ok: false, error: { codigo: 'error_almacen' } }) } });
  const r = await cola.encolar(entrante('+573000000001', 'Hola'));
  assert.equal(r.ok, false);
  assert.equal(r.error.codigo, 'cola_no_disponible');
});
