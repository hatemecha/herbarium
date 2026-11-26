import { PARTICULAS, SIMULACION, TABLERO } from './config.js';
import { crearAleatorio, semillaNueva } from './aleatorio.js';
import { COMPRABLES, ENEMIGOS, PLANTAS } from './catalogo.js';
import { crearAnimacion } from './animacion.js';
import { crearCatalogoUI } from './catalogoUI.js';
import { crearColocacion } from './colocacion.js';
import { crearCombate } from './combate.js';
import { crearDerrota } from './derrota.js';
import { textoFicha } from './ficha.js';
import { calcularEscala, celdaDeCliente, pantallaAMundo } from './escala.js';
import { apagar, crearEstado, avanzar } from './estado.js';
import { crearJardin } from './jardin.js';
import { asegurarVariables, crearRoles, leerPaleta } from './paleta.js';
import { crearDirector } from './oleadas.js';
import { crearParticulas } from './particulas.js';
import { crearReloj } from './reloj.js';
import { crearRenderer } from './render.js';
import { crearSeleccion } from './seleccion.js';
import { crearTablero } from './tablero.js';
import { construirFotogramas } from './sprites/dibujo.js';

function construirDom(contenedor) {
  contenedor.classList.add('herbario');
  contenedor.innerHTML = `
    <header class="herbario-barra">
      <div class="energia">
        <span class="energia-punto" aria-hidden="true"></span>
        <span class="energia-etiqueta">energía</span>
        <span class="energia-valor">0</span>
      </div>
      <div class="fase" aria-live="polite">
        <span class="fase-oleada">oleada 1</span>
        <span class="fase-detalle">prepara 20</span>
      </div>
      <p class="ficha" data-interfaz hidden></p>
    </header>
    <div class="herbario-escenario">
      <canvas class="tablero" role="img" aria-label="Jardín en penumbra con una planta central que genera energía"></canvas>
    </div>`;
  return {
    escenario: contenedor.querySelector('.herbario-escenario'),
    canvas: contenedor.querySelector('.tablero'),
    punto: contenedor.querySelector('.energia-punto'),
    valor: contenedor.querySelector('.energia-valor'),
    oleada: contenedor.querySelector('.fase-oleada'),
    detalle: contenedor.querySelector('.fase-detalle'),
    ficha: contenedor.querySelector('.ficha'),
  };
}

function construirFrames(roles) {
  const frames = {};
  for (const tipo of [...Object.values(PLANTAS), ...Object.values(ENEMIGOS)]) {
    frames[tipo.id] = construirFotogramas(tipo.arte, roles);
  }
  return frames;
}

function crearPartida(dom, roles, frames, reducido, alDerrota) {
  const tablero = crearTablero();
  const semilla = semillaNueva();
  const director = crearDirector({
    tablero,
    aleatorio: crearAleatorio(semilla),
    semilla,
    ocupante: (x, y) => tablero.ocupante(x, y),
  });
  const aleatorioVisual = crearAleatorio((semilla + 1) >>> 0);
  const estado = crearEstado();
  const particulas = crearParticulas();
  const render = crearRenderer({ tablero, salida: dom.canvas, roles, frames });

  const animadores = Object.fromEntries(
    COMPRABLES.map((tipo) => {
      const animacion = crearAnimacion({ secuencia: tipo.arte.secuencia, desfase: 0.7 });
      return [
        tipo.id,
        {
          actualizar: (dt, reduce) => animacion.actualizar(dt, reduce),
          fotograma: () => frames[tipo.id][0][animacion.variante()],
        },
      ];
    }),
  );

  const jardin = crearJardin({
    tablero,
    estado,
    catalogo: PLANTAS,
    frames,
    alPlantar(planta) {
      render.registrarPlanta(planta);
      actualizarEnergia();
    },
    alRetirar: (planta) => render.retirarPlanta(planta),
  });
  jardin.sembrar('central', tablero.centro);
  const combate = crearCombate({
    tablero,
    jardin,
    tipoEnemigo: ENEMIGOS.escarabajo,
    catalogoEnemigos: ENEMIGOS,
    director,
    aleatorio: aleatorioVisual,
  });
  const seleccion = crearSeleccion({ tablero, canvas: dom.canvas });
  const catalogo = crearCatalogoUI({
    contenedor: dom.escenario,
    tipos: COMPRABLES,
    animadores,
    roles,
    alElegir: (id) => {
      if (!combate.derrota()) colocacion.alternar(id);
    },
  });
  const colocacion = crearColocacion({
    tablero,
    canvas: dom.canvas,
    jardin,
    zona: catalogo.elemento,
    alActivar: () => seleccion.limpiar(),
  });
  let derrotaAvisada = false;

  function actualizarEnergia() {
    dom.valor.textContent = String(Math.floor(estado.energia));
  }

  function latido() {
    if (reducido.matches) return;
    dom.punto.animate([{ opacity: 1 }, { opacity: 0.25 }], { duration: 700, easing: 'steps(4, end)' });
  }

  function procesarEventos() {
    const celda = tablero.celda;
    const reduce = reducido.matches;
    for (const ev of combate.eventos()) {
      const x = ev.x * celda;
      const y = ev.y * celda;
      if (ev.tipo === 'mordida' && ev.central) estado.impulso = Math.max(estado.impulso, 0.8);
      if (reduce) continue;
      if (ev.tipo === 'impacto' || ev.tipo === 'muerte-enemigo' || ev.tipo === 'muerte-planta') {
        particulas.rafaga(x, y, ev.tipo === 'impacto' ? 5 : 3);
      } else if (ev.tipo === 'mordida') {
        particulas.rafaga(x, y, 2);
      } else if (ev.tipo === 'disparo') {
        particulas.rafaga(x + ev.ux * 4, y + ev.uy * 4, 1);
      }
    }
  }

  function simular(dt) {
    const reduce = reducido.matches;
    const caida = combate.derrota();
    if (caida) {
      apagar(estado, dt);
    } else if (avanzar(estado, dt)) {
      actualizarEnergia();
      latido();
      if (!reduce) particulas.rafaga(jardin.central.nucleo.x, jardin.central.nucleo.y, PARTICULAS.rafaga);
    }
    jardin.actualizar(dt, reduce);
    combate.actualizar(dt);
    procesarEventos();

    const central = jardin.central;
    particulas.actualizar(dt, central.nucleo.x, central.nucleo.y, !reduce && !caida);
    seleccion.actualizar(dt);
    colocacion.actualizar(dt);
    for (const animador of Object.values(animadores)) animador.actualizar(dt, reduce);

    if (caida && !derrotaAvisada && central.opacidad <= 0) {
      derrotaAvisada = true;
      alDerrota();
    }
  }

  function dibujar() {
    const vista = colocacion.vista();
    const marcas = seleccion.marcas().filter((marca) => !(vista && marca.tipo === 'sobrevuelo'));
    render.dibujar({
      t: estado.tiempo,
      impulso: estado.impulso,
      reducido: reducido.matches,
      central: jardin.central,
      plantas: jardin.plantas,
      enemigos: combate.enemigos,
      proyectiles: combate.proyectiles,
      particulas,
      marcas,
      vista,
    });
    const vistaOleada = director.vista();
    const vivos = combate.enemigos.reduce((cantidad, enemigo) => cantidad + (enemigo.muerto ? 0 : 1), 0);
    dom.oleada.textContent = `oleada ${vistaOleada.numero}`;
    dom.detalle.textContent = vistaOleada.fase === 'preparacion'
      ? `prepara ${vistaOleada.restante}`
      : vistaOleada.porSalir > 0
        ? `salen ${vistaOleada.porSalir}`
        : `vivos ${vivos}`;
    const celda = seleccion.seleccionada();
    const planta = celda ? tablero.ocupante(celda.x, celda.y) : null;
    const ficha = textoFicha(planta);
    dom.ficha.hidden = !ficha;
    dom.ficha.textContent = ficha;
    const costes = {};
    for (const tipo of COMPRABLES) costes[tipo.id] = jardin.coste(tipo.id);
    catalogo.actualizar({ energia: estado.energia, activa: colocacion.tipoActivo(), costes });
  }

  actualizarEnergia();

  return {
    simular,
    dibujar,
    ajustarCatalogo: () => catalogo.ajustar(),
    derrota: () => combate.derrota(),
    seleccion,
    destruir() {
      seleccion.destruir();
      colocacion.destruir();
      catalogo.destruir();
    },
  };
}

export function montarHerbario(contenedor) {
  asegurarVariables();
  const roles = crearRoles(leerPaleta());
  const dom = construirDom(contenedor);
  const frames = construirFrames(roles);
  const reducido = matchMedia('(prefers-reduced-motion: reduce)');
  const derrota = crearDerrota(dom.escenario, () => reiniciar());

  let raf = 0;
  let ultimo = 0;
  const reloj = crearReloj();
  let partida = null;

  function iniciarPartida() {
    partida = crearPartida(dom, roles, frames, reducido, () => derrota.mostrar());
  }

  function reiniciar() {
    partida.destruir();
    derrota.ocultar();
    iniciarPartida();
    ajustar();
  }

  function bucle(ahora) {
    raf = requestAnimationFrame(bucle);
    reloj.acumular((ahora - ultimo) / 1000);
    ultimo = ahora;
    const pasos = reloj.pasos();
    for (let i = 0; i < pasos; i++) partida.simular(SIMULACION.paso);
    partida.dibujar();
  }

  function iniciar() {
    if (raf || document.hidden) return;
    ultimo = performance.now();
    reloj.cortar();
    raf = requestAnimationFrame(bucle);
  }

  function detener() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function ajustar() {
    const cs = getComputedStyle(dom.escenario);
    const izquierda = parseFloat(cs.paddingLeft);
    const derecha = parseFloat(cs.paddingRight);
    const arriba = parseFloat(cs.paddingTop);
    const abajo = parseFloat(cs.paddingBottom);
    const ancho = dom.escenario.clientWidth - izquierda - derecha;
    const alto = dom.escenario.clientHeight - arriba - abajo;

    const escala = calcularEscala({
      anchoCss: ancho,
      altoCss: alto,
      dpr: window.devicePixelRatio || 1,
      lado: TABLERO.columnas * TABLERO.celda,
    });

    if (dom.canvas.width !== escala.pixeles) {
      dom.canvas.width = escala.pixeles;
      dom.canvas.height = escala.pixeles;
    }
    dom.canvas.style.width = `${escala.css}px`;
    dom.canvas.style.height = `${escala.css}px`;
    dom.canvas.style.left = `${izquierda + Math.floor((ancho - escala.css) / 2)}px`;
    dom.canvas.style.top = `${arriba + Math.floor((alto - escala.css) / 2)}px`;

    partida.ajustarCatalogo();
    partida.dibujar();
  }

  const observador = new ResizeObserver(() => partida && ajustar());
  observador.observe(dom.escenario);
  const alVisibilidad = () => {
    if (document.hidden) {
      detener();
      reloj.cortar();
    } else iniciar();
  };
  const alCambiarVentana = () => partida && ajustar();
  window.addEventListener('resize', alCambiarVentana);
  document.addEventListener('visibilitychange', alVisibilidad);

  iniciarPartida();
  ajustar();
  iniciar();

  return {
    pantallaAMundo: (clientX, clientY) =>
      pantallaAMundo(dom.canvas.getBoundingClientRect(), clientX, clientY, TABLERO.columnas * TABLERO.celda),
    celdaEnPantalla: (clientX, clientY) => celdaDeCliente(dom.canvas, clientX, clientY, crearTablero()),
    seleccionada: () => partida.seleccion.seleccionada(),
    destruir() {
      detener();
      partida.destruir();
      observador.disconnect();
      window.removeEventListener('resize', alCambiarVentana);
      document.removeEventListener('visibilitychange', alVisibilidad);
      contenedor.replaceChildren();
      contenedor.classList.remove('herbario');
    },
  };
}
