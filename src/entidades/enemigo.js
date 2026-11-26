import { BALANCE, INSECTO } from '../config.js';
import { FOTOGRAMA, SECUENCIA_VUELO, DURACION_ALETEO } from '../sprites/escarabajo.js';

// Posición en unidades de casilla: la casilla i ocupa el intervalo [i, i+1). El centro visual es (x, y).
// Los temporizadores de `reloj`, `tiempoEnObjetivo`, `despegue` y `mordisco` solo gobiernan el dibujo.
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
    golpe: { x: 0, y: 0 },
    muerto: false,
    tiempoMuerte: 0,
    umbrales: null,
    reloj: desfase,
    tiempoEnObjetivo: 0,
    despegue: 0,
    mordisco: 0,
  };
}

export function estadoVisual(enemigo) {
  if (enemigo.muerto) return 'caido';
  if (enemigo.objetivo) {
    return enemigo.tiempoEnObjetivo < BALANCE.visual.aterrizaje ? 'aterrizaje' : 'alimentacion';
  }
  if (enemigo.despegue > 0) return 'despegue';
  return 'vuelo';
}

export function fotogramaEnemigo(enemigo, reducido) {
  switch (estadoVisual(enemigo)) {
    case 'vuelo':
      if (reducido) return FOTOGRAMA.vueloMedio;
      return SECUENCIA_VUELO[Math.floor(enemigo.reloj / DURACION_ALETEO) % SECUENCIA_VUELO.length];
    case 'despegue':
      return FOTOGRAMA.vueloAlto;
    case 'aterrizaje':
      return enemigo.tiempoEnObjetivo < BALANCE.visual.aterrizaje / 2 ? FOTOGRAMA.vueloBajo : FOTOGRAMA.aterrizaje;
    case 'alimentacion':
      if (enemigo.mordisco > 0) return FOTOGRAMA.alimentacion;
      if (!reducido && enemigo.reloj % INSECTO.antenas.periodo < INSECTO.antenas.duracion) return FOTOGRAMA.antenas;
      return FOTOGRAMA.posado;
    default:
      return FOTOGRAMA.posado;
  }
}

// Altura visual en píxeles lógicos. Solo mueve el sprite hacia arriba; la sombra queda en el suelo.
export function elevacion(enemigo, reducido) {
  switch (estadoVisual(enemigo)) {
    case 'vuelo': {
      const oscilacion = reducido ? 0 : Math.round(Math.sin((enemigo.reloj / INSECTO.balanceo) * Math.PI * 2));
      return INSECTO.altura + oscilacion;
    }
    case 'despegue':
      return Math.round((1 - enemigo.despegue / BALANCE.visual.despegue) * INSECTO.altura);
    case 'aterrizaje':
      return Math.round((1 - enemigo.tiempoEnObjetivo / BALANCE.visual.aterrizaje) * INSECTO.altura);
    default:
      return 0;
  }
}
