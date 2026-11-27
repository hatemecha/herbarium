import assert from 'node:assert/strict';
import test from 'node:test';
import { crearCamara } from '../src/camara.js';

test('la cámara conserva el punto del zoom y mantiene la escala entera al cambiar DPR', () => {
  const camara = crearCamara(176);
  const area = { left: 40, top: 20, width: 220, height: 220 };
  camara.ajustar(area, 1.25);
  const punto = { x: 130, y: 122 };
  const ancla = camara.mundo(punto);
  camara.zoom(1, punto);
  assert.equal(camara.vista().escala, 2);
  assert.deepEqual(camara.mundo(punto), ancla);
  camara.ajustar(area, 2);
  assert.equal(camara.vista().escala, 4);
  camara.restablecer();
  assert.equal(camara.vista().escala, 2);
  assert.deepEqual(camara.vista().origen, { x: 62, y: 42 });
});

test('el desplazamiento respeta los cuatro bordes y centra el eje que no desborda', () => {
  const camara = crearCamara(176);
  camara.ajustar({ left: 40, top: 20, width: 500, height: 200 }, 1);
  camara.zoom(20);
  const ancla = { x: 88, y: 88 };
  camara.enfocar(2, ancla, { x: 900, y: 900 });
  assert.deepEqual(camara.vista().origen, { x: 114, y: 20 });
  camara.enfocar(2, ancla, { x: -300, y: -300 });
  assert.deepEqual(camara.vista().origen, { x: 114, y: -132 });
  assert.equal(camara.contiene(539, 219), true);
  assert.equal(camara.contiene(540, 220), false);
});
