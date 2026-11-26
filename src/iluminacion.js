import { LUZ } from './config.js';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

const luzEstatica = (d, luz) => {
  const nucleo = Math.exp(-((d / luz.nucleo.radio) ** 2)) * luz.nucleo.intensidad;
  const ambiente = Math.max(0, 1 - d / luz.radio) ** 1.6 * luz.intensidad;
  return 1 - (1 - nucleo) * (1 - ambiente);
};

// La oscuridad es una transmisión por píxel: cada fuente multiplica su parte.
// La planta central tiene luz dinámica (pulso y ondulación); las plantas añadidas tienen mapas precalculados.
export function crearIluminacion({ lado, fondo }) {
  const canvas = document.createElement('canvas');
  canvas.width = lado;
  canvas.height = lado;
  const ctx = canvas.getContext('2d');
  const imagen = ctx.createImageData(lado, lado);
  const datos = imagen.data;
  const pasos = LUZ.niveles - 1;
  const [r, g, b] = fondo;
  const transmision = new Float32Array(lado * lado);
  const fuentes = [];

  function agregarFuente(centro, luz) {
    const R = Math.ceil(luz.radio);
    const x0 = Math.max(0, Math.floor(centro.x - R));
    const y0 = Math.max(0, Math.floor(centro.y - R));
    const x1 = Math.min(lado - 1, Math.ceil(centro.x + R));
    const y1 = Math.min(lado - 1, Math.ceil(centro.y + R));
    const w = x1 - x0 + 1;
    const valores = new Float32Array(w * (y1 - y0 + 1));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const d = Math.hypot(x + 0.5 - centro.x, y + 0.5 - centro.y);
        valores[(y - y0) * w + (x - x0)] = 1 - luzEstatica(d, luz);
      }
    }
    const fuente = { x0, y0, x1, y1, w, valores, factor: 1 };
    fuentes.push(fuente);
    return fuente;
  }

  function quitarFuente(fuente) {
    const indice = fuentes.indexOf(fuente);
    if (indice >= 0) fuentes.splice(indice, 1);
  }

  function actualizar(t, impulso, reducido, centro) {
    const k = reducido ? 0 : 1;
    const respiracion = Math.sin(t * LUZ.pulso.velocidad);
    const nRad = LUZ.nucleo.radio * (1 + k * (LUZ.pulso.amplitud * respiracion + 0.12 * impulso));
    const nInt = Math.min(1, LUZ.nucleo.intensidad * (1 + k * 0.25 * impulso));
    const bRad = LUZ.brillo.radio * (1 + k * 0.05 * Math.sin(t * 0.53));
    const bInt = LUZ.brillo.intensidad * (1 + k * 0.1 * Math.sin(t * 0.37 + 2));
    const aRad = LUZ.ambiente.radio * (1 + k * 0.03 * Math.sin(t * 0.21 + 1));
    const aInt = LUZ.ambiente.intensidad;
    const organica = k * LUZ.organica;

    for (let y = 0; y < lado; y++) {
      for (let x = 0; x < lado; x++) {
        const dx = x + 0.5 - centro.x;
        const dy = y + 0.5 - centro.y;
        const d = Math.hypot(dx, dy);
        const ondulacion = 1 + organica * Math.sin(5 * Math.atan2(dy, dx) + t * 0.6);
        const df = d / ondulacion;

        const nucleo = Math.exp(-((d / nRad) ** 2)) * nInt;
        const brillo = Math.max(0, 1 - df / bRad) ** 2 * bInt;
        const ambiente = Math.max(0, 1 - df / aRad) ** 1.6 * aInt;
        transmision[y * lado + x] = (1 - nucleo) * (1 - brillo) * (1 - ambiente);
      }
    }

    for (const f of fuentes) {
      for (let y = f.y0; y <= f.y1; y++) {
        for (let x = f.x0; x <= f.x1; x++) {
          transmision[y * lado + x] *= 1 - f.factor * (1 - f.valores[(y - f.y0) * f.w + (x - f.x0)]);
        }
      }
    }

    for (let y = 0; y < lado; y++) {
      for (let x = 0; x < lado; x++) {
        const i = y * lado + x;
        const luz = 1 - transmision[i];
        const umbral = (BAYER[((y & 3) << 2) + (x & 3)] + 0.5) / 16;
        const nivel = Math.min(pasos, Math.floor(luz * pasos + umbral));
        const p = i * 4;
        datos[p] = r;
        datos[p + 1] = g;
        datos[p + 2] = b;
        datos[p + 3] = Math.round(255 * (1 - nivel / pasos));
      }
    }

    ctx.putImageData(imagen, 0, 0);
    return { nRad, nInt, bRad, aRad, k };
  }

  return { canvas, actualizar, agregarFuente, quitarFuente };
}
