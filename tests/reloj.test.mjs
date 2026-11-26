import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SIMULACION } from '../src/config.js';
import { crearReloj } from '../src/reloj.js';

test('un salto largo no se convierte en muchos pasos y cortar tira el sobrante', () => {
  const reloj = crearReloj();
  reloj.acumular(5);
  assert.equal(reloj.pasos(), Math.round(SIMULACION.tiempoMaximo / SIMULACION.paso));
  reloj.acumular(SIMULACION.paso * 0.4);
  reloj.cortar();
  assert.equal(reloj.pasos(), 0);
  reloj.acumular(SIMULACION.paso * 2.2);
  assert.equal(reloj.pasos(), 2);
  assert.ok(reloj.acumulado() > 0);
});
