import { ENERGIA, LUZ } from './config.js';

export function crearEstado() {
  return {
    energia: ENERGIA.inicial,
    tiempo: 0,
    impulso: 0,
  };
}

// Tras la derrota la energía no crece, pero la luz y el tiempo visual siguen para que la central se apague sin corte.
export function apagar(estado, dt) {
  estado.tiempo += dt;
  estado.impulso = Math.max(0, estado.impulso - dt * LUZ.impulso.caida);
}

// Devuelve true cuando se completa una unidad de energía.
export function avanzar(estado, dt) {
  estado.tiempo += dt;
  estado.impulso = Math.max(0, estado.impulso - dt * LUZ.impulso.caida);
  const antes = Math.floor(estado.energia);
  estado.energia += ENERGIA.porSegundo * dt;
  const genero = Math.floor(estado.energia) > antes;
  if (genero) estado.impulso = 1;
  return genero;
}
