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

export const ESCALA = {
  aprovechamientoMinimo: 0.8,
};

export const LUZ = {
  niveles: 6,
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
  },
  escarabajo: {
    vida: 12,
    velocidad: 0.5,
    dano: 2,
    intervalo: 1,
    radio: 0.4,
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
  maximo: 12,
  tasa: 0.35,
  vidaMin: 2.6,
  vidaMax: 4.8,
  rafaga: 2,
};
