import { rgb } from './paleta.js';

const ANCHO = 96;
const ALTO = 44;
const SPRITE_X = 6;
const SPRITE_Y = 14;
const TEXTO_X = 27;
const FUENTE = '12px MonoMEK, ui-monospace, monospace';

function dibujarCarta(ctx, carta, roles) {
  const { tipo, animador, estado, enfoque } = carta;
  const seleccionada = estado === 'seleccionada';
  const tinta = seleccionada ? roles.fondo : roles.marca;
  const borde = seleccionada ? roles.marca : enfoque ? roles.marcaSuave : roles.cuadricula;
  const fondo = seleccionada ? roles.marca : enfoque ? roles.terreno : roles.fondo;

  ctx.clearRect(0, 0, ANCHO, ALTO);
  ctx.globalAlpha = estado === 'insuficiente' ? 0.4 : 1;

  ctx.fillStyle = rgb(borde);
  ctx.fillRect(1, 0, ANCHO - 2, 1);
  ctx.fillRect(1, ALTO - 1, ANCHO - 2, 1);
  ctx.fillRect(0, 1, 1, ALTO - 2);
  ctx.fillRect(ANCHO - 1, 1, 1, ALTO - 2);

  ctx.fillStyle = rgb(fondo);
  ctx.fillRect(1, 1, ANCHO - 2, ALTO - 2);

  ctx.drawImage(animador.fotograma(), SPRITE_X, SPRITE_Y);

  ctx.font = FUENTE;
  ctx.textBaseline = 'top';
  ctx.fillStyle = rgb(tinta);
  ctx.fillText(tipo.nombre, TEXTO_X, 9);
  ctx.fillStyle = rgb(seleccionada ? tinta : roles.marcaSuave);
  ctx.fillText(String(tipo.coste), TEXTO_X, 25);

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
    };

    boton.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'touch') carta.enfoque = true;
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
    actualizar({ energia, activa }) {
      for (const carta of cartas) {
        const seleccionada = activa === carta.tipo.id;
        const alcanzable = energia >= carta.tipo.coste;
        const estado = seleccionada ? 'seleccionada' : alcanzable ? 'disponible' : 'insuficiente';
        if (carta.estado !== estado) {
          carta.estado = estado;
          carta.boton.dataset.estado = estado;
          carta.boton.setAttribute('aria-pressed', String(seleccionada));
          carta.boton.setAttribute('aria-disabled', String(estado === 'insuficiente'));
        }
        dibujarCarta(carta.ctx, carta, roles);
      }
    },
    destruir() {
      raiz.remove();
    },
  };
}
