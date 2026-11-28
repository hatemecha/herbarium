import { BALANCE, FEEDBACK, PALA, PARTICULAS, SIMULACION, TABLERO } from './config.js';
import { crearAleatorio, semillaNueva } from './aleatorio.js';
import { crearCamara } from './camara.js';
import { COMPRABLES, ENEMIGOS, PLANTAS } from './catalogo.js';
import { crearAnimacion } from './animacion.js';
import { crearCatalogoUI } from './catalogoUI.js';
import { crearColocacion } from './colocacion.js';
import { crearTarotUI } from './interfazTarot.js';
import { ARCANOS, crearEfectosTarot } from './efectosTarot.js';
import { textoFicha } from './ficha.js';
import { crearTarot } from './tarot.js';
import { crearCombate } from './combate.js';
import { crearDerrota } from './derrota.js';
import { crearDescubrimientos } from './descubrimientos.js';
import { crearPausa } from './pausa.js';
import { alinearPixel } from './escala.js';
import { crearGestos } from './gestos.js';
import { crearRecompensaUI } from './interfazOleadas.js';
import { alinearSalida, cargarFuentePixel, colocarSalida, crearRotulo, INTERLINEADO_LECTURA, medirTexto, prepararSalida, presentar, superficie } from './interfazPixel.js';
import { apagar, crearEstado, avanzar } from './estado.js';
import { crearRegistro } from './metricas.js';
import { crearJardin } from './jardin.js';
import { asegurarVariables, crearRoles, leerPaleta, rgb } from './paleta.js';
import { crearDirector } from './oleadas.js';
import { crearParticulas } from './particulas.js';
import { crearReloj } from './reloj.js';
import { crearRenderer } from './render.js';
import { crearSeleccion } from './seleccion.js';
import { crearMundo } from './tablero.js';
import { construirFotogramas } from './sprites/dibujo.js';
import { LADO_ESTRELLA, pintarEstrellaYTexto } from './sprites/estrella.js';

const ALTO_ENERGIA = 14;
const AVISOS_COLOCACION = {
  ocupada: 'Casilla ocupada.',
  oculta: 'Terreno sin descubrir.',
  aislada: 'Junto a una planta viva.',
};
const PAUSA_ENERGIA = 'La central descansa.';

function pintarEnergia(canvas, botonPausa, roles, valor) {
  const texto = String(valor);
  // La última columna del avance de las cifras queda vacía.
  const ancho = LADO_ESTRELLA + 2 + medirTexto(texto) - 1;
  const css = parseFloat(getComputedStyle(canvas.parentElement).fontSize) || 40;
  const dpr = window.devicePixelRatio || 1;
  const zoomNormal = Math.max(2, Math.round((css / 12) * dpr));
  const barra = botonPausa.parentElement.clientWidth;
  const anchoControl = Math.max(botonPausa.offsetWidth, botonPausa.previousElementSibling.offsetWidth);
  const libre = barra - 2 * anchoControl - 16;
  const zoom = Math.max(1, Math.min(zoomNormal, Math.floor(libre * dpr / ancho)));
  canvas.parentElement.style.minHeight = `${ALTO_ENERGIA * zoomNormal / dpr}px`;
  const origen = superficie(ancho, ALTO_ENERGIA);
  pintarEstrellaYTexto(origen.getContext('2d'), 0, 10, texto, rgb(roles.energiaUI), rgb(roles.energiaUI));
  prepararSalida(canvas, ancho, ALTO_ENERGIA, zoom, dpr);
  // Compensa la diferencia de escala con los rótulos de los botones de la barra.
  canvas.parentElement.style.top = `${(zoom - Math.round(2 * dpr)) / dpr}px`;
  presentar(origen, canvas);
  alinearSalida(canvas, dpr);
}

function construirDom(contenedor) {
  contenedor.classList.add('herbario');
  contenedor.innerHTML = `
    <header class="herbario-barra">
      <div class="energia" aria-live="polite">
        <canvas class="energia-lienzo" aria-hidden="true"></canvas>
      </div>
      <span class="solo-lector" role="status"></span>
      <button type="button" class="centro-boton" aria-label="Centrar jardín"></button>
      <button type="button" class="pausa-boton" aria-haspopup="dialog"></button>
    </header>
    <div class="herbario-campo">
      <div class="herbario-escenario">
        <canvas class="tablero" tabindex="0" role="img" aria-label="Jardín en penumbra. Más y menos para acercar o alejar. Cero para volver a la planta central."></canvas>
        <div class="escenario-evento" aria-hidden="true"></div>
      </div>
    </div>
    <div class="motas-energia" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>`;
  return {
    centro: contenedor.querySelector('.centro-boton'),
    pausa: contenedor.querySelector('.pausa-boton'),
    motas: contenedor.querySelector('.motas-energia'),
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

function crearPartida(dom, roles, frames, reducido, alDerrota, descubrimientos, camara, alMoverVista, habilitado,
  { recompensas, alTarot } = {}) {
  const tablero = crearMundo();
  const semilla = semillaNueva();
  const director = crearDirector({
    tablero,
    aleatorio: crearAleatorio(semilla),
    semilla,
    recompensas,
  });
  const aleatorioVisual = crearAleatorio((semilla + 1) >>> 0);
  const estado = crearEstado();
  const efectos = crearEfectosTarot(estado);
  const registro = crearRegistro();
  const comienzo = performance.now();
  let tiempoPremios = 0;
  const premios = { energia: 0, vacia: 0, tarot: 0 };
  let retiradas = 0;
  let recuperada = 0;
  const eventosUI = new AbortController();
  let usandoPala = false;
  let retiroVista = null;
  let retiroPendiente = null;
  let avisoVisual = false;
  let generabaEnergia = true;
  let gesto = null;
  let consulta = null;
  let inspeccion = null;
  let pulsoCentro = FEEDBACK.oleada;
  let faseVisual = '';
  let eventoHasta = 0;
  let criticoAnterior = false;
  let resultadoFinal;
  const pulsos = new Map();
  let ultimoPreview = -Infinity;
  let casillaPreview;

  function motasDeCasilla(celda, cantidad, color) {
    if (reducido.matches || combate.derrota()) return;
    particulas.rafaga((celda.x + 0.5) * tablero.celda, (celda.y + 0.5) * tablero.celda,
      cantidad, { familia: 'gesto', color });
  }

  function marcar(tipo, celda) {
    gesto = { tipo, celda, hasta: estado.tiempo + FEEDBACK.gesto };
    if (tipo === 'seleccion' || tipo === 'preview') motasDeCasilla(celda, 3, roles.marca);
    if (tipo === 'invalida') {
      const { x, y } = celda;
      const motivo = !tablero.contiene(x, y) ? 'oculta'
        : tablero.ocupante(x, y) ? 'ocupada' : 'aislada';
      avisar(AVISOS_COLOCACION[motivo]);
    }
  }

  function avisar(mensaje) {
    texto(dom.anuncio, mensaje);
    if (dom.evento.dataset.evento === 'oleada' && eventoHasta > estado.tiempo) return;
    texto(dom.evento, mensaje);
    delete dom.evento.dataset.evento;
    eventoHasta = estado.tiempo + 2.2;
  }

  function texto(elemento, valor) {
    if (elemento.textContent === valor) return;
    if (elemento === dom.evento) dom.rotuloEvento.actualizar(valor);
    else elemento.textContent = valor;
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
    efectos,
    frames,
    permitido: () => habilitado() && !director.enRecompensa() && !tarotUI?.abierta(),
    alPlantar(planta) {
      render.registrarPlanta(planta);
      actualizarEnergia();
      if (planta.id !== 'central') {
        registro.gastada(planta.costePagado, planta.id);
        inspeccion = null;
        marcar('plantada', planta.celda);
        pulso(dom.energia, 'compra', FEEDBACK.gesto);
        if (!reducido.matches) particulas.rafaga(planta.nucleo.x, planta.nucleo.y, 9, { familia: 'brote', color: roles.hojaBrillo });
      }
    },
    alRetirar(planta, voluntaria) {
      render.retirarPlanta(planta);
      if (voluntaria) combate.desvincular(planta);
    },
  });
  let tarotUI;
  jardin.sembrar('central', tablero.centro);
  if (!reducido.matches) particulas.rafaga(jardin.central.nucleo.x, jardin.central.nucleo.y, 10, { familia: 'brote', color: roles.nucleo });
  const combate = crearCombate({
    tablero,
    jardin,
    tipoEnemigo: ENEMIGOS.escarabajo,
    catalogoEnemigos: ENEMIGOS,
    alAparecer: (id) => descubrimientos.registrar('enemigos', id),
    director,
    aleatorio: aleatorioVisual,
  });
  function desdePantalla(x, y) {
    const mundo = camara.mundo({ x, y });
    return tablero.celdaEnMundo(mundo.x, mundo.y);
  }
  const celdaDe = ({ clientX, clientY }) => camara.contiene(clientX, clientY)
    ? desdePantalla(clientX, clientY)
    : null;
  const seleccion = crearSeleccion({
    tablero,
    canvas: dom.canvas,
    celdaDe,
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
    alPala() {
      if (!operable() || director.vista().numero < PALA.desdeOleada) return;
      if (usandoPala) cancelarPala();
      else {
        gestos.cancelar();
        colocacion.cancelar();
        seleccion.limpiar();
        usandoPala = true;
        texto(dom.anuncio, 'Elegí una planta para retirar.');
      }
    },
    alElegir: (id) => { if (elegible(id)) colocacion.alternar(id); },
  });
  const colocacion = crearColocacion({
    canvas: dom.canvas,
    jardin,
    zona: catalogo.elemento,
    celdaDe,
    alActivar: () => seleccion.limpiar(),
    alIntentar: marcar,
  });
  let derrotaAvisada = false;
  let ultimoBrote = -Infinity;
  let trayecto;

  const operable = () => !tarotUI?.abierta() && habilitado() && !combate.derrota() && !director.enRecompensa();

  function cancelarPala() {
    usandoPala = false;
    retiroVista = null;
    retiroPendiente = null;
  }

  function consultarRetiro(celda) {
    const energia = celda ? jardin.reembolso(celda) : null;
    retiroVista = { celda, energia };
    return energia;
  }

  function usarPala(e, celda) {
    const energia = consultarRetiro(celda);
    if (energia === null) {
      retiroPendiente = null;
      return;
    }
    const ocupante = tablero.ocupante(celda.x, celda.y);
    if (e.pointerType === 'touch' && retiroPendiente !== ocupante) {
      retiroPendiente = ocupante;
      texto(dom.anuncio, `Recuperás ${energia} de energía. Tocá otra vez para retirar.`);
      return;
    }
    const retirada = jardin.retirar(celda);
    if (!retirada) return;
    retiradas++;
    recuperada += retirada.energia;
    seleccion.limpiar();
    cancelarPala();
    actualizarEnergia();
    marcar('retirada', celda);
    avisar(retirada.energia ? `+${retirada.energia} de energía` : 'Planta retirada');
    if (!reducido.matches) {
      const { x, y } = retirada.planta.nucleo;
      particulas.rafaga(x, y, 9, { familia: 'brote', color: roles.hojaBrillo });
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cancelarPala();
  }, { signal: eventosUI.signal });
  dom.canvas.addEventListener('pointerleave', () => {
    if (!retiroPendiente) retiroVista = null;
  }, { signal: eventosUI.signal });

  function elegible(id, conservarSeleccion = false) {
    if (!operable()) return false;
    cancelarPala();
    const faltan = Math.ceil(jardin.coste(id) - estado.energia);
    if (faltan > 0 && !jardin.candidatas(id).length) {
      if (!conservarSeleccion) {
        colocacion.cancelar();
        seleccion.limpiar();
      }
      inspeccion = id;
      texto(dom.anuncio, faltan === 1 ? 'Falta 1 de energía.' : `Faltan ${faltan} de energía.`);
      return false;
    }
    inspeccion = null;
    return true;
  }

  const gestos = crearGestos({
    campo: dom.campo,
    canvas: dom.canvas,
    catalogo: catalogo.elemento,
    camara,
    habilitado: operable,
    alMoverVista() {
      trayecto = null;
      colocacion.salir();
      seleccion.limpiarSobrevuelo();
      alMoverVista();
      dibujar();
    },
    alTocar(e) {
      const celda = celdaDe(e);
      if (!celda) return;
      if (usandoPala) {
        usarPala(e, celda);
        return;
      }
      if (!colocacion.pulsar(e)) seleccion.pulsar(e);
    },
    alSobrevolar(e) {
      if (usandoPala) {
        if (e.pointerType !== 'touch') consultarRetiro(celdaDe(e));
        return;
      }
      colocacion.mover(e);
      seleccion.mover(e);
    },
    alArrastrar(id) {
      if (!elegible(id, true)) return false;
      colocacion.arrastrar(id);
      return true;
    },
    alMoverSemilla: colocacion.moverSemilla,
    alSoltar: colocacion.soltar,
    alCancelarSemilla: colocacion.cancelar,
  });

  const recompensaUI = crearRecompensaUI({
    escenario: dom.escenario, roles, reducido,
    alRevelar(t) {
      if (!habilitado()) return;
      director.revelarDesde(t);
      dibujar();
    },
    alContinuar() {
      if (!habilitado()) return;
      presentarPremio(0, true);
      dibujar();
    },
  });

  tarotUI = crearTarotUI({
    escenario: dom.escenario, hud: dom.escenario, foco: dom.canvas, habilitado,
    tarot: crearTarot(semilla, Object.keys(ARCANOS).map(Number)),
    alAbrir() {
      gestos.cancelar();
      colocacion.cancelar();
      cancelarPala();
    },
    alResponder(carta) {
      jardin.adquirirArcano(carta);
      descubrimientos.registrar('tarot', carta.id + ':' + Number(carta.invertida));
    },
  });

  function presentarPremio(dt, continuar = false) {
    const premio = director.presentar(dt, estado, { rapido: reducido.matches, continuar });
    if (premio) premios[premio.tipo]++;
    if (premio?.tipo === 'tarot') {
      const finalizar = () => !eventosUI.signal.aborted && director.finalizarTarot(premio);
      if (alTarot) alTarot(premio, finalizar);
      else tarotUI.abrir(finalizar);
    }
    if (premio && !director.enRecompensa() && recompensaUI.teniaFoco()) dom.canvas.focus({ preventScroll: true });
  }

  function dibujarMotas() {
    const edad = estado.tiempo - ultimoBrote;
    const motas = Array.from(dom.motas.children);
    const desfase = 0.12;
    const viaje = 0.8;
    const visibles = !reducido.matches && !combate.derrota() && edad < desfase * (motas.length - 1) + viaje;
    dom.motas.hidden = !visibles;
    if (!visibles) return;
    if (!trayecto) {
      const capa = dom.motas.getBoundingClientRect();
      const centro = camara.pantalla(jardin.central.nucleo);
      const destino = dom.energiaLienzo.getBoundingClientRect();

      trayecto = {
        x: centro.x - capa.left,
        y: centro.y - capa.top,
        finX: destino.left - capa.left + destino.height * LADO_ESTRELLA / ALTO_ENERGIA / 2,
        finY: destino.top - capa.top + destino.height * 5.5 / ALTO_ENERGIA,
      };
    }
    const { x, y, finX, finY } = trayecto;
    const dpr = window.devicePixelRatio || 1;
    const capa = dom.motas.getBoundingClientRect();
    const lado = Math.max(1, Math.round(dpr)) / dpr;
    for (const [i, mota] of motas.entries()) {
      const t = Math.max(0, Math.min(1, (edad - i * desfase) / viaje));
      const arco = Math.sin(Math.PI * t);
      const deriva = ((i % 3) - 1) * 6;
      mota.style.opacity = String(arco * (0.28 - i * 0.03));
      mota.style.width = mota.style.height = `${lado}px`;
      mota.style.left = `${alinearPixel(capa.left + x + (finX - x) * t + arco * deriva, dpr) - capa.left}px`;
      mota.style.top = `${alinearPixel(capa.top + y + (finY - y) * t, dpr) - capa.top}px`;
    }
  }

  function actualizarEnergia() {
    const valor = Math.floor(estado.energia);
    if (dom.energia.dataset.valor === String(valor) && dom.energiaLienzo.width) return;
    dom.energia.dataset.valor = String(valor);
    pintarEnergia(dom.energiaLienzo, dom.pausa, roles, valor);
    dom.energia.setAttribute('aria-label', `energía ${valor}`);
  }

  function procesarEventos() {
    const celda = tablero.celda;
    const reduce = reducido.matches;
    const eventos = combate.eventos();
    registro.eventos(eventos);
    for (const ev of eventos) {
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
        render.destello(x + ev.ux * 3, y + ev.uy * 3, 12, roles.ambiental, estado.tiempo);
        particulas.rafaga(x, y, 5, { familia: 'reflejo', color: roles.ambiental, ux: ev.ux, uy: ev.uy });
      } else if (ev.tipo === 'esporas') {
        render.destello(x, y, BALANCE.hongo.alcance * celda, roles.hongoLuz, estado.tiempo);
        particulas.rafaga(x, y, 14, { familia: 'espora', color: roles.hongoLuz, radio: BALANCE.hongo.alcance * celda });
      } else if (ev.tipo === 'aterrizaje') {
        particulas.rafaga(x, y + 4, 2, { familia: 'gesto', color: roles.tierra });
      } else if (ev.tipo === 'atraccion') {
        particulas.rafaga(x, y, 2, { familia: 'control', color: roles.ambiental });
      } else if (ev.tipo === 'control') {
        particulas.rafaga(x, y, 3, { familia: 'control', color: roles.campanaLuz });
      } else if (ev.tipo === 'mordida') {
        particulas.rafaga(x, y, 3, { familia: 'restos', color: roles.hojaLuz });
      } else if (ev.tipo === 'disparo') {
        render.destello(x + ev.ux * 5, y + ev.uy * 5, 11, roles.bocaBrillo, estado.tiempo);
        particulas.rafaga(x + ev.ux * 4, y + ev.uy * 4, 3, { familia: 'disparo', color: roles.bocaBrillo, ux: ev.ux, uy: ev.uy });
      }
    }
  }

  function emisorDePolen(fraccion) {
    const vivas = jardin.plantas.filter((planta) => !planta.muerta);
    const planta = vivas[Math.floor(fraccion * vivas.length)];
    return { ...planta.nucleo, color: roles[planta.tipo.resplandor?.color ?? 'petalo'] };
  }

  function simular(dt) {
    if (tarotUI.abierta()) return;
    if (director.enRecompensa()) {
      tiempoPremios += dt;
      presentarPremio(dt);
      return;
    }
    const reduce = reducido.matches;
    const caida = combate.derrota();
    const genera = director.generaEnergia();
    if (!caida && generabaEnergia && !genera) avisar(PAUSA_ENERGIA);
    generabaEnergia = genera;
    if (caida) {
      apagar(estado, dt);
    } else {
      registro.generada(efectos.generacion(genera) * dt);
      const genero = avanzar(estado, dt, efectos.energia(dt, genera, director.enCombate()));
      if (genero) {
        actualizarEnergia();
        if (dom.energia.dataset.pulso !== 'compra') pulso(dom.energia, 'latido', FEEDBACK.gesto);
        ultimoBrote = estado.tiempo;
        trayecto = null;
      }
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
    if (!resultadoFinal && combate.derrota()) {
      resultadoFinal = {
        activo: combate.tiempo(),
        total: Math.max(combate.tiempo() + tiempoPremios, (performance.now() - comienzo) / 1000),
        invasiones: director.historial().length,
        cultivadas: Object.values(registro.datos.compras).reduce((a, b) => a + b, 0),
        perdidas: registro.datos.plantasPerdidas,
        retiradas, recuperada,
        eliminados: registro.datos.insectosEliminados,
        generada: registro.datos.energiaGenerada,
        premios: { ...premios },
      };
    }
    if (director.enRecompensa()) {
      gestos.cancelar();
      colocacion.cancelar();
      cancelarPala();
    }

    const central = jardin.central;
    particulas.actualizar(dt, !central.muerta, reduce, emisorDePolen);
    seleccion.actualizar(dt);
    colocacion.actualizar(dt);
    for (const animador of Object.values(animadores)) animador.actualizar(dt, reduce);

    if (caida && !derrotaAvisada && central.opacidad <= 0) {
      derrotaAvisada = true;
      gestos.cancelar();
      alDerrota(resultadoFinal);
    }
  }

  function dibujar() {
    actualizarEnergia();
    dibujarMotas();
    if (usandoPala && retiroVista?.celda) consultarRetiro(retiroVista.celda);
    const vista = colocacion.vista();
    const puntero = !tactil.matches && vista?.valido ? vista.puntero : null;
    const casilla = puntero ? puntero.y * tablero.columnas + puntero.x : null;
    if (casilla !== null && casilla !== casillaPreview && estado.tiempo - ultimoPreview >= 0.16) {
      motasDeCasilla(puntero, 2, roles.marcaSuave);
      ultimoPreview = estado.tiempo;
    }
    casillaPreview = casilla;
    const marcas = seleccion.marcas().filter((marca) => !(vista && marca.tipo === 'sobrevuelo'));
    const seleccionada = seleccion.seleccionada();
    const planta = seleccionada && tablero.ocupante(seleccionada.x, seleccionada.y);
    const tipo = vista ? PLANTAS[vista.tipoId] : planta?.tipo;
    const radio = tipo?.area?.alcance ?? tipo?.ralentiza?.alcance ?? tipo?.ataque?.alcance ?? tipo?.atraccion;
    const muestra = vista ? vista.valido && vista.puntero : seleccionada;
    const alcance = muestra && (radio || tipo?.reflejo) && { ...muestra, radio, tipo: tipo.id };
    const vistaOleada = director.vista();
    const fase = `${vistaOleada.numero}:${vistaOleada.fase}`;
    const aviso = !combate.derrota() && director.aviso();
    if (aviso && !avisoVisual) anunciarOleada('Se acerca una oleada');
    avisoVisual = aviso;
    if (faseVisual !== fase && !combate.derrota()) {
      if (vistaOleada.fase === 'combate' || vistaOleada.fase === 'recompensa') {
        pulsoCentro = FEEDBACK.oleada;
        anunciarOleada(vistaOleada.fase === 'combate' ? `Oleada ${vistaOleada.numero}` : 'Oleada superada');
      } else if (faseVisual.endsWith(':recompensa')) texto(dom.evento, '');
      faseVisual = fase;
    }
    const activa = colocacion.tipoActivo();
    const costes = Object.fromEntries(COMPRABLES.map(({ id }) => [
      id, jardin.coste(id, id === activa ? vista?.puntero : undefined),
    ]));
    const caido = combate.derrota();
    if (caido && dom.evento.textContent) texto(dom.evento, '');
    const panelId = caido ? null : activa ?? consulta ?? inspeccion;

    render.dibujar({
      region: camara.region(),
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
      retiro: usandoPala && { celda: retiroVista?.celda, valido: retiroVista?.energia != null },
      hoverCelda: seleccion.sobrevuelo(),
      tactil: tactil.matches,
    });
    const central = jardin.central;
    const criticaCentral = !central.muerta && central.vida <= central.vidaMax * FEEDBACK.critico;
    if (criticaCentral && !criticoAnterior) {
      texto(dom.anuncio, 'La planta central está en estado crítico.');
    }
    criticoAnterior = criticaCentral;

    const palaLista = director.vista().numero >= PALA.desdeOleada;
    if (usandoPala && !palaLista) cancelarPala();
    catalogo.actualizar({
      energia: estado.energia,
      activa,
      costes,
      t: estado.tiempo,
      reducido: reducido.matches,
      panel: panelId,
      herramienta: usandoPala ? (retiroVista?.energia == null ? 'Elegí una planta para retirar.'
        : `Recuperás ${retiroVista.energia} de energía.`) : (planta && !panelId ? textoFicha(planta, jardin.ataque(planta)) : null),
      bloqueado: caido || director.enRecompensa(),
      palaLista,
    });
    recompensaUI.actualizar(vistaOleada, (mensaje) => texto(dom.anuncio, mensaje));
  }

  function anunciarOleada(mensaje) {
    delete dom.evento.dataset.evento;
    avisar(mensaje);
    dom.evento.dataset.evento = 'oleada';
  }

  actualizarEnergia();

  return {
    simular,
    dibujar,
    ajustarCatalogo() {
      trayecto = null;
      catalogo.ajustar();
      recompensaUI.ajustar();
      tarotUI.ajustar();
    },
    derrota: () => combate.derrota(),
    cancelarGestos() { gestos.cancelar(); cancelarPala(); },
    seleccion,
    desdePantalla,
    destruir() {
      gestos.destruir();
      eventosUI.abort();
      recompensaUI.destruir();
      tarotUI.destruir();
      for (const elemento of pulsos.keys()) delete elemento.dataset.pulso;
      texto(dom.anuncio, '');
      dom.motas.hidden = true;
      seleccion.destruir();
      colocacion.destruir();
      catalogo.destruir();
    },
  };
}

export function montarHerbario(contenedor, opciones = {}) {
  asegurarVariables();
  const roles = crearRoles(leerPaleta());
  const dom = construirDom(contenedor);
  const rotuloCentro = crearRotulo(dom.centro, 'Centrar', { escala: 2 });
  const rotuloPausa = crearRotulo(dom.pausa, 'Pausa', { escala: 2, pausa: true });
  dom.rotuloEvento = crearRotulo(dom.evento, '', {
    ancho: () => dom.evento.clientWidth, centro: true, interlineado: INTERLINEADO_LECTURA,
  });
  const frames = construirFrames(roles);
  const reducido = matchMedia('(prefers-reduced-motion: reduce)');
  const medio = TABLERO.celda / 2;
  const camara = crearCamara(TABLERO.celda, { centroMundo: { x: medio, y: medio } });
  const derrota = crearDerrota(dom.escenario, () => reiniciar());

  let raf = 0;
  let ultimo = 0;
  const reloj = crearReloj();
  let partida = null;
  const descubrimientos = crearDescubrimientos();
  descubrimientos.registrar('plantas', PLANTAS.central.id, ...COMPRABLES.map(({ id }) => id));
  const pausa = crearPausa({
    contenedor,
    boton: dom.pausa,
    frames,
    roles,
    reducido,
    descubrimientos,
    caido: () => partida.derrota(),
    alAbrir() {
      partida.cancelarGestos();
      detener();
      reloj.cortar();
      contenedor.classList.add('herbario-en-pausa');
    },
    alCerrar() {
      contenedor.classList.remove('herbario-en-pausa');
      iniciar();
    },
    alReiniciar: reiniciar,
  });

  function iniciarPartida() {
    partida = crearPartida(dom, roles, frames, reducido, datos => derrota.mostrar(datos), descubrimientos,
      camara, proyectarTablero, () => !document.hidden && !pausa.abierta(), opciones);
  }

  function reiniciar() {
    partida.destruir();
    camara.restablecer();
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
    if (raf || document.hidden || pausa.abierta()) return;
    ultimo = performance.now();
    reloj.cortar();
    raf = requestAnimationFrame(bucle);
  }

  function detener() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function ajustar() {
    const dpr = window.devicePixelRatio || 1;
    rotuloCentro.actualizar();
    rotuloPausa.actualizar();
    partida.ajustarCatalogo();
    const cs = getComputedStyle(dom.escenario);
    const izquierda = parseFloat(cs.paddingLeft);
    const derecha = parseFloat(cs.paddingRight);
    const arriba = parseFloat(cs.paddingTop);
    const abajo = parseFloat(cs.paddingBottom);
    const rect = dom.escenario.getBoundingClientRect();
    const ancho = rect.width - izquierda - derecha;
    const alto = rect.height - arriba - abajo;

    camara.ajustar({ left: rect.left + izquierda, top: rect.top + arriba, width: ancho, height: alto }, dpr);
    proyectarTablero();
    delete dom.energia.dataset.valor;

    partida.dibujar();
    dom.rotuloEvento.actualizar();
    derrota.ajustar();
    pausa.ajustar();
  }

  function proyectarTablero() {
    const dpr = window.devicePixelRatio || 1;
    const { escala } = camara.vista();
    const { left, top, ancho, alto } = camara.region();
    const rect = dom.escenario.getBoundingClientRect();
    prepararSalida(dom.canvas, ancho, alto, escala, dpr);
    colocarSalida(dom.canvas, left - rect.left, top - rect.top);
    alinearSalida(dom.canvas, dpr, camara.vista().area);
  }

  const observador = new ResizeObserver(() => partida && ajustar());
  observador.observe(dom.escenario);
  const alVisibilidad = () => {
    if (document.hidden) {
      partida?.cancelarGestos();
      detener();
      reloj.cortar();
    } else iniciar();
  };
  const alCambiarVentana = () => partida && ajustar();
  let consultaDpr;
  function observarDpr() {
    consultaDpr?.removeEventListener('change', observarDpr);
    consultaDpr = matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    consultaDpr.addEventListener('change', observarDpr);
    alCambiarVentana();
  }
  window.addEventListener('resize', alCambiarVentana);
  window.addEventListener('scroll', alCambiarVentana, { passive: true });
  document.addEventListener('visibilitychange', alVisibilidad);

  dom.centro.addEventListener('click', () => {
    if (pausa.abierta()) return;
    camara.restablecer();
    proyectarTablero();
    partida.dibujar();
  });
  iniciarPartida();
  observarDpr();
  cargarFuentePixel().then(alCambiarVentana, () => {});
  iniciar();

  return {
    pantallaAMundo: (clientX, clientY) =>
      camara.mundo({ x: clientX, y: clientY }),
    celdaEnPantalla: (clientX, clientY) => camara.contiene(clientX, clientY)
      ? partida.desdePantalla(clientX, clientY)
      : null,
    seleccionada: () => partida.seleccion.seleccionada(),
    destruir() {
      detener();
      pausa.destruir();
      partida.destruir();
      partida = null;
      observador.disconnect();
      window.removeEventListener('resize', alCambiarVentana);
      window.removeEventListener('scroll', alCambiarVentana);
      consultaDpr.removeEventListener('change', observarDpr);
      document.removeEventListener('visibilitychange', alVisibilidad);
      contenedor.replaceChildren();
      contenedor.classList.remove('herbario', 'herbario-en-pausa');
    },
  };
}
