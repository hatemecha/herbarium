import { medirTexto, pintarTexto } from '../interfazPixel.js';

// Hexagrama de 7×7. Misma marca para la energía y el coste.
export const ESTRELLA = [
  '...#...',
  '.#.#.#.',
  '..###..',
  '###.###',
  '..###..',
  '.#.#.#.',
  '...#...',
];

export const LADO_ESTRELLA = ESTRELLA.length;

export function pintarEstrella(ctx, x, y, color) {
  const inicioX = Math.round(x);
  const inicioY = Math.round(y);
  ctx.fillStyle = color;
  for (let fila = 0; fila < ESTRELLA.length; fila += 1) {
    for (let col = 0; col < ESTRELLA[fila].length; col += 1) {
      if (ESTRELLA[fila][col] === '#') ctx.fillRect(inicioX + col, inicioY + fila, 1, 1);
    }
  }
}

/** Estrella centrada en la tinta del texto (no en la caja tipográfica). */
export function pintarEstrellaYTexto(ctx, x, yBase, texto, colorEstrella, colorTexto, gap = 2) {
  const cx = Math.round(x);
  pintarEstrella(ctx, cx, yBase - 6, colorEstrella);
  pintarTexto(ctx, texto, cx + LADO_ESTRELLA + gap, yBase, colorTexto);
  return cx + LADO_ESTRELLA + gap + medirTexto(texto);
}
