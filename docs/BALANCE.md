# Balance

Fuente de verdad: `src/config.js`, leído por `src/catalogo.js` y `src/combate.js`. Si un número de aquí no coincide con ese archivo, gana el archivo. Esta nota no se importa desde el juego.

Todos los valores son provisionales. No hay en el repositorio una justificación distinta de “son los de la etapa 04”. Las relaciones de abajo son una lectura de esos números, no una segunda configuración.

Unidades: vida y daño en puntos, tiempo en segundos, distancia en casillas, velocidad en casillas/segundo. El tablero es 11×11 y la central está en `(5, 5)`.

## Valores vigentes

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
| cerbatana.coste | 10 de energía, en `PLANTAS`, no dentro de `BALANCE` |
| escarabajo.vida | 12 |
| escarabajo.velocidad | 0,5 casillas/s |
| escarabajo.dano | 2 |
| escarabajo.intervalo | 1 s |
| escarabajo.radio | 0,4 casillas (colisión) |

Tiempos visuales, `BALANCE.visual`, en segundos: destello 0,2; disparo 0,25; retroceso 0,12; desintegración 0,7; marchitez 1,2.

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

El escarabajo aparece a los 20 s. Quien compró a los 10 s tiene ese viaje entero con la cerbatana ya puesta. Una cerbatana pegada a la central (centro a 1 casilla del centro de la central) no cubre el perímetro: el radio 3 no llega a una casilla de borde, cuyo centro está a 4 o más. El insecto entra en alcance recién cuando se acerca. En un borde opuesto a la planta, al detenerse contra la central queda a unas 2 casillas de esa cerbatana, todavía dentro de 3.

Eso es geometría del código, no una partida observada. Falta ver en el juego si tres tiros conectan antes de que el escarabajo coma la central o a la propia cerbatana. Ver el pendiente en [ROADMAP.md](ROADMAP.md).

## Qué no entra en el balance

No hay valores propuestos de reemplazo. No hay oleadas, recompensa por baja, coste de otras plantas ni curva de dificultad. Cuando existan, se añaden a `src/config.js` y se reinterpretan aquí.
