import { MARCADORES } from './config.js';
import { punteroFino } from './entrada.js';

const igual = (a, b) => a && b && a.x === b.x && a.y === b.y;

export function crearSeleccion({ tablero, canvas, celdaDe, alPulsarCelda }) {
  const marcas = {
    sobrevuelo: { celda: null, activa: false, presencia: 0 },
    seleccion: { celda: null, activa: false, presencia: 0 },
  };

  function fijar(marca, celda) {
    marca.activa = Boolean(celda);
    if (celda) marca.celda = celda;
  }

  const alMover = (e) => {
    if (!punteroFino(e)) return;
    fijar(marcas.sobrevuelo, celdaDe(e));
  };

  const alSalir = (e) => {
    if (punteroFino(e)) marcas.sobrevuelo.activa = false;
  };

  const alPulsar = (e) => {
    const celda = celdaDe(e);
    if (celda && tablero.ocupante(celda.x, celda.y)) fijar(marcas.seleccion, celda);
    else marcas.seleccion.activa = false;
    if (celda) alPulsarCelda?.(celda);
  };

  const alPulsarFuera = (e) => {
    if (canvas.contains(e.target) || e.target.closest?.('[data-interfaz]')) return;
    marcas.seleccion.activa = false;
  };

  canvas.addEventListener('pointerleave', alSalir);
  document.addEventListener('pointerdown', alPulsarFuera);

  return {
    pulsar: alPulsar,
    mover: alMover,
    limpiarSobrevuelo() {
      marcas.sobrevuelo.activa = false;
    },
    actualizar(dt) {
      const suavizado = 1 - Math.exp(-dt * MARCADORES.desvanecimiento);
      for (const marca of Object.values(marcas)) {
        const objetivo = marca.activa ? 1 : 0;
        marca.presencia += (objetivo - marca.presencia) * suavizado;
        if (Math.abs(objetivo - marca.presencia) < 0.005) marca.presencia = objetivo;
      }
    },
    marcas() {
      const lista = [];
      const { sobrevuelo, seleccion } = marcas;
      if (sobrevuelo.presencia > 0 && !(seleccion.activa && igual(sobrevuelo.celda, seleccion.celda))) {
        lista.push({ tipo: 'sobrevuelo', celda: sobrevuelo.celda, presencia: sobrevuelo.presencia });
      }
      if (seleccion.presencia > 0) {
        lista.push({ tipo: 'seleccion', celda: seleccion.celda, presencia: seleccion.presencia });
      }
      return lista;
    },
    seleccionada: () => (marcas.seleccion.activa ? { ...marcas.seleccion.celda } : null),
    sobrevuelo: () => (marcas.sobrevuelo.activa ? { ...marcas.sobrevuelo.celda } : null),
    limpiar() {
      marcas.seleccion.activa = false;
    },
    destruir() {
      canvas.removeEventListener('pointerleave', alSalir);
      document.removeEventListener('pointerdown', alPulsarFuera);
    },
  };
}
