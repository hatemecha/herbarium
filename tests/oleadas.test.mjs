import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BALANCE, OLEADAS } from '../src/config.js';
import { crearAleatorio } from '../src/aleatorio.js';
import { ENEMIGOS, PLANTAS } from '../src/catalogo.js';
import { crearCombate } from '../src/combate.js';
import { crearJardin } from '../src/jardin.js';
import { elegirPatron, generarOleada, maxSimultaneos, presupuestoDe, ventanaDe, crearDirector } from '../src/oleadas.js';
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
  assert.equal(presupuestoDe(1), 12);
  assert.equal(presupuestoDe(2), 17);
  assert.equal(presupuestoDe(12), 141);
  assert.equal(presupuestoDe(13), 159);
  assert.equal(ventanaDe(1), 18);
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

test('la primera oleada son dos escarabajos y tres pulgones, escalonados y en dos zonas', () => {
  const oleada = plan(4, 1);
  assert.equal(oleada.conteo.escarabajo, 2);
  assert.equal(oleada.conteo.pulgon, 3);
  assert.equal(oleada.conteo.oruga, 0);
  assert.equal(oleada.cola.length, 5);
  const tiempos = oleada.cola.map((e) => e.en);
  assert.ok(Math.max(...tiempos) - Math.min(...tiempos) > 2, 'no salen todos juntos');
  const lados = new Set(oleada.cola.map((e) => {
    if (e.y < 1) return 'norte';
    if (e.y > 10) return 'sur';
    if (e.x < 1) return 'oeste';
    return 'este';
  }));
  assert.ok(lados.size >= 2);
});

test('la oruga no entra antes de la tercera oleada y el gasto no pasa el presupuesto', () => {
  for (let semilla = 1; semilla <= 12; semilla++) {
    const segunda = plan(semilla, 2);
    assert.equal(segunda.conteo.oruga, 0);
    assert.ok(segunda.patron === 'concentrada' || segunda.patron === 'pinza');
    const tercera = plan(semilla, 3);
    const suma = tercera.cola.reduce((total, enemigo) => total + amenaza[enemigo.id], 0);
    assert.ok(suma <= tercera.presupuesto);
    assert.ok(tercera.cola.length >= 2);
  }
});

test('un patrón reciente pesa menos que uno nuevo', () => {
  const conCastigo = elegirPatron(4, ['concentrada', 'pinza'], () => 0.2);
  const sinCastigo = elegirPatron(4, [], () => 0.2);
  assert.equal(conCastigo, 'enjambre');
  assert.equal(sinCastigo, 'concentrada');
});

test('el perímetro lleno sigue produciendo apariciones, fuera del tablero y sin bucle', () => {
  const oleada = plan(5, 1, () => true);
  assert.equal(oleada.cola.length, 5);
  for (const enemigo of oleada.cola) {
    const fuera = enemigo.x < 0 || enemigo.y < 0 || enemigo.x >= 11 || enemigo.y >= 11;
    assert.equal(fuera, true);
  }
});

test('el cupo simultáneo aplaza y la oleada cierra cuando no queda nadie', () => {
  const director = crearDirector({ tablero, aleatorio: crearAleatorio(2), ocupante: () => false });
  const dt = 1 / 60;
  while (director.vista().fase === 'preparacion') director.avanzar(dt, 0);
  while (director.vista().porSalir > 0) director.avanzar(5, 0);
  director.avanzar(dt, 0);
  assert.equal(director.vista().numero, 2);
  while (director.vista().fase === 'preparacion') director.avanzar(dt, 0);
  const cupo = maxSimultaneos(2);
  assert.equal(director.avanzar(60, cupo).length, 0);
  assert.equal(director.avanzar(1, cupo - 1).length, 1);
  while (director.vista().porSalir > 0) director.avanzar(5, 0);
  assert.equal(director.vista().fase, 'combate');
  director.avanzar(dt, 0);
  assert.equal(director.vista().fase, 'preparacion');
  assert.equal(director.vista().numero, 3);
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

test('el enjambre comparte dos entradas y concentra las llegadas con el mismo presupuesto', () => {
  const datos = { numero: 9, tablero, ocupado: () => false, patronForzado: 'enjambre' };
  const compacta = generarOleada({ ...datos, rng: crearAleatorio(42) });
  const amplia = generarOleada({ ...datos, rng: crearAleatorio(42), oleadas: { ...OLEADAS, compresionEnjambre: 1 } });
  const anclas = new Set(compacta.cola.map(({ celda }) => celda.lado));
  const llegada = ({ en, id, celda }) =>
    en + Math.hypot(celda.x - tablero.centro.x, celda.y - tablero.centro.y) / BALANCE[id].velocidad;
  const amplitud = ({ cola }) => Math.max(...cola.map(llegada)) - Math.min(...cola.map(llegada));
  assert.equal(anclas.size, 2);
  assert.equal(compacta.presupuesto, amplia.presupuesto);
  assert.deepEqual(compacta.conteo, amplia.conteo);
  assert.ok(amplitud(compacta) < amplitud(amplia));
});
