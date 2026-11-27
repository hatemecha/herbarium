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

function aHsl([r, g, b]) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  let h;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

function deHsl(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r, g, b].map((v) => Math.round((v + m) * 255));
}

// Centro del mayor hueco de matiz entre dos colores activos. Un insecto ahí no se confunde con ninguno.
function centroDelHuecoLibre(a, b) {
  const [menor, mayor] = [a, b].sort((x, y) => x - y);
  if (mayor - menor >= menor + 360 - mayor) return (menor + mayor) / 2;
  return ((menor + mayor + 360) / 2) % 360;
}

// Los insectos no tienen hex propios. Su matiz base sale del hueco libre entre la marca y la chispa:
// el caparazón va 50° hacia el violeta y el brillo irisado queda en el matiz base. Si la marca cambia,
// la familia se recoloca sola y no cae sobre la chispa.
function rolesInsecto(p) {
  const base = centroDelHuecoLibre(aHsl(p.brand)[0], aHsl(p.spark)[0]);
  const violeta = (base + 50) % 360;
  const azul = base;
  const color = (h, s, l) => deHsl(h, s / 100, l / 100);
  return {
    campanaSombra: color(azul, 46, 21),
    campana: color((azul + 330) % 360, 64, 56),
    campanaLuz: mezcla(p.ink, color(azul, 75, 63), 0.45),
    hongoSombra: mezcla(p.bg, p.brand, 0.33),
    hongo: mezcla(p.brand, p.spark, 0.28),
    hongoLuz: mezcla(p.ink, p.brand, 0.25),
    insectoSombra: color(violeta, 40, 9),
    insecto: color(violeta, 38, 24),
    insectoLuz: color(violeta, 44, 38),
    insectoIris: color((base + 25) % 360, 46, 32),
    insectoBrillo: color(azul, 70, 64),
    insectoImpacto: mezcla(p.ink, color(azul, 70, 64), 0.2),
    insectoReflejo: mezcla(p.brand, p.ink, 0.35),
    pulgon: color(azul, 52, 33),
    pulgonLuz: color(azul, 60, 55),
    oruga: color((base + 70) % 360, 38, 32),
    orugaLuz: color((base + 70) % 360, 50, 52),
    orugaBrillo: color((base + 70) % 360, 59, 68),
    ala: color(azul, 40, 24),
    alaBorde: color(azul, 50, 44),
    antena: color(violeta, 30, 58),
    patas: color(violeta, 20, 46),
    cabeza: color(violeta, 36, 30),
    ojo: color(azul, 60, 86),
  };
}

export function crearRoles(p) {
  return {
    ...rolesInsecto(p),
    tintaUI: p.ink,
    energiaUI: p.spark,
    fondo: p.bg,
    terreno: p.hover,
    cuadricula: mezcla(p.hover, p.line, 0.55),
    tierra: mezcla(p.bg, p.muted, 0.3),
    hojaSombra: mezcla(p.bg, p.spark, 0.2),
    hoja: mezcla(p.bg, p.spark, 0.42),
    hojaLuz: mezcla(p.bg, p.spark, 0.66),
    hojaBrillo: mezcla(p.bg, p.spark, 0.85),
    tallo: mezcla(p.bg, p.spark, 0.3),
    maderaSombra: deHsl(28, 0.42, 0.16),
    madera: deHsl(30, 0.48, 0.28),
    maderaLuz: deHsl(34, 0.46, 0.42),
    petaloSombra: mezcla(p.bg, p.brand, 0.55),
    petalo: p.brand,
    nucleo: mezcla(p.brand, p.ink, 0.45),
    nucleoBrillo: mezcla(p.ink, p.brand, 0.2),
    luciernaga: mezcla([245, 196, 75], p.ink, 0.18),
    particula: mezcla(p.spark, p.ink, 0.35),
    resplandor: p.brand,
    ambiental: p.spark,
    marca: p.ink,
    marcaSuave: mezcla(p.hover, p.ink, 0.5),
    bulboSombra: mezcla(p.bg, p.spark, 0.42),
    bulbo: mezcla(p.bg, p.spark, 0.75),
    boca: mezcla(p.spark, p.ink, 0.5),
    bocaBrillo: mezcla(p.ink, p.spark, 0.3),
  };
}

export function rgb([r, g, b], alfa = 1) {
  return `rgba(${r}, ${g}, ${b}, ${alfa})`;
}
