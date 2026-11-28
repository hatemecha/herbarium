import assert from 'node:assert/strict';
import test from 'node:test';
import { alinearPixel, calcularEscala } from '../src/escala.js';
import { altoLectura, medirTexto, pintarMarco, repartirTexto } from '../src/interfazPixel.js';

test('el tablero usa el mayor múltiplo entero que cabe en ambos ejes físicos', () => {
  for (const [anchoCss, altoCss, dpr, multiplo] of [
    [320, 230, 1, 1],
    [366, 600, 3, 6],
    [720, 423, 1.25, 3],
    [350, 400, 1.5, 2],
    [130, 240, 1, 1],
  ]) {
    assert.deepEqual(calcularEscala({ anchoCss, altoCss, dpr, lado: 176 }), {
      multiplo, pixeles: 176 * multiplo, css: 176 * multiplo / dpr,
    });
  }
  assert.equal(alinearPixel(23.36, 1.25) * 1.25, 29);
  assert.equal(alinearPixel(-12.42, 1.5) * 1.5, -19);
});

test('la caja de Terminus mide acentos compuestos y reparte líneas sin comprimir', () => {
  assert.equal(medirTexto('nin\u0303o 10'), medirTexto('niño 10'));
  assert.equal(medirTexto('Árbol'), 30);
  assert.deepEqual(repartirTexto('Daño en área', 36), ['Daño', 'en', 'área']);
  assert.deepEqual(repartirTexto('Escarabajo', 36), ['Escara', 'bajo']);
});

test('la reserva de lectura toma la ayuda más larga y su interlineado al DPR real', () => {
  assert.equal(altoLectura(['Vida', 'Daño en área'], 79, 1.25), 40 * 3 / 1.25);
  assert.equal(altoLectura(['Vida', 'Daño en área'], 200, 1.25), 12 * 3 / 1.25);
});

test('el marco tiene cantos simétricos y rectángulos sobre píxeles enteros', () => {
  let color;
  const pixeles = Array.from({ length: 7 }, () => Array(7).fill(' '));
  pintarMarco({
    set fillStyle(valor) { color = valor; },
    fillRect(x, y, w, h) {
      assert.ok([x, y, w, h].every(Number.isInteger));
      for (let fila = y; fila < y + h; fila++) {
        for (let col = x; col < x + w; col++) pixeles[fila][col] = color;
      }
    },
  }, 7, 7, '.', '#');
  assert.deepEqual(pixeles.map((fila) => fila.join('')), [
    '  ###  ',
    ' #...# ',
    '#.....#',
    '#.....#',
    '#.....#',
    ' #...# ',
    '  ###  ',
  ]);
});
