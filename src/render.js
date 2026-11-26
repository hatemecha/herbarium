import { BALANCE, COLOCACION, LUZ, MARCADORES, SPRITE } from './config.js';
import { crearIluminacion } from './iluminacion.js';
import { dibujarHormigas, resplandorCelda, resplandorPunto } from './marcadores.js';
import { rgb } from './paleta.js';

const LADO = SPRITE.lado;
const AUTOLUZ_ENEMIGO = 0.35;

function estiloMarca(tipo, roles) {
  if (tipo === 'seleccion') return { ...MARCADORES.seleccion, color: roles.marca };
  return { ...MARCADORES.sobrevuelo, color: roles.marcaSuave };
}

function lienzo(lado) {
  const canvas = document.createElement('canvas');
  canvas.width = lado;
  canvas.height = lado;
  return canvas;
}

function dibujarFrame(ctx, frame, x, y, mirada) {
  if (mirada >= 0) {
    ctx.drawImage(frame, x, y);
    return;
  }
  ctx.save();
  ctx.translate(x + LADO, y);
  ctx.scale(-1, 1);
  ctx.drawImage(frame, 0, 0);
  ctx.restore();
}

export function crearRenderer({ tablero, salida, roles, frames }) {
  const lado = tablero.ancho;
  const celda = tablero.celda;
  const fondo = lienzo(lado);
  const escena = lienzo(lado);
  const luminosa = lienzo(lado);
  const disolucion = lienzo(LADO);
  const ctxFondo = fondo.getContext('2d');
  const ctxEscena = escena.getContext('2d');
  const ctxLuminosa = luminosa.getContext('2d');
  const ctxDisolucion = disolucion.getContext('2d');
  const ctxSalida = salida.getContext('2d');
  const iluminacion = crearIluminacion({ lado, fondo: roles.fondo });

  ctxFondo.fillStyle = rgb(roles.terreno);
  ctxFondo.fillRect(0, 0, lado, lado);
  ctxFondo.fillStyle = rgb(roles.cuadricula);
  for (let i = 0; i <= tablero.columnas; i++) {
    const x = Math.min(lado - 1, i * celda);
    ctxFondo.fillRect(x, 0, 1, lado);
  }
  for (let j = 0; j <= tablero.filas; j++) {
    const y = Math.min(lado - 1, j * celda);
    ctxFondo.fillRect(0, y, lado, 1);
  }

  function resplandorCentral(centro, e, luz, impulso) {
    const cx = centro.x * e;
    const cy = centro.y * e;
    const radio = luz.bRad * e * 1.35;
    const alfa = LUZ.resplandor.nucleo * (1 + 0.5 * impulso * luz.k);
    const nucleo = ctxSalida.createRadialGradient(cx, cy, 0, cx, cy, radio);
    nucleo.addColorStop(0, rgb(roles.resplandor, alfa));
    nucleo.addColorStop(0.4, rgb(roles.resplandor, alfa * 0.35));
    nucleo.addColorStop(1, rgb(roles.resplandor, 0));
    ctxSalida.fillStyle = nucleo;
    ctxSalida.fillRect(0, 0, salida.width, salida.height);

    const amplio = ctxSalida.createRadialGradient(cx, cy, 0, cx, cy, luz.aRad * e);
    amplio.addColorStop(0, rgb(roles.ambiental, LUZ.resplandor.ambiente));
    amplio.addColorStop(1, rgb(roles.ambiental, 0));
    ctxSalida.fillStyle = amplio;
    ctxSalida.fillRect(0, 0, salida.width, salida.height);
  }

  function dibujarColocacion(vista, t, reducido) {
    const animar = !reducido;
    const hover = vista.puntero && vista.candidatas.find((c) => c.x === vista.puntero.x && c.y === vista.puntero.y);
    for (const casilla of vista.candidatas) {
      if (casilla === hover) continue;
      dibujarHormigas(ctxLuminosa, casilla, {
        tamano: celda,
        presencia: vista.presencia,
        alfa: COLOCACION.alfaCandidata,
        color: roles.marcaSuave,
        t,
        animar,
      });
    }

    if (!vista.puntero) return;
    const origen = tablero.origen(vista.puntero.x, vista.puntero.y);
    const alfa = vista.valido ? COLOCACION.alfaFantasmaValido : COLOCACION.alfaFantasmaInvalido;
    ctxLuminosa.globalAlpha = alfa * vista.presencia;
    ctxLuminosa.drawImage(frames[vista.tipoId][0][0], origen.x, origen.y);
    ctxLuminosa.globalAlpha = 1;
    if (vista.valido) {
      dibujarHormigas(ctxLuminosa, vista.puntero, {
        tamano: celda,
        presencia: vista.presencia,
        alfa: COLOCACION.alfaPuntero,
        color: roles.marca,
        t,
        animar,
      });
    }
  }

  function dibujarEnemigo(ctx, enemigo, alfa) {
    const frame = frames[enemigo.tipo.id][0][enemigo.animacion.variante()];
    const x = Math.round(enemigo.x * celda - LADO / 2);
    const y = Math.round(enemigo.y * celda - LADO / 2);
    ctx.globalAlpha = alfa;
    if (!enemigo.muerto) {
      dibujarFrame(ctx, frame, x, y, enemigo.mirada);
      return;
    }
    const progreso = enemigo.tiempoMuerte / BALANCE.visual.desintegracion;
    ctxDisolucion.clearRect(0, 0, LADO, LADO);
    ctxDisolucion.drawImage(frame, 0, 0);
    ctxDisolucion.globalCompositeOperation = 'destination-out';
    enemigo.umbrales.forEach((umbral, i) => {
      if (umbral < progreso) ctxDisolucion.fillRect(i % LADO, Math.floor(i / LADO), 1, 1);
    });
    ctxDisolucion.globalCompositeOperation = 'source-over';
    dibujarFrame(ctx, disolucion, x, y, enemigo.mirada);
  }

  return {
    registrarPlanta(planta) {
      if (planta.tipo.luz) planta.fuente = iluminacion.agregarFuente(planta.nucleo, planta.tipo.luz);
    },
    retirarPlanta(planta) {
      if (planta.fuente) iluminacion.quitarFuente(planta.fuente);
      planta.fuente = null;
    },
    dibujar({ t, impulso, reducido, central, plantas, enemigos, proyectiles, particulas, marcas, vista }) {
      const luz = iluminacion.actualizar(t, impulso, reducido, central.nucleo);

      for (const planta of plantas) {
        if (planta.fuente) planta.fuente.factor = planta.opacidad;
      }

      ctxEscena.clearRect(0, 0, lado, lado);
      ctxEscena.drawImage(fondo, 0, 0);
      for (const planta of plantas) {
        const { x, y } = planta.origen;
        const d = planta.desplazamiento();
        ctxEscena.globalAlpha = planta.opacidad;
        ctxEscena.drawImage(planta.fotograma(), x + d.x, y + d.y);
      }
      for (const enemigo of enemigos) dibujarEnemigo(ctxEscena, enemigo, 1);
      ctxEscena.globalAlpha = 1;

      ctxLuminosa.clearRect(0, 0, lado, lado);
      for (const planta of plantas) {
        const { x, y } = planta.origen;
        const d = planta.desplazamiento();
        ctxLuminosa.globalAlpha = planta.tipo.propia * planta.opacidad;
        ctxLuminosa.drawImage(planta.fotograma(), x + d.x, y + d.y);
        if (planta.destello > 0) {
          ctxLuminosa.globalCompositeOperation = 'lighter';
          ctxLuminosa.globalAlpha = planta.destello * 2 * planta.opacidad;
          ctxLuminosa.drawImage(planta.fotograma(), x + d.x, y + d.y);
          ctxLuminosa.globalCompositeOperation = 'source-over';
        }
      }
      for (const enemigo of enemigos) {
        dibujarEnemigo(ctxLuminosa, enemigo, AUTOLUZ_ENEMIGO);
        if (enemigo.destello > 0 && !enemigo.muerto) {
          ctxLuminosa.globalCompositeOperation = 'lighter';
          dibujarEnemigo(ctxLuminosa, enemigo, enemigo.destello * 2);
          ctxLuminosa.globalCompositeOperation = 'source-over';
        }
      }
      ctxLuminosa.globalAlpha = 1;

      for (const proyectil of proyectiles) {
        const x = Math.round(proyectil.x * celda);
        const y = Math.round(proyectil.y * celda);
        const cola = Math.round((proyectil.x - proyectil.ux * 0.15) * celda);
        const colaY = Math.round((proyectil.y - proyectil.uy * 0.15) * celda);
        ctxLuminosa.fillStyle = rgb(roles.boca, 0.6);
        ctxLuminosa.fillRect(cola, colaY, 1, 1);
        ctxLuminosa.fillStyle = rgb(roles.bocaBrillo);
        ctxLuminosa.fillRect(x - 1, y - 1, 2, 2);
      }

      particulas.dibujar(ctxLuminosa, roles.particula);
      if (vista) dibujarColocacion(vista, t, reducido);
      for (const marca of marcas) {
        const estilo = estiloMarca(marca.tipo, roles);
        dibujarHormigas(ctxLuminosa, marca.celda, {
          tamano: celda,
          presencia: marca.presencia,
          alfa: estilo.alfa,
          color: estilo.color,
          t,
          animar: !reducido,
        });
      }

      const B = salida.width;
      const e = B / lado;
      ctxSalida.globalCompositeOperation = 'source-over';
      ctxSalida.imageSmoothingEnabled = false;
      ctxSalida.drawImage(escena, 0, 0, lado, lado, 0, 0, B, B);
      ctxSalida.drawImage(iluminacion.canvas, 0, 0, lado, lado, 0, 0, B, B);
      ctxSalida.drawImage(luminosa, 0, 0, lado, lado, 0, 0, B, B);

      ctxSalida.imageSmoothingEnabled = true;
      ctxSalida.globalCompositeOperation = 'lighter';
      resplandorCentral(central.nucleo, e, luz, impulso);
      for (const planta of plantas) {
        if (planta.tipo.resplandor) {
          resplandorPunto(ctxSalida, planta.nucleo, {
            escala: e,
            radio: planta.tipo.resplandor.radio,
            alfa: planta.tipo.resplandor.alfa * planta.opacidad,
            color: roles[planta.tipo.resplandor.color],
          });
        }
      }
      for (const marca of marcas) {
        const estilo = estiloMarca(marca.tipo, roles);
        resplandorCelda(ctxSalida, marca.celda, {
          tamano: celda,
          escala: e,
          presencia: marca.presencia,
          alfa: estilo.resplandor,
          color: estilo.color,
        });
      }
      ctxSalida.globalCompositeOperation = 'source-over';
    },
  };
}
