import { punteroFino } from './entrada.js';
import { rgb } from './paleta.js';

const ANCHO = 60;
const ALTO = 68;
const FUENTE = '10px MonoMEK, ui-monospace, monospace';

function dibujarCarta(ctx, carta, roles) {
  const { tipo, animador, estado, enfoque } = carta;
  const seleccionada = estado === 'seleccionada';

  ctx.clearRect(0, 0, ANCHO, ALTO);
  ctx.globalAlpha = estado === 'insuficiente' ? 0.65 : 1;

  ctx.fillStyle = rgb(roles.terreno);
  ctx.fillRect(1, 0, ANCHO - 2, ALTO);
  ctx.fillRect(0, 1, ANCHO, ALTO - 2);
  ctx.fillStyle = rgb(seleccionada ? roles.marca : enfoque ? roles.marcaSuave : roles.cuadricula);
  ctx.fillRect(1, 0, ANCHO - 2, 1);
  ctx.fillRect(1, ALTO - 1, ANCHO - 2, 1);
  ctx.fillRect(0, 1, 1, ALTO - 2);
  ctx.fillRect(ANCHO - 1, 1, 1, ALTO - 2);
  if (seleccionada) ctx.fillRect(23, 0, 14, 2);

  ctx.drawImage(animador.fotograma(), 14, 5, 32, 32);

  ctx.font = FUENTE;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  ctx.fillStyle = rgb(roles.tintaUI);
  ctx.fillText(tipo.nombre, 30, 41);

  const coste = String(carta.coste);
  const x = Math.floor((ANCHO - ctx.measureText(coste).width - 6) / 2);
  ctx.fillStyle = rgb(roles.energiaUI);
  ctx.fillRect(x, 57, 3, 3);
  ctx.textAlign = 'left';
  ctx.fillText(coste, x + 6, 54);
  ctx.globalAlpha = 1;
}

export function crearCatalogoUI({ contenedor, tipos, animadores, roles, alElegir }) {
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
      estado: 'disponible',
      enfoque: false,
      coste: tipo.coste,
    };

    boton.addEventListener('pointerenter', (e) => {
      if (punteroFino(e)) carta.enfoque = true;
    });
    boton.addEventListener('pointerleave', () => {
      carta.enfoque = false;
    });
    boton.addEventListener('click', () => {
      if (carta.estado === 'insuficiente') return;
      alElegir(tipo.id);
    });
    raiz.append(boton);
    return carta;
  });

  contenedor.append(raiz);

  function ajustar() {
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

  ajustar();

  return {
    elemento: raiz,
    ajustar,
    actualizar({ energia, activa, costes }) {
      for (const carta of cartas) {
        const coste = costes?.[carta.tipo.id] ?? carta.tipo.coste;
        const seleccionada = activa === carta.tipo.id;
        const alcanzable = energia >= coste;
        const estado = seleccionada ? 'seleccionada' : alcanzable ? 'disponible' : 'insuficiente';
        if (carta.estado !== estado || carta.coste !== coste) {
          carta.estado = estado;
          carta.coste = coste;
          carta.boton.dataset.estado = estado;
          carta.boton.setAttribute('aria-pressed', String(seleccionada));
          carta.boton.setAttribute('aria-disabled', String(estado === 'insuficiente'));
          carta.boton.setAttribute('aria-label', `${carta.tipo.nombre}, coste ${coste} de energía`);
        }
        dibujarCarta(carta.ctx, carta, roles);
      }
    },
    destruir() {
      raiz.remove();
    },
  };
}
