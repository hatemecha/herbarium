---
name: herbarium-pixel-motion
description: Diseñar animaciones por frames y efectos pixel art de Herbarium, game feel, movimiento de sprites y UI, feedback, luz, partículas, transición, compra, impacto, ralentización, atracción, blindaje, pausa, derrota y futuros arcanos. Usar ante cualquier cambio animado o estado visual.
---
# Herbarium · movimiento y feedback

Leer `herbarium-pixel-art`, la dirección artística y `src/animacion.js`, `src/render.js`, `src/particulas.js`, `src/iluminacion.js`, entidades y configuración relevante. Para HUD y menús cargar `herbarium-pixel-ui`.

## Diseñar el gesto, no agregar un efecto
- Cada señal responde a un acontecimiento real o a un estado activo; nunca sugerir daño, protección, alcance o atracción inexistentes. Definir qué entiende el jugador, dónde mira y cuánto dura la señal.
- Reposo ambiental lento e irregular; interacción breve y precisa; combate local y expresivo; acontecimientos raros pueden tener más énfasis. No animar todos los componentes todo el tiempo. No inventar una frase, contador o partícula por cada evento.
- Para cada familia crear poses clave: reposo, anticipación si corresponde, acción, recuperación. Variar silueta, articulación y distribución de píxeles, no solamente alfa. No usar interpolación de escala/rotación ni deformación vectorial suavizada.
- Separar reloj lógico (60 Hz actual), reloj visual y FPS de poses. Las animaciones deben funcionar independientemente de FPS de pantalla; la cuantización de posiciones ocurre solo al dibujar. No limitar todo el render a 8 FPS ni modificar colisiones/cadencia para acomodar un frame. Desfasar reposos.

## Valores orientativos, no leyes de balance
| Familia | Cadencia inicial para explorar | Criterio |
| --- | --- | --- |
| Reposo vegetal | 2–5 poses/s o esperas irregulares | respiración, hojas y brotes, sin sincronía global |
| Vuelo | 12–20 poses/s | aleteo legible, altura y sombra coherentes |
| Interacción UI | 8–16 poses/s, 0,12–0,3 s | una respuesta corta; hitbox quieta |
| Impacto | 2–4 poses, 0,1–0,25 s | dirección y remate; sin flash a pantalla completa |
| Esporas | 6–12 poses/s, 0,3–0,75 s | expansión visible del radio efectivo |
| Resolución o derrota | 4–10 poses/s cuando aplique | conservar silencio, pausa y espacio negativo |

Ajustar a los fotogramas existentes; no alterar duraciones de mecánicas. Para pixel art, `steps()` en CSS puede servir para un gesto cuantizado, pero no arregla dimensiones ni posiciones fraccionarias.

## Gramática de combate
- Cerbatana: compresión breve del bulbo y expulsión direccional; conservar lectura del proyectil.
- Espino: gesto de atracción distinguible y localizado; al reflejar, fragmentos secos hacia el atacante. No dibujar escudo sobre vecinos si no existe.
- Campanilla: variación del ritmo y rastros discretos bajo el insecto realmente ralentizado; estado persistente y reconocible sin color. No dibujar anillo permanente sobre todo el jardín.
- Hongo: anticipación visual, contracción por pose, liberación radial de esporas; no confundir el dibujo con otro ataque.
- Escarabajo, pulgón y oruga: silueta, vuelo, aterrizaje, sobrevuelo y alimentación deben identificar conducta. Los golpes a coraza se diferencian por fragmentos y dirección. Las señales deben mantenerse legibles con grupos.

## Partículas y luz
Agrupar por función; preservar presupuestos, priorizar combate sobre ambiente, apagar efectos que no aporten. Origen y trayectoria coherentes; tamaños enteros; desenfoque no sustituye la animación. Luz, bruma y dithering en su capa lógica con límites de contraste. Evitar ruido que se arrastra cuadro a cuadro. Movimiento reducido: quitar desplazamientos decorativos, conservar información esencial mediante señales quietas; pausa y derrota respetan la semántica actual.

## Validación
Observar al menos una secuencia a velocidad normal (no solo una captura), y un contacto de todos los cuadros si se modifica un sprite. Comparar escenas de reposo, interacción y combate denso. Probar menor movimiento. Si no se pueden ver animaciones, declarar el bloqueo y no afirmar aprobación artística. Aplicar `herbarium-visual-review`.
