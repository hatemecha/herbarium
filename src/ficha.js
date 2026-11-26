export function textoFicha(planta) {
  if (!planta || planta.muerta) return '';
  const vida = `${Math.max(0, Math.ceil(planta.vida))}/${planta.vidaMax}`;
  const ataque = planta.tipo.ataque;
  if (ataque) return `${planta.tipo.nombre}  ${vida}  daño ${ataque.dano}  alcance ${ataque.alcance}`;
  if (planta.tipo.reflejo) return `${planta.tipo.nombre}  ${vida}  refleja ${planta.tipo.reflejo}`;
  return `${planta.tipo.nombre}  ${vida}`;
}
