import { COLOCACION } from './config.js';
import { punteroFino } from './entrada.js';

export function crearColocacion({ canvas, jardin, zona, celdaDe, alActivar, alIntentar }) {
  let tipoId = null;
  let puntero = null;
  let presencia = 0;
  let confirmacion = null;

  function activar(id) {
    tipoId = id;
    confirmacion = null;
    puntero = null;
    alActivar?.();
  }

  function cancelar() {
    tipoId = null;
    confirmacion = null;
    puntero = null;
  }

  function alMover(e) {
    if (!punteroFino(e)) return;
    puntero = celdaDe(e);
  }

  function alSalir() {
    puntero = confirmacion;
  }

  function alPulsar(e) {
    if (!tipoId) return false;
    const celda = celdaDe(e);
    if (!celda) return true;
    if (!jardin.colocable(tipoId, celda)) {
      alIntentar?.('invalida', celda);
      return true;
    }
    if (!punteroFino(e) && (confirmacion?.x !== celda.x || confirmacion?.y !== celda.y)) {
      confirmacion = celda;
      puntero = celda;
      alIntentar?.('preview', celda);
      return true;
    }
    jardin.plantar(tipoId, celda);
    cancelar();
    return true;
  }

  function alPulsarFuera(e) {
    if (!tipoId || canvas.contains(e.target) || zona.contains(e.target)) return;
    cancelar();
  }

  function alTeclear(e) {
    if (e.key === 'Escape') cancelar();
  }

  canvas.addEventListener('pointerleave', alSalir);
  document.addEventListener('pointerdown', alPulsarFuera);
  document.addEventListener('keydown', alTeclear);

  return {
    activa: () => tipoId !== null,
    cancelar,
    pulsar: alPulsar,
    mover: alMover,
    salir: alSalir,
    arrastrar(id) {
      activar(id);
      presencia = 1;
    },
    moverSemilla(e) { puntero = celdaDe(e); },
    soltar(e) {
      const celda = celdaDe(e);
      if (tipoId && celda && !jardin.plantar(tipoId, celda)) alIntentar?.('invalida', celda);
      cancelar();
    },
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
      canvas.removeEventListener('pointerleave', alSalir);
      document.removeEventListener('pointerdown', alPulsarFuera);
      document.removeEventListener('keydown', alTeclear);
    },
  };
}
