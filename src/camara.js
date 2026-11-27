import { calcularEscala } from './escala.js';

const limitar = (valor, min, max) => Math.max(min, Math.min(max, valor));

export function crearCamara(lado) {
  let area;
  let dpr;
  let base;
  let escala;
  let origen;

  const centro = () => ({ x: area.left + area.width / 2, y: area.top + area.height / 2 });
  const mundo = ({ x, y }) => ({ x: (x - origen.x) * dpr / escala, y: (y - origen.y) * dpr / escala });

  function encuadrar(nuevaEscala, ancla, punto) {
    escala = limitar(Math.round(nuevaEscala), base, 2 * base);
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
      const ancla = area ? mundo(centro()) : { x: lado / 2, y: lado / 2 };
      area = limites;
      dpr = densidad;
      base = calcularEscala({ anchoCss: area.width, altoCss: area.height, lado, dpr }).multiplo;
      encuadrar(base * aumento, ancla, centro());
    },
    vista: () => ({ origen, area, escala }),
    ampliada: () => escala > base,
    contiene: (x, y) => x >= area.left && x < area.left + area.width && y >= area.top && y < area.top + area.height,
    mundo,
    enfocar: encuadrar,
    zoom(pasos, punto = centro()) {
      encuadrar(escala + pasos, mundo(punto), punto);
    },
    restablecer() {
      encuadrar(base, { x: lado / 2, y: lado / 2 }, centro());
    },
  };
}
