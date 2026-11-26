import { perimetro } from './perimetro.js';

export function dpsTeorico(jardin) {
  let dps = 0;
  for (const planta of jardin.plantas) {
    if (planta.muerta || !planta.tipo.ataque) continue;
    dps += planta.tipo.ataque.dano / planta.tipo.ataque.intervalo;
  }
  return dps;
}

export function cobertura(jardin, tablero) {
  const borde = perimetro(tablero);
  const armas = jardin.plantas.filter((planta) => !planta.muerta && planta.tipo.ataque);
  if (!borde.length) return 0;
  let cubiertas = 0;
  for (const celda of borde) {
    const x = celda.x + 0.5;
    const y = celda.y + 0.5;
    for (const arma of armas) {
      const dx = arma.celda.x + 0.5 - x;
      const dy = arma.celda.y + 0.5 - y;
      const alcance = arma.tipo.ataque.alcance;
      if (dx * dx + dy * dy <= alcance * alcance) {
        cubiertas += 1;
        break;
      }
    }
  }
  return cubiertas / borde.length;
}

export function crearRegistro() {
  const datos = {
    energiaGenerada: 0,
    energiaGastada: 0,
    compras: { cerbatana: 0, espino: 0 },
    danoCentral: 0,
    plantasPerdidas: 0,
    disparos: 0,
    danoAplicado: 0,
    danoDesperdiciado: 0,
    maxSimultaneos: 0,
  };
  return {
    datos,
    generada(cantidad) {
      datos.energiaGenerada += cantidad;
    },
    gastada(cantidad, id) {
      datos.energiaGastada += cantidad;
      if (datos.compras[id] !== undefined) datos.compras[id] += 1;
    },
    eventos(lista) {
      for (const evento of lista) {
        if (evento.tipo === 'mordida' && evento.central) datos.danoCentral += evento.dano;
        if (evento.tipo === 'muerte-planta' && !evento.central) datos.plantasPerdidas += 1;
        if (evento.tipo === 'disparo') datos.disparos += 1;
        if (evento.tipo === 'impacto') {
          datos.danoAplicado += evento.aplicado;
          datos.danoDesperdiciado += evento.sobra;
        }
      }
    },
    simultaneos(cantidad) {
      if (cantidad > datos.maxSimultaneos) datos.maxSimultaneos = cantidad;
    },
  };
}

export function percentil(valores, p) {
  if (!valores.length) return null;
  const orden = [...valores].sort((a, b) => a - b);
  const indice = (orden.length - 1) * p;
  const bajo = Math.floor(indice);
  const alto = Math.ceil(indice);
  if (bajo === alto) return orden[bajo];
  return orden[bajo] * (alto - indice) + orden[alto] * (indice - bajo);
}
