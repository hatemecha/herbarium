import { BALANCE, LUZ } from './config.js';
import * as madre from './sprites/planta.js';
import * as cerbatana from './sprites/cerbatana.js';
import * as campanilla from './sprites/campanilla.js';
import * as hongo from './sprites/hongo.js';
import * as espino from './sprites/espino.js';
import * as escarabajo from './sprites/escarabajo.js';
import * as pulgon from './sprites/pulgon.js';
import * as oruga from './sprites/oruga.js';

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
    coste: BALANCE.cerbatana.coste,
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
  espino: {
    id: 'espino',
    nombre: 'Espino',
    comprable: true,
    coste: BALANCE.espino.coste,
    vida: BALANCE.espino.vida,
    reflejo: BALANCE.espino.reflejo,
    arte: {
      matriz: espino.MATRIZ,
      codigos: espino.CODIGOS,
      variantes: espino.VARIANTES,
      secuencia: espino.SECUENCIA,
      nucleo: espino.NUCLEO,
    },
    propia: 0.32,
    resplandor: { radio: 6, alfa: 0.03, color: 'ambiental' },
    luz: {
      nucleo: { radio: 1.6, intensidad: 0.16 },
      radio: 16,
      intensidad: 0.1,
    },
  },
  campanilla: {
    id: 'campanilla',
    nombre: 'Campanilla',
    comprable: true,
    coste: BALANCE.campanilla.coste,
    vida: BALANCE.campanilla.vida,
    ralentiza: BALANCE.campanilla,
    arte: { matriz: campanilla.MATRIZ, codigos: campanilla.CODIGOS, variantes: campanilla.VARIANTES, secuencia: campanilla.SECUENCIA, nucleo: campanilla.NUCLEO },
    propia: 0.46,
    resplandor: { radio: 8, alfa: 0.08, color: 'campana' },
    luz: { nucleo: { radio: 2, intensidad: 0.24 }, radio: 16, intensidad: 0.1 },
  },
  hongo: {
    id: 'hongo',
    nombre: 'Hongo',
    comprable: true,
    coste: BALANCE.hongo.coste,
    vida: BALANCE.hongo.vida,
    area: BALANCE.hongo,
    arte: { matriz: hongo.MATRIZ, codigos: hongo.CODIGOS, variantes: hongo.VARIANTES, secuencia: hongo.SECUENCIA, nucleo: hongo.NUCLEO },
    propia: 0.46,
    resplandor: { radio: 8, alfa: 0.08, color: 'hongoLuz' },
    luz: { nucleo: { radio: 2, intensidad: 0.24 }, radio: 16, intensidad: 0.1 },
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
    amenaza: BALANCE.escarabajo.amenaza,
    locomocion: 'vuelo',
    sombra: 3,
    arte: {
      matriz: escarabajo.MATRIZ,
      codigos: escarabajo.CODIGOS,
      variantes: escarabajo.VARIANTES,
    },
  },
  pulgon: {
    id: 'pulgon',
    nombre: 'Pulgón alado',
    vida: BALANCE.pulgon.vida,
    velocidad: BALANCE.pulgon.velocidad,
    dano: BALANCE.pulgon.dano,
    intervalo: BALANCE.pulgon.intervalo,
    radio: BALANCE.pulgon.radio,
    amenaza: BALANCE.pulgon.amenaza,
    locomocion: 'vuelo',
    sombra: 2,
    arte: {
      matriz: pulgon.MATRIZ,
      codigos: pulgon.CODIGOS,
      variantes: pulgon.VARIANTES,
    },
  },
  oruga: {
    id: 'oruga',
    nombre: 'Oruga',
    vida: BALANCE.oruga.vida,
    velocidad: BALANCE.oruga.velocidad,
    preparacionAtaque: BALANCE.oruga.preparacionAtaque,
    dano: BALANCE.oruga.dano,
    intervalo: BALANCE.oruga.intervalo,
    radio: BALANCE.oruga.radio,
    amenaza: BALANCE.oruga.amenaza,
    locomocion: 'suelo',
    sombra: 4,
    arte: {
      matriz: oruga.MATRIZ,
      codigos: oruga.CODIGOS,
      variantes: oruga.VARIANTES,
    },
  },
};
