import { MARCADORES } from './config.js';
import { rgb } from './paleta.js';

const PERIODO = 4;
const TRAMO_ENCENDIDO = 2;

// Recorre el borde de una celda en sentido horario, un píxel lógico por paso.
function puntoDelBorde(k, tamano) {
  const lado = tamano - 1;
  const tramo = Math.floor(k / lado);
  const r = k % lado;
  if (tramo === 0) return [r, 0];
  if (tramo === 1) return [lado, r];
  if (tramo === 2) return [lado - r, lado];
  return [0, lado - r];
}

export function dibujarHormigas(ctx, celda, { tamano, presencia, alfa, color, t, animar }) {
  const desfase = animar ? Math.floor(t * MARCADORES.velocidad) : 0;
  const x0 = celda.x * tamano;
  const y0 = celda.y * tamano;
  const perimetro = 4 * (tamano - 1);
  ctx.fillStyle = rgb(color, alfa * presencia);
  for (let k = 0; k < perimetro; k++) {
    if ((k + desfase) % PERIODO >= TRAMO_ENCENDIDO) continue;
    const [x, y] = puntoDelBorde(k, tamano);
    ctx.fillRect(x0 + x, y0 + y, 1, 1);
  }
}

export function resplandorCelda(ctx, celda, { tamano, escala, presencia, alfa, color }) {
  resplandorEn(ctx, { x: (celda.x * tamano + tamano / 2) * escala, y: (celda.y * tamano + tamano / 2) * escala }, {
    radio: tamano * 0.9 * escala,
    presencia,
    alfa,
    color,
  });
}

export function resplandorPunto(ctx, punto, { escala, radio, alfa, color }) {
  resplandorEn(ctx, { x: punto.x * escala, y: punto.y * escala }, { radio: radio * escala, presencia: 1, alfa, color });
}

function resplandorEn(ctx, { x: cx, y: cy }, { radio, presencia, alfa, color }) {
  const gradiente = ctx.createRadialGradient(cx, cy, 0, cx, cy, radio);
  gradiente.addColorStop(0, rgb(color, alfa * presencia));
  gradiente.addColorStop(1, rgb(color, 0));
  ctx.fillStyle = gradiente;
  ctx.fillRect(cx - radio, cy - radio, radio * 2, radio * 2);
}
