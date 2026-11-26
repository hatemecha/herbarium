import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BALANCE } from '../src/config.js';
import { ENEMIGOS } from '../src/catalogo.js';
import { crearEnemigo, elevacion, estadoVisual, fotogramaEnemigo } from '../src/entidades/enemigo.js';
import { MATRIZ as ESCARABAJO } from '../src/sprites/escarabajo.js';
import { FOTOGRAMA as FOTOGRAMA_ORUGA, MATRIZ as ORUGA, VARIANTES as VARIANTES_ORUGA } from '../src/sprites/oruga.js';
import { MATRIZ as PULGON, VARIANTES as VARIANTES_PULGON } from '../src/sprites/pulgon.js';

const opacos = (filas) => filas.join('').replaceAll('.', '').length;

function ancho(filas, cuerpo) {
  let minX = 16;
  let maxX = -1;
  filas.forEach((fila) => [...fila].forEach((codigo, x) => {
    if (cuerpo.includes(codigo)) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
  }));
  return maxX - minX + 1;
}

test('las tres especies conservan las estadísticas iniciales', () => {
  assert.equal(ENEMIGOS.escarabajo.vida, 12);
  assert.equal(ENEMIGOS.escarabajo.velocidad, 0.5);
  assert.equal(ENEMIGOS.pulgon.vida, BALANCE.pulgon.vida);
  assert.equal(ENEMIGOS.pulgon.velocidad, 1.05);
  assert.equal(ENEMIGOS.oruga.vida, 28);
  assert.equal(ENEMIGOS.oruga.velocidad, 0.28);
  assert.equal(ENEMIGOS.oruga.amenaza, 8);
});

test('todos los cuadros de insectos permanecen en la grilla y usan códigos de su sprite', () => {
  for (const { arte } of Object.values(ENEMIGOS)) {
    assert.equal(arte.matriz.length, 16);
    for (const fila of arte.matriz) {
      assert.equal(fila.length, 16);
      for (const codigo of fila) assert.ok(codigo === '.' || arte.codigos[codigo]);
    }
    for (const variante of arte.variantes) {
      for (const [x, y, codigo] of variante) {
        assert.ok(x >= 0 && x < 16 && y >= 0 && y < 16);
        assert.ok(codigo === '.' || arte.codigos[codigo]);
      }
    }
  }
});

test('las alas forman una pieza conectada al cuerpo en cada cuadro de vuelo', () => {
  for (const { id, arte } of [ENEMIGOS.escarabajo, ENEMIGOS.pulgon]) {
    for (const variante of arte.variantes) {
      const filas = arte.matriz.map((fila) => [...fila]);
      for (const [x, y, codigo] of variante) filas[y][x] = codigo;
      const alas = new Map();
      filas.forEach((fila, y) => fila.forEach((codigo, x) => {
        if (codigo === 'w' || codigo === 'W') alas.set(`${x},${y}`, [x, y]);
      }));
      if (alas.size === 0) continue;

      const grupo = [alas.values().next().value];
      alas.delete(grupo[0].join(','));
      let unida = false;
      for (const [x, y] of grupo) {
        for (const [a, b] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
          if (alas.delete(`${a},${b}`)) grupo.push([a, b]);
          if ('dEehgk'.includes(filas[b]?.[a] ?? '.')) unida = true;
        }
      }
      assert.ok(unida && alas.size === 0, `ala separada del cuerpo de ${id}`);
    }
  }
});

test('el pulgón es bastante más chico que el escarabajo y la oruga cambia de largo', () => {
  assert.ok(opacos(PULGON) < opacos(ESCARABAJO) * 0.55);
  assert.ok(ancho(PULGON, 'deEk') <= 6);
  assert.ok(VARIANTES_PULGON[1].some((parche) => parche[2] === 'w' || parche[2] === 'W'));
  const extendida = VARIANTES_ORUGA[FOTOGRAMA_ORUGA.extendida];
  const contraida = VARIANTES_ORUGA[FOTOGRAMA_ORUGA.contraida];
  assert.ok(extendida.length > 0 && contraida.length > 0);
  assert.notDeepEqual(extendida, contraida);
  assert.ok(ancho(ORUGA, 'deEgk') >= 8);
});

test('la oruga no se eleva y el pulgón vuela más bajo que el escarabajo', () => {
  const suelo = crearEnemigo({ x: 1, y: 1, tipo: ENEMIGOS.oruga, desfase: 0.2 });
  const ala = crearEnemigo({ x: 1, y: 1, tipo: ENEMIGOS.pulgon, desfase: 0 });
  const caparazon = crearEnemigo({ x: 1, y: 1, tipo: ENEMIGOS.escarabajo, desfase: 0 });
  assert.equal(estadoVisual(suelo), 'avance');
  assert.equal(elevacion(suelo, false), 0);
  assert.ok(elevacion(ala, true) < elevacion(caparazon, true));
  suelo.reloj = 0.4;
  const a = fotogramaEnemigo(suelo, false);
  suelo.reloj = 0.8;
  assert.notEqual(fotogramaEnemigo(suelo, false), a);
});
