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

  const resumen = document.createElement('details');
  const encabezado = document.createElement('summary');
  encabezado.textContent = 'Resultado de la partida';
  const datos = document.createElement('p');
  resumen.append(encabezado, datos);
  raiz.append(texto, resumen, boton);
  escenario.append(raiz);

  function ajustar() {
    if (raiz.hidden) return;
    titulo.actualizar();
    reinicio.actualizar();
  }
  boton.addEventListener('focus', ajustar);
  resumen.addEventListener('toggle', ajustar);

  return {
    ajustar,
    mostrar(final) {
      const tiempo = segundos => {
        const entero = Math.floor(segundos);
        return Math.floor(entero / 60) + ':' + String(entero % 60).padStart(2, '0');
      };
      resumen.hidden = !final;
      if (final) {
        datos.textContent = [
          tiempo(final.activo) + ' de juego · ' + tiempo(final.total) + ' en total',
          final.invasiones + ' invasiones superadas · ' + final.eliminados + ' insectos eliminados',
          final.cultivadas + ' cultivadas · ' + final.perdidas + ' perdidas · ' + final.retiradas + ' retiradas',
          Math.floor(final.generada) + ' energía generada · ' + final.recuperada + ' recuperada',
          final.premios.energia + ' premios de energía · ' + final.premios.vacia + ' vacíos · ' + final.premios.tarot + ' arcanos',
        ].join('\n');
      }
      raiz.hidden = false;
      boton.focus({ preventScroll: true });
      ajustar();
    },
    ocultar() { raiz.hidden = true; resumen.open = false; },
    destruir() { raiz.remove(); },
  };
}
