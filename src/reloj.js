import { SIMULACION } from './config.js';

// Acumula tiempo real y lo entrega en pasos fijos. `cortar` tira el sobrante al ocultar la pestaña.
export function crearReloj() {
  let acumulado = 0;
  return {
    acumular(delta) {
      acumulado += Math.min(SIMULACION.tiempoMaximo, Math.max(0, delta));
    },
    pasos() {
      const n = Math.floor((acumulado + 1e-9) / SIMULACION.paso);
      acumulado -= n * SIMULACION.paso;
      if (acumulado < 0) acumulado = 0;
      return n;
    },
    cortar() {
      acumulado = 0;
    },
    acumulado: () => acumulado,
  };
}
