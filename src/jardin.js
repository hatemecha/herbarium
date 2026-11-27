import { BALANCE, ECONOMIA, PALA } from './config.js';
import { costeDe } from './economia.js';
import { crearPlanta } from './entidades/planta.js';

// Reglas de expansión: una casilla es colocable si está dentro del tablero, libre, tiene una planta
// en alguna de sus ocho vecinas y la energía alcanza el coste. Todo se calcula desde las plantas existentes.
export function crearJardin({ tablero, estado, catalogo, frames, alPlantar, alRetirar, economia = ECONOMIA,
  permitido = () => true, pala = PALA }) {
  const plantas = [];
  const rearme = new Map();
  let central = null;

  function tieneVecinaOcupada(celda) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if ((dx || dy) && tablero.ocupante(celda.x + dx, celda.y + dy)) return true;
      }
    }
    return false;
  }

  function vivasDe(id) {
    let cantidad = 0;
    for (const planta of plantas) if (planta.id === id && !planta.muerta) cantidad += 1;
    return cantidad;
  }

  function coste(id) {
    return costeDe(catalogo[id], vivasDe(id), economia);
  }

  function colocable(id, celda) {
    const tipo = catalogo[id];
    if (!tipo?.comprable || central?.muerta || !permitido()) return false;
    if (!tablero.contiene(celda.x, celda.y)) return false;
    if (tablero.ocupante(celda.x, celda.y)) return false;
    if (!tieneVecinaOcupada(celda)) return false;
    return estado.energia >= coste(id);
  }

  const clave = ({ x, y }) => y * tablero.columnas + x;

  function nacer(id, celda, desfase = 0, costePagado = 0) {
    const planta = crearPlanta({ tablero, celda, tipo: catalogo[id], frames: frames[id], desfase });
    planta.costePagado = costePagado;
    planta.enfriamiento = Math.max(0, (rearme.get(clave(celda)) ?? 0) - (estado.tiempo ?? 0));
    plantas.push(planta);
    if (id === 'central') central = planta;
    alPlantar?.(planta);
    return planta;
  }

  function reembolso(celda) {
    if (!permitido() || central?.muerta || !tablero.contiene(celda.x, celda.y)) return null;
    const planta = tablero.ocupante(celda.x, celda.y);
    if (!planta || planta === central || planta.muerta) return null;
    const salud = pala.proporcionalVida ? Math.max(0, Math.min(1, planta.vida / planta.vidaMax)) : 1;
    return Math.floor(planta.costePagado * Math.max(0, Math.min(1, pala.reembolso)) * salud);
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
    coste,
    reembolso,
    retirar(celda) {
      const energia = reembolso(celda);
      if (energia === null) return null;
      const planta = tablero.ocupante(celda.x, celda.y);
      planta.muerta = true;
      tablero.liberar(celda.x, celda.y);
      plantas.splice(plantas.indexOf(planta), 1);
      rearme.set(clave(celda), (estado.tiempo ?? 0) + pala.rearme);
      estado.energia += energia;
      alRetirar?.(planta, true);
      return { planta, energia };
    },
    plantar(id, celda) {
      if (!colocable(id, celda)) return null;
      const precio = coste(id);
      estado.energia -= precio;
      return nacer(id, celda, Math.random() * 4, precio);
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
