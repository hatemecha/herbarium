export function calcularEscala({ anchoCss, altoCss, dpr, lado }) {
  const disponible = Math.max(1, Math.floor(Math.min(anchoCss, altoCss) * dpr));
  const multiplo = Math.max(1, Math.floor(disponible / lado));
  const pixeles = multiplo * lado;
  return { pixeles, css: pixeles / dpr, multiplo };
}

export function alinearPixel(css, dpr) {
  return Math.round(css * dpr) / dpr;
}

export function celdaDeCliente(canvas, clientX, clientY, tablero) {
  const punto = pantallaAMundo(canvas.getBoundingClientRect(), clientX, clientY, tablero.ancho);
  return tablero.celdaEnMundo(punto.x, punto.y);
}

export function pantallaAMundo(rect, clientX, clientY, lado) {
  return {
    x: ((clientX - rect.left) / rect.width) * lado,
    y: ((clientY - rect.top) / rect.height) * lado,
  };
}
