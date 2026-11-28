const UMBRAL = 8;
const PASO_RUEDA = 80;

const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const puntoDe = (e) => ({ x: e.clientX, y: e.clientY });
const medio = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

export function crearGestos({ campo, canvas, catalogo, camara, habilitado, alMoverVista,
  alTocar, alSobrevolar, alArrastrar, alMoverSemilla, alSoltar, alCancelarSemilla }) {
  const punteros = new Map();
  const eventos = new AbortController();
  const escuchar = (elemento, tipo, funcion, opciones) =>
    elemento.addEventListener(tipo, funcion, { signal: eventos.signal, ...opciones });
  let gesto = null;
  let omitirClic = false;
  let rueda = 0;

  function cancelar() {
    if (gesto?.modo === 'semilla') alCancelarSemilla();
    gesto = null;
    for (const [id, puntero] of punteros) {
      if (puntero.elemento.hasPointerCapture(id)) puntero.elemento.releasePointerCapture(id);
    }
    punteros.clear();
    rueda = 0;
  }

  function alBajar(e) {
    const carta = e.target.closest?.('.carta');
    const tablero = e.target === canvas && camara.contiene(e.clientX, e.clientY);
    if (e.button !== 0 || !habilitado() || (!tablero && (!carta || carta.disabled))) return;
    if (!punteros.size) omitirClic = false;
    // Nunca se incorpora un segundo botón o un puntero de otro tipo al gesto actual.
    if (punteros.size && (e.pointerType !== 'touch' || gesto?.tipo !== 'touch')) return;
    const elemento = tablero ? canvas : carta;
    const punto = puntoDe(e);
    elemento.setPointerCapture(e.pointerId);
    punteros.set(e.pointerId, { elemento, punto });

    if (punteros.size === 1) {
      if (tablero && e.pointerType !== 'touch') canvas.focus({ preventScroll: true });
      gesto = { modo: 'pendiente', id: e.pointerId, tipo: e.pointerType, inicio: punto, carta };
      return;
    }
    if (punteros.size !== 2) return;
    if (gesto?.modo === 'semilla') alCancelarSemilla();
    if (gesto?.carta || carta) omitirClic = true;
    const [a, b] = [...punteros.values()].map(({ punto }) => punto);
    const centro = medio(a, b);
    gesto = { modo: 'pellizco', tipo: 'touch', ids: [...punteros.keys()], ancla: camara.mundo(centro),
      distancia: Math.max(1, distancia(a, b)), escala: camara.vista().escala };
  }

  function alMover(e) {
    const puntero = punteros.get(e.pointerId);
    if (!puntero) {
      if (!punteros.size && e.target === canvas && habilitado()) alSobrevolar(e);
      return;
    }
    if (!gesto || !habilitado()) return;
    const punto = puntoDe(e);
    puntero.punto = punto;
    if (gesto.modo === 'pellizco') {
      const [a, b] = gesto.ids.map((id) => punteros.get(id).punto);
      camara.enfocar(gesto.escala * distancia(a, b) / gesto.distancia, gesto.ancla, medio(a, b));
      alMoverVista();
      return;
    }
    if (gesto.id !== e.pointerId) return;
    if (gesto.modo === 'pendiente' && distancia(punto, gesto.inicio) >= UMBRAL) {
      if (gesto.carta) {
        omitirClic = true;
        gesto.modo = alArrastrar(gesto.carta.dataset.tipo) ? 'semilla' : 'agotado';
      } else if (camara.puedeArrastrar()) {
        gesto.ancla = camara.mundo(gesto.inicio);
        gesto.modo = 'desplazar';
      } else gesto.modo = 'agotado';
    }
    if (gesto.modo === 'desplazar') {
      camara.enfocar(camara.vista().escala, gesto.ancla, punto);
      alMoverVista();
    } else if (gesto.modo === 'semilla') alMoverSemilla(e);
  }

  function terminar(e, confirmado) {
    if (!punteros.delete(e.pointerId)) return;
    if (gesto?.modo === 'pellizco') {
      if (gesto.ids.includes(e.pointerId)) gesto = null;
      return;
    }
    if (gesto?.id !== e.pointerId) return;
    const { modo, carta } = gesto;
    gesto = null;
    if (modo === 'semilla') {
      if (confirmado && habilitado()) alSoltar(e);
      else alCancelarSemilla();
    } else if (modo === 'pendiente' && !carta && confirmado && habilitado()) alTocar(e);
  }

  escuchar(campo, 'pointerdown', alBajar);
  escuchar(campo, 'pointermove', alMover);
  escuchar(campo, 'pointerup', (e) => terminar(e, true));
  escuchar(campo, 'pointercancel', (e) => terminar(e, false));
  escuchar(campo, 'lostpointercapture', (e) => terminar(e, false));
  escuchar(catalogo, 'click', (e) => {
    if (!omitirClic || e.detail === 0) return;
    omitirClic = false;
    e.preventDefault();
    e.stopImmediatePropagation();
  }, { capture: true });
  escuchar(canvas, 'wheel', (e) => {
    if (!habilitado() || punteros.size || e.ctrlKey || e.metaKey || !e.deltaY) return;
    e.preventDefault();
    const dpr = window.devicePixelRatio || 1;
    const unidad = e.deltaMode === 1 ? PASO_RUEDA : e.deltaMode === 2 ? camara.vista().area.height * dpr : dpr;
    const delta = e.deltaY * unidad;
    if (Math.sign(rueda) !== Math.sign(delta)) rueda = 0;
    rueda += delta;
    const pasos = Math.trunc(rueda / PASO_RUEDA);
    if (!pasos) return;
    rueda -= pasos * PASO_RUEDA;
    camara.zoom(-pasos, puntoDe(e));
    alMoverVista();
  }, { passive: false });
  escuchar(canvas, 'keydown', (e) => {
    if (!habilitado() || punteros.size || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === '0') camara.restablecer();
    else if (e.key === '+' || e.key === '=') camara.zoom(1);
    else if (e.key === '-' || e.key === '−') camara.zoom(-1);
    else return;
    e.preventDefault();
    alMoverVista();
  });
  escuchar(document, 'keydown', (e) => { if (e.key === 'Escape') cancelar(); });
  escuchar(window, 'blur', cancelar);
  return { cancelar, destruir() { cancelar(); eventos.abort(); } };
}
