export function crearDerrota(escenario, flor, tinta, alReiniciar) {
  const raiz = document.createElement('div');
  raiz.className = 'derrota';
  raiz.dataset.interfaz = '';
  raiz.hidden = true;

  const silueta = document.createElement('canvas');
  silueta.className = 'derrota-flor';
  silueta.setAttribute('aria-hidden', 'true');
  silueta.width = flor.width;
  silueta.height = flor.height;
  const ctx = silueta.getContext('2d');
  // Se inclina la copa en pasos enteros para conservar el píxel del sprite.
  const mitad = Math.floor(flor.height / 2);
  ctx.drawImage(flor, 0, 0, flor.width, mitad, 2, 0, flor.width, mitad);
  ctx.drawImage(flor, 0, mitad, flor.width, flor.height - mitad, 0, mitad, flor.width, flor.height - mitad);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = tinta;
  ctx.fillRect(0, 0, flor.width, flor.height);

  const texto = document.createElement('p');
  texto.className = 'derrota-texto';
  texto.textContent = 'el jardín cayó';

  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'derrota-boton';
  boton.textContent = 'reiniciar';
  boton.setAttribute('aria-describedby', 'final-jardin');
  texto.id = 'final-jardin';
  boton.addEventListener('click', alReiniciar);

  raiz.append(silueta, texto, boton);
  escenario.append(raiz);

  return {
    mostrar() {
      raiz.hidden = false;
      boton.focus({ preventScroll: true });
    },
    ocultar() { raiz.hidden = true; },
    destruir() { raiz.remove(); },
  };
}
