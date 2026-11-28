import { RECOMPENSAS } from '../src/config.js';
import { simularPartida } from '../src/simular.js';

const radio = ({ x, y }) => Math.hypot(x, y);
const geometria = {
  compacta: radio,
  radial: ({ x, y }) => radio({ x, y }) + 4 * Math.min(Math.abs(x), Math.abs(y)),
  ramificada: ({ x, y }) => Math.abs(y) + 0.6 * Math.abs(x) + (y && x % 3 ? 8 : 0),
  alargada: ({ x, y }) => x > 0 && y === 0 ? x : Infinity,
  dispersa: ({ x, y }) => 0.4 * radio({ x, y }) + (x % 2 || y % 2 ? 3 : 0),
};

function politica(puntuar) {
  return ({ jardin }) => {
    const vivas = jardin.plantas.filter(planta => !planta.muerta);
    const mezcla = ['cerbatana', 'espino', 'cerbatana', 'hongo', 'cerbatana', 'campanilla'];
    const id = mezcla[(vivas.length - 1) % mezcla.length];
    const celda = jardin.candidatas(id).sort((a, b) => puntuar(a) - puntuar(b))[0];
    return celda && Number.isFinite(puntuar(celda)) ? { id, ...celda } : null;
  };
}

for (const [forma, puntuar] of Object.entries(geometria)) {
  for (const semilla of [7, 19, 42]) {
    const r = simularPartida({
      semilla, estrategia: politica(puntuar), horizonte: 900,
      ajustes: { recompensas: { ...RECOMPENSAS, tarot: false } },
    });
    const duraciones = r.historial.map(oleada => oleada.duracion);
    console.log(JSON.stringify({
      forma, semilla, derrota: r.derrota, segundos: Math.round(r.tiempo), completas: r.oleadasCompletas,
      vida: Math.round(r.vidaCentral), perdidas: r.plantasPerdidas, compras: r.compras,
      dano: r.danoPorPlanta, espino: [r.atracciones, r.danoAbsorbidoEspino],
      energiaGenerada: Math.round(r.energiaGenerada), energiaGastada: r.energiaGastada,
      energiaPremios: r.energiaPremios, premios: r.premios,
      cobertura: Number(r.coberturaFinal.toFixed(2)),
      duracionMedia: duraciones.length ? Math.round(duraciones.reduce((a, b) => a + b) / duraciones.length) : null,
    }));
  }
}
