import { ENERGIA, TABLERO } from './config.js';
import { crearAnimacion } from './animacion.js';
import { PLANTAS } from './catalogo.js';
import { crearEnemigo, elevacion, fotogramaEnemigo } from './entidades/enemigo.js';
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
  lienzo.width = grande ? 7 * celda : frames[0].width;
  lienzo.height = grande ? 4 * celda : frames[0].height;
  if (grande) lienzo.className = 'registro-lamina';
  lienzo.setAttribute('aria-hidden', 'true');
  const ctx = lienzo.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const escala = grande ? 3 : 1;
  const x = grande ? 2 * celda : 0;
  const y = grande ? celda : 0;
  const sombra = rgb(roles.terreno);
  let anterior;
  let alturaAnterior;

  return {
    lienzo,
    actualizar(dt, reducido) {
      animacion?.actualizar(dt, reducido);
      if (insecto) insecto.reloj += dt;
      const indice = animacion?.variante() ?? (insecto ? fotogramaEnemigo(insecto, reducido) : 0);
      const frame = frames[indice] ?? frames[0];
      const altura = grande && insecto ? elevacion(insecto, reducido) * escala : 0;
      if (frame === anterior && altura === alturaAnterior) return;
      anterior = frame;
      alturaAnterior = altura;
      ctx.clearRect(0, 0, lienzo.width, lienzo.height);
      if (grande) {
        ctx.fillStyle = sombra;
        ctx.fillRect(2 * celda, 4 * celda - 5, 3 * celda, 2);
        ctx.fillRect(2 * celda + 4, 4 * celda - 3, 3 * celda - 8, 2);
      }
      ctx.drawImage(frame, x, y - altura, frame.width * escala, frame.height * escala);
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
      <div class="registro-grupos" role="group" aria-label="Especies">
        <button type="button" data-grupo="plantas">Plantas</button>
        <button type="button" data-grupo="enemigos">Enemigos</button>
      </div>
      <div class="registro-contenido">
        <div class="registro-lista" role="group" aria-label="Especies descubiertas"></div>
        <article class="registro-ficha"></article>
      </div>
    </section>`;
  const central = retrato(PLANTAS.central, frames.central[0], roles, true);
  dialogo.querySelector('[data-vista="menu"] h2').after(central.lienzo);
  contenedor.append(dialogo);
  const reanudar = dialogo.querySelector('[data-accion="reanudar"]');
  const lista = dialogo.querySelector('.registro-lista');
  const ficha = dialogo.querySelector('.registro-ficha');
  const grupos = [...dialogo.querySelectorAll('[data-grupo]')];
  const vistas = [...dialogo.querySelectorAll('[data-vista]')];
  let vista = 'menu';
  let grupo = 'plantas';
  let seleccion;
  let principal;
  let miniaturas = [];
  let raf = 0;
  let ultimo = 0;

  function animar(ahora) {
    const dt = Math.min(0.1, (ahora - ultimo) / 1000);
    ultimo = ahora;
    if (vista === 'menu') central.actualizar(dt, reducido.matches);
    if (vista === 'catalogo') {
      principal?.actualizar(dt, reducido.matches);
      for (const miniatura of miniaturas) miniatura.actualizar(dt, reducido.matches);
    }
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
  }

  function mostrarGrupo(nuevoGrupo) {
    grupo = nuevoGrupo;
    for (const control of grupos) {
      control.setAttribute('aria-pressed', String(control.dataset.grupo === grupo));
    }
    lista.replaceChildren();
    miniaturas = [];
    principal = null;
    const especies = descubrimientos.listar(grupo);
    if (!especies.length) {
      lista.textContent = 'Todavía no encontraste enemigos';
      ficha.hidden = true;
      return;
    }
    for (const tipo of especies) {
      const opcion = document.createElement('button');
      opcion.type = 'button';
      opcion.dataset.id = tipo.id;
      const miniatura = retrato(tipo, frames[tipo.id][0], roles, false);
      miniatura.actualizar(0, reducido.matches);
      miniaturas.push(miniatura);
      opcion.append(miniatura.lienzo, tipo.nombre);
      opcion.addEventListener('click', () => mostrarFicha(tipo));
      lista.append(opcion);
    }
    mostrarFicha(especies.find(({ id }) => id === seleccion) ?? especies[0]);
  }

  function mostrar(nuevaVista, foco) {
    vista = nuevaVista;
    for (const seccion of vistas) seccion.hidden = seccion.dataset.vista !== vista;
    dialogo.dataset.vistaActiva = vista;
    dialogo.setAttribute('aria-label', dialogo.querySelector('section:not([hidden]) h2').textContent);
    dialogo.querySelector(foco)?.focus();
    dialogo.scrollTop = 0;
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
