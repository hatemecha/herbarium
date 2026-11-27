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
  p.rafaga(10, 10, PARTICULAS.ambienteMaximo, { familia: 'polen' });
  p.actualizar(1, true);
  assert.equal(p.resumen().familias.espora, undefined);
  assert.equal(p.resumen().familias.polen, PARTICULAS.ambienteMaximo);
  p.actualizar(1 / 60, true, true);
  assert.equal(p.resumen().total, 0);
});

test('al caer la flor desaparece el polen y puede terminar el efecto de combate', () => {
  const p = crearParticulas({ aleatorio: crearAleatorio(42) });
  p.rafaga(10, 10, 1, { familia: 'polen' });
  p.rafaga(10, 10, 1, { familia: 'impacto' });
  p.actualizar(1 / 60, false);
  assert.deepEqual(p.resumen().familias, { impacto: 1 });
});

test('las motas con emisor conservan su color y respetan el presupuesto ambiental', () => {
  const p = crearParticulas({ aleatorio: () => 0 });
  for (let i = 0; i < 40; i++) p.actualizar(1 / 60, true, false, () => ({ x: 40, y: 40, color: [38, 55, 90] }));
  assert.equal(p.resumen().familias.polen, 12);
  const ctx = { fillRect() { assert.equal(this.fillStyle, 'rgba(38, 55, 90, 1)'); } };
  p.dibujar(ctx, [0, 0, 0]);
});
