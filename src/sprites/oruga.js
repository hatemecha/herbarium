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
  '................',
  '...........dee..',
  '..ee..ee..eEko..',
  '.eEEEeEEEeEEkk..',
  '.dEEEgEEEgEEd...',
  '..ddldddlddd....',
  '...ll..ll..ll...',
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
  '.....ee.........',
  '...eeheE...dee..',
  '..eEEEEEe.eEko..',
  '..dEEgEEEdEEkk..',
  '...dldddddEEd...',
  '...ll..ll..ll...',
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
  '................',
  '.....ee.........',
  '....ehee...de...',
  '...eEEEEE.eEko..',
  '...dEEgEEEEkk...',
  '....dldddEEd....',
  '....ll.ll.ll....',
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
  '.....ee.........',
  '....ehee........',
  '...eEEEEEd.dee..',
  '...dEEgEEEEkk...',
  '....dlddddEkko..',
  '....ll.ll.ll....',
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
  E: 'oruga',
  e: 'orugaLuz',
  h: 'orugaBrillo',
  g: 'insectoIris',
  d: 'insectoSombra',
  k: 'cabeza',
  o: 'ojo',
  a: 'antena',
  l: 'patas',
};
