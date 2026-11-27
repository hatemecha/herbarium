import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { availableParallelism } from 'node:os';
import { fileURLToPath } from 'node:url';
import { ESTRATEGIAS } from '../src/estrategias.js';
import { percentil } from '../src/metricas.js';
import { simularPartida } from '../src/simular.js';

if (!isMainThread) {
  const resultados = workerData.tareas.map((tarea) => ({
    ...simularPartida({
      semilla: tarea.semilla,
      horizonte: tarea.horizonte,
      estrategia: ESTRATEGIAS[tarea.estrategia],
      ajustes: tarea.ajustes,
    }),
    estrategia: tarea.estrategia,
  }));
  parentPort.postMessage(resultados);
}

function resumir(partidas) {
  const tiempos = partidas.map((partida) => partida.tiempo);
  const oleadas = partidas.map((partida) => partida.oleada);
  const censuradas = partidas.filter((partida) => partida.sobrevivio).length;
  const composicion = {};
  for (const partida of partidas) {
    for (const oleada of partida.historial) {
      const clave = oleada.patron;
      const item = composicion[clave] ?? { n: 0, duracion: 0, dano: 0 };
      item.n += 1;
      item.duracion += oleada.duracion;
      item.dano += oleada.danoCentral;
      composicion[clave] = item;
    }
  }
  for (const item of Object.values(composicion)) {
    item.duracionMedia = item.duracion / item.n;
    item.danoMedio = item.dano / item.n;
  }
  const evolucion = {};
  for (const partida of partidas) {
    for (const corte of partida.evolucion) (evolucion[corte.t] ??= []).push(corte);
  }
  const mediana = (clave) => percentil(partidas.map((partida) => partida[clave]), 0.5);
  const ratio = (num, den) => percentil(partidas.filter((p) => p[den] > 0).map((p) => p[num] / p[den]), 0.5);
  return {
    n: partidas.length,
    derrotas: partidas.length - censuradas,
    evolucion: Object.fromEntries(Object.entries(evolucion).map(([t, cortes]) => [t, {
      n: cortes.length,
      ...Object.fromEntries(['energia', 'vida', 'plantas', 'bajas', 'enemigos', 'oleada', 'dps']
        .map((clave) => [clave, percentil(cortes.map((corte) => corte[clave]), 0.5)])),
    }])),
    combate: {
      atracciones: mediana('atracciones'),
      coraza: mediana('danoBloqueado'),
      disparosPerdidos: mediana('disparosPerdidos'),
      proporcionImpactos: ratio('impactosCerbatana', 'disparos'),
      blancosPorPulso: ratio('impactosHongo', 'pulsosHongo'),
      danoPorEnergia: ratio('danoAplicado', 'energiaGastada'),
      dpsEfectivo: ratio('danoAplicado', 'tiempo'),
    },
    censuradas,
    tiempo: {
      p10: percentil(tiempos, 0.1),
      p50: percentil(tiempos, 0.5),
      p90: percentil(tiempos, 0.9),
    },
    oleada: {
      p10: percentil(oleadas, 0.1),
      p50: percentil(oleadas, 0.5),
      p90: percentil(oleadas, 0.9),
    },
    danoCentral: percentil(partidas.map((partida) => partida.danoCentral), 0.5),
    compras: Object.fromEntries(Object.keys(partidas[0].compras).map((id) => [
      id, percentil(partidas.map((partida) => partida.compras[id]), 0.5),
    ])),
    danoPorPlanta: Object.fromEntries(Object.keys(partidas[0].danoPorPlanta).map((id) => [
      id, percentil(partidas.map((partida) => partida.danoPorPlanta[id]), 0.5),
    ])),
    tiempoRalentizado: percentil(partidas.map((partida) => partida.tiempoRalentizado), 0.5),
    danoAbsorbidoEspino: percentil(partidas.map((partida) => partida.danoAbsorbidoEspino), 0.5),
    perdidasPorPlanta: Object.fromEntries(Object.keys(partidas[0].perdidasPorPlanta).map((id) => [
      id, percentil(partidas.map((partida) => partida.perdidasPorPlanta[id]), 0.5),
    ])),
    primeraCompra: percentil(partidas.map((partida) => partida.primeraCompra).filter((t) => t !== null), 0.5),
    primeraAmenaza: percentil(partidas.map((partida) => partida.primeraAmenaza).filter((t) => t !== null), 0.5),
    intervaloCompraMaximo: percentil(partidas.map((partida) => partida.intervaloCompraMaximo), 0.5),
    tiempoCritico: percentil(partidas.map((partida) => partida.tiempoCritico), 0.5),
    energiaGenerada: percentil(partidas.map((partida) => partida.energiaGenerada), 0.5),
    energiaGastada: percentil(partidas.map((partida) => partida.energiaGastada), 0.5),
    perdidas: percentil(partidas.map((partida) => partida.plantasPerdidas), 0.5),
    ocupacion: percentil(partidas.map((partida) => partida.ocupacion), 0.5),
    energiaFinal: percentil(partidas.map((partida) => partida.energiaFinal), 0.5),
    maxSimultaneos: percentil(partidas.map((partida) => partida.maxSimultaneos), 0.9),
    desperdicio: percentil(partidas.map((partida) => partida.danoDesperdiciado), 0.5),
    composicion,
  };
}

export async function correr({ semillas, horizonte = 20 * 60, estrategias = Object.keys(ESTRATEGIAS), ajustes }) {
  const tareas = [];
  for (const nombre of estrategias) {
    for (const semilla of semillas) tareas.push({ semilla, estrategia: nombre, horizonte, ajustes });
  }
  const cpus = Math.min(availableParallelism(), 12, tareas.length);
  const tam = Math.ceil(tareas.length / cpus);
  const lotes = Array.from({ length: cpus }, (_, i) => tareas.slice(i * tam, (i + 1) * tam)).filter((lote) => lote.length);
  const partes = await Promise.all(lotes.map((lote) => new Promise((resolve, reject) => {
    const worker = new Worker(fileURLToPath(import.meta.url), {
      workerData: { tareas: lote.map((tarea) => ({ ...tarea, estrategia: tarea.estrategia })) },
    });
    worker.on('message', resolve);
    worker.on('error', reject);
  })));
  const planos = partes.flat();
  const porEstrategia = {};
  for (const nombre of estrategias) {
    porEstrategia[nombre] = resumir(planos.filter((partida) => partida.estrategia === nombre));
  }
  return porEstrategia;
}

if (isMainThread && process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const desde = Number(process.argv[2] ?? 1);
  const cantidad = Number(process.argv[3] ?? 8);
  const horizonte = Number(process.argv[4] ?? 20 * 60);
  const semillas = Array.from({ length: cantidad }, (_, i) => desde + i);
  const estrategias = process.argv.slice(5);
  const t0 = performance.now();
  const informe = await correr({ semillas, horizonte, estrategias: estrategias.length ? estrategias : undefined });
  console.log(JSON.stringify({ semillas, horizonte, segundos: (performance.now() - t0) / 1000, informe }, null, 2));
}
