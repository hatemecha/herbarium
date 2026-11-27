import { test } from 'node:test';
import assert from 'node:assert/strict';
import { punteroFino } from '../src/entrada.js';
import { funcionDe, textoFicha } from '../src/ficha.js';
import { BALANCE } from '../src/config.js';
import { COMPRABLES, PLANTAS } from '../src/catalogo.js';

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
  const espino = { tipo: PLANTAS.espino, vida: 36, vidaMax: BALANCE.espino.vida, muerta: false };
  assert.match(textoFicha(espino), /Espino\s+36\/42\s+refleja 2/);
  assert.equal(textoFicha(null), '');
  assert.equal(textoFicha({ ...cerbatana, muerta: true }), '');
});

test('todas las cartas comprables informan su función antes de plantar', () => {
  const funciones = COMPRABLES.map(({ id }) => funcionDe(id));
  assert.deepEqual(funciones.map(({ corta }) => corta), ['Disparo', 'Atracción', 'Freno', 'Área']);
  assert.ok(funciones.every(({ consejo }) => consejo.length > 0));
});
