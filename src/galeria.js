import { ENEMIGOS, PLANTAS } from './catalogo.js';
import { asegurarVariables, crearRoles, leerPaleta } from './paleta.js';
import { construirFotogramas } from './sprites/dibujo.js';

asegurarVariables();
const roles = crearRoles(leerPaleta());
const lienzo = document.querySelector('#galeria');
const ctx = lienzo.getContext('2d');
const piezas = [PLANTAS.central, PLANTAS.cerbatana, PLANTAS.espino, ...Object.values(ENEMIGOS)];
const frames = Object.fromEntries(piezas.map((tipo) => [tipo.id, construirFotogramas(tipo.arte, roles)]));
const maximo = 4;
const escala = 4;
const columna = 16 * escala + 8;
const fila = 16 + 6 + 16 * escala + 16;
lienzo.width = 8 + maximo * columna;
lienzo.height = 8 + piezas.length * fila;
lienzo.style.width = `${lienzo.width * 2}px`;
lienzo.style.height = `${lienzo.height * 2}px`;
ctx.imageSmoothingEnabled = false;

piezas.forEach((tipo, indice) => {
  const variantes = frames[tipo.id][0].slice(0, maximo);
  const y = 8 + indice * fila;
  variantes.forEach((frame, variante) => {
    const x = 8 + variante * columna;
    ctx.drawImage(frame, x, y);
    ctx.drawImage(frame, x, y + 22, 16 * escala, 16 * escala);
  });
});
