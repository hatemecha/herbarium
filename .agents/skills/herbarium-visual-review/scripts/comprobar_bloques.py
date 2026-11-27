#!/usr/bin/env python3
"""Comprueba uniformidad de bloques físicos en un recorte PNG de una capa raster.
Herramienta de desarrollo, no dependencia del juego. Requiere Pillow.
"""
import argparse
import sys


def comprobar(imagen, x, y, ancho, alto, escala):
    if escala < 2 or min(ancho, alto) < 1 or min(x, y) < 0:
        raise ValueError('Escala >= 2, origen no negativo y tamaño lógico positivo.')
    if x + ancho * escala > imagen.width or y + alto * escala > imagen.height:
        raise ValueError('El recorte queda fuera de la imagen física.')
    px = imagen.convert('RGBA').load()
    errores = 0
    ejemplos = []
    for j in range(alto):
        for i in range(ancho):
            bx, by = x + i * escala, y + j * escala
            base = px[bx, by]
            if any(px[bx + dx, by + dy] != base
                   for dy in range(escala) for dx in range(escala)):
                errores += 1
                if len(ejemplos) < 8:
                    ejemplos.append((i, j))
    return errores, ejemplos


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('png')
    p.add_argument('--origen', nargs=2, type=int, default=[0, 0], metavar=('X', 'Y'))
    p.add_argument('--logico', nargs=2, type=int, required=True, metavar=('ANCHO', 'ALTO'))
    p.add_argument('--escala', type=int, required=True)
    args = p.parse_args()
    try:
        from PIL import Image
        with Image.open(args.png) as im:
            if im.format != 'PNG':
                raise ValueError('Usar PNG sin pérdida.')
            errores, ejemplos = comprobar(im, *args.origen, *args.logico, args.escala)
    except (ImportError, OSError, ValueError) as e:
        print(f'No se pudo comprobar: {e}', file=sys.stderr)
        return 2
    total = args.logico[0] * args.logico[1]
    print(f'{total - errores}/{total} bloques uniformes; {errores} inconsistentes.')
    if errores:
        print(f'Primeros bloques lógicos inconsistentes: {ejemplos}')
    return int(bool(errores))


if __name__ == '__main__':
    sys.exit(main())
