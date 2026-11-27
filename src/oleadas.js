import { BALANCE, OLEADAS } from './config.js';
import { crearRecompensas } from './recompensas.js';
import { perimetro } from './perimetro.js';

const LADOS = ['norte', 'este', 'sur', 'oeste'];
const AMENAZA = Object.fromEntries(['pulgon', 'escarabajo', 'oruga'].map(id => [id, BALANCE[id].amenaza]));

export function presupuestoDe(numero, cfg = OLEADAS) {
  const k = Math.min(numero - 1, cfg.cuadraticaHasta - 1);
  return Math.round(cfg.base + cfg.lineal * k + cfg.cuadratica * k * k +
    cfg.continuacion * Math.max(0, numero - cfg.cuadraticaHasta));
}

export function ventanaDe(numero, cfg = OLEADAS) {
  return Math.min(cfg.ventanaMax, cfg.ventanaBase + cfg.ventanaPorK * (numero - 1));
}

export function maxSimultaneos(numero, cfg = OLEADAS) {
  return Math.min(cfg.simultaneosMax, cfg.simultaneosBase + cfg.simultaneosPorK * (numero - 1));
}

function elegir(dados, pesos, rng) {
  let sorteo = rng() * pesos.reduce((a, b) => a + b, 0);
  return dados.find((_, i) => (sorteo -= pesos[i]) < 0) ?? dados.at(-1);
}

function componer(numero, presupuesto, rng, cfg) {
  const conteo = { pulgon: 0, escarabajo: 0, oruga: 0 };
  const unidades = [];
  let resto = presupuesto;
  while (resto >= AMENAZA.pulgon) {
    const elegibles = Object.keys(conteo).filter(id => AMENAZA[id] <= resto &&
      (id !== 'oruga' || (numero >= cfg.orugaDesde && (conteo[id] + 1) * AMENAZA[id] <= presupuesto * cfg.maxAmenazaOruga)));
    const id = elegir(elegibles, elegibles.map(id => cfg.pesosEspecies[id]), rng);
    resto -= AMENAZA[id];
    conteo[id]++;
    unidades.push(id);
  }
  if (resto === 1 && conteo.pulgon) {
    unidades[unidades.lastIndexOf('pulgon')] = 'escarabajo';
    conteo.pulgon--;
    conteo.escarabajo++;
    resto = 0;
  }
  return { unidades, conteo, sobrante: resto };
}

export function generarOleada({ numero, rng, tablero, oleadas = OLEADAS }) {
  const presupuesto = presupuestoDe(numero, oleadas);
  const { unidades, conteo, sobrante } = componer(numero, presupuesto, rng, oleadas);
  const ventana = ventanaDe(numero, oleadas) * (0.94 + rng() * 0.12);
  const borde = perimetro(tablero);
  const sectores = LADOS.map(lado => borde.filter(celda => celda.lado === lado));
  const segmentos = Math.max(2, Math.round(ventana / oleadas.cambioFrente));
  const focos = Array.from({ length: segmentos }, () => ({
    lado: Math.floor(rng() * LADOS.length), peso: rng() * oleadas.concentracion,
    densidad: 0.55 + rng() * 1.15,
  }));
  const pico = rng() * 0.55 + 0.18;
  const pesos = focos.map(({ densidad }, i) => densidad * (1 + 0.22 * i / segmentos +
    0.5 * Math.max(0, 1 - Math.abs(i / segmentos - pico) * 3)));
  const pesoTotal = pesos.reduce((a, b) => a + b, 0);
  const cola = [];
  const ultimos = Array(LADOS.length).fill(0);

  for (let i = 0, tramo = 0, acumulado = 0; i < unidades.length;) {
    const avance = i * pesoTotal / Math.max(1, unidades.length - 1);
    while (tramo < segmentos - 1 && avance >= acumulado + pesos[tramo]) acumulado += pesos[tramo++];
    const t = 0.65 + (ventana - 0.65) * (tramo + Math.min(1, (avance - acumulado) / pesos[tramo])) / segmentos;
    const { lado: foco, peso } = focos[tramo];
    const elegirLado = () => elegir(LADOS, sectores.map((celdas, j) =>
      celdas.length * ((1 - peso) + (j === foco ? 4 * peso : 0)) *
      (1 + 1.6 * Math.min(1, (t - ultimos[j]) / oleadas.ausenciaReferencia))), rng);
    const lado = elegirLado();
    const grupoMax = numero === 1 ? oleadas.grupoMaxInicial : oleadas.grupoMax;
    const cantidad = Math.min(unidades.length - i, 1 + Math.floor(rng() ** 1.7 * grupoMax));
    const celdas = sectores[LADOS.indexOf(lado)];
    const ancla = Math.floor(rng() * celdas.length);
    for (let j = 0; j < cantidad; j++) {
      const destino = j && rng() < oleadas.frenteSimultaneo ? elegirLado() : lado;
      const indice = LADOS.indexOf(destino);
      const opciones = sectores[indice];
      const celda = destino === lado
        ? celdas[Math.max(0, Math.min(celdas.length - 1, ancla + Math.floor(rng() * 3) - 1))]
        : opciones[Math.floor(rng() * opciones.length)];
      ultimos[indice] = t;
      cola.push({ id: unidades[i++], celda, en: t + j * (0.24 + rng() * 0.42) });
    }
  }
  // El último grupo marca el final real de la ventana; jamás se añade espera después.
  if (cola.length > 1) {
    const ultimo = cola.reduce((max, orden) => Math.max(max, orden.en), 0);
    for (const orden of cola) orden.en = 0.65 + (orden.en - 0.65) * (ventana - 0.65) / (ultimo - 0.65);
  }
  cola.sort((a, b) => a.en - b.en);
  return { patron: 'variable', ventana, presupuesto, conteo, sobrante, cola };
}

export function puntoDeEntrada(celda, ocupada, tablero, rng) {
  const j = (rng() - 0.5) * 0.56;
  const horizontal = celda.lado === 'norte' || celda.lado === 'sur';
  if (!ocupada) return { x: celda.x + 0.5 + (horizontal ? j : 0), y: celda.y + 0.5 + (horizontal ? 0 : j) };
  if (horizontal) return { x: celda.x + 0.5 + j, y: celda.lado === 'norte' ? -0.2 : tablero.filas + 0.2 };
  return { x: celda.lado === 'oeste' ? -0.2 : tablero.columnas + 0.2, y: celda.y + 0.5 + j };
}

export function crearDirector({ tablero, aleatorio, semilla = 0, ocupante, oleadas = OLEADAS, recompensas }) {
  const premios = crearRecompensas(semilla, recompensas);
  let numero = 1;
  let fase = 'preparacion';
  let tiempo = 0;
  let resultado = null;
  let aplicado = false;
  let plan, cursor, resumen;
  const historial = [];
  function preparar() {
    fase = 'preparacion';
    tiempo = 0;
    cursor = 0;
    resultado = null;
    aplicado = false;
    plan = generarOleada({ numero, rng: aleatorio, tablero, oleadas });
    resumen = { primerIngreso: null, ultimoIngreso: null, mayorIntervalo: 0, sinAmenazas: 0,
      danoCentral: 0, plantasPerdidas: 0, maxVivos: 0,
      amenazaPorLado: Object.fromEntries(LADOS.map(lado => [lado, 0])),
      danoPorLado: Object.fromEntries(LADOS.map(lado => [lado, 0])) };
  }
  preparar();
  const duracionPrep = () => numero === 1 ? oleadas.preparacionInicial : oleadas.preparacion;

  return {
    avanzar(dt, vivos) {
      if (fase === 'recompensa') return [];
      if (fase === 'combate' && cursor === plan.cola.length && vivos === 0) {
        resultado = premios.sortear(numero);
        historial.push({ numero, patron: plan.patron, presupuesto: plan.presupuesto,
          conteo: plan.conteo, ventana: plan.ventana, duracion: tiempo, premio: resultado, ...resumen });
        fase = 'recompensa';
        tiempo = 0;
        return [];
      }
      tiempo += dt;
      if (fase === 'preparacion') {
        if (tiempo >= duracionPrep()) {
          fase = 'combate';
          tiempo = 0;
        }
        return [];
      }
      const nacen = [];
      const cupo = maxSimultaneos(numero, oleadas);
      while (cursor < plan.cola.length && plan.cola[cursor].en <= tiempo && vivos + nacen.length < cupo) {
        const { id, celda } = plan.cola[cursor++];
        resumen.primerIngreso ??= tiempo;
        resumen.mayorIntervalo = Math.max(resumen.mayorIntervalo, tiempo - (resumen.ultimoIngreso ?? 0));
        resumen.ultimoIngreso = tiempo;
        resumen.amenazaPorLado[celda.lado] += AMENAZA[id];
        nacen.push({ id, lado: celda.lado, ...puntoDeEntrada(celda, Boolean(ocupante?.(celda.x, celda.y)), tablero, aleatorio) });
      }
      if (!vivos && !nacen.length) resumen.sinAmenazas += dt;
      resumen.maxVivos = Math.max(resumen.maxVivos, vivos + nacen.length);
      return nacen;
    },
    presentar(dt, estado, { rapido = false, continuar = false } = {}) {
      if (fase !== 'recompensa' || aplicado) return null;
      tiempo += dt;
      const duracion = rapido ? premios.config.reducida : premios.config.duracion;
      if (!continuar && tiempo < duracion) return null;
      aplicado = true;
      const premio = resultado;
      if (premio.tipo === 'energia') estado.energia += premio.energia;
      if (premio.tipo !== 'tarot') {
        numero++;
        preparar();
      }
      return premio;
    },
    revelarDesde(t) {
      if (fase === 'recompensa' && !aplicado) tiempo = Math.max(tiempo, t);
    },
    finalizarTarot() {
      if (fase !== 'recompensa' || !aplicado || resultado.tipo !== 'tarot') return false;
      numero++;
      preparar();
      return true;
    },
    registrar(eventos) {
      if (fase !== 'combate') return;
      for (const evento of eventos) {
        if (evento.tipo === 'mordida') {
          if (evento.central) resumen.danoCentral += evento.dano;
          if (evento.lado) resumen.danoPorLado[evento.lado] += evento.dano;
        }
        if (evento.tipo === 'muerte-planta' && !evento.central) resumen.plantasPerdidas++;
      }
    },
    generaEnergia: () => fase === 'preparacion' || (fase === 'combate' && tiempo <= plan.ventana + oleadas.margenEnergia),
    enRecompensa: () => fase === 'recompensa',
    vista: () => ({
      numero, fase, tiempo, resultado, aplicado, patron: plan.patron, presupuesto: plan.presupuesto,
      restante: fase === 'preparacion' ? Math.max(0, Math.ceil(duracionPrep() - tiempo)) : 0,
      porSalir: fase === 'combate' ? plan.cola.length - cursor : 0,
    }),
    aviso: () => fase === 'preparacion' && duracionPrep() - tiempo <= oleadas.aviso,
    historial: () => structuredClone(historial),
    semilla: () => semilla,
  };
}
