// Matriz 16×16 dibujada a mano. '.' es transparente.
// Pétalos: P/p (luz/sombra). Núcleo: n/N. Hojas: G/g/d (luz/base/sombra), h = brillo. Tallo: t. Tierra: m.
export const MATRIZ = [
  '................',
  '.......PP.......',
  '.....PPnnPP.....',
  '....PnNNNnPp....',
  '....pPnNNnPp....',
  '.....pPPPPPp....',
  '......gGGg......',
  '...dgG.tt.hh....',
  '..dgGG.tt.hhG...',
  '...dgG.tt.hd....',
  '.....dGtt.......',
  '.......t........',
  '......tt........',
  '.......tt.......',
  '....mmmttmmm....',
  '...mmmmmmmmmm...',
];

export const CODIGOS = {
  d: 'hojaSombra',
  g: 'hoja',
  G: 'hojaLuz',
  h: 'hojaBrillo',
  t: 'tallo',
  m: 'tierra',
  p: 'petaloSombra',
  P: 'petalo',
  n: 'nucleo',
  N: 'nucleoBrillo',
};

// Centro del núcleo luminoso dentro del sprite, en coordenadas de píxel (bordes entre celdas).
export const NUCLEO = { x: 8, y: 4 };

// Parches sobre MATRIZ. El fotograma 0 es la forma de reposo.
export const VARIANTES = [
  [],
  [[3, 6, 'd']],
  [[7, 3, 'n'], [8, 3, 'n']],
  [[12, 8, '.'], [12, 7, 'G']],
  [[7, 11, '.'], [6, 11, 't']],
];

// Ritmo irregular a propósito: la planta respira sin repetir un compás mecánico.
export const SECUENCIA = [
  { fotograma: 0, duracion: 1.8 },
  { fotograma: 1, duracion: 0.6 },
  { fotograma: 0, duracion: 0.9 },
  { fotograma: 2, duracion: 0.9 },
  { fotograma: 0, duracion: 1.4 },
  { fotograma: 3, duracion: 0.7 },
  { fotograma: 0, duracion: 1.1 },
  { fotograma: 4, duracion: 0.8 },
];
