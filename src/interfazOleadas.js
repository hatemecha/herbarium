import { alinearSalida, crearRotulo, prepararSalida, presentar, superficie } from './interfazPixel.js';
import { rgb } from './paleta.js';
import { pintarEstrella } from './sprites/estrella.js';

const SIMBOLOS = {
  vacia: ['..###..', '.#...#.', '#.....#', '#.....#', '#.....#', '.#...#.', '..###..'],
  tarot: ['.#####.', '.#...#.', '.#.#.#.', '.##.##.', '.#.#.#.', '.#...#.', '.#####.'],
};
const REVELAR = 1.65;

export function crearRecompensaUI({ escenario, roles, reducido, alRevelar, alContinuar }) {
  const raiz = document.createElement('section');
  raiz.className = 'recompensa';
  raiz.hidden = true;
  raiz.dataset.interfaz = '';
  raiz.setAttribute('aria-label', 'Recompensa de oleada');
  const simbolo = document.createElement('canvas');
  simbolo.setAttribute('aria-hidden', 'true');
  const origen = superficie(13, 11);
  const ctx = origen.getContext('2d');
  const linea = document.createElement('p');
  const boton = document.createElement('button');
  boton.type = 'button';
  const mensaje = crearRotulo(linea, '', { ancho: () => linea.clientWidth, centro: true });
  const accion = crearRotulo(boton, '', { cursor: true });
  raiz.append(simbolo, linea, boton);
  escenario.append(raiz);

  let revelado = false;
  let pose = '';
  let enfocada = false;

  function ajustar() {
    if (raiz.hidden) return;
    const dpr = window.devicePixelRatio || 1;
    prepararSalida(simbolo, origen.width, origen.height, Math.max(1, Math.round(3 * dpr)), dpr);
    presentar(origen, simbolo);
    mensaje.actualizar();
    accion.actualizar();
    alinearSalida(simbolo, dpr);
  }

  function dibujar(tipo, dx) {
    ctx.clearRect(0, 0, origen.width, origen.height);
    if (tipo === 'energia') pintarEstrella(ctx, 3 + dx, 2, rgb(roles.energiaUI));
    else {
      ctx.fillStyle = rgb(tipo === 'tarot' ? roles.petalo : roles.marcaSuave);
      SIMBOLOS[tipo].forEach((fila, y) => {
        [...fila].forEach((pixel, x) => { if (pixel === '#') ctx.fillRect(3 + dx + x, 2 + y, 1, 1); });
      });
    }
    ajustar();
  }

  boton.addEventListener('focus', () => accion.actualizar());
  boton.addEventListener('click', () => {
    if (revelado) alContinuar();
    else alRevelar(REVELAR);
  });

  return {
    ajustar,
    destruir: () => raiz.remove(),
    teniaFoco: () => raiz.contains(document.activeElement),
    actualizar(vista, anunciar) {
      if (vista.fase !== 'recompensa') {
        raiz.hidden = true;
        pose = '';
        revelado = false;
        enfocada = false;
        return;
      }
      raiz.hidden = false;
      const { tiempo, resultado } = vista;
      const mostrar = reducido.matches || tiempo >= REVELAR;
      const paso = Math.floor(tiempo * 8);
      const tipo = mostrar ? resultado.tipo : paso % 2 ? 'vacia' : 'energia';
      const dx = mostrar ? 0 : [0, -1, 0, 1][paso % 4];
      const clave = `${tipo}/${dx}`;
      if (pose !== clave) {
        pose = clave;
        dibujar(tipo, dx);
      }
      const texto = mostrar ? (resultado.tipo === 'energia' ? `+${resultado.energia} de energía`
        : resultado.tipo === 'tarot' ? 'Acceso al tarot' : 'Sin bonificación') : 'Recompensa';
      mensaje.actualizar(texto);
      accion.actualizar(mostrar ? 'Continuar' : 'Ver resultado');
      if (mostrar && !revelado) anunciar(texto);
      revelado = mostrar;
      if (!enfocada) {
        enfocada = true;
        boton.focus({ preventScroll: true });
      }
      alinearSalida(simbolo, window.devicePixelRatio || 1);
    },
  };
}

