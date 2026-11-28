import { alinearPixel } from './escala.js';

// Terminus usa una celda de 6 × 12 a su tamaño nativo de 12 px.
export const FUENTE_PIXEL = '12px Terminus';
export const AVANCE = 6;
export const BASE_TEXTO = 9;
export const ALTO_TEXTO = 12;
export const INTERLINEADO_LECTURA = 2;
const tinta = new Map();
const posiciones = new WeakMap();
let fuenteLista = false;

export function cargarFuentePixel() {
  return document.fonts.load(FUENTE_PIXEL).then((fuentes) => {
    fuenteLista = fuentes.some((fuente) => fuente.status === 'loaded');
    return fuenteLista;
  });
}

export function superficie(ancho, alto) {
  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  return lienzo;
}

export function medirTexto(texto) {
  return [...texto.normalize('NFC')].length * AVANCE;
}

function glifo(letra, color) {
  const clave = `${color}:${letra}`;
  if (tinta.has(clave)) return tinta.get(clave);
  const lienzo = superficie(AVANCE, ALTO_TEXTO);
  const ctx = lienzo.getContext('2d', { willReadFrequently: true });
  ctx.font = FUENTE_PIXEL;
  ctx.fillText(letra, 0, BASE_TEXTO);
  const mascara = ctx.getImageData(0, 0, AVANCE, ALTO_TEXTO);
  for (let i = 3; i < mascara.data.length; i += 4) {
    mascara.data[i] = mascara.data[i] >= 56 ? 255 : 0;
  }
  ctx.putImageData(mascara, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, AVANCE, ALTO_TEXTO);
  if (fuenteLista) tinta.set(clave, lienzo);
  return lienzo;
}

export function pintarTexto(ctx, texto, x, base, color) {
  for (const letra of texto.normalize('NFC')) {
    if (letra !== ' ') ctx.drawImage(glifo(letra, color), x, base - BASE_TEXTO);
    x += AVANCE;
  }
}

export function pintarMarco(ctx, ancho, alto, fondo, borde, grosor = 1) {
  ctx.fillStyle = fondo;
  ctx.fillRect(2, 0, ancho - 4, alto);
  ctx.fillRect(0, 2, ancho, alto - 4);
  ctx.fillStyle = borde;
  for (let i = 0; i < grosor; i++) {
    ctx.fillRect(i + 2, i, ancho - 4 - 2 * i, 1);
    ctx.fillRect(i + 2, alto - 1 - i, ancho - 4 - 2 * i, 1);
    ctx.fillRect(i, i + 2, 1, alto - 4 - 2 * i);
    ctx.fillRect(ancho - 1 - i, i + 2, 1, alto - 4 - 2 * i);
    for (const x of [1 + i, ancho - 2 - i]) {
      for (const y of [1 + i, alto - 2 - i]) ctx.fillRect(x, y, 1, 1);
    }
  }
  if (grosor === 2) {
    for (const x of [1, ancho - 3]) {
      for (const y of [1, alto - 3]) ctx.fillRect(x, y, 2, 2);
    }
  }
}

export function vestirMarco(elemento, borde, dpr) {
  const k = Math.max(1, Math.round(dpr));
  const clave = `${borde}/${dpr}`;
  if (elemento.dataset.marcoPixel === clave) return;
  elemento.dataset.marcoPixel = clave;
  const origen = superficie(7, 7);
  const salida = superficie(7 * k, 7 * k);
  pintarMarco(origen.getContext('2d'), 7, 7, 'transparent', borde);
  presentar(origen, salida);
  elemento.style.borderImageSource = `url("${salida.toDataURL()}")`;
  elemento.style.borderImageSlice = 3 * k;
  elemento.style.setProperty('--borde-pausa', `${3 * k / dpr}px`);
}

export function prepararSalida(lienzo, ancho, alto, k, dpr) {
  const fisicoX = ancho * k;
  const fisicoY = alto * k;
  if (lienzo.width !== fisicoX || lienzo.height !== fisicoY) {
    lienzo.width = fisicoX;
    lienzo.height = fisicoY;
  }
  let posicion = posiciones.get(lienzo);
  if (!posicion) {
    posicion = document.createElement('span');
    posicion.className = 'pixel-posicion';
    lienzo.before(posicion);
    posicion.append(lienzo);
    posiciones.set(lienzo, posicion);
  }
  posicion.style.width = `${fisicoX / dpr}px`;
  posicion.style.height = `${fisicoY / dpr}px`;
  lienzo.style.width = `${fisicoX}px`;
  lienzo.style.height = `${fisicoY}px`;
  lienzo.dataset.escalaPixel = k;
}

export function colocarSalida(lienzo, izquierda, arriba) {
  const posicion = posiciones.get(lienzo);
  posicion.style.position = 'absolute';
  posicion.style.left = `${izquierda}px`;
  posicion.style.top = `${arriba}px`;
}

export function alinearSalida(lienzo, dpr, limites) {
  const { left, top, width } = posiciones.get(lienzo).getBoundingClientRect();
  if (!width) return;
  // Pintar el canvas a tamaño de backing y proyectarlo 1:1 sobre los píxeles
  // físicos evita el recorte/remuestreo de la caja CSS fraccionaria en Chromium.
  const x = alinearPixel(left, dpr);
  const y = alinearPixel(top, dpr);
  lienzo.style.transform = `matrix(${1 / dpr}, 0, 0, ${1 / dpr}, ${x}, ${y})`;
  if (limites) {
    aplicarRecorte(lienzo, x, y, dpr, limites.left, limites.top,
      limites.left + limites.width, limites.top + limites.height);
  } else recortarSalida(lienzo, x, y, dpr);
}

function recortarSalida(lienzo, x, y, dpr) {
  const dialogo = lienzo.closest('dialog');
  if (!dialogo || lienzo.hasAttribute('data-marco-catalogo')) return;
  const contenido = lienzo.closest('[data-recorte-pixel]');
  const recorte = contenido ?? dialogo;
  const rail = lienzo.closest('.registro-lista');
  const horizontal = rail && getComputedStyle(rail).overflowX === 'auto';
  const area = recorte.getBoundingClientRect();
  const fila = horizontal ? rail.getBoundingClientRect() : area;
  const inicio = Math.max(area.left + recorte.clientLeft, fila.left);
  const limite = Math.min(area.left + recorte.clientLeft + recorte.clientWidth, fila.right);
  const techo = area.top + recorte.clientTop;
  aplicarRecorte(lienzo, x, y, dpr, inicio, techo, limite, techo + recorte.clientHeight);
}

function aplicarRecorte(lienzo, x, y, dpr, izq, top, der, bottom) {
  const arriba = Math.max(0, Math.ceil((top - y) * dpr - 0.001));
  const abajo = Math.max(0, lienzo.height - Math.floor((bottom - y) * dpr + 0.001));
  const izquierda = Math.max(0, Math.ceil((izq - x) * dpr - 0.001));
  const derecha = Math.max(0, lienzo.width - Math.floor((der - x) * dpr + 0.001));
  lienzo.style.clipPath = arriba || derecha || abajo || izquierda
    ? `inset(${arriba}px ${derecha}px ${abajo}px ${izquierda}px)`
    : '';
}

export function presentar(origen, salida) {
  const ctx = salida.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, salida.width, salida.height);
  ctx.drawImage(origen, 0, 0, salida.width, salida.height);
}

export function repartirTexto(texto, maximo) {
  const capacidad = Math.max(1, Math.floor(maximo / AVANCE));
  const lineas = [];
  let linea = '';
  for (const palabra of texto.normalize('NFC').trim().split(/\s+/)) {
    const siguiente = linea ? `${linea} ${palabra}` : palabra;
    if (linea && medirTexto(siguiente) > capacidad * AVANCE) {
      lineas.push(linea);
      linea = palabra;
    } else linea = siguiente;
    while (medirTexto(linea) > capacidad * AVANCE) {
      const letras = [...linea];
      lineas.push(letras.slice(0, capacidad).join(''));
      linea = letras.slice(capacidad).join('');
    }
  }
  lineas.push(linea);
  return lineas;
}

function altoTexto(lineas, interlineado) {
  return lineas * ALTO_TEXTO + (lineas - 1) * interlineado;
}

export function altoLectura(textos, ancho, dpr) {
  const k = Math.max(1, Math.round(2 * dpr));
  const limite = Math.floor(ancho * dpr / k) - 2;
  const lineas = Math.max(...textos.map((texto) => repartirTexto(texto, limite).length));
  return altoTexto(lineas, INTERLINEADO_LECTURA) * k / dpr;
}

// El texto real conserva nombre y lectura. El canvas en flujo controla la tinta y el salto de línea.
export function crearRotulo(padre, valor, { escala = 2, ancho = null, centro = false, cursor = false, pausa = false, interlineado = 0 } = {}) {
  const texto = document.createElement('span');
  const salida = document.createElement('canvas');
  texto.className = 'solo-lector';
  salida.className = 'raster-ui';
  salida.setAttribute('aria-hidden', 'true');
  padre.append(texto, salida);
  let anterior;

  return {
    actualizar(nuevo = valor) {
      valor = nuevo;
      if (texto.textContent !== valor) texto.textContent = valor;
      salida.hidden = !valor;
      const posicion = posiciones.get(salida);
      if (posicion) posicion.hidden = !valor;
      if (!valor || !padre.getClientRects().length) return;
      const dpr = window.devicePixelRatio || 1;
      const k = Math.max(1, Math.round(escala * dpr));
      const margen = pausa ? 9 : cursor ? 6 : 0;
      const lateral = interlineado ? 1 : 0;
      const limite = ancho ? Math.floor(ancho() * dpr / k) - margen - 2 * lateral : Infinity;
      const estilo = getComputedStyle(padre);
      const color = estilo.color;
      const control = cursor && padre.closest('button');
      const marcado = control && (control.getAttribute('aria-pressed') === 'true' || control.matches(':focus-visible'));
      const acento = estilo.getPropertyValue('--spark').trim();
      const clave = JSON.stringify([valor, color, acento, limite, k, dpr, marcado, fuenteLista]);
      if (clave !== anterior) {
        anterior = clave;
        const lineas = repartirTexto(valor, limite);
        const w = Math.max(...lineas.map(medirTexto));
        const origen = superficie(w + margen + 2 * lateral, altoTexto(lineas.length, interlineado));
        const ctx = origen.getContext('2d');
        lineas.forEach((linea, i) => {
          const x = (centro ? Math.floor((w - medirTexto(linea)) / 2) : 0) + margen + lateral;
          pintarTexto(ctx, linea, x, BASE_TEXTO + i * (ALTO_TEXTO + interlineado), color);
        });
        if (marcado) {
          ctx.fillStyle = acento;
          ctx.fillRect(0, 3, 1, 5);
          ctx.fillRect(1, 4, 1, 3);
          ctx.fillRect(2, 5, 1, 1);
        }
        if (pausa) {
          ctx.fillStyle = acento;
          ctx.fillRect(0, 3, 2, 6);
          ctx.fillRect(4, 3, 2, 6);
        }
        prepararSalida(salida, origen.width, origen.height, k, dpr);
        presentar(origen, salida);
      }
      alinearSalida(salida, dpr);
    },
  };
}
