import { PLANTAS } from './catalogo.js';
import { perimetro } from './perimetro.js';

function vivas(jardin, id) {
  let cantidad = 0;
  for (const planta of jardin.plantas) if (!planta.muerta && planta.id === id) cantidad += 1;
  return cantidad;
}

const EJES = [
  { x: 5.5, y: 0.5 },
  { x: 10.5, y: 5.5 },
  { x: 5.5, y: 10.5 },
  { x: 0.5, y: 5.5 },
];

const dist = (celda) => Math.hypot(celda.x - 5, celda.y - 5);

function coberturaDeEjes(jardin, celda) {
  const alcance = PLANTAS.cerbatana.ataque.alcance;
  const alcance2 = alcance * alcance;
  const armas = jardin.plantas.filter((planta) => !planta.muerta && planta.tipo.ataque);
  const cubre = (origen, eje) => {
    const dx = eje.x - (origen.x + 0.5);
    const dy = eje.y - (origen.y + 0.5);
    return dx * dx + dy * dy <= alcance2;
  };
  let nuevos = 0;
  let total = 0;
  for (const eje of EJES) {
    const ya = armas.some((arma) => cubre(arma.celda, eje));
    const esta = cubre(celda, eje);
    if (esta) total += 1;
    if (esta && !ya) nuevos += 1;
  }
  return { nuevos, total };
}

function mejor(celdas, puntaje, rng) {
  let mejorValor = -Infinity;
  let grupo = [];
  for (const celda of celdas) {
    const valor = puntaje(celda);
    if (valor > mejorValor + 1e-6) {
      mejorValor = valor;
      grupo = [celda];
    } else if (Math.abs(valor - mejorValor) <= 1e-6) grupo.push(celda);
  }
  return grupo[Math.floor(rng() * grupo.length)];
}

function cubreBorde(celda, alcance, borde) {
  let cantidad = 0;
  const alcance2 = alcance * alcance;
  for (const casilla of borde) {
    const dx = casilla.x + 0.5 - (celda.x + 0.5);
    const dy = casilla.y + 0.5 - (celda.y + 0.5);
    if (dx * dx + dy * dy <= alcance2) cantidad += 1;
  }
  return cantidad;
}

function escudo(celda, jardin) {
  for (const planta of jardin.plantas) {
    if (planta.muerta || planta.id !== 'cerbatana') continue;
    const cerca = Math.max(Math.abs(planta.celda.x - celda.x), Math.abs(planta.celda.y - celda.y)) === 1;
    if (cerca && dist(celda) + 0.2 >= dist(planta.celda)) return true;
  }
  return false;
}

function colocar(modo, id, celdas, jardin, borde, alcance, rng) {
  if (modo === 'principiante') {
    const celda = rng() < 0.75 ? celdas[0] : celdas[Math.floor(rng() * celdas.length)];
    return { id, x: celda.x, y: celda.y };
  }
  if (modo === 'intermedio') {
    const celda = celdas[Math.floor(rng() * celdas.length)];
    return { id, x: celda.x, y: celda.y };
  }
  const celda = mejor(celdas, (casilla) => {
    if (id === 'espino') return (escudo(casilla, jardin) ? 8 : 0) + dist(casilla);
    const anillo = Math.max(Math.abs(casilla.x - 5), Math.abs(casilla.y - 5));
    const ejes = coberturaDeEjes(jardin, casilla);
    return ejes.nuevos * 12 + ejes.total * 3 - anillo * 2 + cubreBorde(casilla, alcance, borde) * 0.15;
  }, rng);
  return { id, x: celda.x, y: celda.y };
}

function decidir(ctx, modo) {
  const { estado, jardin, tablero, aleatorio, t } = ctx;
  const borde = perimetro(tablero);
  const alcance = PLANTAS.cerbatana.ataque.alcance;
  const cerbatanas = vivas(jardin, 'cerbatana');
  const espinos = vivas(jardin, 'espino');
  let id = 'cerbatana';
  if (modo === 'principiante') {
    if (t < 16 || estado.energia < jardin.coste('cerbatana') + 4 || aleatorio() < 0.5) return null;
    if (t > 150 && aleatorio() < 0.2) id = 'espino';
  } else if (modo === 'intermedio') {
    if (aleatorio() < 0.35) return null;
    if (t > 180 && espinos < 4 && aleatorio() < 0.2) id = 'espino';
  } else if (modo === 'especializado') {
    if (cerbatanas >= 12 && espinos < Math.ceil(cerbatanas / 6)) id = 'espino';
  }
  let celdas = jardin.candidatas(id);
  if (id === 'espino') celdas = celdas.filter((celda) => escudo(celda, jardin));
  if (!celdas.length && id !== 'cerbatana') {
    id = 'cerbatana';
    celdas = jardin.candidatas('cerbatana');
  }
  if (!celdas.length) return null;
  return colocar(modo, id, celdas, jardin, borde, alcance, aleatorio);
}

export const principal = (ctx) => decidir(ctx, 'principiante');
export const intermedio = (ctx) => decidir(ctx, 'intermedio');
export const especializado = (ctx) => decidir(ctx, 'especializado');
export const soloCerbatanas = (ctx) => decidir(ctx, 'cerbatanas');

export const ESTRATEGIAS = {
  principiante: principal,
  intermedio,
  especializado,
  soloCerbatanas,
};
