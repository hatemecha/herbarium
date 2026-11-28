import { ENERGIA } from './config.js';
import { claveCelda } from './tablero.js';

export const ARCANOS = {
  1: { nombre: 'El Mago', simbolismo: 'La figura alza la vara sobre los cuatro instrumentos. La mesa reúne los recursos sobre los que actúa su voluntad.', efectos: [{ dano: .12 }, { dano: .35, intervalo: .15 }] },
  3: { nombre: 'La Emperatriz', simbolismo: 'La corona estrellada y el trigo rodean a la figura sentada. El paisaje cultivado representa fertilidad y abundancia.', efectos: [{ generacion: .15 }, { generacion: .35, coste: .12 }] },
  4: { nombre: 'El Emperador', simbolismo: 'El cetro y el trono de carneros se recortan contra las montañas. El trono y la piedra hablan de autoridad y estabilidad.', efectos: [{ agrupacion: .12 }, { agrupacion: .30, costeAgrupado: .15 }] },
  9: { nombre: 'El Ermitaño', simbolismo: 'El caminante sostiene una linterna y un bastón. Su luz ofrece una guía en la oscuridad.', efectos: [{ sola: .25, una: .15 }, { sola: .60, una: .30, junta: -.15 }] },
  13: { nombre: 'La Muerte', simbolismo: 'Un jinete esquelético alza el estandarte. El sol entre las torres acompaña una imagen de tránsito y renovación.', efectos: [{ reposicion: .25 }, { reposicion: .50, rearme: 4 }] },
  14: { nombre: 'La Templanza', simbolismo: 'Un ángel vierte agua entre dos copas, con un pie en tierra y otro en el agua. El gesto representa mesura y combinación.', efectos: [{ diversa: .06 }, { diversa: .14, uniforme: -.10 }] },
  15: { nombre: 'El Diablo', simbolismo: 'Dos figuras encadenadas están al pie de un pedestal. Las cadenas figuran la sujeción a lo material.', efectos: [{ reserva: .30 }, { reserva: .80, consumo: .5 }] },
  17: { nombre: 'La Estrella', simbolismo: 'Una figura arrodillada vierte dos vasijas bajo las estrellas. El agua que vuelve a la tierra y al estanque sugiere renovación.', efectos: [{ cura: .08 }, { cura: .25, mordida: .10 }] },
};

const orden = Object.keys(ARCANOS).map(Number);
const limitar = (valor, min, max) => Math.max(min, Math.min(max, valor));
export const factorTarot = nivel => 1 + 0.75 * (nivel - 1) / (nivel + 2);

function aporte(carta) {
  return Object.entries(ARCANOS[carta.id].efectos[Number(carta.invertida)]).map(([clave, valor]) =>
    [clave, clave === 'rearme' ? valor : valor * factorTarot(carta.nivel)]);
}

export function describirArcano(carta) {
  const porcentaje = valor => Math.round(Math.abs(valor) * 1000) / 10 + '%';
  const frases = {
    dano: v => '+' + porcentaje(v) + ' de daño directo y de área.',
    intervalo: v => '+' + porcentaje(v) + ' de espera entre ataques.',
    generacion: v => '+' + porcentaje(v) + ' de energía pasiva mientras se genera.',
    coste: v => '+' + porcentaje(v) + ' al coste de compra.',
    agrupacion: v => '+' + porcentaje(v) + ' de vida máxima con al menos tres plantas vecinas.',
    costeAgrupado: v => '+' + porcentaje(v) + ' al coste si plantás junto a tres o más plantas.',
    sola: v => '+' + porcentaje(v) + ' de daño sin vecinas.',
    una: v => '+' + porcentaje(v) + ' de daño con una vecina.',
    junta: v => '−' + porcentaje(v) + ' de daño con dos o más vecinas.',
    reposicion: v => '−' + porcentaje(v) + ' en la próxima compra en una casilla perdida por mordidas. Vence al cerrar la siguiente invasión.',
    rearme: v => 'Una reposición con descuento tarda al menos ' + v + ' s en rearmarse.',
    diversa: v => '+' + porcentaje(v) + ' de daño por especie vecina distinta de la propia, hasta tres.',
    uniforme: v => '−' + porcentaje(v) + ' de daño sin una especie vecina distinta.',
    reserva: v => 'Hasta +' + porcentaje(v) + ' de daño con reservas altas. Con 100 de energía se alcanza la mitad del efecto.',
    consumo: v => 'En combate consume hasta ' + Number(v.toFixed(2)) + ' de energía por segundo según tus reservas.',
    cura: v => 'Al cerrar una invasión, recupera ' + porcentaje(v) + ' de la vida faltante, incluida la central.',
    mordida: v => '+' + porcentaje(v) + ' de daño de mordidas a las plantas compradas.',
  };
  return aporte(carta).map(([clave, valor]) => frases[clave](valor));
}

export function crearEfectosTarot(estado) {
  const creditos = new Map();
  const activos = new Map();
  let bonos = {};
  let completadas = 0;
  const cache = new WeakMap();
  const reserva = () => estado.energia / (100 + estado.energia);
  const clave = celda => claveCelda(celda.x, celda.y);

  const generacion = (genera, base = ENERGIA.porSegundo) => genera ? base * (1 + (bonos.generacion ?? 0)) : 0;

  function ataque(planta) {
    const base = planta.tipo.ataque ?? planta.tipo.area;
    if (!base || !activos.size) return base;
    const local = cache.get(planta)?.dano ?? 0;
    const dano = base.dano * limitar(1 + (bonos.dano ?? 0) + local + (bonos.reserva ?? 0) * reserva(), .25, 4);
    return { ...base, dano, intervalo: Math.max(.25, base.intervalo * (1 + (bonos.intervalo ?? 0))) };
  }

  return {
    adquirir(carta) {
      activos.set(carta.id + ':' + Number(carta.invertida), carta);
      bonos = {};
      for (const id of orden) {
        for (const orientacion of [0, 1]) {
          const activa = activos.get(id + ':' + orientacion);
          if (!activa) continue;
          for (const [clave, valor] of aporte(activa)) bonos[clave] = (bonos[clave] ?? 0) + valor;
        }
      }
    },
    espacial: () => Boolean(bonos.agrupacion || bonos.sola || bonos.diversa),
    precioAgrupado: () => Boolean(bonos.costeAgrupado),
    hayReposiciones: () => creditos.size > 0,
    actualizarPlanta(planta, vecinas) {
      if (!planta.tipo.comprable || planta.muerta) return;
      const distintas = new Set(vecinas.map(p => p.id).filter(id => id !== planta.id)).size;
      const dano = (vecinas.length === 0 ? bonos.sola : vecinas.length === 1 ? bonos.una : bonos.junta) ?? 0;
      cache.set(planta, { dano: dano + (distintas ? Math.min(3, distintas) * (bonos.diversa ?? 0) : bonos.uniforme ?? 0) });
      const max = Math.max(1, planta.tipo.vida * (1 + (vecinas.length >= 3 ? bonos.agrupacion ?? 0 : 0)));
      if (planta.vidaMax === max) return;
      planta.vida *= max / planta.vidaMax;
      planta.vidaMax = max;
    },
    ataque,
    precio(base, celda, agrupada) {
      if (!activos.size || !base) return base;
      const descuento = celda && creditos.has(clave(celda)) ? bonos.reposicion ?? 0 : 0;
      const factor = 1 + (bonos.coste ?? 0) + (agrupada ? bonos.costeAgrupado ?? 0 : 0) - descuento;
      return Math.max(1, Math.ceil(base * limitar(factor, .25, 2)));
    },
    descontar(celda) {
      if (!creditos.delete(clave(celda))) return 0;
      return bonos.rearme ?? 0;
    },
    perdida(planta) {
      if (bonos.reposicion && planta.tipo.comprable) creditos.set(clave(planta.celda), completadas + 2);
    },
    cerrarInvasion(plantas) {
      completadas++;
      for (const [celda, vence] of creditos) if (vence <= completadas) creditos.delete(celda);
      if (!bonos.cura) return;
      for (const planta of plantas) {
        if (!planta.muerta) planta.vida += (planta.vidaMax - planta.vida) * Math.min(.6, bonos.cura);
      }
    },
    multiplicadorMordida: planta => planta.tipo.comprable ? 1 + (bonos.mordida ?? 0) : 1,
    generacion,
    energia(dt, genera, combate, base) {
      const produccion = generacion(genera, base);
      const consumo = combate ? Math.min(estado.energia / dt, (bonos.consumo ?? 0) * reserva()) : 0;
      return produccion - consumo;
    },
  };
}
