// Escarabajo visto desde arriba. Cabeza con dos ojos (E), caparazón con tira central (D) y brillo (L).
// Códigos: S caparazón, L brillo, D sombra, k cabeza, E ojo, a antena, l pata, s cola.
export const MATRIZ = [
  '................',
  '....a......a....',
  '.....a....a.....',
  '......kkkk......',
  '.....kEkkEk.....',
  '..lSSSSSSSSSSl..',
  '..lSSLLLLLLSSl..',
  '..lSSDDDDDDSSl..',
  '.l.SSDDDDDDSS.l.',
  '...SSSSSSSSSS...',
  '..l.SSSSSSSS.l..',
  '.....SSSSSS.....',
  '......SSSS......',
  '.......ss.......',
  '................',
  '................',
];

export const CODIGOS = {
  S: 'caparazon',
  L: 'caparazonLuz',
  D: 'caparazonSombra',
  k: 'cabeza',
  E: 'ojo',
  a: 'patas',
  l: 'patas',
  s: 'caparazonSombra',
};

export const VARIANTES = [
  [],
  [[2, 6, '.'], [1, 6, 'l'], [13, 6, '.'], [14, 6, 'l']],
  [[1, 8, '.'], [2, 8, 'l'], [14, 8, '.'], [13, 8, 'l']],
  [[4, 1, '.'], [3, 1, 'a'], [11, 1, '.'], [12, 1, 'a']],
];

export const SECUENCIA = [
  { fotograma: 0, duracion: 0.14 },
  { fotograma: 1, duracion: 0.14 },
  { fotograma: 0, duracion: 0.14 },
  { fotograma: 2, duracion: 0.14 },
  { fotograma: 0, duracion: 0.14 },
  { fotograma: 3, duracion: 0.5 },
  { fotograma: 0, duracion: 0.2 },
];
