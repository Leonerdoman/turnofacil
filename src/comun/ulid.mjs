// ULID sin dependencias: 10 caracteres de tiempo + 16 aleatorios (Crockford base32).
const ALFABETO = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function nuevoUlid(ms = Date.now()) {
  let tiempo = '';
  let t = ms;
  for (let i = 0; i < 10; i++) {
    tiempo = ALFABETO[t % 32] + tiempo;
    t = Math.floor(t / 32);
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let azar = '';
  for (const b of bytes) azar += ALFABETO[b % 32];
  return tiempo + azar;
}
