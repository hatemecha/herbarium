import { BALANCE, INSECTO, ORUGA, PULGON } from '../config.js';
import { DURACION_ALETEO, FOTOGRAMA, SECUENCIA_VUELO } from '../sprites/escarabajo.js';
import { FOTOGRAMA as FOTOGRAMA_ORUGA } from '../sprites/oruga.js';
import { FOTOGRAMA as FOTOGRAMA_PULGON } from '../sprites/pulgon.js';

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
  if (enemigo.tipo.locomocion === 'suelo') return enemigo.objetivo ? 'alimentacion' : 'avance';
  if (enemigo.objetivo) {
    return enemigo.tiempoEnObjetivo < BALANCE.visual.aterrizaje ? 'aterrizaje' : 'alimentacion';
  }
  if (enemigo.despegue > 0) return 'despegue';
  return 'vuelo';
}

function fotogramaEscarabajo(enemigo, reducido) {
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

function fotogramaPulgon(enemigo, reducido) {
  switch (estadoVisual(enemigo)) {
    case 'vuelo':
    case 'despegue':
      if (reducido || estadoVisual(enemigo) === 'despegue') return FOTOGRAMA_PULGON.vueloAlto;
      return Math.floor(enemigo.reloj / PULGON.aleteo) % 2 === 0 ? FOTOGRAMA_PULGON.vueloAlto : FOTOGRAMA_PULGON.vueloBajo;
    case 'aterrizaje':
      return FOTOGRAMA_PULGON.vueloBajo;
    case 'alimentacion':
      return enemigo.mordisco > 0 ? FOTOGRAMA_PULGON.alimentacion : FOTOGRAMA_PULGON.posado;
    default:
      return FOTOGRAMA_PULGON.posado;
  }
}

function fotogramaOruga(enemigo, reducido) {
  const estado = estadoVisual(enemigo);
  if (estado === 'alimentacion') return enemigo.mordisco > 0 ? FOTOGRAMA_ORUGA.mordida : FOTOGRAMA_ORUGA.contraida;
  if (estado === 'caido' || reducido) return FOTOGRAMA_ORUGA.media;
  const ciclo = [FOTOGRAMA_ORUGA.extendida, FOTOGRAMA_ORUGA.media, FOTOGRAMA_ORUGA.contraida, FOTOGRAMA_ORUGA.media];
  return ciclo[Math.floor(enemigo.reloj / ORUGA.ciclo) % ciclo.length];
}

export function fotogramaEnemigo(enemigo, reducido) {
  if (enemigo.tipo.id === 'pulgon') return fotogramaPulgon(enemigo, reducido);
  if (enemigo.tipo.id === 'oruga') return fotogramaOruga(enemigo, reducido);
  return fotogramaEscarabajo(enemigo, reducido);
}

// Altura visual en píxeles lógicos. Solo mueve el sprite hacia arriba; la sombra queda en el suelo.
export function elevacion(enemigo, reducido) {
  if (enemigo.tipo.locomocion === 'suelo') return 0;
  const altura = enemigo.tipo.id === 'pulgon' ? PULGON.altura : INSECTO.altura;
  const balanceo = enemigo.tipo.id === 'pulgon' ? PULGON.balanceo : INSECTO.balanceo;
  switch (estadoVisual(enemigo)) {
    case 'vuelo': {
      const oscilacion = reducido ? 0 : Math.round(Math.sin((enemigo.reloj / balanceo) * Math.PI * 2));
      return altura + oscilacion;
    }
    case 'despegue':
      return Math.round((1 - enemigo.despegue / BALANCE.visual.despegue) * altura);
    case 'aterrizaje':
      return Math.round((1 - enemigo.tiempoEnObjetivo / BALANCE.visual.aterrizaje) * altura);
    default:
      return 0;
  }
}
