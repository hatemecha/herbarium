import { FEEDBACK } from './config.js';
import { funcionDe } from './ficha.js';
import { punteroFino } from './entrada.js';
import { rgb } from './paleta.js';
import { LADO_ESTRELLA, pintarEstrellaYTexto } from './sprites/estrella.js';

const ANCHO = 72;
const ALTO = 80;
const FUENTE = '11px MonoMEK, ui-monospace, monospace';
function dibujarCarta(ctx, carta, roles, t, reducido, consultada) {
  const { tipo, animador, estado, enfoque, alcanzable } = carta;
  const seleccionada = estado === 'seleccionada';
  const borde = seleccionada ? roles.marca : enfoque || consultada ? roles.marcaSuave : roles.cuadricula;
  const pulso = estado === 'cerrada' ? 0 : Math.max(0, (carta.pulsoHasta - t) / FEEDBACK.gesto);
  const compra = estado === 'cerrada' ? 0 : Math.max(0, (carta.compraHasta - t) / FEEDBACK.oleada);
  const falta = Math.max(0, (carta.faltaHasta - t) / FEEDBACK.gesto);

  ctx.clearRect(0, 0, ANCHO, ALTO);
  ctx.globalAlpha = 1;

  ctx.fillStyle = rgb(roles.terreno);
  ctx.fillRect(2, 0, ANCHO - 4, ALTO);
  ctx.fillRect(0, 2, ANCHO, ALTO - 4);
  ctx.fillStyle = rgb(roles.fondo, 0.5);
  ctx.fillRect(3, 3, ANCHO - 6, ALTO - 6);

  ctx.fillStyle = rgb(borde);
  ctx.fillRect(2, 0, ANCHO - 4, 1);
  ctx.fillRect(2, ALTO - 1, ANCHO - 4, 1);
  ctx.fillRect(0, 2, 1, ALTO - 4);
  ctx.fillRect(ANCHO - 1, 2, 1, ALTO - 4);
  for (const x of [1, ANCHO - 2]) for (const y of [1, ALTO - 2]) ctx.fillRect(x, y, 1, 1);

  ctx.globalAlpha = alcanzable ? 1 : 0.58;
  ctx.drawImage(animador.fotograma(), 20, 8, 32, 32);
  ctx.globalAlpha = 1;

  ctx.font = FUENTE;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.fillStyle = rgb(roles.tintaUI);
  ctx.fillText(tipo.nombre, ANCHO / 2, 46, ANCHO - 16);

  const coste = String(carta.coste);
  const anchoCoste = ctx.measureText(coste).width;
  const x = Math.floor((ANCHO - anchoCoste - LADO_ESTRELLA - 2) / 2);
  ctx.textAlign = 'left';
  pintarEstrellaYTexto(
    ctx,
    x,
    66,
    coste,
    rgb(alcanzable ? roles.energiaUI : roles.marcaSuave),
    rgb(alcanzable ? roles.energiaUI : roles.tintaUI),
  );

  if (compra > 0 || pulso > 0 || seleccionada) {
    const intensidad = reducido || seleccionada ? 1 : compra || pulso;
    ctx.fillStyle = rgb(compra > 0 ? roles.energiaUI : seleccionada ? roles.marca : roles.energiaUI, intensidad);
    ctx.fillRect((ANCHO - (compra > 0 ? 36 : seleccionada ? 14 : 8)) / 2, 0, compra > 0 ? 36 : seleccionada ? 14 : 8, 2);
  }
  if (falta > 0) {
    ctx.fillStyle = rgb(roles.petalo, reducido ? 1 : falta);
    ctx.fillRect(8, ALTO - 5, ANCHO - 16, 1);
  }
  ctx.globalAlpha = 1;
}

export function crearCatalogoUI({ contenedor, tipos, animadores, roles, alElegir, alConsultar }) {
  const raiz = document.createElement('div');
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
    boton.setAttribute('aria-description', funcionDe(tipo.id).consejo);
    boton.setAttribute('aria-label', `${tipo.nombre}, coste ${tipo.coste} de energía`);

    const lienzo = document.createElement('canvas');
    lienzo.className = 'carta-lienzo';
    lienzo.setAttribute('aria-hidden', 'true');
    boton.append(lienzo);

    const carta = {
      tipo,
      boton,
      lienzo,
      ctx: lienzo.getContext('2d'),
      animador: animadores[tipo.id],
      estado: null,
      pulsoHasta: 0,
      compraHasta: 0,
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

  contenedor.append(raiz);

  function ajustar() {
    const escala = parseFloat(getComputedStyle(raiz).getPropertyValue('--escala-carta')) || 2;
    const dpr = window.devicePixelRatio || 1;
    const multiplo = Math.max(1, Math.ceil(escala * dpr));
    for (const carta of cartas) {
      carta.lienzo.width = ANCHO * multiplo;
      carta.lienzo.height = ALTO * multiplo;
      carta.lienzo.style.width = `${ANCHO * escala}px`;
      carta.lienzo.style.height = `${ALTO * escala}px`;
      carta.ctx.setTransform(multiplo, 0, 0, multiplo, 0, 0);
      carta.ctx.imageSmoothingEnabled = false;
    }
  }

  ajustar();

  return {
    elemento: raiz,
    ajustar,
    comprada(id, t) {
      const carta = cartas.find((c) => c.tipo.id === id);
      if (carta) carta.compraHasta = t + FEEDBACK.oleada;
    },
    actualizar({ energia, activa, costes, t, reducido, panel, bloqueado = false }) {
      for (const carta of cartas) {
        carta.ultimoT = t;
        const coste = costes?.[carta.tipo.id] ?? carta.tipo.coste;
        const seleccionada = !bloqueado && activa === carta.tipo.id;
        const alcanzable = !bloqueado && energia >= coste;
        const estado = bloqueado ? 'cerrada' : seleccionada ? 'seleccionada' : alcanzable ? 'disponible' : 'insuficiente';
        const faltan = Math.max(0, Math.ceil(coste - energia));
        if (carta.estado !== null && ((seleccionada && carta.estado !== estado) || (alcanzable && !carta.alcanzable))) {
          carta.pulsoHasta = t + FEEDBACK.gesto;
        }
        if (carta.estado !== estado || carta.coste !== coste || carta.faltan !== faltan) {
          carta.estado = estado;
          carta.coste = coste;
          carta.faltan = faltan;
          carta.boton.dataset.estado = estado;
          carta.boton.disabled = bloqueado;
          carta.boton.setAttribute('aria-pressed', String(seleccionada));
          const disponibilidad = bloqueado ? 'jardín caído' : alcanzable ? 'disponible' : faltan === 1 ? 'falta 1 de energía, consultar' : `faltan ${faltan} de energía, consultar`;
          carta.boton.setAttribute('aria-label', `${carta.tipo.nombre}, ${funcionDe(carta.tipo.id).corta}, coste ${coste} de energía, ${disponibilidad}`);
        }
        carta.alcanzable = alcanzable;
        const consultada = !bloqueado && panel === carta.tipo.id;
        carta.boton.toggleAttribute('data-consulta', consultada);
        dibujarCarta(carta.ctx, carta, roles, t, reducido, consultada);
      }
    },
    destruir() {
      raiz.remove();
    },
  };
}
