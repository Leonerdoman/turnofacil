import { crearAlmacenEmulado } from './almacen-emulado.mjs';
import { crearTablaMemoria } from '../datos/repositorio-memoria.mjs';

export function crearAlmacenEmuladoMemoria(tabla = crearTablaMemoria()) {
  return crearAlmacenEmulado({ tabla });
}
