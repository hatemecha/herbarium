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

1. Hay una planta central en el centro del tablero. Genera energía e ilumina.
2. Con esa energía se compran la cerbatana y el espino. El coste sube con las plantas vivas de ese mismo tipo.
3. Solo se planta en una casilla libre, dentro del tablero, vecina en alguna de las ocho direcciones a una planta ya viva, y si la energía alcanza. Vale en la preparación y en el combate.
4. El jardín crece desde las plantas existentes. La central no se compra ni se duplica.
5. Tras 20 s de preparación entra la primera oleada: dos escarabajos y tres pulgones, no todos a la vez. Después hay oleadas procedurales con semilla.
6. La cerbatana dispara sola al enemigo más cercano dentro de su alcance circular. El espino no dispara: devuelve 1 de daño a quien lo muerde.
7. Si la central muere, la partida se detiene: no sube energía, no se compra y no se combate. Las animaciones pendientes terminan y, al apagarse la central, aparece el aviso «el jardín cayó».

No hay recompensas por baja, tarot, sonido ni progresión entre partidas. Entre oleadas hay un gancho vacío (`alEntreOleadas`) para eso.

## Condiciones

| Situación | Estado |
| --- | --- |
| Derrota | La planta central queda con vida ≤ 0. `src/combate.js` lo expone como `derrota()`. Desde ese paso el combate no dispara, no muerde y no mueve, y los proyectiles en vuelo desaparecen. |
| Final visual | Al terminar la marchitez de la central (1,2 s), `src/derrota.js` muestra el aviso con un fundido de 1,8 s. La luz de la central baja con su opacidad: halo y ambiente se apagan de forma continua. |
| Victoria | No existe. La partida sigue hasta que cae la central. No se promete que toda oleada sea superable. |
| Pausa | Ocultar la pestaña cancela el `requestAnimationFrame` y, al volver, el acumulador arranca de cero. No hay botón de pausa. Verificado solo con `visibilitychange` forzado. |
| Reinicio | Derriba la partida y crea otra: energía a 0, solo la central, sin el escarabajo anterior. Probado en dos rondas seguidas: los tiempos de aparición coinciden y la energía vuelve a 0. |

La derrota no congela la escena: se apaga. Las plantas que siguen en pie no se marchitan; el escarabajo vivo queda en su último cuadro. Ver la pendiente en [ROADMAP.md](ROADMAP.md).

## Planta central

Implementado. No es comprable. Ocupa la casilla `(5, 5)` de un tablero 11×11. Vida 30. No ataca. Su luz es dinámica (pulso, impulso al generar energía, ondulación). Ver `PLANTAS.central` en `src/catalogo.js` y `LUZ` en `src/config.js`.

## Economía

Implementado y experimental. La energía empieza en 0 y sube 1 por segundo en preparación y en combate. El indicador muestra el entero. El coste de cada compra es `costeBase + 2 × floor(vivasDelMismoTipo / 4)`. Lo desactiva `ECONOMIA.creciente` en `src/config.js`. La tarjeta, la validación y el descuento leen esa misma función.

No hay otras fuentes de energía, regeneración ni recompensa por matar. El detalle está en [BALANCE.md](BALANCE.md).

## Plantas, catálogo y expansión

Implementados dos tipos comprables. **Cerbatana**, coste base 10, vida 12, dispara. **Espino**, coste base 8, vida 36, no dispara, refleja 1 por mordida efectiva. El catálogo son tarjetas en canvas (`src/catalogoUI.js`). Estados: disponible, seleccionada e insuficiente. El número de la tarjeta es el coste actual, no el base.

La colocación (`src/colocacion.js`, `src/jardin.js`):

- Modo colocación al pulsar la tarjeta, si hay energía.
- Volver a pulsarla, pulsar fuera del tablero y del catálogo, o Escape, cancela.
- Un toque o clic en una casilla válida planta, gasta la energía y sale del modo.
- Una casilla inválida no gasta nada.
- En modo colocación se marcan las casillas válidas y, con puntero fino, se previsualiza el sprite.

El espino es la planta defensiva. Bloquea porque ocupa una casilla, igual que las demás, y además devuelve daño. No sustituye a la cerbatana: no tiene proyectil.

## Selección

Implementado solo sobre casillas ocupadas. Persiste hasta otra planta, una casilla vacía, un pulsar fuera del canvas (el catálogo y el aviso de derrota, marcados `data-interfaz`, no cuentan) o hasta entrar en modo colocación, que la limpia.

Al seleccionar una planta, la barra muestra su vida actual y máxima y el dato principal (daño y alcance, o reflejo). No hay barras sobre el tablero. No abre mejoras.

El hover (borde de hormigas) solo sigue a mouse y lápiz. El toque no genera hover.

## Enemigos y combate

Tres enemigos comparten `src/combate.js`. El escarabajo conserva vida 12, velocidad 0,5, daño 2 e intervalo 1. El pulgón alado: vida 4, velocidad 1,05, daño 1, intervalo 0,65. La oruga: vida 28, velocidad 0,28, daño 3, intervalo 1,25; camina, no vuela. Esas cifras son el punto de partida medido en [BALANCE.md](BALANCE.md), no un cierre.

- Las oleadas las arma `src/oleadas.js` con una semilla. La primera es fija. Desde la tercera puede salir la oruga.
- Si el perímetro está ocupado, el insecto aparece justo afuera y muerde la planta del borde. No hay reintento infinito.
- Posición continua, en unidades de casilla. La casilla `i` es el intervalo `[i, i+1)`.
- El escarabajo vuela a 3 px y el pulgón a 2 px. La oruga queda en el suelo. Ninguno atraviesa plantas: el bloqueo es el de siempre.
- Al fijar objetivo, el volador aterriza y se alimenta. La oruga contrae el cuerpo y baja la cabeza al morder. Al perder la planta, el volador despega. Esos estados son solo visuales; ver [ART_DIRECTION.md](ART_DIRECTION.md).
- Camino directo hacia el centro de la central. Si la casilla inmediata en esa dirección tiene una planta viva, se detiene y la ataca. Al destruirla, la casilla se libera y sigue.
- La cerbatana elige el enemigo vivo más cercano a distancia ≤ alcance, apunta con una predicción corta y dispara con cadencia propia.
- El proyectil tiene posición, dirección y velocidad. El daño ocurre al cruzar el radio del enemigo, con barrido del segmento para no atravesarlo entre frames. Si agota su distancia máxima, desaparece.
- Entidades con vida actual y máxima. Al recibir daño hay un destello breve. Sin barras de vida.
- El escarabajo muerto se desintegra píxel a píxel y luego sale de la lista.
- Una planta destruida libera la casilla al momento, se marchita por opacidad y al terminar se retira junto con su luz.

## Intención futura, todavía no diseñada

No hay cartas ni preguntas. No inventarlas.

- **Oleadas.** Implementadas como director procedural. El presupuesto y el ritmo son experimentales.
- **Más plantas y enemigos.** Hay dos plantas comprables y tres insectos. No hay una cuarta especie.
- **Economía.** El goteo de 1/s sigue. El coste crece con las vivas. No hay cosecha ni recompensa.
- **Preguntas de personalidad.** Durante la partida, no como un RPG narrativo. El gancho entre oleadas está vacío.
- **Tarot.** La respuesta entrega una carta. El símbolo, la respuesta y la modificación de una o varias plantas tienen que relacionarse de verdad. No hay lista de arcanos ni de efectos.
- **Sonido, pulido visual e integración** en la web personal. Ver [ROADMAP.md](ROADMAP.md).

## Pendiente de diseño

- Si el presupuesto calibrado se queda. La medición de 100 semillas está en [BALANCE.md](BALANCE.md). No es una prueba de diversión humana.
- Si el espino debe reflejar más. En el simulador, una distribución de solo cerbatanas dura al menos tanto como la que compra espinos.
- Qué hace el insecto vivo cuando la central cae.
- Licencia y visibilidad del repositorio. No están elegidas.
