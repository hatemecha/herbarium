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

Un organismo chico en mucha oscuridad. Los sprites y las casillas siguen usando 16 píxeles lógicos. El campo cubre su área disponible y la cámara recorre coordenadas positivas y negativas. La grilla tenue aparece sobre tierra descubierta y comparte fase con el mundo. La oscuridad alrededor continúa hasta el borde de la vista. La expansión no dibuja un marco alrededor de cada región.

## Escalado

La cámara parte del menor múltiplo físico entero que alcanza 2 píxeles CSS por píxel lógico y permite ampliarlo hasta el doble. Los sprites, el moteado, el Bayer y la bruma conservan sus coordenadas al mover la cámara. Los enemigos y proyectiles avanzan en continuo y solo se redondean al dibujarlos. Una pequeña punta de cinco píxeles en tinta de insecto indica un ataque activo fuera de vista o un enemigo fuera de vista a tres casillas de la central.

La luz ambiente se compone en una capa de 2 × 2 píxeles lógicos por muestra. La escena, la sombra y los sprites conservan sus capas lógicas y se amplían sin interpolación. La cerbatana tiene ocho dibujos y el escarabajo se espeja.

## Interfaz rasterizada

- `src/interfazPixel.js` concentra texto, marcos y presentación. Energía, cartas, avisos, ayudas, pausa y derrota dibujan en un lienzo lógico. Los botones y el diálogo conservan sus hitboxes, nombres, foco y teclado en HTML. La estrella de energía y de coste sigue siendo la misma matriz de 7 × 7.
- El título, la descripción y los datos de las fichas del herbario usan texto HTML en Terminus a 18 px para equilibrar legibilidad y espacio. El resto de la interfaz utiliza la misma fuente rasterizada.
- Terminus se rasteriza a 12 px lógicos, con un avance monoespaciado de 6 px. Las máscaras usan una línea base lógica común, normalización NFC y alfa binaria con umbral 56. Se reutilizan por glifo y tinta. Los párrafos saltan por palabras y las cadenas más largas que su columna pueden partirse por carácter. No se usa `fillText(maxWidth)`.
- Las descripciones, datos y ayudas apuntan a 2× antes de ajustar al múltiplo físico. Los párrafos suman dos píxeles lógicos entre líneas. Los avisos tienen una franja propia sobre el tablero y la bandeja reserva el alto de su ayuda más larga al ancho disponible para que el texto aparezca sin mover las cartas.
- Cada salida tiene `ancho lógico × k` y `alto lógico × k` píxeles físicos. El DOM reserva su espacio en CSS. La salida se proyecta 1:1 sobre un origen físico entero y se recorta al área desplazable del diálogo. Esto evita el remuestreo que puede introducir Chromium al pintar el mismo backing store en una caja CSS fraccionaria. Se recalcula al cambiar tamaño, DPR o posición por scroll.
- La pausa usa el marco rasterizado de la familia de cartas y un cursor en píxeles. El herbario tiene una caja fija de referencia de 39 × 34 casillas, limitada por el área disponible, con marco raster de dos píxeles lógicos. Las categorías y fichas comparten esa caja. La cabecera queda fija mientras el contenido se desplaza y en móvil la lista también admite desplazamiento horizontal. Las miniaturas quedan quietas para identificar las especies. El retrato seleccionado reutiliza los cuadros y la cadencia del juego con su propio reloj, que solo corre con el diálogo abierto y respeta movimiento reducido.

### Excepciones

- El foco nativo suplementario del diálogo y de Reiniciar, la barra de desplazamiento y la composición del fondo modal siguen bajo control del navegador. El contorno pixel de las cartas y el cursor raster del diálogo también indican foco.
- La opacidad de la penumbra del diálogo y la aparición escalonada de la derrota afectan capas enteras. Durante una transición, distintas capas pueden superponer sus grillas. Las motas que viajan al HUD son una capa de un píxel de UI, alineada por separado del mundo. El polen, los impactos y los efectos de combate se componen en el tablero lógico.
- El zoom de página que cambia DPR recalcula la salida. El zoom táctil transitorio del compositor y una página anfitriona que transforme el juego quedan fuera de la garantía física; se conserva el control de zoom del navegador.

### Auditoría de consolidación

La comparación parte de `f731765`. La tipografía funciona como parte de la composición en MEK.txt y DOS Age usa jerarquía por densidad de píxel, contraste y ritmo. En Herbarium ese orden pone el organismo y las acciones por delante del marco. Se conservaron los recursos propios. [MEK.txt](https://mektxt.com/) · [DOS Age](https://dos-age.com/)

| Superficie | Hallazgo y corrección |
| --- | --- |
| Tablero y organismos | El umbral anterior admitía tamaños intermedios. La ampliación física ahora es entera. Se conservaron sprites, poses, sombras y coordenadas del mundo. |
| Energía e iconos | El hexagrama ya era una matriz, pero la cifra y Pausa pasaban por un contexto ampliado o por CSS. Ahora comparten una salida raster y el saldo se reduce solo por múltiplos enteros si invade el control. |
| Cartas, avisos y descripciones | El tamaño CSS de la carta podía diferir del backing store. El nombre comprimía glifos, el texto contextual quedaba a cargo del navegador y la selección tenía una sombra suave. Ahora comparten métricas, copia entera y foco dibujado. |
| Pausa y herbario | Los rectángulos y recortes CSS dominaban la composición. Un marco común, el cursor y el retrato concentran el contraste. Los textos y las poses usan la misma salida que el resto de la interfaz. |
| Derrota | El cierre opaco centra el mensaje y el botón raster. La marchitez ocurre en el tablero antes de que aparezca el cierre. |
| Partículas, luz y efectos | Las partículas y el campo de luz ya se resuelven en píxeles lógicos. Se alinearon las motas externas que conectan con el HUD. Los impactos, señales de alcance, tiempos y paletas de efectos conservaron sus reglas. |

Para revisar una salida, tomar un PNG físico en el juego real, registrar `data-escala-pixel` y comprobar a ojo la grilla y la legibilidad a tamaño nativo y a 2× o más.

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

Terminus TTF 4.49.3 se distribuye bajo SIL Open Font License 1.1. Los archivos son `assets/fonts/Terminus.ttf` y `assets/fonts/Terminus-LICENSE.txt`. [Fuente y descarga](https://files.ax86.net/terminus-ttf/).

`styles.css` declara Terminus con `@font-face` y `font-display: block`. La interfaz usa Terminus tanto en sus rótulos rasterizados como en el texto HTML de las fichas.

## Sprites

Dibujados a mano como matrices de 16 caracteres. `.` es transparente. `src/sprites/dibujo.js` los convierte en canvas de 16×16 ya coloreados: `frames[id][direccion][variante]`. Una variante es una lista de parches sobre la matriz base; el escarabajo calcula sus parches comparando cada cuadro completo con el reposo.

| Pieza | Archivo | Direcciones | Notas |
| --- | --- | --- | --- |
| Planta central | `src/sprites/planta.js` | 1 | Pétalos, núcleo, hojas, tallo, tierra. Idle irregular. |
| Cerbatana | `src/sprites/cerbatana.js` | 8 | Bulbo y boca dibujados para N, NE, E, SE y S; el resto es espejo. No es una copia de otra torre. |
| Escarabajo | `src/sprites/escarabajo.js` | 1 de perfil, espejo izquierda/derecha | Sin rediseño en la etapa 06. Su calidad sigue sin aprobación del propietario. |
| Pulgón alado | `src/sprites/pulgon.js` | 1 de perfil, espejo | Abdomen azul, patas finas y alas cortas ancladas al tórax en sus dos cuadros de vuelo. |
| Oruga | `src/sprites/oruga.js` | 1 de perfil, espejo | Segmentos violáceos con luces escalonadas. Se estira y se contrae sobre el suelo. |
| Campanilla | `src/sprites/campanilla.js` | 1 | Tallo arqueado, flor colgante fría y pulso breve. |
| Hongo | `src/sprites/hongo.js` | 1 | Sombrero ancho, franja en la superficie y destello breve al esporar. |
| Espino | `src/sprites/espino.js` | 1 | Mata baja con púas. Luz más tenue que la cerbatana, definida en el catálogo. |

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

Partículas en `src/particulas.js`: presupuesto de 80, hasta 8 de ambiente; tamaños de uno o dos píxeles lógicos. Nueve familias: polen, energía, brote, disparo, impacto, espora, reflejo, restos y control. Las ráfagas desplazan primero las de menor prioridad. Generador aleatorio separado de las reglas; el movimiento reducido vacía el presupuesto y conserva las señales estáticas. Las motas fijas del terreno se dibujan con el rol tierra y contraste muy bajo, visibles bajo la iluminación existente.

Muerte del escarabajo: `destination-out` píxel a píxel durante 0,7 s (`BALANCE.visual.desintegracion`). Muerte de planta: la opacidad baja en 1,2 s (`marchitez`) y entonces se quita la fuente de luz. Esos tiempos viven en config; este documento no los duplica como mandamiento.

Derrota: la luz de la central se atenúa con su opacidad. Su halo y el ambiente bajan en la misma proporción, y la oscuridad vuelve de forma continua durante la marchitez. Al terminar, la escena queda con las plantas restantes y el insecto que estuviera vivo, sin luz central.

## Interfaz

La energía está centrada, con un hexagrama de 7 × 7 (`src/sprites/estrella.js`) alineado a la cifra. La misma estrella marca el coste de cada carta. Pausa queda al extremo derecho. Las cuatro cartas forman un grupo bajo el jardín o a un lado en horizontal bajo. La pala aparece junto a la ayuda del catálogo al desbloquearse en la oleada 3, con el mismo destello verde que una carta alcanzable. Usa un botón compacto con una superficie táctil de al menos 44 × 44 px y un sprite vertical de 16 × 16, con empuñadura de madera en D y hoja ancha de metal. Tocar una carta sin energía tintea toda la tarjeta de rojo, igual que el destello verde al desbloquear. La vida de cada planta se muestra en una barra bajo el sprite. El escenario muestra los avisos breves y el lector de pantalla recibe los mensajes semánticos. Las cartas de 72 × 80 muestran espécimen, nombre y coste. Foco, selección, desbloqueo, compra e insuficiencia tienen señales diferenciadas con el botón quieto.

Tras la marchitez, una capa oscura entra en seis pasos durante 1,2 s. El texto y Reiniciar comparten ese fondo. La bandeja de compra queda cerrada. El herbario sigue disponible desde Pausa.

## Marcado

`src/marcadores.js` y `MARCADORES` / `COLOCACION` en `src/config.js`.

- Hover y selección: hormigas de 1 px sobre el borde de la casilla (2 px encendidos, 2 apagados, avance con `MARCADORES.velocidad`) más un halo muy bajo.
- En colocación, el hover de selección no se dibuja. Las casillas válidas llevan hormigas tenues. Bajo el puntero fino, el sprite se ve translúcido (más opaco si la casilla es válida).
- Con movimiento reducido las hormigas se quedan quietas.

## Responsive y movimiento reducido

`styles.css` conserva `100dvh`, safe areas y `touch-action: none` en el tablero. La bandeja va debajo en vertical y a un lado en horizontal bajo. `--escala-carta` expresa un tamaño CSS objetivo, que se traduce a un múltiplo físico entero. Los botones táctiles tienen al menos 44 px CSS.

`prefers-reduced-motion` (leído en cada paso, no solo al cargar): idle en el primer fotograma, luz sin pulso ni ondulación, hormigas quietas, sin partículas de ambiente, ráfagas de combate ni ráfaga al sumar energía. Las plantas no retroceden al disparar. El escarabajo vuela con un cuadro fijo y no oscila. El combate sigue, y los cambios de estado (aterrizaje, mordida, desintegración) se muestran con cuadros y fundidos, no con desplazamientos.

## Al añadir un efecto

Que se entienda a 16 px. Pocos píxeles que cambian, no una nube. Si necesita blur, va en la capa de resplandor, con alfa baja y un color de rol (`resplandor`, `ambiental`, `boca`, `particula`). Probar al menos una paleta distinta de la base, porque los roles se mezclan: un sprite que solo se lee con el rosa y el verde de fábrica está mal construido.


## Señales de la etapa 07

La Campanilla deja una señal de dos píxeles junto al enemigo que pierde velocidad y el Hongo usa una ráfaga corta con destello en cada insecto alcanzado. El radio punteado aparece mientras se inspecciona una planta o se previsualiza una compra. El catálogo conserva las cartas verticales y usa una fila inferior o una zona lateral según el espacio.

Capturas reales de Chromium con reloj controlado. [Galería comparativa](capturas/etapa07-galeria.png), [previsualización táctil](capturas/etapa07-alcance.png) y [primera oleada](capturas/etapa07-partida.png).

## Etapa 08 · feedback y lectura de estados (histórico)

La etapa 07 se sentía rígida porque la fase solo cambiaba de texto y la ralentización se perdía entre las patas. El HUD conserva las tres columnas y las cartas verticales. Debajo del estado, cinco trazos se apagan durante la preparación y cambian de acento cuando empieza la oleada y luego se consumen con las apariciones pendientes. La energía gana un latido por entero y la compra tiene prioridad sobre ese latido. Las cartas pulsan al habilitarse o seleccionarse y sus reposos se desfasaron. La ficha de la barra es una línea; el consejo de compra vive en el panel de la carta.

Los gestos comparten pulsos breves dibujados en la grilla. La selección y la confirmación de posición usan la tinta de marca. Plantar usa el acento de energía. La casilla inválida usa el color de pétalo. El radio seleccionado se dibuja con puntos distribuidos a lo largo del perímetro y toma el acento de la función. El Espino marca su propia posición de bloqueo.

La ralentización cambia el filete del insecto al matiz de la Campanilla y deja dos rastros discretos a nivel del suelo. El proyectil usa un golpe frío, las esporas un destello cálido y el reflejo del Espino el acento de chispa. Una planta crítica muestra un trazo a ras del suelo y la ficha adopta la marca. El Hongo recupera el brillo bajo el sombrero hasta tener otro pulso disponible. Las luces de apoyo tienen una oscilación leve desfasada por casilla. Los efectos de movimiento se omiten o quedan fijos con movimiento reducido. Las señales de estado y los destellos de impacto siguen siendo visibles.

[Antes, previsualización en etapa 07](capturas/etapa07-alcance.png) · [HUD móvil en etapa 08](capturas/etapa08-movil.png) · [HUD al arrancar una oleada](capturas/etapa08-hud.png) · [Avance, ralentización, esporas y reflejo](capturas/etapa08-estados.png)


### Lectura del catálogo (histórico, sustituido en 08.2)

Cada carta muestra su papel incluso antes de que se pueda comprar. Pasar el puntero, enfocar, tocar una carta sin energía o entrar en colocación abre un ala de la carta: al costado en columnas laterales, hacia arriba en la fila inferior (móvil). Mismo relleno (`hover`), borde continuo (el lienzo deja abierta esa arista) y esquina de 1 px. El texto va a 14 px (12 px en móvil estrecho). Aparece de golpe. Lleva el consejo y, si hace falta, el coste que falta o la instrucción de colocación. La barra no repite ese consejo: solo muestra la planta inspeccionada en el tablero o un aviso. La energía usa trazos que se llenan hasta el coste de la carta consultada o hasta la compra más barata cuando no hay una carta en vista.

## Etapa 08.2 · composición, movimiento y cierre artístico

Las capturas de la etapa 08.2 salieron de un laboratorio temporal sobre el juego real. Incluyen cinco estados (reposo, selección con alcance, compra, preparación y combate) para cada composición en escritorio y móvil.

| Propuesta | Jerarquía y legibilidad | Atmósfera y expresividad | Ergonomía y equilibrio |
| --- | --- | --- | --- |
| A · Pliego | Energía, oleada y núcleo en una línea de lectura; ficha separada | El jardín y la oscuridad conservan la atención; los especímenes forman un conjunto | Catálogo 2×2 lateral en escritorio, fila inferior en móvil; tablero de 528/352 px |
| B · Horizonte | Los datos quedan debajo de las cartas, más lejos del combate | Centro despejado, pero la fila de cartas adquiere demasiado peso | Cómodo al pulgar, aunque comprime el jardín a 344 px en escritorio; 352 px en móvil |
| C · Gabinete | Columna de lectura vertical; datos más fragmentados en móvil | Disposición de observatorio; especímenes demasiado pequeños en escritorio | 528 px en escritorio, solo 271 px en móvil; la columna resta espacio al dedo |

**Dirección elegida:** Pliego corregido. El primer pliego desplazaba la flor a la derecha; ahora el tablero queda centrado, las cartas se acercan a su borde izquierdo y la ficha ocupa el flanco derecho. Se amplió la tipografía, se reservó altura para las líneas variables y se aumentó el tamaño del catálogo y la energía en móvil. En horizontal bajo se toma la organización de Gabinete: HUD izquierdo, jardín, catálogo 2×2 derecho y ficha inferior. La pérdida de tamaño del tablero de escritorio frente a la etapa 08 (681 → 528 px a 1280×800) es un compromiso deliberado para incorporar los cuatro objetos y la ficha sin superposición. En horizontal se recupera superficie (257 → 296 px) y desaparece el desbordamiento vertical anterior.

Referencias de principios: Balatro (jerarquía numérica y señal de compra); Hyper Light Drifter (contraste, composición y espacio negativo); Noita (partículas que pertenecen al acontecimiento); Dome Keeper (interfaz al servicio del mundo). No se incorporaron sus imágenes, música ni diseños de interfaz.

### Gramática visual

- Ambiente: polen lento, motas de terreno y luz de corto alcance. La oscuridad sigue siendo el fondo de la composición.
- Interacción: contorno, progreso, sello y chispa de compra; insuficiencia con marca inferior de amenaza; brote con semillas. La caja táctil no se desplaza.
- Cerbatana: chispa de anticipación cerca del fin del enfriamiento cuando hay objetivo, retroceso ya existente, proyectil y fragmentos dirigidos con el golpe.
- Campanilla: arcos abiertos, doble rastro bajo los insectos realmente ralentizados, partícula de entrada al estado y cadencia decorativa más lenta. Los dos trazos identifican el estado aun sin color.
- Hongo: poros indican carga, contracción discreta de un píxel y expansión punteada hasta el radio de daño desde el centro de la casilla. Las partículas cortas son esporas, no una segunda área de ataque.
- Espino: puntas y fragmentos orientados al insecto que mordió, derivados del evento de reflejo real. No da escudo a sus vecinos.
- Acontecimientos: primer brote, colocación, inicio de oleada, último insecto, resolución y descanso, núcleo crítico, marchitez de una planta y derrota. Se reserva la intensidad del núcleo para eventos importantes. Movimiento reducido elimina partículas y desplazamientos decorativos, mantiene marcas, destellos y estados.

### Evidencias y reproducción

Las capturas finales viven en [capturas/etapa082/final/](capturas/etapa082/final/). Los archivos del nivel anterior son iteraciones históricas. Comparación del laboratorio: [Pliego escritorio](capturas/etapa082/final/pliego-desktop-combate.png), [Horizonte escritorio](capturas/etapa082/final/horizonte-desktop-combate.png), [Gabinete escritorio](capturas/etapa082/final/gabinete-desktop-combate.png); [Pliego móvil](capturas/etapa082/final/pliego-movil-seleccion.png), [Horizonte móvil](capturas/etapa082/final/horizonte-movil-seleccion.png), [Gabinete móvil](capturas/etapa082/final/gabinete-movil-seleccion.png). Los sufijos de estado son `reposo`, `seleccion`, `compra`, `preparacion`, `combate`.

Comparación de producción: [antes](capturas/etapa082/final/antes-desktop-efectos.png) y [después](capturas/etapa082/final/despues-desktop-efectos.png); [móvil](capturas/etapa082/final/despues-movil-efectos.png) y [horizontal](capturas/etapa082/final/despues-horizontal-efectos.png). Los prefijos antes/despues y los sufijos vacio/medio/avanzado/efectos/critico/derrota permiten comparar las mismas escenas. [Último insecto](capturas/etapa082/final/ultimo-enemigo.png), [cierre](capturas/etapa082/final/cierre-oleada.png), [paleta alternativa](capturas/etapa082/final/paleta-alternativa.png), [movimiento reducido](capturas/etapa082/final/paleta-reducida.png). [Grabación general, iteración anterior al cierre de derrota](capturas/etapa082/final/combate.gif), [grabación focal de 48 fotogramas](capturas/etapa082/final/combate-focal.gif), [secuencia temporal](capturas/etapa082/final/secuencia-focal.png).

Ejecutar desde la raíz (Chromium, Python Playwright y FFmpeg instalados en el entorno de desarrollo, no dependencias del juego):

```sh
PORT=4182 node servidor.mjs
# En otra terminal, preparar una copia temporal de la referencia:
mkdir -p /tmp/herbarium-082-before
git archive a6bc20d | tar -x -C /tmp/herbarium-082-before
python -m http.server 4183 --bind 127.0.0.1 --directory /tmp/herbarium-082-before
# En otra terminal:
python scripts/visual-etapa082.py
python scripts/visual-cierre082.py
npm test
```

El script completo controla semilla y reloj; siembra directamente escenarios de prueba, coloca insectos para forzar carga y prepara el último enemigo. No son partidas naturales completas. La derrota se provoca con una mordida real y el cierre con el director real. La opción `--solo-carga` recupera el informe existente y repite solo paleta, carga, grabación focal y reloj real. Variables `HERBARIUM_URL`, `HERBARIUM_ANTES` y `HERBARIUM_CAPTURAS` permiten cambiar orígenes y salida. La instrumentación solo modifica la respuesta del módulo en el navegador de prueba, nunca el código de producción.

### Resultado

[Informe del navegador](capturas/etapa082/final/validacion.json): 74 pruebas Node aprobadas, incluidas dos nuevas pruebas de partículas. Comparación de escena con 12 plantas, 19 insectos vivos, tres ralentizados y 30 de vida del núcleo en las tres resoluciones comparadas, idéntica antes y después. En 1280×800, 390×844, 320×568 y 844×390, sin errores de página ni desbordamiento de producción; el primer toque previsualiza, el segundo compra; cajas estables. El reloj real sumó energía. La paleta de prueba usa las variables compatibles con nicotinalex-web, marca #a89aff y chispa #f9ca70 (colores de prueba, no una afirmación sobre el tema activo de la web personal). Con 48 enemigos inyectados, 120 fotogramas procesados en 1,432 s sin reducción y 1,640 s con reducción en Chromium headless. No son FPS medidos en un teléfono.

La inspección de la derrota detectó texto sobre insectos y cartas que sugerían compras pese al cierre. Se corrigió con una banda de fondo mínimo y estado cerrado del catálogo; [Informe de cierre](capturas/etapa082/final/cierre-validacion.json), [derrota móvil](capturas/etapa082/final/cierre-movil-derrota.png), [derrota horizontal](capturas/etapa082/final/cierre-horizontal-derrota.png) y [destrucción de Espino](capturas/etapa082/final/destruccion-planta.png). Las cuatro resoluciones confirmaron catálogo cerrado, ausencia de solapamiento, reinicio con núcleo 30/30 y cuatro cartas habilitadas. La alternancia del laboratorio funciona mediante sus botones; la escena focal registró disparo, impacto, control, esporas, reflejo, mordida y muertes reales. La evaluación visual comparativa se hizo con capturas a escala de uso y muestras temporales del GIF, no equivale a una evaluación subjetiva de una partida completa por el propietario. Sin teléfono físico ni Safari iOS; no se declara aprobación artística del propietario. La implementación no altera reglas, costes, balance ni sprites originales. No se autoriza avanzar a tarot.

## Etapa 08.3 · señales de combate

Tres puntos del perímetro anuncian la primera entrada. Dos puntos delante del insecto acompañan el rumbo hacia el Espino. Al consultar o colocar el Espino se dibuja su radio de atracción. El caparazón devuelve fragmentos en dirección contraria al tiro. Un trazo de dos píxeles señala el frente real de la oruga y las mordidas sostenidas muestran una doble marca en la boca. Estas señales reutilizan la grilla y los roles de tinta. El halo de insectos se dibuja una vez por casilla en grupos densos. Cada insecto conserva su sprite y su señal propia. El texto de compra ocupa un renglón propio bajo el catálogo y puede partirse en dos líneas.

## Pulido de luz y derrota

La luz del terreno conserva su grilla escalonada. La flor y las plantas de apoyo proyectan rebotes cortos en sus propios tonos. Los insectos llevan los acentos en sus siluetas y ya no tienen halos suaves. El aviso de tres puntos del perímetro se retiró.

Al generar energía, cinco motas tenues suben desde la flor a la estrella. El polen tiene un máximo global de doce motas. Ambos efectos se omiten con movimiento reducido y salen de escena al caer la flor. El cierre atenúa el tablero, muestra la silueta marchita de la central y da foco a Reiniciar en Terminus.

Las motas de interacción aparecen al seleccionar, previsualizar una casilla o aterrizar un insecto. El mouse solo las activa al pasar a otra posición válida mientras se coloca una planta. Las cartas sin energía muestran un candado y se pueden consultar. Al alcanzar el precio vigente, la carta titila en verde y conserva el precio iluminado. Con movimiento reducido, el aviso es un breve realce fijo.


### Bioluminiscencia y bruma

Cada planta tiñe la grilla alrededor de su núcleo con tres niveles de luz y una respiración desfasada. En los cruces de luz aparece una bruma entrecortada. El foco dominante fija el color del píxel y el brillo queda acotado. Las motas nacen junto a una planta viva y llevan su color. Disparos, esporas y reflejos activan un destello local de 0,36 s que comparte ese mismo límite. Con movimiento reducido, la luz y la bruma quedan estáticas y se omiten las motas ambientales.

La penumbra deja pasar hasta un 6 % más del terreno mientras vive la central. El rebote ambiental usa el rojo de la central, el azul de Campanilla y verdes de distinta intensidad para Cerbatana, Espino y Hongo. El Hongo conserva su color propio en el sprite. Los radios, el techo de opacidad y los destellos de combate conservan sus valores.
