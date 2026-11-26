# Balance

Fuente de verdad: `src/config.js`, leído por `src/catalogo.js` y `src/combate.js`. Si un número de aquí no coincide con ese archivo, gana el archivo. Esta nota no se importa desde el juego.

La configuración de la etapa 07 y sus resultados están al final de esta nota. Las cifras anteriores se conservan como referencia histórica para comparar etapas.

Unidades: vida y daño en puntos, tiempo en segundos, distancia en casillas, velocidad en casillas/segundo. El tablero es 11×11 y la central está en `(5, 5)`.

## Valores vigentes

Confirmados contra `src/config.js` y `src/catalogo.js` en esta consolidación.

Energía, `ENERGIA`:

| Campo | Valor |
| --- | --- |
| inicial | 0 |
| porSegundo | 1 |

`BALANCE`:

| Campo | Valor |
| --- | --- |
| aparicionEscarabajo | 20 s |
| central.vida | 30 |
| cerbatana.vida | 12 |
| cerbatana.alcance | 3 casillas (radio de adquisición) |
| cerbatana.dano | 4 |
| cerbatana.intervalo | 1 s |
| cerbatana.velocidadProyectil | 6 casillas/s |
| cerbatana.alcanceMaximo | 4,5 casillas (vuelo del proyectil) |
| cerbatana.coste | 10 de energía, en `PLANTAS` (`src/catalogo.js`), no dentro de `BALANCE` |
| escarabajo.vida | 12 |
| escarabajo.velocidad | 0,5 casillas/s |
| escarabajo.dano | 2 |
| escarabajo.intervalo | 1 s |
| escarabajo.radio | 0,4 casillas (colisión) |

Tiempos visuales, `BALANCE.visual`, en segundos: destello 0,2; disparo 0,25; retroceso 0,12; desintegración 0,7; marchitez 1,2; aterrizaje 0,3; despegue 0,25; mordisco 0,2.

Presentación del insecto, `INSECTO` (no afecta a reglas): altura de vuelo 3 px, oscilación de 0,9 s, antenas cada 1,6 s durante 0,25 s, sombra con alfa base 0,12 y 0,06 por píxel de altura.

El paso de simulación es 1/60 s y un frame no aporta más de 0,1 s (`SIMULACION`). Eso no es balance de juego; evita que un cuelgue se convierta en un salto de reglas.

## Relaciones

Tiempo hasta la primera cerbatana, sin gastar antes: `coste / porSegundo` = 10 s. A los 20 s, si se compró en ese instante, la energía vuelve a estar en 10.

Disparos para matar al escarabajo: `ceil(12 / 4)` = 3. Cadencia 1 s y el enfriamiento nace en 0, así que el primer tiro sale en el paso en que entra en alcance y el tercero a los 2 s de ese momento, más el vuelo. DPS teórico de la cerbatana, sin contar el viaje: `4 / 1` = 4.

El proyectil recorre como mucho 4,5 casillas a 6 por segundo: 0,75 s de vuelo. En el borde del alcance (3 casillas) tarda 0,5 s. `alcanceMaximo` es mayor que `alcance`: el código no dice por qué. Encaja con apuntar un poco por delante del enemigo y dejar que el tiro llegue.

Mordiscos para tumbar la central: `30 / 2` = 15. El enfriamiento del escarabajo nace en 0, así que el primero cae en el paso en que fija objetivo y luego uno por segundo. De la mordida 1 a la 15 pasan 14 s. La cerbatana aguanta `12 / 2` = 6 mordiscos, unos 5 s entre el primero y el último.

Distancia geométrica hasta el centro de la central, si nada ocupara el camino:

- Desde el centro de un borde alineado, 5 casillas a 0,5/s → 10 s.
- Desde una esquina, `sqrt(5² + 5²) / 0,5` ≈ 14,1 s.

El contacto ocurre antes: el escarabajo se detiene a media casilla de la planta que ocupa la casilla siguiente. Esos 10 y 14 segundos son un techo del viaje, no el instante del primer mordisco.

## Resultados de simulación

Escenarios deterministas, con los módulos reales del juego (`tests/escenario.mjs`, sin DOM, paso 1/60 s, aparición a los 20 s en la entrada indicada, cerbatanas sembradas sin coste). Las pruebas de `tests/escenarios.test.mjs` fijan algunos de estos resultados.

**Sin defensa.** La central cae a 42 s desde el inicio con entrada oeste, norte o este, y a 45,7 s desde una esquina. Los primeros mordiscos llegan a los 28 s (31,7 s desde la esquina), unos 8 a 12 s después de la aparición. Es el techo de la partida si el jugador no actúa.

**Una cerbatana, cuatro entradas.** Cerbatana en diagonal NO `(4,4)`, comprada a los 10 s:

| Entrada | Entra en alcance | Muere | Mordiscos |
| --- | --- | --- | --- |
| oeste | 22,3 s | 24,5 s | 0 |
| norte | 22,3 s | 24,5 s | 0 |
| esquina NO | 25,3 s | 27,5 s | 0 |
| este (lado opuesto) | 26,3 s | 28,6 s | 1 |

Tiempo entre entrar en alcance y morir: 2 a 2,3 s, que son tres disparos a 1 por segundo más el viaje. Una cerbatana basta para ganar el encuentro contra un escarabajo en todos los puntos de entrada probados.

**Otras ubicaciones de una sola cerbatana, comprada a los 10 s.** Con entrada oeste o norte, el escarabajo muere entre 24 y 28 s con 0 o 1 mordisco, en las cuatro posiciones adyacentes probadas. Desde una esquina muere entre 27 y 31 s, con 0 o 1 mordisco. La cerbatana en el camino directo `(4,5)` no recibe ningún mordisco si se coloca a los 10 s; el escarabajo muere antes de llegar.

**Colocación tardía (entrada oeste).** Si la cerbatana está lista a los 25 s (el escarabajo ya en camino), muere entre 27 y 28 s con 0 a 2 mordiscos; la de `(4,5)` deja dos. Si se coloca a los 30 s, después de la primera mordida, la central sigue en pie y el escarabajo muere.

**Dos cerbatanas.** Mueren en 24–29 s, sin derrota. El segundo disparo solo aparece como exceso (cuatro disparos para tres impactos) cuando ambas apuntan a la vez.

Conclusión de la etapa: el primer encuentro cumple lo pedido. Sin acción la central cae; con una cerbatana colocada en cualquier lugar cercano el escarabajo muere antes de consumir la central. Es fácil de superar y da una derrota clara si no se actúa. No se cambió ningún número. Un cambio de vida, daño o alcance sería una corrección de presentación, no de balance, y no hay un resultado que lo justifique.

Lo que la simulación no mide: la decisión del jugador (tiempo de pensar la colocación), la energía real acumulada, y la aparición aleatoria del perímetro. Las entradas probadas son las centrales de cada lado y dos esquinas, no las 40 casillas de borde.

## Etapa 06, experimental

Los números de abajo salen de `src/config.js` después de calibrar con semillas 1001–1020. La validación usó otras semillas, 1–100, y no se volvió a tocar la fórmula. No son un cierre.

Presupuesto de la oleada `n`, con `k = n − 1`:

- Si `n ≤ 12`: `12 + 8k + 3k²`.
- Si `n > 12`: el valor de la oleada 12 más `30 × (n − 12)`.

La oleada 1 no gasta ese presupuesto al azar: son dos escarabajos (amenaza 3) y tres pulgones (amenaza 2). La oruga (amenaza 8) entra desde la oleada 3. Preparación inicial 20 s, las siguientes 15 s. La ventana de salida es `min(48, 18 + 3k)` segundos. El máximo simultáneo es `min(48, 6 + 3k)`; lo que no cabe espera, no se borra.

Coste: `base + 2 × floor(vivas / 4)`, con bases 10 y 8. `ECONOMIA.creciente = false` lo apaga.

La adaptación, si está activa, solo estira o comprime las pausas entre grupos un 12 %. No cambia vidas ni el presupuesto.

## Medición, semillas 1 a 100

Horizonte 20 minutos, paso 1/60 s, módulos reales. Cuatro políticas automáticas. 100 semillas cada una. Los que llegan al horizonte no murieron: el percentil 50 queda en 20,0 cuando más de la mitad sobrevive. Minutos:

| Política | Llegan a 20 min | p10 | p50 | p90 | Oleada p50 |
| --- | --- | --- | --- | --- | --- |
| Principiante | 0 | 1,7 | 3,3 | 8,0 | 5 |
| Intermedio | 52 | 12,7 | 20,0 | 20,0 | 20 |
| Especializado | 13 | 16,6 | 18,3 | 20,0 | 18 |
| Solo cerbatanas | 60 | 17,7 | 20,0 | 20,0 | 20 |

El principiante cae cerca de los 3–7 minutos pedidos. El especializado pasa los 15 en el percentil 10. El intermedio no se queda en 10–16: la mitad de esas partidas automáticas llega al horizonte, la otra cola baja hasta 12,7. No es una curva estrecha.

La política de solo cerbatanas dura al menos tanto como la que compra espinos. Con reflejo 1, el espino no le gana la casilla a otra cerbatana en este simulador. Eso no dice que un jugador humano lo encuentre inútil en un carril fino.

El detalle agregado está en `docs/simulacion.json`. Estas políticas no miden diversión.

## Qué no entra en el balance

No hay recompensa por baja ni otra fuente de energía. La propuesta previa, ya superada, está en [PROPUESTA_OLEADAS.md](PROPUESTA_OLEADAS.md).

## Etapa 07 · profundidad estratégica

La [simulación de la etapa 06](simulacion.json) queda como referencia histórica. Allí llegaban a 20 minutos el 60 % de las partidas de solo Cerbatanas, el 52 % de las intermedias y el 13 % de las especializadas. Las políticas y el director cambiaron en esta etapa. Esas cifras permiten comparar el resultado global de dos versiones, sin aislar por sí solas la contribución de una planta.

### Configuración jugable experimental

| Planta | Coste base | Vida | Efecto |
| --- | ---: | ---: | --- |
| Cerbatana | 10 | 12 | 4 por proyectil, intervalo 1 s, alcance inicial 3 |
| Espino | 8 | 54 | 3 de reflejo por mordida |
| Campanilla | 14 | 16 | −30 % a la velocidad de desplazamiento dentro de 2 casillas |
| Hongo | 18 | 16 | 4 por enemigo cada 2,5 s dentro de 1,5 casillas |

- **Cerbatana.** 4 puntos por segundo en el caso ideal, 0,4 por segundo y por energía base. Una ráfaga sobre un solo carril puede desperdiciar proyectiles por trayectorias agotadas o daño sobrante. El coste de repetirla sigue creciendo por bloques de cuatro plantas vivas.
- **Campanilla.** En un trayecto totalmente cubierto, 2 s se convierten en 2,86 s. Este 43 % adicional depende de cuánto trayecto cruza el radio y de si una planta ofensiva puede disparar en ese tramo. Se aplica el efecto más fuerte, solo durante el avance. Las mordidas mantienen su ritmo.
- **Hongo.** Tiene 1,6 puntos por segundo por objetivo frente a los 4 de una Cerbatana. Tres insectos dentro llevan el rendimiento a 4,8 puntos por segundo. En rendimiento por energía base, el punto de cruce está en cinco insectos (8/18 ≈ 0,44). Subir el pulso de 3 a 4 permite dar de baja a un pulgón de un solo pulso. Activación y daño comparten el radio de 1,5 para evitar disparos vacíos y mantenerlo especializado.
- **Espino.** Pasa de 4,5 a 6,75 puntos de vida por energía base. Ante mordidas de 3, absorbe hasta 18 golpes y devuelve hasta 54 puntos en total mientras siga vivo, con daño efectivo menor cuando hay remates. El efecto exige que los insectos lo alcancen. Frente a cinco orugas con una Cerbatana detrás, el Espino de 36/1 absorbió 36 puntos y la central cayó. El de 54/3 absorbió 54, se perdió y la Cerbatana y la central sobrevivieron. El de 60/3 también defendió la central en ese escenario. Se eligió la menor vida de esos dos resultados favorables. El coste de reponerlo sigue siendo 8 al perder el único Espino.
- **Oruga y pulgón.** La primera mordida de la oruga tarda 0,45 s al fijar un bloqueo. Después conserva el intervalo de 1,25 s. Los pulgones de un paquete nacen juntos y varían entre 94 % y 106 % de su velocidad nominal para que el grupo se estire sin perder cohesión.
- **Economía y presión.** La partida permite comprar Cerbatana a los 10 s, Espino a los 8 s o esperar a Campanilla/Hongo a los 14/18 s. El primer insecto entra alrededor de 21 s. El descanso posterior sigue en 15 s. El presupuesto usa `redondear(12 + 4k + 0,7k²)` hasta la oleada 12 (`k = oleada − 1`) y suma 18 por oleada después. Se redujo el crecimiento de amenaza al observar que la revisión, con la curva anterior, comprimía casi todas las estrategias a unos pocos minutos.

### Escenarios controlados

`node scripts/escenarios-etapa07.mjs` recrea los enfrentamientos descritos arriba. Frente a cinco pulgones agrupados, el Hongo causó los 20 puntos de daño requeridos y terminó sin bajas propias. La Cerbatana causó 12 y terminó en derrota. Es una comparación situacional con costes de 18 y 10, respectivamente.

Se compararon patrones en la oleada 9 con el mismo jardín, la misma composición por semilla y 24 semillas. El daño medio a la central fue 2,46 en concentrada, 0,38 en pinza, 0,08 en enjambre y 0,88 en distracción. Las duraciones medianas quedaron entre 52,7 y 54,1 s. La concentrada sigue requiriendo una respuesta más fuerte en ese jardín concreto. Los datos agregados de oleadas completadas en partidas completas están disponibles en el JSON, pero incluyen jardines, presupuestos y estados distintos.

### Validación con semillas independientes

`node tests/corrida.mjs 10001 100 1200 > docs/simulacion-etapa07.json` reproduce la [validación](simulacion-etapa07.json). Se usaron las semillas 10001–10100 después de calibrar con 1–12. El horizonte de 20 minutos es del simulador. Las partidas que llegaron al horizonte están censuradas y no cuentan como derrotas ni prueban cuánto habrían seguido.

| Política | Supervivencia p10 / mediana / p90 (min) | Al horizonte de 20 min |
| --- | --- | ---: |
| Principiante | 1,8 / 6,7 / 20,0 | 23 |
| Intermedia | 10,2 / 16,1 / 20,0 | 27 |
| Especializada | 19,8 / 20,0 / 20,0 | 89 |
| Solo Cerbatanas | 6,3 / 9,0 / 11,4 | 0 |
| Daño de área | 6,0 / 9,3 / 13,2 | 0 |
| Protección | 7,1 / 9,5 / 12,0 | 0 |
| Ralentización | 8,3 / 16,2 / 20,0 | 20 |
| Diversificada | 7,9 / 12,7 / 19,0 | 9 |
| Reactiva | 18,6 / 20,0 / 20,0 | 84 |

Las cinco políticas de composición comparten evaluación de costes y casillas, con distinto catálogo disponible. La reactiva añade la presión de los insectos visibles. La especializada, además, puede guardar energía para apoyo entre ataques. La principiante conserva una heurística de colocación simple y la intermedia alterna oportunidades de compra.

En la política intermedia, la primera compra fue a los 10,3 s y la primera amenaza a los 20,8 s en mediana. El intervalo más largo entre compras fue de 56,3 s en mediana, contando también hasta el final de la corrida. El registro además conserva daño efectivo por planta, energía generada/gastada/sobrante, compras y pérdidas, ocupación final, tiempo crítico y exposición conjunta a la ralentización en enemigo-segundos. El daño absorbido por el Espino registra golpes efectivos. El daño realmente evitado a otras plantas solo se puede estimar comparando jardines en el mismo escenario. La economía carece de tope, por lo que el saldo final mide energía sin gastar y no energía descartada.

Las políticas de protección y área mejoran poco la mediana respecto de solo Cerbatanas, aun cuando ganan enfrentamientos concretos. La colocación sigue explicando buena parte de esa brecha. La política reactiva llega con frecuencia al horizonte, por lo que quedan por caracterizar la presión después de 20 minutos, la dispersión de las primeras derrotas principiantes y la conducción de una partida humana. Las comprobaciones en Chromium cubren compra, previsualización táctil emulada, primera oleada con las plantas nuevas, derrota y reinicio. Falta evaluar una sesión humana completa y teléfonos físicos.

### Variantes descartadas en calibración

`node scripts/calibrar-etapa07.mjs` reproduce la [calibración comparativa](calibracion-etapa07.json) con 12 semillas. Cada variante cambia una familia de parámetros. Para aislar la utilidad del catálogo, comparar solo Cerbatanas, protección, área, ralentización y jardín diversificado dentro de la misma fila.

| Variante respecto de la elegida | Resultado de la exploración | Decisión |
| --- | --- | --- |
| Espino 36/1, 48/2 o 60/3 | Sin diferencia en las medianas de estas 12 semillas. El escenario fijo sí mostró una diferencia cuando el Espino interceptó a las orugas. | 54/3 por el escenario de desgaste. |
| Hongo con 3 de daño | Mediana de área de 508 s frente a 563 s. | 4 de daño para resolver el grupo de pulgones. |
| Hongo con radio 1,75 | Área de 572 s y diversificada de 1066 s frente a 563 y 998 s. | 1,5 para preservar la distinción de alcance con la Cerbatana. |
| Energía a 1,12 por segundo | Principiante 227 s e intermedia 1131 s frente a 201 y 969 s. | Mantener una unidad por segundo. |
| Coste fijo | Área 651 s y ralentización 766 s frente a 563 y 1200 s. | Mantener el incremento por cantidad viva. |
| Mayor presupuesto de amenaza | Intermedia 763 s y diversificada 684 s frente a 969 y 998 s. | Mantener la curva gradual. |
| Grupos más apretados | Intermedia 695 s y diversificada 621 s frente a 969 y 998 s. | Conservar la ventana y la compensación parcial elegidas. |

Las medianas de calibración sirven para seleccionar variantes. La tabla de validación usa semillas distintas.

La [corrida extendida](simulacion-etapa07-extendida.json) repitió las 100 semillas de las políticas especializada y reactiva con horizonte de 30 minutos. Sus medianas fueron 24,5 y 23,5 minutos. Llegaron al nuevo horizonte 2 y 1 partidas, respectivamente. Se reproduce con `node tests/corrida.mjs 10001 100 1800 especializado reactivo`.
