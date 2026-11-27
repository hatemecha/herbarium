import { ECONOMIA } from './config.js';

// El coste mira las plantas vivas de ese tipo, no el histórico de compras.
export function costeDe(tipo, vivas, economia = ECONOMIA) {
  if (!tipo?.comprable) return 0;
  if (!economia.creciente) return tipo.coste;
  const tramo = Math.floor(vivas / economia.grupo);
  return tipo.coste + economia.incremento * tramo + (economia.escalada ?? 0) * tramo * (tramo - 1);
}
