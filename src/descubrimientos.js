import { ENEMIGOS, PLANTAS } from './catalogo.js';

const CLAVE = 'herbarium:descubrimientos';
const TIPOS = { plantas: PLANTAS, enemigos: ENEMIGOS };

export function crearDescubrimientos(obtenerAlmacen = () => localStorage) {
  const vistos = { plantas: new Set(), enemigos: new Set() };
  let almacen;
  try {
    almacen = obtenerAlmacen();
    const datos = JSON.parse(almacen.getItem(CLAVE));
    for (const [grupo, tipos] of Object.entries(TIPOS)) {
      if (!Array.isArray(datos?.[grupo])) continue;
      for (const id of datos[grupo]) {
        if (typeof id === 'string' && Object.hasOwn(tipos, id)) vistos[grupo].add(id);
      }
    }
  } catch {
    // Un almacenamiento inaccesible o ilegible no interrumpe la partida.
  }

  return {
    listar(grupo) {
      return Object.values(TIPOS[grupo]).filter(({ id }) => vistos[grupo].has(id));
    },
    registrar(grupo, ...ids) {
      const lista = vistos[grupo];
      const antes = lista.size;
      for (const id of ids) {
        if (Object.hasOwn(TIPOS[grupo], id)) lista.add(id);
      }
      if (lista.size === antes) return;
      try {
        almacen?.setItem(CLAVE, JSON.stringify({
          plantas: [...vistos.plantas],
          enemigos: [...vistos.enemigos],
        }));
      } catch {
        // Los descubrimientos siguen disponibles durante esta sesión.
      }
    },
  };
}
