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
  cerbatana: { corta: 'Disparo', consejo: 'Dispara a los insectos cercanos.' },
  espino: { corta: 'Atracción', consejo: 'Atrae insectos y devuelve sus mordidas.' },
  campanilla: { corta: 'Freno', consejo: 'Frena a los insectos cercanos.' },
  hongo: { corta: 'Área', consejo: 'Daña a todos los insectos cercanos.' },
};

export function funcionDe(id) {
  return FUNCIONES[id];
}
