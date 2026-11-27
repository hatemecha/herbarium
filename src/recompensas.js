import { crearAleatorio } from './aleatorio.js';
import { RECOMPENSAS } from './config.js';

export function crearRecompensas(semilla, config = RECOMPENSAS) {
  const rng = crearAleatorio((semilla ^ 0x91e10da5) >>> 0);
  let anterior;
  let sinTarot = 0;
  return {
    config,
    sortear(oleada) {
      const pesos = { ...config.pesos };
      if (!config.tarot) pesos.tarot = 0;
      if (anterior === 'vacia') pesos.vacia = 0;
      const tipos = Object.keys(pesos);
      let restante = rng() * tipos.reduce((suma, tipo) => suma + pesos[tipo], 0);
      const tipo = config.tarot && sinTarot >= config.limiteTarot - 1 ? 'tarot'
        : tipos.find(clave => (restante -= pesos[clave]) < 0) ?? 'energia';
      sinTarot = tipo === 'tarot' ? 0 : sinTarot + 1;
      anterior = tipo;
      return Object.freeze({ tipo, oleada, energia: tipo === 'energia'
        ? Math.min(config.topeEnergia, config.baseEnergia + config.incrementoEnergia * (oleada - 1))
        : 0 });
    },
  };
}
