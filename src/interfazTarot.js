import { ARCANOS, describirArcano } from './efectosTarot.js';
import { alinearSalida, crearRotulo, prepararSalida, presentar, superficie } from './interfazPixel.js';
import { ilustrarArcano } from './sprites/tarot.js';

const orientacion = carta => carta.invertida ? 'Invertida' : 'Derecha';
const titulo = carta => ARCANOS[carta.id].nombre + ' · ' + orientacion(carta);

function crearLaminaArcano(carta) {
  const imagen = ilustrarArcano(carta.id, carta.invertida);
  const salida = document.createElement('canvas');
  salida.className = 'raster-ui tarot-lamina';
  salida.setAttribute('aria-hidden', 'true');
  return {
    salida,
    ajustar(zoom = 2) {
      const dpr = window.devicePixelRatio || 1;
      prepararSalida(salida, imagen.width, imagen.height, Math.max(1, Math.round(zoom * dpr)), dpr);
      presentar(imagen, salida);
      alinearSalida(salida, dpr);
    },
  };
}

function detalle(carta, simbolismo) {
  const texto = describirArcano(carta);
  if (simbolismo) texto.unshift(ARCANOS[carta.id].simbolismo);
  return texto;
}

export function mostrarTarotCatalogo(lista, ficha, cartas) {
  let lamina;
  const rotulosLista = [];
  let rotulosFicha = [];

  function rotular(nodo, valor, escala) {
    return crearRotulo(nodo, valor, {
      escala, ancho: () => Math.max(12, nodo.clientWidth - (nodo.matches('button') ? 16 : 0)),
      interlineado: 2, cursor: nodo.matches('button'),
    });
  }

  function ajustar() {
    lamina?.ajustar();
    for (const rotulo of [...rotulosLista, ...rotulosFicha]) rotulo.actualizar();
  }

  function mostrar(carta, boton) {
    for (const otro of lista.querySelectorAll('button')) otro.setAttribute('aria-pressed', String(otro === boton));
    lamina = crearLaminaArcano(carta);
    const nombre = document.createElement('h3');
    rotulosFicha = [rotular(nombre, titulo(carta), 2)];
    ficha.replaceChildren(lamina.salida, nombre);
    for (const linea of detalle(carta, true)) {
      const parrafo = document.createElement('p');
      rotulosFicha.push(rotular(parrafo, linea, 1.5));
      ficha.append(parrafo);
    }
    ficha.hidden = false;
    ajustar();
  }

  if (!cartas.length) {
    rotulosLista.push(rotular(lista, 'Todavía no descubriste arcanos.', 1.5));
    ficha.hidden = true;
  }
  for (const carta of cartas) {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.dataset.arcano = '';
    const nombre = document.createElement('span');
    nombre.className = 'registro-nombre';
    boton.append(nombre);
    rotulosLista.push(rotular(nombre, titulo(carta), 1.5));
    boton.addEventListener('click', () => mostrar(carta, boton));
    lista.append(boton);
    if (!lamina) mostrar(carta, boton);
  }
  return ajustar;
}

export function crearTarotUI({ escenario, hud, tarot, alResponder, alAbrir, foco, habilitado }) {
  const dialogo = document.createElement('dialog');
  dialogo.dataset.interfaz = '';
  dialogo.className = 'tarot-dialogo';
  dialogo.setAttribute('aria-label', 'Tarot');
  const cuerpo = document.createElement('section');
  dialogo.append(cuerpo);
  escenario.append(dialogo);
  const mazo = document.createElement('button');
  mazo.type = 'button';
  mazo.className = 'tarot-mazo';
  mazo.dataset.interfaz = '';
  mazo.setAttribute('aria-haspopup', 'dialog');
  mazo.hidden = true;
  const pila = document.createElement('canvas');
  pila.className = 'raster-ui';
  pila.setAttribute('aria-hidden', 'true');
  mazo.append(pila);
  const sello = superficie(13, 15);
  const ctx = sello.getContext('2d');
  ctx.fillStyle = '#8e826a';
  ctx.fillRect(3, 1, 9, 12);
  ctx.fillStyle = '#131511';
  ctx.fillRect(4, 2, 7, 10);
  ctx.fillStyle = '#c3bba5';
  ctx.fillRect(1, 3, 9, 12);
  ctx.fillStyle = '#131511';
  ctx.fillRect(2, 4, 7, 10);
  ctx.fillStyle = '#c3bba5';
  ctx.fillRect(5, 7, 1, 4);
  ctx.fillRect(4, 8, 3, 2);
  const rotuloMazo = crearRotulo(mazo, 'Mazo', { escala: 1.5 });
  hud.append(mazo);

  let fase;
  let roto = false;
  let rotulos = [];
  let lamina;
  let origen;

  function ajustar() {
    if (!mazo.hidden) {
      const dpr = window.devicePixelRatio || 1;
      prepararSalida(pila, sello.width, sello.height, Math.max(1, Math.round(dpr)), dpr);
      presentar(sello, pila);
      alinearSalida(pila, dpr);
      rotuloMazo.actualizar();
    }
    if (!dialogo.open) return;
    for (const rotulo of rotulos) rotulo.actualizar();
    lamina?.ajustar(window.innerHeight < 450 ? 1.5 : window.innerWidth < 640 ? 2 : 3);
  }

  function texto(padre, etiqueta, valor) {
    const nodo = document.createElement(etiqueta);
    if (etiqueta === 'h2') nodo.tabIndex = -1;
    padre.append(nodo);
    const rotulo = crearRotulo(nodo, valor, {
      escala: etiqueta === 'h2' ? 2 : 1.5,
      ancho: () => nodo.clientWidth - (etiqueta === 'button' ? 24 : 0),
      centro: etiqueta !== 'button',
      cursor: etiqueta === 'button',
      interlineado: 2,
    });
    rotulos.push(rotulo);
    return nodo;
  }

  function boton(padre, valor, accion) {
    const nodo = texto(padre, 'button', valor);
    nodo.type = 'button';
    nodo.addEventListener('click', accion);
    return nodo;
  }

  function cambiar(nueva) {
    fase = nueva;
    dialogo.setAttribute('aria-label', nueva === 'mazo' ? 'Arcanos activos' : 'Tarot');
    cuerpo.dataset.fase = nueva;
    cuerpo.replaceChildren();
    rotulos = [];
    lamina = null;
  }

  function mostrar(encabezado) {
    if (!dialogo.open) dialogo.showModal();
    dialogo.scrollTop = 0;
    ajustar();
    encabezado.focus({ preventScroll: true });
  }

  function cerrar() {
    fase = undefined;
    dialogo.close();
    (origen?.isConnected ? origen : foco).focus({ preventScroll: true });
  }

  function revelar(carta, continuar) {
    cambiar('carta');
    const encabezado = texto(cuerpo, 'h2', titulo(carta));
    lamina = crearLaminaArcano(carta);
    cuerpo.append(lamina.salida);
    if (carta.nivel > 1) texto(cuerpo, 'p', 'Nivel ' + carta.nivel);
    for (const linea of detalle(carta, false)) texto(cuerpo, 'p', linea);
    const revelada = performance.now();
    boton(cuerpo, 'Volver al jardín', evento => {
      if (evento.detail > 0 && performance.now() - revelada < 240) return;
      continuar();
    });
    mostrar(encabezado);
  }

  function consultar(indice = 0) {
    const cartas = tarot.mazo();
    const carta = cartas[indice];
    cambiar('mazo');
    const encabezado = texto(cuerpo, 'h2', 'Arcanos activos');
    lamina = crearLaminaArcano(carta);
    cuerpo.append(lamina.salida);
    texto(cuerpo, 'p', titulo(carta) + ' · Nivel ' + carta.nivel);
    for (const linea of detalle(carta, false)) texto(cuerpo, 'p', linea);
    const navegacion = document.createElement('div');
    navegacion.className = 'tarot-navegacion';
    cuerpo.append(navegacion);
    if (cartas.length > 1) {
      boton(navegacion, 'Anterior', () => consultar((indice + cartas.length - 1) % cartas.length));
      boton(navegacion, 'Siguiente', () => consultar((indice + 1) % cartas.length));
    }
    boton(navegacion, 'Cerrar mazo', cerrar);
    mostrar(encabezado);
  }

  mazo.addEventListener('click', () => {
    if (fase || !habilitado() || !tarot.mazo().length) return;
    origen = mazo;
    alAbrir();
    consultar();
  });
  mazo.addEventListener('pointerdown', evento => evento.stopPropagation());
  dialogo.addEventListener('cancel', evento => {
    evento.preventDefault();
    if (fase === 'mazo') cerrar();
  });
  dialogo.addEventListener('pointerdown', evento => evento.stopPropagation());
  dialogo.addEventListener('keydown', evento => evento.stopPropagation());
  dialogo.addEventListener('focusin', ajustar);
  dialogo.addEventListener('scroll', ajustar, { passive: true });

  return {
    abrir(finalizar) {
      if (roto || fase) return;
      origen = foco;
      const pregunta = tarot.abrir();
      cambiar('pregunta');
      const encabezado = texto(cuerpo, 'h2', pregunta.texto);
      const opciones = document.createElement('div');
      opciones.className = 'tarot-opciones';
      cuerpo.append(opciones);
      for (const opcion of pregunta.opciones) {
        boton(opciones, opcion.texto, () => {
          if (roto || fase !== 'pregunta' || document.hidden) return;
          const carta = tarot.responder(pregunta, opcion.id);
          if (!carta) return;
          alResponder(carta);
          mazo.hidden = false;
          revelar(carta, () => {
            if (roto || fase !== 'carta' || document.hidden || !tarot.cerrar(pregunta)) return;
            finalizar();
            cerrar();
            ajustar();
          });
        });
      }
      mostrar(encabezado);
    },
    abierta: () => dialogo.open,
    ajustar,
    destruir() {
      roto = true;
      dialogo.remove();
      mazo.remove();
    },
  };
}
