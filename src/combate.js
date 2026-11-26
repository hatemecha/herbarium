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
  visual = BALANCE.visual,
  aparicion = BALANCE.aparicionEscarabajo,
  aleatorio = Math.random,
}) {
  const enemigos = [];
  const proyectiles = [];
  let eventos = [];
  let tiempo = 0;
  let aparecio = false;

  const plantaViva = (x, y) => {
    const planta = tablero.ocupante(x, y);
    return planta && !planta.muerta ? planta : null;
  };

  const centroDe = (planta) => ({ x: planta.celda.x + 0.5, y: planta.celda.y + 0.5 });

  function evento(datos) {
    eventos.push(datos);
  }

  function crear(x, y) {
    const enemigo = crearEnemigo({ x, y, tipo: tipoEnemigo, desfase: aleatorio() * 0.5 });
    enemigos.push(enemigo);
    return enemigo;
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
    evento({ tipo: 'muerte-planta', ...posicionDe(planta), central: planta === jardin.central });
  }

  function posicionDe(planta) {
    return { x: planta.celda.x + 0.5, y: planta.celda.y + 0.5 };
  }

  function morder(enemigo, objetivo) {
    enemigo.cooldown += tipoEnemigo.intervalo;
    objetivo.vida -= tipoEnemigo.dano;
    objetivo.destello = visual.destello;
    evento({ tipo: 'mordida', ...posicionDe(objetivo), central: objetivo === jardin.central });
    if (objetivo.vida <= 0) destruirPlanta(objetivo);
  }

  function moverYAtacar(enemigo, dt, reducido) {
    enemigo.destello = Math.max(0, enemigo.destello - dt);
    enemigo.animacion.actualizar(dt, reducido);
    const central = jardin.central;
    if (!central) return;

    if (enemigo.objetivo?.muerta) enemigo.objetivo = null;
    enemigo.vx = 0;
    enemigo.vy = 0;

    if (!enemigo.objetivo) {
      const destino = centroDe(central);
      const dx = destino.x - enemigo.x;
      const dy = destino.y - enemigo.y;
      const d = Math.hypot(dx, dy);
      if (d < 1e-6) return;
      const ux = dx / d;
      const uy = dy / d;
      const bloqueo = plantaViva(
        Math.floor(enemigo.x + ux * ALCANCE_DE_BLOQUEO),
        Math.floor(enemigo.y + uy * ALCANCE_DE_BLOQUEO),
      );
      if (bloqueo) {
        enemigo.objetivo = bloqueo;
      } else {
        const paso = Math.min(tipoEnemigo.velocidad * dt, d);
        enemigo.x += ux * paso;
        enemigo.y += uy * paso;
        enemigo.vx = ux * tipoEnemigo.velocidad;
        enemigo.vy = uy * tipoEnemigo.velocidad;
        if (Math.abs(ux) > 0.2) enemigo.mirada = Math.sign(ux);
      }
    }

    if (enemigo.objetivo) {
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

  function dispararCerbatanas(dt) {
    for (const planta of jardin.plantas) {
      const ataque = planta.tipo.ataque;
      if (!ataque || planta.muerta) continue;
      planta.enfriamiento = Math.max(0, planta.enfriamiento - dt);

      const origen = centroDe(planta);
      const objetivo = masCercano(origen, ataque.alcance);
      if (!objetivo) continue;

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
        recorrido: 0,
        distanciaMaxima: ataque.alcanceMaximo,
        activo: true,
      });
      planta.disparar(ux, uy, visual.disparo, visual.retroceso);
      evento({ tipo: 'disparo', x: origen.x, y: origen.y, ux, uy, central: false });
    }
  }

  function impactar(enemigo, proyectil) {
    enemigo.vida -= proyectil.dano;
    enemigo.destello = visual.destello;
    evento({ tipo: 'impacto', x: enemigo.x, y: enemigo.y });
    if (enemigo.vida <= 0) {
      enemigo.muerto = true;
      enemigo.tiempoMuerte = 0;
      enemigo.umbrales = Array.from({ length: 256 }, () => aleatorio());
      evento({ tipo: 'muerte-enemigo', x: enemigo.x, y: enemigo.y });
    }
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
      if (distanciaSegmentoPunto(x0, y0, proyectil.x, proyectil.y, enemigo.x, enemigo.y) <= tipoEnemigo.radio) {
        impactar(enemigo, proyectil);
        proyectil.activo = false;
        return;
      }
    }
    if (proyectil.recorrido >= proyectil.distanciaMaxima) proyectil.activo = false;
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
    actualizar(dt, reducido = false) {
      eventos = [];
      tiempo += dt;
      if (!aparecio && tiempo >= aparicion) {
        aparecio = true;
        aparecer();
      }
      for (const enemigo of enemigos) {
        if (enemigo.muerto) enemigo.tiempoMuerte += dt;
        else moverYAtacar(enemigo, dt, reducido);
      }
      dispararCerbatanas(dt);
      for (const proyectil of proyectiles) {
        if (proyectil.activo) avanzarProyectil(proyectil, dt);
      }
      limpiar();
    },
    aparecerEn: (x, y) => crear(x, y),
    eventos: () => eventos.slice(),
    derrota: () => Boolean(jardin.central?.muerta),
    tiempo: () => tiempo,
  };
}
