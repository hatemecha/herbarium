// Espino: mata baja, de frente, con púas. La luz la define el catálogo, más tenue que la cerbatana.
// d/g/G hojas, h brillo escaso, t tallo, m tierra. Las púas son hojas en sombra que salen del contorno.

const REPOSO = [
  '................',
  '................',
  '................',
  '......d.d.......',
  '.....d.g.d......',
  '....dg.G.gd.....',
  '...d.GdhdG.d....',
  '....dGGttGGd....',
  '.....dgttgd.....',
  '......dtt.d.....',
  '.......ttd......',
  '......tt........',
  '.......tt.......',
  '....mmmttmmm....',
  '...mmmmmmmmmm...',
  '................',
];

export const MATRIZ = REPOSO;

export const CODIGOS = {
  d: 'hojaSombra',
  g: 'hoja',
  G: 'hojaLuz',
  h: 'hojaBrillo',
  t: 'tallo',
  m: 'tierra',
};

export const NUCLEO = { x: 8, y: 7 };

export const VARIANTES = [
  [],
  [[3, 5, '.'], [2, 6, 'd']],
  [[12, 5, '.'], [13, 6, 'd']],
  [[6, 3, '.'], [6, 4, 'd']],
];

export const SECUENCIA = [
  { fotograma: 0, duracion: 1.6 },
  { fotograma: 1, duracion: 0.45 },
  { fotograma: 0, duracion: 1.1 },
  { fotograma: 2, duracion: 0.4 },
  { fotograma: 0, duracion: 1.4 },
  { fotograma: 3, duracion: 0.35 },
];
