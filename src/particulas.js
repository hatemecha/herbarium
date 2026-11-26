import { PARTICULAS } from './config.js';
import { rgb } from './paleta.js';

const azar = (min, max) => min + Math.random() * (max - min);

export function crearParticulas() {
  const lista = [];

  function nacer(x, y, aspecto) {
    lista.push({
      x: x + azar(-3.5, 3.5),
      y: y + azar(-2, 2),
      vx: azar(-0.6, 0.6),
      vy: azar(-2.2, -1),
      fase: azar(0, Math.PI * 2),
      vida: aspecto?.vida ?? azar(PARTICULAS.vidaMin, PARTICULAS.vidaMax),
      color: aspecto?.color,
      edad: 0,
      tam: Math.random() < 0.3 ? 2 : 1,
      brillo: azar(0.45, 1),
    });
  }

  return {
    rafaga(x, y, cantidad, aspecto) {
      for (let i = 0; i < cantidad && lista.length < PARTICULAS.maximo; i++) nacer(x, y, aspecto);
    },
    actualizar(dt, x, y, emitiendo) {
      if (emitiendo && lista.length < PARTICULAS.maximo && Math.random() < PARTICULAS.tasa * dt) nacer(x, y);
      for (let i = lista.length - 1; i >= 0; i--) {
        const p = lista[i];
        p.edad += dt;
        if (p.edad >= p.vida) {
          lista.splice(i, 1);
          continue;
        }
        p.x += (p.vx + Math.sin(p.edad * 1.4 + p.fase) * 0.6) * dt;
        p.y += p.vy * dt;
      }
    },
    dibujar(ctx, color) {
      for (const p of lista) {
        ctx.fillStyle = rgb(p.color ?? color);
        ctx.globalAlpha = Math.sin((Math.PI * p.edad) / p.vida) * p.brillo * 0.8;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.tam, p.tam);
      }
      ctx.globalAlpha = 1;
    },
  };
}
