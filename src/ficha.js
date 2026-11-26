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

const FUNCIONES = {
  central: { consejo: 'Genera energía. Si cae, termina la partida.' },
  cerbatana: { corta: 'Disparo', consejo: 'Un disparo por vez. Cubre caminos abiertos.' },
  espino: { corta: 'Escudo', consejo: 'Bloquea y devuelve mordidas. Delante de tus plantas.' },
  campanilla: { corta: 'Freno', consejo: 'Frena a los cercanos. Combínala con ataque.' },
  hongo: { corta: 'Área', consejo: 'Daño a todos los cercanos. Mejor contra grupos.' },
};

export function funcionDe(id) {
  return FUNCIONES[id];
}
