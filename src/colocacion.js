import { COLOCACION } from './config.js';
import { punteroFino } from './entrada.js';
import { celdaDeCliente } from './escala.js';

export function crearColocacion({ tablero, canvas, jardin, zona, alActivar }) {
  let tipoId = null;
  let puntero = null;
  let presencia = 0;

  const celdaDe = (e) => celdaDeCliente(canvas, e.clientX, e.clientY, tablero);

  function activar(id) {
    tipoId = id;
    puntero = null;
    alActivar?.();
  }

  function cancelar() {
    tipoId = null;
    puntero = null;
  }

  function alMover(e) {
    if (!punteroFino(e)) return;
    puntero = celdaDe(e);
  }

  function alSalir() {
    puntero = null;
  }

  function alPulsar(e) {
    if (!tipoId) return;
    e.stopImmediatePropagation();
    const celda = celdaDe(e);
    if (celda && jardin.colocable(tipoId, celda)) {
      jardin.plantar(tipoId, celda);
      cancelar();
    }
  }

  function alPulsarFuera(e) {
    if (!tipoId || canvas.contains(e.target) || zona.contains(e.target)) return;
    cancelar();
  }

  function alTeclear(e) {
    if (e.key === 'Escape') cancelar();
  }

  canvas.addEventListener('pointermove', alMover);
  canvas.addEventListener('pointerleave', alSalir);
  canvas.addEventListener('pointerdown', alPulsar, { capture: true });
  document.addEventListener('pointerdown', alPulsarFuera);
  document.addEventListener('keydown', alTeclear);

  return {
    activa: () => tipoId !== null,
    tipoActivo: () => tipoId,
    alternar(id) {
      if (tipoId === id) cancelar();
      else activar(id);
    },
    actualizar(dt) {
      const objetivo = tipoId ? 1 : 0;
      presencia += (objetivo - presencia) * (1 - Math.exp(-dt * COLOCACION.desvanecimiento));
      if (Math.abs(objetivo - presencia) < 0.005) presencia = objetivo;
    },
    vista() {
      if (!tipoId) return null;
      return {
        tipoId,
        puntero,
        valido: Boolean(puntero) && jardin.colocable(tipoId, puntero),
        candidatas: jardin.candidatas(tipoId),
        presencia,
      };
    },
    destruir() {
      canvas.removeEventListener('pointermove', alMover);
      canvas.removeEventListener('pointerleave', alSalir);
      canvas.removeEventListener('pointerdown', alPulsar, { capture: true });
      document.removeEventListener('pointerdown', alPulsarFuera);
      document.removeEventListener('keydown', alTeclear);
    },
  };
}
