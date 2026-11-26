# Balance

Fuente de verdad: `src/config.js`, leído por `src/catalogo.js` y `src/combate.js`. Si un número de aquí no coincide con ese archivo, gana el archivo. Esta nota no se importa desde el juego.

Todos los valores son provisionales. No hay en el repositorio una justificación distinta de “son los de la etapa 04”. Las relaciones y los resultados de abajo son una lectura de esos números, no una segunda configuración.

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
