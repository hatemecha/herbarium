# Propuesta: oleadas

Documento de diseño, no de implementación. Describe cómo introducir las oleadas en la etapa 06 y qué necesita decidir el propietario antes de tocar código. No hay números definitivos. Lo que sigue son fórmulas, cálculos de capacidad y opciones, con sus costes.

Estado: no implementado. No existe en el código ninguna oleada, ningún contador de ronda ni ningún enemigo más allá del escarabajo. Ver [ROADMAP.md](ROADMAP.md).

## Punto de partida medido

Datos de la etapa 05, reproducibles con `tests/escenario.mjs` (ver [BALANCE.md](BALANCE.md)):

- Una cerbatana basta para matar a un escarabajo en 2 a 2,3 s de permanencia en alcance. Tres disparos a un ritmo de 1 por segundo más el viaje.
- Sin ninguna defensa, la central cae a los 42 s de partida con una aparición.
- La energía sube 1 por segundo. En 15 minutos hay 900 unidades, sin gastos ni pérdidas.

Con la economía actual, si nada del coste creciera, 900 energía compran hasta 90 cerbatanas. El tablero tiene 121 casillas: 120 libres tras la central. Llenarlo deja 75 % de cobertura sin ningún enemigo que la castigue. Es el primer problema que la futura dificultad tiene que resolver.

## Objetivo temporal

- Partida satisfactoria cerca de 15 minutos. Es referencia, no tope.
- Después de esa duración la partida sigue, con olas que no se repiten idénticas.
- Cada ola tiene dos fases: **preparación** (sin enemigos, la energía sube y el jugador coloca) y **combate** (los enemigos llegan). Entre olas hay una pausa de descanso.

Ejemplo de estructura, sin fijar cifras: preparación de 35 a 25 s, combate de 20 a 40 s, descanso de 15 s. Con esos valores caben unas 12 olas en 15 minutos.

## Descanso y personalidad / tarot

El descanso entre olas es el único momento sin enemigos. Ahí encajarían las preguntas de personalidad y la entrega de cartas del tarot cuando existan. Requisitos para que el diseño lo soporte:

- El descanso tiene duración fija y conocida, para que el jugador no lo pierda por hacer cuentas en la pantalla.
- Durante el descanso la simulación de combate se pausa y la energía sigue corriendo o se detiene según la decisión de abajo.
- El paso a preguntas o cartas no crea un modal de la partida: se resuelve en la misma escena o en una pieza de la interfaz existente.

## Economía que crece con la partida

El coste de la cerbatana debe crecer con la cantidad comprada, o la pantalla termina llena. Opción a evaluar: coste `c(n) = 10 · (1 + α·n)`, donde `n` es la cantidad de cerbatanas ya colocadas. Gasto total para `N` cerbatanas: `10·N + 5·α·N·(N−1)`.

Cantidad que se alcanza con 900 de energía según α (sin pérdidas):

| α | Cerbatanas compradas en 15 min |
| --- | --- |
| 0 (actual) | 90 |
| 0,05 | 43 |
| 0,10 | 33 |
| 0,20 | 25 |

La cifra no se decide aquí. Con α = 0,10 el jugador tiene 33 cerbatanas, 27 % del tablero, y todavía puede llenarlo más tarde, pero cada una cuesta más. El crecimiento también pide otro término: si la energía crece con la cantidad de plantas (cosecha), el crecimiento se compensa con más decisiones. Eso es una decisión del propietario.

## Presión enemiga: qué crece

No crecer solo en vida y daño. Un enemigo con más vida se mata con más disparos y listo. Las opciones que cambian la partida de verdad:

1. **Cantidad simultánea.** Dos o tres escarabajos a la vez obligan a repartir la cobertura. Medida útil: torres-segundo necesarias, `Σ vida_i / (dano · cadencia)`, sin contar desperdicio por sobreasignación. Con 12 de vida y 4 de daño cada escarabajo consume 3 torres-segundo.
2. **Entradas.** La aparición cambia de lado o se reparte en varios. El jugador con cobertura concentrada en un lado pierde el otro. Una opción es que la siguiente entrada se elija entre los lados con menos cobertura; hay que evaluar si eso se siente como castigo.
3. **Ritmo.** La separación entre enemigos baja de forma progresiva, y el jugador tiene menos ventana para colocar.
4. **Tipos nuevos con reglas distintas.** Un enemigo que busca la cerbatana más cercana en vez de la central, o que no se detiene ante una planta. Son mecánicas nuevas: requieren decisión del propietario antes de existir.

Los tipos nuevos cuestan mucho más que una fila de números. El escarabajo es la única especie y no debe multiplicarse sin que el propietario lo pida.

## Entradas y cobertura

- Las entradas viven en el perímetro, como hoy (`aparecer()` en `src/combate.js`). Una ola puede elegir uno o varios lados, o esquinas.
- Una cerbatana cubre unas 28 casillas en un radio de 3 (sin contar los bordes). Cuántas casillas del perímetro quedan cubiertas con N cerbatanas no está medido todavía; es una de las pruebas previas de abajo. Hasta tenerlo, no se sabe si la cobertura castiga por sí sola.
- Una cerbatana en el camino del insecto recibe mordiscos. La simulación ya mostró que, comprada a 25 s, deja morder a 2 veces. Ese es un buen mecanismo de desgaste y no requiere código nuevo.

## Prevención de la estrategia dominante

Llenar el tablero de cerbatanas es estable si el coste es constante y ninguna regla castiga la densidad. Tres caminos, que se pueden combinar:

- **Coste creciente**, como arriba. Es la regla más simple y la más fácil de comprobar con simulaciones.
- **Desgaste**: los enemigos que llegan a una cerbatana la muerden. Requiere reparación o reemplazo, y una decisión sobre si las plantas se recuperan.
- **Límite de densidad**, por ejemplo no más de una cerbatana cada N vecinas. Sencillo, pero limita la expansión del jardín, que es la gracia del juego.

No conviene introducir las tres a la vez. Probar primero el coste creciente con simulaciones de la ola.

## Número de casillas

El tablero de 11×11 tiene 121 casillas. Con la central ocupada quedan 120. Las plantas solo se colocan adyacentes a otras, así que el crecimiento empieza en el centro y llena hacia afuera.

Si el tablero debe crecer para partidas más largas, eso es un cambio de `TABLERO` en `src/config.js` y de la escala, y necesita aprobación explícita.

Con la economía actual el límite físico no se alcanza antes de los 15 minutos: 90 cerbatanas comprables frente a 120 casillas. Con un coste creciente, el límite que aparece primero es el económico.

## Preguntas abiertas para el propietario

1. ¿La energía se detiene durante el combate, sigue corriendo o solo corre en preparación?
2. ¿El coste de la cerbatana crece con la cantidad, y con qué α?
3. ¿Las cerbatanas se desgastan por mordidas, o cada muerte de planta es definitiva como hoy?
4. ¿Las entradas se eligen al azar, por cobertura o con un patrón fijo?
5. ¿Hay victoria o la partida es infinita? Hoy no hay victoria.
6. ¿La pausa de descanso existe desde la primera ola o aparece cuando haya preguntas?

## Pruebas previas a implementar

- Simulaciones de `tests/escenario.mjs` ampliadas a varias oleadas, con las entradas y ritmos que se propongan.
- Curva de energía acumulada contra coste y cantidad de cerbatanas, para comprobar que el jardín no se completa antes de la oleada 12.
- Prueba de cobertura: cuántas casillas del perímetro tienen al menos una cerbatana en alcance tras N compras.
- Pruebas en navegador de la ola completa en escritorio y en táctil, con semilla fija.
