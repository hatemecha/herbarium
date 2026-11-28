import assert from 'node:assert/strict';
import test from 'node:test';
import banco from '../docs/tarot/preguntas.json' with { type: 'json' };
import { ARCANOS, crearEfectosTarot, describirArcano, factorTarot } from '../src/efectosTarot.js';
import { FIRMAS_TAROT, crearTarot, distribucionTarot, probabilidadInversion, tensionComparable } from '../src/tarot.js';
import { ENEMIGOS, PLANTAS } from '../src/catalogo.js';
import { crearDescubrimientos } from '../src/descubrimientos.js';
import { crearJardin } from '../src/jardin.js';
import { crearMundo } from '../src/tablero.js';
import { RECOMPENSAS } from '../src/config.js';
import { crearAleatorio } from '../src/aleatorio.js';
import { crearDirector } from '../src/oleadas.js';
import { crearCombate } from '../src/combate.js';

const ids = Object.keys(ARCANOS).map(Number);
const carta = (id, invertida = false, nivel = 1) => ({ id, invertida, nivel });
const cerca = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, a + ' ≈ ' + b);

test('el banco conserva 120 preguntas, 360 opciones, 12 ejes y 12 pares explícitos', () => {
  assert.equal(banco.preguntas.length, 120);
  assert.equal(Object.keys(banco.ejes).length, 12);
  assert.equal(Object.keys(FIRMAS_TAROT).length, 22);
  assert.equal(new Set(banco.preguntas.map(p => p.id)).size, 120);
  const pares = new Map();
  for (const p of banco.preguntas) {
    assert.ok(p.id.startsWith(p.familia + '-') && p.texto && Object.hasOwn(banco.ejes, p.familia));
    assert.equal(p.respuestas.length, 3);
    assert.deepEqual(new Set(p.respuestas.map(r => r.id)), new Set(['a', 'b', 'c']));
    if (p.contextoComparable) {
      const grupo = pares.get(p.contextoComparable) ?? [];
      grupo.push(p.familia);
      pares.set(p.contextoComparable, grupo);
    }
    for (const r of p.respuestas) {
      assert.ok(r.texto && Object.hasOwn(r.pesos, p.familia));
      for (const [eje, peso] of Object.entries(r.pesos)) {
        assert.ok(Object.hasOwn(banco.ejes, eje) && Number.isInteger(peso) && Math.abs(peso) <= 2);
      }
    }
  }
  assert.equal(pares.size, 12);
  for (const grupo of pares.values()) assert.deepEqual(grupo, [grupo[0], grupo[0]]);
});

test('un ciclo agota el banco, conserva IDs al barajar y rechaza acciones duplicadas u obsoletas', () => {
  const tarot = crearTarot(299, ids);
  const espejo = crearTarot(299, ids);
  const vistas = [];
  const orientaciones = new Set();
  for (let i = 0; i < 132; i++) {
    const vista = tarot.abrir();
    const otra = espejo.abrir();
    assert.deepEqual(vista, otra);
    assert.equal(tarot.abrir(), vista);
    assert.equal(tarot.cerrar(vista), false);
    if (i) assert.equal(tarot.responder(vistas.at(-1), 'a'), null);
    const resultado = tarot.responder(vista, 'a');
    assert.deepEqual(resultado, espejo.responder(otra, 'a'));
    orientaciones.add(resultado.invertida);
    assert.equal(tarot.responder(vista, 'b'), null);
    assert.ok(tarot.cerrar(vista) && espejo.cerrar(otra));
    vistas.push(vista);
  }
  assert.equal(new Set(vistas.slice(0, 120).map(p => p.id)).size, 120);
  assert.ok(new Set(vistas.map(p => p.opciones.map(r => r.id).join(''))).size > 1);
  assert.equal(orientaciones.size, 2);
  assert.equal(tarot.mazo().reduce((suma, c) => suma + c.nivel, 0), 132);
  assert.ok(!vistas.slice(108, 120).some(p => p.id === vistas[120].id));
  assert.deepEqual(crearTarot(299, ids).mazo(), []);
});

test('la afinidad distingue neutralidad explícita, conserva azar y baja la repetición inmediata', () => {
  const distribuir = (actual, historial = {}, vistas = [], ultima) =>
    distribucionTarot([1, 3], actual, historial, new Set(vistas), ultima);
  assert.deepEqual(distribuir({}), [0.5, 0.5]);
  assert.ok(distribuir({ control: -1 })[0] > .5);
  assert.ok(distribuir({ control: -1, decision: 0 })[0] < distribuir({ control: -1 })[0]);
  const pesos = distribuir({ control: -1 }, {}, [1], 1);
  assert.ok(pesos[0] > 0 && pesos[0] < .5);
  cerca(pesos[0] + pesos[1], 1);
});

test('la inversión parte de 10% y solo aumenta en las firmas alcanzadas por un par opuesto vigente', () => {
  assert.equal(tensionComparable(2, undefined, 1), 0);
  assert.equal(tensionComparable(2, 1, 1), 0);
  assert.equal(tensionComparable(2, -2, 13), 0);
  assert.equal(tensionComparable(0, -2, 1), 0);
  assert.equal(tensionComparable(-1, 2, 12), .5);
  assert.equal(probabilidadInversion(1, { control: 1 }), .5);
  assert.equal(probabilidadInversion(3, { control: 1 }), .1);
  cerca(probabilidadInversion(1, { control: .85 }), .44);
});

test('los 16 efectos se componen con orden fijo y niveles acotados', () => {
  const estado = { energia: 100 };
  const a = crearEfectosTarot(estado);
  const b = crearEfectosTarot(estado);
  const cartas = ids.flatMap(id => [carta(id, false, 1000000), carta(id, true, 1000000)]);
  for (const manifestacion of cartas) {
    assert.ok(describirArcano(manifestacion).length);
    a.adquirir(manifestacion);
  }
  for (const manifestacion of cartas.reverse()) b.adquirir(manifestacion);
  const planta = { tipo: PLANTAS.cerbatana, vida: PLANTAS.cerbatana.vida, vidaMax: PLANTAS.cerbatana.vida };
  assert.deepEqual(a.ataque(planta), b.ataque(planta));
  assert.equal(a.precio(10, null, true), b.precio(10, null, true));
  assert.ok(a.energia(1, false, true) >= -estado.energia);
  assert.ok(factorTarot(1000000) < 1.75);
  assert.ok(a.ataque(planta).dano <= PLANTAS.cerbatana.ataque.dano * 4);
});

test('el motor aplica las especializaciones de daño, cadencia, energía y mordida', () => {
  const efectos = crearEfectosTarot({ energia: 100 });
  const planta = { tipo: PLANTAS.cerbatana, vida: 8, vidaMax: PLANTAS.cerbatana.vida };
  efectos.adquirir(carta(1));
  efectos.adquirir(carta(1, true));
  efectos.adquirir(carta(3));
  efectos.adquirir(carta(3, true));
  efectos.adquirir(carta(9));
  efectos.adquirir(carta(9, true));
  efectos.adquirir(carta(14));
  efectos.adquirir(carta(14, true));
  efectos.adquirir(carta(15));
  efectos.adquirir(carta(15, true));
  efectos.adquirir(carta(17));
  efectos.adquirir(carta(17, true));
  efectos.actualizarPlanta(planta, []);
  const base = planta.tipo.ataque;
  cerca(efectos.ataque(planta).dano, base.dano * 2.77);
  cerca(efectos.ataque(planta).intervalo, base.intervalo * 1.15);
  cerca(efectos.energia(1, true, true, 1), 1.25);
  assert.equal(efectos.precio(10), 12);
  assert.equal(efectos.multiplicadorMordida(planta), 1.1);
  const antes = planta.vida;
  efectos.cerrarInvasion([planta]);
  cerca(planta.vida, antes + (planta.vidaMax - antes) * .33);
});

test('vida agrupada conserva la fracción y la pala calcula sobre el precio realmente pagado', () => {
  const estado = { energia: 100, tiempo: 0 };
  const tablero = crearMundo();
  const efectos = crearEfectosTarot(estado);
  const jardin = crearJardin({ estado, tablero, efectos, catalogo: PLANTAS, frames: {} });
  jardin.sembrar('central', tablero.centro);
  const centro = { x: 1, y: 0 };
  const planta = jardin.plantar('cerbatana', centro);
  const vecina = { x: 1, y: 1 };
  jardin.plantar('espino', { x: 0, y: 1 });
  jardin.plantar('espino', { x: 0, y: -1 });
  jardin.adquirirArcano(carta(4));
  jardin.adquirirArcano(carta(4, true));
  planta.vida *= .4;
  const antes = planta.vida;
  for (let i = 0; i < 3; i++) {
    jardin.plantar('espino', vecina);
    cerca(planta.vida / planta.vidaMax, .4);
    assert.ok(planta.vida > antes);
    jardin.retirar(vecina);
    cerca(planta.vida, antes);
  }
  jardin.adquirirArcano(carta(13));
  jardin.adquirirArcano(carta(13, true));
  const normal = jardin.coste('cerbatana');
  jardin.destruir(planta, true);
  const reposicion = jardin.plantar('cerbatana', centro);
  assert.ok(reposicion.costePagado < normal);
  assert.equal(reposicion.enfriamiento, 4);
  assert.equal(jardin.retirar(centro).energia, Math.floor(reposicion.costePagado * .5));
  assert.equal(jardin.coste('cerbatana', centro), normal);
});

test('un premio viejo no puede finalizar un ritual posterior', () => {
  const tablero = crearMundo();
  const director = crearDirector({ tablero, aleatorio: crearAleatorio(9), recompensas: { ...RECOMPENSAS, tarot: true, pesos: { tarot: 1 } } });
  function premio() {
    director.avanzar(40, 0);
    while (director.vista().porSalir) director.avanzar(60, 0);
    director.avanzar(1, 0);
    return director.presentar(3, { energia: 0 });
  }
  const primero = premio();
  assert.ok(director.finalizarTarot(primero));
  const segundo = premio();
  assert.equal(director.finalizarTarot(primero), false);
  assert.ok(director.finalizarTarot(segundo));
});

test('el catálogo guarda solo descubrimientos por orientación y los restaura en nivel uno', () => {
  let json;
  const almacen = () => ({ getItem: () => json, setItem: (_, valor) => { json = valor; } });
  const descubrimientos = crearDescubrimientos(almacen);
  descubrimientos.registrar('tarot', '1:0', '1:1', '1:2', '5:0', 'perfil');
  assert.deepEqual(JSON.parse(json).tarot, ['1:0', '1:1']);
  assert.deepEqual(crearDescubrimientos(almacen).listar('tarot').map(c => [c.id, c.invertida, c.nivel]),
    [[1, false, 1], [1, true, 1]]);
});


test('Estrella actúa al cerrar la invasión una sola vez y congela el combate durante el premio', () => {
  const escenario = crearMundo();
  const estado = { energia: 100, tiempo: 0 };
  const jardin = crearJardin({ estado, tablero: escenario, efectos: crearEfectosTarot(estado), catalogo: PLANTAS, frames: {} });
  jardin.sembrar('central', escenario.centro);
  jardin.adquirirArcano(carta(17));
  jardin.adquirirArcano(carta(17, true));
  const central = jardin.central;
  central.vida /= 2;
  const vida = central.vida;
  const director = crearDirector({ tablero: escenario, aleatorio: crearAleatorio(1) });
  const combate = crearCombate({ tablero: escenario, jardin, tipoEnemigo: ENEMIGOS.escarabajo, director });
  director.avanzar(40, 0);
  while (director.vista().porSalir) director.avanzar(60, 0);
  combate.actualizar(1 / 60);
  const curada = vida * 1.33;
  cerca(central.vida, curada);
  assert.ok(director.enRecompensa());
  const tiempo = combate.tiempo();
  combate.actualizar(1);
  cerca(central.vida, curada);
  assert.equal(combate.tiempo(), tiempo);
});
