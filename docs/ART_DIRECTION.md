# Dirección de arte

La pieza de referencia es el juego que ya corre, no un pixel art genérico. Identidad heredada de `nicotinalex-web`: monocromo oscuro, línea de 1 px, plano, acentos solo en la marca (`brand`) y la chispa (`spark`).

Captura del estado inicial real (`npm start`, Chromium, energía en 10, cerbatana ya comprable):

![Jardín inicial: planta central, energía y tarjeta de la cerbatana](capturas/jardin.png)

No incluye combate. El escarabajo todavía no había aparecido.

Capturas del combate real (partida reproducible con reloj falso y semilla fija, dpr 3):

| Momento | Archivo |
| --- | --- |
| Escarabajo en vuelo bajo, a 22,5 s | [escarabajo-vuelo.png](capturas/escarabajo-vuelo.png) |
| Impacto del proyectil de la cerbatana, a 24,5 s | [escarabajo-combate.png](capturas/escarabajo-combate.png) |
| Alimentación sobre la central, sin defensa, a 40 s | [escarabajo-alimentacion.png](capturas/escarabajo-alimentacion.png) |
| Derrota: la central marchita, aviso y reinicio | [derrota.png](capturas/derrota.png) |
| Cuadros del escarabajo a 6× junto a la central y la cerbatana | [escarabajo-cuadros.png](capturas/escarabajo-cuadros.png) |
| Galería de la etapa 06, escala 1 y 4 | [galeria.png](capturas/galeria.png), [galeria-insectos.png](capturas/galeria-insectos.png) |

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

Roles en uso: `fondo`, `terreno`, `cuadricula`, `tierra`, `hojaSombra`, `hoja`, `hojaLuz`, `hojaBrillo`, `tallo`, `petaloSombra`, `petalo`, `nucleo`, `nucleoBrillo`, `particula`, `resplandor`, `ambiental`, `marca`, `marcaSuave`, `bulboSombra`, `bulbo`, `boca`, `bocaBrillo`, y los de insecto de la sección siguiente.

### Familia de insectos

Los insectos tienen roles propios, no mezclas de la marca ni del fondo. Se derivan en `rolesInsecto` (`src/paleta.js`) a partir de los colores activos, sin hex nuevos:

- El **matiz base** es el centro del mayor hueco de matiz entre la marca y la chispa. Con la paleta base cae en un azul-verdoso (≈ 210°). Ese punto está a más de 90° de ambos colores activos, así que el insecto no se confunde con las plantas.
- El **caparazón** va 50° hacia el violeta (≈ 260°). El azul del brillo y de las alas queda en el matiz base.
- El **reflejo cálido** es la marca mezclada con la tinta al 35 %. Aparece en uno o dos píxeles, nunca como contorno.
- Con otra marca, la familia se recoloca. Probado con marca azul y chispa ámbar: el insecto pasa a verde azulado, sigue separado de ambos colores y mantiene el contraste.

| Rol | Uso | Luminosidad relativa |
| --- | --- | --- |
| `insectoSombra` | contorno y vientre | la más oscura, apenas sobre el fondo |
| `insecto` | caparazón | medios tonos |
| `insectoLuz` | dorso iluminado | la más clara del caparazón |
| `insectoBrillo` | reflejo irisado azul | más clara que el caparazón |
| `insectoImpacto` | destello de daño | tinta con un tinte del brillo del insecto |
| `insectoReflejo` | punto cálido | marca + tinta |
| `cabeza` | cabeza, algo más oscura que el caparazón | |
| `ojo` | un píxel de brillo | la más clara del insecto |
| `antena`, `patas` | apéndices | medios tonos claros |
| `ala`, `alaBorde` | membrana y nervio | `ala` oscura, `alaBorde` ~ medio |

El test `tests/insecto.test.mjs` fija el orden de luminosidad y la distancia de matiz con la chispa y la marca.

Un sprite nuevo mapea caracteres a estos roles, o añade un rol en `crearRoles` a partir de la misma base. No hardcodear un hex en el render.

## Tipografía

MonoMEK Text 1.204, © 2023 Michael Alexander (MEK.txt), dedicada al dominio público con CC0 1.0. Archivos: `assets/fonts/MonoMEK-Text.otf` y `assets/fonts/MonoMEK-LICENSE.txt`. Enlace del autor en los metadatos de la fuente: <https://linktr.ee/michaelmicasso>.

`styles.css` declara `@font-face` con `font-display: block`. El cuerpo de la interfaz usa 12 px, que en MonoMEK cae en su cuadrícula (el em interno es 15). La pila es `"MonoMEK", ui-monospace, "DejaVu Sans Mono", monospace`, inyectada como `--mono` solo si el documento todavía no tiene esa variable. En la web de referencia `--mono` existe y no nombra a MonoMEK: al embeber el juego hay que decidir cuál gana.

## Sprites

Dibujados a mano como matrices de 16 caracteres. `.` es transparente. `src/sprites/dibujo.js` los convierte en canvas de 16×16 ya coloreados: `frames[id][direccion][variante]`. Una variante es una lista de parches sobre la matriz base; el escarabajo calcula sus parches comparando cada cuadro completo con el reposo.

| Pieza | Archivo | Direcciones | Notas |
| --- | --- | --- | --- |
| Planta central | `src/sprites/planta.js` | 1 | Pétalos, núcleo, hojas, tallo, tierra. Idle irregular. |
| Cerbatana | `src/sprites/cerbatana.js` | 8 | Bulbo y boca dibujados para N, NE, E, SE y S; el resto es espejo. No es una copia de otra torre. |
| Escarabajo | `src/sprites/escarabajo.js` | 1 de perfil, espejo izquierda/derecha | Sin rediseño en la etapa 06. Su calidad sigue sin aprobación del propietario. |
| Pulgón alado | `src/sprites/pulgon.js` | 1 de perfil, espejo | Cuerpo claramente más chico. Aleteo de dos tiempos, no el ciclo de tres alturas. |
| Oruga | `src/sprites/oruga.js` | 1 de perfil, espejo | Cuerpo segmentado en el suelo. Se estira y se contrae. No vuela. |
| Espino | `src/sprites/espino.js` | 1 | Mata baja con púas. Luz más tenue que la cerbatana, definida en el catálogo. |

La comparación a escala 1 y 4 está en `galeria.html`. No se enlaza desde la partida.

La variante de disparo de la cerbatana es el índice 3 (`VARIANTE_DISPARO` en `src/entidades/planta.js`): la usa el disparo, no el ciclo idle. El retroceso es un desplazamiento de como mucho 1 px, redondeado, en contra del tiro (`BALANCE.visual.retroceso` = 0,12 s).

Para un sprite nuevo: misma matriz, mismos roles, variantes por parches de pocos píxeles, secuencia con duraciones en segundos en el módulo del sprite, registro en `src/catalogo.js`. Estudiar los tres que ya existen antes de inventar otro trazo.

## Animación

`src/animacion.js`. Cada tipo trae `SECUENCIA`: `{ fotograma, duracion }` en segundos. El desfase inicial evita que todas respiren juntas. Con `prefers-reduced-motion: reduce` el índice vuelve al fotograma 0 y no avanza.

La central no usa un compás regular (duraciones entre 0,6 y 1,8 s).

El escarabajo no usa `crearAnimacion`: su cuadro sale de su estado visual (`fotogramaEnemigo` en `src/entidades/enemigo.js`):

- **Vuelo:** ciclo corto de alas alta, media, baja, media (0,05 s cada cuadro). Con movimiento reducido, alas a media altura fijas.
- **Despegue:** alas altas mientras sube tras perder su planta (`BALANCE.visual.despegue`, 0,25 s).
- **Aterrizaje:** alas bajas, luego patas abiertas durante `BALANCE.visual.aterrizaje` (0,3 s). La altura baja hasta el suelo.
- **Alimentación:** reposo con las alas plegadas. En cada mordida la cabeza baja un píxel (`BALANCE.visual.mordisco`, 0,2 s). Cada 1,6 s las antenas caen 0,25 s.
- **Caída:** reposo mientras se desintegra.

Los tiempos visuales no cambian cuándo muerde ni cuándo dispara. La mordida la cuenta la simulación; el cuadro solo la muestra.

## Vuelo e insectos

El escarabajo vuela a 3 píxeles lógicos sobre el suelo (`INSECTO.altura`). Una oscilación decorativa de ±1 px, con período de 0,9 s (`INSECTO.balanceo`), sube y baja el sprite; sin movimiento reducido no oscila. La sombra queda en el suelo: un parche de 6×1 y 4×1 px en el color `fondo`, con alfa creciente con la altura (`INSECTO.sombra`). Esa diferencia entre sprite y sombra es lo que deja leer la altura.

La oscilación, el aleteo y la elevación afectan solo al dibujo. La posición lógica, las colisiones, el alcance y la trayectoria de los proyectiles siguen en `x, y`.

Se mira hacia la planta al fijar objetivo. Mientras vuela se orienta según el avance horizontal. Los espejos son horizontales; no hay rotaciones interpoladas.

## Lenguaje para los próximos insectos

Principios que sigue el escarabajo y que los siguientes deben respetar. Sin estos cinco puntos, un insecto nuevo rompe el ecosistema:

1. **Organismo, no monstruo.** Anatomía reconocible (cabeza, patas, antenas, alas o caparazón) a 16 px. Sin ojos rojos ni emblemas genéricos.
2. **Proporción con las plantas.** El cuerpo mide entre 8 y 11 px de ancho. Un insecto no compite en tamaño con la central.
3. **Perspectiva única.** Todo perfil de tres cuartos o de lado, mirando a la derecha y con espejo. No mezclar cenital con lateral dentro de la misma familia.
4. **Color de familia.** Roles propios derivados de la paleta activa. Se separa de la chispa y de la marca por matiz, no por brillo.
5. **Estado visible.** Cada comportamiento (vuelo, aterrizaje, alimentación, caída) tiene su cuadro o su gesto. Si el jugador no distingue lo que hace el insecto, falta un cuadro.

Diferencias funcionales entre especies: velocidad, altura de vuelo, tamaño del cuerpo y forma de atacar deben notarse en la silueta antes que en el color.

## Oscuridad, luz y partículas

La oscuridad es composición. `src/iluminacion.js` guarda una transmisión por píxel lógico. La central se recalcula cada frame (núcleo, brillo, ambiente, seno de 5θ, pulso, impulso). Cada planta con `luz` aporta un mapa estático que se combina con `t *= 1 - factor * (1 - valor)`. `factor` sigue la opacidad, así la luz se apaga con la marchitez. Seis niveles de Bayer 4×4 (`LUZ.niveles`). Sin shaders ni raycasting.

Encima, `src/render.js` vuelve a dibujar las plantas en una capa luminosa multiplicadas por `propia` (central 0,55, cerbatana 0,5). Su destello de daño usa esa misma capa en modo `lighter`. El glow (central, cerbatana, escarabajo y casilla marcada) va al final, en la resolución de pantalla.

El escarabajo usa una capa luminosa con alfa 0,8, un filete tenue de un píxel lógico y un resplandor corto del color de su reflejo. Al recibir daño se refuerzan el filete y el halo, y aparece un destello frío que decae sobre el sprite. El golpe final conserva el destello sobre los píxeles que aún quedan durante la desintegración. Con movimiento reducido, el destello se mantiene y se omite el empuje visual.

Partículas en `src/particulas.js`: tope 12, 1 o 2 px, alineadas a la grilla, deriva lenta, se desvanecen. El ambiente nace junto al núcleo. El combate añade ráfagas cortas (impacto y muerte de planta 3, mordida 2, disparo 1, latido de energía 2). Con movimiento reducido no hay ráfagas de combate, ni ráfaga al ganar energía, ni emisión ambiente. El impacto y la mordida siguen mostrándose con destello estático. La grilla no se apaga.

Muerte del escarabajo: `destination-out` píxel a píxel durante 0,7 s (`BALANCE.visual.desintegracion`). Muerte de planta: la opacidad baja en 1,2 s (`marchitez`) y entonces se quita la fuente de luz. Esos tiempos viven en config; este documento no los duplica como mandamiento.

Derrota: la luz de la central se atenúa con su opacidad. Su halo y el ambiente bajan en la misma proporción, y la oscuridad vuelve de forma continua durante la marchitez. Al terminar, la escena queda con las plantas restantes y el insecto que estuviera vivo, sin luz central.

## Interfaz

Integrada y chica. Energía arriba: un punto de 4 px, la palabra y el entero, en `styles.css`. Tarjeta de 96×44 px lógicos, borde de 1 px, sprite animado, nombre y coste (`src/catalogoUI.js`). Seleccionada invierte tinta y fondo. Insuficiente baja la alfa a 0,4. El foco visible es un outline discontinuo. Nada de esquinas redondeadas, cromado, CRT ni iconos.

El aviso de derrota es una frase y un botón de texto subrayado: “el jardín cayó” / “reiniciar”. Sin menú ni panel. No tiene fondo: el jardín queda visible, con la central apagada. El texto aparece en la mitad superior del escenario con un fundido de 1,8 s, después de que la marchitez termine, así no tapa la planta que se está apagando.

## Marcado

`src/marcadores.js` y `MARCADORES` / `COLOCACION` en `src/config.js`.

- Hover y selección: hormigas de 1 px sobre el borde de la casilla (2 px encendidos, 2 apagados, avance con `MARCADORES.velocidad`) más un halo muy bajo.
- En colocación, el hover de selección no se dibuja. Las casillas válidas llevan hormigas tenues. Bajo el puntero fino, el sprite se ve translúcido (más opaco si la casilla es válida).
- Con movimiento reducido las hormigas se quedan quietas.

## Responsive y movimiento reducido

`styles.css`: `100dvh`, safe areas, `touch-action: none` solo en el canvas, sin selección de texto ni callout táctil en el tablero. El catálogo va abajo en vertical; a un lado en horizontal bajo o en escritorio ancho. `--escala-carta` pasa de 2 a 1 cuando hay poca altura. El botón de reinicio reserva 2,75 rem de alto.

`prefers-reduced-motion` (leído en cada paso, no solo al cargar): idle en el primer fotograma, luz sin pulso ni ondulación, hormigas quietas, sin partículas de ambiente, ráfagas de combate ni ráfaga al sumar energía. Las plantas no retroceden al disparar. El escarabajo vuela con un cuadro fijo y no oscila. El combate sigue, y los cambios de estado (aterrizaje, mordida, desintegración) se muestran con cuadros y fundidos, no con desplazamientos.

## Al añadir un efecto

Que se entienda a 16 px. Pocos píxeles que cambian, no una nube. Si necesita blur, va en la capa de resplandor, con alfa baja y un color de rol (`resplandor`, `ambiental`, `boca`, `particula`). Probar al menos una paleta distinta de la base, porque los roles se mezclan: un sprite que solo se lee con el rosa y el verde de fábrica está mal construido.
