import { BALANCE, OLEADAS } from './config.js';
import { celdasDeLado } from './perimetro.js';

const LADOS = ['norte', 'este', 'sur', 'oeste'];
const AMENAZA = {
  pulgon: BALANCE.pulgon.amenaza,
  escarabajo: BALANCE.escarabajo.amenaza,
  oruga: BALANCE.oruga.amenaza,
};

export function presupuestoDe(numero, oleadas = OLEADAS) {
  const k = numero - 1;
  const tope = oleadas.cuadraticaHasta;
  const en = (kk) => oleadas.base + oleadas.lineal * kk + oleadas.cuadratica * kk * kk;
  if (numero <= tope) return Math.round(en(k));
  return Math.round(en(tope - 1) + oleadas.continuacion * (numero - tope));
}

export function ventanaDe(numero, oleadas = OLEADAS) {
  const k = numero - 1;
  return Math.min(oleadas.ventanaMax, oleadas.ventanaBase + oleadas.ventanaPorK * k);
}

export function maxSimultaneos(numero, oleadas = OLEADAS) {
  const k = numero - 1;
  return Math.min(oleadas.simultaneosMax, oleadas.simultaneosBase + oleadas.simultaneosPorK * k);
}

function barajar(lista, rng) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function elegirPatron(numero, recientes, rng) {
  const ops = numero <= 2
    ? ['concentrada', 'pinza']
    : numero === 3
      ? ['concentrada', 'pinza', 'enjambre']
      : ['concentrada', 'pinza', 'enjambre', 'distraccion'];
  const pesos = ops.map((patron) => (recientes.includes(patron) ? 0.22 : 1));
  let resto = rng() * pesos.reduce((suma, peso) => suma + peso, 0);
  for (let i = 0; i < ops.length; i++) {
    resto -= pesos[i];
    if (resto <= 0) return ops[i];
  }
  return ops[ops.length - 1];
}

function especiesDe(numero, oleadas) {
  const lista = ['pulgon', 'escarabajo'];
  if (numero >= oleadas.orugaDesde) lista.push('oruga');
  return lista;
}

function componer(numero, presupuesto, rng, oleadas, patron) {
  const especies = especiesDe(numero, oleadas);
  const conteo = { pulgon: 0, escarabajo: 0, oruga: 0 };
  const salida = [];
  let resto = presupuesto;
  const dominante = patron === 'enjambre' || patron === 'distraccion' ? 'pulgon'
    : patron === 'concentrada' ? 'oruga' : 'escarabajo';

  while (resto >= AMENAZA.pulgon) {
    const posibles = especies.filter((id) => {
      const costo = AMENAZA[id];
      if (costo > resto) return false;
      const cupo = id === 'oruga' ? 0.45 : 0.7;
      const usado = conteo[id] * costo;
      return !(presupuesto >= 12 && salida.length >= 2 && usado + costo > presupuesto * cupo);
    });
    if (!posibles.length) break;
    const bolsa = Object.values(conteo).filter(Boolean).length === 1 && posibles.some((id) => !conteo[id])
      ? posibles.filter((id) => !conteo[id])
      : posibles;
    const id = oleadas.sesgoDePatron > 0 && bolsa.includes(dominante) && rng() < oleadas.sesgoDePatron
      ? dominante
      : bolsa[Math.floor(rng() * bolsa.length)];
    salida.push(id);
    conteo[id] += 1;
    resto -= AMENAZA[id];
  }

  while (resto >= AMENAZA.pulgon) {
    const id = resto >= AMENAZA.escarabajo && rng() < 0.45 ? 'escarabajo' : 'pulgon';
    if (AMENAZA[id] > resto) break;
    salida.push(id);
    conteo[id] += 1;
    resto -= AMENAZA[id];
  }

  if (resto === AMENAZA.escarabajo - AMENAZA.pulgon && conteo.pulgon > 0) {
    salida[salida.lastIndexOf('pulgon')] = 'escarabajo';
    conteo.pulgon -= 1;
    conteo.escarabajo += 1;
    resto = 0;
  }
  return { unidades: salida, conteo, sobrante: resto };
}

function agrupar(unidades, rng, maximo) {
  const grupos = [];
  let i = 0;
  while (i < unidades.length) {
    const tam = 1 + Math.floor(rng() * Math.min(maximo, unidades.length - i));
    grupos.push(unidades.slice(i, i + tam));
    i += tam;
  }
  return grupos;
}

function programar(grupos, ventana, rng, factor) {
  const hueco = (ventana / Math.max(1, grupos.length)) * factor;
  let t = 0.35 + rng() * 0.45;
  const marcas = [];
  for (const grupo of grupos) {
    let local = 0;
    for (const id of grupo) {
      marcas.push({ id, en: t + local });
      local += 0.22 + rng() * 0.28;
    }
    t += hueco * (0.75 + rng() * 0.5);
  }
  const fin = marcas.at(-1)?.en ?? 0;
  const tope = ventana * (factor > 1 ? 1.1 : 1);
  if (fin > tope) {
    const escala = tope / fin;
    for (const marca of marcas) marca.en *= escala;
  }
  return marcas;
}

function punto(celda, ocupada, tablero, rng) {
  const j = (rng() - 0.5) * 0.28;
  if (!ocupada) {
    if (celda.lado === 'norte' || celda.lado === 'sur') return { x: celda.x + 0.5 + j, y: celda.y + 0.5 };
    return { x: celda.x + 0.5, y: celda.y + 0.5 + j };
  }
  if (celda.lado === 'oeste') return { x: -0.2, y: celda.y + 0.5 + j };
  if (celda.lado === 'este') return { x: tablero.columnas + 0.2, y: celda.y + 0.5 + j };
  if (celda.lado === 'norte') return { x: celda.x + 0.5 + j, y: -0.2 };
  return { x: celda.x + 0.5 + j, y: tablero.filas + 0.2 };
}

function ancla(lado, tablero, rng) {
  const celdas = celdasDeLado(lado, tablero);
  return celdas[Math.floor(rng() * celdas.length)];
}

function colocar(id, celda, tablero, ocupado, rng) {
  return { id, celda, ...punto(celda, ocupado(celda.x, celda.y), tablero, rng) };
}

function tiempoViaje(id, celda, tablero) {
  return Math.hypot(celda.x - tablero.centro.x, celda.y - tablero.centro.y) / BALANCE[id].velocidad;
}

function oleadaInicial(rng, tablero, ocupado) {
  const primario = LADOS[Math.floor(rng() * 4)];
  let secundario = LADOS[Math.floor(rng() * 4)];
  if (secundario === primario) secundario = LADOS[(LADOS.indexOf(primario) + 1) % 4];
  const piezas = barajar([
    { id: 'escarabajo', lado: primario },
    { id: 'escarabajo', lado: primario },
    { id: 'pulgon', lado: secundario },
    { id: 'pulgon', lado: secundario },
    { id: 'pulgon', lado: secundario },
  ], rng);
  const anclas = new Map([primario, secundario].map((lado) => [lado, ancla(lado, tablero, rng)]));
  const bases = [0.7, 1.5, 5.2, 6.1, 9.4];
  const cola = piezas.map((pieza, i) => ({
    ...colocar(pieza.id, anclas.get(pieza.lado), tablero, ocupado, rng),
    en: bases[i] + rng() * 0.3,
  }));
  cola.sort((a, b) => a.en - b.en);
  return {
    patron: 'inicial',
    presupuesto: presupuestoDe(1),
    conteo: { escarabajo: 2, pulgon: 3, oruga: 0 },
    cola,
  };
}

function ladosDelPatron(patron, rng) {
  const giro = Math.floor(rng() * 4);
  const rotar = (indice) => LADOS[(indice + giro) % 4];
  if (patron === 'pinza') return { a: rotar(0), b: rotar(2), enjambre: false };
  if (patron === 'distraccion') return { a: rotar(1), b: rotar(0), enjambre: false };
  if (patron === 'enjambre') return { a: rotar(0), b: rotar(2), enjambre: true };
  return { a: rotar(0), b: rotar(0), enjambre: false };
}

function ordenarDistraccion(unidades, rng, maximo) {
  const pulgones = unidades.filter((id) => id === 'pulgon');
  const resto = unidades.filter((id) => id !== 'pulgon');
  const fuente = pulgones.length ? pulgones : unidades;
  const senuelo = fuente.slice(0, Math.min(fuente.length, Math.max(1, Math.ceil(unidades.length * 0.28))));
  const principal = pulgones.length
    ? [...resto, ...pulgones.slice(senuelo.length)]
    : unidades.slice(senuelo.length);
  const grupos = [barajar(senuelo, rng)];
  if (principal.length) grupos.push(...agrupar(barajar(principal, rng), rng, maximo));
  return grupos;
}

export function generarOleada({ numero, rng, tablero, ocupado, recientes = [], factor = 1, oleadas = OLEADAS, patronForzado }) {
  if (numero === 1) return oleadaInicial(rng, tablero, ocupado);

  const presupuesto = presupuestoDe(numero, oleadas);
  const sugerido = elegirPatron(numero, recientes, rng);
  const patron = patronForzado ?? sugerido;
  const { unidades, conteo, sobrante } = componer(numero, presupuesto, rng, oleadas, patron);
  const lados = ladosDelPatron(patron, rng);
  const grupos = patron === 'distraccion'
    ? ordenarDistraccion(unidades, rng, oleadas.grupoMax).filter((grupo) => grupo.length)
    : agrupar(barajar(unidades, rng), rng, oleadas.grupoMax);
  const compresion = lados.enjambre ? oleadas.compresionEnjambre : 1;
  const tiempos = programar(grupos, ventanaDe(numero, oleadas) * compresion, rng, factor);
  const anclasEnjambre = lados.enjambre ? [ancla(lados.a, tablero, rng), ancla(lados.b, tablero, rng)] : [];
  let cursor = 0;
  const cola = [];
  grupos.forEach((grupo, indice) => {
    let lado = lados.a;
    if (patron === 'distraccion') lado = indice === 0 ? lados.a : lados.b;
    else if (patron === 'pinza') lado = indice % 2 === 0 ? lados.a : lados.b;
    const celda = anclasEnjambre[indice % 2] ?? ancla(lado, tablero, rng);
    const pareja = patron === 'pinza' ? tiempos[cursor - (indice % 2 ? grupos[indice - 1].length : 0)].en : null;
    for (const [local, id] of grupo.entries()) {
      const viaje = pareja !== null || lados.enjambre
        ? tiempoViaje(id, celda, tablero) * oleadas.compensaViaje
        : 0;
      const marca = pareja === null ? tiempos[cursor].en - viaje : pareja - viaje + local * 0.3;
      cola.push({ ...colocar(id, celda, tablero, ocupado, rng), en: marca });
      cursor += 1;
    }
  });
  cola.sort((a, b) => a.en - b.en);
  if ((patron === 'pinza' || lados.enjambre) && cola.length) {
    const ajuste = cola[0].en - 0.35;
    for (const orden of cola) orden.en -= ajuste;
  }
  return { patron, presupuesto, conteo, sobrante, cola };
}

function factorDe(presion, ventana, ajuste) {
  if (!ajuste.activa || !presion) return 1;
  if (presion.danoCentral >= ajuste.danoUmbral || presion.plantasPerdidas >= ajuste.plantasUmbral) {
    return 1 + ajuste.margen;
  }
  if (presion.danoCentral === 0 && presion.duracion < ventana * ajuste.rapidez) return 1 - ajuste.margen;
  return 1;
}

// Programa oleadas. No elige el lado según la cobertura del jardín.
// `alEntreOleadas` es el punto reservado para preguntas y cartas; hoy no abre nada.
export function crearDirector({ tablero, aleatorio, semilla = 0, ocupante, alEntreOleadas, oleadas = OLEADAS }) {
  const ocupado = (x, y) => Boolean(ocupante?.(x, y));
  let numero = 1;
  let fase = 'preparacion';
  let tiempoFase = 0;
  let duracionPrep = oleadas.preparacionInicial;
  let cola = [];
  let emitidos = 0;
  let patron = 'inicial';
  let presupuesto = presupuestoDe(1);
  let conteo = { escarabajo: 2, pulgon: 3, oruga: 0 };
  let danoOleada = 0;
  let plantasOleada = 0;
  let presion = null;
  const recientes = [];
  const historial = [];

  function planificar() {
    const factor = factorDe(presion, ventanaDe(numero, oleadas), oleadas.adaptacion);
    const plan = generarOleada({ numero, rng: aleatorio, tablero, ocupado: () => false, recientes, factor, oleadas });
    patron = plan.patron;
    presupuesto = plan.presupuesto;
    conteo = plan.conteo;
    cola = plan.cola;
    emitidos = 0;
    danoOleada = 0;
    plantasOleada = 0;
    if (patron !== 'inicial') {
      recientes.push(patron);
      if (recientes.length > 2) recientes.shift();
    }
  }

  function cerrar() {
    const duracion = tiempoFase;
    historial.push({
      numero,
      patron,
      presupuesto,
      conteo: { ...conteo },
      duracion,
      danoCentral: danoOleada,
      plantasPerdidas: plantasOleada,
    });
    presion = { danoCentral: danoOleada, plantasPerdidas: plantasOleada, duracion };
    alEntreOleadas?.({ oleada: numero, semilla });
    numero += 1;
    fase = 'preparacion';
    tiempoFase = 0;
    duracionPrep = oleadas.preparacion;
    cola = [];
    emitidos = 0;
    planificar();
  }

  planificar();

  return {
    avanzar(dt, vivos) {
      if (fase === 'combate' && cola.length === 0 && emitidos > 0 && vivos === 0) {
        cerrar();
        return [];
      }
      tiempoFase += dt;
      if (fase === 'preparacion') {
        if (tiempoFase < duracionPrep) return [];
        fase = 'combate';
        tiempoFase = 0;
        return [];
      }
      const nacen = [];
      const cupo = maxSimultaneos(numero, oleadas);
      while (cola.length && cola[0].en <= tiempoFase && vivos + nacen.length < cupo) {
        const { id, celda } = cola.shift();
        nacen.push({ id, ...punto(celda, ocupado(celda.x, celda.y), tablero, aleatorio) });
      }
      emitidos += nacen.length;
      return nacen;
    },
    registrar(eventos) {
      if (fase !== 'combate') return;
      for (const evento of eventos) {
        if (evento.tipo === 'mordida' && evento.central) danoOleada += evento.dano;
        if (evento.tipo === 'muerte-planta' && !evento.central) plantasOleada += 1;
      }
    },
    vista() {
      return {
        numero,
        fase,
        patron,
        restante: fase === 'preparacion' ? Math.max(0, Math.ceil(duracionPrep - tiempoFase)) : 0,
        porSalir: fase === 'combate' ? cola.length : 0,
        presupuesto,
      };
    },
    aviso() {
      if (fase !== 'preparacion' || duracionPrep - tiempoFase > oleadas.aviso) return null;
      return cola[0]?.celda ?? null;
    },
    historial: () => historial.map((oleada) => ({ ...oleada, conteo: { ...oleada.conteo } })),
    semilla: () => semilla,
  };
}
