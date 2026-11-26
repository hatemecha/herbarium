import { BALANCE, LUZ } from './config.js';
import * as madre from './sprites/planta.js';
import * as cerbatana from './sprites/cerbatana.js';
import * as escarabajo from './sprites/escarabajo.js';

// Cada tipo describe su arte, su coste, su vida, su ataque y cómo ilumina.
export const PLANTAS = {
  central: {
    id: 'central',
    nombre: 'Planta central',
    comprable: false,
    coste: 0,
    vida: BALANCE.central.vida,
    arte: {
      matriz: madre.MATRIZ,
      codigos: madre.CODIGOS,
      variantes: madre.VARIANTES,
      secuencia: madre.SECUENCIA,
      nucleo: madre.NUCLEO,
    },
    propia: LUZ.propia,
    resplandor: null,
    luz: null,
  },
  cerbatana: {
    id: 'cerbatana',
    nombre: 'Cerbatana',
    comprable: true,
    coste: 10,
    vida: BALANCE.cerbatana.vida,
    ataque: BALANCE.cerbatana,
    arte: {
      matrizPara: cerbatana.matrizPara,
      codigos: cerbatana.CODIGOS,
      variantes: cerbatana.VARIANTES,
      transformaciones: cerbatana.TRANSFORMACIONES,
      secuencia: cerbatana.SECUENCIA,
      nucleo: cerbatana.NUCLEO,
    },
    propia: 0.5,
    resplandor: { radio: 9, alfa: 0.05, color: 'ambiental' },
    luz: {
      nucleo: { radio: 2.5, intensidad: 0.3 },
      radio: 26,
      intensidad: 0.2,
    },
  },
};

export const COMPRABLES = Object.values(PLANTAS).filter((tipo) => tipo.comprable);

export const ENEMIGOS = {
  escarabajo: {
    id: 'escarabajo',
    nombre: 'Escarabajo',
    vida: BALANCE.escarabajo.vida,
    velocidad: BALANCE.escarabajo.velocidad,
    dano: BALANCE.escarabajo.dano,
    intervalo: BALANCE.escarabajo.intervalo,
    radio: BALANCE.escarabajo.radio,
    arte: {
      matriz: escarabajo.MATRIZ,
      codigos: escarabajo.CODIGOS,
      variantes: escarabajo.VARIANTES,
    },
  },
};
