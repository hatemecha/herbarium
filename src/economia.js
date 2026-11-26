import { ECONOMIA } from './config.js';

// El coste mira las plantas vivas de ese tipo, no el histórico de compras.
export function costeDe(tipo, vivas, economia = ECONOMIA) {
  if (!tipo?.comprable) return 0;
  if (!economia.creciente) return tipo.coste;
  return tipo.coste + economia.incremento * Math.floor(vivas / economia.grupo);
}
