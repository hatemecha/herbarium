import { crearAnimacion } from '../animacion.js';

// Posición en unidades de casilla: la casilla i ocupa el intervalo [i, i+1). El centro visual es (x, y).
export function crearEnemigo({ x, y, tipo, desfase = 0 }) {
  return {
    tipo,
    x,
    y,
    vx: 0,
    vy: 0,
    mirada: 1,
    vida: tipo.vida,
    vidaMax: tipo.vida,
    objetivo: null,
    cooldown: 0,
    destello: 0,
    muerto: false,
    tiempoMuerte: 0,
    umbrales: null,
    animacion: crearAnimacion({ secuencia: tipo.arte.secuencia, desfase }),
  };
}
