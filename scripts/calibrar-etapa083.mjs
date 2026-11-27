import { ECONOMIA, OLEADAS } from '../src/config.js';
import { correr } from '../tests/corrida.mjs';

const semillas = Array.from({ length: 16 }, (_, i) => i + 1);
const estrategias = ['concentracion', 'compacta', 'proteccion', 'diversificado', 'reactivo'];
const variantes = {
  elegida: {},
  fueraAtraccion: { espino: { atraccion: 0 } },
  radio3: { espino: { atraccion: 3 } },
  soloEscalon: { economia: { ...ECONOMIA, escalada: 0 } },
  sinCorazaFrontal: { oruga: { corazaFrontal: 0 } },
  hongoCorto: { area: { alcance: 1.75, intervalo: 1.8 } },
  enjambreMasBreve: { oleadas: { compresionEnjambre: 0.15, compensaViaje: 1 } },
  costePlano: { economia: { ...ECONOMIA, creciente: false } },
  ritmoAdaptativo: { oleadas: { adaptacion: { ...OLEADAS.adaptacion, activa: true } } },
};

for (const [variante, ajustes] of Object.entries(variantes)) {
  const informe = await correr({ semillas, estrategias, ajustes, horizonte: 1800 });
  console.log(JSON.stringify({ variante, informe }));
}
