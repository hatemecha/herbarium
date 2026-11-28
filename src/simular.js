import { crearTarot, PREGUNTAS_TAROT } from './tarot.js';
import { ARCANOS, crearEfectosTarot } from './efectosTarot.js';
import { OLEADAS, PALA, SIMULACION } from './config.js';
import { crearAleatorio } from './aleatorio.js';
import { ENEMIGOS, PLANTAS } from './catalogo.js';
import { crearCombate } from './combate.js';
import { crearEstado, avanzar } from './estado.js';
import { crearJardin } from './jardin.js';
import { cobertura, crearRegistro, dpsTeorico } from './metricas.js';
import { crearDirector } from './oleadas.js';
import { crearMundo } from './tablero.js';

// La semilla de las oleadas no se mezcla con la del jugador ni con el azar visual.
export function simularPartida({ semilla, estrategia, horizonte = 20 * 60, cada = 0.5, ajustes = {} }) {
  const tablero = crearMundo();
  const estado = crearEstado();
  const registro = crearRegistro();
  const efectos = crearEfectosTarot(estado);
  const tarot = crearTarot(semilla, Object.keys(ARCANOS).map(Number));
  const decidir = crearAleatorio(semilla ^ 0x388efa72);
  const arcanos = [];
  const nivelesExperimentales = new Map();
  const director = crearDirector({
    tablero,
    oleadas: { ...OLEADAS, ...ajustes.oleadas },
    aleatorio: crearAleatorio(semilla >>> 0),
    semilla,
    recompensas: ajustes.recompensas,
  });
  const jardin = crearJardin({
    tablero,
    estado,
    efectos,
    catalogo: {
      ...PLANTAS,
      espino: { ...PLANTAS.espino, ...ajustes.espino },
      hongo: { ...PLANTAS.hongo, area: { ...PLANTAS.hongo.area, ...ajustes.area } },
    },
    economia: ajustes.economia,
    pala: ajustes.pala,
    permitido: () => !director.enRecompensa(),
    alRetirar(planta, voluntaria) {
      if (voluntaria) combate.desvincular(planta);
    },
    frames: Object.fromEntries(Object.keys(PLANTAS).map((id) => [id, []])),
  });
  jardin.sembrar('central', tablero.centro);
  const combate = crearCombate({
    tablero,
    jardin,
    tipoEnemigo: ENEMIGOS.escarabajo,
    catalogoEnemigos: { ...ENEMIGOS, oruga: { ...ENEMIGOS.oruga, ...ajustes.oruga } },
    director,
    aleatorio: crearAleatorio((semilla + 1) >>> 0),
  });
  const jugador = crearAleatorio((semilla + 2) >>> 0);
  const dt = SIMULACION.paso;
  const pasos = Math.round(horizonte / dt);
  const cortes = [60, 120, 180, 300, 420, 600, 720, 840, 900, 1200, 1800];
  const evolucion = [];
  let espera = 0;
  let tiempoCritico = 0;
  let primeraCompra = null;
  let primeraAmenaza = null;
  let ultimaCompra = 0;
  let intervaloCompraMaximo = 0;
  let transcurrido = 0;
  let retiradas = 0;
  let energiaRecuperada = 0;
  let energiaPremios = 0;
  const premios = { energia: 0, vacia: 0, tarot: 0 };

  for (let i = 0; i < pasos; i++) {
    if (combate.derrota()) break;
    transcurrido = (i + 1) * dt;
    if (director.enRecompensa()) {
      const premio = director.presentar(dt, estado);
      if (premio) {
        premios[premio.tipo]++;
        energiaPremios += premio.energia;
        if (premio.tipo === 'tarot') {
          const vista = tarot.abrir();
          const pregunta = PREGUNTAS_TAROT.find(({ id }) => id === vista.id);
          const opcion = ajustes.responderTarot?.({ pregunta, aleatorio: decidir, ritual: arcanos.length })
            ?? pregunta.respuestas[Math.floor(decidir() * pregunta.respuestas.length)].id;
          const obtenida = tarot.responder(vista, opcion);
          if (!obtenida) throw new Error('Respuesta de simulación inválida');
          let carta = obtenida;
          if (typeof ajustes.invertirTarot === 'boolean') {
            const nivel = (nivelesExperimentales.get(obtenida.id) ?? 0) + 1;
            nivelesExperimentales.set(obtenida.id, nivel);
            carta = { ...obtenida, invertida: ajustes.invertirTarot, nivel };
          }
          jardin.adquirirArcano(carta);
          arcanos.push({ pregunta: vista.id, ...carta });
          tarot.cerrar(vista);
          director.finalizarTarot(premio);
        }
      }
    } else {
      const genera = director.generaEnergia();
      avanzar(estado, dt, efectos.energia(dt, genera, director.enCombate(), ajustes.energia));
      registro.generada(efectos.generacion(genera, ajustes.energia) * dt);
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
        if (accion?.retirar) {
          const desbloqueada = director.vista().numero >= (ajustes.pala?.desdeOleada ?? PALA.desdeOleada);
          const retirada = desbloqueada && jardin.retirar(accion.retirar);
          if (retirada) {
            retiradas++;
            energiaRecuperada += retirada.energia;
          }
        } else if (accion) {
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
    }
    let vivos = 0;
    for (const enemigo of combate.enemigos) if (!enemigo.muerto) vivos += 1;
    registro.simultaneos(vivos);
    if (i + 1 === Math.round(cortes[evolucion.length] / dt)) {
      const plantas = jardin.plantas.filter((planta) => !planta.muerta);
      evolucion.push({
        t: cortes[evolucion.length],
        energia: estado.energia,
        vida: jardin.central.vida,
        plantas: plantas.length - 1,
        bajas: registro.datos.plantasPerdidas,
        enemigos: vivos,
        oleada: director.vista().numero,
        completas: director.vista().numero - (director.enRecompensa() ? 0 : 1),
        dps: dpsTeorico(jardin),
      });
    }
    if (vivos > 0) primeraAmenaza ??= combate.tiempo();
    if (jardin.central.vida <= jardin.central.vidaMax / 3) tiempoCritico += dt;
  }

  const vivas = jardin.plantas.filter((planta) => !planta.muerta);
  const historial = director.historial();
  return {
    semilla,
    derrota: combate.derrota(),
    sobrevivio: !combate.derrota(),
    tiempo: transcurrido,
    tiempoActivo: combate.tiempo(),
    oleada: director.vista().numero,
    oleadasCompletas: historial.length,
    vidaCentral: Math.max(0, jardin.central?.vida ?? 0),
    ofensivas: vivas.filter((planta) => (planta.tipo.ataque || planta.tipo.area)).length,
    defensivas: vivas.filter((planta) => planta.tipo.reflejo).length,
    ocupacion: vivas.length / tablero.superficie(),
    energiaFinal: estado.energia,
    dpsFinal: dpsTeorico(jardin),
    coberturaFinal: cobertura(jardin, tablero),
    historial,
    evolucion,
    primeraCompra,
    primeraAmenaza,
    intervaloCompraMaximo: Math.max(intervaloCompraMaximo, combate.tiempo() - ultimaCompra),
    tiempoCritico,
    tiempoRalentizado: combate.tiempoRalentizado(),
    retiradas,
    energiaRecuperada,
    energiaPremios,
    premios,
    arcanos,
    ...registro.datos,
  };
}
