import test from 'node:test';
import assert from 'node:assert/strict';
import { crearParticulas } from '../src/particulas.js';
import { crearAleatorio } from '../src/aleatorio.js';
import { PARTICULAS } from '../src/config.js';

test('el polen no puede ocupar el presupuesto reservado al combate', () => {
  const p = crearParticulas({ aleatorio: crearAleatorio(123) });
  p.rafaga(10, 10, 100, { familia: 'polen' });
  assert.equal(p.resumen().total, PARTICULAS.ambienteMaximo);
  p.rafaga(10, 10, PARTICULAS.maximo, { familia: 'energia' });
  p.rafaga(10, 10, 20, { familia: 'impacto' });
  assert.equal(p.resumen().total, PARTICULAS.maximo);
  assert.equal(p.resumen().familias.impacto, 20);
  p.rafaga(10, 10, 100, { familia: 'polen' });
  assert.equal(p.resumen().familias.impacto, 20);
  assert.equal(p.resumen().total, PARTICULAS.maximo);
});

test('las partículas terminan su vida y el movimiento reducido limpia emisiones previas', () => {
  const p = crearParticulas({ aleatorio: crearAleatorio(42) });
  p.rafaga(10, 10, 7, { familia: 'espora' });
  p.rafaga(10, 10, 7, { familia: 'polen' });
  p.actualizar(1, 0, 0, false);
  assert.equal(p.resumen().familias.espora, undefined);
  assert.equal(p.resumen().familias.polen, 7);
  p.actualizar(1 / 60, 0, 0, true, true);
  assert.equal(p.resumen().total, 0);
});
