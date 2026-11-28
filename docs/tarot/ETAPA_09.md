# Etapa 09 · Tarot

El resultado de Tarot está habilitado en la ruleta. El primer corte contiene El Mago, La Emperatriz, El Emperador, El Ermitaño, La Muerte, La Templanza, El Diablo y La Estrella en ambas orientaciones. Las otras catorce firmas quedan definidas en el motor y fuera del sorteo. Las 120 preguntas originales se leen directamente de `preguntas.json`.

## Selección y acumulación

Cada observación suma su peso y una unidad de evidencia. El perfil previo de un eje es `S / (2 × (N + 2))`, con dos observaciones neutras de regularización. Un cero explícito aporta evidencia. Para cada firma, se promedian solo los ejes observados. Cuando coinciden historial y respuesta actual, la respuesta actual aporta 0,5625 y el historial aporta 0,4375. La probabilidad base combina 80% de softmax con temperatura 0,5 y 20% de distribución uniforme. Los pesos de cartas vistas se multiplican por 0,25 y la última recibe además un factor 0,5 antes de normalizar.

Las preguntas favorecen familias con poca evidencia y pares comparables que ya tienen una respuesta anterior. El motor agota el banco por ciclo, conserva las últimas doce preguntas y la última respuesta por identificador. La inversión parte de 10%. Una oposición explícita entre preguntas comparables en las últimas doce consultas puede añadir hasta 40 puntos porcentuales a un arcano cuya firma toca ese eje. Se conserva el máximo entre nueva tensión y tensión anterior multiplicada por 0,85. Preguntas, orden de opciones, arcano y orientación usan flujos propios. Los dieciséis efectos activos son deterministas.

Los cuatro canales de selección toman la semilla de partida, cada uno con su propia constante de derivación. El orden de las opciones conserva IDs. La respuesta se registra tras calcular afinidad y tensión, y la misma pregunta abierta se puede confirmar una sola vez. La ruleta mantiene 50:30:20, impide vacíos consecutivos y garantiza un tarot al cuarto cierre consecutivo sin tarot.

La composición recorre arcano y orientación en orden estable. Suma aportes por atributo, aplica límites y redondea precios hacia arriba. Cada repetición escala sus porcentajes por `1 + 0,75 × (nivel − 1) / (nivel + 2)`; el rearme especial de Muerte permanece en 4 s. El precio se acota al 25–200% del coste base con suelo 1. El factor de daño se acota entre 0,25 y 4. La pala usa el precio pagado. Cambios de vida conservan su fracción y las reglas de vecindad se actualizan en ocho casillas por cambio local. Diablo evalúa reservas al disparar y cobra proporcionalmente durante combate. Estrella cura al cierre de la invasión antes del próximo premio. Los créditos de Muerte caducan al cerrar la invasión siguiente y se consumen al comprar.

La inspiración contextual viene de [Mischel y Shoda](https://pubmed.ncbi.nlm.nih.gov/7740090/). El modelo es una regla de juego. La composición de efectos independientes sigue la idea de interacciones emergentes discutida por [LocalThunk en The Game Maker’s Notebook](https://gamemakersnotebook.libsyn.com/balatro-creator-localthunk-talks-inspirations-and-jokers). La iconografía toma como referencia a Pamela Colman Smith y [Arthur Edward Waite](https://en.wikisource.org/wiki/The_Pictorial_Key_to_the_Tarot). Las ilustraciones se dibujaron en el proyecto sobre un raster de 48 × 72. Se reutilizaron las primitivas y Terminus de Herbarium. El catálogo conserva solo claves de orientación descubiertas.

## Calibración preliminar

Cien semillas emparejadas por política desde 94057. `30 min` cuenta partidas que alcanzaron el horizonte. La mediana usa tiempo activo, que excluye la presentación de premios. Todas las partidas de estos grupos llegaron a 15 minutos.

| Política | Mediana sin tarot | Mediana con tarot | 30 min sin / con tarot | Cartas / invertidas / repeticiones |
|---|---:|---:|---:|---:|
| Compacta | 25:58 | 29:25 | 9 / 92 | 527 / 63 / 49 |
| Monocultivo de Cerbatanas | 19:14 | 22:26 | 0 / 4 | 392 / 48 / 21 |
| Mixta reactiva | 22:32 | 25:10 | 0 / 3 | 438 / 51 / 31 |
| Especializada | 22:58 | 24:12 | 0 / 7 | 431 / 51 / 29 |
| Reorganización con pala | 26:28 | 29:25 | 20 / 61 | 502 / 58 / 39 |

Las partidas compactas con tarot quedaron censuradas en su mayoría. Su muestra cubrió 118 preguntas. En la política con pala se completaron 13,13 invasiones de media con tarot y 12,32 sin él. Las retiradas pasaron de 14.504 a 12.966 en las 100 partidas de cada grupo. En una muestra independiente de 20 semillas del jardín mixto, la mediana pasó de 21:53 a 25:38 y 2 de 20 partidas llegaron al horizonte con tarot.

En diez semillas independientes desde 94170, el jardín compacto llegó a 30 minutos en 0 partidas sin tarot, 6 con todos los porcentajes multiplicados por 0,65 y 10 con los valores iniciales. Las dos variantes con tarot quedaron censuradas en mediana. La reducción uniforme bajó la frecuencia de partidas al horizonte, conservó el sesgo en esta muestra y redujo también las contrapartidas. El corte conserva los valores iniciales y deja abierto un ajuste por arcano para la beta.

Distribución de arcanos en las 500 partidas con tarot. La columna de inversiones de la tabla anterior reúne todas las orientaciones invertidas.

| Mago | Emperatriz | Emperador | Ermitaño | Muerte | Templanza | Diablo | Estrella |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 321 | 229 | 298 | 328 | 271 | 262 | 291 | 290 |

La prueba exploratoria especializada a 60 minutos, con cinco semillas independientes desde 220609, dio medianas activas de 23:49 con derechas y 23:08 con invertidas. Los tres grupos llegaron a 15 minutos y ninguno a 30. La mezcla coincidió con el grupo de derechas porque en esas cinco partidas no salió una invertida. Se descartó forzar una orientación como configuración de juego. La muestra apenas permite comparar ese caso y no establece equivalencia entre orientaciones.

```sh
node scripts/medir-etapa09.mjs 100 94057
node scripts/medir-etapa09.mjs 5 220609 especializada orientaciones 60
node scripts/medir-etapa09.mjs 1 220624 compacta estres
npm test
```

Una prueba de estrés con un director de laboratorio menos exigente y tarot en cada cierre superó 60 minutos de simulación activa. La semilla 220624 acumuló 28 cartas en 28 invasiones, llegó al nivel 6 y mantuvo energía positiva. Usó la política compacta cada 2 s y el ajuste de oleadas `{ base: 23, lineal: 14, cuadratica: 1, continuacion: 18 }`. El caso prueba acumulación prolongada con el motor real fuera del balance de producción.

## Especializaciones de las invertidas

- Mago gana en ráfaga y también en daño sostenido teórico de nivel 1, con 1,35 / 1,15 ≈ 1,174 frente a 1,12. La espera adicional puede retrasar el ataque a un segundo blanco.
- Emperatriz gana en partidas que mantienen pocas compras y acumulan energía. Contra su orientación derecha, una diferencia de 20% de generación cubre el sobrecoste de una compra de 20 en unos 15 s de generación a tasa base.
- Emperador favorece un núcleo denso que ya está plantado. Puede resistir más mordidas sin pagar el sobrecoste salvo al reponer.
- Ermitaño favorece una defensa que ocupa extremos separados y conserva corredores abiertos. Templanza favorece un núcleo de especies mezcladas, con perjuicio local para posiciones sin diversidad.
- Muerte favorece un reemplazo barato entre invasiones, cuando el rearme de 4 s puede consumirse en preparación. Durante el combate exige elegir entre ahorro y respuesta inmediata.
- Diablo favorece reservas altas durante combate. A 100 de energía su daño adicional es 40% frente a 15% de la derecha, a cambio de 0,25 energía/s.
- Estrella favorece la defensa que conserva vivas sus plantas y recupera el núcleo entre invasiones. El 25% de vida faltante incluye a la central. Las plantas compradas soportan un 10% más de daño por mordida.

Son escenarios mecánicos medibles. Falta comparar su rendimiento de partida por carta y comprobar si son decisiones atractivas en juego humano.

## Revisión visual

[Capturas y registro](../capturas/etapa09/). La prueba usa Chrome en 1280 × 800, táctil emulado en 390 × 844 con DPR 1,25 y movimiento reducido, y horizontal en 844 × 390. Usa las reglas del juego y políticas del simulador con avances acelerados, y confirma las respuestas por teclado y tacto emulado. Verifica que el ritual y el mazo congelan la partida, que el mazo vuelve a cero al reiniciar, que una respuesta obsoleta no vuelve a aplicar la carta y que la vista se retira al destruir el montaje. La prueba de visibilidad cambia `document.hidden` de forma sintética. Obscura denegó el acceso al servidor local y la verificación se ejecutó en Chrome. La revisión cubre los archivos de referencia del proyecto disponibles en este checkout. Las cuatro skills artísticas solicitadas, incluida herbarium-visual-review, no estaban instaladas en las rutas revisadas.

Para reproducirla, iniciar `npm start`, elegir la URL en `HERBARIUM_URL` y ejecutar `python scripts/visual-etapa09.py` con Chrome y Python Playwright disponibles.

Queda pendiente ampliar el mazo, validar en teléfono físico, ampliar la comprobación en paletas alternativas, probar partidas que alcancen 60 minutos con el director de producción y seguir calibrando la competitividad de cada invertida. La derrota registra tiempos, invasiones, plantas, insectos, energía y premios. El mazo final queda consultable desde el botón del jardín. La vista libre del jardín al caer queda por diseñar para que la cámara sea operable sin perder el acceso al resultado.
