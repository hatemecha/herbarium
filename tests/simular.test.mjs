import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ESTRATEGIAS } from '../src/estrategias.js';
import { simularPartida } from '../src/simular.js';

test('la misma semilla repite la partida y otra semilla no tiene por qué', () => {
  const opciones = { estrategia: ESTRATEGIAS.compacta, horizonte: 210 };
  const a = simularPartida({ ...opciones, semilla: 11 });
  const b = simularPartida({ ...opciones, semilla: 11 });
  const c = simularPartida({ ...opciones, semilla: 12 });
  assert.ok(a.oleadasCompletas >= 1);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.historial, c.historial);
});
