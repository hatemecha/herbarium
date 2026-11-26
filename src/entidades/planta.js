import { crearAnimacion } from '../animacion.js';

const VARIANTE_DISPARO = 3;

export function crearPlanta({ tablero, celda, tipo, frames, desfase = 0 }) {
  const origen = tablero.origen(celda.x, celda.y);
  const planta = {
    id: tipo.id,
    tipo,
    celda,
    origen,
    nucleo: { x: origen.x + tipo.arte.nucleo.x, y: origen.y + tipo.arte.nucleo.y },
    vida: tipo.vida ?? 0,
    vidaMax: tipo.vida ?? 0,
    direccion: 0,
    enfriamiento: 0,
    muerta: false,
    tiempoMuerte: 0,
    opacidad: 1,
    destello: 0,
    disparo: 0,
    retroceso: 0,
    retrocesoDir: { x: 0, y: 0 },
    fuente: null,
    animacion: crearAnimacion({ secuencia: tipo.arte.secuencia, desfase }),

    fotograma() {
      const variante = this.disparo > 0 ? VARIANTE_DISPARO : this.animacion.variante();
      return frames[this.direccion][variante];
    },

    desplazamiento() {
      if (this.retroceso <= 0) return { x: 0, y: 0 };
      return { x: Math.round(-this.retrocesoDir.x), y: Math.round(-this.retrocesoDir.y) };
    },

    actualizar(dt, reducido) {
      this.animacion.actualizar(dt, reducido);
      this.destello = Math.max(0, this.destello - dt);
      this.disparo = Math.max(0, this.disparo - dt);
      this.retroceso = Math.max(0, this.retroceso - dt);
    },

    disparar(ux, uy, duracion, retroceso) {
      this.disparo = duracion;
      this.retroceso = retroceso;
      this.retrocesoDir = { x: ux, y: uy };
    },
  };

  tablero.ocupar(celda.x, celda.y, planta);
  return planta;
}
