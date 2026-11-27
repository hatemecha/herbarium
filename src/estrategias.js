import { PLANTAS } from './catalogo.js';
import { perimetro } from './perimetro.js';

const dist = (celda) => Math.hypot(celda.x - 5, celda.y - 5);

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
    if (planta.muerta || !planta.tipo.ataque && !planta.tipo.area) continue;
    const cerca = Math.max(Math.abs(planta.celda.x - celda.x), Math.abs(planta.celda.y - celda.y)) === 1;
    if (cerca && dist(celda) + 0.2 >= dist(planta.celda)) return true;
  }
  return false;
}

export function principal({ t, estado, jardin, aleatorio }) {
  if (t < 16 || estado.energia < jardin.coste('cerbatana') + 4 || aleatorio() < 0.5) return null;
  const id = t > 150 && aleatorio() < 0.2 ? 'espino' : 'cerbatana';
  const celdas = jardin.candidatas(id);
  if (!celdas.length) return null;
  const celda = aleatorio() < 0.75 ? celdas[0] : celdas[Math.floor(aleatorio() * celdas.length)];
  return { id, x: celda.x, y: celda.y };
}

function politica(ids, reactiva = false, compacta = false) {
  return ({ jardin, tablero, estado, enemigos = [] }) => {
    const vivas = jardin.plantas.filter((planta) => !planta.muerta);
    const ofensivas = vivas.filter((planta) => planta.tipo.ataque || planta.tipo.area);
    const preferidas = ids.filter((id) => id === ids[0] || ofensivas.length > 0);
    const borde = perimetro(tablero);
    const defensas = vivas.filter((planta) => planta.tipo.reflejo).length;
    const tiradoras = ofensivas.filter((planta) => planta.tipo.ataque).length;
    let mejorAccion = null;
    let maximo = -Infinity;
    for (const id of preferidas) {
      const tipo = PLANTAS[id];
      const coste = jardin.coste(id);
      if (estado.energia < coste) continue;
      if (tipo.reflejo && ids.length > 1 && (tiradoras < 4 || defensas >= Math.floor(tiradoras / 4))) continue;
      const radio = tipo.area?.alcance ?? tipo.ralentiza?.alcance ?? tipo.ataque?.alcance ?? tipo.atraccion ?? 1.5;
      const cantidad = vivas.filter((planta) => planta.id === id).length;
      for (const celda of jardin.candidatas(id)) {
        const separacion = Math.min(4, ...vivas.filter((planta) => planta.id === id)
          .map((planta) => Math.hypot(planta.celda.x - celda.x, planta.celda.y - celda.y)));
        const apoyo = ofensivas.filter((planta) => Math.hypot(planta.celda.x - celda.x, planta.celda.y - celda.y) <= radio + 1).length;
        const frente = cubreBorde(celda, radio, borde);
        let valor;
        if (tipo.reflejo) {
          const eje = Math.min(Math.abs(celda.x - tablero.centro.x), Math.abs(celda.y - tablero.centro.y));
          valor = ids.length === 1 ? 6 - dist(celda) + separacion : escudo(celda, jardin) ? 3.5 + Math.min(apoyo, 3) - eje : -6;
        }
        else if (tipo.ralentiza) valor = apoyo >= 2 ? 5 + Math.min(apoyo, 4) + separacion * 0.5 : -6;
        else if (tipo.area) valor = 5 + frente * 0.4 + separacion * 0.65 + Math.min(apoyo, 3);
        else valor = 6 + frente * 0.25 + separacion * 0.6 - dist(celda) * 0.2;
        if (reactiva) {
          if (tipo.reflejo) {
            valor += ofensivas.some((planta) => planta.tipo.area &&
              Math.hypot(planta.celda.x - celda.x, planta.celda.y - celda.y) <= planta.tipo.area.alcance) ? 2 : 0;
          }
          for (const enemigo of enemigos) {
            if (!enemigo.muerto && Math.hypot(enemigo.x - celda.x - 0.5, enemigo.y - celda.y - 0.5) <= radio) {
              valor += tipo.area && enemigo.tipo.id === 'pulgon' ? 2.5 : 0.8;
            }
          }
        }
        const puntos = (compacta ? valor * 0.25 - dist(celda) * 2 : valor) - cantidad * 0.8 - coste * 0.035;
        if (puntos > maximo) {
          maximo = puntos;
          mejorAccion = { id, x: celda.x, y: celda.y };
        }
      }
    }
    return maximo > -4 ? mejorAccion : null;
  };
}

export const soloCerbatanas = politica(['cerbatana']);
export const area = politica(['cerbatana', 'hongo']);
export const proteccion = politica(['cerbatana', 'espino']);
const apoyo = politica(['cerbatana', 'espino', 'campanilla']);
export const intermedio = (ctx) => ctx.aleatorio() < 0.35 ? null : apoyo(ctx);
export const ralentizacion = politica(['cerbatana', 'campanilla']);
const todas = ['cerbatana', 'espino', 'campanilla', 'hongo'];
export const diversificado = politica(todas);
export const reactivo = politica(todas, true);
export const especializado = (ctx) => {
  const accion = reactivo(ctx);
  if (accion?.id === 'cerbatana' && ctx.jardin.plantas.length >= 5 && ctx.estado.energia < ctx.jardin.coste('campanilla')
      && ctx.enemigos?.every((e) => e.muerto)) return null;
  return accion;
};

const ahorrar = (ctx) => ctx.enemigos.some((e) => !e.muerto) || ctx.estado.energia >= ctx.jardin.coste('hongo') + 8
  ? reactivo(ctx)
  : null;

export const ESTRATEGIAS = {
  ahorrar,
  compacta: politica(todas, true, true),
  compactaMonocultivo: politica(['cerbatana'], true, true),
  soloEspinos: politica(['espino']),
  concentracion: ({ jardin }) => {
    const celda = jardin.candidatas('cerbatana').sort((a, b) => dist(a) - dist(b))[0];
    return celda ? { id: 'cerbatana', ...celda } : null;
  },
  principiante: principal,
  intermedio,
  especializado,
  soloCerbatanas,
  area,
  proteccion,
  ralentizacion,
  diversificado,
  reactivo,
};
