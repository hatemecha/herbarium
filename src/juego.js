import { BALANCE, FEEDBACK, OLEADAS, PARTICULAS, SIMULACION, TABLERO } from './config.js';
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
        <span class="energia-trazos" aria-hidden="true">${'<i></i>'.repeat(8)}</span>
      </div>
      <div class="fase">
        <span class="fase-oleada">oleada 1</span>
        <span class="fase-detalle"><span class="fase-etiqueta">preparación</span> <span class="fase-valor">20 s</span></span>
        <span class="fase-hitos" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
      </div>
      <span class="solo-lector" role="status"></span>
      <div class="ficha" data-interfaz>
        <p class="ficha-accion"></p>
      </div>
    </header>
    <div class="herbario-escenario">
      <canvas class="tablero" role="img" aria-label="Jardín en penumbra con una planta central que genera energía"></canvas>
    </div>`;
  return {
    escenario: contenedor.querySelector('.herbario-escenario'),
    canvas: contenedor.querySelector('.tablero'),
    energia: contenedor.querySelector('.energia'),
    trazos: [...contenedor.querySelectorAll('.energia-trazos i')],
    fase: contenedor.querySelector('.fase'),
    hitos: [...contenedor.querySelectorAll('.fase-hitos i')],
    anuncio: contenedor.querySelector('.solo-lector'),
    valor: contenedor.querySelector('.energia-valor'),
    oleada: contenedor.querySelector('.fase-oleada'),
    etiquetaFase: contenedor.querySelector('.fase-etiqueta'),
    valorFase: contenedor.querySelector('.fase-valor'),
    ficha: contenedor.querySelector('.ficha'),
    accion: contenedor.querySelector('.ficha-accion'),
  };
}

function construirFrames(roles) {
  const frames = {};
  for (const tipo of [...Object.values(PLANTAS), ...Object.values(ENEMIGOS)]) {
    frames[tipo.id] = construirFotogramas(tipo.arte, roles);
  }
  return frames;
}

function crearPartida(dom, roles, frames, reducido, alDerrota, reinicio) {
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
  let aviso = null;
  let pulsoCentro = reinicio ? FEEDBACK.oleada : 0;
  let faseVisual = '';
  let pendientesFase = 0;
  const pulsos = new Map();

  function marcar(tipo, celda) {
    gesto = { tipo, celda, hasta: estado.tiempo + FEEDBACK.gesto };
    if (tipo === 'preview') aviso = null;
    if (tipo === 'invalida') {
      avisar(tablero.ocupante(celda.x, celda.y)
        ? 'Esa casilla está ocupada.'
        : 'Planta junto a otra planta viva.');
    }
  }

  function avisar(mensaje) {
    aviso = { mensaje, hasta: estado.tiempo + 2.2 };
    texto(dom.anuncio, mensaje);
  }

  function texto(elemento, valor) {
    if (elemento.textContent !== valor) elemento.textContent = valor;
  }

  function pulso(elemento, clase, duracion) {
    elemento.dataset.pulso = clase;
    pulsos.set(elemento, estado.tiempo + duracion);
  }
  const particulas = crearParticulas();
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
        avisar(`En el jardín · ${planta.tipo.nombre}`);
        marcar('plantada', planta.celda);
        pulso(dom.energia, 'compra', FEEDBACK.gesto);
      }
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
  const seleccion = crearSeleccion({
    tablero,
    canvas: dom.canvas,
    alPulsarCelda: (celda) => {
      inspeccion = null;
      aviso = null;
      marcar('seleccion', celda);
    },
  });
  const tactil = window.matchMedia('(pointer: coarse)');
  const catalogo = crearCatalogoUI({
    contenedor: dom.escenario,
    tipos: COMPRABLES,
    animadores,
    roles,
    alConsultar: (id) => { consulta = id; },
    alElegir: (id) => {
      if (combate.derrota()) return;
      aviso = null;
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
    texto(dom.valor, String(Math.floor(estado.energia)));
  }

  function procesarEventos() {
    const celda = tablero.celda;
    const reduce = reducido.matches;
    for (const ev of combate.eventos()) {
      const x = ev.x * celda;
      const y = ev.y * celda;
      if (ev.tipo === 'mordida' && ev.central) estado.impulso = Math.max(estado.impulso, 0.8);
      if (reduce) continue;
      if (ev.tipo === 'impacto' && ev.planta !== 'hongo') {
        particulas.rafaga(x, y, 2, { color: roles.bocaBrillo, vida: FEEDBACK.gesto });
      } else if (ev.tipo === 'muerte-enemigo' || ev.tipo === 'muerte-planta') {
        particulas.rafaga(x, y, 3, {
          color: ev.tipo === 'muerte-planta' ? roles.marca : roles.insectoBrillo,
          vida: FEEDBACK.oleada,
        });
      } else if (ev.tipo === 'reflejo') {
        particulas.rafaga(x, y, 2, { color: roles.ambiental, vida: FEEDBACK.gesto });
      } else if (ev.tipo === 'esporas') {
        particulas.rafaga(x, y - 4, 4, { color: roles.hongoLuz, vida: BALANCE.visual.esporas });
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
      if (dom.energia.dataset.pulso !== 'compra') pulso(dom.energia, 'latido', FEEDBACK.gesto);
      if (!reduce) particulas.rafaga(jardin.central.nucleo.x, jardin.central.nucleo.y, PARTICULAS.rafaga);
    }
    for (const [elemento, hasta] of pulsos) {
      if (estado.tiempo < hasta) continue;
      delete elemento.dataset.pulso;
      pulsos.delete(elemento);
    }
    if (gesto && estado.tiempo >= gesto.hasta) gesto = null;
    if (aviso && estado.tiempo >= aviso.hasta) aviso = null;
    pulsoCentro = Math.max(0, pulsoCentro - dt);
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
    const seleccionada = seleccion.seleccionada();
    const planta = seleccionada && tablero.ocupante(seleccionada.x, seleccionada.y);
    const tipo = vista ? PLANTAS[vista.tipoId] : planta?.tipo;
    const radio = tipo?.area?.alcance ?? tipo?.ralentiza?.alcance ?? tipo?.ataque?.alcance;
    const muestra = vista ? vista.valido && vista.puntero : seleccionada;
    const alcance = muestra && (radio || tipo?.reflejo) && { ...muestra, radio, tipo: tipo.id };
    const vistaOleada = director.vista();
    const fase = `${vistaOleada.numero}:${vistaOleada.fase}`;
    if (faseVisual !== fase) {
      const inicio = vistaOleada.fase === 'combate';
      if (faseVisual) {
        pulso(dom.fase, inicio ? 'entra' : 'descansa', FEEDBACK.oleada);
        pulsoCentro = FEEDBACK.oleada;
        texto(dom.anuncio, inicio ? `Comienza la oleada ${vistaOleada.numero}` : `Oleada superada. Prepara la ${vistaOleada.numero}`);
      }
      if (inicio) pendientesFase = vistaOleada.porSalir;
      dom.fase.dataset.fase = vistaOleada.fase;
      faseVisual = fase;
    }
    const preparacion = vistaOleada.numero === 1 ? OLEADAS.preparacionInicial : OLEADAS.preparacion;
    const hitos = vistaOleada.fase === 'combate'
      ? Math.ceil(5 * vistaOleada.porSalir / Math.max(1, pendientesFase))
      : Math.ceil(5 * vistaOleada.restante / preparacion);
    dom.hitos.forEach((hito, i) => {
      const activo = i < hitos;
      if (hito.hasAttribute('data-activo') !== activo) hito.toggleAttribute('data-activo', activo);
    });
    render.dibujar({
      alcance,
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
    });
    const vivos = combate.enemigos.reduce((cantidad, enemigo) => cantidad + (enemigo.muerto ? 0 : 1), 0);
    texto(dom.oleada, `oleada ${vistaOleada.numero}`);
    const preparando = vistaOleada.fase === 'preparacion';
    texto(dom.etiquetaFase, preparando ? 'preparación' : vistaOleada.porSalir > 0 ? 'por salir' : 'en jardín');
    texto(dom.valorFase, preparando ? `${vistaOleada.restante} s` : String(vistaOleada.porSalir || vivos));
    dom.fase.toggleAttribute('data-alerta', preparando && vistaOleada.restante <= 3);

    const costes = Object.fromEntries(COMPRABLES.map(({ id }) => [id, jardin.coste(id)]));
    const activa = colocacion.tipoActivo();
    const panelId = consulta ?? activa ?? inspeccion;
    const objetivo = costes[panelId] ?? Math.min(...Object.values(costes));
    const carga = Math.min(8, Math.floor(8 * estado.energia / objetivo));
    dom.trazos.forEach((trazo, i) => trazo.toggleAttribute('data-activo', i < carga));

    const critica = planta && planta.vida > 0 && planta.vida <= planta.vidaMax * FEEDBACK.critico;
    const panelActivo = panelId && PLANTAS[panelId];
    const faltan = panelActivo?.comprable ? Math.max(0, Math.ceil(costes[panelId] - estado.energia)) : 0;
    const accionPanel = vista
      ? vista.valido && tactil.matches ? 'Toca otra vez.' : 'Junto al jardín.'
      : faltan === 1 ? 'Falta 1.' : faltan > 1 ? `Faltan ${faltan}.` : '';
    texto(dom.accion, aviso?.mensaje || (planta ? textoFicha(planta) : ''));
    dom.ficha.toggleAttribute('data-critica', Boolean(critica && !aviso));
    dom.ficha.toggleAttribute('data-aviso', Boolean(aviso));
    catalogo.actualizar({
      energia: estado.energia,
      activa,
      costes,
      t: estado.tiempo,
      reducido: reducido.matches,
      panel: panelId,
      accionPanel,
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

  function iniciarPartida(reinicio = false) {
    partida = crearPartida(dom, roles, frames, reducido, () => derrota.mostrar(), reinicio);
  }

  function reiniciar() {
    partida.destruir();
    derrota.ocultar();
    iniciarPartida(true);
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
