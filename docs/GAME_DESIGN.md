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
2. Con esa energía se compra la única planta del catálogo, la cerbatana.
3. Solo se planta en una casilla libre, dentro del tablero, vecina en alguna de las ocho direcciones a una planta ya viva, y si la energía alcanza.
4. El jardín crece desde las plantas existentes. La central no se compra ni se duplica.
5. A los 20 segundos aparece un escarabajo en el perímetro. Camina hacia la central, no atraviesa plantas y muerde a la que le bloquea el paso hasta destruirla.
6. La cerbatana dispara sola al enemigo más cercano dentro de su alcance circular, en cualquier ángulo.
7. Si la central muere, la partida se detiene: no sube energía, no se compra y no se combate. Las animaciones pendientes terminan (marchitez, desintegración) y, al apagarse la central, aparece el aviso «el jardín cayó» con el botón para reiniciar.

No hay oleadas, recompensas, segundas especies, mejoras, tarot, sonido ni progresión entre partidas.

## Condiciones

| Situación | Estado |
| --- | --- |
| Derrota | La planta central queda con vida ≤ 0. `src/combate.js` lo expone como `derrota()`. Desde ese paso el combate no dispara, no muerde y no mueve, y los proyectiles en vuelo desaparecen. |
| Final visual | Al terminar la marchitez de la central (1,2 s), `src/derrota.js` muestra el aviso con un fundido de 1,8 s. La luz de la central baja con su opacidad: halo y ambiente se apagan de forma continua. |
| Victoria | No existe. Sobrevivir al único escarabajo no termina la partida. |
| Pausa | Ocultar la pestaña cancela el `requestAnimationFrame` y, al volver, el acumulador arranca de cero. No hay botón de pausa. Verificado solo con `visibilitychange` forzado. |
| Reinicio | Derriba la partida y crea otra: energía a 0, solo la central, sin el escarabajo anterior. Probado en dos rondas seguidas: los tiempos de aparición coinciden y la energía vuelve a 0. |

La derrota no congela la escena: se apaga. Las plantas que siguen en pie no se marchitan; el escarabajo vivo queda en su último cuadro. Ver la pendiente en [ROADMAP.md](ROADMAP.md).

## Planta central

Implementado. No es comprable. Ocupa la casilla `(5, 5)` de un tablero 11×11. Vida 30. No ataca. Su luz es dinámica (pulso, impulso al generar energía, ondulación). Ver `PLANTAS.central` en `src/catalogo.js` y `LUZ` en `src/config.js`.

## Economía

Implementado y provisional. La energía empieza en 0 y sube 1 por segundo mientras la simulación corre. El indicador muestra el entero. La cerbatana cuesta 10 y solo se descuenta al colocarla en una casilla válida. El detalle numérico está en [BALANCE.md](BALANCE.md).

No hay otras fuentes de energía ni recompensa por matar.

## Plantas, catálogo y expansión

Implementado un solo tipo ofensivo: **Cerbatana**, coste 10, vida 12. El catálogo es una tarjeta dibujada en canvas (`src/catalogoUI.js`), no un componente web genérico. Estados reales de la tarjeta: disponible, seleccionada (modo colocación) e insuficiente.

La colocación (`src/colocacion.js`, `src/jardin.js`):

- Modo colocación al pulsar la tarjeta, si hay energía.
- Volver a pulsarla, pulsar fuera del tablero y del catálogo, o Escape, cancela.
- Un toque o clic en una casilla válida planta, gasta la energía y sale del modo.
- Una casilla inválida no gasta nada.
- En modo colocación se marcan las casillas válidas y, con puntero fino, se previsualiza el sprite.

La intención confirmada habla de plantas ofensivas **y** defensivas. En el código no hay ninguna planta defensiva distinta de la central, y la central no bloquea por diseño de rol: bloquea porque ocupa una casilla, como cualquier planta.

## Selección

Implementado solo sobre casillas ocupadas. Persiste hasta otra planta, una casilla vacía, un pulsar fuera del canvas (el catálogo y el aviso de derrota, marcados `data-interfaz`, no cuentan) o hasta entrar en modo colocación, que la limpia.

No muestra estadísticas ni abre mejoras. El propietario pidió que la selección no exista donde no hace nada, y también conservarla para estadísticas futuras. Hoy es un marcado visual. Decisión pendiente: quitarla hasta que tenga efecto, o dejarla como está.

El hover (borde de hormigas) solo sigue a mouse y lápiz. El toque no genera hover.

## Enemigos y combate

Implementado un solo enemigo, el escarabajo, y un solo disparo, el de la cerbatana. Reglas en `src/combate.js`:

- Un escarabajo, una vez, en una casilla libre del perímetro. No reaparece solo.
- Posición continua, en unidades de casilla. La casilla `i` es el intervalo `[i, i+1)`.
- Vuelo a 3 píxeles sobre el suelo, con una oscilación decorativa de ±1 px. Vuela sobre el jardín, pero no atraviesa plantas: el bloqueo es el mismo de siempre.
- Al fijar objetivo aterriza en 0,3 s (alas bajas, luego patas abiertas), se orienta hacia la planta y se alimenta: cada mordida baja la cabeza un instante.
- Al perder su planta despega y continúa hacia la central. Estos estados son solo visuales; ver [ART_DIRECTION.md](ART_DIRECTION.md).
- Camino directo hacia el centro de la central. Si la casilla inmediata en esa dirección tiene una planta viva, se detiene y la ataca. Al destruirla, la casilla se libera y sigue.
- La cerbatana elige el enemigo vivo más cercano a distancia ≤ alcance, apunta con una predicción corta y dispara con cadencia propia.
- El proyectil tiene posición, dirección y velocidad. El daño ocurre al cruzar el radio del enemigo, con barrido del segmento para no atravesarlo entre frames. Si agota su distancia máxima, desaparece.
- Entidades con vida actual y máxima. Al recibir daño hay un destello breve. Sin barras de vida.
- El escarabajo muerto se desintegra píxel a píxel y luego sale de la lista.
- Una planta destruida libera la casilla al momento, se marchita por opacidad y al terminar se retira junto con su luz.

## Intención futura, todavía no diseñada

No hay nombres, cartas, preguntas ni enemigos acordados más allá de lo que ya está en el código. No inventarlos.

- **Oleadas.** Varios insectos a lo largo de la partida, con dificultad que crece. Hoy el encuentro es único y fijo.
- **Más plantas y enemigos.** Ofensivas y defensivas, cada una con un rol legible.
- **Economía y progresión.** Además del goteo de 1/s, si el propietario lo pide.
- **Preguntas de personalidad.** Durante la partida, no como un RPG narrativo.
- **Tarot.** La respuesta entrega una carta. El símbolo, la respuesta y la modificación de una o varias plantas tienen que relacionarse de verdad. No hay lista de arcanos ni de efectos.
- **Sonido, pulido visual e integración** en la web personal. Ver [ROADMAP.md](ROADMAP.md).

## Pendiente de diseño

- Si el primer escarabajo debe ser tan fácil. Con una cerbatana colocada en cualquier punto cercano muere en 2 a 2,3 s, sin tumbar la central. Los resultados están en [BALANCE.md](BALANCE.md). Lo que el propietario decide es si la introducción debe ser más exigente o si esto ya enseña la mecánica.
- Si la selección visual se queda.
- Qué hace el escarabajo vivo cuando la central cae.
- Licencia y visibilidad del repositorio. No están elegidas.
