export function crearAnimacion({ secuencia, desfase = 0 }) {
  let indice = 0;
  let restante = secuencia[0].duracion;

  function avanzar(dt) {
    restante -= dt;
    while (restante <= 0) {
      indice = (indice + 1) % secuencia.length;
      restante += secuencia[indice].duracion;
    }
  }

  avanzar(desfase);

  return {
    actualizar(dt, reducido) {
      if (reducido) {
        indice = 0;
        restante = secuencia[0].duracion;
        return;
      }
      avanzar(dt);
    },
    variante: () => secuencia[indice].fotograma,
  };
}
