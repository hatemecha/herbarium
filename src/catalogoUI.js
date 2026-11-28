import { FEEDBACK } from './config.js';
import { funcionDe } from './ficha.js';
import { alinearSalida, altoLectura, crearRotulo, INTERLINEADO_LECTURA, medirTexto, pintarMarco, pintarTexto, prepararSalida, presentar, repartirTexto, superficie } from './interfazPixel.js';
import { punteroFino } from './entrada.js';
import { rgb } from './paleta.js';
import { LADO_ESTRELLA, pintarEstrellaYTexto } from './sprites/estrella.js';
import { LADO_PALA, PALA } from './sprites/pala.js';

const ANCHO = 72;
const ALTO = 80;
const BOTON_PALA = 22;

function dibujarCarta(ctx, carta, roles, t, reducido, consultada) {
  const { tipo, animador, estado, enfoque, alcanzable } = carta;
  const seleccionada = estado === 'seleccionada';
  const pulso = alcanzable ? Math.max(0, (carta.pulsoHasta - t) / FEEDBACK.oleada) : 0;
  const destello = pulso > 0 && (reducido || pulso > 0.7 || (pulso > 0.2 && pulso < 0.5));
  const falta = Math.max(0, (carta.faltaHasta - t) / FEEDBACK.gesto);
  const borde = falta > 0 ? roles.petalo
    : destello ? roles.energiaUI
      : seleccionada ? roles.marca : carta.boton.matches(':focus-visible') ? roles.tintaUI
        : enfoque || consultada ? roles.marcaSuave : roles.cuadricula;

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
    pintarTexto(ctx, linea, Math.floor((ANCHO - medirTexto(linea)) / 2), 52 + i * 12, rgb(roles.tintaUI));
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
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = rgb(roles.petalo, reducido ? 0.16 : falta > 0.7 ? 0.22 : 0.14);
    ctx.fillRect(0, 0, ANCHO, ALTO);
    ctx.restore();
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

function tintaPala(roles, activa) {
  return {
    w: roles.maderaSombra,
    h: roles.madera,
    H: roles.maderaLuz,
    o: activa ? roles.energiaUI : roles.insectoSombra,
    '#': roles.campana,
    '+': roles.campanaLuz,
    '=': roles.campanaSombra,
  };
}

export function crearCatalogoUI({ contenedor, tipos, animadores, roles, alElegir, alConsultar, alPala }) {
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

  const pala = document.createElement('button');
  pala.type = 'button';
  pala.hidden = true;
  pala.className = 'carta pala';
  pala.dataset.interfaz = '';
  pala.setAttribute('aria-label', 'Pala, retirar planta');
  pala.setAttribute('aria-pressed', 'false');
  pala.addEventListener('click', () => {
    if (pala.disabled) return;
    alPala();
  });
  const dibujoPala = superficie(BOTON_PALA, BOTON_PALA);
  const ctxPala = dibujoPala.getContext('2d');
  ctxPala.imageSmoothingEnabled = false;
  const lienzoPala = document.createElement('canvas');
  lienzoPala.className = 'carta-lienzo';
  lienzoPala.setAttribute('aria-hidden', 'true');
  pala.append(lienzoPala);
  raiz.append(pala, descripcion);
  contenedor.append(raiz);
  const rotulo = crearRotulo(descripcion, '', {
    ancho: () => descripcion.clientWidth, centro: true, interlineado: INTERLINEADO_LECTURA,
  });
  let palaDisponible = false;
  let palaPulsoHasta = 0;

  function pintarPala(activa, t, reducido) {
    const disponible = palaDisponible;
    const borde = !disponible ? roles.cuadricula
      : activa ? roles.energiaUI
        : pala.matches(':focus-visible') ? roles.tintaUI : roles.cuadricula;
    ctxPala.clearRect(0, 0, BOTON_PALA, BOTON_PALA);
    pintarMarco(ctxPala, BOTON_PALA, BOTON_PALA, rgb(roles.terreno), rgb(borde));
    ctxPala.fillStyle = rgb(roles.fondo, 0.5);
    ctxPala.fillRect(3, 3, BOTON_PALA - 6, BOTON_PALA - 6);
    if (pala.matches(':focus-visible') && disponible) {
      ctxPala.fillStyle = rgb(roles.tintaUI);
      ctxPala.fillRect(4, 4, 6, 1);
      ctxPala.fillRect(4, 4, 1, 6);
    }
    ctxPala.globalAlpha = disponible ? 1 : 0.55;
    const margen = (BOTON_PALA - LADO_PALA) / 2;
    const tinta = tintaPala(roles, activa);
    for (const [y, fila] of PALA.entries()) {
      for (const [x, pixel] of [...fila].entries()) {
        const color = tinta[pixel];
        if (!color) continue;
        ctxPala.fillStyle = rgb(color);
        ctxPala.fillRect(margen + x, margen + y, 1, 1);
      }
    }
    ctxPala.globalAlpha = 1;
    const pulso = disponible ? Math.max(0, (palaPulsoHasta - t) / FEEDBACK.oleada) : 0;
    const destello = pulso > 0 && (reducido || pulso > 0.7 || (pulso > 0.2 && pulso < 0.5));
    if (destello) {
      ctxPala.save();
      ctxPala.globalCompositeOperation = 'source-atop';
      ctxPala.fillStyle = rgb(roles.energiaUI, reducido ? 0.10 : pulso > 0.7 ? 0.19 : 0.12);
      ctxPala.fillRect(0, 0, BOTON_PALA, BOTON_PALA);
      ctxPala.restore();
    }
    presentar(dibujoPala, lienzoPala);
  }

  function ajustar() {
    const escala = parseFloat(getComputedStyle(raiz).getPropertyValue('--escala-carta')) || 2;
    const dpr = window.devicePixelRatio || 1;
    const multiplo = Math.max(1, Math.floor(escala * dpr));
    for (const carta of cartas) {
      prepararSalida(carta.lienzo, ANCHO, ALTO, multiplo, dpr);
    }
    prepararSalida(lienzoPala, BOTON_PALA, BOTON_PALA, Math.max(1, Math.floor(2 * dpr)), dpr);
    const alto = altoLectura([...tipos.map((tipo) => tipo.descripcion),
      'Elegí una planta para retirar.', 'Recuperás 999 de energía.'], descripcion.clientWidth, dpr);
    raiz.style.setProperty('--alto-ayuda', `${pala.hidden ? alto : Math.max(44, alto)}px`);
    for (const carta of cartas) alinearSalida(carta.lienzo, dpr);
    alinearSalida(lienzoPala, dpr);
    rotulo.actualizar();
  }

  ajustar();

  return {
    elemento: raiz,
    ajustar,
    actualizar({
      energia, activa, costes, t, reducido, panel, herramienta,
      bloqueado = false, palaLista = true,
    }) {
      const disponible = !bloqueado && palaLista;
      if (disponible && !palaDisponible) palaPulsoHasta = t + FEEDBACK.oleada;
      if (!disponible) palaPulsoHasta = 0;
      palaDisponible = disponible;
      const usandoPala = disponible && herramienta != null;
      if (pala.hidden === palaLista) {
        pala.hidden = !palaLista;
        ajustar();
      }
      pala.disabled = !disponible;
      pala.dataset.estado = !palaLista ? 'cerrada' : usandoPala ? 'seleccionada' : 'disponible';
      pala.setAttribute('aria-pressed', String(usandoPala));
      pala.setAttribute(
        'aria-label',
        bloqueado ? 'Pala, no disponible' : 'Pala, retirar planta',
      );
      if (palaLista) pintarPala(usandoPala, t, reducido);
      const consejo = bloqueado ? ''
        : herramienta ?? (!palaLista && panel == null ? '' : funcionDe(panel)?.consejo) ?? '';
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
          const disponibilidad = bloqueado ? 'compra cerrada' : alcanzable ? 'disponible' : faltan === 1 ? 'falta 1 de energía, consultar' : `faltan ${faltan} de energía, consultar`;
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
