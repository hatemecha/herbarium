# Etapa 08.5 · jardín expansible

## Terreno y cámara

La central ocupa la casilla (0, 0). Sus coordenadas físicas lógicas se derivan de las casillas de 16 × 16. El centro geométrico de (x, y) es (x + 0,5, y + 0,5) en unidades de combate. Enemigos y proyectiles usan posiciones continuas. Comprar y retirar conservan las coordenadas de cada entidad.

El terreno empieza en [−4, 4] en ambos ejes. Al ocupar una casilla, se abren las regiones de 9 × 9 que intersectan cualquiera de sus ocho vecinas. Es suficiente llegar al borde con una sola rama. La compra siguiente ya puede usar el terreno abierto. En una esquina pueden aparecer tres regiones vecinas. Se consideraron franjas de ancho global y celdas individuales. Los bloques permiten extender un sector sin asignar una sala rectangular entera ni registrar cada casilla vacía. Una región descubierta persiste después de una pérdida o retirada. Para plantar siguen haciendo falta una vecina viva, saldo suficiente y una casilla libre.

Arrastrar funciona también al zoom base. Rueda, pellizco y teclas amplían por múltiplos de píxeles físicos. Centrar y la tecla 0 restauran la vista sobre la central. La escena dibuja en buffers del tamaño de la vista lógica. La grilla, el Bayer y el tramado ambiente usan coordenadas mundiales. Una punta discreta señala un ataque activo fuera de vista o un enemigo próximo a la central. El aviso por borde se toma de los insectos vivos.

## Frontera de invasiones

El director conserva focos, densidades, grupos, cupo y pesos por ausencia de 08.4. Cada sector abarca 90° y distribuye las entradas sobre doce direcciones con una pequeña variación angular sembrada. En la emisión se evalúa el semirrayo desde el centro de la central. Para cada planta viva se calcula su proyección longitudinal p y su distancia perpendicular q. Si el disco intersecta el rayo, su punto exterior está en p + √(4,5² − q²). Se usa el mayor valor, con 4,5 como mínimo. La cámara y el terreno descubierto no intervienen. El plan no usa el estado de las defensas para seleccionar ángulos.

Un círculo centrado en el jardín aumentaría la distancia en todas las direcciones al comprar una planta avanzada. Un máximo por sector puede extender la espera en ángulos que ni siquiera pasan cerca de esa planta. La unión de discos limita cada influencia a los rayos que realmente la atraviesan, incluye las posiciones aisladas y cuesta un recorrido por las plantas vivas al emitir.

Se eligieron 4,5 casillas entre centros. Esto deja 1,5 casillas de aproximación antes del alcance de 3 de la Cerbatana más cercana, 2,25 antes del radio de atracción del Espino y 2,5 antes del ataque del Hongo. Sin ralentización, recorrer esas primeras 1,5 casillas toma unos 1,4 s para un Pulgón, 3 s para un Escarabajo y 5,4 s para una Oruga. Son referencias geométricas de aproximación recta. El camino real puede pasar entre varias plantas o esquivar un puesto.

## Balance reproducible

`node scripts/medir-etapa085.mjs` ejecuta 15 partidas, con semillas 7, 19 y 42 por geometría y horizonte de 15 minutos. Las cinco políticas usan la misma secuencia de compra, en función de sus plantas vivas. Cambia su preferencia espacial. La cobertura muestrea 24 rayos a dos casillas de la aparición, sin simular en ese indicador los desvíos. Las duraciones corresponden a medias de combate de cada partida, para invasiones completadas.

| Geometría | Invasiones completadas | Vida central | Pérdidas | Duración media |
| --- | ---: | ---: | ---: | ---: |
| Compacta | 7–8 | 30 | 2–7 | 90–92 s |
| Radial | 7 | 30 | 16–18 | 91–96 s |
| Ramificada | 7 | 30 | 21–25 | 93–95 s |
| Fila hacia el este | 1 | 0 | 0 | 50–54 s |
| Dispersa | 7 | 28–30 | 10–16 | 90–91 s |

- El jardín compacto gastó 952–966 de energía. Su concentración alcanzó 63–75 % de cobertura y la Cerbatana aportó 4.491–4.890 puntos de daño.
- El ramificado gastó 984–1.010. El Espino absorbió 330–495 puntos, frente a 107–173 en el compacto. La mezcla de Espino y Hongo sostuvo puestos avanzados con más reposiciones. Los Hongos de la política dispersa llegaron a 1.884 puntos de daño en una semilla. La métrica de cobertura radial por sí sola no predice bien esas bajas.
- Las cuatro formas supervivientes generaron 870–882 de energía pasiva y recibieron 118–144 en premios. La fila cayó en la segunda invasión a los 101–148 s. Dejó expuestos los otros sectores y solo recibió un sorteo.
- Una retirada avanzada puede alargar el recorrido de insectos ya emitidos. Las siguientes entradas usan la geometría actual. La energía pasiva conserva el corte al acabar la ventana y su margen. El cierre conserva la condición de eliminar los enemigos vivos. El movimiento sigue directo hacia la central o un señuelo, con mordidas sobre bloqueos válidos y sin laberintos de rutas.
- Se puede aislar un puesto al retirar el puente que lo conectaba. Una compra nueva junto a un puesto superviviente vale por la regla de vecindad local. La pala no mueve plantas ni habilita colocar en un lugar sin vecinas vivas. Conserva el reembolso existente y el rearme por casilla. Estas pruebas no agotan los casos de reciclaje con varias casillas adyacentes ni los de extensiones muy largas en el juego tardío.

Las estadísticas de plantas, insectos, economía y director se conservaron. Las políticas no representan partidas humanas y tres semillas por geometría solo dan un piloto.

## Rendimiento

Chromium de escritorio, ventana 1280 × 800, DPR 1 y vista lógica 642 × 251. Escenarios artificiales de cuatro especies, con 24 enemigos al comienzo. Render medido como tiempo medio de 80 llamadas a `dibujar` tras 10 de calentamiento. Esta cifra incluye envío de operaciones Canvas y excluye la presentación del frame en el monitor. Simulación medida aparte, 120 pasos de 1/60 s usando jardín y combate. La columna de terreno extra repite el render con 1.000 regiones descubiertas fuera de vista, sin organismos nuevos. El heap es un delta aproximado entre lecturas con GC, sensible al ruido. Los buffers Canvas y la memoria de GPU quedan fuera de esa lectura.

| Plantas | Casillas descubiertas | Render | Render con 81.000 casillas extra | Simulación media / p95 | Heap adicional aproximado |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 25 | 81 | 5,30 ms | 5,97 ms | 0,07 / 0,20 ms | Por debajo del ruido |
| 100 | 729 | 7,01 ms | 7,58 ms | 0,18 / 0,40 ms | 52 KiB |
| 250 | 1.215 | 8,66 ms | 10,85 ms | 0,14 / 0,40 ms | 146 KiB |
| 500 | 1.944 | 8,75 ms | 9,08 ms | 0,14 / 0,20 ms | 296 KiB |

Los cuatro perfiles de luz estáticos ocupan 23,7 KiB en conjunto. Se reutilizan para todas las plantas de cada especie. Más terreno agrega entradas al `Set`, con buffers de vista del mismo tamaño. El tiempo varía con la densidad visible y con el recorrido de las listas de entidades, sin una consulta espacial por bloque para los organismos. [Datos de la corrida](capturas/etapa085/mediciones.json)

## Verificación y registros

- 103 pruebas Node. Las regresiones de esta etapa cubren expansión en ocho sentidos, coordenadas negativas, persistencia, retirada y rearme, puestos avanzados, cambios entre emisiones, proyectiles entre regiones y cámara libre con DPR 1, 1,25, 2 y 3.
- Chromium comprobó arrastre a escala base, rueda, Centrar, pausa, interacción con premio con la cámara lejos del centro y reinicio. La emulación táctil en 390 × 844 y 844 × 390 comprobó compra en coordenada negativa, pellizco y movimiento reducido. Falta validación en teléfonos físicos y una partida manual extendida.
- Un recorte de 14.784 píxeles consecutivos coincidió píxel por píxel después de desplazar la cámara. En el mismo escenario, un Hongo fuera de pantalla hizo 4 puntos de daño y su luz se eliminó al retirarlo.
- Capturas de [inicio](capturas/etapa085/inicio.png), [25](capturas/etapa085/25-plantas.png), [100](capturas/etapa085/100-plantas.png), [250](capturas/etapa085/250-plantas.png) y [500 plantas](capturas/etapa085/500-plantas.png), más [móvil vertical](capturas/etapa085/movil-390.png) y [horizontal](capturas/etapa085/movil-844.png).
- Grabaciones del juego con arrastre, zoom y vuelta al centro para [100 plantas](capturas/etapa085/100-plantas.webm) y [500 plantas](capturas/etapa085/500-plantas.webm). Los jardines de estrés se sembraron por instrumentación.
