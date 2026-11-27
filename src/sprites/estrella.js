// Hexagrama de 7×7. Misma marca para la energía y el coste.
export const ESTRELLA = [
  '...#...',
  '.#...#.',
  '..#.#..',
  '#######',
  '..#.#..',
  '.#...#.',
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
  const prev = ctx.textBaseline;
  ctx.textBaseline = 'alphabetic';
  const m = ctx.measureText(texto);
  const ascent = m.actualBoundingBoxAscent > 0 ? m.actualBoundingBoxAscent : 8;
  const descent = m.actualBoundingBoxDescent > 0 ? m.actualBoundingBoxDescent : 1;
  const tintaCentro = yBase - ascent + (ascent + descent) / 2;
  pintarEstrella(ctx, cx, Math.round(tintaCentro - LADO_ESTRELLA / 2), colorEstrella);
  ctx.fillStyle = colorTexto;
  ctx.fillText(texto, cx + LADO_ESTRELLA + gap, yBase);
  ctx.textBaseline = prev;
  return cx + LADO_ESTRELLA + gap + m.width;
}
