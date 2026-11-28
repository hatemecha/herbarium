import { TABLERO } from './config.js';

export const claveCelda = (x, y) => `${x},${y}`;

export function crearMundo() {
  const { celda } = TABLERO;
  const lado = 9;
  const mitad = Math.floor(lado / 2);
  const region = (v) => Math.floor((v + mitad) / lado);
  const descubiertas = new Set([claveCelda(0, 0)]);
  const ocupaciones = new Map();

  return {
    infinito: true,
    celda,
    centro: { x: 0, y: 0 },
    contiene: (x, y) => Number.isSafeInteger(x) && Number.isSafeInteger(y) &&
      descubiertas.has(claveCelda(region(x), region(y))),
    superficie: () => descubiertas.size * lado ** 2,
    origen: (x, y) => ({ x: x * celda, y: y * celda }),
    celdaEnMundo: (px, py) => ({ x: Math.floor(px / celda), y: Math.floor(py / celda) }),
    ocupar(x, y, entidad) {
      ocupaciones.set(claveCelda(x, y), entidad);
      for (let ry = region(y - 1); ry <= region(y + 1); ry++) {
        for (let rx = region(x - 1); rx <= region(x + 1); rx++) descubiertas.add(claveCelda(rx, ry));
      }
    },
    liberar: (x, y) => ocupaciones.delete(claveCelda(x, y)),
    ocupante: (x, y) => ocupaciones.get(claveCelda(x, y)) ?? null,
    ocupantes: () => ocupaciones.values(),
  };
}

export function crearTablero(configuracion = TABLERO) {
  const { columnas, filas, celda } = configuracion;
  const ocupaciones = new Map();

  const contiene = (x, y) =>
    Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < columnas && y < filas;

  return {
    columnas,
    filas,
    celda,
    ancho: columnas * celda,
    alto: filas * celda,
    centro: { x: Math.floor(columnas / 2), y: Math.floor(filas / 2) },
    contiene,
    origen: (x, y) => ({ x: x * celda, y: y * celda }),
    celdaEnMundo(px, py) {
      const x = Math.floor(px / celda);
      const y = Math.floor(py / celda);
      return contiene(x, y) ? { x, y } : null;
    },
    ocupar: (x, y, entidad) => ocupaciones.set(claveCelda(x, y), entidad),
    liberar: (x, y) => ocupaciones.delete(claveCelda(x, y)),
    ocupante: (x, y) => ocupaciones.get(claveCelda(x, y)) ?? null,
  };
}
