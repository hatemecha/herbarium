export function crearDerrota(escenario, alReiniciar) {
  const raiz = document.createElement('div');
  raiz.className = 'derrota';
  raiz.dataset.interfaz = '';
  raiz.hidden = true;
  raiz.innerHTML = '<p class="derrota-texto">el jardín cayó</p><button type="button" class="derrota-boton">reiniciar</button>';
  escenario.append(raiz);
  raiz.querySelector('button').addEventListener('click', alReiniciar);

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
