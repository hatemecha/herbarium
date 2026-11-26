import { BALANCE } from '../src/config.js';
import { ENEMIGOS, PLANTAS } from '../src/catalogo.js';
import { crearTablero } from '../src/tablero.js';
import { crearJardin } from '../src/jardin.js';
import { crearCombate } from '../src/combate.js';

// Simulación determinista de una entrada de escarabajo contra cerbatanas colocadas a un tiempo dado.
// Las cerbatanas se siembran sin coste: el coste y la energía no entran en el escenario.
const DT = 1 / 60;

export function correr({ plantas = [], entrada, aparicion = BALANCE.aparicionEscarabajo, tMax = 90 }) {
  const tablero = crearTablero();
  const jardin = crearJardin({ tablero, estado: { energia: Infinity }, catalogo: PLANTAS, frames: {} });
  jardin.sembrar('central', tablero.centro);
  const combate = crearCombate({
    tablero,
    jardin,
    tipoEnemigo: ENEMIGOS.escarabajo,
    aparicion: Infinity,
    aleatorio: () => 0.5,
  });
  const pendientes = [...plantas].sort((a, b) => a.t - b.t);
  let enemigo = null;
  let mordidas = 0;
  let disparos = 0;
  let tMuerte = null;
  let tDerrota = null;

  for (let i = 0; i <= Math.round(tMax / DT); i++) {
    const t = i * DT;
    while (pendientes.length && pendientes[0].t <= t + 1e-9) {
      const { x, y } = pendientes.shift();
      jardin.sembrar('cerbatana', { x, y });
    }
    if (!enemigo && t >= aparicion) enemigo = combate.aparecerEn(entrada.x, entrada.y);
    combate.actualizar(DT);
    for (const ev of combate.eventos()) {
      if (ev.tipo === 'mordida') mordidas++;
      if (ev.tipo === 'disparo') disparos++;
    }
    if (enemigo?.muerto && tMuerte === null) tMuerte = t;
    if (combate.derrota()) {
      tDerrota = t;
      break;
    }
  }

  return {
    derrota: combate.derrota(),
    tDerrota,
    vidaCentral: jardin.central.vida,
    mordidas,
    disparos,
    tMuerte,
    enemigoVivo: Boolean(enemigo) && !enemigo.muerto,
  };
}
