import { LUZ } from './config.js';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

const luzEstatica = (d, luz) => {
  const nucleo = Math.exp(-((d / luz.nucleo.radio) ** 2)) * luz.nucleo.intensidad;
  const ambiente = Math.max(0, 1 - d / luz.radio) ** 1.6 * luz.intensidad;
  return 1 - (1 - nucleo) * (1 - ambiente);
};

// La oscuridad es una transmisión por píxel: cada fuente multiplica su parte.
// La planta central tiene luz dinámica (pulso y ondulación); las plantas añadidas tienen mapas precalculados.
export function crearIluminacion({ fondo }) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const pasos = LUZ.niveles - 1;
  const [r, g, b] = fondo;
  let imagen, transmision;
  const fuentes = [];
  const perfiles = new WeakMap();

  function agregarFuente(centro, luz) {
    const R = Math.ceil(luz.radio);
    const x0 = Math.floor(centro.x) - R;
    const y0 = Math.floor(centro.y) - R;
    const dx = centro.x - Math.floor(centro.x);
    const dy = centro.y - Math.floor(centro.y);
    const x1 = Math.ceil(centro.x) + R;
    const y1 = Math.ceil(centro.y) + R;
    const w = x1 - x0 + 1;
    let variantes = perfiles.get(luz);
    if (!variantes) perfiles.set(luz, variantes = new Map());
    const clave = `${dx},${dy}`;
    let valores = variantes.get(clave);
    if (!valores) {
      valores = new Float32Array(w * (y1 - y0 + 1));
      for (let y = 0; y <= y1 - y0; y++) {
        for (let x = 0; x < w; x++) {
          const d = Math.hypot(x + 0.5 - R - dx, y + 0.5 - R - dy);
          valores[y * w + x] = 1 - luzEstatica(d, luz);
        }
      }
      variantes.set(clave, valores);
    }
    const fuente = { x0, y0, x1, y1, w, valores, factor: 1 };
    fuentes.push(fuente);
    return fuente;
  }

  function quitarFuente(fuente) {
    const indice = fuentes.indexOf(fuente);
    if (indice >= 0) fuentes.splice(indice, 1);
  }

  function actualizar(t, impulso, reducido, centro, opacidad, { x: ox, y: oy, ancho, alto }) {
    if (!imagen || canvas.width !== ancho || canvas.height !== alto) {
      canvas.width = ancho;
      canvas.height = alto;
      imagen = ctx.createImageData(ancho, alto);
      transmision = new Float32Array(ancho * alto);
      for (let p = 0; p < imagen.data.length; p += 4) {
        imagen.data[p] = r;
        imagen.data[p + 1] = g;
        imagen.data[p + 2] = b;
      }
    }
    const k = reducido ? 0 : 1;
    const respiracion = Math.sin(t * LUZ.pulso.velocidad);
    const nRad = LUZ.nucleo.radio * (1 + k * (LUZ.pulso.amplitud * respiracion + 0.12 * impulso));
    const nInt = Math.min(1, LUZ.nucleo.intensidad * (1 + k * 0.25 * impulso)) * opacidad;
    const bRad = LUZ.brillo.radio * (1 + k * 0.05 * Math.sin(t * 0.53));
    const bInt = LUZ.brillo.intensidad * (1 + k * 0.1 * Math.sin(t * 0.37 + 2)) * opacidad;
    const aRad = LUZ.ambiente.radio * (1 + k * 0.03 * Math.sin(t * 0.21 + 1));
    const aInt = LUZ.ambiente.intensidad * opacidad;
    const organica = k * LUZ.organica;

    const oscuridad = 1 - LUZ.levantarPenumbra * opacidad;
    transmision.fill(1);
    const radio = Math.ceil(Math.max(nRad * 4, Math.max(aRad, bRad) * (1 + organica)));
    for (let y = Math.max(oy, Math.floor(centro.y - radio)); y < Math.min(oy + alto, Math.ceil(centro.y + radio)); y++) {
      for (let x = Math.max(ox, Math.floor(centro.x - radio)); x < Math.min(ox + ancho, Math.ceil(centro.x + radio)); x++) {
        const dx = x + 0.5 - centro.x;
        const dy = y + 0.5 - centro.y;
        const d = Math.hypot(dx, dy);
        const ondulacion = 1 + organica * Math.sin(5 * Math.atan2(dy, dx) + t * 0.6);
        const df = d / ondulacion;

        const nucleo = Math.exp(-((d / nRad) ** 2)) * nInt;
        const brillo = Math.max(0, 1 - df / bRad) ** 2 * bInt;
        const ambiente = Math.max(0, 1 - df / aRad) ** 1.6 * aInt;
        transmision[(y - oy) * ancho + x - ox] = (1 - nucleo) * (1 - brillo) * (1 - ambiente);
      }
    }

    for (const f of fuentes) {
      if (f.x1 < ox || f.x0 >= ox + ancho || f.y1 < oy || f.y0 >= oy + alto || f.factor <= 0) continue;
      for (let y = Math.max(f.y0, oy); y <= Math.min(f.y1, oy + alto - 1); y++) {
        for (let x = Math.max(f.x0, ox); x <= Math.min(f.x1, ox + ancho - 1); x++) {
          transmision[(y - oy) * ancho + x - ox] *= 1 - f.factor * (1 - f.valores[(y - f.y0) * f.w + (x - f.x0)]);
        }
      }
    }

    for (let y = oy; y < oy + alto; y++) {
      for (let x = ox; x < ox + ancho; x++) {
        const i = (y - oy) * ancho + x - ox;
        const luz = 1 - transmision[i];
        const umbral = (BAYER[((y & 3) << 2) + (x & 3)] + 0.5) / 16;
        const nivel = Math.min(pasos, Math.floor(luz * pasos + umbral));
        const p = i * 4;
        imagen.data[p + 3] = Math.round(255 * (1 - nivel / pasos) * oscuridad);
      }
    }

    ctx.putImageData(imagen, 0, 0);
    return { nRad, nInt, bRad, aRad, k, opacidad };
  }

  return { canvas, actualizar, agregarFuente, quitarFuente };
}
