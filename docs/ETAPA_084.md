# Etapa 08.4 · invasiones y reorganización

## Director

El ciclo es preparación (20 s iniciales, luego 17 s), combate, resolución y recompensa. La resolución ocurre cuando se emitió toda la cola y murió el último enemigo. Ahí entra la fase de recompensa con el resultado ya escogido. La presentación usa su propio tiempo y dura 2,5 s, con revelado a 1,65 s y opción de adelantar o continuar. Con movimiento reducido revela directamente y dura 0,45 s. Durante el premio se detienen el combate, la energía, las compras, la pala y la preparación siguiente. Pausa y visibilidad detienen también esa presentación.

Cada invasión divide su ventana en tramos de unos 14 s. Cada tramo recibe densidad y un foco con sesgo variable; la distribución de base usa las casillas únicas de cada lado. Los cuatro lados pesan desde el comienzo. El peso por ausencia aumenta gradualmente durante 31 s sin consultar las defensas del jugador. Un grupo suele compartir una entrada y su vecindad. Cada integrante adicional puede abrir otro frente con probabilidad 23 %. La ocupación se consulta al emitir. Si la casilla está ocupada, el organismo entra por afuera. Las velocidades de las especies producen diferencias de llegada sin alinearlas a un segundo objetivo.

La ventana nominal es `min(109, 45 + 14k)`, con variación de ±6 %, para `k = oleada − 1`. El presupuesto es `34 + 27k + 5k²` hasta la duodécima y suma 90 por oleada desde ahí. Un pulgón cuesta 2 de amenaza, un escarabajo 3 y una oruga 8. La oruga empieza en la tercera y recibe como máximo 45 % del presupuesto. El cupo simultáneo sigue `min(48, 6 + 3k)` y una entrada en espera sigue programada. La ventana y el presupuesto son independientes del daño que reciba el jugador. La alternancia de picos y respiros toma como referencia el trabajo de ritmo del director de Valve. [The AI Systems of Left 4 Dead, Mike Booth](https://cdn.cloudflare.steamstatic.com/apps/valve/2009/ai_systems_of_l4d_mike_booth.pdf)

## Economía

- **Energía pasiva.** Se genera 1/s hasta 24 s después de la ventana de entradas. Pasado ese margen, la central descansa y la invasión sigue su curso. Dejar vivo al último insecto no produce energía una vez alcanzado el límite.
- **Pala.** Disponible desde la oleada 3 (`PALA.desdeOleada`). Devuelve `floor(costePagado × 0,50)`. Las plantas sembradas para pruebas y las bajas enemigas no abonan energía. La retirada libera la casilla, elimina su luz y desvincula a los enemigos. Un atacante repuesto allí durante 2,5 s hereda el rearme restante. Vender y reponer una planta de 10 cuesta 5 netos incluso en el escalón más barato. Las demás plantas conservan su posición y las compras futuras siguen la regla de vecindad.
- **Premio.** En producción se renormalizan los pesos 50:20 a 5/7 y 2/7. Después de un vacío, la siguiente tirada entrega energía. A largo plazo la cadena da 7/9 de energía y 2/9 de vacío. El premio, cuando toca, es `min(40, 10 + 4 × (n − 1))`, con un valor esperado de largo plazo de 31,1 de energía por oleada al alcanzar el tope. El sorteo usa un flujo independiente del director, los efectos y la política del simulador.
- **Tarot de desarrollo.** `montarHerbario(contenedor, { recompensas, alTarot })` acepta una configuración de prueba con `tarot: true`. Con tarot activo se restauran los pesos 50:30:20, se retira el peso de vacío después de un vacío y se fuerza tarot en la cuarta oleada sin acceso. Una vez revelado y confirmado, `alTarot(premio, resolver)` recibe el resultado y el juego espera a `resolver()`. Producción deja este resultado deshabilitado.

## Calibración

Se probaron pendientes de amenaza 18/3, 23/4 y 27/5 para los términos lineal y cuadrático, con ocho semillas por política en tres políticas y 15 min de horizonte. La pendiente de 27/5 aumenta la presión en el tramo medio y conserva cierres de seis a ocho invasiones en las políticas más sólidas. La ventana inicial pasó de 43 a 45 s y el techo de 103 a 109 s.

En un piloto aparte de 24 semillas de jardín compacto hasta la primera resolución, limitar el primer grupo a dos integrantes bajó la mediana del mayor hueco entre entradas de 13,6 a 8,0 s y el tiempo sin amenazas de 14,5 a 9,6 s. El combate mediano mantuvo prácticamente la misma duración, alrededor de 49,6 s. Desde la segunda invasión pueden salir grupos de hasta cuatro integrantes.

Para la pala se compararon 12 semillas de reorganización y 12 de reciclaje agresivo. Cobrar según salud restante bajó la mediana recuperada de 35 a 4 en la política de reorganización a 15 min. El reciclaje recuperó 772 con reembolso fijo y 646 con salud. Se eligió el fijo para mantener el valor de retirar una planta dañada y conservar un cálculo visible y predecible. El reciclaje sigue pagando las compras completas y penaliza la defensa por la pérdida de tiempo y posición.

La referencia 08.3 se ejecutó desde el commit base con políticas equivalentes. La validación separada de 08.4 usa las semillas 1200–1299. Los cortes de 5, 10, 15, 20 y 30 min cuentan la presentación de premios en el reloj total. Las estadísticas de duración y presión incluyen las invasiones completadas; las políticas son modelos reproducibles de decisiones, sin validación de preferencia humana.

## Validación con 800 partidas

100 partidas por política, hasta 30 min. Los cortes incluyen quienes murieron con anterioridad con su número final de invasiones. «Vivas» indica cuántas partidas seguían activas en cada corte.

| Política | Mediana de supervivencia | Completas 5/10/15/20/30 min | Vivas 5/10/15/20/30 min | Compras / retiros medianos |
| --- | ---: | --- | --- | ---: |
| Mixta compacta | 26,1 min | 3/5/7,5/10/12 | 100/100/100/100/6 | 132 / 0 |
| Cerbatanas radiales | 24,5 min | 3/5/8/10/12 | 100/100/100/100/0 | 30 / 0 |
| Reactiva | 18,0 min | 3/5/8/9/9 | 96/91/74/11/0 | 74,5 / 0 |
| Especializada | 17,8 min | 3/5/8/9/9 | 97/92/80/9/0 | 73 / 0 |
| Diversificada exterior | 12,6 min | 3/5/6/6/6 | 100/85/19/0/0 | 54 / 0 |
| Cerbatana y Espino | 9,4 min | 3/5/5/5/5 | 96/40/0/0/0 | 22 / 0 |
| Reorganización selectiva | 27,7 min | 3/5/7/10/13 | 100/100/100/100/6 | 154,5 / 31,5 |
| Reciclaje agresivo | 14,6 min | 3/5/7/7/7 | 100/96/25/0/0 | 155,5 / 138 |

La mixta compacta completaba 16 invasiones al minuto 15 en la referencia de 08.3 y entre 7 y 8 en la nueva validación. El monocultivo radial sigue siendo fuerte y requiere seguimiento. La mixta compacta y la reorganización selectiva duran más en mediana. La prueba de reciclaje recuperó 775,5 de energía en mediana y gastó 1754. La selectiva recuperó 217 y gastó 2141, con más de 13 minutos de ventaja en supervivencia mediana.

### Ritmo y presión del jardín compacto

Valores medianos. La primera aparición cae a 0,65 s desde el cambio de fase. «Sin amenaza» suma segundos sin enemigos vivos, que también pueden estar repartidos dentro del combate.

| Invasión | Combate (s) | Última entrada (s) | Mayor hueco de entradas (s) | Sin amenaza (s) | Máximo simultáneo | Amenaza por segundo |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 49,8 | 44,8 | 7,9 | 9,7 | 3 | 0,68 |
| 2 | 64,2 | 59,1 | 9,3 | 8,7 | 5 | 1,03 |
| 3 | 79,8 | 73,1 | 10,9 | 6,8 | 6 | 1,35 |
| 4 | 93,5 | 87,5 | 9,2 | 3,6 | 7 | 1,71 |
| 5 | 107,1 | 100,6 | 8,0 | 2,6 | 8 | 2,07 |
| 6 | 116,6 | 110,7 | 6,5 | 1,2 | 10 | 2,52 |
| 7 | 115,4 | 109,3 | 5,0 | 0,6 | 12,5 | 3,26 |
| 8 | 117,4 | 109,2 | 3,9 | 0,6 | 15 | 3,99 |

En la mixta compacta, la amenaza acumulada de norte, este, sur y oeste fue 133 106, 112 947, 131 715 y 113 300, respectivamente. El daño de mordidas atribuido al lado por el que nació cada insecto fue 48 426, 44 635, 45 460 y 44 427. La desigualdad espacial suave corresponde también al número de casillas por lado, 11/9/11/9. La subida de 0,68 a 3,99 de amenaza/s entre las oleadas 1 y 8 va acompañada de un goteo constante de 1/s. En el jardín compacto, la energía generada en mediana fue 1535, la premiada 274 y el gasto total 1789, con 126 plantas perdidas. El presupuesto creciente obliga a cubrir y reponer varios frentes conforme se agota la reserva.

Hubo 5534 resultados de energía (78,3 %) y 1536 vacíos (21,7 %). En las Compactas, el cuartil que menos energía recibió por sus primeras cuatro tiradas obtuvo 36 en mediana y duró 26,2 min. El cuartil superior obtuvo 64 y duró 25,8 min. El corte compara partidas con cuatro tiradas resueltas y no aísla causalidad.

Para repetir la validación: `node scripts/medir-etapa084.mjs compacta concentracion reactivo diversificado especializado proteccion reorganiza reciclaje`. El JSON por política conserva los resultados, incluidas entradas, daño, gastos, reembolsos y suerte. La salida cubre los cortes de 15 y 20 dentro del mismo horizonte de 30 min.

## Navegador

Una política compacta compró mediante los controles visibles y usó la pala entre invasiones con el reloj normal. Las dos primeras invasiones duraron 45,8 y 60,9 s y ambas emitieron enemigos por los cuatro lados; la primera cargó más al este y al sur, la segunda distribuyó más entre las cuatro entradas. Hubo +10 de energía tras la primera y un vacío tras la segunda. La verificación automatizada separada cubrió un reembolso de 5 con compra de 10, doble toque, congelación de estado durante premios, pausa, avance rápido, resultado único, caja de tarot forzada y uniformidad de bloques del símbolo. Se usó Chromium en escritorio y móvil emulado vertical y horizontal, con DPR 1, 1,25, 1,5, 2 y 3, una paleta alternativa y movimiento reducido.

Quedan pendientes el ritmo de toda una partida de 15 min con una persona, la valoración artística, Safari y un teléfono físico. La conexión de tarot de prueba no contiene preguntas, cartas con efectos ni progreso persistente.
