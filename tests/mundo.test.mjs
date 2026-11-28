import test from 'node:test';
import assert from 'node:assert/strict';
import { crearAleatorio } from '../src/aleatorio.js';
import { crearCamara } from '../src/camara.js';
import { PLANTAS, ENEMIGOS } from '../src/catalogo.js';
import { crearCombate } from '../src/combate.js';
import { DISTANCIA_ENTRADA } from '../src/config.js';
import { frenteVivo } from '../src/frontera.js';
import { crearJardin } from '../src/jardin.js';
import { crearDirector, generarOleada, puntoDeEntrada } from '../src/oleadas.js';
import { crearMundo } from '../src/tablero.js';

function escenario() {
  const tablero = crearMundo();
  const estado = { energia: 1e6, tiempo: 0 };
  const jardin = crearJardin({ tablero, estado, catalogo: PLANTAS,
    frames: Object.fromEntries(Object.keys(PLANTAS).map(id => [id, []])) });
  jardin.sembrar('central', tablero.centro);
  return { tablero, jardin, estado };
}

test('cada frente y diagonal abre regiones persistentes y permite seguir comprando', () => {
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const { tablero, jardin } = escenario();
    assert.equal(tablero.superficie(), 81);
    assert.equal(tablero.contiene(5 * dx, 5 * dy), false);
    for (let i = 1; i <= 18; i++) assert.ok(jardin.plantar('espino', { x: i * dx, y: i * dy }));
    const exterior = { x: 18 * dx, y: 18 * dy };
    const superficie = tablero.superficie();
    assert.ok(jardin.retirar(exterior));
    assert.equal(tablero.superficie(), superficie);
    assert.equal(tablero.ocupante(exterior.x, exterior.y), null);
    assert.deepEqual(tablero.celdaEnMundo(-0.1, -16.1), { x: -1, y: -2 });
    assert.equal(jardin.colocable('espino', { x: 19 * dx, y: 19 * dy }), false);
  }
});

test('la pala conserva el rearme en coordenadas que colisionaban con y × columnas + x', () => {
  const { jardin } = escenario();
  for (let x = -1; x >= -11; x--) assert.ok(jardin.plantar('cerbatana', { x, y: 0 }));
  assert.ok(jardin.retirar({ x: -11, y: 0 }));
  assert.equal(jardin.plantar('cerbatana', { x: 0, y: -1 }).enfriamiento, 0);
  assert.ok(jardin.plantar('cerbatana', { x: -11, y: 0 }).enfriamiento > 0);
});

test('la unión de discos incluye puestos avanzados y deja libre el frente opuesto', () => {
  const { tablero, jardin } = escenario();
  const oeste = frenteVivo(tablero, Math.PI);
  const puesto = jardin.sembrar('espino', { x: 25, y: 2 });
  assert.deepEqual(frenteVivo(tablero, Math.PI), oeste);
  assert.ok(frenteVivo(tablero, 0).x > 25);
  for (let i = 0; i < 180; i++) {
    const punto = frenteVivo(tablero, i * Math.PI / 90);
    for (const planta of jardin.plantas) {
      assert.ok(Math.hypot(punto.x - planta.celda.x - 0.5, punto.y - planta.celda.y - 0.5) >= DISTANCIA_ENTRADA - 1e-9);
    }
  }
  jardin.destruir(puesto);
  assert.equal(frenteVivo(tablero, 0).x, DISTANCIA_ENTRADA + 0.5);
  assert.ok(tablero.contiene(25, 2));
});

test('el director usa la geometría vigente al emitir cada orden y conserva el plan sembrado', () => {
  const { tablero, jardin } = escenario();
  const semilla = 66;
  const rng = crearAleatorio(semilla);
  const plan = generarOleada({ numero: 1, rng, tablero });
  const director = crearDirector({ tablero, aleatorio: crearAleatorio(semilla) });
  director.avanzar(100, 0);
  const primera = director.avanzar(plan.cola[0].en, 0)[0];
  assert.deepEqual(primera, { id: plan.cola[0].id, lado: plan.cola[0].celda.lado,
    ...puntoDeEntrada(plan.cola[0].celda, false, tablero, rng) });
  const segunda = plan.cola[1];
  const puesto = jardin.sembrar('espino', {
    x: Math.round(16 * Math.cos(segunda.celda.angulo)),
    y: Math.round(16 * Math.sin(segunda.celda.angulo)),
  });
  const ingreso = director.avanzar(segunda.en - plan.cola[0].en + 1e-8, 0)[0];
  assert.deepEqual(ingreso, { id: segunda.id, lado: segunda.celda.lado,
    ...puntoDeEntrada(segunda.celda, false, tablero, rng) });
  assert.ok(Math.hypot(ingreso.x - 0.5, ingreso.y - 0.5) > 16);
  assert.ok(jardin.retirar(puesto.celda));
  assert.ok(Math.hypot(ingreso.x - 0.5, ingreso.y - 0.5) > 16);
});

test('el encuentro individual sin director también usa el frente vivo', () => {
  const { tablero, jardin } = escenario();
  jardin.sembrar('espino', { x: 20, y: 0 });
  const combate = crearCombate({ tablero, jardin, tipoEnemigo: ENEMIGOS.escarabajo,
    aparicion: 0, aleatorio: () => 0 });
  combate.actualizar(1 / 60);
  assert.equal(combate.enemigos.length, 1);
  assert.ok(combate.enemigos[0].x > 24);
});

test('un proyectil cruza una frontera de región sin depender de la cámara', () => {
  const { tablero, jardin } = escenario();
  const combate = crearCombate({ tablero, jardin, tipoEnemigo: ENEMIGOS.escarabajo, aparicion: Infinity });
  jardin.sembrar('cerbatana', { x: -5, y: 0 });
  const enemigo = combate.aparecerEn(-3, 0.5);
  for (let i = 0; i < 18; i++) combate.actualizar(1 / 60);
  assert.ok(enemigo.vida < ENEMIGOS.escarabajo.vida);
});

test('la cámara libre arrastra al zoom base, alinea el mundo y vuelve a la central', () => {
  const camara = crearCamara(16, { centroMundo: { x: 8, y: 8 } });
  const area = { left: 12.23, top: 28.12, width: 363, height: 460 };
  for (const dpr of [1, 1.25, 2, 3]) {
    camara.ajustar(area, dpr);
    camara.restablecer();
    assert.ok(camara.puedeArrastrar());
    const centro = camara.pantalla({ x: 8, y: 8 });
    assert.ok(Math.abs(centro.x - area.left - area.width / 2) <= 0.5 / dpr + 1e-9);
    const extremo = { x: -1023, y: 641 };
    camara.enfocar(camara.vista().escala, extremo, centro);
    assert.ok(Math.abs(camara.mundo(centro).x - extremo.x) < 0.01);
    const region = camara.region();
    assert.ok(region.x % 2 === 0);
    assert.ok(Math.abs(region.left * dpr - Math.round(region.left * dpr)) < 1e-9);
  }
});
