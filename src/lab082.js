import { montarHerbario } from './juego.js';
const modos = ['pliego', 'horizonte', 'gabinete'];
const modo = new URLSearchParams(location.search).get('modo');
document.body.dataset.modo = modos.includes(modo) ? modo : modos[0];
montarHerbario(document.querySelector('#herbario'));
for (const boton of document.querySelectorAll('[data-modo]')) {
  boton.setAttribute('aria-pressed', String(boton.dataset.modo === document.body.dataset.modo));
  boton.addEventListener('click', () => {
    document.body.dataset.modo = boton.dataset.modo;
    for (const b of document.querySelectorAll('button[data-modo]')) b.setAttribute('aria-pressed', String(b === boton));
    window.dispatchEvent(new Event('resize'));
  });
}
