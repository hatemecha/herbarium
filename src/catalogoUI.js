import { FEEDBACK } from './config.js';
import { funcionDe } from './ficha.js';
import { punteroFino } from './entrada.js';
import { rgb } from './paleta.js';

const ANCHO = 60;
const ALTO = 68;
const FUENTE = '10px MonoMEK, ui-monospace, monospace';
const ACENTOS = { cerbatana: 'bocaBrillo', espino: 'ambiental', campanilla: 'campanaLuz', hongo: 'hongoLuz' };

function dibujarCarta(ctx, carta, roles, t, reducido, ala) {
  const { tipo, animador, estado, enfoque } = carta;
  const seleccionada = estado === 'seleccionada';
  const borde = seleccionada ? roles.marca : enfoque || ala ? roles.marcaSuave : roles.cuadricula;

  ctx.clearRect(0, 0, ANCHO, ALTO);
  ctx.globalAlpha = 1;

  ctx.fillStyle = rgb(roles.terreno);
  ctx.fillRect(1, 0, ANCHO - 2, ALTO);
  ctx.fillRect(0, 1, ANCHO, ALTO - 2);

  ctx.fillStyle = rgb(borde);
  const x0 = ala === 'izq' ? 0 : 1;
  const x1 = ala === 'der' ? ANCHO : ANCHO - 1;
  const y0 = ala === 'arriba' ? 0 : 1;
  const y1 = ala === 'abajo' ? ALTO : ALTO - 1;
  if (ala !== 'arriba') ctx.fillRect(x0, 0, x1 - x0, 1);
  if (ala !== 'abajo') ctx.fillRect(x0, ALTO - 1, x1 - x0, 1);
  if (ala !== 'izq') ctx.fillRect(0, y0, 1, y1 - y0);
  if (ala !== 'der') ctx.fillRect(ANCHO - 1, y0, 1, y1 - y0);

  const pulso = Math.max(0, (carta.pulsoHasta - t) / FEEDBACK.gesto);
  if (seleccionada || pulso > 0) {
    ctx.fillStyle = rgb(seleccionada ? roles.marca : roles.energiaUI);
    const ancho = seleccionada ? 14 : reducido ? 6 : 4 + 2 * Math.ceil(pulso * 4);
    ctx.fillRect((ANCHO - ancho) / 2, 0, ancho, 2);
  }
  if (seleccionada) {
    ctx.fillStyle = rgb(roles.marcaSuave, 0.46);
    ctx.fillRect(11, 36, 6, 1);
    ctx.fillRect(43, 36, 6, 1);
  }

  ctx.globalAlpha = estado === 'insuficiente' ? 0.55 : 1;
  ctx.drawImage(animador.fotograma(), 14, !reducido && pulso > 0.55 ? 0 : 1, 32, 32);
  ctx.globalAlpha = 1;

  ctx.font = FUENTE;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.fillStyle = rgb(roles.tintaUI);
  ctx.fillText(tipo.nombre, 30, 33);
  ctx.fillStyle = rgb(roles[ACENTOS[tipo.id]]);
  ctx.fillText(funcionDe(tipo.id).corta, 30, 44);

  const coste = String(carta.coste);
  const x = Math.floor((ANCHO - ctx.measureText(coste).width - 6) / 2);
  ctx.fillStyle = rgb(estado === 'insuficiente' ? roles.marcaSuave : roles.energiaUI);
  ctx.fillRect(x, 57, 3, 3);
  if (estado === 'insuficiente') {
    ctx.fillStyle = rgb(roles.terreno);
    ctx.fillRect(x + 1, 58, 1, 1);
    ctx.fillStyle = rgb(roles.marcaSuave);
  }
  ctx.textAlign = 'left';
  ctx.fillText(coste, x + 6, 54);
  ctx.globalAlpha = 1;
}

function ladoCatalogo() {
  if (matchMedia('(min-width: 72rem) and (min-aspect-ratio: 4/3)').matches) return 'izq';
  if (matchMedia('(orientation: landscape) and (max-height: 32rem)').matches) return 'der';
  return 'abajo';
}

function alaDe(lado) {
  if (lado === 'abajo') return 'arriba';
  if (lado === 'der') return 'izq';
  return 'der';
}

export function crearCatalogoUI({ contenedor, tipos, animadores, roles, alElegir, alConsultar }) {
  const raiz = document.createElement('div');
  raiz.className = 'catalogo';
  raiz.dataset.interfaz = '';
  raiz.dataset.lado = ladoCatalogo();
  raiz.setAttribute('role', 'group');
  raiz.setAttribute('aria-label', 'Plantas disponibles');

  const ficha = document.createElement('div');
  ficha.className = 'carta-ficha';
  ficha.hidden = true;
  ficha.setAttribute('aria-hidden', 'true');
  const cuerpo = document.createElement('div');
  cuerpo.className = 'carta-ficha-cuerpo';
  const consejoEl = document.createElement('p');
  consejoEl.className = 'carta-ficha-consejo';
  const accionEl = document.createElement('p');
  accionEl.className = 'carta-ficha-accion';
  cuerpo.append(consejoEl, accionEl);
  ficha.append(cuerpo);

  let fichaEn = null;
  let ala = alaDe(raiz.dataset.lado);

  const cartas = tipos.map((tipo) => {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'carta';
    boton.dataset.interfaz = '';
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
      enfoque: false,
      coste: tipo.coste,
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
      alElegir(tipo.id);
    });
    raiz.append(boton);
    return carta;
  });

  contenedor.append(raiz);

  function ajustar() {
    raiz.dataset.lado = ladoCatalogo();
    ala = alaDe(raiz.dataset.lado);
    ficha.dataset.ala = ala;
    const escala = parseFloat(getComputedStyle(raiz).getPropertyValue('--escala-carta')) || 2;
    const dpr = window.devicePixelRatio || 1;
    const multiplo = Math.max(1, Math.round(escala * dpr));
    for (const carta of cartas) {
      carta.lienzo.width = ANCHO * multiplo;
      carta.lienzo.height = ALTO * multiplo;
      carta.lienzo.style.width = `${(ANCHO * multiplo) / dpr}px`;
      carta.lienzo.style.height = `${(ALTO * multiplo) / dpr}px`;
      carta.ctx.setTransform(multiplo, 0, 0, multiplo, 0, 0);
      carta.ctx.imageSmoothingEnabled = false;
    }
  }

  function anclarFicha(carta, consejo, accion) {
    ficha.dataset.ala = ala;
    ficha.style.borderColor = rgb(carta.estado === 'seleccionada' ? roles.marca : roles.marcaSuave);
    if (fichaEn !== carta) {
      carta.boton.append(ficha);
      fichaEn = carta;
    }
    ficha.hidden = false;
    if (consejoEl.textContent !== consejo) consejoEl.textContent = consejo;
    if (accionEl.textContent !== accion) accionEl.textContent = accion;
  }

  function ocultarFicha() {
    if (ficha.hidden) return;
    ficha.hidden = true;
    fichaEn = null;
  }

  ajustar();

  return {
    elemento: raiz,
    ajustar,
    actualizar({ energia, activa, costes, t, reducido, panel, accionPanel }) {
      for (const carta of cartas) {
        const coste = costes?.[carta.tipo.id] ?? carta.tipo.coste;
        const seleccionada = activa === carta.tipo.id;
        const alcanzable = energia >= coste;
        const estado = seleccionada ? 'seleccionada' : alcanzable ? 'disponible' : 'insuficiente';
        if (carta.estado !== estado || carta.coste !== coste) {
          if (estado !== carta.estado && (estado === 'seleccionada' || carta.estado === 'insuficiente')) {
            carta.pulsoHasta = t + FEEDBACK.gesto;
          }
          carta.estado = estado;
          carta.coste = coste;
          carta.boton.dataset.estado = estado;
          carta.boton.setAttribute('aria-pressed', String(seleccionada));
          const accion = estado === 'insuficiente' ? ', consultar' : '';
          carta.boton.setAttribute('aria-label', `${carta.tipo.nombre}, ${funcionDe(carta.tipo.id).corta}, coste ${coste} de energía${accion}`);
        }
        const abierta = panel === carta.tipo.id ? ala : null;
        dibujarCarta(carta.ctx, carta, roles, t, reducido, abierta);
      }

      const cartaPanel = panel && cartas.find((c) => c.tipo.id === panel);
      if (cartaPanel) {
        anclarFicha(cartaPanel, funcionDe(panel).consejo, accionPanel ?? '');
      } else {
        ocultarFicha();
      }
    },
    destruir() {
      raiz.remove();
    },
  };
}
