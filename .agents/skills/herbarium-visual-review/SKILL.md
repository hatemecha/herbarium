---
name: herbarium-visual-review
description: Auditar cambios gráficos de Herbarium antes de entregar. Detectar pixel art falso, antialiasing, escala fraccionaria, grillas incoherentes, AI slop, regresiones de UI, animaciones, contraste, paletas, legibilidad y responsive. Usar después de cualquier cambio visible, incluso una mecánica de juego.
---
# Herbarium · puerta de calidad visual

Leer las skills de arte, UI y movimiento según el cambio. Una revisión técnica no equivale a aprobación artística del propietario.

## Antes y después
- Registrar `git status`, commit base y cambios locales. No pisarlos. Capturar el estado anterior y el posterior en las mismas dimensiones, DPR, semilla, escena y tema. Reutilizar scripts de `scripts/visual-etapa082.py` u otros vigentes si existen; adaptarlos solo si hace falta. No sustituir el juego real por un mockup que pasa visualmente.
- Ver a escala real, luego ampliar nearest-neighbor para inspección. Para animación, observar una secuencia a velocidad normal y una hoja de contacto. Revisar reposo, selección, compra, estado especial, pausa/herbario y derrota según alcance. Un solo cuadro bonito no valida un combate.
- Probar desktop, móvil vertical pequeño, móvil vertical DPR3, horizontal DPR2 y DPR fraccionario. Comprobar foco, teclado, touch, cambios de tamaño y movimiento reducido. No declarar prueba física cuando fue emulada.

## Gate técnico
1. Fuente de sprites: tamaño exacto, filas, códigos válidos, parches en rango, roles existentes y alfa deliberado. Comparar con sprites actuales.
2. Fuente de cada componente: resolución lógica explícita, coordenadas enteras, sin escalado o rotación interpolada, sin texto estirado, origen físico alineado. Auditar CSS, DOM, canvas y DPR efectivos. `imageSmoothingEnabled=false` no valida fuentes, origen ni tamaño.
3. Para una superficie declarada pixel-perfect con escala física entera k, capturar en PNG a resolución física y verificar bloques de k×k del mismo color. Usar `scripts/comprobar_bloques.py` sobre recortes exactos de superficies (sin capas suaves aprobadas ni foco DOM). La prueba es necesaria para uniformidad de bloques, no suficiente para calidad ni para asegurar que la grilla de origen elegida sea correcta. No pasar con k=1 como prueba de ampliación. No tolerar porcentajes arbitrarios de píxeles erróneos. Si no se dispone de PNG físico, declarar qué se pudo medir.
4. Mantener tests de reglas y añadir tests de escalado, raster de fuentes y primitivas cuando se cambien. `npm test` no reemplaza revisión visual. Asegurar que la simulación no cambia por DPR, FPS, zoom, animación o pausa.
5. Accesibilidad: nombres, roles, foco, contraste, hitboxes y texto legible; no sacrificar esto para lograr una superficie bitmap.

## Gate artístico (rechazar si falla cualquiera relevante)
- ¿Se lee la silueta sin glow, sin nombre y a tamaño real?
- ¿Comparten perspectiva, escala, luz y lenguaje los organismos nuevos y existentes?
- ¿Hay una sola familia de densidad visual por superficie, y las transiciones respetan esa grilla?
- ¿Se puede eliminar un adorno, panel, frase o efecto sin perder función? Si sí, justificar su función estética o quitarlo.
- ¿La pantalla mantiene foco en el jardín y la energía? ¿O se parece a un dashboard, app genérica o plantilla de juego retro?
- ¿Cada animación tiene intención, ritmo y poses propias? ¿El estado se distingue sin depender solo del matiz?
- ¿Se conserva la personalidad minimalista con varias plantas y numerosos enemigos?
- ¿Se mantiene legibilidad en fondos oscuro e iluminado y otro tema?

## Informe de cierre
Indicar estado de cada criterio: aprobado técnicamente, requiere revisión artística o bloqueado. Adjuntar rutas a evidencia, resoluciones y DPR medidos, tests realmente corridos, excepciones autorizadas y defectos que siguen abiertos. No dar por aprobado el arte subjetivo sin el propietario. No avanzar de etapa ni añadir decoración para cubrir un defecto.
