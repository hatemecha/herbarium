import { asegurarVariables, crearRoles, leerPaleta, rgb } from './paleta.js';
import { pintarEstrellaYTexto } from './sprites/estrella.js';

const ANCHO = 88;
const ALTO = 22;
const ESCALA = 2;

function dibujarBoton(roles) {
  const canvas = document.createElement('canvas');
  canvas.width = ANCHO * ESCALA;
  canvas.height = ALTO * ESCALA;
  canvas.style.width = `${ANCHO * ESCALA}px`;
  canvas.style.height = `${ALTO * ESCALA}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ESCALA, 0, 0, ESCALA, 0, 0);
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = rgb(roles.fondo);
  ctx.fillRect(2, 0, ANCHO - 4, ALTO);
  ctx.fillRect(0, 2, ANCHO, ALTO - 4);

  ctx.fillStyle = rgb(roles.cuadricula);
  ctx.fillRect(2, 0, ANCHO - 4, 1);
  ctx.fillRect(2, ALTO - 1, ANCHO - 4, 1);
  ctx.fillRect(0, 2, 1, ALTO - 4);
  ctx.fillRect(ANCHO - 1, 2, 1, ALTO - 4);
  for (const x of [1, ANCHO - 2]) for (const y of [1, ALTO - 2]) ctx.fillRect(x, y, 1, 1);

  ctx.font = '11px MonoMEK, ui-monospace, monospace';
  ctx.textAlign = 'left';
  pintarEstrellaYTexto(ctx, 6, Math.floor(ALTO * 0.72), 'reiniciar', rgb(roles.energiaUI), rgb(roles.energiaUI));

  return canvas;
}

export function crearDerrota(escenario, alReiniciar) {
  asegurarVariables();
  const roles = crearRoles(leerPaleta());
  const raiz = document.createElement('div');
  raiz.className = 'derrota';
  raiz.dataset.interfaz = '';
  raiz.hidden = true;

  const texto = document.createElement('p');
  texto.className = 'derrota-texto';
  texto.textContent = 'el jardín cayó';

  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'derrota-boton';
  boton.setAttribute('aria-label', 'reiniciar');
  boton.append(dibujarBoton(roles));
  boton.addEventListener('click', alReiniciar);

  raiz.append(texto, boton);
  escenario.append(raiz);

  return {
    mostrar() {
      raiz.hidden = false;
    },
    ocultar() {
      raiz.hidden = true;
    },
    destruir() {
      raiz.remove();
    },
  };
}
