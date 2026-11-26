import { SPRITE } from '../config.js';

// Devuelve [direccion][variante] de canvas listos para dibujar con nearest-neighbor.
export function construirFotogramas(arte, colores) {
  const direcciones = arte.matrizPara ? 8 : 1;
  return Array.from({ length: direcciones }, (_, direccion) => {
    const base = arte.matrizPara ? arte.matrizPara(direccion) : arte.matriz;
    return arte.variantes.map((variante) =>
      crearCanvas(aplicarVariante(base, variante, arte.transformaciones), arte.codigos, colores),
    );
  });
}

function aplicarVariante(base, variante, transformaciones = {}) {
  const filas = base.map((fila) => [...fila]);
  if (variante.transformar) {
    const cambiar = transformaciones[variante.transformar];
    cambiar?.(filas);
  } else {
    const parches = Array.isArray(variante) ? variante : variante.parches ?? [];
    for (const [x, y, codigo] of parches) filas[y][x] = codigo;
  }
  return filas.map((fila) => fila.join(''));
}

function crearCanvas(filas, codigos, colores) {
  const lado = SPRITE.lado;
  const canvas = document.createElement('canvas');
  canvas.width = lado;
  canvas.height = lado;
  const ctx = canvas.getContext('2d');
  const imagen = ctx.createImageData(lado, lado);
  const datos = imagen.data;

  filas.forEach((fila, y) =>
    [...fila].forEach((codigo, x) => {
      const rol = codigos[codigo];
      if (!rol) return;
      const [r, g, b] = colores[rol];
      const p = (y * lado + x) * 4;
      datos[p] = r;
      datos[p + 1] = g;
      datos[p + 2] = b;
      datos[p + 3] = 255;
    }),
  );

  ctx.putImageData(imagen, 0, 0);
  return canvas;
}
