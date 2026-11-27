import test from 'node:test';
import assert from 'node:assert/strict';
import { ESTRELLA, LADO_ESTRELLA, pintarEstrella } from '../src/sprites/estrella.js';

test('el hexagrama conserva rejilla 7×7 y simetría horizontal y vertical', () => {
  assert.equal(LADO_ESTRELLA, 7);
  assert.equal(ESTRELLA.length, LADO_ESTRELLA);
  for (const fila of ESTRELLA) assert.equal(fila.length, LADO_ESTRELLA);

  for (let y = 0; y < LADO_ESTRELLA; y += 1) {
    assert.equal(ESTRELLA[y], [...ESTRELLA[y]].reverse().join(''));
    assert.equal(ESTRELLA[y], ESTRELLA[LADO_ESTRELLA - 1 - y]);
  }
});

test('pintarEstrella redondea el origen y usa píxeles enteros', () => {
  const rectangulos = [];
  const ctx = {
    fillStyle: null,
    fillRect(x, y, ancho, alto) {
      rectangulos.push([x, y, ancho, alto]);
    },
  };

  pintarEstrella(ctx, 2.49, -3.51, '#c2ff3d');

  assert.equal(ctx.fillStyle, '#c2ff3d');
  assert.equal(rectangulos.length, 17);
  for (const [x, y, ancho, alto] of rectangulos) {
    assert.ok(Number.isInteger(x));
    assert.ok(Number.isInteger(y));
    assert.equal(ancho, 1);
    assert.equal(alto, 1);
    assert.ok(x >= 2 && x <= 8);
    assert.ok(y >= -4 && y <= 2);
  }
});
