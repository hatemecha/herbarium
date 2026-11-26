# Dirección de arte

La pieza de referencia es el juego que ya corre, no un pixel art genérico. Identidad heredada de `nicotinalex-web`: monocromo oscuro, línea de 1 px, plano, acentos solo en la marca (`brand`) y la chispa (`spark`).

Captura del estado inicial real (`npm start`, Chromium, energía en 10, cerbatana ya comprable):

![Jardín inicial: planta central, energía y tarjeta de la cerbatana](capturas/jardin.png)

No incluye combate. El escarabajo todavía no había aparecido.

## Escena

Un organismo chico en mucha oscuridad. El tablero lógico mide 11×11 casillas de 16 px: 176×176. El sprite cabe en una casilla. Esos dos 16 están separados a propósito (`TABLERO.celda` y `SPRITE.lado` en `src/config.js`) y hoy coinciden.

La cámara no se mueve. La grilla lógica (casillas) y la grilla de píxeles (el canvas de 176) son distintas. El enemigo y el proyectil se mueven en continuo y se dibujan con `Math.round`, sin quedar trabados a la casilla.

## Escalado

`src/escala.js`. Se elige un entero de ampliación cuando el tablero ocupa al menos el 80 % del lado disponible en píxeles físicos (`ESCALA.aprovechamientoMinimo`). Si no, se usa el lado físico disponible. `devicePixelRatio` entra en ese cálculo. El canvas de salida desactiva el suavizado al copiar la escena, la oscuridad y la capa luminosa. El CSS del tablero y de las tarjetas usa `image-rendering: pixelated`.

El resplandor radial se dibuja después, con suavizado activado, en la resolución de salida. Es glow, no el sprite. No rotar ni escalar un sprite con interpolación para “apuntar”: la cerbatana tiene ocho dibujos y el escarabajo se espeja.

## Paleta

`src/paleta.js` repite las claves y los hex de `nicotinalex-web/src/styles/paleta.ts`:

| Clave | Hex |
| --- | --- |
| bg | `#0b0d11` |
| panel | `#10141b` |
| hover | `#141820` |
| line | `#2a3140` |
| muted | `#8b93a3` |
| ink | `#e8eaef` |
| active-bg | `#d5dae3` |
| active-ink | `#10131a` |
| brand | `#ff3b7a` |
| spark | `#c2ff3d` |

Si el documento ya define `--bg`, `--brand`, etc., el juego los lee. Si no, los escribe. No hay `hue-rotate`. Los roles salen de mezclas entre esos colores (`mezcla` en `crearRoles`).

Roles en uso: `fondo`, `terreno`, `cuadricula`, `tierra`, `hojaSombra`, `hoja`, `hojaLuz`, `hojaBrillo`, `tallo`, `petaloSombra`, `petalo`, `nucleo`, `nucleoBrillo`, `particula`, `resplandor`, `ambiental`, `marca`, `marcaSuave`, `bulboSombra`, `bulbo`, `boca`, `bocaBrillo`, `caparazon`, `caparazonLuz`, `caparazonSombra`, `cabeza`, `ojo`, `patas`.

Un sprite nuevo mapea caracteres a estos roles, o añade un rol en `crearRoles` a partir de la misma base. No hardcodear un hex en el render.

## Tipografía

MonoMEK Text 1.204, © 2023 Michael Alexander (MEK.txt), dedicada al dominio público con CC0 1.0. Archivos: `assets/fonts/MonoMEK-Text.otf` y `assets/fonts/MonoMEK-LICENSE.txt`. Enlace del autor en los metadatos de la fuente: <https://linktr.ee/michaelmicasso>.

`styles.css` declara `@font-face` con `font-display: block`. El cuerpo de la interfaz usa 12 px, que en MonoMEK cae en su cuadrícula (el em interno es 15). La pila es `"MonoMEK", ui-monospace, "DejaVu Sans Mono", monospace`, inyectada como `--mono` solo si el documento todavía no tiene esa variable. En la web de referencia `--mono` existe y no nombra a MonoMEK: al embeber el juego hay que decidir cuál gana.

## Sprites

Dibujados a mano como matrices de 16 caracteres. `.` es transparente. `src/sprites/dibujo.js` los convierte en canvas de 16×16 ya coloreados: `frames[id][direccion][variante]`.

| Pieza | Archivo | Direcciones | Notas |
| --- | --- | --- | --- |
| Planta central | `src/sprites/planta.js` | 1 | Pétalos, núcleo, hojas, tallo, tierra. Idle irregular. |
| Cerbatana | `src/sprites/cerbatana.js` | 8 | Bulbo y boca dibujados para N, NE, E, SE y S; el resto es espejo. No es una copia de otra torre. |
| Escarabajo | `src/sprites/escarabajo.js` | 1, espejo izquierda/derecha | Caparazón, patas, antenas, ojos. Se mueve en píxeles, centrado en su posición. |

La variante de disparo de la cerbatana es el índice 3 (`VARIANTE_DISPARO` en `src/entidades/planta.js`): la usa el disparo, no el ciclo idle. El retroceso es un desplazamiento de como mucho 1 px, redondeado, en contra del tiro (`BALANCE.visual.retroceso` = 0,12 s).

Para un sprite nuevo: misma matriz, mismos roles, variantes por parches de pocos píxeles, secuencia con duraciones en segundos en el módulo del sprite, registro en `src/catalogo.js`. Estudiar los tres que ya existen antes de inventar otro trazo.

## Animación

`src/animacion.js`. Cada tipo trae `SECUENCIA`: `{ fotograma, duracion }` en segundos. El desfase inicial evita que todas respiren juntas. Con `prefers-reduced-motion: reduce` el índice vuelve al fotograma 0 y no avanza.

La central no usa un compás regular (duraciones entre 0,6 y 1,8 s). El escarabajo alterna patas y antenas en pasos de 0,14 s.

## Oscuridad, luz y partículas

La oscuridad es composición. `src/iluminacion.js` guarda una transmisión por píxel lógico. La central se recalcula cada frame (núcleo, brillo, ambiente, seno de 5θ, pulso, impulso). Cada planta con `luz` aporta un mapa estático que se combina con `t *= 1 - factor * (1 - valor)`. `factor` sigue la opacidad, así la luz se apaga con la marchitez. Seis niveles de Bayer 4×4 (`LUZ.niveles`). Sin shaders ni raycasting.

Encima, `src/render.js` vuelve a dibujar los sprites en una capa luminosa multiplicados por `propia` (central 0,55, cerbatana 0,5, escarabajo 0,35). El destello de daño es esa misma capa en modo `lighter`, 0,2 s. El glow ancho (gradiente de la central, resplandor de la cerbatana, halo de la casilla marcada) va al final, en la resolución de pantalla, y no debe comerse el tablero.

Partículas en `src/particulas.js`: tope 12, 1 o 2 px, alineadas a la grilla, deriva lenta, se desvanecen. El ambiente nace junto al núcleo. El combate añade ráfagas cortas (impacto y muerte de planta 3, mordida 2, disparo 1, latido de energía 2). Con movimiento reducido no hay ráfaga al ganar energía ni emisión ambiente; las ráfagas de combate sí se piden igual. La grilla no se apaga.

Muerte del escarabajo: `destination-out` píxel a píxel durante 0,7 s (`BALANCE.visual.desintegracion`). Muerte de planta: la opacidad baja en 1,2 s (`marchitez`) y entonces se quita la fuente de luz. Esos tiempos viven en config; este documento no los duplica como mandamiento.

## Interfaz

Integrada y chica. Energía arriba: un punto de 4 px, la palabra y el entero, en `styles.css`. Tarjeta de 96×44 px lógicos, borde de 1 px, sprite animado, nombre y coste (`src/catalogoUI.js`). Seleccionada invierte tinta y fondo. Insuficiente baja la alfa a 0,4. El foco visible es un outline discontinuo. Nada de esquinas redondeadas, cromado, CRT ni iconos.

El aviso de derrota es una frase y un botón de texto subrayado: “el jardín cayó” / “reiniciar”. Sin menú.

## Marcado

`src/marcadores.js` y `MARCADORES` / `COLOCACION` en `src/config.js`.

- Hover y selección: hormigas de 1 px sobre el borde de la casilla (2 px encendidos, 2 apagados, avance con `MARCADORES.velocidad`) más un halo muy bajo.
- En colocación, el hover de selección no se dibuja. Las casillas válidas llevan hormigas tenues. Bajo el puntero fino, el sprite se ve translúcido (más opaco si la casilla es válida).
- Con movimiento reducido las hormigas se quedan quietas.

## Responsive y movimiento reducido

`styles.css`: `100dvh`, safe areas, `touch-action: none` solo en el canvas, sin selección de texto ni callout táctil en el tablero. El catálogo va abajo en vertical; a un lado en horizontal bajo o en escritorio ancho. `--escala-carta` pasa de 2 a 1 cuando hay poca altura. El botón de reinicio reserva 2,75 rem de alto.

`prefers-reduced-motion` (leído en cada paso, no solo al cargar): idle en el primer fotograma, luz sin pulso ni ondulación, hormigas quietas, sin partículas de ambiente ni ráfaga al sumar energía. El combate sigue. La grilla sigue.

## Al añadir un efecto

Que se entienda a 16 px. Pocos píxeles que cambian, no una nube. Si necesita blur, va en la capa de resplandor, con alfa baja y un color de rol (`resplandor`, `ambiental`, `boca`, `particula`). Probar al menos una paleta distinta de la base, porque los roles se mezclan: un sprite que solo se lee con el rosa y el verde de fábrica está mal construido.
