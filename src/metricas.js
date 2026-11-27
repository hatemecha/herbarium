import { perimetro } from './perimetro.js';

export function dpsTeorico(jardin) {
  let dps = 0;
  for (const planta of jardin.plantas) {
    const ataque = planta.tipo.ataque ?? planta.tipo.area;
    if (planta.muerta || !ataque) continue;
    dps += ataque.dano / ataque.intervalo;
  }
  return dps;
}

export function cobertura(jardin, tablero) {
  const borde = perimetro(tablero);
  const armas = jardin.plantas.filter((planta) => !planta.muerta && (planta.tipo.ataque || planta.tipo.area));
  if (!borde.length) return 0;
  let cubiertas = 0;
  for (const celda of borde) {
    const x = celda.x + 0.5;
    const y = celda.y + 0.5;
    for (const arma of armas) {
      const dx = arma.celda.x + 0.5 - x;
      const dy = arma.celda.y + 0.5 - y;
      const alcance = (arma.tipo.ataque ?? arma.tipo.area).alcance;
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
    compras: { cerbatana: 0, espino: 0, campanilla: 0, hongo: 0 },
    danoPorPlanta: { cerbatana: 0, espino: 0, hongo: 0 },
    danoAbsorbidoEspino: 0,
    perdidasPorPlanta: { cerbatana: 0, espino: 0, campanilla: 0, hongo: 0 },
    danoCentral: 0,
    plantasPerdidas: 0,
    disparos: 0,
    impactosCerbatana: 0,
    disparosPerdidos: 0,
    danoBloqueado: 0,
    atracciones: 0,
    pulsosHongo: 0,
    impactosHongo: 0,
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
        if (evento.tipo === 'muerte-planta' && !evento.central) {
          datos.plantasPerdidas += 1;
          datos.perdidasPorPlanta[evento.planta] += 1;
        }
        if (evento.tipo === 'disparo-perdido') {
          datos.disparosPerdidos += 1;
          datos.danoDesperdiciado += evento.dano;
        }
        if (evento.tipo === 'atraccion') datos.atracciones += 1;
        if (evento.tipo === 'esporas') datos.pulsosHongo += 1;
        if (evento.tipo === 'disparo') datos.disparos += 1;
        if (evento.tipo === 'mordida' && evento.planta === 'espino') datos.danoAbsorbidoEspino += evento.dano;
        if (evento.tipo === 'reflejo') {
          datos.danoPorPlanta.espino += evento.dano;
          datos.danoAplicado += evento.dano;
        }
        if (evento.tipo === 'impacto') {
          if (evento.planta === 'cerbatana') datos.impactosCerbatana += 1;
          if (evento.planta === 'hongo') datos.impactosHongo += 1;
          datos.danoBloqueado += evento.bloqueado ?? 0;
          if (evento.planta) datos.danoPorPlanta[evento.planta] += evento.aplicado;
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
