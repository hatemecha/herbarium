// Planta ofensiva. El bulbo (filas 0-4) cambia según la dirección de disparo; el resto es fijo.
// Códigos: b/B bulbo (sombra/luz), o/O boca (luz/brillo), d/g/G/h hojas, t tallo, m tierra.
export const DIRECCIONES = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

const CABEZAS = {
  N: ['   oO  ', '  bBBb ', ' bBBBb ', '  bBb  ', '   t   '],
  NE: ['    oO ', '  bBBbO', ' bBBBb ', '  bBb  ', '   t   '],
  E: ['       ', '  bBBbo', ' bBBBbO', '  bBb  ', '   t   '],
  SE: ['       ', '  bBBb ', ' bBBBb ', '  bBbo ', '   tO  '],
  S: ['       ', '  bBBb ', ' bBBBb ', '  bOb  ', '   t   '],
};

const espejo = (filas) => filas.map((fila) => [...fila].reverse().join(''));

const CABEZA_POR_DIRECCION = {
  N: CABEZAS.N,
  NE: CABEZAS.NE,
  E: CABEZAS.E,
  SE: CABEZAS.SE,
  S: CABEZAS.S,
  SW: espejo(CABEZAS.SE),
  W: espejo(CABEZAS.E),
  NW: espejo(CABEZAS.NE),
};

const RESTO = [
  '.......gtG......',
  '....hGdgtGh.....',
  '.....dgt........',
  '......tt........',
  '.......tgh......',
  '.......tgd......',
  '......tt........',
  '.......t........',
  '.......tt.......',
  '....mmmttmmm....',
  '...mmmmmmmmmm...',
];

export function matrizPara(indiceDireccion) {
  const cabeza = CABEZA_POR_DIRECCION[DIRECCIONES[indiceDireccion]];
  const filas = cabeza.map((fila) => `.....${fila}....`);
  return [...filas, ...RESTO].map((fila) => fila.padEnd(16, '.'));
}

export const CODIGOS = {
  d: 'hojaSombra',
  g: 'hoja',
  G: 'hojaLuz',
  h: 'hojaBrillo',
  t: 'tallo',
  m: 'tierra',
  b: 'bulboSombra',
  B: 'bulbo',
  o: 'boca',
  O: 'bocaBrillo',
};

export const NUCLEO = { x: 8, y: 2 };

export const VARIANTES = [
  [],
  [[10, 6, '.'], [10, 5, 'h']],
  [[6, 8, '.'], [8, 8, 't']],
  { transformar: 'disparo' },
  { transformar: 'boca' },
];

export const TRANSFORMACIONES = {
  disparo(filas) {
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < filas[y].length; x++) {
        if (filas[y][x] === 'B') filas[y][x] = 'O';
        else if (filas[y][x] === 'b') filas[y][x] = 'B';
      }
    }
  },
  boca(filas) {
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < filas[y].length; x++) {
        if (filas[y][x] === 'o') filas[y][x] = 'O';
      }
    }
  },
};

export const SECUENCIA = [
  { fotograma: 0, duracion: 1.6 },
  { fotograma: 1, duracion: 0.7 },
  { fotograma: 0, duracion: 1.0 },
  { fotograma: 2, duracion: 0.9 },
  { fotograma: 0, duracion: 1.3 },
  { fotograma: 4, duracion: 0.8 },
  { fotograma: 0, duracion: 0.9 },
  { fotograma: 1, duracion: 0.6 },
];
