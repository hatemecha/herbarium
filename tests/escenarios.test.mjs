import { test } from 'node:test';
import assert from 'node:assert/strict';
import { correr } from './escenario.mjs';

const ENTRADAS = {
  oeste: { x: 0.5, y: 5.5 },
  norte: { x: 5.5, y: 0.5 },
  esquinaNO: { x: 0.5, y: 0.5 },
  este: { x: 10.5, y: 5.5 },
};

const en = (x, y, t = 10) => ({ x, y, t });

test('sin cerbatanas la central cae entre 40 y 46 s desde el inicio', () => {
  for (const entrada of Object.values(ENTRADAS)) {
    const r = correr({ entrada });
    assert.equal(r.derrota, true);
    assert.ok(r.tDerrota >= 40 && r.tDerrota <= 46, `derrota a ${r.tDerrota}s`);
  }
});

test('una cerbatana en diagonal NO de la central mata al escarabajo casi sin mordiscos', () => {
  for (const entrada of Object.values(ENTRADAS)) {
    const r = correr({ entrada, plantas: [en(4, 4)] });
    assert.equal(r.derrota, false);
    assert.equal(r.enemigoVivo, false);
    assert.ok(r.mordidas <= 1, `mordidas=${r.mordidas} con entrada ${JSON.stringify(entrada)}`);
  }
});

test('desde la entrada opuesta la cerbatana NO no alcanza antes del primer mordisco', () => {
  const r = correr({ entrada: ENTRADAS.este, plantas: [en(4, 4)] });
  assert.equal(r.mordidas, 1);
  assert.equal(r.derrota, false);
});

test('la cerbatana en la trayectoria directa actúa como primer obstáculo sin ser derribada', () => {
  const r = correr({ entrada: ENTRADAS.oeste, plantas: [en(4, 5)] });
  assert.equal(r.derrota, false);
  assert.equal(r.enemigoVivo, false);
  assert.ok(r.mordidas <= 2, `mordidas=${r.mordidas}`);
});

test('una cerbatana en el lado opuesto a la entrada sigue sin dejar caer la central', () => {
  const r = correr({ entrada: ENTRADAS.oeste, plantas: [en(6, 5)] });
  assert.equal(r.derrota, false);
  assert.equal(r.enemigoVivo, false);
  assert.ok(r.mordidas <= 2, `mordidas=${r.mordidas}`);
});

test('dos cerbatanas matan al escarabajo en cualquier entrada sin derrota', () => {
  for (const entrada of Object.values(ENTRADAS)) {
    const r = correr({ entrada, plantas: [en(4, 4), en(6, 6, 10.5)] });
    assert.equal(r.derrota, false);
    assert.equal(r.enemigoVivo, false);
  }
});

test('una cerbatana colocada tras el primer mordisco todavía salva la central', () => {
  const r = correr({ entrada: ENTRADAS.oeste, plantas: [en(4, 4, 30)] });
  assert.equal(r.derrota, false, 'la central no debe caer');
  assert.equal(r.enemigoVivo, false);
});
