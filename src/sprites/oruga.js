// Oruga de perfil, pegada al suelo. El cuerpo es una cadena de segmentos que se estira y se junta.
// No tiene alas. La mordida baja la cabeza un píxel.

const EXTENDIDA = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '..........a.....',
  '.........ko.....',
  '..dEe.dEe.dEek..',
  '.dEEg.dEEg.kkd..',
  '..ddd.ddd.ddd...',
  '...l...l...l....',
  '................',
  '................',
  '................',
];

const MEDIA = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.........a......',
  '........ko......',
  '..dEedEedEeek...',
  '.dEEgdEEgEkkd...',
  '..dddddddddd....',
  '...l..l..l..l...',
  '................',
  '................',
  '................',
];

const CONTRAIDA = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '........a.......',
  '.......ko.......',
  '..dEegdEegEek...',
  '.dEEEgEEEEkkd...',
  '..dddddddddd....',
  '..l.l.l.l.l.l...',
  '................',
  '................',
  '................',
  '................',
];

const MORDIDA = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '........a.......',
  '..dEegdEegEek...',
  '.dEEEgEEEEkkd...',
  '..ddddddddddo...',
  '..l.l.l.l.l.l...',
  '................',
  '................',
  '................',
  '................',
];

const CUADROS = [EXTENDIDA, MEDIA, CONTRAIDA, MORDIDA];

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
  extendida: 0,
  media: 1,
  contraida: 2,
  mordida: 3,
};

export const MATRIZ = MEDIA;
export const VARIANTES = CUADROS.map((cuadro) => diferencias(MEDIA, cuadro));

export const CODIGOS = {
  E: 'insecto',
  e: 'insectoLuz',
  g: 'insectoIris',
  d: 'insectoSombra',
  k: 'cabeza',
  o: 'ojo',
  a: 'antena',
  l: 'patas',
};
