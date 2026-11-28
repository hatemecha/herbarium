# Diseño de juego

Herbarium es un juego independiente. Más adelante se integrará en la web personal del autor. La referencia estética de esa web es el repositorio local `nicotinalex-web` (la URL pública `hatemecha/nicotinalex-web` no estaba disponible cuando se auditó este proyecto).

Concepto confirmado: defender un jardín pequeño que crece en medio de la oscuridad. No es un RPG, ni un simulador de jardinería, ni un juego narrativo convencional, salvo que el propietario lo pida.

## Experiencia buscada

Confirmado como intención, no como métrica ya medida:

- Fácil de entender.
- Estratégicamente interesante.
- Visualmente bello.
- Jugable en escritorio y en táctil, con las mismas reglas.
- Satisfactorio en torno a 15 minutos. Esa cifra es referencia, no un tope.
- Potencialmente infinito y rejugable por configuración y decisiones.

Sin monetización, publicidad ni compras.

## Lo que el jugador hace hoy

Implementado:

1. Hay una planta central en el origen del jardín. Genera energía e ilumina.
2. Con esa energía se compran las cuatro plantas del catálogo. El coste sube con las plantas vivas de ese mismo tipo.
3. Solo se planta en una casilla libre, en terreno descubierto, vecina en alguna de las ocho direcciones a una planta ya viva, y si la energía alcanza. Vale en la preparación y en el combate. La superficie inicial mide 9×9. Al plantar en el borde se descubren las regiones vecinas tocadas por las ocho adyacencias de la casilla. Las regiones descubiertas persisten si sus plantas desaparecen.
4. El jardín crece desde las plantas existentes. La central no se compra ni se duplica.
5. Tras 20 s de preparación entra la primera invasión procedural. Cualquier lado puede recibir enemigos durante el combate y las concentraciones cambian mientras avanza.
6. La cerbatana dispara sola al enemigo más cercano dentro de su alcance circular. El espino atrae insectos y devuelve 2 de daño a quien lo muerde.
7. Si la central muere, la partida se detiene: no sube energía, no se compra y no se combate. Las animaciones pendientes terminan y, al apagarse la central, aparece el aviso «el jardín cayó».

Cuando termina el combate y no quedan enemigos vivos, aparece la recompensa. Durante su presentación se detienen el combate, la energía y las compras. Los resultados son energía, acceso al tarot o sin bonificación. La preparación de 17 s empieza después de resolver el premio, incluida la confirmación del arcano si hubo ritual.

## Condiciones

| Situación | Estado |
| --- | --- |
| Derrota | La planta central queda con vida ≤ 0. `src/combate.js` lo expone como `derrota()`. Desde ese paso el combate no dispara, no muerde y no mueve, y los proyectiles en vuelo desaparecen. |
| Final visual | Al terminar la marchitez de la central (1,2 s), `src/derrota.js` muestra el aviso con un fundido de 1,8 s. La luz de la central baja con su opacidad: halo y ambiente se apagan de forma continua. |
| Victoria | No existe. La partida sigue hasta que cae la central. No se promete que toda oleada sea superable. |
| Pausa | El botón abre un menú para reanudar, reiniciar con confirmación o consultar el catálogo. Ocultar la pestaña también detiene el reloj. Al volver, el acumulador arranca de cero y la pausa manual sigue activa si el menú está abierto. |
| Catálogo de especies | La planta central y las cartas disponibles se registran al comenzar. Los enemigos se registran al entrar al tablero. Los descubrimientos se conservan en el navegador entre partidas. |
| Reinicio | Derriba la partida y crea otra: energía a 0, solo la central, sin el escarabajo anterior. Probado en dos rondas seguidas: los tiempos de aparición coinciden y la energía vuelve a 0. |

La derrota no congela la escena: se apaga. Las plantas que siguen en pie no se marchitan; el escarabajo vivo queda en su último cuadro. Ver la pendiente en [ROADMAP.md](ROADMAP.md).

## Planta central

Implementado. No es comprable. Ocupa la casilla `(0, 0)`. Vida 30. No ataca. Su luz es dinámica (pulso, impulso al generar energía, ondulación). Ver `PLANTAS.central` en `src/catalogo.js` y `LUZ` en `src/config.js`.

## Economía

Implementado y experimental. La energía empieza en 0 y sube 1 por segundo en preparación y en combate. El indicador muestra el entero. El coste de cada compra es `costeBase + 2t + 6t(t − 1)`, con `t = floor(vivasDelMismoTipo / 4)`. Lo desactiva `ECONOMIA.creciente` en `src/config.js`. La tarjeta, la validación y el descuento leen esa misma función.

La energía pasiva se suspende durante los premios y tras la ventana nominal de apariciones más 24 s de combate. La pala devuelve la mitad redondeada hacia abajo del coste pagado, sin depender del precio de catálogo ni de la vida restante. La recompensa de energía se aplica una vez por invasión. La Estrella puede recuperar una fracción de la vida faltante al cerrar una invasión. El resto del combate sigue sin regeneración ni recompensa por matar. El detalle está en [ETAPA_084.md](ETAPA_084.md).

## Plantas, catálogo y expansión

Hay cuatro tipos comprables. La **Cerbatana** concentra daño individual. El **Espino** atrae insectos cercanos en avance y devuelve daño por cada mordida. La **Campanilla** reduce la velocidad de avance en su radio. El **Hongo** libera esporas cuando hay insectos dentro de su radio efectivo. El catálogo son tarjetas en canvas (`src/catalogoUI.js`). Estados: disponible, seleccionada e insuficiente. El número de la tarjeta es el coste actual, no el base.

La colocación (`src/colocacion.js`, `src/jardin.js`):

- Modo colocación al pulsar la tarjeta, si hay energía.
- Volver a pulsarla, pulsar fuera del tablero y del catálogo, o Escape, cancela.
- El clic en una casilla válida confirma. Con dedo, el primer toque muestra la posición y el alcance y el segundo en esa casilla confirma.
- Arrastrar una carta y soltarla sobre una casilla válida confirma la plantación en un solo gesto. Un gesto cancelado no consume energía.
- La rueda, el pellizco y las teclas `+` y `−` amplían el tablero. Arrastrá el campo a cualquier escala para desplazarte. `0` y el botón Centrar restauran la vista inicial.
- Una casilla inválida no gasta nada.
- En modo colocación se marcan las casillas válidas y, con puntero fino, se previsualiza el sprite.
- La pala se desbloquea en la oleada 3. Activa la retirada voluntaria y muestra el reembolso. Un clic confirma en escritorio y dos toques sobre la misma planta confirman en táctil. Escape cancela. La central queda excluida y las plantas vecinas siguen en su lugar, aunque se corte la conexión.
- Tocar una carta sin energía suficiente tiñe toda la tarjeta de rojo (mismo gesto que el destello verde al alcanzar el precio).

El espino es la planta defensiva. Bloquea porque ocupa una casilla, igual que las demás, y además devuelve daño. No sustituye a la cerbatana: no tiene proyectil.

## Selección

Implementado solo sobre casillas ocupadas. Persiste hasta otra planta, una casilla vacía, un pulsar fuera del canvas (el catálogo y el aviso de derrota, marcados `data-interfaz`, no cuentan) o hasta entrar en modo colocación, que la limpia.

Un contorno punteado indica el alcance de la planta seleccionada. La consulta de cartas ofrece una descripción breve debajo del catálogo.

El hover (borde de hormigas) solo sigue a mouse y lápiz. El toque no genera hover.

## Enemigos y combate

En 08.3, el Escarabajo amortigua un punto por proyectil mientras está en vuelo. El Pulgón cruza sobre defensas comunes y se posa en el Espino o en la central. La Oruga amortigua tiros frontales e intensifica la tercera mordida y las siguientes contra la misma planta. Un Espino capta insectos libres dentro de su radio. Si se solapan radios, el insecto elige el Espino más cercano y sostiene el desvío hasta encontrar un bloqueo o perder el señuelo. La Campanilla reduce el avance durante el desvío y deja intacta la cadencia de las mordidas.

Durante los últimos cuatro segundos de preparación aparece «Se acerca una oleada». «Oleada N» coincide con la entrada a combate y «Oleada superada» con su cierre.

### Reglas compartidas

Tres enemigos comparten `src/combate.js`. El escarabajo conserva vida 12, velocidad 0,5, daño 2 e intervalo 1. El pulgón alado: vida 4, velocidad 1,05, daño 1, intervalo 0,65. La oruga: vida 28, velocidad 0,28, daño 3, intervalo 1,25. Camina, se toma un momento al fijar una planta y sostiene la presión con mordidas sucesivas. Los pulgones comparten puntos de salida por grupo y varían ligeramente su marcha. Esas cifras son el punto de partida medido en [BALANCE.md](BALANCE.md), no un cierre.

- Las invasiones las arma `src/oleadas.js` con una semilla y distribuciones variables de tiempo, sector y tamaño de grupo. Desde la tercera puede salir la oruga.
- Cada insecto aparece en la intersección exterior más lejana de su rayo de entrada con los discos de exclusión de radio 4,5 alrededor de cada planta viva. El punto se calcula al emitirlo, según el jardín de ese momento.
- Posición continua, en unidades de casilla. La casilla `i` es el intervalo `[i, i+1)`.
- El escarabajo vuela a 3 px y el pulgón a 2 px. La oruga queda en el suelo. Solo el pulgón sobrevuela bloqueos comunes.
- Al fijar objetivo, el volador aterriza y se alimenta. La oruga contrae el cuerpo y baja la cabeza al morder. Al perder la planta, el volador despega. El estado de vuelo determina si la coraza protege al escarabajo. Ver [ART_DIRECTION.md](ART_DIRECTION.md).
- El camino va hacia la central o hacia un Espino que haya desviado al insecto. Si la casilla inmediata en esa dirección contiene un bloqueo válido, se detiene y lo ataca. Al destruirla, la casilla se libera y sigue.
- La cerbatana elige el enemigo vivo más cercano a distancia ≤ alcance, apunta con una predicción corta y dispara con cadencia propia.
- El proyectil tiene posición, dirección y velocidad. El daño ocurre al cruzar el radio del enemigo, con barrido del segmento para no atravesarlo entre frames. Si agota su distancia máxima, desaparece.
- Entidades con vida actual y máxima. Al recibir daño hay un destello breve. Las plantas dañadas muestran una barra discreta.
- El escarabajo muerto se desintegra píxel a píxel y luego sale de la lista.
- Una planta destruida libera la casilla al momento, se marchita por opacidad y al terminar se retira junto con su luz.

## Alcance y evolución prevista

- **Oleadas.** Implementadas como director procedural. El presupuesto y el ritmo son experimentales.
- **Más plantas y enemigos.** Hay cuatro plantas comprables y tres insectos. No hay una cuarta especie.
- **Economía.** Preparación y combate mantienen el goteo dentro de sus límites. El coste crece con las vivas.
- **Tarot.** El primer corte interpreta simbólicamente decisiones de la partida a partir de una pregunta por ritual. Cada arcano modifica el jardín hasta el final de esa partida. La ampliación a 22 arcanos y la calibración completa siguen pendientes. [Etapa 09](tarot/ETAPA_09.md).
- **Sonido, pulido visual e integración** en la web personal. Ver [ROADMAP.md](ROADMAP.md).

## Pendiente de diseño

- Si el presupuesto calibrado se queda. La medición de 100 semillas está en [Etapa 08.3](ETAPA_083.md). No es una prueba de diversión humana.
- Cuánto valor obtiene un jugador del Espino en partidas completas. La etapa 08.3 mide la protección en escenarios controlados y con políticas automatizadas.
- Qué hace el insecto vivo cuando la central cae.
- Licencia y visibilidad del repositorio. No están elegidas.
