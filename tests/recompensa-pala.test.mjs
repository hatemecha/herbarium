import assert from 'node:assert/strict';
import test from 'node:test';
import { crearAleatorio } from '../src/aleatorio.js';
import { ENEMIGOS, PLANTAS } from '../src/catalogo.js';
import { crearCombate } from '../src/combate.js';
import { PALA, RECOMPENSAS } from '../src/config.js';
import { crearJardin } from '../src/jardin.js';
import { crearDirector } from '../src/oleadas.js';
import { crearRecompensas } from '../src/recompensas.js';
import { crearTablero } from '../src/tablero.js';

test('la ruleta es reproducible, evita vacíos consecutivos y garantiza tarot dentro de cuatro oleadas si está habilitado', () => {
  const serie = (config) => {
    const bolsa = crearRecompensas(127, config);
    return Array.from({ length: 120 }, (_, i) => bolsa.sortear(i + 1));
  };
  const produccion = serie(RECOMPENSAS);
  assert.deepEqual(produccion, serie(RECOMPENSAS));
  assert.ok(produccion.some(p => p.tipo === 'vacia'));
  assert.ok(produccion.every((p, i) => p.tipo !== 'tarot' &&
    p.energia <= RECOMPENSAS.topeEnergia &&
    !(p.tipo === 'vacia' && produccion[i - 1]?.tipo === 'vacia')));
  const futuro = serie({ ...RECOMPENSAS, tarot: true });
  for (let i = 0; i <= futuro.length - 4; i++) {
    assert.ok(futuro.slice(i, i + 4).some(p => p.tipo === 'tarot'));
  }
});

test('tarot espera la resolución externa aunque se repita la confirmación', () => {
  const tablero = crearTablero();
  const director = crearDirector({ tablero, aleatorio: crearAleatorio(5),
    recompensas: { ...RECOMPENSAS, pesos: { tarot: 1 }, tarot: true } });
  const estado = { energia: 5 };
  director.avanzar(30, 0);
  while (director.vista().porSalir) director.avanzar(60, 0);
  director.avanzar(1, 0);
  assert.equal(director.presentar(3, estado).tipo, 'tarot');
  assert.equal(director.presentar(3, estado, { continuar: true }), null);
  assert.equal(director.vista().fase, 'recompensa');
  assert.equal(estado.energia, 5);
  assert.equal(director.finalizarTarot(), true);
  assert.equal(director.finalizarTarot(), false);
});

test('la pala se desbloquea desde la oleada configurada', () => {
  assert.equal(PALA.desdeOleada, 3);
});

test('la pala devuelve el coste pagado, libera casilla y desvincula enemigos una sola vez', () => {
  const tablero = crearTablero();
  const estado = { energia: 100, tiempo: 0 };
  let abierta = true;
  const jardin = crearJardin({ tablero, estado, catalogo: PLANTAS, frames: {}, permitido: () => abierta,
    alRetirar(planta, voluntaria) { if (voluntaria) combate.desvincular(planta); } });
  const combate = crearCombate({ tablero, jardin, tipoEnemigo: ENEMIGOS.escarabajo, aparicion: Infinity });
  jardin.sembrar('central', tablero.centro);
  const celda = { x: 5, y: 4 };
  const planta = jardin.plantar('espino', celda);
  assert.equal(planta.costePagado, 10);
  // Subir el precio actual sin tocar el historial de la planta retirada.
  for (const x of [3, 4, 6, 7]) jardin.sembrar('espino', { x, y: 4 });
  assert.ok(jardin.coste('espino') > planta.costePagado);
  const insecto = combate.aparecerEn(5.5, 3.5);
  insecto.objetivo = insecto.senuelo = planta;
  abierta = false;
  assert.equal(jardin.retirar(celda), null);
  abierta = true;
  assert.equal(jardin.retirar(tablero.centro), null);
  assert.equal(jardin.retirar(celda).energia, 5);
  assert.equal(estado.energia, 95);
  assert.equal(jardin.retirar(celda), null);
  assert.equal(insecto.objetivo, null);
  assert.equal(insecto.senuelo, null);
  assert.ok(!tablero.ocupante(celda.x, celda.y));
  assert.equal(jardin.reembolso({ x: 3, y: 4 }), 0);
  assert.ok(jardin.plantar('cerbatana', celda).enfriamiento > 0);
  const sembrada = tablero.ocupante(3, 4);
  jardin.destruir(sembrada);
  assert.equal(jardin.retirar({ x: 3, y: 4 }), null);
});
