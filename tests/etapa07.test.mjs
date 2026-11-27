import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BALANCE } from '../src/config.js';
import { ENEMIGOS, PLANTAS } from '../src/catalogo.js';
import { crearAleatorio } from '../src/aleatorio.js';
import { crearCombate } from '../src/combate.js';
import { crearDirector, generarOleada } from '../src/oleadas.js';
import { crearJardin } from '../src/jardin.js';
import { crearTablero } from '../src/tablero.js';

const dt = 1 / 60;

function jardinDePrueba() {
  const tablero = crearTablero();
  const jardin = crearJardin({ tablero, catalogo: PLANTAS, frames: {}, estado: { energia: 100 } });
  jardin.sembrar('central', tablero.centro);
  const combate = crearCombate({ tablero, jardin, tipoEnemigo: ENEMIGOS.escarabajo, aparicion: Infinity });
  return { combate, jardin };
}

test('dos campanillas no acumulan la ralentización ni cambian la mordida', () => {
  const { combate, jardin } = jardinDePrueba();
  jardin.sembrar('campanilla', { x: 4, y: 3 });
  jardin.sembrar('campanilla', { x: 6, y: 3 });
  const insecto = combate.aparecerEn(5.5, 3.5);
  const atacante = combate.aparecerEn(4.5, 2.8);
  combate.actualizar(dt);
  assert.ok(Math.abs(insecto.vy - BALANCE.escarabajo.velocidad * (1 - BALANCE.campanilla.reduccion)) < 1e-9);
  assert.equal(combate.tiempoRalentizado(), dt);
  assert.equal(atacante.cooldown, BALANCE.escarabajo.intervalo - dt);
});

test('el hongo alcanza al grupo en su radio, no se activa desde más lejos y respeta el intervalo', () => {
  const { combate, jardin } = jardinDePrueba();
  jardin.sembrar('hongo', { x: 5, y: 4 });
  const lejos = combate.aparecerEn(5.5, 4.5 - BALANCE.hongo.alcance - 0.2);
  combate.actualizar(dt);
  assert.equal(combate.eventos().filter((ev) => ev.tipo === 'esporas').length, 0);
  const cerca = [4.8, 5.6, 6.2].map((x) => combate.aparecerEn(x, 3.4, ENEMIGOS.pulgon));
  combate.actualizar(dt);
  assert.equal(lejos.vida, BALANCE.escarabajo.vida);
  for (const insecto of cerca) {
    assert.equal(insecto.vida, BALANCE.pulgon.vida - BALANCE.hongo.dano);
    assert.equal(insecto.colorImpacto, 'hongoLuz');
  }
  combate.actualizar(dt);
  assert.equal(combate.eventos().filter((ev) => ev.tipo === 'esporas').length, 0);
});

test('las apariciones comprueban el perímetro en el momento de nacer', () => {
  const tablero = crearTablero();
  let ocupado = false;
  const director = crearDirector({ tablero, aleatorio: crearAleatorio(42), ocupante: () => ocupado });
  director.avanzar(60, 0);
  ocupado = true;
  let emitidos = 0;
  while (director.vista().porSalir > 0) {
    for (const orden of director.avanzar(60, 0)) {
      emitidos++;
      assert.ok(orden.x < 0 || orden.y < 0 || orden.x >= tablero.columnas || orden.y >= tablero.filas);
    }
  }
  assert.ok(emitidos > 0);
});

test('las oleadas largas consumen su presupuesto sin el tope anterior de unidades', () => {
  const tablero = crearTablero();
  const plan = generarOleada({ numero: 160, tablero, rng: crearAleatorio(42), ocupado: () => false });
  const gastado = plan.cola.reduce((suma, enemigo) => suma + BALANCE[enemigo.id].amenaza, 0);
  assert.equal(gastado, plan.presupuesto);
  assert.ok(plan.cola.length > 480);
});

test('el director expone varios frentes al principio y al final de la misma invasión', () => {
  const tablero = crearTablero();
  const plan = generarOleada({
    numero: 5, tablero, rng: crearAleatorio(2),
  });
  const mitad = plan.ventana / 2;
  for (const bloque of [plan.cola.filter(orden => orden.en < mitad), plan.cola.filter(orden => orden.en >= mitad)]) {
    assert.equal(new Set(bloque.map(({ celda }) => celda.lado)).size, 4);
  }
});

test('la oruga se prepara antes de empezar a desgastar su bloqueo', () => {
  const { combate, jardin } = jardinDePrueba();
  const espino = jardin.sembrar('espino', { x: 5, y: 4 });
  combate.aparecerEn(5.5, 3.7, ENEMIGOS.oruga);
  combate.actualizar(dt);
  assert.equal(espino.vida, espino.vidaMax);
  for (let t = 0; t < BALANCE.oruga.preparacionAtaque; t += dt) combate.actualizar(dt);
  assert.equal(espino.vida, espino.vidaMax - BALANCE.oruga.dano);
});

test('el Espino captura al pulgón en vuelo y conserva el desvío hasta que se pierde', () => {
  const { combate, jardin } = jardinDePrueba();
  const cerbatana = jardin.sembrar('cerbatana', { x: 5, y: 3 });
  const espino = jardin.sembrar('espino', { x: 4, y: 3 });
  const pulgon = combate.aparecerEn(5.5, 2.7, ENEMIGOS.pulgon);
  combate.actualizar(dt);
  assert.equal(pulgon.senuelo, espino);
  assert.notEqual(pulgon.objetivo, cerbatana);
  assert.ok(pulgon.vx < 0);
  assert.equal(combate.eventos().filter((ev) => ev.tipo === 'atraccion').length, 1);
  jardin.destruir(espino);
  combate.actualizar(dt);
  assert.equal(pulgon.senuelo, null);
  assert.equal(pulgon.objetivo, null);
  assert.ok(pulgon.vy > 0);
});

test('el pulgón sobrevuela plantas comunes pero se posa en la central', () => {
  const { combate, jardin } = jardinDePrueba();
  const planta = jardin.sembrar('campanilla', { x: 5, y: 4 });
  const pulgon = combate.aparecerEn(5.5, 3.8, ENEMIGOS.pulgon);
  for (let i = 0; i < 180; i++) combate.actualizar(dt);
  assert.equal(planta.vida, planta.vidaMax);
  assert.equal(pulgon.objetivo, jardin.central);
  assert.ok(jardin.central.vida < jardin.central.vidaMax);
});

test('la oruga aumenta el daño solo después de afianzarse en la misma planta', () => {
  const { combate, jardin } = jardinDePrueba();
  const planta = jardin.sembrar('campanilla', { x: 5, y: 4 });
  combate.aparecerEn(5.5, 3.8, ENEMIGOS.oruga);
  const mordidas = [];
  for (let i = 0; i < 210; i++) {
    combate.actualizar(dt);
    mordidas.push(...combate.eventos().filter((ev) => ev.tipo === 'mordida').map((ev) => ev.dano));
  }
  const { dano, danoSostenido } = ENEMIGOS.oruga;
  assert.deepEqual(mordidas, [dano, dano, dano + danoSostenido]);
  assert.equal(planta.vida, planta.vidaMax - dano * 3 - danoSostenido);
});

test('el aviso de aproximación solo aparece al final de la preparación', () => {
  const tablero = crearTablero();
  const director = crearDirector({ tablero, aleatorio: crearAleatorio(9) });
  assert.equal(director.aviso(), false);
  director.avanzar(18, 0);
  assert.equal(director.aviso(), true);
  director.avanzar(2, 0);
  assert.equal(director.aviso(), false);
  assert.equal(director.vista().fase, 'combate');
});

test('la oruga amortigua un tiro frontal, pero recibe daño completo desde un costado', () => {
  const { combate } = jardinDePrueba();
  const oruga = combate.aparecerEn(5.5, 2.5, ENEMIGOS.oruga);
  const nuevoTiro = { y: 2.5, uy: 0, planta: 'cerbatana', dano: BALANCE.cerbatana.dano,
    velocidad: 6, recorrido: 0, distanciaMaxima: 4.5, activo: true };
  combate.proyectiles.push(
    { ...nuevoTiro, x: 5.5, y: 2.6, ux: 0, uy: -1 },
    { ...nuevoTiro, x: 5.4, ux: 1 },
  );
  combate.actualizar(dt);
  const impactos = combate.eventos().filter((ev) => ev.tipo === 'impacto');
  assert.deepEqual(impactos.map((ev) => ev.bloqueado), [BALANCE.oruga.corazaFrontal, 0]);
  assert.equal(oruga.vida, oruga.vidaMax - 2 * BALANCE.cerbatana.dano + BALANCE.oruga.corazaFrontal);
});

test('un señuelo sembrado justo bajo el insecto permite que se pose', () => {
  const { combate, jardin } = jardinDePrueba();
  const pulgon = combate.aparecerEn(4.5, 3.5, ENEMIGOS.pulgon);
  const espino = jardin.sembrar('espino', { x: 4, y: 3 });
  combate.actualizar(dt);
  assert.equal(pulgon.objetivo, espino);
  assert.equal(pulgon.vida, pulgon.vidaMax - BALANCE.espino.reflejo);
});

test('el aterrizaje emite una señal al posarse y no la repite al morder', () => {
  const { combate } = jardinDePrueba();
  combate.aparecerEn(5.5, 4.7, ENEMIGOS.escarabajo);
  combate.actualizar(dt);
  assert.equal(combate.eventos().filter((ev) => ev.tipo === 'aterrizaje').length, 1);
  combate.actualizar(dt);
  assert.equal(combate.eventos().some((ev) => ev.tipo === 'aterrizaje'), false);
});
