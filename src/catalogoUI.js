import { FEEDBACK } from './config.js';
import { funcionDe } from './ficha.js';
import { alinearSalida, altoLectura, crearRotulo, INTERLINEADO_LECTURA, medirTexto, pintarMarco, pintarTexto, prepararSalida, presentar, repartirTexto, superficie } from './interfazPixel.js';
import { punteroFino } from './entrada.js';
import { rgb } from './paleta.js';
import { LADO_ESTRELLA, pintarEstrellaYTexto } from './sprites/estrella.js';

const ANCHO = 72;
const ALTO = 80;
function dibujarCarta(ctx, carta, roles, t, reducido, consultada) {
  const { tipo, animador, estado, enfoque, alcanzable } = carta;
  const seleccionada = estado === 'seleccionada';
  const pulso = alcanzable ? Math.max(0, (carta.pulsoHasta - t) / FEEDBACK.oleada) : 0;
  const destello = pulso > 0 && (reducido || pulso > 0.7 || (pulso > 0.2 && pulso < 0.5));
  const borde = destello ? roles.energiaUI
    : seleccionada ? roles.marca : carta.boton.matches(':focus-visible') ? roles.tintaUI
      : enfoque || consultada ? roles.marcaSuave : roles.cuadricula;
  const falta = estado === 'insuficiente' ? Math.max(0, (carta.faltaHasta - t) / FEEDBACK.gesto) : 0;

  ctx.clearRect(0, 0, ANCHO, ALTO);
  ctx.globalAlpha = 1;

  pintarMarco(ctx, ANCHO, ALTO, rgb(roles.terreno), rgb(borde));
  ctx.fillStyle = rgb(roles.fondo, 0.5);
  ctx.fillRect(3, 3, ANCHO - 6, ALTO - 6);
  if (carta.boton.matches(':focus-visible')) {
    ctx.fillStyle = rgb(roles.tintaUI);
    ctx.fillRect(4, 4, 6, 1);
    ctx.fillRect(4, 4, 1, 6);
  }

  ctx.globalAlpha = alcanzable ? 1 : 0.36;
  ctx.drawImage(animador.fotograma(), 20, 8, 32, 32);
  ctx.globalAlpha = 1;

  repartirTexto(tipo.nombre, ANCHO - 8).forEach((linea, i) => {
    pintarTexto(ctx, linea, Math.floor((ANCHO - medirTexto(linea)) / 2), 52 + i * 9, rgb(roles.tintaUI));
  });

  const coste = String(carta.coste);
  const anchoCoste = medirTexto(coste);
  const x = Math.floor((ANCHO - anchoCoste - LADO_ESTRELLA - 2) / 2);
  pintarEstrellaYTexto(
    ctx,
    x,
    66,
    coste,
    rgb(alcanzable ? roles.energiaUI : roles.marcaSuave),
    rgb(alcanzable ? roles.energiaUI : roles.tintaUI),
  );

  if (estado === 'insuficiente') {
    ctx.fillStyle = rgb(roles.marcaSuave);
    ctx.fillRect(60, 10, 5, 4);
    ctx.fillRect(61, 7, 3, 1);
    ctx.fillRect(60, 8, 1, 2);
    ctx.fillRect(64, 8, 1, 2);
  }
  if (falta > 0) {
    ctx.fillStyle = rgb(roles.petalo, reducido ? 1 : falta);
    ctx.fillRect(8, ALTO - 5, ANCHO - 16, 1);
  }
  if (destello) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = rgb(roles.energiaUI, reducido ? 0.10 : pulso > 0.7 ? 0.19 : 0.12);
    ctx.fillRect(0, 0, ANCHO, ALTO);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

export function crearCatalogoUI({ contenedor, tipos, animadores, roles, alElegir, alConsultar }) {
  const raiz = document.createElement('div');
  const descripcion = document.createElement('p');
  descripcion.className = 'catalogo-descripcion';
  descripcion.setAttribute('aria-hidden', 'true');
  raiz.className = 'catalogo';
  raiz.dataset.interfaz = '';
  raiz.setAttribute('role', 'group');
  raiz.setAttribute('aria-label', 'Plantas disponibles');

  const cartas = tipos.map((tipo) => {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'carta';
    boton.dataset.interfaz = '';
    boton.dataset.tipo = tipo.id;
    boton.setAttribute('aria-description', tipo.descripcion);
    boton.setAttribute('aria-label', `${tipo.nombre}, coste ${tipo.coste} de energía`);

    const lienzo = document.createElement('canvas');
    lienzo.className = 'carta-lienzo';
    lienzo.setAttribute('aria-hidden', 'true');
    boton.append(lienzo);

    const origen = superficie(ANCHO, ALTO);
    const ctx = origen.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const carta = {
      tipo,
      boton,
      lienzo,
      origen,
      ctx,
      animador: animadores[tipo.id],
      estado: null,
      pulsoHasta: 0,
      faltaHasta: 0,
      ultimoT: 0,
      enfoque: false,
      coste: tipo.coste,
      alcanzable: false,
      faltan: null,
    };

    boton.addEventListener('pointerenter', (e) => {
      if (punteroFino(e)) {
        carta.enfoque = true;
        alConsultar(tipo.id);
      }
    });
    boton.addEventListener('pointerleave', () => {
      carta.enfoque = false;
      alConsultar(null);
    });
    boton.addEventListener('focus', () => alConsultar(tipo.id));
    boton.addEventListener('blur', () => alConsultar(null));
    boton.addEventListener('click', () => {
      if (!carta.alcanzable) carta.faltaHasta = carta.ultimoT + FEEDBACK.gesto;
      alElegir(tipo.id);
    });
    raiz.append(boton);
    return carta;
  });

  raiz.append(descripcion);
  contenedor.append(raiz);
  const rotulo = crearRotulo(descripcion, '', {
    ancho: () => descripcion.clientWidth, centro: true, interlineado: INTERLINEADO_LECTURA,
  });

  function ajustar() {
    const escala = parseFloat(getComputedStyle(raiz).getPropertyValue('--escala-carta')) || 2;
    const dpr = window.devicePixelRatio || 1;
    const multiplo = Math.max(1, Math.floor(escala * dpr));
    for (const carta of cartas) {
      prepararSalida(carta.lienzo, ANCHO, ALTO, multiplo, dpr);
    }
    const alto = altoLectura(tipos.map((tipo) => tipo.descripcion), descripcion.clientWidth, dpr);
    raiz.style.setProperty('--alto-ayuda', `${alto}px`);
    for (const carta of cartas) alinearSalida(carta.lienzo, dpr);
    rotulo.actualizar();
  }

  ajustar();

  return {
    elemento: raiz,
    ajustar,
    actualizar({ energia, activa, costes, t, reducido, panel, bloqueado = false }) {
      const consejo = bloqueado ? '' : funcionDe(panel)?.consejo ?? '';
      if (descripcion.textContent !== consejo) rotulo.actualizar(consejo);
      for (const carta of cartas) {
        carta.ultimoT = t;
        const coste = costes?.[carta.tipo.id] ?? carta.tipo.coste;
        const seleccionada = !bloqueado && activa === carta.tipo.id;
        const alcanzable = !bloqueado && energia >= coste;
        const estado = bloqueado ? 'cerrada' : seleccionada ? 'seleccionada' : alcanzable ? 'disponible' : 'insuficiente';
        const faltan = Math.max(0, Math.ceil(coste - energia));
        if (carta.estado !== null && alcanzable && !carta.alcanzable) {
          carta.pulsoHasta = t + FEEDBACK.oleada;
        }
        if (carta.estado !== estado || carta.coste !== coste || carta.faltan !== faltan) {
          carta.estado = estado;
          carta.coste = coste;
          carta.faltan = faltan;
          carta.boton.dataset.estado = estado;
          carta.boton.disabled = bloqueado;
          carta.boton.setAttribute('aria-pressed', String(seleccionada));
          const disponibilidad = bloqueado ? 'jardín caído' : alcanzable ? 'disponible' : faltan === 1 ? 'falta 1 de energía, consultar' : `faltan ${faltan} de energía, consultar`;
          const funcion = carta.tipo.funcion ? `${carta.tipo.funcion}, ` : '';
          carta.boton.setAttribute('aria-label', `${carta.tipo.nombre}, ${funcion}coste ${coste} de energía, ${disponibilidad}`);
        }
        if (!alcanzable) carta.pulsoHasta = 0;
        carta.alcanzable = alcanzable;
        const consultada = !bloqueado && panel === carta.tipo.id;
        carta.boton.toggleAttribute('data-consulta', consultada);
        dibujarCarta(carta.ctx, carta, roles, t, reducido, consultada);
        presentar(carta.origen, carta.lienzo);
      }
    },
    destruir() {
      raiz.remove();
    },
  };
}
