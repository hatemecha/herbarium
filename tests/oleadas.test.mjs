import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BALANCE } from '../src/config.js';
import { crearAleatorio } from '../src/aleatorio.js';
import { ENEMIGOS, PLANTAS } from '../src/catalogo.js';
import { crearCombate } from '../src/combate.js';
import { crearJardin } from '../src/jardin.js';
import { generarOleada, maxSimultaneos, presupuestoDe, ventanaDe, crearDirector } from '../src/oleadas.js';
import { crearTablero } from '../src/tablero.js';

const tablero = crearTablero();
const amenaza = { pulgon: 2, escarabajo: 3, oruga: 8 };

function plan(semilla, numero, ocupado = () => false) {
  return generarOleada({
    numero,
    rng: crearAleatorio(semilla),
    tablero,
    ocupado,
    recientes: [],
    factor: 1,
  });
}

test('el presupuesto cuadrático corta después de la oleada 12', () => {
  assert.equal(presupuestoDe(1), 34);
  assert.equal(presupuestoDe(2), 66);
  assert.equal(presupuestoDe(12), 936);
  assert.equal(presupuestoDe(13), 1026);
  assert.equal(ventanaDe(1), 45);
  assert.equal(maxSimultaneos(1), 6);
  assert.equal(maxSimultaneos(20), 48);
});

test('la misma semilla repite la oleada y otra semilla puede cambiarla', () => {
  const a = plan(7, 4);
  const b = plan(7, 4);
  const c = plan(8, 4);
  assert.deepEqual(a.cola, b.cola);
  assert.notDeepEqual(a.cola.map((e) => e.en), c.cola.map((e) => e.en));
});

test('la primera invasión puede aparecer por los cuatro lados y conserva su presupuesto', () => {
  const lados = new Set();
  for (let semilla = 1; semilla <= 20; semilla++) {
    const planificado = plan(semilla, 1);
    assert.equal(planificado.conteo.oruga, 0);
    assert.ok(planificado.ventana >= 42);
    assert.equal(planificado.cola.reduce((suma, orden) => suma + amenaza[orden.id], 0), planificado.presupuesto);
    assert.ok(planificado.cola.at(-1).en - planificado.cola[0].en > 40);
    for (const orden of planificado.cola) lados.add(orden.celda.lado);
  }
  assert.equal(lados.size, 4);
});

test('el cupo aplaza entradas y un superviviente conserva el combate sin dar energía indefinida', () => {
  const director = crearDirector({ tablero, aleatorio: crearAleatorio(2) });
  director.avanzar(20, 0);
  const cupo = maxSimultaneos(1);
  assert.deepEqual(director.avanzar(60, cupo), []);
  assert.equal(director.avanzar(1, cupo - 1).length, 1);
  while (director.vista().porSalir > 0) director.avanzar(5, 0);
  assert.equal(director.vista().fase, 'combate');
  director.avanzar(300, 1);
  assert.equal(director.vista().fase, 'combate');
  assert.equal(director.generaEnergia(), false);
  director.avanzar(1 / 60, 0);
  const vista = director.vista();
  assert.equal(vista.fase, 'recompensa');
  assert.equal(vista.numero, 1);
  assert.equal(director.generaEnergia(), false);
  assert.deepEqual(director.avanzar(30, 0), []);
  assert.deepEqual(director.vista(), vista);
  const estado = { energia: 0 };
  assert.equal(director.presentar(1, estado), null);
  const premio = director.presentar(0, estado, { continuar: true });
  assert.deepEqual(premio, vista.resultado);
  assert.equal(estado.energia, premio.energia);
  assert.equal(director.presentar(0, estado, { continuar: true }), null);
  assert.equal(director.vista().numero, 2);
  assert.equal(director.vista().fase, 'preparacion');
});
test('tras la derrota el director no sigue soltando enemigos', () => {
  const estado = { energia: 0 };
  const jardin = crearJardin({ tablero, estado, catalogo: PLANTAS, frames: {} });
  jardin.sembrar('central', tablero.centro);
  const director = crearDirector({ tablero, aleatorio: crearAleatorio(1), ocupante: () => false });
  const combate = crearCombate({
    tablero,
    jardin,
    tipoEnemigo: ENEMIGOS.escarabajo,
    catalogoEnemigos: ENEMIGOS,
    director,
    aleatorio: () => 0.2,
  });
  jardin.central.vida = 0;
  jardin.destruir(jardin.central);
  for (let i = 0; i < 90; i++) combate.actualizar(1);
  assert.equal(combate.enemigos.length, 0);
  assert.equal(combate.derrota(), true);
});

test('un espino devuelve daño por mordida y no encadena', () => {
  const estado = { energia: 100 };
  const jardin = crearJardin({ tablero, estado, catalogo: PLANTAS, frames: { espino: [] } });
  jardin.sembrar('central', tablero.centro);
  jardin.sembrar('espino', { x: 5, y: 4 });
  const combate = crearCombate({
    tablero,
    jardin,
    tipoEnemigo: ENEMIGOS.escarabajo,
    aparicion: Infinity,
    aleatorio: () => 0.2,
  });
  const enemigo = combate.aparecerEn(5.5, 3.6);
  const vida = enemigo.vida;
  combate.actualizar(1 / 60);
  const reflejos = combate.eventos().filter((evento) => evento.tipo === 'reflejo');
  assert.equal(reflejos.length, 1);
  assert.equal(enemigo.vida, vida - BALANCE.espino.reflejo);
  assert.equal(enemigo.colorImpacto, 'ambiental');
  assert.equal(tablero.ocupante(5, 4).vida, BALANCE.espino.vida - BALANCE.escarabajo.dano);
});
