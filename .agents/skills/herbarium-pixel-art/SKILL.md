---
name: herbarium-pixel-art
description: Dirección artística obligatoria de Herbarium. Usar al crear, editar o revisar sprites, iconos, ilustraciones, cartas, tarot, paletas, fondos, iluminación, píxeles o cualquier recurso visual del juego, incluso si la tarea principal es funcional.
---
# Herbarium · dirección de pixel art

## Antes de dibujar
1. Leer `AGENTS.md`, `docs/ART_DIRECTION.md`, `src/config.js`, `src/paleta.js` y los sprites vecinos. Si la documentación es antigua, reconciliar con el código y las preferencias explícitas del propietario; no convertir un defecto existente en norma.
2. Ver el juego actual y el recurso a tamaño nativo y a escala de uso. Usar `galeria.html` si existe. Para UI cargar también `herbarium-pixel-ui`; para movimiento, `herbarium-pixel-motion`.
3. Definir en una frase la función visual del recurso, su tamaño lógico, origen, perspectiva, jerarquía y roles cromáticos. No empezar por efectos.

## Contrato artístico
- El píxel lógico es la unidad de dibujo. El tablero actual tiene 11×11 casillas de 16×16, total 176×176; los sprites de organismos ocupan 16×16. No confundir casilla con píxel. Para UI usar su propia grilla lógica explícita, no una mezcla de densidades arbitrarias.
- Dibujar en matrices, bitmaps o primitivas rasterizadas sobre coordenadas enteras. El resultado debe ser nítido sin filtros, glow ni texturas. No usar SVG escalable, emojis, iconos de librería, imágenes reducidas automáticamente o componentes web ornamentados como sustitutos.
- El lenguaje visual es botánico, íntimo, oscuro, delicado, vivo. La central rosa es el foco; el verde energético y acentos de especies cumplen funciones. Respetar paleta semántica, adaptación al tema y MonoMEK. No agregar colores fijos al render sin una razón y autorización coherentes con la paleta.
- La oscuridad es espacio negativo. No llenar huecos con estrellas, marcos, microtexto, ornamentos procedurales, símbolos falsamente esotéricos ni ruido. Una forma limpia es preferible a cinco detalles.
- No imponer un aspecto retro genérico (CRT, scanlines, glitch, neón, bisel metálico). No copiar arte de referencias.

## Método de dibujo
1. Silueta primero: 2–3 alternativas realmente distintas si el recurso es nuevo o cuestionado. Verlas como masas de un color. El organismo debe distinguirse de los demás sin leer nombres ni depender del color.
2. Volumen: organizar grupos conectados de píxeles; establecer sombra, tono medio y luz principal. Seguir la perspectiva lateral/3⁄4 de los organismos; estudiar postura y anatomía de la referencia. Evitar contorno sombreado hacia adentro (pillow shading), líneas paralelas que forman bandas, ruido de píxeles sueltos y escalones irregulares sin intención.
3. Color: usar rampas cortas y valores suficientemente separados. Un reflejo aislado puede ser intencional; no usar dithering o más colores para disimular una forma débil. Comprobar fondo oscuro e iluminado y al menos otro tema. Dithering del terreno no implica dithering en cada sprite.
4. Detalle al final: eliminar todo píxel que no contribuya a silueta, material, gesto o lectura. Comprobar escala 1× y escala real; ampliar con nearest-neighbor solo para inspeccionar.
5. Integrar con el sistema vigente de `src/sprites/dibujo.js` (matriz, códigos, variantes) y roles de `src/paleta.js`. Validar tamaño exacto, códigos válidos, marcos y transparencia; si una herramienta externa genera bocetos, redibujar/limpiar píxel a píxel antes de aceptar. Sin dependencias nuevas de runtime.

## Entrega
Mostrar el recurso al lado de organismos actuales, sobre fondo real, en contexto. Si hace falta proponer alternativas, dejar una integración concreta para revisar sin reemplazar trabajo aprobado. No afirmar que un sprite es bello porque cumple dimensiones o pasa tests. Aplicar `herbarium-visual-review` antes de cerrar.

Referencias externas opcionales: `references/lecturas.md`. Los criterios del proyecto tienen prioridad.
