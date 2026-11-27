---
name: herbarium-pixel-ui
description: Diseñar e implementar interfaces pixel-perfect de Herbarium, HUD, menú de pausa, herbario, cartas, tooltips, tarot, diálogo, botones, iconos, tipografía bitmap, layout responsive, escalado Canvas y DPR. Obligatoria para cualquier interfaz visible nueva o modificada.
---
# Herbarium · interfaz dibujada en píxeles

Leer `AGENTS.md`, `docs/ART_DIRECTION.md`, `herbarium-pixel-art` y `references/contrato-render.md`. Inspeccionar `styles.css`, `src/juego.js`, `src/catalogoUI.js`, `src/pausa.js`, `src/escala.js` y los módulos pertinentes antes de tocar nada.

## Regla principal
Diseñar la forma en una resolución lógica baja y escalar el resultado rasterizado; no diseñar una app web a tamaño final y después agregar una fuente pixelada. HTML semántico conserva interacción, lectura, foco, teclado, selección y accesibilidad; su presentación gráfica no puede tener una segunda estética. No reemplazar todos los controles por un canvas inaccesible.

## Flujo
1. Enumerar solo información imprescindible y acción principal. HUD permanente: energía y acceso funcional discreto a pausa si ya existe; no sumar estadísticas, frases, enemigos pendientes, barras ni etiquetas sin pedido. Las descripciones de planta deben ser breves, funcionales y legibles (cerca del catálogo; sin moverlo). Datos detallados en herbario consultable. Mantener los flujos existentes de pausa y compra.
2. Bocetar a resolución lógica: definir píxel base de UI, tamaño de glifo, espaciados, borde y origen. Usar una familia de primitivas reutilizables (marco abierto/cerrado, relleno, indicador, icono, texto, foco); no crear una variante visual distinta para cada diálogo. Elegir por composición, no por cantidad de adornos.
3. Construir caras, esquinas, flechas, marcos y estrellas con píxeles enteros. Formas y escalones definidos por matrices o rectángulos enteros. Botones sin píldoras, blur, glassmorphism, sombras difusas, degradados de interfaz, iconos vectoriales, badges, bordes CSS fraccionarios, texturas de SaaS. Una excepción atmosférica no justifica una sombra en una carta.
4. Tipografía: conservar MonoMEK y su licencia. No asumir que fuente pixel + `image-rendering` equivale a texto bitmap. Rasterizar a resolución lógica validada (atlas de glifos o canvas lógico 1×, controlar cobertura de alfa en glifos si hace falta), después escalar por entero. Probar acentos, ñ, dígitos, signos, saltos de línea y métricas. No usar `fillText(maxWidth)` si comprime el texto; medir y rediseñar. No inventar una fuente genérica ni achicar a ilegibilidad. Texto largo accesible en DOM, con tratamiento consistente y excepción documentada si es necesario.
5. Escalado: elegir un entero de píxeles físicos por píxel lógico, ajustar tamaño CSS a backing store / DPR y alinear el origen al píxel físico. No escalar una bitmap ya ampliada ni aplicar transformaciones fraccionarias sobre una capa rasterizada. En móvil cambiar composición o área de UI antes de aceptar un tablero desigual. Preservar hitboxes de 44 CSS px o equivalentes accesibles; no confundirlos con el tamaño visual.
6. Estados: reposo, disponible, insuficiente, seleccionado, foco, pulsado, deshabilitado, pausa y derrota. Diferenciar con forma/posición/contraste además del color. Mantener área táctil y posición estables, foco visible y semántica de botones/diálogo. No añadir hover obligatorio.
7. Revisar todo en el juego real: 320×568, 390×844 DPR3, 844×390 DPR2, 1280×800 y al menos DPR fraccionario (p. ej. 1.25); probar texto largo, saldo grande, scroll del catálogo, zoom, teclado y movimiento reducido. Si no cabe, simplificar o reordenar; no deformar el píxel ni tapar el jardín.

## Próximas pantallas
El tarot y las preguntas deberán usar el mismo alfabeto visual: ilustración original a resolución lógica propia, tipografía validada, respuesta clara y animación por cuadros. Esta skill no autoriza implementarlos. Evitar el modal web disfrazado de carta.

Aplicar `herbarium-visual-review`. Si la tarea es puramente lógica, no introducir cambios visuales por iniciativa propia.
