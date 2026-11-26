import { crearHandlerReal } from './arranque.mjs';

let listo;

export async function handler(evento, contexto) {
  listo ??= crearHandlerReal(process.env);
  return (await listo)(evento, contexto);
}
