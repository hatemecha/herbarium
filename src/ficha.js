import { PLANTAS } from './catalogo.js';

export function textoFicha(planta, ataque = planta?.tipo.ataque ?? planta?.tipo.area) {
  if (!planta || planta.muerta) return '';
  const salud = Math.max(0, Math.min(planta.vidaMax, Math.ceil(planta.vida)));
  const vida = `${Number(salud.toFixed(2))}/${Number(planta.vidaMax.toFixed(2))}`;
  const control = planta.tipo.ralentiza;
  if (control) return `${planta.tipo.nombre}  ${vida}  −${control.reduccion * 100}% velocidad  radio ${control.alcance}`;
  if (ataque) return `${planta.tipo.nombre}  ${vida}  daño ${Number(ataque.dano.toFixed(2))}${planta.tipo.area ? ' en área' : ''} alcance ${ataque.alcance}  cada ${Number(ataque.intervalo.toFixed(2))} s`;
  if (planta.tipo.reflejo) return `${planta.tipo.nombre}  ${vida}  refleja ${planta.tipo.reflejo}`;
  return `${planta.tipo.nombre}  ${vida}`;
}

export function funcionDe(id) {
  const tipo = PLANTAS[id];
  if (!tipo) return undefined;
  return { corta: tipo.funcion, consejo: tipo.descripcion };
}
