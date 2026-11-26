import { OLEADAS, SIMULACION } from './config.js';
import { crearAleatorio } from './aleatorio.js';
import { ENEMIGOS, PLANTAS } from './catalogo.js';
import { crearCombate } from './combate.js';
import { crearEstado, avanzar } from './estado.js';
import { crearJardin } from './jardin.js';
import { cobertura, crearRegistro, dpsTeorico } from './metricas.js';
import { crearDirector } from './oleadas.js';
import { crearTablero } from './tablero.js';

// La semilla de las oleadas no se mezcla con la del jugador ni con el azar visual.
export function simularPartida({ semilla, estrategia, horizonte = 20 * 60, cada = 0.5, ajustes = {} }) {
  const tablero = crearTablero();
  const estado = crearEstado();
  const registro = crearRegistro();
  const director = crearDirector({
    tablero,
    oleadas: { ...OLEADAS, ...ajustes.oleadas },
    aleatorio: crearAleatorio(semilla >>> 0),
    semilla,
    ocupante: (x, y) => tablero.ocupante(x, y),
  });
  const jardin = crearJardin({
    tablero,
    estado,
    catalogo: {
      ...PLANTAS,
      espino: { ...PLANTAS.espino, ...ajustes.espino },
      hongo: { ...PLANTAS.hongo, area: { ...PLANTAS.hongo.area, ...ajustes.area } },
    },
    economia: ajustes.economia,
    frames: Object.fromEntries(Object.keys(PLANTAS).map((id) => [id, []])),
  });
  jardin.sembrar('central', tablero.centro);
  const combate = crearCombate({
    tablero,
    jardin,
    tipoEnemigo: ENEMIGOS.escarabajo,
    catalogoEnemigos: ENEMIGOS,
    director,
    aleatorio: crearAleatorio((semilla + 1) >>> 0),
  });
  const jugador = crearAleatorio((semilla + 2) >>> 0);
  const dt = SIMULACION.paso;
  const pasos = Math.round(horizonte / dt);
  let espera = 0;
  let tiempoCritico = 0;
  let primeraCompra = null;
  let primeraAmenaza = null;
  let ultimaCompra = 0;
  let intervaloCompraMaximo = 0;

  for (let i = 0; i < pasos; i++) {
    if (combate.derrota()) break;
    const antes = estado.energia;
    avanzar(estado, dt, ajustes.energia);
    registro.generada(estado.energia - antes);
    espera += dt;
    if (espera >= cada) {
      espera = 0;
      const accion = estrategia({
        t: combate.tiempo() + dt,
        estado,
        jardin,
        tablero,
        aleatorio: jugador,
        enemigos: combate.enemigos,
      });
      if (accion) {
        const energia = estado.energia;
        const planta = jardin.plantar(accion.id, { x: accion.x, y: accion.y });
        if (planta) {
          const t = combate.tiempo() + dt;
          primeraCompra ??= t;
          intervaloCompraMaximo = Math.max(intervaloCompraMaximo, t - ultimaCompra);
          ultimaCompra = t;
          registro.gastada(energia - estado.energia, accion.id);
        }
      }
    }
    jardin.actualizar(dt, true);
    combate.actualizar(dt);
    registro.eventos(combate.eventos());
    let vivos = 0;
    for (const enemigo of combate.enemigos) if (!enemigo.muerto) vivos += 1;
    registro.simultaneos(vivos);
    if (vivos > 0) primeraAmenaza ??= combate.tiempo();
    if (jardin.central.vida <= jardin.central.vidaMax / 3) tiempoCritico += dt;
  }

  const vivas = jardin.plantas.filter((planta) => !planta.muerta);
  const historial = director.historial();
  return {
    semilla,
    derrota: combate.derrota(),
    sobrevivio: !combate.derrota(),
    tiempo: combate.tiempo(),
    oleada: director.vista().numero,
    oleadasCompletas: historial.length,
    vidaCentral: Math.max(0, jardin.central?.vida ?? 0),
    ofensivas: vivas.filter((planta) => (planta.tipo.ataque || planta.tipo.area)).length,
    defensivas: vivas.filter((planta) => planta.tipo.reflejo).length,
    ocupacion: vivas.length / (tablero.columnas * tablero.filas),
    energiaFinal: estado.energia,
    dpsFinal: dpsTeorico(jardin),
    coberturaFinal: cobertura(jardin, tablero),
    historial,
    primeraCompra,
    primeraAmenaza,
    intervaloCompraMaximo: Math.max(intervaloCompraMaximo, combate.tiempo() - ultimaCompra),
    tiempoCritico,
    tiempoRalentizado: combate.tiempoRalentizado(),
    ...registro.datos,
  };
}
