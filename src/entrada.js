// El hover no existe en un dedo. El toque usa el mismo pulsar que el puntero fino.
export const punteroFino = (evento) => evento.pointerType !== 'touch';
