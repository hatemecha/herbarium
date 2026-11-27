import { BALANCE, FEEDBACK, PARTICULAS, SIMULACION, TABLERO } from './config.js';
import { crearAleatorio, semillaNueva } from './aleatorio.js';
import { COMPRABLES, ENEMIGOS, PLANTAS } from './catalogo.js';
import { crearAnimacion } from './animacion.js';
import { crearCatalogoUI } from './catalogoUI.js';
import { crearColocacion } from './colocacion.js';
import { crearCombate } from './combate.js';
import { crearDerrota } from './derrota.js';
import { calcularEscala, celdaDeCliente, pantallaAMundo } from './escala.js';
import { apagar, crearEstado, avanzar } from './estado.js';
import { crearJardin } from './jardin.js';
import { asegurarVariables, crearRoles, leerPaleta, rgb } from './paleta.js';
import { crearDirector } from './oleadas.js';
import { crearParticulas } from './particulas.js';
import { crearReloj } from './reloj.js';
import { crearRenderer } from './render.js';
import { crearSeleccion } from './seleccion.js';
import { crearTablero } from './tablero.js';
import { construirFotogramas } from './sprites/dibujo.js';
import { LADO_ESTRELLA, pintarEstrellaYTexto } from './sprites/estrella.js';

const FUENTE_ENERGIA = '11px MonoMEK, ui-monospace, monospace';
const ALTO_ENERGIA = 14;

function pintarEnergia(canvas, roles, valor) {
  const texto = String(valor);
  const probe = canvas.getContext('2d');
  probe.setTransform(1, 0, 0, 1, 0, 0);
  probe.font = FUENTE_ENERGIA;
  const ancho = Math.ceil(LADO_ESTRELLA + 2 + probe.measureText(texto).width);
  const css = parseFloat(getComputedStyle(canvas.parentElement).fontSize) || 40;
  const dpr = window.devicePixelRatio || 1;
  const zoom = Math.max(2, Math.round((css / 11) * dpr));
  if (canvas.width !== ancho * zoom || canvas.height !== ALTO_ENERGIA * zoom) {
    canvas.width = ancho * zoom;
    canvas.height = ALTO_ENERGIA * zoom;
  }
  canvas.style.width = `${(ancho * zoom) / dpr}px`;
  canvas.style.height = `${(ALTO_ENERGIA * zoom) / dpr}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(zoom, 0, 0, zoom, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, ancho, ALTO_ENERGIA);
  ctx.font = FUENTE_ENERGIA;
  ctx.textAlign = 'left';
  pintarEstrellaYTexto(ctx, 0, 11, texto, rgb(roles.energiaUI), rgb(roles.energiaUI));
}

function construirDom(contenedor) {
  contenedor.classList.add('herbario');
  contenedor.innerHTML = `
    <header class="herbario-barra">
      <div class="energia" aria-live="polite">
        <canvas class="energia-lienzo" aria-hidden="true"></canvas>
      </div>
      <span class="solo-lector" role="status"></span>
    </header>
    <div class="herbario-campo">
      <div class="herbario-escenario">
        <canvas class="tablero" role="img" aria-label="Jardín en penumbra con una planta central que genera energía"></canvas>
        <div class="escenario-evento" aria-hidden="true"></div>
      </div>
    </div>`;
  return {
    campo: contenedor.querySelector('.herbario-campo'),
    escenario: contenedor.querySelector('.herbario-escenario'),
    canvas: contenedor.querySelector('.tablero'),
    energia: contenedor.querySelector('.energia'),
    energiaLienzo: contenedor.querySelector('.energia-lienzo'),
    anuncio: contenedor.querySelector('.solo-lector'),
    evento: contenedor.querySelector('.escenario-evento'),
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
  let gesto = null;
  let consulta = null;
  let inspeccion = null;
  let pulsoCentro = FEEDBACK.oleada;
  let faseVisual = '';
  let eventoHasta = 0;
  let criticoAnterior = false;
  const pulsos = new Map();

  function marcar(tipo, celda) {
    gesto = { tipo, celda, hasta: estado.tiempo + FEEDBACK.gesto };
    if (tipo === 'invalida') {
      avisar(tablero.ocupante(celda.x, celda.y)
        ? 'Esa casilla está ocupada.'
        : 'Planta junto a otra planta viva.');
    }
  }

  function avisar(mensaje) {
    texto(dom.anuncio, mensaje);
    texto(dom.evento, mensaje);
    delete dom.evento.dataset.evento;
    eventoHasta = estado.tiempo + 2.2;
  }

  function texto(elemento, valor) {
    if (elemento.textContent !== valor) elemento.textContent = valor;
  }

  function pulso(elemento, clase, duracion) {
    elemento.dataset.pulso = clase;
    pulsos.set(elemento, estado.tiempo + duracion);
  }
  const particulas = crearParticulas({ aleatorio: crearAleatorio((semilla + 2) >>> 0) });
  const render = crearRenderer({ tablero, salida: dom.canvas, roles, frames });

  const animadores = Object.fromEntries(
    COMPRABLES.map((tipo, indice) => {
      const animacion = crearAnimacion({ secuencia: tipo.arte.secuencia, desfase: 0.2 + indice * 0.45 });
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
      if (planta.id !== 'central') {
        inspeccion = null;
        marcar('plantada', planta.celda);
        pulso(dom.energia, 'compra', FEEDBACK.gesto);
        catalogo.comprada?.(planta.id, estado.tiempo);
        if (!reducido.matches) particulas.rafaga(planta.nucleo.x, planta.nucleo.y, 9, { familia: 'brote', color: roles.hojaBrillo });
      }
    },
    alRetirar: (planta) => render.retirarPlanta(planta),
  });
  jardin.sembrar('central', tablero.centro);
  if (!reducido.matches) particulas.rafaga(jardin.central.nucleo.x, jardin.central.nucleo.y, 10, { familia: 'brote', color: roles.nucleo });
  const combate = crearCombate({
    tablero,
    jardin,
    tipoEnemigo: ENEMIGOS.escarabajo,
    catalogoEnemigos: ENEMIGOS,
    director,
    aleatorio: aleatorioVisual,
  });
  const seleccion = crearSeleccion({
    tablero,
    canvas: dom.canvas,
    alPulsarCelda: (celda) => {
      inspeccion = null;
      marcar('seleccion', celda);
    },
  });
  const tactil = window.matchMedia('(pointer: coarse)');
  const catalogo = crearCatalogoUI({
    contenedor: dom.campo,
    tipos: COMPRABLES,
    animadores,
    roles,
    alConsultar: (id) => { consulta = id; },
    alElegir: (id) => {
      if (combate.derrota()) return;
      if (estado.energia < jardin.coste(id)) {
        colocacion.cancelar();
        seleccion.limpiar();
        inspeccion = id;
        const faltan = Math.ceil(jardin.coste(id) - estado.energia);
        texto(dom.anuncio, faltan === 1 ? 'Falta 1 de energía.' : `Faltan ${faltan} de energía.`);
        return;
      }
      inspeccion = null;
      colocacion.alternar(id);
    },
  });
  const colocacion = crearColocacion({
    tablero,
    canvas: dom.canvas,
    jardin,
    zona: catalogo.elemento,
    alActivar: () => seleccion.limpiar(),
    alIntentar: marcar,
  });
  let derrotaAvisada = false;

  function actualizarEnergia() {
    const valor = Math.floor(estado.energia);
    if (dom.energia.dataset.valor === String(valor) && dom.energiaLienzo.width) return;
    dom.energia.dataset.valor = String(valor);
    pintarEnergia(dom.energiaLienzo, roles, valor);
    dom.energia.setAttribute('aria-label', `energía ${valor}`);
  }

  function procesarEventos() {
    const celda = tablero.celda;
    const reduce = reducido.matches;
    for (const ev of combate.eventos()) {
      const x = ev.x * celda;
      const y = ev.y * celda;
      if (ev.tipo === 'mordida' && ev.central) {
        estado.impulso = Math.max(estado.impulso, 0.8);
      }
      if (ev.tipo === 'muerte-planta' && !ev.central) {
        texto(dom.anuncio, PLANTAS[ev.planta].nombre + ' se marchitó');
      }
      if (reduce) continue;
      if (ev.tipo === 'impacto' && ev.planta !== 'hongo') {
        particulas.rafaga(x, y, ev.bloqueado ? 3 : 5, {
          familia: ev.bloqueado ? 'reflejo' : 'impacto',
          color: ev.bloqueado ? roles.ambiental : roles.bocaBrillo,
          ux: ev.bloqueado ? -ev.ux : ev.ux,
          uy: ev.bloqueado ? -ev.uy : ev.uy,
        });
      } else if (ev.tipo === 'muerte-enemigo' || ev.tipo === 'muerte-planta') {
        particulas.rafaga(x, y, ev.central ? 18 : 7, {
          familia: 'restos',
          color: ev.tipo === 'muerte-planta' ? roles.hojaLuz : roles.insectoBrillo,
        });
      } else if (ev.tipo === 'reflejo') {
        particulas.rafaga(x, y, 5, { familia: 'reflejo', color: roles.ambiental, ux: ev.ux, uy: ev.uy });
      } else if (ev.tipo === 'esporas') {
        particulas.rafaga(x, y, 14, { familia: 'espora', color: roles.hongoLuz, radio: BALANCE.hongo.alcance * celda });
      } else if (ev.tipo === 'atraccion') {
        particulas.rafaga(x, y, 2, { familia: 'control', color: roles.ambiental });
      } else if (ev.tipo === 'control') {
        particulas.rafaga(x, y, 3, { familia: 'control', color: roles.campanaLuz });
      } else if (ev.tipo === 'mordida') {
        particulas.rafaga(x, y, 3, { familia: 'restos', color: roles.hojaLuz });
      } else if (ev.tipo === 'disparo') {
        particulas.rafaga(x + ev.ux * 4, y + ev.uy * 4, 3, { familia: 'disparo', color: roles.bocaBrillo, ux: ev.ux, uy: ev.uy });
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
      if (dom.energia.dataset.pulso !== 'compra') pulso(dom.energia, 'latido', FEEDBACK.gesto);
      if (!reduce) particulas.rafaga(jardin.central.nucleo.x, jardin.central.nucleo.y, PARTICULAS.rafaga, { familia: 'energia', color: roles.energiaUI });
    }
    for (const [elemento, hasta] of pulsos) {
      if (estado.tiempo < hasta) continue;
      delete elemento.dataset.pulso;
      pulsos.delete(elemento);
    }
    if (gesto && estado.tiempo >= gesto.hasta) gesto = null;
    if (eventoHasta && estado.tiempo >= eventoHasta) {
      eventoHasta = 0;
      texto(dom.evento, '');
      delete dom.evento.dataset.evento;
    }
    pulsoCentro = Math.max(0, pulsoCentro - dt);
    jardin.actualizar(dt, reduce);
    combate.actualizar(dt);
    procesarEventos();

    const central = jardin.central;
    particulas.actualizar(dt, central.nucleo.x, central.nucleo.y, !reduce && !caida, reduce);
    seleccion.actualizar(dt);
    colocacion.actualizar(dt);
    for (const animador of Object.values(animadores)) animador.actualizar(dt, reduce);

    if (caida && !derrotaAvisada && central.opacidad <= 0) {
      derrotaAvisada = true;
      alDerrota();
    }
  }

  function dibujar() {
    actualizarEnergia();
    const vista = colocacion.vista();
    const marcas = seleccion.marcas().filter((marca) => !(vista && marca.tipo === 'sobrevuelo'));
    const seleccionada = seleccion.seleccionada();
    const planta = seleccionada && tablero.ocupante(seleccionada.x, seleccionada.y);
    const tipo = vista ? PLANTAS[vista.tipoId] : planta?.tipo;
    const radio = tipo?.area?.alcance ?? tipo?.ralentiza?.alcance ?? tipo?.ataque?.alcance ?? tipo?.atraccion;
    const muestra = vista ? vista.valido && vista.puntero : seleccionada;
    const alcance = muestra && (radio || tipo?.reflejo) && { ...muestra, radio, tipo: tipo.id };
    const vistaOleada = director.vista();
    const fase = `${vistaOleada.numero}:${vistaOleada.fase}`;
    if (faseVisual !== fase) {
      const inicio = vistaOleada.fase === 'combate';
      if (faseVisual) {
        pulsoCentro = FEEDBACK.oleada;
        texto(dom.anuncio, inicio ? `Comienza la oleada ${vistaOleada.numero}` : `Oleada superada. Prepara la ${vistaOleada.numero}`);
        if (!inicio && !reducido.matches) particulas.rafaga(jardin.central.nucleo.x, jardin.central.nucleo.y, 12, { familia: 'brote', color: roles.energiaUI });
      }
      faseVisual = fase;
    }
    const costes = Object.fromEntries(COMPRABLES.map(({ id }) => [id, jardin.coste(id)]));
    const activa = colocacion.tipoActivo();
    const caido = combate.derrota();
    const panelId = caido ? null : activa ?? consulta ?? inspeccion;

    render.dibujar({
      alcance,
      aviso: caido ? null : director.aviso(),
      gesto: gesto && { ...gesto, intensidad: (gesto.hasta - estado.tiempo) / FEEDBACK.gesto },
      pulsoCentro: pulsoCentro / FEEDBACK.oleada,
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
      hoverCelda: seleccion.sobrevuelo(),
      tactil: tactil.matches,
    });
    const central = jardin.central;
    const criticaCentral = !central.muerta && central.vida <= central.vidaMax * FEEDBACK.critico;
    if (criticaCentral && !criticoAnterior) {
      texto(dom.anuncio, 'La planta central está en estado crítico.');
    }
    criticoAnterior = criticaCentral;

    catalogo.actualizar({
      energia: estado.energia,
      activa,
      costes,
      t: estado.tiempo,
      reducido: reducido.matches,
      panel: panelId,
      bloqueado: caido,
    });
  }

  actualizarEnergia();

  return {
    simular,
    dibujar,
    ajustarCatalogo: () => catalogo.ajustar(),
    derrota: () => combate.derrota(),
    seleccion,
    destruir() {
      for (const elemento of pulsos.keys()) delete elemento.dataset.pulso;
      texto(dom.anuncio, '');
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
    contenedor.style.setProperty('--ancho-jardin', `${escala.css}px`);
    delete dom.energia.dataset.valor;

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
