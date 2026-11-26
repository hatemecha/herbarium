import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BALANCE, INSECTO } from '../src/config.js';
import { ENEMIGOS } from '../src/catalogo.js';
import { FOTOGRAMA, MATRIZ, CODIGOS, VARIANTES } from '../src/sprites/escarabajo.js';
import { crearEnemigo, elevacion, estadoVisual, fotogramaEnemigo } from '../src/entidades/enemigo.js';
import { crearRoles } from '../src/paleta.js';

const tipo = ENEMIGOS.escarabajo;
const nuevo = (extra = {}) => crearEnemigo({ x: 0.5, y: 5.5, tipo, ...extra });

const PALETA_BASE = {
  bg: [11, 13, 17],
  panel: [16, 20, 27],
  hover: [20, 24, 32],
  line: [42, 49, 64],
  muted: [139, 147, 163],
  ink: [232, 234, 239],
  'active-bg': [213, 218, 227],
  'active-ink': [16, 19, 26],
  brand: [255, 59, 122],
  spark: [194, 255, 61],
};

const matiz = ([r, g, b]) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return (h * 60 + 360) % 360;
};
const luminancia = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const distanciaMatiz = (a, b) => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};

test('el escarabajo tiene un cuadro base de 16×16 y todos sus códigos tienen rol', () => {
  assert.equal(MATRIZ.length, 16);
  for (const fila of MATRIZ) assert.equal(fila.length, 16);
  const usados = new Set(MATRIZ.join('') + VARIANTES.flat().map((p) => p[2]).join(''));
  for (const codigo of usados) {
    if (codigo === '.') continue;
    assert.ok(CODIGOS[codigo], `código sin rol: ${codigo}`);
  }
});

test('el cuerpo del caparazón mide entre 8 y 11 píxeles de ancho', () => {
  let minX = 16;
  let maxX = -1;
  MATRIZ.forEach((fila, y) => {
    [...fila].forEach((codigo, x) => {
      if (!'dEehr'.includes(codigo)) return;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    });
  });
  const ancho = maxX - minX + 1;
  assert.ok(ancho >= 8 && ancho <= 11, `ancho del caparazón ${ancho}`);
});

test('las variantes de vuelo solo añaden alas, sin tocar el cuerpo', () => {
  for (const nombre of ['vueloAlto', 'vueloMedio', 'vueloBajo']) {
    const parches = VARIANTES[FOTOGRAMA[nombre]];
    assert.ok(parches.length > 0, `${nombre} sin parches`);
    for (const [, , codigo] of parches) {
      assert.ok(codigo === 'w' || codigo === 'W', `${nombre} altera ${codigo}`);
    }
  }
});

test('el reposo es el cuadro base y el resto de variantes son parches sobre él', () => {
  assert.deepEqual(VARIANTES[FOTOGRAMA.posado], []);
  for (const [nombre, indice] of Object.entries(FOTOGRAMA)) {
    assert.ok(Array.isArray(VARIANTES[indice]), `variante ${nombre}`);
  }
});

test('un escarabajo recién llegado vuela y sus alas cambian en el ciclo de aleteo', () => {
  const e = nuevo();
  assert.equal(estadoVisual(e), 'vuelo');
  const vistos = new Set();
  for (let t = 0; t < 0.2; t += 0.01) {
    e.reloj += 0.01;
    vistos.add(fotogramaEnemigo(e, false));
  }
  for (const alas of [FOTOGRAMA.vueloAlto, FOTOGRAMA.vueloMedio, FOTOGRAMA.vueloBajo]) {
    assert.ok(vistos.has(alas), `falta el cuadro ${alas}`);
  }
});

test('con movimiento reducido el vuelo queda en un cuadro fijo', () => {
  const e = nuevo();
  const vistos = new Set();
  for (let i = 0; i < 20; i++) {
    e.reloj += 0.05;
    vistos.add(fotogramaEnemigo(e, true));
  }
  assert.deepEqual([...vistos], [FOTOGRAMA.vueloMedio]);
});

test('al fijar objetivo primero aterriza y luego alimenta', () => {
  const e = nuevo();
  e.objetivo = { muerta: false };
  e.tiempoEnObjetivo = 0;
  assert.equal(estadoVisual(e), 'aterrizaje');
  assert.equal(fotogramaEnemigo(e, false), FOTOGRAMA.vueloBajo);
  e.tiempoEnObjetivo = BALANCE.visual.aterrizaje / 2 + 0.01;
  assert.equal(fotogramaEnemigo(e, false), FOTOGRAMA.aterrizaje);
  e.tiempoEnObjetivo = BALANCE.visual.aterrizaje + 0.01;
  assert.equal(estadoVisual(e), 'alimentacion');
});

test('la mordida muestra la cabeza baja y el reposo vuelve después', () => {
  const e = nuevo();
  e.objetivo = { muerta: false };
  e.tiempoEnObjetivo = 5;
  e.mordisco = BALANCE.visual.mordisco;
  assert.equal(fotogramaEnemigo(e, false), FOTOGRAMA.alimentacion);
  e.mordisco = 0;
  assert.notEqual(fotogramaEnemigo(e, false), FOTOGRAMA.alimentacion);
});

test('al perder su planta el escarabajo despega antes de volver a volar', () => {
  const e = nuevo();
  e.despegue = BALANCE.visual.despegue;
  assert.equal(estadoVisual(e), 'despegue');
  assert.equal(fotogramaEnemigo(e, false), FOTOGRAMA.vueloAlto);
  e.despegue = 0;
  assert.equal(estadoVisual(e), 'vuelo');
});

test('un escarabajo muerto se queda posado mientras se desintegra', () => {
  const e = nuevo();
  e.muerto = true;
  assert.equal(estadoVisual(e), 'caido');
  assert.equal(fotogramaEnemigo(e, false), FOTOGRAMA.posado);
  assert.equal(elevacion(e, false), 0);
});

test('la altura visual sube en vuelo, baja al aterrizar y es cero al alimentarse', () => {
  const e = nuevo();
  const vuelo = [];
  for (let i = 0; i < 100; i++) {
    e.reloj = i * 0.02;
    vuelo.push(elevacion(e, false));
  }
  assert.ok(Math.min(...vuelo) >= INSECTO.altura - 1 && Math.max(...vuelo) <= INSECTO.altura + 1);
  assert.equal(elevacion(e, true), INSECTO.altura, 'con movimiento reducido no oscila');

  e.objetivo = { muerta: false };
  e.tiempoEnObjetivo = 0;
  assert.equal(elevacion(e, false), INSECTO.altura);
  e.tiempoEnObjetivo = BALANCE.visual.aterrizaje;
  assert.equal(elevacion(e, false), 0);
  e.tiempoEnObjetivo = BALANCE.visual.aterrizaje + 1;
  assert.equal(elevacion(e, false), 0, 'alimentándose queda en el suelo');
});

test('la oscilación visual no cambia la posición lógica del escarabajo', () => {
  const e = nuevo();
  const x = e.x;
  const y = e.y;
  for (let i = 0; i < 60; i++) {
    e.reloj += 1 / 60;
    fotogramaEnemigo(e, false);
    elevacion(e, false);
  }
  assert.equal(e.x, x);
  assert.equal(e.y, y);
});

test('los roles del insecto se derivan de la marca y existen para cada código del sprite', () => {
  const roles = crearRoles(PALETA_BASE);
  for (const rol of Object.values(CODIGOS)) {
    assert.ok(Array.isArray(roles[rol]), `rol ausente: ${rol}`);
  }
});

test('el caparazón se separa del fondo y la luz sube por sus tonos', () => {
  const roles = crearRoles(PALETA_BASE);
  assert.ok(luminancia(roles.fondo) < luminancia(roles.insectoSombra));
  assert.ok(luminancia(roles.insectoSombra) < luminancia(roles.insecto));
  assert.ok(luminancia(roles.insecto) < luminancia(roles.insectoLuz));
  assert.ok(luminancia(roles.ala) < luminancia(roles.alaBorde));
  assert.ok(luminancia(roles.insectoBrillo) > luminancia(roles.insectoLuz));
});

test('el violeta del insecto queda separado de la chispa y de la marca', () => {
  const roles = crearRoles(PALETA_BASE);
  const violeta = matiz(roles.insectoLuz);
  assert.ok(distanciaMatiz(violeta, matiz(PALETA_BASE.spark)) > 60);
  assert.ok(distanciaMatiz(violeta, matiz(PALETA_BASE.brand)) > 30);
});

test('con otra marca la familia del insecto cambia y sigue siendo legible', () => {
  const otra = { ...PALETA_BASE, brand: [59, 122, 255] };
  const roles = crearRoles(otra);
  assert.ok(distanciaMatiz(matiz(roles.insectoLuz), matiz(crearRoles(PALETA_BASE).insectoLuz)) > 20);
  assert.ok(luminancia(roles.fondo) < luminancia(roles.insectoLuz));
});
