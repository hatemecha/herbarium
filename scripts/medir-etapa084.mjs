import { ESTRATEGIAS } from '../src/estrategias.js';
import { simularPartida } from '../src/simular.js';

export const reorganiza = (ctx) => {
  if (ctx.t % 12 < 0.55) {
    const retiro = ctx.jardin.plantas.find(p => p.costePagado && p.vida < p.vidaMax * 0.25 && ctx.jardin.reembolso(p.celda) > 0);
    if (retiro) return { retirar: retiro.celda };
  }
  return ESTRATEGIAS.compacta(ctx);
};

export const reciclaje = (ctx) => {
  const cerca = ctx.jardin.plantas.find(p => p.costePagado && !p.muerta &&
    ctx.enemigos.some(e => e.objetivo === p || e.senuelo === p));
  if (cerca && ctx.estado.energia >= ctx.jardin.coste(cerca.id)) return { retirar: cerca.celda };
  return ESTRATEGIAS.compacta(ctx);
};

const nombres = process.argv.slice(2);
const estrategias = { ...ESTRATEGIAS, reorganiza, reciclaje };
const mediana = (datos) => {
  const v = datos.filter(Number.isFinite).sort((a, b) => a - b);
  return v.length ? (v[Math.floor((v.length - 1) / 2)] + v[Math.ceil((v.length - 1) / 2)]) / 2 : null;
};
const med = (datos, campo) => mediana(datos.map(dato => dato[campo]));
const suma = (datos, extraer) => datos.reduce((total, dato) => total + extraer(dato), 0);
const porLado = (datos, campo) => Object.fromEntries(['norte','este','sur','oeste'].map(lado =>
  [lado, suma(datos, oleada => oleada[campo][lado])]));

for (const nombre of nombres) {
  if (!estrategias[nombre]) throw new Error(`Estrategia desconocida: ${nombre}`);
  const partidas = Array.from({ length: 100 }, (_, i) => simularPartida({
    semilla: 1200 + i, horizonte: 1800, estrategia: estrategias[nombre],
  }));
  const historial = partidas.flatMap(p => p.historial);
  const porOleada = Array.from({ length: 10 }, (_, i) => {
    const datos = historial.filter(o => o.numero === i + 1);
    return {
      n: datos.length, combate: med(datos, 'duracion'), primero: med(datos, 'primerIngreso'),
      ultimo: med(datos, 'ultimoIngreso'), sinAmenazas: med(datos, 'sinAmenazas'),
      intervaloApariciones: med(datos, 'mayorIntervalo'), simultaneos: med(datos, 'maxVivos'),
      amenazaPorSegundo: mediana(datos.map(o => o.presupuesto / o.duracion)),
    };
  });
  // Compara suerte a igual exposición a cuatro tiradas. No atribuye causalidad a ese corte.
  const cuatro = partidas.filter(p => p.historial.length >= 4).map(p => ({
    premio: suma(p.historial.slice(0, 4), o => o.premio.energia), tiempo: p.tiempo,
  })).sort((a, b) => a.premio - b.premio);
  const cuartil = Math.floor(cuatro.length / 4);
  const resumir = (p) => ({ energia: med(p, 'premio'), sobrevida: med(p, 'tiempo') });
  console.log(JSON.stringify({
    nombre, n: partidas.length, tiempo: med(partidas, 'tiempo'), porOleada, completas: [300,600,900,1200,1800]
      .map(t => ({ t, vivas: partidas.filter(p => p.tiempo >= t && (!p.derrota || p.tiempo > t)).length,
        mediana: mediana(partidas.map(p => p.evolucion.find(c => c.t === t)?.completas ?? p.oleadasCompletas)) })),
    energiaFinal: med(partidas, 'energiaFinal'), generada: med(partidas, 'energiaGenerada'),
    recuperada: med(partidas, 'energiaRecuperada'), premiosMediana: med(partidas, 'energiaPremios'),
    gastada: med(partidas, 'energiaGastada'), retiradas: med(partidas, 'retiradas'),
    compras: mediana(partidas.map(p => Object.values(p.compras).reduce((a,b) => a+b, 0))),
    bajas: med(partidas, 'plantasPerdidas'), danoCentral: med(partidas, 'danoCentral'),
    tiradas: Object.fromEntries(['energia','vacia','tarot'].map(tipo => [tipo, suma(partidas,p=>p.premios[tipo])])),
    distribucion: porLado(historial, 'amenazaPorLado'), danoPorLado: porLado(historial, 'danoPorLado'),
    suerte: { n: cuatro.length, peor: resumir(cuatro.slice(0, cuartil)), mejor: resumir(cuatro.slice(cuatro.length - cuartil)) },
  }));
}
