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
  const lejos = combate.aparecerEn(5.5, 2.8);
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
  for (const orden of director.avanzar(60, 0)) {
    assert.ok(orden.x < 0 || orden.y < 0 || orden.x >= tablero.columnas || orden.y >= tablero.filas);
  }
  assert.equal(director.vista().porSalir, 0);
});

test('las oleadas largas consumen su presupuesto sin el tope anterior de unidades', () => {
  const tablero = crearTablero();
  const plan = generarOleada({ numero: 160, tablero, rng: crearAleatorio(42), ocupado: () => false });
  const gastado = plan.cola.reduce((suma, enemigo) => suma + BALANCE[enemigo.id].amenaza, 0);
  assert.equal(gastado, plan.presupuesto);
  assert.ok(plan.cola.length > 480);
});

test('la pinza compensa las velocidades para aproximar las llegadas de ambos lados', () => {
  const tablero = crearTablero();
  const plan = generarOleada({
    numero: 5, tablero, rng: crearAleatorio(2), ocupado: () => false, patronForzado: 'pinza',
  });
  const llegadas = new Map();
  for (const orden of plan.cola) {
    const { x, y, lado } = orden.celda;
    const llegada = orden.en + Math.hypot(x - tablero.centro.x, y - tablero.centro.y) / BALANCE[orden.id].velocidad;
    llegadas.set(lado, Math.min(llegadas.get(lado) ?? Infinity, llegada));
  }
  assert.equal(llegadas.size, 2);
  const [a, b] = llegadas.values();
  assert.ok(Math.abs(a - b) < 4);
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
