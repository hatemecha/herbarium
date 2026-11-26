import { test } from 'node:test';
import assert from 'node:assert/strict';
import { principal } from '../src/estrategias.js';
import { simularPartida } from '../src/simular.js';

test('la misma semilla repite la partida y otra semilla no tiene por qué', () => {
  const a = simularPartida({ semilla: 11, estrategia: principal, horizonte: 30 });
  const b = simularPartida({ semilla: 11, estrategia: principal, horizonte: 30 });
  const c = simularPartida({ semilla: 12, estrategia: principal, horizonte: 30 });
  assert.equal(a.tiempo, b.tiempo);
  assert.equal(a.vidaCentral, b.vidaCentral);
  assert.deepEqual(a.compras, b.compras);
  assert.deepEqual(a.historial.map((oleada) => oleada.conteo), b.historial.map((oleada) => oleada.conteo));
  assert.notEqual(a.vidaCentral + a.tiempo, c.vidaCentral + c.tiempo);
});
