import { crearRotulo } from './interfazPixel.js';

export function crearDerrota(escenario, alReiniciar) {
  const raiz = document.createElement('div');
  raiz.className = 'derrota';
  raiz.dataset.interfaz = '';
  raiz.hidden = true;

  const texto = document.createElement('p');
  texto.className = 'derrota-texto';
  const titulo = crearRotulo(texto, 'el jardín cayó', { escala: 3, centro: true });

  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'derrota-boton';
  const reinicio = crearRotulo(boton, 'reiniciar', { cursor: true });
  boton.setAttribute('aria-describedby', 'final-jardin');
  texto.id = 'final-jardin';
  boton.addEventListener('click', alReiniciar);

  raiz.append(texto, boton);
  escenario.append(raiz);

  function ajustar() {
    if (raiz.hidden) return;
    titulo.actualizar();
    reinicio.actualizar();
  }
  boton.addEventListener('focus', ajustar);

  return {
    ajustar,
    mostrar() {
      raiz.hidden = false;
      boton.focus({ preventScroll: true });
      ajustar();
    },
    ocultar() { raiz.hidden = true; },
    destruir() { raiz.remove(); },
  };
}
