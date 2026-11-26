// Pulgón alado, de perfil y más chico que el escarabajo. El cuerpo cabe en unos 6 px.
// Alas cortas y altas: el aleteo es de dos tiempos, no el ciclo de tres alturas del escarabajo.

const POSADO = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.........a......',
  '........ak......',
  '.......dkko.....',
  '......deEkd.....',
  '.......ddd.l....',
  '........l..l....',
  '................',
  '................',
  '................',
];

const VUELO_ALTO = [
  '................',
  '................',
  '................',
  '.......WW.......',
  '......WwwW......',
  '.......WW.......',
  '................',
  '.........a......',
  '........ak......',
  '.......dkko.....',
  '......deEkd.....',
  '.......ddd.l....',
  '........l..l....',
  '................',
  '................',
  '................',
];

const VUELO_BAJO = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '......WWWW......',
  '.....WwwwwW.....',
  '.........a......',
  '........ak......',
  '.......dkko.....',
  '......deEkd.....',
  '.......ddd.l....',
  '........l..l....',
  '................',
  '................',
  '................',
];

const ALIMENTACION = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.........a......',
  '........ak......',
  '.......dkko.....',
  '......deEkd.l...',
  '.......ddd.l....',
  '........l..l....',
  '................',
  '................',
];

const CUADROS = [POSADO, VUELO_ALTO, VUELO_BAJO, ALIMENTACION];

function diferencias(base, filas) {
  const parches = [];
  filas.forEach((fila, y) =>
    [...fila].forEach((codigo, x) => {
      if (codigo !== base[y][x]) parches.push([x, y, codigo]);
    }),
  );
  return parches;
}

export const FOTOGRAMA = {
  posado: 0,
  vueloAlto: 1,
  vueloBajo: 2,
  alimentacion: 3,
};

export const MATRIZ = POSADO;
export const VARIANTES = CUADROS.map((cuadro) => diferencias(POSADO, cuadro));

export const CODIGOS = {
  E: 'insecto',
  e: 'insectoLuz',
  d: 'insectoSombra',
  k: 'cabeza',
  o: 'ojo',
  a: 'antena',
  l: 'patas',
  w: 'ala',
  W: 'alaBorde',
};
