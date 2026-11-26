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
  if (numero <= tope) return en(k);
  return en(tope - 1) + oleadas.continuacion * (numero - tope);
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

function especiesDe(numero) {
  const lista = ['pulgon', 'escarabajo'];
  if (numero >= OLEADAS.orugaDesde) lista.push('oruga');
  return lista;
}

function componer(numero, presupuesto, rng) {
  const especies = especiesDe(numero);
  const conteo = { pulgon: 0, escarabajo: 0, oruga: 0 };
  const salida = [];
  let resto = presupuesto;
  let guardia = 0;

  while (resto >= AMENAZA.pulgon && guardia++ < 240) {
    const posibles = especies.filter((id) => {
      const costo = AMENAZA[id];
      if (costo > resto) return false;
      const cupo = id === 'oruga' ? 0.45 : 0.7;
      const usado = conteo[id] * costo;
      return !(presupuesto >= 12 && salida.length >= 2 && usado + costo > presupuesto * cupo);
    });
    if (!posibles.length) break;
    const presentes = new Set(salida);
    const bolsa = presentes.size === 1 && posibles.some((id) => !presentes.has(id))
      ? posibles.filter((id) => !presentes.has(id))
      : posibles;
    const id = bolsa[Math.floor(rng() * bolsa.length)];
    salida.push(id);
    conteo[id] += 1;
    resto -= AMENAZA[id];
  }

  while (resto >= AMENAZA.pulgon && guardia++ < 480) {
    const id = resto >= AMENAZA.escarabajo && rng() < 0.45 ? 'escarabajo' : 'pulgon';
    if (AMENAZA[id] > resto) break;
    salida.push(id);
    conteo[id] += 1;
    resto -= AMENAZA[id];
  }

  while (salida.length < 2) {
    salida.push('pulgon');
    conteo.pulgon += 1;
  }

  return { unidades: salida, conteo, sobrante: resto };
}

function agrupar(unidades, rng) {
  const grupos = [];
  let i = 0;
  while (i < unidades.length) {
    const tam = 1 + Math.floor(rng() * Math.min(3, unidades.length - i));
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

function elegirCelda(celdas, ocupado, rng) {
  const libres = [];
  for (const celda of celdas) if (!ocupado(celda.x, celda.y)) libres.push(celda);
  const bolsa = libres.length ? libres : celdas;
  return bolsa[Math.floor(rng() * bolsa.length)];
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

function colocar(id, lado, tablero, ocupado, rng) {
  const celda = elegirCelda(celdasDeLado(lado, tablero), ocupado, rng);
  const pos = punto(celda, ocupado(celda.x, celda.y), tablero, rng);
  return { id, ...pos };
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
  const bases = [0.7, 1.5, 5.2, 6.1, 9.4];
  const cola = piezas.map((pieza, i) => ({
    ...colocar(pieza.id, pieza.lado, tablero, ocupado, rng),
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

function ordenarDistraccion(unidades, rng) {
  const pulgones = unidades.filter((id) => id === 'pulgon');
  const resto = unidades.filter((id) => id !== 'pulgon');
  const fuente = pulgones.length ? pulgones : unidades;
  const senuelo = fuente.slice(0, Math.min(fuente.length, Math.max(1, Math.ceil(unidades.length * 0.28))));
  const principal = pulgones.length
    ? [...resto, ...pulgones.slice(senuelo.length)]
    : unidades.slice(senuelo.length);
  const grupos = [barajar(senuelo, rng)];
  if (principal.length) grupos.push(...agrupar(barajar(principal, rng), rng));
  return grupos;
}

export function generarOleada({ numero, rng, tablero, ocupado, recientes = [], factor = 1 }) {
  if (numero === 1) return oleadaInicial(rng, tablero, ocupado);

  const presupuesto = presupuestoDe(numero);
  const patron = elegirPatron(numero, recientes, rng);
  const { unidades, conteo, sobrante } = componer(numero, presupuesto, rng);
  const lados = ladosDelPatron(patron, rng);
  const grupos = patron === 'distraccion'
    ? ordenarDistraccion(unidades, rng).filter((grupo) => grupo.length)
    : agrupar(barajar(unidades, rng), rng);
  const tiempos = programar(grupos, ventanaDe(numero), rng, factor);
  let cursor = 0;
  const cola = [];
  grupos.forEach((grupo, indice) => {
    let lado = lados.a;
    if (lados.enjambre) lado = LADOS[Math.floor(rng() * 4)];
    else if (patron === 'distraccion') lado = indice === 0 ? lados.a : lados.b;
    else if (patron === 'pinza') lado = indice < grupos.length / 2 ? lados.a : lados.b;
    for (const id of grupo) {
      cola.push({ ...colocar(id, lado, tablero, ocupado, rng), en: tiempos[cursor].en });
      cursor += 1;
    }
  });
  cola.sort((a, b) => a.en - b.en);
  return { patron, presupuesto, conteo, sobrante, cola };
}

function factorDe(presion, ventana) {
  const ajuste = OLEADAS.adaptacion;
  if (!ajuste.activa || !presion) return 1;
  if (presion.danoCentral >= ajuste.danoUmbral || presion.plantasPerdidas >= ajuste.plantasUmbral) {
    return 1 + ajuste.margen;
  }
  if (presion.danoCentral === 0 && presion.duracion < ventana * ajuste.rapidez) return 1 - ajuste.margen;
  return 1;
}

// Programa oleadas. No elige el lado según la cobertura del jardín.
// `alEntreOleadas` es el punto reservado para preguntas y cartas; hoy no abre nada.
export function crearDirector({ tablero, aleatorio, semilla = 0, ocupante, alEntreOleadas }) {
  const ocupado = (x, y) => Boolean(ocupante?.(x, y));
  let numero = 1;
  let fase = 'preparacion';
  let tiempoFase = 0;
  let duracionPrep = OLEADAS.preparacionInicial;
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
    const factor = factorDe(presion, ventanaDe(numero));
    const plan = generarOleada({ numero, rng: aleatorio, tablero, ocupado, recientes, factor });
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
    duracionPrep = OLEADAS.preparacion;
    cola = [];
    emitidos = 0;
  }

  return {
    avanzar(dt, vivos) {
      if (fase === 'combate' && cola.length === 0 && emitidos > 0 && vivos === 0) {
        cerrar();
        return [];
      }
      tiempoFase += dt;
      if (fase === 'preparacion') {
        if (tiempoFase < duracionPrep) return [];
        planificar();
        fase = 'combate';
        tiempoFase = 0;
        return [];
      }
      const nacen = [];
      const cupo = maxSimultaneos(numero);
      while (cola.length && cola[0].en <= tiempoFase && vivos + nacen.length < cupo) nacen.push(cola.shift());
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
        porSalir: cola.length,
        presupuesto,
      };
    },
    historial: () => historial.map((oleada) => ({ ...oleada, conteo: { ...oleada.conteo } })),
    semilla: () => semilla,
  };
}
