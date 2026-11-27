# Herbarium · etapa 08.3

## Diagnóstico

La línea base de la 08.2, con semillas 1–16 y horizonte de 30 minutos, dio una mediana de 8:42 para Cerbatanas con prioridad por el borde, 16:26 para el jardín diversificado y 23:46 para el reactivo. El primer piloto con desvío, sobrevuelo y blindaje bajó a 7:33 la mediana de la primera política. Una prueba adversarial cambió el diagnóstico: plantar exclusivamente Cerbatanas del centro hacia afuera llevó las 100 corridas de la primera validación al horizonte, con daño mediano cero al núcleo. La ubicación y la capacidad de formar un bloque importaban más que el catálogo que se creía estar comparando.

El aviso visual de tres puntos y los halos de estas capturas corresponden a la versión de la 08.3 previa al [pulido de luz y derrota](ART_DIRECTION.md#pulido-de-luz-y-derrota).

## Diseño aplicado

- George Fan enseña cada acción en el momento en que sirve. Elegir una carta en Herbarium muestra una frase junto al catálogo. Se puede consultar con saldo cero en escritorio y en táctil. [Charla de George Fan](https://www.gdcvault.com/play/1015541/How-I-Got-My-Mom)
- Justin Ma describe cómo mostrar una intención permite actuar sobre ella. Tres puntos señalan la primera entrada de la oleada durante los últimos cuatro segundos de preparación. Las demás rutas se descubren en movimiento. [Entrevista a Subset Games](https://www.gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-)
- Michael Booth distingue la frecuencia de los picos de su amplitud. Herbarium separa 15 s de recuperación del ritmo interno del combate. Las llegadas compensadas y dos entradas para el enjambre permiten picos con el mismo presupuesto. [Presentación de Valve](https://cdn.fastly.steamstatic.com/apps/valve/2009/ai_systems_of_l4d_mike_booth.pdf)
- Ironhide usa blindajes para crear ventajas relativas entre fuentes de daño. El escarabajo amortigua parte de cada tiro en vuelo. Las esporas y el reflejo pasan sin reducción. [Guía de blindajes de Ironhide](https://support.ironhidegames.com/support/solutions/articles/4000223666-armor-types-breakdown-kingdom-rush-battles-guide)
- LocalThunk relata cómo las interacciones entre modificadores cambiaron el diseño de Balatro. En Herbarium el equivalente es desviar el ataque y prolongar su recorrido para que otra planta cambie cuántos blancos alcanza en un pulso. [Historia de desarrollo de Balatro](https://localthunk.com/blog/balatro-timeline-3aarh)

Sweetser y Wyeth proponen evaluar el desafío junto con habilidad, objetivos claros y feedback. Ryan, Rigby y Przybylski observan una asociación entre disfrute y percepción de autonomía y competencia. Se usaron como hipótesis de diseño. La acción a aprender es interpretar un riesgo y responder con una compra, ver adónde gira el insecto y comprobar qué combinación conserva el jardín. Se observaron esos comportamientos y las oportunidades de intervención, y quedan por medir la percepción del desafío y la motivación de volver a jugar. [GameFlow](https://doi.org/10.1145/1077246.1077253) · [Ryan et al.](https://selfdeterminationtheory.org/SDT/documents/2006_RyanRigbyPrzybylski_MandE.pdf)

El ciclo buscado es leer el borde, decidir si gastar o reservar, observar el resultado y reponer durante la preparación. La posición del Espino puede concentrar un grupo dentro del Hongo o desviarlo fuera de sus esporas. La Campanilla rinde cuando cubre camino bajo fuego. Si el grupo ya está posado, frenar el avance deja de aportar a ese encuentro. La Cerbatana conserva su disparo, alcance y cadencia.

## Configuración y modelo

La única fuente ejecutable es [config.js](../src/config.js). Distancias en casillas, velocidades en casillas por segundo y tiempos en segundos.

La central tiene 30 de vida y genera 1 energía/s desde saldo 0. La primera Cerbatana o Espino cuesta 10. Vida por energía base de las cuatro especies, en el orden del catálogo: 1,2, 4,2, 1,33 y 1. Ahorrar hasta 16 permite abrir con Hongo antes de la primera entrada, situada en torno a los 21 s. Una caída libera espacio y puede abaratar la reposición. Cada compra de apoyo ocupa una de las 120 casillas construibles y desplaza una compra ofensiva. Su valor depende de cuántas rutas o plantas alcanza. La partida permite gastar durante combate y preparación.

El coste por especie es base + 2t + 6t(t − 1), con t igual al entero de dividir las plantas vivas de esa especie por 4. Una Cerbatana vale 10 con 0–3 vivas, 12 con 4–7, 26 con 8–11 y 52 con 12–15. Los dos primeros escalones mantienen accesibles las aperturas. Más adelante compite la compra de otra unidad del mismo tipo con dos o más compras de apoyo.

| Planta | Base | Vida | Radio | Cadencia o regla |
| --- | ---: | ---: | ---: | --- |
| Central | — | 30 | — | 1 energía/s |
| Cerbatana | 10 | 12 | 3 | 4 por disparo cada 1 s, vuelo a 6, recorrido máximo 4,5 |
| Espino | 10 | 42 | 2,25 | Atracción en avance y reflejo de 2 por mordida |
| Campanilla | 12 | 16 | 2,5 | −40 % al avance, se aplica solo el campo más fuerte |
| Hongo | 16 | 16 | 2 | 4 por blanco cada 1,65 s |

| Insecto | Vida | Velocidad base | Colisión | Amenaza | Ataque y regla |
| --- | ---: | ---: | ---: | ---: | --- |
| Escarabajo | 12 | 0,5 | 0,4 | 3 | 2 cada 1 s, absorbe 1 por proyectil en vuelo |
| Pulgón | 4 | 1,05 | 0,28 | 2 | 1 cada 0,65 s, sobrevuela plantas comunes |
| Oruga | 28 | 0,28 | 0,42 | 8 | Primera mordida tras 0,45 s, 3 cada 1,25 s y 5 desde la tercera en el mismo blanco. Reduce en 2 los tiros de frente al cuerpo dentro de unos 49°. |

El descanso inicial dura 20 s y el resto 15 s. La primera oleada trae dos escarabajos y tres pulgones. La oruga puede entrar desde la tercera. El presupuesto es el redondeo de 12 + 4k + 0,7k² para k = oleada − 1 hasta la oleada 12. Después suma 18 por oleada. La ventana nominal es el mínimo de 48 y 18 + 4k. El cupo simultáneo es el mínimo de 48 y 6 + 3k. Los excedentes esperan. Los dos patrones recientes pesan 0,22 durante la elección, frente a 1 para los demás. Si la especie dominante está disponible hay una probabilidad adicional de 0,5 de elegirla. Concentrada favorece desgaste, pinza favorece escarabajos y alinea llegadas, enjambre favorece pulgones en dos entradas y distracción usa pulgones como señuelo lateral. El director usa semilla y ordinal, con desplazamiento del punto de llegada al exterior si la casilla ya está ocupada.

- **Viaje.** De borde o esquina al centro geométrico hay 5–7,1 casillas. Sin plantas ni control, el escarabajo tarda 10–14,2 s, el pulgón 4,8–6,8 s a velocidad nominal y la oruga 17,9–25,4 s. El contacto es anterior por la detección a 0,5 casillas y la geometría de la casilla. La oruga añade su preparación. Desde 3 casillas un proyectil tarda cerca de 0,5 s, según trayectoria y radio del blanco.
- **Daño puntual.** La Cerbatana tiene 4 DPS teórico y 0,4 DPS por energía base. Un escarabajo requiere cuatro impactos en vuelo y tres posado. Eso representa tres o dos intervalos más el vuelo del primer tiro. Un pulgón cae de un impacto. Para una oruga hacen falta 7 impactos laterales o 14 frontales. El tiempo entre primer y último tiro pasa de 6 a 13 s y crea un motivo espacial para flanquearla. El daño perdido combina tiros que agotan su recorrido, porciones amortiguadas y excedentes sobre la vida restante.
- **Control de territorio.** Recorrer un tramo cubierto al 60 % de velocidad multiplica su duración por 1,67. Dos segundos pasan a 3,33. La misma Cerbatana puede conseguir uno o dos tiros adicionales según su fase de disparo. El [registro agregado](simulacion-etapa083.json) reporta la exposición conjunta y los indicadores reales de impactos, energía, DPS, bajas, ocupación y compras.
- **Densidad.** El Hongo aporta 2,42 DPS por blanco y 0,152 DPS por energía y por blanco. Con dos blancos supera en DPS bruto a la Cerbatana. Con tres supera su DPS por energía. En grupo fijo de cinco pulgones, un pulso de Hongo despejó a los cinco a la vez sin daño central. La Cerbatana tardó 4,07 s y el núcleo recibió 4. La ventaja depende de densidad y posición.
- **Protección.** En el mismo flanco fijo de cuatro escarabajos y seis pulgones, el Espino sin señuelo dejó caer el núcleo. Con señuelo, el núcleo recibió 0 y el Espino absorbió 19. Al sumar Campanilla, el Espino absorbió 4 y el Hongo subió de 50 a 68 de daño efectivo. La Campanilla registró 21,32 insecto-segundos ralentizados, equivalentes a 8,53 insecto-segundos adicionales de exposición respecto al mismo recorrido a velocidad plena. El daño absorbido registra golpes reales. El daño evitado se estima comparando las corridas. En otra prueba, un Espino lateral con dos puntos de vida desvió a un escarabajo y cayó en la primera mordida. La primera mordida a la central pasó de 8,02 a 9,32 s. Los 1,30 s extra aíslan el desvío geométrico con un bloqueo que dura un solo golpe.
- **Presión.** La oleada 9 tiene 89 puntos de amenaza y 48 s de ventana nominal, equivalentes a 1,85 puntos programados/s. La 12 tiene 141, o 2,94/s. La 21 tiene 303, o 6,31/s. En el enjambre la programación comprime la ventana nominal al 30 % y compensa el viaje de cada especie antes de ordenar las apariciones. El ritmo de contacto real cambia con ruta, cupo, preparación y densidad. Los picos locales justifican el control y el daño de área aunque el DPS global parezca holgado.


## Variantes descartadas

| Variante | Resultado del piloto |
| --- | --- |
| Espino sin atracción o con radio 3 | En 16 semillas, el jardín de protección pasó de 13:55 con radio 2,25 a 13:26 sin desvío y 20:19 con radio 3. Se eligió 2,25 para que la colocación lateral y las rutas siguieran importando. |
| Coste plano o aumento lineal más fuerte | El coste fijo alargó varias políticas en el piloto. Aumentar linealmente hasta 8 por cada 2 vivas comprimió los resultados intermedios y las 12 partidas de Cerbatanas radiales siguieron a 30:00. |
| Enjambre con ventana del 15 % o 7 % | En ambos casos las 16 partidas radiales llegaron a 30:00 y el desafío se adelantó para las mixtas. Quedó la ventana del 30 % con dos entradas. |
| Coraza frontal de 3 | Con escalada 2, Hongo de radio 1,75 y pulso 1,8 s, la mediana reactiva bajó a 10:16. Con radio 2 y pulso 1,65 s subió a 13:38. La combinación final usa coraza 2 para conservar el beneficio del flanqueo con un castigo frontal menor. |
| Hongo de radio 1,75 y pulso 1,8 s | Con la coraza y escalada finales, la mixta compacta tuvo mediana 18:51 en calibración. El Hongo de radio 2 y pulso 1,65 s la llevó a 23:13 frente a 20:40 para las Cerbatanas radiales. |

## Validación independiente

1.400 partidas en 14 políticas. Cada una usa las 100 semillas 61501–61600, fuera del conjunto de calibración. La batería se repitió y devolvió los mismos agregados. El límite de observación es 30:00. Las observaciones que llegan a ese tiempo están censuradas. Los percentiles usan el tiempo observado. El [JSON de la validación](simulacion-etapa083.json) incluye conteos de derrotas, curvas de supervivencia por cortes, daño efectivo y desperdicio, bajas, compras, energía, espacio y presión por patrón.

| Política | P10 | Mediana | P90 | Siguen a 15 min | Siguen a 20 min | Censuradas a 30 min |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Mixta compacta | 22:58 | 26:55 | 30:00 | 100 | 98 | 18 |
| Compacta con catálogo de Cerbatanas | 8:56 | 12:24 | 14:50 | 9 | 0 | 0 |
| Solo Cerbatanas, expansión radial | 17:59 | 20:10 | 22:54 | 100 | 52 | 0 |
| Solo Cerbatanas, cobertura de borde | 2:55 | 4:39 | 6:46 | 0 | 0 | 0 |
| Cerbatana + Hongo | 2:27 | 4:18 | 6:40 | 0 | 0 | 0 |
| Cerbatana + Espino | 4:46 | 8:05 | 11:39 | 0 | 0 | 0 |
| Cerbatana + Campanilla | 6:19 | 9:30 | 12:33 | 1 | 0 | 0 |
| Mixta, cobertura de borde | 8:07 | 11:15 | 15:19 | 13 | 0 | 0 |
| Mixta, reactiva | 5:50 | 14:12 | 19:22 | 42 | 5 | 0 |
| Principiante | 1:40 | 3:11 | 9:27 | 0 | 0 | 0 |
| Intermedia | 9:39 | 12:16 | 14:53 | 10 | 0 | 0 |
| Especializada | 6:23 | 15:37 | 20:05 | 54 | 12 | 0 |
| Ahorro | 4:27 | 13:00 | 18:52 | 41 | 4 | 0 |
| Solo Espinos | 6:12 | 8:28 | 9:51 | 0 | 0 | 0 |

La apertura que prioriza el centro sigue siendo fuerte. El monocultivo radial más agresivo resistió una mediana de 20:10 y cayó en las 100 corridas. La mixta compacta alcanzó 26:55 y 18 corridas seguían activas al cierre. Restringir el catálogo de **esa misma política compacta** a Cerbatanas bajó su mediana a 12:24. El posicionamiento y el catálogo aportan información distinta. Las simulaciones también muestran que la compra de Hongo exige mejor colocación: el catálogo de Cerbatana + Hongo con prioridad exterior rindió menos que solo Cerbatanas en esa misma familia de políticas. El valor del Espino y de la Campanilla se nota más al combinar su control con daño. La política intermedia llegó a 15 minutos en 10 corridas de 100. El principio de juego todavía requiere comprobar si jugadores reales descubren la ventaja de construir compacto.

La mixta compacta alcanzó 9,70 DPS efectivo durante la partida y 9,73 puntos reales por energía gastada en mediana. La radial de Cerbatanas marcó 8,15 y 8,26, respectivamente. Entre las dos, la proporción de aciertos de Cerbatana pasó de 91,0 % a 96,2 %. Los tiros agotados pasaron de 368 a 92 pese a la mayor duración, y la mixta alcanzó 2,54 blancos por pulso de Hongo. Los DPS teóricos al minuto 20 eran 56 para la radial superviviente y 29,7 para la mixta. La diferencia ilustra los costes de concentración de fuego, blindaje y tiempo sin blancos. Los datos de combate agregados incluyen reflejo y miden todo el tiempo desde el inicio.

### Cortes de partida

Las medianas de vida, plantas y saldo de esta tabla corresponden al jardín mixto compacto entre las corridas que seguían activas. Se contabilizan plantas compradas y vivas, excluida la central.

| Minuto | Activas de 100 | Plantas | Saldo | Vida | Bajas acumuladas | Insectos activos |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1:00 | 100 | 5 | 10.0 | 30 | 0 | 1 |
| 2:00 | 100 | 10 | 6.0 | 30 | 0 | 0 |
| 3:00 | 100 | 12 | 34.0 | 30 | 0 | 2 |
| 5:00 | 100 | 13 | 126.0 | 30 | 0 | 1 |
| 7:00 | 100 | 13 | 240.0 | 30 | 1 | 2 |
| 10:00 | 100 | 14 | 360.0 | 30 | 4 | 4 |
| 12:00 | 100 | 14 | 410.0 | 30 | 9 | 5 |
| 14:00 | 100 | 14 | 455.0 | 30 | 14 | 5.5 |
| 15:00 | 100 | 14 | 448.0 | 30 | 18 | 5 |
| 20:00 | 98 | 15 | 349.0 | 30 | 44 | 9 |
| 30:00 | 18 | 15 | 10.0 | 30 | 108 | 13.5 |

- **Primer minuto.** En la política compacta quedan cinco plantas y saldo próximo al coste de otra Cerbatana o Espino. El aviso da cuatro segundos de anticipación más el recorrido. En la partida de navegador fue posible consultar antes de comprar y desplegar las cuatro especies durante los primeros 70 s.
- **Minutos 2–3.** Entra la oruga. El jugador puede abrir un flanco o reforzar una defensa con control. La mixta compacta conserva margen de compra, mientras que rodear el borde extiende el jardín hacia rutas todavía vacías y encarece su reparación.
- **Minutos 5–7.** Aumenta el presupuesto y las trayectorias se superponen. El jardín compacto comienza a acumular energía porque la política prioriza pocas posiciones. Conviene distinguir siempre saldo disponible de oportunidades que la política efectivamente toma.
- **Minutos 10–12.** Se acelera el desgaste. La mediana compacta pasó de 4 a 9 bajas acumuladas entre ambos cortes. El jugador puede absorber una oleada con plantas que ya se pagaron o reponer antes de perder el siguiente corredor.
- **Minutos 14–15.** Suben las bajas con la central aún intacta en mediana para el jardín compacto. En la inspección de semilla 42, dos grupos llegaron al jardín de 14 plantas compradas en una oleada avanzada. La partida observada durante seis segundos a velocidad normal mostró apoyo de Campanilla al paso y pulsos de Hongo junto al perímetro defensivo.
- **Minutos 20–30.** La reserva de la mixta compacta cae de 349 a 10 de energía en mediana entre las partidas vivas en cada corte. Las reposiciones dominan la economía: las 18 partidas que llegan a 30 min registran una mediana de 108 bajas. Una escena de estrés independiente con 110 plantas sembradas, núcleo a 8 y presupuesto 429 conservó el núcleo y perdió cinco plantas. Se inyectó el plan de oleada 28 directamente para aislar el combate, sin compras ni espera por el cupo del director.

### Evidencia visual y verificación

- [Aviso al borde](capturas/etapa083/aviso.png), [primer combate](capturas/etapa083/primer-combate.png), [preparación entre oleadas](capturas/etapa083/preparacion.png) y [consulta táctil](capturas/etapa083/consulta-tactil.png). Capturas de Chromium en la entrada principal. La primera sesión usó reloj real e interacción de compra.
- [Combate avanzado](capturas/etapa083/combate-avanzado.png) y [seis segundos después](capturas/etapa083/combate-avanzado-despues.png). Se llegó al minuto 15 con simulación acelerada y compras de la política compacta. Luego se observó con el reloj normal. [Jardín denso](capturas/etapa083/jardin-denso.png) fue una escena sembrada para revisar lectura y solapamiento. En la [oleada 23, minuto 22](capturas/etapa083/minuto-22.png), se aceleró la partida hasta llegar al combate, se colocó un Espino por clic y se observó durante doce segundos a reloj normal.
- Se verificó consulta con saldo cero y movimiento reducido en 390×844, 320×568 y 844×390. A 320×568 se probaron las cuatro cartas y la compra mediante dos toques de Chromium emulado. Los grupos grandes comparten halo por casilla para reducir saturación. Se conservaron los sprites, MonoMEK y la energía como único HUD permanente.
- Se comprobó pausa y reanudación con un evento de visibilidad simulado, derrota natural sin compras y reinicio táctil con saldo cero. La sesión horizontal con movimiento reducido y una tinta alternativa terminó sin errores de consola.
- En Chromium sin interfaz a 1280×800, 180 llamadas directas al dibujo promediaron 5,83 ms con jardín inicial y 10,02 ms con 111 plantas y 48 orugas. Los pasos de simulación de la escena densa promediaron 0,18 ms. Son tiempos de llamada en este equipo. La composición del navegador y la frecuencia real de fotogramas quedan fuera de esta medición.
- `npm test` aprobó las 84 pruebas. `git diff --check` pasó sin observaciones. Rama `main`, base `02fa07b`. Cambios locales de configuración, combate, oleadas, interfaz, simulación, pruebas y documentación. Sin commit ni push.

La variedad de semillas y los escenarios controlados miden reglas y sensibilidad de políticas. Quedan pendientes una partida larga a ritmo real con jugadores, la validación en teléfono físico y Safari, y medir rendimiento en hardware móvil. El saldo alto de la política compacta en el tramo medio y su espera mediana máxima entre compras de 3:12 merecen atención en esa prueba. Son resultados de sus prioridades de compra, no una medición de tiempos muertos de un jugador.

## Reproducción

    npm test
    node scripts/escenarios-etapa07.mjs
    node scripts/calibrar-etapa083.mjs
    node tests/corrida.mjs 58031 100 1800

Las políticas solo reciben insectos presentes, saldo, tablero y plantas. La comparación por catálogo usa la misma familia de políticas de cobertura para solo Cerbatanas, área, protección, ralentización y diversificada. La política compacta usa una preferencia radial distinta. Esas decisiones son implementaciones de hipótesis sobre jugadores y no una evaluación humana de la dificultad.
