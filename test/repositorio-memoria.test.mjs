import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearRepositorioMemoria, crearTablaMemoria } from '../src/datos/repositorio-memoria.mjs';
import { crearAlmacenEmuladoMemoria } from '../src/canal/almacen-emulado-memoria.mjs';
import { crearRepositorio } from '../src/datos/repositorio.mjs';

// Prueba de contrato del puerto Repositorio (subconjunto de H1). El adaptador DynamoDB
// usa el mismo repositorio sobre otra tabla; sin AWS solo se ejecuta la de memoria.
function contratoRepositorio(nombre, crear) {
  test(`${nombre}: alta de salón idempotente y búsqueda por número`, async () => {
    const repo = crear();
    const datos = { numero_duena: '+573000000001', nombre_salon: 'S', envio_activo: true };
    const a = await repo.altaSalonSiNoExiste(datos);
    const b = await repo.altaSalonSiNoExiste(datos);
    assert.equal(a.ok, true);
    assert.equal(a.valor.creado, true);
    assert.equal(b.valor.creado, false);
    assert.equal(b.valor.salon.salon_id, a.valor.salon.salon_id);
    const encontrado = await repo.buscarSalonPorNumero('+573000000001');
    assert.equal(encontrado.valor.salon_id, a.valor.salon.salon_id);
    assert.equal(encontrado.valor.nombre_salon, 'S');
    assert.equal((await repo.buscarSalonPorNumero('+573000000901')).valor, null);
  });

  test(`${nombre}: mensaje procesado una sola vez`, async () => {
    const repo = crear();
    assert.equal((await repo.registrarMensajeProcesado('emu.1')).valor, 'nuevo');
    assert.equal((await repo.registrarMensajeProcesado('emu.1')).valor, 'ya_procesado');
  });

  test(`${nombre}: eventos de auditoría solo se agregan`, async () => {
    const repo = crear();
    await repo.agregarEvento({ salon_id: 'X', tipo: 'alta_salon', operador: 'o', motivo: 'm' });
    await repo.agregarEvento({ salon_id: 'X', tipo: 'alta_salon', operador: 'o', motivo: 'm' });
    const r = await repo.listarEventos('X');
    assert.equal(r.valor.length, 2);
    assert.equal(r.valor[0].tipo, 'alta_salon');
  });
}

contratoRepositorio('memoria', () => crearRepositorioMemoria());

test('errores del almacén salen como resultado tipado, sin excepción', async () => {
  const tabla = crearTablaMemoria();
  tabla.fallar = true;
  const repo = crearRepositorio({ tabla });
  const r = await repo.buscarSalonPorNumero('+573000000001');
  assert.deepEqual(r, { ok: false, error: { codigo: 'error_almacen', detalle: 'no se pudo acceder al almacén' } });
});

test('almacén emulado: del más reciente al más antiguo, filtro desde y límite', async () => {
  const almacen = crearAlmacenEmuladoMemoria();
  const base = { destino: '+573000000001', forma: 'texto', codigo: 'R-06', plantilla: null, variables: null, texto: 't', tipo_mensaje: 'respuesta_duena', cita_id: null };
  await almacen.guardarEnvio({ ...base, mensaje_id: 'emu.A', enviado_en: '2026-11-25T10:00:00.000-05:00' });
  await almacen.guardarEnvio({ ...base, mensaje_id: 'emu.B', enviado_en: '2026-11-25T10:00:05.000-05:00' });
  const todos = await almacen.listarEnvios({ destino: '+573000000001', limite: 20 });
  assert.deepEqual(todos.valor.map((m) => m.mensaje_id), ['emu.B', 'emu.A']);
  assert.equal(todos.valor[0].destino, undefined);
  assert.equal(todos.valor[0].vence_en, undefined);
  const desde = await almacen.listarEnvios({ destino: '+573000000001', desde: '2026-11-25T15:00:01Z', limite: 20 });
  assert.deepEqual(desde.valor.map((m) => m.mensaje_id), ['emu.B']);
  const uno = await almacen.listarEnvios({ destino: '+573000000001', limite: 1 });
  assert.equal(uno.valor.length, 1);
  assert.deepEqual((await almacen.listarEnvios({ destino: '+573000000150', limite: 20 })).valor, []);
});

test('almacén emulado: no devuelve envíos vencidos (7 días)', async () => {
  const almacen = crearAlmacenEmuladoMemoria();
  await almacen.guardarEnvio({ destino: '+573000000001', mensaje_id: 'emu.V', enviado_en: '2026-11-01T10:00:00.000-05:00', forma: 'texto', texto: 't' });
  const r = await almacen.listarEnvios({ destino: '+573000000001', limite: 20, ahora: new Date('2026-11-25T15:00:00Z') });
  assert.deepEqual(r.valor, []);
});
