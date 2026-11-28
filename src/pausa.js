import { mostrarTarotCatalogo } from './interfazTarot.js';
import { ENERGIA, TABLERO } from './config.js';
import { crearAnimacion } from './animacion.js';
import { PLANTAS } from './catalogo.js';
import { crearEnemigo, elevacion, fotogramaEnemigo } from './entidades/enemigo.js';
import { alinearPixel } from './escala.js';
import { alinearSalida, colocarSalida, crearRotulo, INTERLINEADO_LECTURA, pintarMarco, prepararSalida, presentar, superficie, vestirMarco } from './interfazPixel.js';
import { rgb } from './paleta.js';

const numero = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 3 });

function datosDe(tipo, grupo) {
  const datos = [['Vida', tipo.vida]];
  if (grupo === 'enemigos') {
    datos.push(['Velocidad', `${numero.format(tipo.velocidad)} casillas/s`],
      ['Daño por mordida', tipo.dano], ['Intervalo', `${numero.format(tipo.intervalo)} s`]);
  } else {
    const ataque = tipo.ataque ?? tipo.area;
    if (tipo.comprable) datos.push(['Coste base', `${tipo.coste} de energía`]);
    if (tipo.id === 'central') datos.push(['Generación', `${numero.format(ENERGIA.porSegundo)} de energía/s`]);
    if (ataque) datos.push([tipo.area ? 'Daño en área' : 'Daño por disparo', ataque.dano],
      ['Alcance', `${numero.format(ataque.alcance)} casillas`],
      ['Intervalo', `${numero.format(ataque.intervalo)} s`]);
    if (tipo.reflejo) datos.push(['Daño reflejado', tipo.reflejo],
      ['Radio de atracción', `${numero.format(tipo.atraccion)} casillas`]);
    if (tipo.ralentiza) datos.push(['Reducción de velocidad', `${numero.format(tipo.ralentiza.reduccion * 100)} %`],
      ['Radio', `${numero.format(tipo.ralentiza.alcance)} casillas`]);
  }
  return datos;
}

function retrato(tipo, frames, roles, grande) {
  const { celda } = TABLERO;
  const secuencia = tipo.arte.secuencia;
  const animacion = secuencia && crearAnimacion({ secuencia });
  const insecto = !animacion && tipo.locomocion && crearEnemigo({ x: 0, y: 0, tipo });
  const lienzo = document.createElement('canvas');
  const origen = superficie(grande ? 7 * celda : frames[0].width, grande ? 4 * celda : frames[0].height);
  lienzo.className = 'raster-ui';
  if (grande) lienzo.classList.add('registro-lamina');
  lienzo.setAttribute('aria-hidden', 'true');
  const ctx = origen.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const escala = grande ? 3 : 1;
  const x = grande ? 2 * celda : 0;
  const y = grande ? celda : 0;
  const sombra = rgb(roles.terreno);
  let anterior;
  let alturaAnterior;

  return {
    lienzo,
    ajustar(zoom) {
      const dpr = window.devicePixelRatio || 1;
      prepararSalida(lienzo, origen.width, origen.height, Math.max(1, Math.round(zoom * dpr)), dpr);
      presentar(origen, lienzo);
      alinearSalida(lienzo, dpr);
    },
    actualizar(dt, reducido) {
      animacion?.actualizar(dt, reducido);
      if (insecto) insecto.reloj += dt;
      const indice = animacion?.variante() ?? (insecto ? fotogramaEnemigo(insecto, reducido) : 0);
      const frame = frames[indice] ?? frames[0];
      const altura = grande && insecto ? elevacion(insecto, reducido) * escala : 0;
      if (frame === anterior && altura === alturaAnterior) return;
      anterior = frame;
      alturaAnterior = altura;
      ctx.clearRect(0, 0, origen.width, origen.height);
      if (grande) {
        ctx.fillStyle = sombra;
        ctx.fillRect(2 * celda, 4 * celda - 5, 3 * celda, 2);
        ctx.fillRect(2 * celda + 4, 4 * celda - 3, 3 * celda - 8, 2);
      }
      ctx.drawImage(frame, x, y - altura, frame.width * escala, frame.height * escala);
      presentar(origen, lienzo);
    },
  };
}

export function crearPausa({ contenedor, boton, frames, roles, reducido, descubrimientos, alAbrir, alCerrar, alReiniciar, caido }) {
  const dialogo = document.createElement('dialog');
  dialogo.className = 'pausa-dialogo';
  dialogo.style.setProperty('--casilla', `${TABLERO.celda}px`);
  dialogo.setAttribute('aria-label', 'Pausa');
  dialogo.innerHTML = `
    <section data-vista="menu">
      <h2>Pausa</h2>
      <div class="pausa-acciones">
        <button type="button" data-accion="reanudar">Reanudar</button>
        <button type="button" data-accion="catalogo">Catálogo</button>
        <button type="button" data-accion="confirmar">Reiniciar</button>
      </div>
    </section>
    <section data-vista="confirmar" hidden>
      <h2>¿Reiniciar la partida?</h2>
      <p>Perderás el progreso de esta partida.</p>
      <div class="pausa-acciones">
        <button type="button" data-accion="volver">Volver</button>
        <button type="button" data-accion="reiniciar">Reiniciar partida</button>
      </div>
    </section>
    <section data-vista="catalogo" hidden>
      <header class="registro-cabecera">
        <h2>Catálogo</h2>
        <button type="button" data-accion="volver">Volver</button>
      </header>
      <div class="registro-grupos" role="group" aria-label="Colecciones">
        <button type="button" data-grupo="plantas">Plantas</button>
        <button type="button" data-grupo="enemigos">Enemigos</button>
        <button type="button" data-grupo="tarot">Tarot</button>
      </div>
      <div class="registro-contenido" data-recorte-pixel tabindex="0" role="region" aria-label="Fichas de especies">
        <div class="registro-lista" role="group" aria-label="Especies descubiertas"></div>
        <article class="registro-ficha"></article>
      </div>
    </section>`;
  const central = retrato(PLANTAS.central, frames.central[0], roles, true);
  const marco = document.createElement('canvas');
  marco.dataset.marcoCatalogo = '';
  marco.setAttribute('aria-hidden', 'true');
  dialogo.prepend(marco);
  dialogo.querySelector('[data-vista="menu"] h2').after(central.lienzo);
  contenedor.append(dialogo);
  const reanudar = dialogo.querySelector('[data-accion="reanudar"]');
  const lista = dialogo.querySelector('.registro-lista');
  const contenido = dialogo.querySelector('.registro-contenido');
  const ficha = dialogo.querySelector('.registro-ficha');
  const grupos = [...dialogo.querySelectorAll('[data-grupo]')];
  const vistas = [...dialogo.querySelectorAll('[data-vista]')];
  function rotular(elemento, opciones) {
    const valor = elemento.textContent;
    elemento.textContent = '';
    return crearRotulo(elemento, valor, opciones);
  }
  const rotulos = [...dialogo.querySelectorAll('h2, p, button')].map((el) => rotular(el, {
    escala: el.matches('h2') ? 2.25 : 1.65,
    ancho: el.matches('h2, p') ? () => el.clientWidth : null,
    cursor: el.matches('button'),
  }));
  let vista = 'menu';
  let grupo = 'plantas';
  let seleccion;
  let principal;
  let miniaturas = [];
  let fichas = [];
  let nombres = [];
  let raf = 0;
  let ultimo = 0;
  let tamañoMarco;
  let ajustarTarot;

  function ajustarMarco(dpr) {
    const clave = `${window.innerWidth}/${window.innerHeight}/${dpr}`;
    if (clave === tamañoMarco) return;
    tamañoMarco = clave;
    for (const propiedad of ['--ancho-catalogo', '--alto-catalogo', '--origen-x', '--origen-y']) {
      dialogo.style.removeProperty(propiedad);
    }
    const k = Math.max(1, Math.round(dpr));
    const disponible = dialogo.getBoundingClientRect();
    const ancho = Math.floor(disponible.width * dpr / k);
    const alto = Math.floor(disponible.height * dpr / k);
    dialogo.style.setProperty('--ancho-catalogo', `${ancho * k / dpr}px`);
    dialogo.style.setProperty('--alto-catalogo', `${alto * k / dpr}px`);
    const { left, top } = dialogo.getBoundingClientRect();
    dialogo.style.setProperty('--origen-x', `${alinearPixel(left, dpr) - left}px`);
    dialogo.style.setProperty('--origen-y', `${alinearPixel(top, dpr) - top}px`);
    const origen = superficie(ancho, alto);
    pintarMarco(origen.getContext('2d'), ancho, alto, 'transparent', rgb(roles.marcaSuave), 2);
    prepararSalida(marco, ancho, alto, k, dpr);
    colocarSalida(marco, 0, 0);
    alinearSalida(marco, dpr);
    presentar(origen, marco);
  }

  function actualizarRotulos() {
    if (!dialogo.open) return;
    for (const rotulo of [...rotulos, ...nombres, ...fichas]) rotulo.actualizar();
  }

  function ajustar() {
    if (!dialogo.open) return;
    const estilo = getComputedStyle(dialogo);
    const zoom = parseFloat(estilo.getPropertyValue('--escala-retrato'));
    const zoomMenu = parseFloat(estilo.getPropertyValue('--escala-retrato-pausa'));
    const dpr = window.devicePixelRatio || 1;
    if (vista === 'catalogo') ajustarMarco(dpr);
    else vestirMarco(dialogo, rgb(roles.cuadricula), dpr);
    central.ajustar(zoomMenu);
    principal?.ajustar(zoom);
    ajustarTarot?.();
    for (const miniatura of miniaturas) miniatura.ajustar(2);
    actualizarRotulos();
    // Las cajas de texto pueden cambiar el alto de las filas y centrar de nuevo el diálogo.
    alinearSalida(central.lienzo, dpr);
    if (principal) alinearSalida(principal.lienzo, dpr);
    for (const miniatura of miniaturas) alinearSalida(miniatura.lienzo, dpr);
    actualizarRotulos();
  }

  function animar(ahora) {
    const dt = Math.min(0.1, (ahora - ultimo) / 1000);
    ultimo = ahora;
    if (vista === 'menu') central.actualizar(dt, reducido.matches);
    if (vista === 'catalogo') principal?.actualizar(dt, reducido.matches);
    raf = requestAnimationFrame(animar);
  }

  function detenerRetratos() {
    cancelAnimationFrame(raf);
  }

  function mostrarFicha(tipo) {
    seleccion = tipo.id;
    for (const opcion of lista.querySelectorAll('button')) {
      opcion.setAttribute('aria-pressed', String(opcion.dataset.id === seleccion));
    }
    const titulo = document.createElement('h3');
    titulo.textContent = tipo.nombre;
    const descripcion = document.createElement('p');
    descripcion.textContent = tipo.descripcion;
    const datos = document.createElement('dl');
    for (const [nombre, valor] of datosDe(tipo, grupo)) {
      const etiqueta = document.createElement('dt');
      const dato = document.createElement('dd');
      etiqueta.textContent = nombre;
      dato.textContent = valor;
      datos.append(etiqueta, dato);
    }
    principal = retrato(tipo, frames[tipo.id][0], roles, true);
    principal.actualizar(0, reducido.matches);
    ficha.replaceChildren(principal.lienzo, titulo, descripcion, datos);
    ficha.hidden = false;
    fichas = [];
    ajustar();
  }

  function mostrarGrupo(nuevoGrupo) {
    grupo = nuevoGrupo;
    contenido.scrollTop = 0;
    for (const control of grupos) {
      control.setAttribute('aria-pressed', String(control.dataset.grupo === grupo));
    }
    lista.replaceChildren();
    miniaturas = [];
    nombres = [];
    fichas = [];
    principal = null;
    ajustarTarot = undefined;
    const especies = descubrimientos.listar(grupo);
    if (grupo === 'tarot') {
      ajustarTarot = mostrarTarotCatalogo(lista, ficha, especies);
      ajustar();
      return;
    }
    if (!especies.length) {
      nombres.push(crearRotulo(lista, 'Todavía no encontraste enemigos', {
        ancho: () => lista.clientWidth, interlineado: INTERLINEADO_LECTURA,
      }));
      ficha.hidden = true;
      ajustar();
      return;
    }
    for (const tipo of especies) {
      const opcion = document.createElement('button');
      opcion.type = 'button';
      opcion.dataset.id = tipo.id;
      const miniatura = retrato(tipo, frames[tipo.id][0], roles, false);
      miniatura.actualizar(0, reducido.matches);
      miniaturas.push(miniatura);
      const nombre = document.createElement('span');
      nombre.className = 'registro-nombre';
      nombres.push(crearRotulo(nombre, tipo.nombre, { escala: 1.5, cursor: true, ancho: () => nombre.clientWidth }));
      opcion.append(miniatura.lienzo, nombre);
      opcion.addEventListener('click', () => mostrarFicha(tipo));
      lista.append(opcion);
    }
    mostrarFicha(especies.find(({ id }) => id === seleccion) ?? especies[0]);
  }

  function mostrar(nuevaVista, foco) {
    vista = nuevaVista;
    for (const seccion of vistas) seccion.hidden = seccion.dataset.vista !== vista;
    dialogo.dataset.vistaActiva = vista;
    if (vista === 'catalogo') tamañoMarco = undefined;
    dialogo.setAttribute('aria-label', dialogo.querySelector('section:not([hidden]) h2').textContent);
    dialogo.querySelector(foco)?.focus();
    dialogo.scrollTop = 0;
    ajustar();
  }

  function volver() {
    mostrar('menu', `[data-accion="${vista}"]`);
  }

  function cerrar() {
    detenerRetratos();
    dialogo.close();
    boton.focus({ preventScroll: true });
    alCerrar();
  }

  function abrir() {
    if (dialogo.open) return;
    reanudar.hidden = caido();
    alAbrir();
    dialogo.showModal();
    mostrar('menu', reanudar.hidden ? '[data-accion="catalogo"]' : '[data-accion="reanudar"]');
    ultimo = performance.now();
    animar(ultimo);
  }

  const acciones = {
    reanudar: cerrar,
    catalogo() {
      mostrarGrupo(grupo);
      mostrar('catalogo', `[data-grupo="${grupo}"]`);
    },
    confirmar: () => mostrar('confirmar', '[data-vista="confirmar"] [data-accion="volver"]'),
    volver,
    reiniciar() {
      alReiniciar();
      cerrar();
    },
  };
  boton.addEventListener('click', abrir);
  boton.addEventListener('pointerdown', detenerPropagacion);
  dialogo.addEventListener('pointerdown', detenerPropagacion);
  dialogo.addEventListener('keydown', detenerPropagacion);
  dialogo.addEventListener('focusin', actualizarRotulos);
  dialogo.addEventListener('focusout', actualizarRotulos);
  dialogo.addEventListener('scroll', ajustar, { capture: true });
  dialogo.addEventListener('click', (evento) => {
    const control = evento.target.closest('button');
    if (control?.dataset.grupo) mostrarGrupo(control.dataset.grupo);
    else if (control?.dataset.accion) acciones[control.dataset.accion]();
  });
  dialogo.addEventListener('cancel', (evento) => {
    evento.preventDefault();
    if (vista === 'menu') cerrar();
    else volver();
  });

  return {
    ajustar,
    abierta: () => dialogo.open,
    destruir() {
      detenerRetratos();
      boton.removeEventListener('click', abrir);
      boton.removeEventListener('pointerdown', detenerPropagacion);
      dialogo.remove();
    },
  };
}

function detenerPropagacion(evento) {
  evento.stopPropagation();
}
