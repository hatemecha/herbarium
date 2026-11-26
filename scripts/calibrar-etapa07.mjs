import { ECONOMIA } from '../src/config.js';
import { correr } from '../tests/corrida.mjs';

const semillas = Array.from({ length: 12 }, (_, i) => i + 1);
const estrategias = ['principiante', 'intermedio', 'soloCerbatanas', 'proteccion', 'area', 'ralentizacion', 'diversificado', 'especializado'];
const configuraciones = {
  final: {},
  espinoOriginal: { espino: { vida: 36, reflejo: 1 } },
  espino48: { espino: { vida: 48, reflejo: 2 } },
  espino60: { espino: { vida: 60, reflejo: 3 } },
  hongo3: { area: { dano: 3 } },
  hongoAmplio: { area: { alcance: 1.75 } },
  energiaRapida: { energia: 1.12 },
  costeFijo: { economia: { ...ECONOMIA, creciente: false } },
  masAmenaza: { oleadas: { lineal: 5, cuadratica: 1 } },
  gruposApretados: { oleadas: { grupoMax: 5, compensaViaje: 1, ventanaPorK: 3 } },
};

const resultados = {};
for (const [id, ajustes] of Object.entries(configuraciones)) {
  const informe = await correr({ semillas, estrategias, ajustes });
  resultados[id] = Object.fromEntries(Object.entries(informe).map(([nombre, { tiempo, censuradas }]) => [
    nombre, { medianaSegundos: Math.round(tiempo.p50), censuradas },
  ]));
}
console.log(JSON.stringify({ semillas, horizonte: 1200, configuraciones, resultados }, null, 2));
