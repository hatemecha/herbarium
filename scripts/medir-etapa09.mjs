import { ESTRATEGIAS } from '../src/estrategias.js';
import { simularPartida } from '../src/simular.js';
import { RECOMPENSAS } from '../src/config.js';
import { percentil } from '../src/metricas.js';

const corridas = Number(process.argv[2] ?? 100);
const semillaBase = Number(process.argv[3] ?? 94057);
const sumar = (datos, clave) => datos.reduce((total, partida) => total + partida[clave], 0);
const min = 60;
const seleccion = process.argv[4] ?? 'todas';
const experimental = process.argv[5] === 'orientaciones';
const estres = process.argv[5] === 'estres';
const horizonte = process.argv[6] === undefined && estres ? 3680 : Number(process.argv[6] ?? 30) * min;

function sintetica(sentido) {
  return ({ pregunta, ritual }) => [...pregunta.respuestas].sort((a, b) => {
    const direccion = sentido === 'alternante' ? (pregunta.id.endsWith('-01') || ritual % 2 === 0 ? -1 : 1) : sentido;
    return direccion * ((b.pesos[pregunta.familia] ?? 0) - (a.pesos[pregunta.familia] ?? 0));
  })[0].id;
}

const politicas = [
  ['compacta', ESTRATEGIAS.compacta, sintetica(-1)],
  ['cerbatanas', ESTRATEGIAS.soloCerbatanas, sintetica(1)],
  ['mixta', ESTRATEGIAS.reactivo, sintetica('alternante')],
  ['especializada', ESTRATEGIAS.especializado],
  ['pala', ctx => {
    const danada = ctx.jardin.plantas.find(p => p.tipo.comprable && !p.muerta && p.vida < .36 * p.vidaMax);
    return danada && ctx.t > 160 ? { retirar: danada.celda } : ESTRATEGIAS.reactivo(ctx);
  }, sintetica('alternante')],
];

for (const [politica, estrategia, responderTarot] of politicas) {
  if (seleccion !== 'todas' && seleccion !== politica) continue;
  const modos = estres ? ['estres'] : experimental ? ['derechas', 'invertidas', 'mezcla'] : ['base', 'mezcla'];
  for (const modo of modos) {
    const tarot = modo !== 'base';
    const invertirTarot = modo === 'derechas' ? false : modo === 'invertidas' ? true : undefined;
    const partidas = Array.from({ length: corridas }, (_, i) => simularPartida({
      semilla: semillaBase + i,
      estrategia,
      horizonte,
      cada: estres ? 2 : undefined,
      ajustes: {
        responderTarot: estres ? undefined : responderTarot,
        invertirTarot,
        oleadas: estres ? { base: 23, lineal: 14, cuadratica: 1, continuacion: 18 } : undefined,
        recompensas: { ...RECOMPENSAS, tarot, limiteTarot: estres ? 1 : RECOMPENSAS.limiteTarot },
      },
    }));
    const cartas = partidas.flatMap(p => p.arcanos);
    const mediana = percentil(partidas.map(p => p.tiempoActivo), .5);
    console.log(JSON.stringify({
      politica, modo, horizonte, corridas, semillaBase, mediana,
      p15: partidas.filter(p => p.tiempo >= 15 * min).length,
      p30: partidas.filter(p => p.tiempo >= 30 * min).length,
      p60: partidas.filter(p => p.tiempo >= 60 * min).length,
      invasiones: sumar(partidas, 'oleadasCompletas') / corridas,
      energiaGenerada: sumar(partidas, 'energiaGenerada') / corridas,
      dano: sumar(partidas, 'danoAplicado') / corridas,
      retiradas: sumar(partidas, 'retiradas'),
      cartas: cartas.length,
      invertidas: cartas.filter(c => c.invertida).length,
      duplicados: cartas.filter(c => c.nivel > 1).length,
      preguntas: new Set(cartas.map(c => c.pregunta)).size,
      nivelMaximo: cartas.reduce((maximo, carta) => Math.max(maximo, carta.nivel), 0),
      frecuencia: Object.fromEntries([...new Set(cartas.map(c => c.id))].sort((a, b) => a - b)
        .map(id => [id, cartas.filter(c => c.id === id).length])),
    }));
  }
}
