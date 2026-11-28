import banco from '../docs/tarot/preguntas.json' with { type: 'json' };
import { crearAleatorio } from './aleatorio.js';

export const PREGUNTAS_TAROT = banco.preguntas;

export const FIRMAS_TAROT = Object.fromEntries(Object.entries({
  0: 'control+ riesgo+ incertidumbre+',
  1: 'control- decision- ambicion+',
  2: 'decision+ incertidumbre+ autonomia-',
  3: 'recursos+ cooperacion+ cambio+',
  4: 'control- riesgo- responsabilidad-',
  5: 'cambio- control- autonomia+',
  6: 'cooperacion+ autonomia+ responsabilidad+',
  7: 'ambicion+ persistencia- responsabilidad-',
  8: 'persistencia- riesgo- ambicion-',
  9: 'autonomia- cooperacion- decision-',
  10: 'incertidumbre+ cambio+ riesgo+',
  11: 'decision- responsabilidad- recursos-',
  12: 'ambicion- persistencia+ incertidumbre+',
  13: 'perdida+ cambio+ persistencia+',
  14: 'cooperacion+ riesgo- ambicion-',
  15: 'recursos- ambicion+ perdida-',
  16: 'cambio+ perdida+ riesgo+',
  17: 'incertidumbre+ persistencia+ ambicion-',
  18: 'decision+ incertidumbre- riesgo-',
  19: 'recursos+ ambicion+ incertidumbre+',
  20: 'responsabilidad+ perdida+ cambio+',
  21: 'cooperacion+ responsabilidad+ ambicion-',
}).map(([id, firma]) => [id, Object.fromEntries(
  firma.split(' ').map(eje => [eje.slice(0, -1), eje.endsWith('+') ? 1 : -1]),
)]));

const pares = new Map(PREGUNTAS_TAROT.filter(p => p.contextoComparable).map(p => [
  p.id, PREGUNTAS_TAROT.find(otra => otra !== p && otra.contextoComparable === p.contextoComparable)?.id,
]));

function elegir(elementos, pesos, azar) {
  let restante = azar() * pesos.reduce((suma, peso) => suma + peso, 0);
  return elementos.find((_, indice) => (restante -= pesos[indice]) < 0) ?? elementos.at(-1);
}

function afinidad(firma, vector) {
  const ejes = Object.keys(firma).filter(eje => Object.hasOwn(vector, eje));
  if (!ejes.length) return null;
  return ejes.reduce((suma, eje) => suma + firma[eje] * vector[eje], 0) / ejes.length;
}

export function distribucionTarot(ids, actual, historial, obtenidas, ultima) {
  const exponentes = ids.map(id => {
    const ahora = afinidad(FIRMAS_TAROT[id], actual);
    const antes = afinidad(FIRMAS_TAROT[id], historial);
    const puntuacion = ahora === null ? (antes ?? 0) * 0.4375
      : antes === null ? ahora : 0.5625 * ahora + 0.4375 * antes;
    return Math.exp(2 * puntuacion);
  });
  const total = exponentes.reduce((suma, valor) => suma + valor, 0);
  const pesos = exponentes.map((valor, indice) => (0.8 * valor / total + 0.2 / ids.length)
    * (obtenidas.has(ids[indice]) ? 0.25 : 1) * (ids[indice] === ultima ? 0.5 : 1));
  const suma = pesos.reduce((acumulado, peso) => acumulado + peso, 0);
  return pesos.map(peso => peso / suma);
}

export function tensionComparable(a, b, intervalo) {
  return intervalo <= 12 && a * b < 0 ? Math.min(Math.abs(a), Math.abs(b)) / 2 : 0;
}

export function probabilidadInversion(id, tension) {
  const pertinente = Math.max(...Object.keys(FIRMAS_TAROT[id]).map(eje => tension[eje] ?? 0));
  return 0.10 + 0.40 * pertinente;
}

export function crearTarot(semilla, ids) {
  const preguntaRng = crearAleatorio(semilla ^ 0x900c4a71);
  const ordenRng = crearAleatorio(semilla ^ 0x27a3d9be);
  const arcanoRng = crearAleatorio(semilla ^ 0x4bbc67d1);
  const orientacionRng = crearAleatorio(semilla ^ 0x63e879ad);
  const ciclo = new Set();
  const ultimas = [];
  const respuestas = new Map();
  const niveles = new Map();
  const obtenidas = new Set();
  const evidencia = {};
  const tension = {};
  let ultima;
  let ritual = 0;
  let pendiente;

  return {
    abrir() {
      if (pendiente) return pendiente.vista;
      if (ciclo.size === PREGUNTAS_TAROT.length) ciclo.clear();
      const anterior = ultimas.at(-1);
      const disponibles = PREGUNTAS_TAROT.filter(p => !ciclo.has(p.id));
      const sinParejaInmediata = disponibles.filter(p => !anterior || pares.get(p.id) !== anterior.id);
      const variadas = sinParejaInmediata.filter(p => !ultimas.some(reciente => reciente.id === p.id));
      const otrasFamilias = variadas.filter(p => p.familia !== anterior?.familia);
      const candidatas = otrasFamilias.length ? otrasFamilias : variadas.length ? variadas
        : sinParejaInmediata.length ? sinParejaInmediata : disponibles;
      const pesos = candidatas.map(p => {
        const pareja = respuestas.get(pares.get(p.id));
        return (pareja && ritual - pareja.ritual >= 1 ? 1.5 : 1) / (1 + (evidencia[p.familia]?.cantidad ?? 0));
      });
      const pregunta = elegir(candidatas, pesos, preguntaRng);
      const opciones = pregunta.respuestas.map(({ id, texto }) => ({ id, texto }));
      for (let i = opciones.length - 1; i > 0; i--) {
        const j = Math.floor(ordenRng() * (i + 1));
        [opciones[i], opciones[j]] = [opciones[j], opciones[i]];
      }
      const vista = { id: pregunta.id, texto: pregunta.texto, opciones };
      pendiente = { pregunta, vista };
      return vista;
    },
    responder(vista, opcion) {
      if (!pendiente || pendiente.vista !== vista || pendiente.carta) return null;
      const { pregunta } = pendiente;
      const respuesta = pregunta.respuestas.find(r => r.id === opcion);
      if (!respuesta) return null;

      ritual++;
      const historial = Object.fromEntries(Object.entries(evidencia)
        .map(([eje, { suma, cantidad }]) => [eje, suma / (2 * (cantidad + 2))]));
      const actual = Object.fromEntries(Object.entries(respuesta.pesos).map(([eje, valor]) => [eje, valor / 2]));
      const pesos = distribucionTarot(ids, actual, historial, obtenidas, ultima);
      const id = elegir(ids, pesos, arcanoRng);

      for (const eje of Object.keys(tension)) tension[eje] *= 0.85;
      const pareja = respuestas.get(pares.get(pregunta.id));
      const eje = pregunta.familia;
      const a = respuesta.pesos[eje];
      const b = pareja?.valor;
      if (pareja) tension[eje] = Math.max(tension[eje] ?? 0, tensionComparable(a, b, ritual - pareja.ritual));
      const invertida = orientacionRng() < probabilidadInversion(id, tension);
      const clave = id + ':' + Number(invertida);
      const carta = Object.freeze({ id, invertida, nivel: (niveles.get(clave)?.nivel ?? 0) + 1 });

      for (const [eje, valor] of Object.entries(respuesta.pesos)) {
        const dato = evidencia[eje] ??= { suma: 0, cantidad: 0 };
        dato.suma += valor;
        dato.cantidad++;
      }
      respuestas.set(pregunta.id, { valor: a, ritual });
      ciclo.add(pregunta.id);
      ultimas.push(pregunta);
      if (ultimas.length > 12) ultimas.shift();
      obtenidas.add(id);
      ultima = id;
      niveles.set(clave, carta);
      pendiente.carta = carta;
      return carta;
    },
    cerrar(vista) {
      if (!pendiente?.carta || pendiente.vista !== vista) return false;
      pendiente = null;
      return true;
    },
    mazo: () => Array.from(niveles.values()),
  };
}
