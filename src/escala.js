import { ESCALA } from './config.js';

export function calcularEscala({ anchoCss, altoCss, dpr, lado }) {
  const disponible = Math.max(1, Math.floor(Math.min(anchoCss, altoCss) * dpr));
  const escalaEntera = Math.floor(disponible / lado);
  const entera = escalaEntera >= 1 && escalaEntera * lado >= disponible * ESCALA.aprovechamientoMinimo;
  const pixeles = entera ? escalaEntera * lado : disponible;
  return { pixeles, css: pixeles / dpr, entera };
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
