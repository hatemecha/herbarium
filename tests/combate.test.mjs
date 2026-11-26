import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BALANCE } from '../src/config.js';
import { ENEMIGOS, PLANTAS } from '../src/catalogo.js';
import { crearTablero } from '../src/tablero.js';
import { crearJardin } from '../src/jardin.js';
import { crearCombate, indiceDireccion } from '../src/combate.js';

const DT = 1 / 60;

function escena({ aparicion, tipoEnemigo = ENEMIGOS.escarabajo } = {}) {
  const tablero = crearTablero();
  const estado = { energia: 0 };
  const catalogo = {
    ...PLANTAS,
    muro: { ...PLANTAS.central, id: 'muro', nombre: 'Muro', comprable: false, vida: 12 },
  };
  const retirados = [];
  const jardin = crearJardin({ tablero, estado, catalogo, frames: {}, alRetirar: (p) => retirados.push(p) });
  jardin.sembrar('central', tablero.centro);
  const combate = crearCombate({
    tablero,
    jardin,
    tipoEnemigo,
    aparicion,
    aleatorio: () => 0.5,
  });
  return { tablero, jardin, combate, retirados };
}

function avanzar(combate, segundos, reducido = false) {
  const pasos = Math.round(segundos / DT);
  for (let i = 0; i < pasos; i++) combate.actualizar(DT, reducido);
}

const cuentaEventos = (combate, tipo) => combate.eventos().filter((e) => e.tipo === tipo).length;

test('el escarabajo aparece en el perímetro exactamente a los 20 segundos', () => {
  const { combate } = escena();
  avanzar(combate, 19.9);
  assert.equal(combate.enemigos.length, 0);
  avanzar(combate, 0.2);
  assert.equal(combate.enemigos.length, 1);
  const { x, y } = combate.enemigos[0];
  const enBorde = x < 1 || x > 10 || y < 1 || y > 10;
  assert.ok(enBorde, `posición fuera del perímetro: ${x}, ${y}`);
});

test('no genera más de un escarabajo automáticamente', () => {
  const { combate } = escena({ aparicion: 1 });
  avanzar(combate, 30);
  assert.equal(combate.enemigos.length, 1);
});

test('avanza hacia la central a 0,5 casillas por segundo', () => {
  const { combate } = escena({ aparicion: Infinity });
  const e = combate.aparecerEn(0.5, 5.5);
  avanzar(combate, 2);
  assert.ok(Math.abs(e.x - 1.5) < 0.02, `x=${e.x}`);
  assert.ok(Math.abs(e.y - 5.5) < 0.02);
});

test('se detiene ante una planta, la muerde cada segundo y no la atraviesa', () => {
  const { combate, jardin, tablero } = escena({ aparicion: Infinity });
  const muro = jardin.sembrar('muro', { x: 3, y: 5 });
  const e = combate.aparecerEn(2.5, 5.5);

  let mordidas = 0;
  for (let i = 0; i < Math.round(3 / DT); i++) {
    combate.actualizar(DT);
    mordidas += combate.eventos().filter((ev) => ev.tipo === 'mordida').length;
  }

  assert.equal(e.x, 2.5, 'el escarabajo no debe avanzar hacia la planta');
  assert.equal(e.objetivo, muro);
  assert.ok(mordidas >= 3 && mordidas <= 4, `mordidas=${mordidas}`);
  assert.equal(muro.vida, 12 - 2 * mordidas);
  assert.equal(tablero.ocupante(3, 5), muro);
});

test('tras destruir una planta bloqueante, el escarabajo retoma el camino hacia la central', () => {
  const { combate, jardin, tablero } = escena({ aparicion: Infinity });
  const muro = jardin.sembrar('muro', { x: 3, y: 5 });
  muro.vida = 2;
  const e = combate.aparecerEn(2.5, 5.5);
  avanzar(combate, 0.1);

  assert.equal(muro.muerta, true);
  assert.equal(tablero.ocupante(3, 5), null, 'la casilla queda libre');
  const xTrasMuerte = e.x;
  avanzar(combate, 1);
  assert.ok(e.x > xTrasMuerte, 'vuelve a moverse hacia la central');
});

test('la planta destruida se retira tras desvanecerse', () => {
  const { combate, jardin, retirados } = escena({ aparicion: Infinity });
  const muro = jardin.sembrar('muro', { x: 3, y: 5 });
  muro.vida = 2;
  combate.aparecerEn(2.5, 5.5);
  avanzar(combate, 0.1);
  assert.ok(jardin.plantas.includes(muro), 'sigue visible mientras se desvanece');
  for (let i = 0; i < Math.round((BALANCE.visual.marchitez + 0.1) / DT); i++) {
    combate.actualizar(DT);
    jardin.actualizar(DT, false);
  }
  assert.equal(jardin.plantas.includes(muro), false);
  assert.deepEqual(retirados, [muro]);
});

test('la cerbatana dispara solo a enemigos dentro de su alcance circular', () => {
  const dentro = escena({ aparicion: Infinity });
  dentro.jardin.sembrar('cerbatana', { x: 6, y: 5 });
  dentro.combate.aparecerEn(8.5, 5.5);
  avanzar(dentro.combate, DT);
  assert.equal(cuentaEventos(dentro.combate, 'disparo'), 1, 'a 2 casillas dispara');

  const fuera = escena({ aparicion: Infinity });
  fuera.jardin.sembrar('cerbatana', { x: 6, y: 5 });
  fuera.combate.aparecerEn(10.5, 5.5);
  avanzar(fuera.combate, DT);
  assert.equal(cuentaEventos(fuera.combate, 'disparo'), 0, 'a más de 3 casillas no dispara');
});

test('el intervalo entre disparos es de un segundo', () => {
  const { combate, jardin } = escena({ aparicion: Infinity });
  jardin.sembrar('cerbatana', { x: 6, y: 5 });
  combate.aparecerEn(8.5, 5.5);
  combate.enemigos[0].vida = 1000;
  let disparos = 0;
  for (let i = 0; i < Math.round(2.5 / DT); i++) {
    combate.actualizar(DT);
    disparos += combate.eventos().filter((ev) => ev.tipo === 'disparo').length;
  }
  assert.equal(disparos, 3);
});

test('el proyectil no hace daño al disparar, sino al colisionar', () => {
  const { combate, jardin } = escena({ aparicion: Infinity });
  jardin.sembrar('cerbatana', { x: 6, y: 5 });
  const e = combate.aparecerEn(8.5, 5.5);
  combate.actualizar(0.001);
  assert.equal(e.vida, 12, 'sin daño instantáneo');
  assert.equal(combate.proyectiles.length, 1);
});

test('un proyectil rápido no atraviesa al enemigo aunque el paso sea grande', () => {
  const { combate, jardin } = escena({ aparicion: Infinity });
  jardin.sembrar('cerbatana', { x: 6, y: 5 });
  const e = combate.aparecerEn(8.5, 5.5);
  combate.actualizar(0.25);
  assert.equal(e.vida, 12 - BALANCE.cerbatana.dano);
  assert.equal(combate.proyectiles.length, 0);
  assert.equal(cuentaEventos(combate, 'impacto'), 1);
});

test('un enemigo cuya vida llega a cero muere y desaparece tras la desintegración', () => {
  const { combate, jardin } = escena({ aparicion: Infinity });
  jardin.sembrar('cerbatana', { x: 6, y: 5 });
  const e = combate.aparecerEn(8.5, 5.5);
  e.vida = BALANCE.cerbatana.dano;
  combate.actualizar(0.25);
  assert.equal(e.muerto, true);
  assert.equal(combate.enemigos.includes(e), true, 'sigue en escena durante la desintegración');
  avanzar(combate, BALANCE.visual.desintegracion + 0.05);
  assert.equal(combate.enemigos.includes(e), false);
});

test('la planta central destruida provoca derrota', () => {
  const { combate, jardin } = escena({ aparicion: Infinity });
  jardin.central.vida = 2;
  combate.aparecerEn(4.5, 5.5);
  assert.equal(combate.derrota(), false);
  avanzar(combate, 0.1);
  assert.equal(combate.derrota(), true);
});

test('el escarabajo tiene el daño y el ritmo de mordida configurados', () => {
  assert.equal(ENEMIGOS.escarabajo.dano, 2);
  assert.equal(ENEMIGOS.escarabajo.intervalo, 1);
  assert.equal(ENEMIGOS.escarabajo.vida, 12);
  assert.equal(PLANTAS.cerbatana.ataque.alcance, 3);
  assert.equal(PLANTAS.cerbatana.ataque.dano, 4);
});

test('la orientación del disparo elige una de las ocho direcciones', () => {
  assert.equal(indiceDireccion(1, 0), 2, 'E');
  assert.equal(indiceDireccion(0, 1), 4, 'S');
  assert.equal(indiceDireccion(-1, 0), 6, 'W');
  assert.equal(indiceDireccion(0, -1), 0, 'N');
  assert.equal(indiceDireccion(1, 1) === 3, true, 'SE');
  assert.equal(indiceDireccion(-1, -1) === 7, true, 'NW');
});
