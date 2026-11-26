import { test } from 'node:test';
import assert from 'node:assert/strict';
import { armar, postMensaje, getEnviados, getSalon, cuerpo, CLAVE } from './apoyo/eventos-api.mjs';
import { verificarClave, cargarConfigCanalEmulado } from '../src/prueba/clave.mjs';
import { elegirCanal } from '../src/canal/elegir-canal.mjs';
import { crearHandler } from '../src/arranque.mjs';
import { crearRepositorioMemoria, crearTablaMemoria } from '../src/datos/repositorio-memoria.mjs';
import { crearAlmacenEmuladoMemoria } from '../src/canal/almacen-emulado-memoria.mjs';
import { readFileSync } from 'node:fs';

const DUENA = '+573000000001';
const HOLA = { remitente: 'duena', telefono: DUENA, texto: 'Hola' };

// AC-4 se cubre solo con pruebas automatizadas: las comprobaciones tras el despliegue siempre mandan la clave.
test('AC-4: sin la clave de prueba no entra nada', async () => {
  const { handler } = armar();
  const r = await handler(postMensaje(HOLA, { clave: null }));
  assert.equal(r.statusCode, 401);
  assert.equal(r.headers['content-type'], 'application/json');
  assert.equal(cuerpo(r).error.codigo, 'clave_invalida');
  const e = await handler(getEnviados({ telefono: DUENA }));
  assert.equal(e.statusCode, 200);
  assert.deepEqual(cuerpo(e).mensajes, []);
});

test('AC-4: el Procesador no se llama sin clave válida', async () => {
  const { handler, tabla } = armar();
  const r = await handler(postMensaje(HOLA, { clave: null }));
  assert.equal(r.statusCode, 401);
  assert.ok(![...tabla.items.keys()].some((k) => k.startsWith('MSG#')), 'no se registró ningún mensaje procesado');
});

test('AC-4 variantes: clave incorrecta del mismo largo, de otro largo o vacía → 401 y nada encolado', async () => {
  const { handler, tabla } = armar();
  const mismoLargo = CLAVE.slice(0, -1) + (CLAVE.endsWith('a') ? 'b' : 'a');
  for (const clave of [mismoLargo, 'corta', '', CLAVE + 'x']) {
    const r = await handler(postMensaje(HOLA, { clave }));
    assert.equal(r.statusCode, 401, `clave de largo ${clave.length}`);
    assert.equal(cuerpo(r).error.codigo, 'clave_invalida');
    assert.equal(cuerpo(r).error.detalle, 'clave de prueba ausente o incorrecta');
  }
  assert.ok(![...tabla.items.keys()].some((k) => k.startsWith('MSG#')));
  assert.deepEqual(cuerpo(await handler(getEnviados({ telefono: DUENA }))).mensajes, []);
});

test('AC-4: las tres rutas exigen la clave', async () => {
  const { handler } = armar();
  assert.equal((await handler(getEnviados({ telefono: DUENA }, { clave: null }))).statusCode, 401);
  assert.equal((await handler(getSalon({ clave: null }))).statusCode, 401);
  assert.equal((await handler(getSalon({ clave: 'otra' }))).statusCode, 401);
});

test('la clave, el teléfono y el texto nunca se registran', async () => {
  const { handler, lineas } = armar();
  await handler(postMensaje(HOLA));
  await handler(postMensaje(HOLA, { clave: 'clave-incorrecta-que-no-debe-salir' }));
  await handler(getEnviados({ telefono: DUENA }));
  assert.ok(lineas.length > 0);
  for (const l of lineas) {
    assert.ok(!l.includes(CLAVE));
    assert.ok(!l.includes('clave-incorrecta-que-no-debe-salir'));
    assert.ok(!l.includes('573000000001'));
    assert.ok(!l.includes('Hola'));
  }
  assert.ok(lineas.some((l) => JSON.parse(l).evento === 'clave_invalida' && JSON.parse(l).nivel === 'WARN'));
});

test('verificarClave compara en tiempo constante sobre SHA-256', () => {
  const fuente = readFileSync(new URL('../src/prueba/clave.mjs', import.meta.url), 'utf8');
  assert.match(fuente, /timingSafeEqual\(sha256\(recibida\), sha256\(clave\)\)/);
  assert.equal(verificarClave({ headers: { 'x-clave-prueba': CLAVE } }, CLAVE), true);
  assert.equal(verificarClave({ headers: {} }, CLAVE), false);
  assert.equal(verificarClave({ headers: { 'x-clave-prueba': 'otra' } }, CLAVE), false);
  assert.equal(verificarClave({ headers: { 'x-clave-prueba': CLAVE } }, undefined), false);
  assert.equal(verificarClave({ headers: { 'x-clave-prueba': CLAVE } }, null), false);
  assert.equal(verificarClave({ headers: { 'x-clave-prueba': '' } }, CLAVE), false);
});

test('clave configurada de menos de 32 bytes: las rutas no existen (404, falla cerrada)', async () => {
  const env = { CLAVE_CANAL_EMULADO: 'x'.repeat(31) };
  const { handler } = armar({ env });
  const r = await handler(postMensaje(HOLA, { clave: env.CLAVE_CANAL_EMULADO }));
  assert.equal(r.statusCode, 404);
  assert.equal(r.headers['content-type'], 'application/json');
});

// Modo abierto (OQ-H1-3): ambiente desplegado sin clave configurada; el comprobador no manda X-Clave-Prueba.
test('sin clave configurada (modo abierto): las rutas se atienden sin el encabezado', async () => {
  const { handler, lineas } = armar({ env: {} });
  const sin = { clave: null };
  assert.equal((await handler(getSalon(sin))).statusCode, 200);
  assert.equal((await handler(postMensaje(HOLA, sin))).statusCode, 202);
  const m = cuerpo(await handler(getEnviados({ telefono: DUENA }, sin))).mensajes;
  assert.equal(m[0].codigo, 'R-06');
  // Si el encabezado viene, se ignora.
  assert.equal((await handler(getSalon({ clave: 'cualquiera' }))).statusCode, 200);
  assert.ok(lineas.every((l) => !l.includes('cualquiera')));
  const avisos = lineas.map((l) => JSON.parse(l)).filter((l) => l.evento === 'clave_no_configurada');
  assert.equal(avisos.length, 1);
  assert.equal(avisos[0].nivel, 'WARN');
});

test('cargarConfigCanalEmulado devuelve el modo según clave y ENTORNO', async () => {
  const repo = crearRepositorioMemoria();
  assert.equal((await cargarConfigCanalEmulado({ env: {}, repo })).modo, 'abierto');
  assert.equal((await cargarConfigCanalEmulado({ env: { CLAVE_CANAL_EMULADO: CLAVE }, repo })).modo, 'estricto');
  assert.equal((await cargarConfigCanalEmulado({ env: { CLAVE_CANAL_EMULADO: 'x'.repeat(31) }, repo })).modo, 'deshabilitado');
  assert.equal((await cargarConfigCanalEmulado({ env: { ENTORNO: 'produccion' }, repo })).modo, 'deshabilitado');
});

test('sin clave configurada y ENTORNO=produccion: no se habilita', async () => {
  const cfg = await cargarConfigCanalEmulado({ env: { ENTORNO: 'produccion' }, repo: crearRepositorioMemoria() });
  assert.equal(cfg.modo, 'deshabilitado');
});

test('la clave también se puede leer del ítem CONFIG / CANAL_EMULADO de la tabla', async () => {
  const tabla = crearTablaMemoria();
  await tabla.put({ pk: 'CONFIG', sk: 'CANAL_EMULADO', clave: CLAVE });
  const repo = crearRepositorioMemoria(tabla);
  const cfg = await cargarConfigCanalEmulado({ env: {}, repo });
  assert.equal(cfg.modo, 'estricto');
  const handler = crearHandler({ repo, almacen: crearAlmacenEmuladoMemoria(tabla), env: {}, salida: () => {} });
  assert.equal((await handler(getSalon())).statusCode, 200);
});

test('segunda barrera: en producción el canal emulado y el handler no arrancan', () => {
  const almacen = crearAlmacenEmuladoMemoria();
  assert.throws(() => elegirCanal({ env: { ENTORNO: 'produccion', CANAL_WHATSAPP: 'emulado' }, almacen }));
  assert.throws(() => crearHandler({ repo: crearRepositorioMemoria(), almacen, env: { ENTORNO: 'produccion', CLAVE_CANAL_EMULADO: CLAVE } }));
});

test('con ENTORNO=produccion las rutas de prueba responden 404 aunque haya clave', async () => {
  const repo = crearRepositorioMemoria();
  const cfg = await cargarConfigCanalEmulado({ env: { ENTORNO: 'produccion', CLAVE_CANAL_EMULADO: CLAVE }, repo });
  assert.equal(cfg.modo, 'deshabilitado');
});

test('la clave no da identidad: duena desde un número que no es dueña → 422', async () => {
  const { handler } = armar();
  const r = await handler(postMensaje({ remitente: 'duena', telefono: '+573000000901', texto: 'Vista' }));
  assert.equal(r.statusCode, 422);
  assert.equal(cuerpo(r).error.codigo, 'remitente_inconsistente');
});
