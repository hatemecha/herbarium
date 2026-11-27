export const TABLERO = {
  columnas: 11,
  filas: 11,
  celda: 16,
};

export const SPRITE = {
  lado: 16,
};

export const ENERGIA = {
  inicial: 0,
  porSegundo: 1,
};

export const SIMULACION = {
  paso: 1 / 60,
  tiempoMaximo: 0.1,
};

export const LUZ = {
  niveles: 6,
  levantarPenumbra: 0.06,
  nucleo: { radio: 3.2, intensidad: 1 },
  brillo: { radio: 15, intensidad: 0.5 },
  ambiente: { radio: 56, intensidad: 0.26 },
  organica: 0.07,
  pulso: { velocidad: 0.9, amplitud: 0.035 },
  impulso: { caida: 1.6 },
  resplandor: { nucleo: 0.16, ambiente: 0.04 },
  propia: 0.55,
};

export const BALANCE = {
  aparicionEscarabajo: 20,
  central: { vida: 30 },
  cerbatana: {
    vida: 12,
    alcance: 3,
    dano: 4,
    intervalo: 1,
    velocidadProyectil: 6,
    alcanceMaximo: 4.5,
    coste: 10,
  },
  espino: {
    vida: 42,
    coste: 10,
    reflejo: 2,
    atraccion: 2.25,
  },
  campanilla: { coste: 12, vida: 16, alcance: 2.5, reduccion: 0.4 },
  hongo: { coste: 16, vida: 16, alcance: 2, dano: 4, intervalo: 1.65 },
  escarabajo: {
    vida: 12,
    velocidad: 0.5,
    dano: 2,
    intervalo: 1,
    radio: 0.4,
    amenaza: 3,
    corazaEnVuelo: 1,
  },
  pulgon: {
    vida: 4,
    velocidad: 1.05,
    dano: 1,
    intervalo: 0.65,
    radio: 0.28,
    amenaza: 2,
    sobrevuela: true,
  },
  oruga: {
    vida: 28,
    velocidad: 0.28,
    preparacionAtaque: 0.45,
    danoSostenido: 2,
    corazaFrontal: 2,
    frenteMinimo: 0.65,
    trasMordidas: 2,
    dano: 3,
    intervalo: 1.25,
    radio: 0.42,
    amenaza: 8,
  },
  visual: {
    destello: 0.2,
    disparo: 0.25,
    retroceso: 0.12,
    desintegracion: 0.7,
    marchitez: 1.2,
    aterrizaje: 0.3,
    despegue: 0.25,
    mordisco: 0.2,
    esporas: 0.75,
  },
};

export const INSECTO = {
  altura: 3,
  balanceo: 0.9,
  antenas: { periodo: 1.6, duracion: 0.25 },
  sombra: { base: 0.12, porAltura: 0.06 },
  contorno: 0.18,
  destello: 0.9,
  empuje: 2,
  resplandor: { radio: 12, alfa: 0.12 },
};

export const PULGON = {
  altura: 2,
  balanceo: 0.45,
  aleteo: 0.04,
  marcha: { base: 0.94, variacion: 0.24 },
};

export const ORUGA = {
  ciclo: 0.36,
};

// `creciente: false` deja todos los costes en su base, para comparar economías.
export const ECONOMIA = {
  creciente: true,
  incremento: 2,
  grupo: 4,
  escalada: 6,
};

// Valores de experimentación. El tramo cuadrático llega hasta la oleada 12; después suma `continuacion` por oleada.
export const OLEADAS = {
  preparacionInicial: 20,
  preparacion: 15,
  aviso: 4,
  base: 12,
  lineal: 4,
  cuadratica: 0.7,
  cuadraticaHasta: 12,
  continuacion: 18,
  grupoMax: 4,
  sesgoDePatron: 0.5,
  compresionEnjambre: 0.3,
  compensaViaje: 0.8,
  ventanaBase: 18,
  ventanaPorK: 4,
  ventanaMax: 48,
  simultaneosBase: 6,
  simultaneosPorK: 3,
  simultaneosMax: 48,
  orugaDesde: 3,
  adaptacion: {
    activa: false,
    margen: 0.12,
    danoUmbral: 6,
    plantasUmbral: 2,
    rapidez: 0.45,
  },
};

export const FEEDBACK = {
  gesto: 0.36,
  oleada: 0.65,
  critico: 1 / 3,
  pausaCampana: 0.18,
};

export const MARCADORES = {
  velocidad: 5,
  desvanecimiento: 9,
  seleccion: { alfa: 0.75, resplandor: 0.05 },
  sobrevuelo: { alfa: 0.45, resplandor: 0.025 },
};

export const COLOCACION = {
  alfaCandidata: 0.16,
  alfaPuntero: 0.6,
  alfaFantasmaValido: 0.42,
  alfaFantasmaInvalido: 0.14,
  desvanecimiento: 8,
};

export const PARTICULAS = {
  maximo: 80,
  ambienteMaximo: 12,
  tasa: 2.6,
  vidaMin: 2.6,
  vidaMax: 4.8,
  rafaga: 2,
};
