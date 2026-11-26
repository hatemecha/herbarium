// 40 casillas de borde en el tablero 11×11. Las esquinas se cuentan una sola vez.
export function perimetro(tablero) {
  const { columnas, filas } = tablero;
  const celdas = [];
  for (let x = 0; x < columnas; x++) {
    celdas.push({ x, y: 0, lado: 'norte' });
    if (filas > 1) celdas.push({ x, y: filas - 1, lado: 'sur' });
  }
  for (let y = 1; y < filas - 1; y++) {
    celdas.push({ x: 0, y, lado: 'oeste' });
    celdas.push({ x: columnas - 1, y, lado: 'este' });
  }
  return celdas;
}

export function celdasDeLado(lado, tablero) {
  const { columnas, filas } = tablero;
  const celdas = [];
  if (lado === 'norte') for (let x = 0; x < columnas; x++) celdas.push({ x, y: 0, lado });
  if (lado === 'sur') for (let x = 0; x < columnas; x++) celdas.push({ x, y: filas - 1, lado });
  if (lado === 'oeste') for (let y = 0; y < filas; y++) celdas.push({ x: 0, y, lado });
  if (lado === 'este') for (let y = 0; y < filas; y++) celdas.push({ x: columnas - 1, y, lado });
  return celdas;
}
