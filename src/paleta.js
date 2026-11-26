// Mismos nombres y valores que src/styles/paleta.ts de la web (nicotinalex).
// Si la web define las variables CSS (--bg, --brand...), el juego las lee y se adapta sin duplicar la paleta.
const BASE = {
  bg: '#0b0d11',
  panel: '#10141b',
  hover: '#141820',
  line: '#2a3140',
  muted: '#8b93a3',
  ink: '#e8eaef',
  'active-bg': '#d5dae3',
  'active-ink': '#10131a',
  brand: '#ff3b7a',
  spark: '#c2ff3d',
};

const MONO = '"MonoMEK", ui-monospace, "DejaVu Sans Mono", monospace';
const HEX = /^#([0-9a-f]{6})$/i;

function aRgb(valor) {
  const coincidencia = HEX.exec((valor ?? '').trim());
  if (!coincidencia) return null;
  const n = parseInt(coincidencia[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function asegurarVariables(raiz = document.documentElement) {
  const estilo = getComputedStyle(raiz);
  for (const [nombre, valor] of Object.entries(BASE)) {
    if (!estilo.getPropertyValue(`--${nombre}`).trim()) raiz.style.setProperty(`--${nombre}`, valor);
  }
  if (!estilo.getPropertyValue('--mono').trim()) raiz.style.setProperty('--mono', MONO);
}

export function leerPaleta(raiz = document.documentElement) {
  const estilo = getComputedStyle(raiz);
  return Object.fromEntries(
    Object.entries(BASE).map(([nombre, valor]) => [
      nombre,
      aRgb(estilo.getPropertyValue(`--${nombre}`)) ?? aRgb(valor),
    ]),
  );
}

const mezcla = (a, b, t) => a.map((valor, i) => Math.round(valor + (b[i] - valor) * t));

export function crearRoles(p) {
  return {
    fondo: p.bg,
    terreno: p.hover,
    cuadricula: mezcla(p.hover, p.line, 0.55),
    tierra: mezcla(p.bg, p.muted, 0.3),
    hojaSombra: mezcla(p.bg, p.spark, 0.2),
    hoja: mezcla(p.bg, p.spark, 0.42),
    hojaLuz: mezcla(p.bg, p.spark, 0.66),
    hojaBrillo: mezcla(p.bg, p.spark, 0.85),
    tallo: mezcla(p.bg, p.spark, 0.3),
    petaloSombra: mezcla(p.bg, p.brand, 0.55),
    petalo: p.brand,
    nucleo: mezcla(p.brand, p.ink, 0.45),
    nucleoBrillo: mezcla(p.ink, p.brand, 0.2),
    particula: mezcla(p.spark, p.ink, 0.35),
    resplandor: p.brand,
    ambiental: p.spark,
    marca: p.ink,
    marcaSuave: mezcla(p.hover, p.ink, 0.5),
    bulboSombra: mezcla(p.bg, p.spark, 0.42),
    bulbo: mezcla(p.bg, p.spark, 0.75),
    boca: mezcla(p.spark, p.ink, 0.5),
    bocaBrillo: mezcla(p.ink, p.spark, 0.3),
    caparazon: mezcla(p.bg, p.ink, 0.34),
    caparazonLuz: mezcla(p.bg, p.ink, 0.62),
    caparazonSombra: mezcla(p.bg, p.ink, 0.2),
    cabeza: mezcla(p.bg, p.ink, 0.14),
    ojo: p.brand,
    patas: mezcla(p.bg, p.muted, 0.8),
  };
}

export function rgb([r, g, b], alfa = 1) {
  return `rgba(${r}, ${g}, ${b}, ${alfa})`;
}
