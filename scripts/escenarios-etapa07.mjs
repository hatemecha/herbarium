import { BALANCE, OLEADAS, SIMULACION } from '../src/config.js';
import { crearAleatorio } from '../src/aleatorio.js';
import { ENEMIGOS, PLANTAS } from '../src/catalogo.js';
import { crearCombate } from '../src/combate.js';
import { crearJardin } from '../src/jardin.js';
import { crearRegistro, percentil } from '../src/metricas.js';
import { generarOleada } from '../src/oleadas.js';
import { crearTablero } from '../src/tablero.js';

function escenario(sembradas, ordenes, espino = {}, semilla = 17, vidaCentral = BALANCE.central.vida) {
  const tablero = crearTablero();
  const registro = crearRegistro();
  const catalogo = { ...PLANTAS, espino: { ...PLANTAS.espino, ...espino } };
  const jardin = crearJardin({ tablero, catalogo, frames: {}, estado: { energia: 0 } });
  jardin.sembrar('central', tablero.centro).vida = vidaCentral;
  for (const [id, x, y] of sembradas) jardin.sembrar(id, { x, y });
  const combate = crearCombate({ tablero, jardin, aparicion: Infinity, aleatorio: crearAleatorio(semilla) });
  const dt = SIMULACION.paso;
  let i = 0;
  let segundosConTiradoras = 0;
  let primeraMordidaCentral = null;
  const inicial = sembradas.filter(([id]) => id === 'cerbatana').length;
  while (combate.tiempo() < 180 && !combate.derrota()) {
    while (i < ordenes.length && ordenes[i].en <= combate.tiempo()) {
      const { id, x, y } = ordenes[i++];
      combate.aparecerEn(x, y, ENEMIGOS[id]);
    }
    jardin.actualizar(dt, true);
    combate.actualizar(dt);
    registro.eventos(combate.eventos());
    if (registro.datos.danoCentral > 0) primeraMordidaCentral ??= combate.tiempo();
    segundosConTiradoras += dt * jardin.plantas.filter((p) => p.id === 'cerbatana' && !p.muerta).length;
    if (i === ordenes.length && combate.enemigos.every((e) => e.muerto)) break;
  }
  return {
    danoCentral: registro.datos.danoCentral,
    primeraMordidaCentral,
    atracciones: registro.datos.atracciones,
    blancosPorPulso: registro.datos.impactosHongo / (registro.datos.pulsosHongo || 1),
    tiempoRalentizado: combate.tiempoRalentizado(),
    perdidas: registro.datos.perdidasPorPlanta,
    danoAbsorbidoEspino: registro.datos.danoAbsorbidoEspino,
    danoPorPlanta: registro.datos.danoPorPlanta,
    segundosConTiradoras: inicial ? segundosConTiradoras / inicial : 0,
    duracion: combate.tiempo(),
  };
}

const frente = [['cerbatana', 5, 4]];
const orugas = Array.from({ length: 5 }, (_, i) => ({ id: 'oruga', x: 5.5, y: 0.5, en: i * 2 }));
const proteccion = {
  sinEscudo: escenario(frente, orugas),
  otraCerbatana: escenario([...frente, ['cerbatana', 5, 3]], orugas),
  espino36_1: escenario([...frente, ['espino', 5, 3]], orugas, { vida: 36, reflejo: 1 }),
  espino48_2: escenario([...frente, ['espino', 5, 3]], orugas, { vida: 48, reflejo: 2 }),
  espino54_2: escenario([...frente, ["espino", 5, 3]], orugas, { vida: 54, reflejo: 2 }),
  espino54_3: escenario([...frente, ["espino", 5, 3]], orugas, { vida: 54, reflejo: 3 }),
  espino60_3: escenario([...frente, ['espino', 5, 3]], orugas, { vida: 60, reflejo: 3 }),
};

const tablero = crearTablero();
const jardinFijo = [
  ['cerbatana', 5, 4], ['cerbatana', 6, 5], ['cerbatana', 5, 6],
  ['campanilla', 4, 4], ['hongo', 5, 3], ['espino', 5, 2],
];
const patrones = ['concentrada', 'pinza', 'enjambre', 'distraccion'];
const valores = Object.fromEntries(patrones.map((patron) => [patron, []]));
for (let semilla = 101; semilla <= 124; semilla++) {
  let referencia;
  for (const patron of patrones) {
    const plan = generarOleada({
      numero: 9, tablero, rng: crearAleatorio(semilla), ocupado: () => false, patronForzado: patron,
      oleadas: { ...OLEADAS, sesgoDePatron: 0 },
    });
    referencia ??= JSON.stringify(plan.conteo);
    if (JSON.stringify(plan.conteo) !== referencia) throw new Error('Cambió la composición entre patrones');
    valores[patron].push(escenario(jardinFijo, plan.cola, {}, semilla));
  }
}
const comparacion = Object.fromEntries(patrones.map((patron) => {
  const partidas = valores[patron];
  return [patron, {
    danoMedio: partidas.reduce((suma, p) => suma + p.danoCentral, 0) / partidas.length,
    perdidasMedias: partidas.reduce((suma, p) => suma + Object.values(p.perdidas).reduce((a, b) => a + b, 0), 0) / partidas.length,
    danoP90: percentil(partidas.map((p) => p.danoCentral), 0.9),
    duracionMediana: percentil(partidas.map((p) => p.duracion), 0.5),
  }];
}));
const pulgones = Array.from({ length: 5 }, (_, i) => ({ id: 'pulgon', x: 5.25 + i * 0.12, y: 2, en: 0 }));
const area = {
  cerbatana: escenario([['cerbatana', 5, 3]], pulgones),
  hongo: escenario([['hongo', 5, 3]], pulgones),
};
const flanco = Array.from({ length: 10 }, (_, i) => ({
  id: i % 3 === 0 ? 'escarabajo' : 'pulgon',
  x: 5.3 + (i % 4) * 0.12,
  y: 0.5,
  en: i * 0.45,
}));
const jardinLateral = [['hongo', 5, 2], ['espino', 4, 2]];
const combinaciones = {
  sinAtraccion: escenario(jardinLateral, flanco, { atraccion: 0 }),
  conAtraccion: escenario(jardinLateral, flanco),
  conCampanilla: escenario([...jardinLateral, ['campanilla', 6, 2]], flanco),
};
const escarabajo = [{ id: 'escarabajo', x: 5.5, y: 0.5, en: 0 }];
const demora = {
  directo: escenario([], escarabajo).primeraMordidaCentral,
  desviado: escenario([['espino', 4, 2]], escarabajo, { vida: 2 }).primeraMordidaCentral,
};
const lleno = [];
const mezcla = ['cerbatana', 'espino', 'campanilla', 'hongo'];
for (let y = 0; y < tablero.filas; y++) {
  for (let x = 0; x < tablero.columnas; x++) {
    if (x === 5 && y === 5 || (x + y * tablero.columnas) % 12 === 0) continue;
    lleno.push([mezcla[(x + 2 * y) % mezcla.length], x, y]);
  }
}
const planTardio = generarOleada({
  numero: 28, rng: crearAleatorio(27), tablero, ocupado: () => true, patronForzado: 'enjambre',
});
const saturado = escenario(lleno, planTardio.cola, {}, 27, 8);
console.log(JSON.stringify({ demora, saturado: { plantasIniciales: lleno.length, presupuesto: planTardio.presupuesto, ...saturado }, combinaciones, oleada: 9, semillas: [101, 124], espinoFinal: BALANCE.espino, proteccion, comparacion, area }, null, 2));
