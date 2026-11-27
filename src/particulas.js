import { PARTICULAS } from './config.js';
import { rgb } from './paleta.js';

// Presupuesto visual independiente de la simulación. Las ráfagas importantes
// desplazan polen y energía antes de competir con otros efectos de combate.
const FAMILIAS = {
  gesto:   { prioridad: 1, vida: [0.22, 0.36], velocidad: [5, 10], forma: 'punto', deriva: 0 },
  polen:   { prioridad: 0, vida: [2.6, 4.8], velocidad: [1, 3], forma: 'punto', deriva: 0.8 },
  energia: { prioridad: 1, vida: [0.5, 0.9], velocidad: [5, 9], forma: 'cruz', deriva: 0.5 },
  brote:   { prioridad: 3, vida: [0.5, 0.9], velocidad: [12, 23], forma: 'semilla', deriva: 0.2 },
  disparo: { prioridad: 2, vida: [0.12, 0.24], velocidad: [18, 34], forma: 'trazo', deriva: 0 },
  impacto: { prioridad: 3, vida: [0.18, 0.42], velocidad: [14, 30], forma: 'trazo', deriva: 0 },
  espora:  { prioridad: 3, vida: [0.48, 0.75], velocidad: [15, 29], forma: 'espora', deriva: 0.9 },
  reflejo: { prioridad: 3, vida: [0.14, 0.3], velocidad: [20, 40], forma: 'trazo', deriva: 0 },
  restos:  { prioridad: 2, vida: [0.35, 0.7], velocidad: [7, 15], forma: 'resto', deriva: 0.3 },
  control: { prioridad: 2, vida: [0.3, 0.55], velocidad: [3, 7], forma: 'trazo', deriva: 0.1 },
};

export function crearParticulas({ aleatorio = Math.random } = {}) {
  const lista = [];
  const azar = (min, max) => min + aleatorio() * (max - min);

  function nacer(x, y, aspecto = {}, indice = 0, total = 1) {
    const familia = aspecto.familia ?? 'polen';
    const f = FAMILIAS[familia];
    if (!f) return;
    if (f.prioridad === 0 && lista.filter(p => p.prioridad === 0).length >= PARTICULAS.ambienteMaximo) return;
    if (lista.length >= PARTICULAS.maximo) {
      let reemplazo = -1;
      for (let i = 0; i < lista.length; i++) {
        if (lista[i].prioridad >= f.prioridad) continue;
        if (reemplazo === -1 || lista[i].prioridad < lista[reemplazo].prioridad) reemplazo = i;
      }
      if (reemplazo === -1) return;
      lista.splice(reemplazo, 1);
    }
    const dirigido = Math.hypot(aspecto.ux ?? 0, aspecto.uy ?? 0) > 0.01;
    const angulo = dirigido
      ? Math.atan2(aspecto.uy, aspecto.ux) + azar(-0.65, 0.65)
      : familia === 'espora' ? (indice + azar(-0.2, 0.2)) * Math.PI * 2 / total
      : familia === 'polen' || familia === 'energia' || familia === 'brote' ? azar(-Math.PI, 0)
      : azar(0, Math.PI * 2);
    const vida = aspecto.vida ?? azar(...f.vida);
    const velocidad = familia === 'espora' && aspecto.radio
      ? Math.min(aspecto.radio / vida, azar(...f.velocidad)) : azar(...f.velocidad);
    lista.push({
      familia, prioridad: f.prioridad, forma: f.forma, deriva: f.deriva,
      x, y, vx: Math.cos(angulo) * velocidad, vy: Math.sin(angulo) * velocidad,
      fase: azar(0, Math.PI * 2), vida, edad: 0, color: aspecto.color,
      brillo: azar(0.45, 0.9), tam: familia === 'espora' && aleatorio() < 0.24 ? 2 : 1,
    });
  }

  return {
    rafaga(x, y, cantidad, aspecto) {
      for (let i = 0; i < cantidad; i++) nacer(x, y, aspecto, i, cantidad);
    },
    actualizar(dt, emitiendo, reducido = false, elegirEmisor) {
      if (reducido) { lista.length = 0; return; }
      if (emitiendo && elegirEmisor && aleatorio() < PARTICULAS.tasa * dt) {
        const { x, y, color } = elegirEmisor(aleatorio());
        nacer(x + azar(-3, 3), y + azar(-2, 2), { color });
      }
      for (let i = lista.length - 1; i >= 0; i--) {
        const p = lista[i];
        if (!emitiendo && p.familia === 'polen') { lista.splice(i, 1); continue; }
        p.edad += dt;
        if (p.edad >= p.vida) { lista.splice(i, 1); continue; }
        const freno = p.familia === 'restos' || p.familia === 'espora' ? Math.exp(-dt * 2) : 1;
        p.vx *= freno;
        p.vy *= freno;
        if (p.familia === 'restos') p.vy += 13 * dt;
        p.x += (p.vx + Math.sin(p.edad * 3 + p.fase) * p.deriva) * dt;
        p.y += p.vy * dt;
      }
    },
    dibujar(ctx, color) {
      for (const p of lista) {
        const progreso = p.edad / p.vida;
        const x = Math.round(p.x), y = Math.round(p.y);
        ctx.fillStyle = rgb(p.color ?? color);
        ctx.globalAlpha = p.brillo * (p.prioridad < 2 ? Math.sin(Math.PI * progreso) * 0.35 : (1 - progreso));
        ctx.fillRect(x, y, p.tam, p.tam);
        if (p.forma === 'trazo' && progreso < 0.65) {
          ctx.globalAlpha *= 0.48;
          const d = Math.hypot(p.vx, p.vy) || 1;
          ctx.fillRect(x - Math.round(p.vx / d), y - Math.round(p.vy / d), 1, 1);
        } else if (p.forma === 'cruz' && progreso < 0.55) {
          ctx.globalAlpha *= 0.5;
          ctx.fillRect(x - 1, y, 3, 1);
          ctx.fillRect(x, y - 1, 1, 3);
        } else if (p.forma === 'semilla' && progreso < 0.5) {
          ctx.fillRect(x, y + 1, 1, 1);
        } else if (p.forma === 'resto' && progreso < 0.25) {
          ctx.fillRect(x + 1, y + 1, 1, 1);
        }
      }
      ctx.globalAlpha = 1;
    },
    // Consulta de diagnóstico, no estado de juego.
    resumen: () => ({ total: lista.length, familias: lista.reduce((r, p) => (r[p.familia] = (r[p.familia] ?? 0) + 1, r), {}) }),
  };
}
