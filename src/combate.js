import { BALANCE } from './config.js';
import { crearEnemigo } from './entidades/enemigo.js';

// Índice de sector (k = ángulo / 45°, con k=0 en E y crecimiento horario) a índice en DIRECCIONES.
const SECTOR_A_DIRECCION = [2, 3, 4, 5, 6, 7, 0, 1];
const ALCANCE_DE_BLOQUEO = 0.5;

export function indiceDireccion(dx, dy) {
  const k = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
  return SECTOR_A_DIRECCION[(k + 8) % 8];
}

const distancia = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);

function distanciaSegmentoPunto(ax, ay, bx, by, px, py) {
  const vx = bx - ax;
  const vy = by - ay;
  const l2 = vx * vx + vy * vy;
  const t = l2 === 0 ? 0 : Math.min(1, Math.max(0, ((px - ax) * vx + (py - ay) * vy) / l2));
  return distancia(ax + vx * t, ay + vy * t, px, py);
}

export function crearCombate({
  tablero,
  jardin,
  tipoEnemigo,
  catalogoEnemigos = null,
  director = null,
  alAparecer,
  visual = BALANCE.visual,
  aparicion = BALANCE.aparicionEscarabajo,
  aleatorio = Math.random,
}) {
  const enemigos = [];
  const proyectiles = [];
  let eventos = [];
  let tiempo = 0;
  let aparecio = false;
  let campanillas = [];
  let espinos = [];
  let tiempoRalentizado = 0;

  const plantaViva = (x, y) => {
    const planta = tablero.ocupante(x, y);
    return planta && !planta.muerta ? planta : null;
  };

  const centroDe = (planta) => ({ x: planta.celda.x + 0.5, y: planta.celda.y + 0.5 });

  function evento(datos) {
    eventos.push(datos);
  }

  function crear(x, y, tipo = tipoEnemigo) {
    const enemigo = crearEnemigo({ x, y, tipo, desfase: aleatorio() * 0.5 });
    enemigos.push(enemigo);
    alAparecer?.(tipo.id);
    return enemigo;
  }

  function matar(enemigo) {
    if (enemigo.muerto) return;
    enemigo.muerto = true;
    enemigo.vida = Math.min(0, enemigo.vida);
    enemigo.tiempoMuerte = 0;
    enemigo.umbrales = Array.from({ length: 256 }, () => aleatorio());
    evento({ tipo: 'muerte-enemigo', x: enemigo.x, y: enemigo.y });
  }

  function aparecer() {
    const { columnas, filas } = tablero;
    for (let intento = 0; intento < 60; intento++) {
      const lado = Math.floor(aleatorio() * 4);
      const k = Math.floor(aleatorio() * (lado < 2 ? filas : columnas));
      const x = lado === 0 ? 0 : lado === 1 ? columnas - 1 : k;
      const y = lado === 2 ? 0 : lado === 3 ? filas - 1 : k;
      if (!tablero.ocupante(x, y)) return crear(x + 0.5, y + 0.5);
    }
    return null;
  }

  function destruirPlanta(planta) {
    jardin.destruir(planta);
    evento({ tipo: 'muerte-planta', ...posicionDe(planta), central: planta === jardin.central, planta: planta.id });
  }

  function posicionDe(planta) {
    return { x: planta.celda.x + 0.5, y: planta.celda.y + 0.5 };
  }

  function morder(enemigo, objetivo) {
    const tipo = enemigo.tipo;
    enemigo.cooldown += tipo.intervalo;
    enemigo.mordisco = visual.mordisco;
    const extra = enemigo.mordidas >= tipo.trasMordidas ? tipo.danoSostenido : 0;
    enemigo.mordidas += 1;
    const aplicado = Math.min(objetivo.vida, tipo.dano + extra);
    objetivo.vida -= aplicado;
    objetivo.destello = visual.destello;
    evento({ tipo: 'mordida', ...posicionDe(objetivo), central: objetivo === jardin.central, planta: objetivo.id, dano: aplicado });
    const reflejo = objetivo.tipo.reflejo ?? 0;
    if (reflejo > 0) {
      enemigo.vida -= reflejo;
      enemigo.destello = visual.destello;
      enemigo.colorImpacto = 'ambiental';
      enemigo.golpe = { x: 0, y: 0 };
      const dx = enemigo.x - objetivo.celda.x - 0.5;
      const dy = enemigo.y - objetivo.celda.y - 0.5;
      const d = Math.hypot(dx, dy) || 1;
      objetivo.reflejoDir = { x: dx / d, y: dy / d };
      evento({ tipo: 'reflejo', x: enemigo.x, y: enemigo.y, ux: dx / d, uy: dy / d, dano: Math.min(reflejo, enemigo.vida + reflejo) });
      if (enemigo.vida <= 0) matar(enemigo);
    }
    if (objetivo.vida <= 0) destruirPlanta(objetivo);
  }

  function moverYAtacar(enemigo, dt) {
    enemigo.destello = Math.max(0, enemigo.destello - dt);
    enemigo.mordisco = Math.max(0, enemigo.mordisco - dt);
    enemigo.despegue = Math.max(0, enemigo.despegue - dt);
    enemigo.reloj += dt;
    const central = jardin.central;
    if (!central) return;

    if (enemigo.objetivo?.muerta) {
      enemigo.objetivo = null;
      enemigo.senuelo = null;
      enemigo.despegue = visual.despegue;
    }
    const antesRalentizado = enemigo.ralentizado;
    enemigo.ralentizado = false;
    enemigo.vx = 0;
    enemigo.vy = 0;

    if (!enemigo.objetivo) {
      if (!enemigo.senuelo || enemigo.senuelo.muerta) {
        enemigo.senuelo = null;
        let masCerca = Infinity;
        for (const espino of espinos) {
          if (espino.muerta) continue;
          const d = distancia(enemigo.x, enemigo.y, espino.celda.x + 0.5, espino.celda.y + 0.5);
          if (d <= espino.tipo.atraccion && d < masCerca) {
            enemigo.senuelo = espino;
            masCerca = d;
          }
        }
        if (enemigo.senuelo) evento({ tipo: 'atraccion', x: enemigo.x, y: enemigo.y });
      }
      const destino = centroDe(enemigo.senuelo ?? central);
      const dx = destino.x - enemigo.x;
      const dy = destino.y - enemigo.y;
      const d = Math.hypot(dx, dy);
      const ux = dx / (d || 1);
      const uy = dy / (d || 1);
      const bloqueo = plantaViva(
        Math.floor(enemigo.x + ux * ALCANCE_DE_BLOQUEO),
        Math.floor(enemigo.y + uy * ALCANCE_DE_BLOQUEO),
      );
      if (bloqueo && (!enemigo.tipo.sobrevuela || bloqueo === central || bloqueo.tipo.reflejo)) {
        enemigo.objetivo = bloqueo;
        enemigo.tiempoEnObjetivo = 0;
        enemigo.mordidas = 0;
        if (enemigo.tipo.locomocion === 'vuelo') evento({ tipo: 'aterrizaje', x: enemigo.x, y: enemigo.y });
        if (enemigo.tipo.preparacionAtaque) enemigo.cooldown = enemigo.tipo.preparacionAtaque;
        const hacia = centroDe(bloqueo).x - enemigo.x;
        if (Math.abs(hacia) > 0.2) enemigo.mirada = Math.sign(hacia);
      } else {
        let reduccion = 0;
        for (const planta of campanillas) {
          const regla = planta.tipo.ralentiza;
          const dx = planta.celda.x + 0.5 - enemigo.x;
          const dy = planta.celda.y + 0.5 - enemigo.y;
          if (!planta.muerta && dx * dx + dy * dy <= regla.alcance ** 2) reduccion = Math.max(reduccion, regla.reduccion);
        }
        const velocidad = enemigo.tipo.velocidad * enemigo.factorMarcha * (1 - reduccion);
        tiempoRalentizado += reduccion > 0 ? dt : 0;
        enemigo.ralentizado = reduccion > 0;
        if (enemigo.ralentizado && !antesRalentizado) evento({ tipo: 'control', x: enemigo.x, y: enemigo.y });
        const paso = Math.min(velocidad * dt, d);
        enemigo.x += ux * paso;
        enemigo.y += uy * paso;
        enemigo.vx = ux * velocidad;
        enemigo.vy = uy * velocidad;
        if (Math.abs(ux) > 0.2) enemigo.mirada = Math.sign(ux);
      }
    }

    if (enemigo.objetivo) {
      enemigo.tiempoEnObjetivo += dt;
      enemigo.cooldown -= dt;
      if (enemigo.cooldown <= 0) morder(enemigo, enemigo.objetivo);
    }
  }

  function masCercano(origen, alcance) {
    let mejor = null;
    let mejorDistancia = alcance;
    for (const enemigo of enemigos) {
      if (enemigo.muerto) continue;
      const d = distancia(origen.x, origen.y, enemigo.x, enemigo.y);
      if (d <= mejorDistancia) {
        mejor = enemigo;
        mejorDistancia = d;
      }
    }
    return mejor;
  }

  function interceptar(origen, enemigo, velocidad) {
    let px = enemigo.x;
    let py = enemigo.y;
    for (let i = 0; i < 3; i++) {
      const t = distancia(origen.x, origen.y, px, py) / velocidad;
      px = enemigo.x + enemigo.vx * t;
      py = enemigo.y + enemigo.vy * t;
    }
    return { x: px, y: py };
  }

  function atacarConPlantas(dt) {
    for (const planta of jardin.plantas) {
      const ataque = planta.tipo.ataque ?? planta.tipo.area;
      if (!ataque || planta.muerta) continue;
      planta.enfriamiento = Math.max(0, planta.enfriamiento - dt);

      const origen = centroDe(planta);
      const objetivo = masCercano(origen, ataque.alcance);
      if (!objetivo) continue;

      if (planta.tipo.area) {
        if (planta.enfriamiento > 0) continue;
        planta.enfriamiento = ataque.intervalo;
        planta.disparar(0, 0, visual.disparo, 0);
        evento({ tipo: 'esporas', ...origen });
        for (const enemigo of enemigos) {
          if (!enemigo.muerto && distancia(origen.x, origen.y, enemigo.x, enemigo.y) <= ataque.alcance) {
            impactar(enemigo, { dano: ataque.dano, ux: 0, uy: 0, planta: planta.id });
          }
        }
        continue;
      }

      const punto = interceptar(origen, objetivo, ataque.velocidadProyectil);
      const dx = punto.x - origen.x;
      const dy = punto.y - origen.y;
      const d = Math.hypot(dx, dy) || 1;
      const ux = dx / d;
      const uy = dy / d;
      planta.direccion = indiceDireccion(ux, uy);

      if (planta.enfriamiento > 0) continue;
      planta.enfriamiento += ataque.intervalo;
      proyectiles.push({
        x: origen.x + ux * 0.35,
        y: origen.y + uy * 0.35,
        ux,
        uy,
        velocidad: ataque.velocidadProyectil,
        dano: ataque.dano,
        planta: planta.id,
        recorrido: 0,
        distanciaMaxima: ataque.alcanceMaximo,
        activo: true,
      });
      planta.disparar(ux, uy, visual.disparo, visual.retroceso);
      evento({ tipo: 'disparo', x: origen.x, y: origen.y, ux, uy, central: false });
    }
  }

  function impactar(enemigo, proyectil) {
    let bloqueado = 0;
    if (proyectil.planta === 'cerbatana') {
      if (!enemigo.objetivo) bloqueado = enemigo.tipo.corazaEnVuelo ?? 0;
      if (enemigo.tipo.corazaFrontal) {
        const destino = centroDe(enemigo.objetivo ?? enemigo.senuelo ?? jardin.central);
        const dx = destino.x - enemigo.x;
        const dy = destino.y - enemigo.y;
        if (-(dx * proyectil.ux + dy * proyectil.uy) > Math.hypot(dx, dy) * enemigo.tipo.frenteMinimo) {
          bloqueado = enemigo.tipo.corazaFrontal;
        }
      }
    }
    const aplicado = Math.min(Math.max(0, proyectil.dano - bloqueado), Math.max(0, enemigo.vida));
    const sobra = proyectil.dano - aplicado;
    enemigo.vida -= aplicado;
    enemigo.destello = visual.destello;
    enemigo.golpe = { x: proyectil.ux, y: proyectil.uy };
    enemigo.colorImpacto = bloqueado ? 'ambiental' : proyectil.planta === 'hongo' ? 'hongoLuz' : null;
    evento({ tipo: 'impacto', x: enemigo.x, y: enemigo.y, aplicado, sobra, bloqueado, ux: proyectil.ux, uy: proyectil.uy, planta: proyectil.planta });
    if (enemigo.vida <= 0) matar(enemigo);
  }

  function avanzarProyectil(proyectil, dt) {
    const x0 = proyectil.x;
    const y0 = proyectil.y;
    const paso = proyectil.velocidad * dt;
    proyectil.x += proyectil.ux * paso;
    proyectil.y += proyectil.uy * paso;
    proyectil.recorrido += paso;

    for (const enemigo of enemigos) {
      if (enemigo.muerto) continue;
      if (distanciaSegmentoPunto(x0, y0, proyectil.x, proyectil.y, enemigo.x, enemigo.y) <= enemigo.tipo.radio) {
        impactar(enemigo, proyectil);
        proyectil.activo = false;
        return;
      }
    }
    if (proyectil.recorrido >= proyectil.distanciaMaxima) {
      proyectil.activo = false;
      evento({ tipo: 'disparo-perdido', dano: proyectil.dano });
    }
  }

  function limpiar() {
    for (let i = enemigos.length - 1; i >= 0; i--) {
      if (enemigos[i].muerto && enemigos[i].tiempoMuerte >= visual.desintegracion) enemigos.splice(i, 1);
    }
    for (let i = proyectiles.length - 1; i >= 0; i--) {
      if (!proyectiles[i].activo) proyectiles.splice(i, 1);
    }
  }

  return {
    enemigos,
    proyectiles,
    actualizar(dt) {
      eventos = [];
      tiempo += dt;
      if (jardin.central?.muerta) {
        for (const enemigo of enemigos) {
          if (enemigo.muerto) enemigo.tiempoMuerte += dt;
        }
        for (const proyectil of proyectiles) proyectil.activo = false;
        limpiar();
        return;
      }
      if (director) {
        const vivos = enemigos.reduce((cantidad, enemigo) => cantidad + (enemigo.muerto ? 0 : 1), 0);
        for (const orden of director.avanzar(dt, vivos)) crear(orden.x, orden.y, catalogoEnemigos[orden.id]);
      } else if (!aparecio && tiempo >= aparicion) {
        aparecio = true;
        aparecer();
      }
      campanillas = jardin.plantas.filter((planta) => planta.tipo.ralentiza && !planta.muerta);
      espinos = jardin.plantas.filter((planta) => planta.tipo.atraccion && !planta.muerta);
      for (const enemigo of enemigos) {
        if (enemigo.muerto) enemigo.tiempoMuerte += dt;
        else moverYAtacar(enemigo, dt);
      }
      atacarConPlantas(dt);
      for (const proyectil of proyectiles) {
        if (proyectil.activo) avanzarProyectil(proyectil, dt);
      }
      limpiar();
      director?.registrar(eventos);
    },
    aparecerEn: (x, y, tipo) => crear(x, y, tipo),
    eventos: () => eventos.slice(),
    tiempoRalentizado: () => tiempoRalentizado,
    derrota: () => Boolean(jardin.central?.muerta),
    tiempo: () => tiempo,
  };
}
