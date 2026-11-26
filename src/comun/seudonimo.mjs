import { createHash, createHmac } from 'node:crypto';

// HMAC-SHA256 en hex. Sin clave configurada se usa SHA-256 (solo ambiente de prueba, decisión OQ-H1-8).
export function seudonimo(telefono, clave) {
  if (clave) return createHmac('sha256', clave).update(telefono).digest('hex');
  return createHash('sha256').update(telefono).digest('hex');
}
