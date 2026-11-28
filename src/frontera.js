import { DISTANCIA_ENTRADA } from './config.js';

export function frenteVivo(tablero, angulo) {
  const cx = tablero.centro.x + 0.5;
  const cy = tablero.centro.y + 0.5;
  const ux = Math.cos(angulo);
  const uy = Math.sin(angulo);
  const radio = DISTANCIA_ENTRADA;
  let extremo = radio;
  for (const planta of tablero.ocupantes()) {
    if (planta.muerta) continue;
    const dx = planta.celda.x - tablero.centro.x;
    const dy = planta.celda.y - tablero.centro.y;
    const perpendicular = dx * uy - dy * ux;
    if (Math.abs(perpendicular) >= radio) continue;
    const proyeccion = dx * ux + dy * uy;
    extremo = Math.max(extremo, proyeccion + Math.sqrt(radio ** 2 - perpendicular ** 2));
  }
  return { x: cx + ux * extremo, y: cy + uy * extremo };
}

// La cobertura de simulación se mide a dos casillas del nacimiento, sobre la ruta radial.
export function muestrearFrente(tablero) {
  return Array.from({ length: 24 }, (_, i) => {
    const angulo = i * Math.PI / 12;
    const { x, y } = frenteVivo(tablero, angulo);
    return { x: x - 0.5 - 2 * Math.cos(angulo), y: y - 0.5 - 2 * Math.sin(angulo) };
  });
}
