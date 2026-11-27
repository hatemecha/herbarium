import { PLANTAS } from './catalogo.js';

export function textoFicha(planta) {
  if (!planta || planta.muerta) return '';
  const vida = `${Math.max(0, Math.ceil(planta.vida))}/${planta.vidaMax}`;
  const ataque = planta.tipo.ataque ?? planta.tipo.area;
  const control = planta.tipo.ralentiza;
  if (control) return `${planta.tipo.nombre}  ${vida}  −${control.reduccion * 100}% velocidad  radio ${control.alcance}`;
  if (ataque) return `${planta.tipo.nombre}  ${vida}  daño ${ataque.dano}${planta.tipo.area ? ' en área' : ''} alcance ${ataque.alcance}  cada ${ataque.intervalo} s`;
  if (planta.tipo.reflejo) return `${planta.tipo.nombre}  ${vida}  refleja ${planta.tipo.reflejo}`;
  return `${planta.tipo.nombre}  ${vida}`;
}

export function funcionDe(id) {
  const tipo = PLANTAS[id];
  if (!tipo) return undefined;
  return { corta: tipo.funcion, consejo: tipo.descripcion };
}
