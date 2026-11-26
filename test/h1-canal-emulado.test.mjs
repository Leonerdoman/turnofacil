import { test } from 'node:test';
import assert from 'node:assert/strict';
import { armar, postMensaje, getEnviados, getSalon, evento, cuerpo } from './apoyo/eventos-api.mjs';

const DUENA = '+573000000001';

test('AC-1: el salón de prueba queda sembrado una sola vez con su evento de auditoría', async () => {
  const { handler, repo } = armar();
  const r1 = await handler(getSalon());
  assert.equal(r1.statusCode, 200);
  assert.equal(r1.headers['content-type'], 'application/json');
  const s = cuerpo(r1);
  assert.deepEqual({ ...s, salon_id: 'x' }, { salon_id: 'x', nombre_salon: 'Salón de Prueba TurnoFácil', numero_duena: DUENA, envio_activo: true });
  const r2 = await handler(getSalon());
  assert.equal(cuerpo(r2).salon_id, s.salon_id);
  const eventos = (await repo.listarEventos(s.salon_id)).valor;
  assert.equal(eventos.length, 1);
  assert.equal(eventos[0].tipo, 'alta_salon');
  assert.equal(eventos[0].operador, 'sistema:siembra-prueba');
});

test('AC-1: la siembra es idempotente entre instancias de la función', async () => {
  const { handler, repo, tabla, almacen } = armar();
  await handler(getSalon());
  const { crearHandler } = await import('../src/arranque.mjs');
  const otra = crearHandler({ repo: (await import('../src/datos/repositorio-memoria.mjs')).crearRepositorioMemoria(tabla), almacen, env: { CLAVE_CANAL_EMULADO: (await import('./apoyo/eventos-api.mjs')).CLAVE }, salida: () => {} });
  const s = cuerpo(await otra(getSalon()));
  assert.equal(cuerpo(await handler(getSalon())).salon_id, s.salon_id);
  assert.equal((await repo.listarEventos(s.salon_id)).valor.length, 1);
});

test('AC-2: la dueña escribe "Hola" y recibe R-06 con los tres ejemplos', async () => {
  const { handler } = armar();
  const desde = new Date(Date.now() - 1000).toISOString();
  const r = await handler(postMensaje({ remitente: 'duena', telefono: DUENA, texto: 'Hola' }));
  assert.equal(r.statusCode, 202);
  assert.equal(r.headers['content-type'], 'application/json');
  const b = cuerpo(r);
  assert.match(b.mensaje_id, /^emu\.[0-9A-HJKMNP-TV-Z]{26}$/);
  assert.match(b.encolado_en, /-05:00$/);
  const e = await handler(getEnviados({ telefono: DUENA, desde }));
  assert.equal(e.statusCode, 200);
  const { telefono, mensajes } = cuerpo(e);
  assert.equal(telefono, DUENA);
  assert.equal(mensajes.length, 1);
  const m = mensajes[0];
  assert.equal(m.forma, 'texto');
  assert.equal(m.codigo, 'R-06');
  assert.equal(m.plantilla, null);
  assert.equal(m.variables, null);
  assert.equal(m.cita_id, null);
  assert.equal(m.tipo_mensaje, 'respuesta_duena');
  assert.ok(m.texto.startsWith('No entendí el mensaje. Puedes escribir:'));
  for (const ejemplo of ['Cita: Laura Gómez', 'Cancelar: Laura Gómez', 'Vista']) assert.ok(m.texto.includes(ejemplo));
  assert.match(m.mensaje_id, /^emu\./);
  assert.match(m.enviado_en, /-05:00$/);
  assert.deepEqual(Object.keys(m).sort(), ['cita_id', 'codigo', 'enviado_en', 'forma', 'mensaje_id', 'plantilla', 'texto', 'tipo_mensaje', 'variables']);
});

test('AC-3: un número desconocido escribe "Vista" y no recibe nada', async () => {
  const { handler } = armar();
  const r = await handler(postMensaje({ remitente: 'desconocido', telefono: '+573000000901', texto: 'Vista' }));
  assert.equal(r.statusCode, 202);
  const e = await handler(getEnviados({ telefono: '+573000000901' }));
  assert.equal(e.statusCode, 200);
  assert.deepEqual(cuerpo(e), { telefono: '+573000000901', mensajes: [] });
});

test('AC-5: papel declarado que no coincide con el número → 422 y nada encolado', async () => {
  const { handler } = armar();
  const r = await handler(postMensaje({ remitente: 'clienta', telefono: DUENA, texto: 'sí' }));
  assert.equal(r.statusCode, 422);
  assert.equal(cuerpo(r).error.codigo, 'remitente_inconsistente');
  assert.ok(!r.body.includes('573000000001'));
  assert.deepEqual(cuerpo(await handler(getEnviados({ telefono: DUENA }))).mensajes, []);
  const espejo = await handler(postMensaje({ remitente: 'duena', telefono: '+573000000150', texto: 'Hola' }));
  assert.equal(espejo.statusCode, 422);
  assert.equal(cuerpo(espejo).error.codigo, 'remitente_inconsistente');
});

test('mensajes-enviados: orden del más reciente al más antiguo, desde y límite', async () => {
  const { handler } = armar();
  await handler(postMensaje({ remitente: 'duena', telefono: DUENA, texto: 'uno' }));
  await new Promise((r) => setTimeout(r, 5));
  const medio = new Date().toISOString();
  await new Promise((r) => setTimeout(r, 5));
  await handler(postMensaje({ remitente: 'duena', telefono: DUENA, texto: null }));
  const todos = cuerpo(await handler(getEnviados({ telefono: DUENA }))).mensajes;
  assert.equal(todos.length, 2);
  assert.ok(todos[0].enviado_en > todos[1].enviado_en);
  assert.equal(cuerpo(await handler(getEnviados({ telefono: DUENA, desde: medio }))).mensajes.length, 1);
  assert.equal(cuerpo(await handler(getEnviados({ telefono: DUENA, limite: '1' }))).mensajes.length, 1);
});

test('400 datos_invalidos en POST mensajes, sin repetir teléfono ni texto', async () => {
  const { handler } = armar();
  const base = { remitente: 'duena', telefono: DUENA, texto: 'Hola' };
  const casos = [
    '{roto',
    undefined,
    { telefono: DUENA, texto: 'Hola' },
    { remitente: 'duena', texto: 'Hola' },
    { remitente: 'duena', telefono: DUENA },
    { ...base, remitente: 'jefa' },
    { ...base, telefono: '3000000001' },
    { ...base, texto: '' },
    { ...base, texto: 'x'.repeat(4097) },
    { ...base, responde_a: 'wamid.X' },
  ];
  for (const c of casos) {
    const r = await handler(postMensaje(c));
    assert.equal(r.statusCode, 400, JSON.stringify(c)?.slice(0, 60));
    assert.equal(r.headers['content-type'], 'application/json');
    assert.equal(cuerpo(r).error.codigo, 'datos_invalidos');
    assert.ok(!cuerpo(r).error.detalle.includes('3000000001'));
  }
  assert.equal((await handler(postMensaje({ ...base, texto: 'x'.repeat(4096) }))).statusCode, 202);
  assert.equal((await handler(postMensaje({ ...base, responde_a: 'emu.01ABC' }))).statusCode, 202);
});

test('400 datos_invalidos en GET mensajes-enviados', async () => {
  const { handler } = armar();
  const casos = [{}, undefined, { telefono: ' 573000000001' }, { telefono: DUENA, limite: '0' }, { telefono: DUENA, limite: '101' }, { telefono: DUENA, limite: 'diez' }, { telefono: DUENA, desde: 'ayer' }];
  for (const q of casos) {
    const r = await handler(getEnviados(q));
    assert.equal(r.statusCode, 400, JSON.stringify(q));
    assert.equal(cuerpo(r).error.codigo, 'datos_invalidos');
  }
  assert.equal((await handler(getEnviados({ telefono: DUENA, limite: '100' }))).statusCode, 200);
});

test('ruta desconocida → 404 JSON', async () => {
  const { handler } = armar();
  const r = await handler(evento({ ruta: '/otra' }));
  assert.equal(r.statusCode, 404);
  assert.equal(r.headers['content-type'], 'application/json');
  assert.ok(cuerpo(r).error.codigo);
  assert.equal((await handler(evento({ metodo: 'DELETE', ruta: '/prueba/canal-emulado/mensajes' }))).statusCode, 404);
});

test('almacén caído → 500 cola_no_disponible, almacen_no_disponible y 404 salon_no_sembrado', async () => {
  const { handler, tabla } = armar();
  tabla.fallar = true;
  const p = await handler(postMensaje({ remitente: 'duena', telefono: DUENA, texto: 'Hola' }));
  assert.equal(p.statusCode, 500);
  assert.equal(cuerpo(p).error.codigo, 'cola_no_disponible');
  const g = await handler(getEnviados({ telefono: DUENA }));
  assert.equal(g.statusCode, 500);
  assert.equal(cuerpo(g).error.codigo, 'almacen_no_disponible');
  const s = await handler(getSalon());
  assert.equal(s.statusCode, 404);
  assert.equal(cuerpo(s).error.codigo, 'salon_no_sembrado');
});

test('Procesador falla después de la validación → 500 cola_no_disponible', async () => {
  const { handler, tabla } = armar();
  await handler(getSalon());
  const put = tabla.put;
  tabla.put = async (item, o) => { if (item.pk.startsWith('MSG#')) throw new Error('x'); return put(item, o); };
  const r = await handler(postMensaje({ remitente: 'duena', telefono: DUENA, texto: 'Hola' }));
  assert.equal(r.statusCode, 500);
  assert.equal(cuerpo(r).error.codigo, 'cola_no_disponible');
});

test('una línea JSON peticion_canal_emulado por petición, con correlacion_id emu.', async () => {
  const { handler, lineas } = armar();
  const r = await handler(postMensaje({ remitente: 'duena', telefono: DUENA, texto: 'Hola' }));
  const peticiones = lineas.map((l) => JSON.parse(l)).filter((l) => l.evento === 'peticion_canal_emulado');
  assert.equal(peticiones.length, 1);
  assert.equal(peticiones[0].correlacion_id, cuerpo(r).mensaje_id);
  assert.equal(peticiones[0].estado_http, 202);
  assert.equal(typeof peticiones[0].duracion_ms, 'number');
  assert.match(peticiones[0].ts, /-05:00$/);
});
