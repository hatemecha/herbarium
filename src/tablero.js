import { TABLERO } from './config.js';

export function crearTablero(configuracion = TABLERO) {
  const { columnas, filas, celda } = configuracion;
  const ocupaciones = new Map();
  const clave = (x, y) => `${x},${y}`;

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
    ocupar: (x, y, entidad) => ocupaciones.set(clave(x, y), entidad),
    liberar: (x, y) => ocupaciones.delete(clave(x, y)),
    ocupante: (x, y) => ocupaciones.get(clave(x, y)) ?? null,
  };
}
