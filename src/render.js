import { BALANCE, COLOCACION, FEEDBACK, INSECTO, LUZ, MARCADORES, SPRITE } from './config.js';
import { elevacion, estadoVisual, fotogramaEnemigo } from './entidades/enemigo.js';
import { crearIluminacion } from './iluminacion.js';
import { dibujarHormigas } from './marcadores.js';
import { rgb } from './paleta.js';

const LADO = SPRITE.lado;
const AUTOLUZ_ENEMIGO = 0.8;
// El suelo está seis píxeles bajo el centro del sprite: las patas posadas tocan ahí.
const SOMBRA_Y = 6;

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
  ctxEscena.imageSmoothingEnabled = false;
  ctxLuminosa.imageSmoothingEnabled = false;
  const ctxDisolucion = disolucion.getContext('2d');
  const silueta = lienzo(LADO);
  const ctxSilueta = silueta.getContext('2d');
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

  // Motas de suelo fijas y de contraste bajo, solo visibles donde llega la luz.
  ctxFondo.fillStyle = rgb(roles.tierra, 0.22);
  for (let y = 0; y < tablero.filas; y++) {
    for (let x = 0; x < tablero.columnas; x++) {
      const dx = 2 + (x * 7 + y * 11) % (celda - 4);
      const dy = 2 + (x * 13 + y * 5) % (celda - 4);
      ctxFondo.fillRect(x * celda + dx, y * celda + dy, 1, 1);
    }
  }

  const ladoLuz = Math.ceil(lado / 2);
  const colorLuz = lienzo(ladoLuz);
  const ctxColor = colorLuz.getContext('2d');
  const mapa = ctxColor.createImageData(ladoLuz, ladoLuz);
  const intensidad = new Uint8Array(ladoLuz ** 2);
  const cruces = new Uint8Array(ladoLuz ** 2);
  const destellos = new Map();
  const luciernagas = [
    { fase: 0.3, velocidad: 0.19, radio: 2.1 },
    { fase: 2.4, velocidad: -0.15, radio: 3.0 },
    { fase: 4.6, velocidad: 0.12, radio: 3.7 },
  ];

  function foco(x, y, radio, color, opacidad, ambiental) {
    const cx = x / 2, cy = y / 2, r = radio / 2;
    for (let fila = Math.max(0, Math.floor(cy - r)); fila < Math.min(ladoLuz, Math.ceil(cy + r)); fila++) {
      for (let col = Math.max(0, Math.floor(cx - r)); col < Math.min(ladoLuz, Math.ceil(cx + r)); col++) {
        const dx = (col + 0.5 - cx) / r;
        const dy = (fila + 0.5 - cy) / (r * 0.75);
        const textura = ((col * 5 + fila * 3) % 7 - 3) * 0.016;
        const d2 = dx * dx + dy * dy + textura;
        if (d2 >= 1) continue;
        const i = fila * ladoLuz + col;
        if (ambiental && cruces[i] < 2) cruces[i]++;
        const alfa = Math.round(opacidad * (d2 < 0.1 ? 42 : d2 < 0.42 ? 24 : 10));
        if (alfa <= intensidad[i]) continue;
        intensidad[i] = alfa;
        mapa.data.set(color, i * 4);
      }
    }
  }

  function dibujarAmbiente(t, reducido, central, plantas) {
    intensidad.fill(0);
    cruces.fill(0);
    for (const planta of plantas) {
      if (planta.opacidad <= 0) continue;
      const principal = planta === central;
      const { x, y } = planta.nucleo;
      const fase = planta.celda.x * 2.17 + planta.celda.y * 1.43;
      const pulso = reducido ? 1 : 1 + 0.12 * Math.sin(t * 1.25 + fase);
      const { rebote, resplandor } = planta.tipo;
      const color = roles[rebote?.color ?? resplandor?.color ?? 'petalo'];
      const opacidad = planta.opacidad * central.opacidad * pulso * (rebote?.intensidad ?? 1);
      foco(x, y + 2, (principal ? 21 : 16) * pulso, color, opacidad, true);
    }
    for (const [casilla, luz] of destellos) {
      const resto = 1 - (t - luz.t) / 0.36;
      if (resto <= 0 || central.muerta || reducido) destellos.delete(casilla);
      else foco(luz.x, luz.y, luz.radio * (1.12 - resto * 0.32), luz.color, resto, false);
    }
    for (const luz of luciernagas) {
      const angulo = luz.fase + t * luz.velocidad;
      const radio = celda * (luz.radio + 0.38 * Math.sin(t * 0.41 + luz.fase));
      luz.x = Math.round(lado / 2 + Math.cos(angulo) * radio);
      luz.y = Math.round(lado / 2 + Math.sin(angulo) * radio * 0.76 + 4 * Math.sin(t * 0.73 + luz.fase));
      const pulso = (1 + Math.sin(t * (1.45 + luz.velocidad) + luz.fase)) / 2;
      luz.brillo = reducido || central.muerta ? 0 : (0.14 + 0.86 * pulso ** 2) * central.opacidad;
      if (luz.brillo > 0) foco(luz.x, luz.y, 14, roles.luciernaga, 0.58 * luz.brillo, false);
    }
    const deriva = reducido ? 0 : Math.floor(t * 2);
    for (let i = 0; i < intensidad.length; i++) {
      const bruma = intensidad[i] > 0 && cruces[i] === 2 && (i % ladoLuz + 2 * Math.floor(i / ladoLuz) + deriva) % 5 === 0;
      mapa.data[i * 4 + 3] = Math.min(48, intensidad[i] + (bruma ? 5 * central.opacidad : 0));
    }
    ctxColor.putImageData(mapa, 0, 0);
  }

  function esquinas(casilla, color, alfa, margen = 0) {
    const { x, y } = tablero.origen(casilla.x, casilla.y);
    const ladoMarca = celda - 1 + margen * 2;
    ctxLuminosa.fillStyle = rgb(color, alfa);
    for (const [dx, dy] of [[0, 0], [ladoMarca - 2, 0], [0, ladoMarca], [ladoMarca - 2, ladoMarca]]) {
      ctxLuminosa.fillRect(x - margen + dx, y - margen + dy, 3, 1);
    }
  }

  function dibujarAlcance(alcance, t, reducido) {
    if (!alcance.radio) return;
    const radio = alcance.radio * celda;
    const cx = (alcance.x + 0.5) * celda;
    const cy = (alcance.y + 0.5) * celda;
    const color = alcance.tipo === 'campanilla' ? roles.campanaLuz
      : alcance.tipo === 'hongo' ? roles.hongoLuz
      : alcance.tipo === 'espino' ? roles.ambiental : roles.bocaBrillo;
    const puntos = Math.round(radio * 1.25);
    const paso = reducido ? 0 : Math.floor(t * 3);
    for (let i = 0; i < puntos; i++) {
      const angulo = i * Math.PI * 2 / puntos;
      const alfa = (i + paso) % 5 === 0 ? 0.62 : 0.28;
      ctxLuminosa.fillStyle = rgb(color, alfa);
      ctxLuminosa.fillRect(Math.round(cx + Math.cos(angulo) * radio), Math.round(cy + Math.sin(angulo) * radio), 1, 1);
    }
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

  function dibujarSombra(ctx, enemigo, reducido) {
    const altura = elevacion(enemigo, reducido);
    const x = Math.round(enemigo.x * celda);
    const y = Math.round(enemigo.y * celda) + SOMBRA_Y;
    const medio = enemigo.tipo.sombra ?? 3;
    const estrecho = Math.max(1, medio * 2 - 2);
    ctx.fillStyle = rgb(roles.fondo, INSECTO.sombra.base + INSECTO.sombra.porAltura * altura);
    ctx.fillRect(x - medio, y, medio * 2, 1);
    ctx.fillRect(x - Math.floor(estrecho / 2), y + 1, estrecho, 1);
  }

  // Siluetas de un cuadro en un color: el contorno y el destello salen de aquí, no de otro sprite.
  function siluetaDe(frame, color) {
    ctxSilueta.clearRect(0, 0, LADO, LADO);
    ctxSilueta.drawImage(frame, 0, 0);
    ctxSilueta.globalCompositeOperation = 'source-in';
    ctxSilueta.fillStyle = rgb(color);
    ctxSilueta.fillRect(0, 0, LADO, LADO);
    ctxSilueta.globalCompositeOperation = 'source-over';
    return silueta;
  }

  // El empuje del golpe es visual: desplaza el dibujo hasta dos píxeles, no la posición lógica.
  function posicionEnemigo(enemigo, reducido) {
    const altura = elevacion(enemigo, reducido);
    const fuerza = reducido ? 0 : (enemigo.destello / BALANCE.visual.destello) * INSECTO.empuje;
    return {
      x: Math.round(enemigo.x * celda - LADO / 2 + enemigo.golpe.x * fuerza),
      y: Math.round(enemigo.y * celda - LADO / 2 - altura + enemigo.golpe.y * fuerza),
      frame: frames[enemigo.tipo.id][0][fotogramaEnemigo(enemigo, reducido)],
    };
  }

  function dibujarContorno(ctx, enemigo, reducido) {
    const { x, y, frame } = posicionEnemigo(enemigo, reducido);
    const color = enemigo.ralentizado ? roles.campana
      : enemigo.senuelo && !enemigo.objetivo ? roles.ambiental
      : enemigo.tipo.corazaFrontal ? roles.insectoReflejo : roles.insectoBrillo;
    const contorno = siluetaDe(frame, color);
    ctx.globalAlpha = (enemigo.ralentizado ? 0.38 : AUTOLUZ_ENEMIGO * INSECTO.contorno) + 0.4 * intensidadGolpe(enemigo);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      dibujarFrame(ctx, contorno, x + dx, y + dy, enemigo.mirada);
    }
    ctx.globalAlpha = 1;
  }

  function intensidadGolpe(enemigo) {
    const restante = enemigo.muerto ? enemigo.destello - enemigo.tiempoMuerte : enemigo.destello;
    return Math.max(0, Math.min(1, restante / BALANCE.visual.destello));
  }

  function dibujarDestello(ctx, enemigo, { x, y, frame }) {
    const intensidad = intensidadGolpe(enemigo);
    if (intensidad <= 0) return;
    ctx.globalAlpha = Math.sqrt(intensidad) * INSECTO.destello;
    dibujarFrame(ctx, siluetaDe(frame, roles[enemigo.colorImpacto] ?? roles.insectoImpacto), x, y, enemigo.mirada);
    ctx.globalAlpha = 1;
  }

  // Los gestos se dibujan en píxeles lógicos, con la misma paleta que el organismo.
  function dibujarPlanta(ctx, planta, x, y, reducido) {
    const frame = planta.fotograma();
    // Compresión de un píxel, sin interpolar ni tocar la entidad.
    const contraccion = !reducido && planta.tipo.area && planta.disparo <= 0 &&
      planta.enfriamiento > 0 && planta.enfriamiento < .16;
    if (contraccion) ctx.drawImage(frame, 0, 0, 16, 16, x, y + 1, 16, 15);
    else ctx.drawImage(frame, x, y);
  }

  function gestoPlanta(planta, enemigos, t, reducido) {
    const { x, y } = planta.nucleo;
    const ctx = ctxLuminosa;
    const punto = (dx, dy, color, alfa, ancho = 1) => {
      ctx.fillStyle = rgb(color, alfa);
      ctx.fillRect(Math.round(x + dx), Math.round(y + dy), ancho, 1);
    };
    if (planta.tipo.ataque && planta.disparo <= 0 && planta.enfriamiento > 0 && planta.enfriamiento < .16 &&
      enemigos.some(e => !e.muerto && Math.hypot(e.x - planta.celda.x - .5, e.y - planta.celda.y - .5) <= planta.tipo.ataque.alcance)) {
      punto(0, -1, roles.bocaBrillo, .65);
    }
    if (planta.tipo.ataque && planta.disparo > 0) {
      const { x: ux, y: uy } = planta.retrocesoDir;
      const fuerza = planta.disparo / BALANCE.visual.disparo;
      // Una chispa direccional breve en la boca; el proyectil continúa su propia trayectoria.
      const r = reducido ? 5 : 4 + Math.round((1 - fuerza) * 3);
      punto(ux * r, uy * r, roles.bocaBrillo, fuerza);
      punto(ux * (r + 2), uy * (r + 2), roles.boca, fuerza * 0.65);
    }
    if (planta.tipo.ralentiza && enemigos.some((e) => !e.muerto && e.ralentizado &&
      Math.hypot(e.x - planta.celda.x - 0.5, e.y - planta.celda.y - 0.5) <= planta.tipo.ralentiza.alcance)) {
      // Dos arcos abiertos, como ondas de una campana, sin llenar el área de influencia.
      const fase = reducido ? 0 : Math.floor((t + planta.celda.x * 0.13) * 3) % 3;
      for (const signo of [-1, 1]) {
        punto(signo * (5 + fase), -2, roles.campanaLuz, 0.55);
        punto(signo * (6 + fase), 0, roles.campana, 0.5);
        punto(signo * (5 + fase), 2, roles.campanaLuz, 0.55);
      }
    }
    if (planta.tipo.area) {
      const carga = 1 - Math.min(1, planta.enfriamiento / planta.tipo.area.intervalo);
      // Tres poros del sombrero señalan la carga; las esporas salen en radios discontinuos.
      for (let i = 0; i < 3; i++) {
        punto(-2 + i * 2, -1, roles.hongoLuz, carga >= (i + 1) / 3 ? 0.9 : 0.18);
      }
      if (planta.disparo > 0) {
        const progreso = 1 - planta.disparo / BALANCE.visual.disparo;
        const radio = reducido ? planta.tipo.area.alcance * celda : 5 + Math.min(1, progreso * 1.6) * (planta.tipo.area.alcance * celda - 5);
        const cx = planta.origen.x + celda / 2;
        const cy = planta.origen.y + celda / 2;
        for (let i = 0; i < 12; i++) {
          const a = i * Math.PI / 6;
          ctx.fillStyle = rgb(roles.hongoLuz, (1 - progreso) * 0.85);
          ctx.fillRect(Math.round(cx + Math.cos(a) * radio), Math.round(cy + Math.sin(a) * radio), 1, 1);
        }
      }
    }
    if (planta.tipo.reflejo && planta.destello > 0) {
      const fuerza = planta.destello / BALANCE.visual.destello;
      // Las púas responden al contacto con puntas angulares, no con una onda circular.
      const { x: ux, y: uy } = planta.reflejoDir ?? { x: 0, y: -1 };
      for (const signo of [-1, 0, 1]) {
        punto(ux * 6 - uy * signo * 3, uy * 6 + ux * signo * 3, roles.ambiental, fuerza);
        punto(ux * 8 - uy * signo * 4, uy * 8 + ux * signo * 4, roles.hojaBrillo, fuerza * 0.8);
      }
    }
  }

  function gestoEnemigo(enemigo, reducido) {
    const ctx = ctxLuminosa;
    const x = Math.round(enemigo.x * celda);
    const y = Math.round(enemigo.y * celda) + SOMBRA_Y;
    if (enemigo.objetivo && enemigo.tipo.preparacionAtaque && enemigo.tiempoEnObjetivo < enemigo.tipo.preparacionAtaque) {
      // La oruga prepara su primera mordida; la señal se concentra en la cabeza.
      ctx.fillStyle = rgb(roles.insectoReflejo, 0.35 + 0.55 * enemigo.tiempoEnObjetivo / enemigo.tipo.preparacionAtaque);
      ctx.fillRect(x + enemigo.mirada * 5, y - 3, 1, 1);
    }
    if (enemigo.objetivo && enemigo.mordisco > 0 && enemigo.mordidas > enemigo.tipo.trasMordidas) {
      ctx.fillStyle = rgb(roles.insectoReflejo, 0.8);
      const boca = x + enemigo.mirada * 5;
      ctx.fillRect(boca, y - 3, 2, 1);
      ctx.fillRect(boca, y - 1, 2, 1);
    }
  }

  function dibujarEnemigo(ctx, enemigo, alfa, reducido) {
    ctx.globalAlpha = alfa;
    if (!enemigo.muerto) {
      const { x, y, frame } = posicionEnemigo(enemigo, reducido);
      dibujarFrame(ctx, frame, x, y, enemigo.mirada);
      return;
    }
    const x = Math.round(enemigo.x * celda - LADO / 2);
    const y = Math.round(enemigo.y * celda - LADO / 2);
    const frame = frames[enemigo.tipo.id][0][fotogramaEnemigo(enemigo, reducido)];
    const progreso = enemigo.tiempoMuerte / BALANCE.visual.desintegracion;
    ctxDisolucion.clearRect(0, 0, LADO, LADO);
    ctxDisolucion.drawImage(frame, 0, 0);
    ctxDisolucion.globalCompositeOperation = 'destination-out';
    enemigo.umbrales.forEach((umbral, i) => {
      if (umbral < progreso) ctxDisolucion.fillRect(i % LADO, Math.floor(i / LADO), 1, 1);
    });
    ctxDisolucion.globalCompositeOperation = 'source-over';
    dibujarFrame(ctx, disolucion, x, y, enemigo.mirada);
    if (ctx === ctxLuminosa) dibujarDestello(ctx, enemigo, { x, y, frame: disolucion });
  }

  return {
    destello(x, y, radio, color, t) {
      const casilla = Math.floor(y / celda) * tablero.columnas + Math.floor(x / celda);
      destellos.set(casilla, { x, y, radio, color, t });
    },
    registrarPlanta(planta) {
      if (planta.tipo.luz) planta.fuente = iluminacion.agregarFuente(planta.nucleo, planta.tipo.luz);
    },
    retirarPlanta(planta) {
      if (planta.fuente) iluminacion.quitarFuente(planta.fuente);
      planta.fuente = null;
    },
    dibujar({ t, impulso, reducido, central, plantas, enemigos, proyectiles, particulas, marcas, vista, retiro, alcance, gesto, pulsoCentro = 0, hoverCelda = null, tactil = false }) {
      dibujarAmbiente(t, reducido, central, plantas);
      for (const planta of plantas) {
        if (planta.fuente) planta.fuente.factor = planta.opacidad * central.opacidad;
      }

      iluminacion.actualizar(t, reducido ? impulso : Math.max(impulso, pulsoCentro * 0.65), reducido, central.nucleo, central.opacidad);

      ctxEscena.clearRect(0, 0, lado, lado);
      ctxEscena.drawImage(fondo, 0, 0);
      ctxEscena.drawImage(colorLuz, 0, 0, lado, lado);
      for (const planta of plantas) {
        const { x, y } = planta.origen;
        const d = reducido ? { x: 0, y: 0 } : planta.desplazamiento();
        ctxEscena.globalAlpha = planta.opacidad;
        dibujarPlanta(ctxEscena, planta, x + d.x, y + d.y, reducido);
      }
      for (const enemigo of enemigos) {
        if (!enemigo.muerto) dibujarSombra(ctxEscena, enemigo, reducido);
      }
      for (const enemigo of enemigos) dibujarEnemigo(ctxEscena, enemigo, 1, reducido);
      ctxEscena.globalAlpha = 1;

      ctxLuminosa.clearRect(0, 0, lado, lado);
      for (const planta of plantas) {
        const { x, y } = planta.origen;
        const d = reducido ? { x: 0, y: 0 } : planta.desplazamiento();
        ctxLuminosa.globalAlpha = planta.tipo.propia * planta.opacidad;
        const frame = planta.fotograma();
        dibujarPlanta(ctxLuminosa, planta, x + d.x, y + d.y, reducido);
        if (planta.destello > 0) {
          ctxLuminosa.globalAlpha = planta.opacidad * 0.65 * planta.destello / BALANCE.visual.destello;
          ctxLuminosa.drawImage(siluetaDe(frame, planta.tipo.reflejo ? roles.ambiental : roles.marca), x + d.x, y + d.y);
        }
        ctxLuminosa.globalAlpha = 1;
        if (planta.muerta) continue;
        const atacada = enemigos.some((e) => !e.muerto && e.objetivo === planta);
        const bajoPuntero = hoverCelda && hoverCelda.x === planta.celda.x && hoverCelda.y === planta.celda.y;
        const mostrarVida = tactil ? atacada : bajoPuntero;
        if (mostrarVida) {
          const ancho = 10;
          const px = x + 3;
          const py = y + 15;
          const lleno = Math.max(0, Math.ceil(ancho * Math.max(0, planta.vida) / planta.vidaMax));
          const critica = planta.vida <= planta.vidaMax * FEEDBACK.critico;
          ctxLuminosa.fillStyle = rgb(roles.cuadricula);
          ctxLuminosa.fillRect(px, py, ancho, 1);
          if (lleno > 0) {
            ctxLuminosa.fillStyle = rgb(critica ? roles.marca : roles.energiaUI, 0.9);
            ctxLuminosa.fillRect(px, py, lleno, 1);
          }
        }
        gestoPlanta(planta, enemigos, t, reducido);
      }
      for (const enemigo of enemigos) {
        if (enemigo.muerto) {
          dibujarEnemigo(ctxLuminosa, enemigo, AUTOLUZ_ENEMIGO, reducido);
          continue;
        }
        dibujarContorno(ctxLuminosa, enemigo, reducido);
        dibujarEnemigo(ctxLuminosa, enemigo, AUTOLUZ_ENEMIGO, reducido);
        const posicion = posicionEnemigo(enemigo, reducido);
        gestoEnemigo(enemigo, reducido);
        dibujarDestello(ctxLuminosa, enemigo, posicion);
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
      for (const luz of luciernagas) {
        if (luz.brillo <= 0) continue;
        ctxLuminosa.fillStyle = rgb(roles.luciernaga, luz.brillo * 0.72);
        ctxLuminosa.fillRect(luz.x, luz.y, 1, 1);
      }
      if (alcance) dibujarAlcance(alcance, t, reducido);
      if (gesto) {
        const color = gesto.tipo === 'invalida' ? roles.petalo
          : gesto.tipo === 'plantada' ? roles.ambiental : roles.marca;
        esquinas(gesto.celda, color, reducido ? 0.8 : gesto.intensidad,
          reducido ? 0 : Math.floor((1 - gesto.intensidad) * 3));
      }
      if (pulsoCentro > 0 && central.opacidad > 0) {
        esquinas(central.celda, roles.marcaSuave, reducido ? 0.4 : pulsoCentro * 0.65,
          reducido ? 0 : Math.floor((1 - pulsoCentro) * 3));
      }
      if (vista) dibujarColocacion(vista, t, reducido);
      if (retiro) {
        for (const planta of plantas) {
          if (!planta.muerta && planta !== central) esquinas(planta.celda, roles.marcaSuave, 0.38);
        }
        if (retiro.celda) esquinas(retiro.celda, retiro.valido ? roles.energiaUI : roles.petalo, 0.85);
      }
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
      ctxSalida.globalCompositeOperation = 'source-over';
      ctxSalida.imageSmoothingEnabled = false;
      ctxSalida.drawImage(escena, 0, 0, lado, lado, 0, 0, B, B);
      ctxSalida.drawImage(iluminacion.canvas, 0, 0, lado, lado, 0, 0, B, B);
      ctxSalida.drawImage(luminosa, 0, 0, lado, lado, 0, 0, B, B);
    },
  };
}
