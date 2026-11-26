import { crearRepositorio } from './repositorio.mjs';

// Tabla en memoria con la misma semántica que DynamoDB para get/put condicional/query.
// `fallar = true` simula un almacén caído en las pruebas.
export function crearTablaMemoria() {
  const items = new Map();
  const id = ({ pk, sk }) => `${pk}\u0000${sk}`;
  const tabla = {
    fallar: false,
    items,
    async get(clave) {
      if (tabla.fallar) throw new Error('almacén caído');
      const item = items.get(id(clave));
      return item ? structuredClone(item) : null;
    },
    async put(item, { siNoExiste = false } = {}) {
      if (tabla.fallar) throw new Error('almacén caído');
      if (siNoExiste && items.has(id(item))) return false;
      items.set(id(item), structuredClone(item));
      return true;
    },
    async query({ pk, skDesde, descendente = false, limite }) {
      if (tabla.fallar) throw new Error('almacén caído');
      let lista = [...items.values()].filter((i) => i.pk === pk && (skDesde === undefined || i.sk >= skDesde));
      lista.sort((a, b) => (a.sk < b.sk ? -1 : a.sk > b.sk ? 1 : 0));
      if (descendente) lista.reverse();
      if (limite) lista = lista.slice(0, limite);
      return structuredClone(lista);
    },
  };
  return tabla;
}

export function crearRepositorioMemoria(tabla = crearTablaMemoria()) {
  return crearRepositorio({ tabla });
}
