import { calcularEscala } from './escala.js';

const limitar = (valor, min, max) => Math.max(min, Math.min(max, valor));

export function crearCamara(lado, { centroMundo = null } = {}) {
  let area;
  let dpr;
  let base;
  let escala;
  let origen;

  const centro = () => ({ x: area.left + area.width / 2, y: area.top + area.height / 2 });
  const mundo = ({ x, y }) => ({ x: (x - origen.x) * dpr / escala, y: (y - origen.y) * dpr / escala });

  function encuadrar(nuevaEscala, ancla, punto) {
    escala = limitar(Math.round(nuevaEscala), base, 2 * base);
    if (centroMundo) {
      origen = {
        x: Math.round(punto.x * dpr - ancla.x * escala) / dpr,
        y: Math.round(punto.y * dpr - ancla.y * escala) / dpr,
      };
      return;
    }
    const ancho = lado * escala / dpr;
    const eje = (inicio, disponible, destino, coord) => ancho <= disponible
      ? inicio + (disponible - ancho) / 2
      : limitar(destino - coord * escala / dpr, inicio + disponible - ancho, inicio);
    origen = {
      x: eje(area.left, area.width, punto.x, ancla.x),
      y: eje(area.top, area.height, punto.y, ancla.y),
    };
  }

  return {
    ajustar(limites, densidad) {
      const aumento = base ? escala / base : 1;
      const ancla = area ? mundo(centro()) : (centroMundo ?? { x: lado / 2, y: lado / 2 });
      area = limites;
      dpr = densidad;
      base = centroMundo ? Math.max(1, Math.ceil(2 * dpr)) : calcularEscala({ anchoCss: area.width, altoCss: area.height, lado, dpr }).multiplo;
      encuadrar(base * aumento, ancla, centro());
    },
    vista: () => ({ origen, area, escala }),
    region() {
      const x = Math.floor((area.left - origen.x) * dpr / escala / 2) * 2;
      const y = Math.floor((area.top - origen.y) * dpr / escala / 2) * 2;
      const ancho = Math.ceil(area.width * dpr / escala) + 2;
      const alto = Math.ceil(area.height * dpr / escala) + 2;
      return { x, y, ancho, alto, left: origen.x + x * escala / dpr, top: origen.y + y * escala / dpr };
    },
    pantalla: ({ x, y }) => ({ x: origen.x + x * escala / dpr, y: origen.y + y * escala / dpr }),
    puedeArrastrar: () => Boolean(centroMundo) || escala > base,
    ampliada: () => escala > base,
    contiene: (x, y) => x >= area.left && x < area.left + area.width && y >= area.top && y < area.top + area.height,
    mundo,
    enfocar: encuadrar,
    zoom(pasos, punto = centro()) {
      encuadrar(escala + pasos, mundo(punto), punto);
    },
    restablecer() {
      encuadrar(base, (centroMundo ?? { x: lado / 2, y: lado / 2 }), centro());
    },
  };
}
