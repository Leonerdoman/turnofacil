import { crearAlmacenEmulado } from './almacen-emulado.mjs';

// Usa la misma tabla DynamoDB ya creada por repositorio-dynamo (crearTablaDynamo).
export function crearAlmacenEmuladoDynamo({ tabla }) {
  return crearAlmacenEmulado({ tabla });
}
