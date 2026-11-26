import { BALANCE } from './config.js';
import { crearPlanta } from './entidades/planta.js';

// Reglas de expansión: una casilla es colocable si está dentro del tablero, libre, tiene una planta
// en alguna de sus ocho vecinas y la energía alcanza el coste. Todo se calcula desde las plantas existentes.
export function crearJardin({ tablero, estado, catalogo, frames, alPlantar, alRetirar }) {
  const plantas = [];
  let central = null;

  function tieneVecinaOcupada(celda) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if ((dx || dy) && tablero.ocupante(celda.x + dx, celda.y + dy)) return true;
      }
    }
    return false;
  }

  function colocable(id, celda) {
    const tipo = catalogo[id];
    if (!tipo?.comprable) return false;
    if (!tablero.contiene(celda.x, celda.y)) return false;
    if (tablero.ocupante(celda.x, celda.y)) return false;
    if (!tieneVecinaOcupada(celda)) return false;
    return estado.energia >= tipo.coste;
  }

  function nacer(id, celda, desfase = 0) {
    const planta = crearPlanta({ tablero, celda, tipo: catalogo[id], frames: frames[id], desfase });
    plantas.push(planta);
    if (id === 'central') central = planta;
    alPlantar?.(planta);
    return planta;
  }

  return {
    plantas,
    get central() {
      return central;
    },
    sembrar(id, celda) {
      return nacer(id, celda);
    },
    colocable,
    plantar(id, celda) {
      if (!colocable(id, celda)) return null;
      estado.energia -= catalogo[id].coste;
      return nacer(id, celda, Math.random() * 4);
    },
    candidatas(id) {
      const lista = [];
      for (let y = 0; y < tablero.filas; y++) {
        for (let x = 0; x < tablero.columnas; x++) {
          if (colocable(id, { x, y })) lista.push({ x, y });
        }
      }
      return lista;
    },
    destruir(planta) {
      if (planta.muerta) return;
      planta.muerta = true;
      planta.tiempoMuerte = 0;
      tablero.liberar(planta.celda.x, planta.celda.y);
    },
    actualizar(dt, reducido) {
      for (const planta of [...plantas]) {
        planta.actualizar(dt, reducido);
        if (!planta.muerta) continue;
        planta.tiempoMuerte += dt;
        planta.opacidad = Math.max(0, 1 - planta.tiempoMuerte / BALANCE.visual.marchitez);
        if (planta.opacidad <= 0) {
          plantas.splice(plantas.indexOf(planta), 1);
          alRetirar?.(planta);
        }
      }
    },
  };
}
