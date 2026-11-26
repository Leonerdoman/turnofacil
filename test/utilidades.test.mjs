import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nuevoUlid } from '../src/comun/ulid.mjs';
import { ahoraColombia, aColombia, esIso } from '../src/comun/hora.mjs';
import { esTelefono } from '../src/comun/telefono.mjs';
import { seudonimo } from '../src/comun/seudonimo.mjs';
import { json, error } from '../src/comun/http.mjs';
import { crearLog } from '../src/comun/log.mjs';

test('ULID: 26 caracteres Crockford y ordenable por tiempo', () => {
  const a = nuevoUlid(1700000000000);
  const b = nuevoUlid(1700000001000);
  assert.match(a, /^[0-9A-HJKMNP-TV-Z]{26}$/);
  assert.ok(a < b);
});

test('hora de Colombia con desfase -05:00 sin depender de TZ', () => {
  assert.equal(ahoraColombia(new Date('2026-11-25T15:00:00.123Z')), '2026-11-25T10:00:00.123-05:00');
  assert.match(ahoraColombia(), /-05:00$/);
  assert.equal(aColombia('2026-11-25T10:00:00-05:00'), '2026-11-25T10:00:00.000-05:00');
  assert.equal(aColombia('2026-11-25T15:00:00Z'), '2026-11-25T10:00:00.000-05:00');
});

test('esIso acepta ISO 8601 y rechaza lo demás', () => {
  assert.ok(esIso('2026-11-25T10:00:00-05:00'));
  assert.ok(esIso('2026-11-25T10:00:00.5Z'));
  assert.ok(esIso('2026-11-25'));
  assert.ok(!esIso('ayer'));
  assert.ok(!esIso('2026-13-45T10:00:00Z'));
});

test('teléfono colombiano móvil', () => {
  assert.ok(esTelefono('+573000000001'));
  assert.ok(!esTelefono('573000000001'));
  assert.ok(!esTelefono('+57300000000'));
  assert.ok(!esTelefono(' 573000000001'));
  assert.ok(!esTelefono(null));
});

test('seudónimo HMAC-SHA256 de 64 hex, distinto del número', () => {
  const s = seudonimo('+573000000001', 'clave');
  assert.match(s, /^[0-9a-f]{64}$/);
  assert.notEqual(s, seudonimo('+573000000001', 'otra'));
  assert.match(seudonimo('+573000000001'), /^[0-9a-f]{64}$/);
});

test('respuestas HTTP JSON y cuerpo de error común', () => {
  const r = json(202, { a: 1 });
  assert.equal(r.statusCode, 202);
  assert.equal(r.headers['content-type'], 'application/json');
  assert.deepEqual(JSON.parse(r.body), { a: 1 });
  const e = error(400, 'datos_invalidos', 'telefono: formato');
  assert.equal(e.statusCode, 400);
  assert.deepEqual(JSON.parse(e.body), { error: { codigo: 'datos_invalidos', detalle: 'telefono: formato' } });
});

test('log: una línea JSON con campos obligatorios y sin datos personales', () => {
  const lineas = [];
  const log = crearLog({ componente: 'canal_emulado', salida: (l) => lineas.push(l) });
  log.info('prueba', { resultado: 'ok', telefono: '+573000000001', texto: 'Hola', clave: 'x' });
  assert.equal(lineas.length, 1);
  assert.ok(!lineas[0].includes('\n'));
  const r = JSON.parse(lineas[0]);
  assert.equal(r.nivel, 'INFO');
  assert.equal(r.componente, 'canal_emulado');
  assert.equal(r.evento, 'prueba');
  assert.match(r.ts, /-05:00$/);
  assert.equal(r.telefono, undefined);
  assert.equal(r.texto, undefined);
  assert.equal(r.clave, undefined);
});
