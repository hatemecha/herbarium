import { test } from 'node:test';
import assert from 'node:assert/strict';
import { punteroFino } from '../src/entrada.js';
import { textoFicha } from '../src/ficha.js';
import { PLANTAS } from '../src/catalogo.js';

test('el dedo no cuenta como puntero fino y el ratón sí', () => {
  assert.equal(punteroFino({ pointerType: 'touch' }), false);
  assert.equal(punteroFino({ pointerType: 'mouse' }), true);
  assert.equal(punteroFino({ pointerType: 'pen' }), true);
});

test('la ficha muestra vida y el dato principal solo con una planta elegida', () => {
  const cerbatana = {
    tipo: PLANTAS.cerbatana,
    vida: 7.2,
    vidaMax: 12,
    muerta: false,
  };
  assert.match(textoFicha(cerbatana), /Cerbatana\s+8\/12\s+daño 4\s+alcance 3/);
  const espino = { tipo: PLANTAS.espino, vida: 36, vidaMax: 36, muerta: false };
  assert.match(textoFicha(espino), /Espino\s+36\/36\s+refleja 1/);
  assert.equal(textoFicha(null), '');
  assert.equal(textoFicha({ ...cerbatana, muerta: true }), '');
});
