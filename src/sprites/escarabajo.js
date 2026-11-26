// Escarabajo de perfil, mirando a la derecha. El espejo horizontal lo gira hacia la izquierda.
// Caparazón con contorno oscuro (d), luz (e) y brillo irisado (h); cabeza (k) con ojo (o); antenas (a); patas (l).
// Membrana del ala traslúcida: masa continua (w) con filo de luz (W).
// Reposo y patas en el cuadro base; el resto son variantes por parches sobre MATRIZ.

const POSADO = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.............aa.',
  '....deeed...aa..',
  '..deheEged.dkk..',
  '..deEEggeEdkko..',
  '..dEEEgEEEdkkk..',
  '...ddddddddkd...',
  '...ll..ll..ll...',
  '..ll..ll..ll....',
  '................',
  '................',
];

function sobreponer(base, capa) {
  return base.map((fila, y) => [...fila].map((c, x) => (c === '.' ? capa[y]?.[x] ?? '.' : c)).join(''));
}

const ALA_ALTO = [
  '................',
  '................',
  '...WWW..........',
  '..WwwwW.........',
  '..wwwwwW........',
  '...wwwwwW.......',
  '....wwwwwW......',
  '......wwww......',
  '.........w......',
];

const ALA_MEDIO = [
  '................',
  '................',
  '................',
  '................',
  '..WWWW..........',
  '..wwwwWW........',
  '...wwwwwWW......',
  '.....wwwww......',
  '.........w......',
];

const ALA_BAJO = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.WWWW...........',
  'WwwwwWW.........',
  'wwwwwwwwwW......',
  '..wwwwwwww......',
];

const ATERRIZAJE = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.............aa.',
  '....deeed...aa..',
  '..deheEged.dkk..',
  '..deEEggeEdkko..',
  '..dEEEgEEEdkkk..',
  '...ddddddddkd...',
  '..ll..ll...ll...',
  '..l..ll.....ll..',
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
  '....deeed....aa.',
  '..deheEged..aa..',
  '..deEEggeEd.kk..',
  '..dEEEgEEEdkko..',
  '...ddddddddkkd..',
  '...ll..ll..ll...',
  '..ll..ll..ll....',
  '................',
  '................',
];

const ANTENAS_CAIDAS = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '....deeed.....a.',
  '..deheEged.aaka.',
  '..deEEggeEdkko..',
  '..dEEEgEEEdkkk..',
  '...ddddddddkd...',
  '...ll..ll..ll...',
  '..ll..ll..ll....',
  '................',
  '................',
];

const CUADROS = [
  POSADO,
  sobreponer(POSADO, ALA_ALTO),
  sobreponer(POSADO, ALA_MEDIO),
  sobreponer(POSADO, ALA_BAJO),
  ATERRIZAJE,
  ALIMENTACION,
  ANTENAS_CAIDAS,
];

// Índice de cada cuadro en VARIANTES. Los nombres viven aquí para que la entidad no dependa de números sueltos.
export const FOTOGRAMA = {
  posado: 0,
  vueloAlto: 1,
  vueloMedio: 2,
  vueloBajo: 3,
  aterrizaje: 4,
  alimentacion: 5,
  antenas: 6,
};

export const MATRIZ = POSADO;

export const CODIGOS = {
  E: 'insecto',
  e: 'insectoLuz',
  g: 'insectoIris',
  d: 'insectoSombra',
  h: 'insectoBrillo',
  k: 'cabeza',
  o: 'ojo',
  a: 'antena',
  l: 'patas',
  w: 'ala',
  W: 'alaBorde',
};

function diferencias(base, filas) {
  const parches = [];
  filas.forEach((fila, y) =>
    [...fila].forEach((codigo, x) => {
      if (codigo !== base[y][x]) parches.push([x, y, codigo]);
    }),
  );
  return parches;
}

export const VARIANTES = CUADROS.map((cuadro) => diferencias(POSADO, cuadro));

// Aleteo en ciclo corto. Los tiempos de aterrizaje, despegue y mordida viven en BALANCE.visual.
export const SECUENCIA_VUELO = [
  FOTOGRAMA.vueloAlto,
  FOTOGRAMA.vueloMedio,
  FOTOGRAMA.vueloBajo,
  FOTOGRAMA.vueloMedio,
];
export const DURACION_ALETEO = 0.05;
