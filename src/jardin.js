import { claveCelda } from './tablero.js';
import { BALANCE, ECONOMIA, PALA } from './config.js';
import { costeDe } from './economia.js';
import { crearPlanta } from './entidades/planta.js';

// Reglas de expansión: una casilla es colocable si está dentro del tablero, libre, tiene una planta
// en alguna de sus ocho vecinas y la energía alcanza el coste. Todo se calcula desde las plantas existentes.
export function crearJardin({ tablero, estado, catalogo, frames, alPlantar, alRetirar, economia = ECONOMIA,
  permitido = () => true, pala = PALA, efectos }) {
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

  function vecinas(celda) {
    const plantas = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const planta = tablero.ocupante(celda.x + dx, celda.y + dy);
        if (planta?.tipo.comprable && !planta.muerta) plantas.push(planta);
      }
    }
    return plantas;
  }

  function actualizarVecindad(celda) {
    if (!efectos?.espacial()) return;
    const actual = tablero.ocupante(celda.x, celda.y);
    const afectadas = vecinas(celda);
    if (actual) afectadas.push(actual);
    for (const planta of afectadas) efectos.actualizarPlanta(planta, vecinas(planta.celda));
  }

  function precio(base, celda) {
    return efectos?.precio(base, celda, Boolean(celda && efectos.precioAgrupado() && vecinas(celda).length >= 3)) ?? base;
  }

  function coste(id, celda) {
    return precio(costeDe(catalogo[id], vivasDe(id), economia), celda);
  }

  function colocable(id, celda) {
    const tipo = catalogo[id];
    if (!tipo?.comprable || central?.muerta || !permitido()) return false;
    if (!tablero.contiene(celda.x, celda.y)) return false;
    if (tablero.ocupante(celda.x, celda.y)) return false;
    if (!tieneVecinaOcupada(celda)) return false;
    return estado.energia >= coste(id, celda);
  }

  const clave = ({ x, y }) => claveCelda(x, y);

  function nacer(id, celda, desfase = 0, costePagado = 0) {
    const planta = crearPlanta({ tablero, celda, tipo: catalogo[id], frames: frames[id], desfase });
    planta.costePagado = costePagado;
    planta.enfriamiento = Math.max(0, (rearme.get(clave(celda)) ?? 0) - (estado.tiempo ?? 0));
    plantas.push(planta);
    actualizarVecindad(celda);
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
    adquirirArcano(carta) {
      efectos.adquirir(carta);
      if (!efectos.espacial()) return;
      for (const planta of plantas) efectos.actualizarPlanta(planta, vecinas(planta.celda));
    },
    ataque: planta => efectos?.ataque(planta) ?? planta.tipo.ataque ?? planta.tipo.area,
    multiplicadorMordida: planta => efectos?.multiplicadorMordida(planta) ?? 1,
    cerrarInvasion: () => efectos?.cerrarInvasion(plantas),
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
      actualizarVecindad(celda);
      rearme.set(clave(celda), (estado.tiempo ?? 0) + pala.rearme);
      estado.energia += energia;
      alRetirar?.(planta, true);
      return { planta, energia };
    },
    plantar(id, celda) {
      if (!colocable(id, celda)) return null;
      const precio = coste(id, celda);
      estado.energia -= precio;
      const planta = nacer(id, celda, Math.random() * 4, precio);
      planta.enfriamiento = Math.max(planta.enfriamiento, efectos?.descontar(celda) ?? 0);
      return planta;
    },
    candidatas(id) {
      if (!catalogo[id]?.comprable || central?.muerta || !permitido()) return [];
      const base = costeDe(catalogo[id], vivasDe(id), economia);
      if (!efectos?.hayReposiciones() && estado.energia < precio(base)) return [];
      const lista = new Map();
      for (const planta of plantas) {
        if (planta.muerta) continue;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const x = planta.celda.x + dx;
            const y = planta.celda.y + dy;
            if (tablero.contiene(x, y) && !tablero.ocupante(x, y)) lista.set(claveCelda(x, y), { x, y });
          }
        }
      }
      return [...lista.values()].filter(celda => estado.energia >= precio(base, celda)).sort((a, b) => a.y - b.y || a.x - b.x);
    },
    destruir(planta, porEnemigo = false) {
      if (planta.muerta) return;
      planta.muerta = true;
      planta.tiempoMuerte = 0;
      tablero.liberar(planta.celda.x, planta.celda.y);
      if (porEnemigo) efectos?.perdida(planta);
      actualizarVecindad(planta.celda);
    },
    actualizar(dt, reducido) {
      for (const [casilla, hasta] of rearme) {
        if (hasta <= (estado.tiempo ?? 0)) rearme.delete(casilla);
      }
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
