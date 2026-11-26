import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearTablero } from '../src/tablero.js';
import { crearJardin } from '../src/jardin.js';
import { PLANTAS } from '../src/catalogo.js';

const frames = { central: [], cerbatana: [] };

function nuevoJardin(energia = 100) {
  const tablero = crearTablero();
  const estado = { energia };
  const jardin = crearJardin({ tablero, estado, catalogo: PLANTAS, frames });
  jardin.sembrar('central', tablero.centro);
  return { tablero, estado, jardin };
}

test('la planta central ocupa el centro y no es comprable', () => {
  const { tablero, jardin } = nuevoJardin();
  assert.deepEqual(tablero.centro, { x: 5, y: 5 });
  assert.equal(jardin.plantas.length, 1);
  assert.equal(jardin.colocable('central', { x: 4, y: 5 }), false);
});

test('solo se puede plantar en vecinas de ocho direcciones', () => {
  const { jardin } = nuevoJardin();
  assert.equal(jardin.colocable('cerbatana', { x: 6, y: 5 }), true);
  assert.equal(jardin.colocable('cerbatana', { x: 4, y: 4 }), true, 'diagonal');
  assert.equal(jardin.colocable('cerbatana', { x: 7, y: 5 }), false, 'a dos casillas');
  assert.equal(jardin.colocable('cerbatana', { x: 2, y: 2 }), false, 'lejana');
});

test('no se planta sobre casillas ocupadas ni fuera del tablero', () => {
  const { jardin } = nuevoJardin();
  assert.equal(jardin.colocable('cerbatana', { x: 5, y: 5 }), false);
  assert.equal(jardin.colocable('cerbatana', { x: -1, y: 5 }), false);
  assert.equal(jardin.colocable('cerbatana', { x: 11, y: 5 }), false);
});

test('la energía descuenta solo al plantar y bloquea sin fondos suficientes', () => {
  const { jardin, estado } = nuevoJardin(9.5);
  assert.equal(jardin.colocable('cerbatana', { x: 6, y: 5 }), false);
  assert.equal(jardin.plantar('cerbatana', { x: 6, y: 5 }), null);
  assert.equal(estado.energia, 9.5);

  estado.energia = 12;
  const planta = jardin.plantar('cerbatana', { x: 6, y: 5 });
  assert.ok(planta);
  assert.equal(estado.energia, 2);
});

test('la expansión es sucesiva y se calcula desde las plantas existentes', () => {
  const { jardin, tablero } = nuevoJardin(1000);
  assert.equal(jardin.candidatas('cerbatana').length, 8);

  jardin.plantar('cerbatana', { x: 6, y: 5 });
  assert.equal(jardin.colocable('cerbatana', { x: 7, y: 6 }), true, 'diagonal de la nueva');
  assert.equal(jardin.colocable('cerbatana', { x: 7, y: 5 }), true, 'vecina de la nueva');
  assert.equal(jardin.colocable('cerbatana', { x: 8, y: 5 }), false, 'todavía no alcanzada');

  jardin.plantar('cerbatana', { x: 7, y: 5 });
  assert.equal(jardin.colocable('cerbatana', { x: 8, y: 5 }), true);
  assert.ok(tablero.ocupante(7, 5));
});
