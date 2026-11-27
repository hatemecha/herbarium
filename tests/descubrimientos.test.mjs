import assert from 'node:assert/strict';
import test from 'node:test';
import { crearDescubrimientos } from '../src/descubrimientos.js';

test('registra especies una sola vez y conserva lo descubierto al volver a cargar', () => {
  let datos = null;
  let escrituras = 0;
  const almacen = () => ({
    getItem: () => datos,
    setItem: (_, valor) => {
      datos = valor;
      escrituras += 1;
    },
  });
  const registro = crearDescubrimientos(almacen);
  assert.deepEqual(registro.listar('enemigos'), []);
  registro.registrar('plantas', 'central', 'hongo');
  registro.registrar('enemigos', 'escarabajo');
  registro.registrar('enemigos', 'escarabajo');
  assert.equal(escrituras, 2);
  const recargado = crearDescubrimientos(almacen);
  assert.deepEqual(recargado.listar('plantas').map(({ id }) => id), ['central', 'hongo']);
  assert.deepEqual(recargado.listar('enemigos').map(({ id }) => id), ['escarabajo']);
});

test('ignora datos ilegibles, categorías inválidas e IDs que ya no existen', () => {
  const corrupto = crearDescubrimientos(() => ({ getItem: () => '{' }));
  assert.deepEqual(corrupto.listar('plantas'), []);
  const parcial = crearDescubrimientos(() => ({
    getItem: () => JSON.stringify({
      plantas: 'central',
      enemigos: ['oruga', 'retirado', 'constructor', null],
    }),
  }));
  assert.deepEqual(parcial.listar('plantas'), []);
  assert.deepEqual(parcial.listar('enemigos').map(({ id }) => id), ['oruga']);
});

test('mantiene los descubrimientos en memoria si el navegador impide guardar', () => {
  const registro = crearDescubrimientos(() => ({
    getItem: () => null,
    setItem: () => { throw new Error('Escritura bloqueada'); },
  }));
  registro.registrar('enemigos', 'pulgon');
  assert.deepEqual(registro.listar('enemigos').map(({ id }) => id), ['pulgon']);
});
