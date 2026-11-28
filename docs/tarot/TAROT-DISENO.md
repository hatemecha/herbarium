# Herbarium · Tarot — contrato de diseño v1

Contrato de diseño y calibración. El estado del primer corte se registra en [Etapa 09](ETAPA_09.md). Las 120 preguntas están escritas en `preguntas.json`, con una versión de lectura en `PREGUNTAS.md`. No son una escala psicométrica validada ni pretenden diagnosticar. No usar servicios externos, ni persistir respuestas o perfiles entre partidas. El jardín expresa una interpretación simbólica de las decisiones, no una verdad sobre la persona.

## 1. Datos, selección y perfil

12 ejes firmados (−2 a +2 por respuesta), definidos en el JSON. Un peso ausente significa que no se observa el eje; un cero explícito significa respuesta intermedia. No confundirlos. IDs estables, textos rioplatenses y opciones barajadas independientemente del resultado. No mostrar pesos, afinidades ni nombres de cartas antes de responder. Cada pregunta puede aportar a ejes secundarios. No hay respuestas moralmente correctas.

Para cada eje j, guardar suma S_j y evidencia N_j (cantidad de respuestas que observan ese eje), inicialmente 0. Antes de responder, perfil h_j = S_j / (2*(N_j+2)), acotado a [-1,1]. Las dos pseudoobservaciones neutras impiden sobrerreaccionar a una respuesta. Actualizar después de calcular afinidad y tensión, exactamente una vez. La evidencia de todos los ejes secundarios se contabiliza por igual inicialmente; calibrar si procede. No contar la respuesta actual dos veces.

Seleccionar pregunta sin repetir hasta agotar el banco, favorecer familias con menor evidencia y evitar la familia de la pregunta inmediatamente anterior mientras haya alternativas. Peso inicial 1/(1+N_familia), multiplicado por 1.5 si tiene una pareja comparable ya respondida con separación de al menos 2 rituales (no forzar esa pregunta). Mantener azar y no presentar dos miembros de un par seguidos salvo agotamiento. Tras agotar, permitir otro ciclo, evitando últimas 12 preguntas si hay alternativas. Para memoria acotada, conservar perfil acumulado, último registro por id, conjunto del ciclo y una cola corta; no guardar un historial ilimitado. La numeración de opciones no afecta el resultado.

## 2. Afinidades simbólicas iniciales

Cada firma indica ejes con dirección preferida: `+` = polo positivo del banco, `-` = polo negativo. No significa virtud ni defecto. Normalizar por número de ejes efectivamente observados, no penalizar desconocidos. Para un vector v (respuesta actual dividida por 2 o perfil previo), afinidad A_c(v) = promedio de s_j*v_j entre los ejes de la firma observados, o 0 si no hay coincidencia. h ya incorpora reducción por falta de evidencia. Si no hay historia pertinente, asignar su peso a la respuesta actual. Si esta tampoco aporta evidencia a una carta, su afinidad es neutra. Para una carta con ambas fuentes, puntuación = 0.5625*A_actual + 0.4375*A_historial (relación 45:35). Una distribución inicial p_c = 0.8*softmax(2*puntuación)_c + 0.2/K sobre K cartas implementadas proporciona azar real, no una elección determinista. Multiplicar por 0.25 si la carta ya fue obtenida en cualquier orientación y renormalizar; por 0.5 adicional si es la última obtenida. Calibrar estos factores. Nunca incluir cartas sin efecto funcional y arte terminado en producción. Sin bloqueo por personalidad. La semilla de tarot debe ser separada de oleadas, ruleta y efectos; separar preguntas, orden, arcano y orientación mediante subflujos reproducibles. RNG visual no afecta la partida.

| Arcano | Firma | Símbolos figurativos de referencia RWS |
|---|---|---|
| 0 El Loco | control+, riesgo+, incertidumbre+ | viajero, perro, precipicio, rosa |
| I El Mago | control-, decision-, ambicion+ | mesa, cuatro instrumentos, mano alzada |
| II La Sacerdotisa | decision+, incertidumbre+, autonomia- | columnas, velo, rollo, luna |
| III La Emperatriz | recursos+, cooperacion+, cambio+ | corona estrellada, trigo, bosque |
| IV El Emperador | control-, riesgo-, responsabilidad- | trono de carneros, cetro, montañas |
| V El Hierofante | cambio-, control-, autonomia+ | maestro, dos figuras, llaves |
| VI Los Enamorados | cooperacion+, autonomia+, responsabilidad+ | pareja, ángel, árboles |
| VII El Carro | ambicion+, persistencia-, responsabilidad- | auriga, esfinges, dosel |
| VIII La Fuerza | persistencia-, riesgo-, ambicion- | mujer, león, infinito |
| IX El Ermitaño | autonomia-, cooperacion-, decision- | anciano, linterna, bastón |
| X La Rueda de la Fortuna | incertidumbre+, cambio+, riesgo+ | rueda, esfinge, figuras aladas |
| XI La Justicia | decision-, responsabilidad-, recursos- | balanza, espada, trono |
| XII El Colgado | ambicion-, persistencia+, incertidumbre+ | figura suspendida, halo, árbol |
| XIII La Muerte | perdida+, cambio+, persistencia+ | esqueleto a caballo, estandarte, sol |
| XIV La Templanza | cooperacion+, riesgo-, ambicion- | ángel, dos copas, agua y tierra |
| XV El Diablo | recursos-, ambicion+, perdida- | figura central, cadenas, pareja |
| XVI La Torre | cambio+, perdida+, riesgo+ | torre, rayo, corona caída |
| XVII La Estrella | incertidumbre+, persistencia+, ambicion- | figura arrodillada, vasijas, estrellas |
| XVIII La Luna | decision+, incertidumbre-, riesgo- | luna, dos torres, perro, lobo, crustáceo |
| XIX El Sol | recursos+, ambicion+, incertidumbre+ | sol, niño, caballo, girasoles |
| XX El Juicio | responsabilidad+, perdida+, cambio+ | ángel, trompeta, figuras que se levantan |
| XXI El Mundo | cooperacion+, responsabilidad+, ambicion- | figura central, guirnalda, cuatro criaturas |

Las firmas son decisiones de game design, no correspondencias psicológicas establecidas científicamente. El significado tradicional se consulta en Waite y las ilustraciones de Smith; no confundir nuestra adaptación con la interpretación adivinatoria literal.

## 3. Orientación y tensión contextual

Solo los pares explícitos `contextoComparable` permiten medir oposición directa. Para una respuesta actual con peso a y una respuesta anterior de su pareja con peso b en el eje principal, T_j = min(abs(a),abs(b))/2 si a*b<0 y ambos son distintos de cero; si no, 0. No comparar respuestas de situaciones no emparejadas. No comparar una pregunta consigo misma ni sumar una respuesta dos veces. Conservar la última respuesta de cada miembro y su índice de ritual; comparar dentro de un intervalo de 12 rituales. Para mantener relevancia posterior, guardar evidencia de tensión por eje con decaimiento por ritual, por ejemplo 0.85; combinar máximo entre tensión nueva y tensión previa decaída, no sumar sin límite. La inversión de cada arcano usa solo sus ejes: T_c = máximo de las tensiones pertinentes. p_invertida = 0.10 + 0.40*T_c. Sin evidencia comparable: 10%. La intensidad de una respuesta sola no prueba contradicción. Nunca mostrar mensajes que acusen de incoherencia. Esta es una regla de interpretación narrativa. Registrar trazas únicamente en modo desarrollo, sin enviar ni persistir respuestas. En producción solo mostrar efecto y coste de la orientación.

## 4. Efectos: objetivos de prototipo, valores iniciales

Los ocho con * son el primer corte integrado. Todos los porcentajes son candidatos de nivel 1, no balance aprobado. Los efectos afectan a plantas comprables salvo mención explícita de central. Definir una única fuente de verdad; descripciones deben derivar de parámetros efectivos. Una mejora que no se puede medir no entra en el sorteo. Si una orientación no ofrece una ventaja situacional real, rediseñarla antes de activarla.

| Arcano | Normal | Invertido |
|---|---|---|
| 0 Loco | −15% coste al plantar en zona descubierta recientemente (primeras 3 compras por región) | −30% en esas compras; nacen al 70% de vida |
| I Mago * | +12% daño directo y de área | +35% daño directo y de área; intervalo de ataque +15% |
| II Sacerdotisa | avisos reales de enemigos ya emitidos a mayor distancia, y anticipación de oleada +2 s | aviso +4 s y radio de detección mayor; alcance ofensivo −10%; validar utilidad en cámara amplia |
| III Emperatriz * | +15% generación pasiva cuando está habilitada | +35% generación pasiva, +12% coste de compra |
| IV Emperador * | +12% vida máxima con ≥3 vecinas comprables vivas en ocho adyacencias | +30% vida máxima en agrupación, +15% coste de compra si se planta con ≥3 vecinas |
| V Hierofante | +12% daño con ≥2 vecinas de misma especie | +32% daño en esa formación; +20% componente de escalada de coste de la especie |
| VI Enamorados | +12% daño con vecina de especie distinta | +28% en esa condición; −10% daño sin vecina distinta |
| VII Carro | +12% alcance ofensivo a ≥4 casillas de la central | +28% alcance en avanzada, −15% vida máxima allí |
| VIII Fuerza | −12% daño de mordidas recibido por plantas comprables | +35% daño directo y de área; −18% vida máxima |
| IX Ermitaño * | +25% daño con 0 vecinas; +15% con 1 | +60% con 0; +30% con 1; −15% con ≥2 |
| X Rueda | un bonus de +12% a daño, vida o generación por oleada, semilla separada | bonus de +30% en uno y −12% en otro, sorteados al iniciar preparación |
| XI Justicia | reembolso de pala +10 puntos porcentuales del coste pagado | +25 puntos porcentuales, rearme +75%; techo global de reembolso 80% |
| XII Colgado | al recibir mordida bajo 50% de vida, el agresor se ralentiza al desplazarse 20% durante 3 s | 45% durante 5 s, planta bajo 50% recibe +20% daño de mordida; no modifica cadencia de mordida |
| XIII Muerte * | −25% a próxima compra en casilla de planta destruida por enemigo | −50% a esa compra, rearme mínimo 4 s; vale una vez, expira al terminar próxima invasión |
| XIV Templanza * | +6% daño por especie distinta propia presente en vecinas (máximo 3 especies distintas) | +14% por especie distinta (máx 42%); −10% daño si no hay diversidad |
| XV Diablo * | daño adicional 30%*E/(100+E) | daño adicional 80%*E/(100+E); consume 0.5*E/(100+E) energía/s en combate, sin saldo negativo |
| XVI Torre | destrucción enemiga causa 4 daño en radio 1.5 casillas | 9 daño en radio 2, 3 daño a otras plantas comprables; daño secundario nunca dispara explosión ni premio de pérdida |
| XVII Estrella * | al cerrar invasión cura 8% de vida faltante de cada planta viva, central incluida | cura 25% de faltante; plantas comprables reciben +10% daño durante combate |
| XVIII Luna | enemigos en avance pueden desviarse por 1 s, máximo una vez por enemigo, 10% de probabilidad | 25% de probabilidad, desvío 1.5 s; +20% velocidad durante 2 s posteriores; no salir del mapa ni rebotar indefinidamente |
| XIX Sol | +15% daño a plantas a ≤3 casillas de central | +35% ahí, −15% vida máxima fuera de ese radio |
| XX Juicio | al morir por enemigo, 10% de dejar brote que renace tras 6 s si la casilla sigue libre, 50% vida | 25%, renace con 30% vida y rearme 4 s; máximo un renacimiento por linaje, sin coste pagado/reembolso nuevo |
| XXI Mundo | +5% daño por cuadrante con ≥2 plantas a ≥3 casillas de central (máx 20%) | +10% por cuadrante (máx 40%); −12% daño en cuadrante con >50% de plantas elegibles |

Precisiones: distancia euclidiana entre centros; cuadrantes con desempate explícito en ejes, central excluida. En Muerte no aplicar descuento por pala ni por autodaño, y almacenar un solo crédito por casilla. Ermitaño cuenta vecinas vivas comprables; su condición es alcanzable por expansión y pala. Templanza cuenta especies comprables diferentes de la planta evaluada. La Sacerdotisa debe tener beneficio comprobable incluso sin ocultar información base; si falla, sustituir por otro efecto simbólicamente equivalente. La Torre y Juicio requieren cola de eventos, orígenes de daño y protección de ciclos. Efectos de alcance, coste y cadencia usan los mismos valores en UI, combate y simulación. No crear buffs que no se aplican a ninguna habilidad útil; identificar contrapartidas visibles y contextualizar en la carta.

## 5. Acumulación y composición

Identidad arcano+orientación; ambas manifestaciones pueden coexistir (propuesta explícita). Duplicados suben nivel; el HUD agrupa y no crece indefinidamente. Curva inicial acotada para efectos escalables: factor(n) = 1 + 0.75*(n-1)/(n+2), n>=1. Aplica tanto al beneficio como a su coste cuando corresponda; no escalar automáticamente efectos discretos, duraciones o probabilidades sin reglas específicas. Sin nivel máximo artificial. Limitar cada atributo final (por ejemplo coste >=1, intervalos >=0.25 s, reembolso <=80% de coste pagado, vida máxima >=1, probabilidades [0,1], daño no negativo, ralentización con suelo de velocidad). Definir caps de balance tras simulación, no fijar los ejemplos como aprobación final.

Combinar modificadores por atributo en etapas explícitas: base, suma de porcentajes de una familia, factores de familias distintas si se justifican, límites y redondeo final. No multiplicar indiscriminadamente todos los bonos ni depender del orden de adquisición. No mutar config global ni catálogo base compartido. Vida máxima dinámica: conservar fracción de vida al cambiar máximo o estrategia equivalente que no cure por colocar/retirar repetidamente; mantener precisión y no disparar muerte/recompensa por recalcular. Si un efecto debe aplicarse a plantas previas y futuras, especificarlo. Al volver a jugar, perfil, niveles, eventos y modificadores vuelven a cero. Catálogo de descubrimientos persiste solo IDs/orientaciones, con versión y tolerancia a almacenamiento no disponible; nunca respuestas, perfil o historial personal.

## 6. Integración y experiencia

Usar `src/recompensas.js`, `src/oleadas.js`, `src/juego.js`, `src/simular.js` existentes. Antes de tocar, comprobar estado actual y ramas. La etapa 09 usa `RECOMPENSAS`, el punto de integración `alTarot` y `finalizarTarot()`. El simulador aplica los mismos efectos que la partida. No activar sin un receptor integrado. Fase: recompensa revelada → transición negro → una pregunta → respuesta confirmada una vez → carta y efecto/contrapartida → confirmar continuar → siguiente preparación. No generar energía ni simular combate, compras, retirada o preparación durante ritual. Reanudación idempotente; proteger reinicio, destrucción del montaje y callbacks obsoletos. Modo reducido/skip animación no altera resultado. Sin temporizador ni pregunta forzada por tiempo. Pausa y cambio de pestaña conservan estado. Aplicar curación de cierre y otros eventos con orden explícito (Estrella actúa sobre invasiones completadas después de obtenerla; no retroactivamente). El reloj de supervivencia activo se separa del tiempo total incluyendo rituales.

Arte: skills de Herbarium obligatorias, leer AGENTS.md y docs. Usar la tipografía vigente (Terminus si es la instalada; verificar), no volver a MonoMEK sin autorización. Dibujar cartas figurativas originales con iconografía RWS reconocible, matriz/raster lógico y escalado entero. No sustituir por iconos abstractos o arte suavizado. Definir plantilla común y proporción, elegir resolución lógica que permita figuras legibles; invertir 180° por coordenadas enteras, mantener título y descripción legibles aparte. Probar a tamaño real. Verificar licencia/atribución de cualquier referencia; no importar escaneos de barajas modernas. Fondo negro, pregunta y opciones claras, revelación breve, efecto y contrapartida con texto real, carta hacia mazo. Mazo pequeño en HUD, consulta pausada, lista escalable y navegable por teclado/tacto. Herbario incluye Tarot; desbloqueos persistentes locales, mazo activo separado. La derrota podrá consultar estadísticas de la partida y mazo, reiniciar, contemplar el jardín congelado si es viable; no inventar lectura psicológica final todavía.

## 7. Validación

Validar esquema y cobertura de las 120 preguntas, 360 respuestas y 12 pares explícitos. Comprobar orden barajado, ausencia de repetición hasta agotar, perfiles con evidencia escasa, neutralidad, independencia de RNG, casos sintéticos opuestos y coherentes, afinidad específica, probabilidades de inversión entre 10–50%, diversidad de cartas y repetición, ausencia de cartas no implementadas. Probar todas las orientaciones activas y combinaciones con muchas repeticiones, orden de adquisición, modificadores de vida/coste/reembolso, congelación de estado y callbacks duplicados. Pruebas no solo de instantáneas.

Comparar baseline sin tarot, cartas normales, invertidas y mezcla mediante semillas emparejadas, simulador real y políticas iguales: jardín compacto, monocultivo radial, mixto, disperso, reactivo, reorganizador y adversarial. Incluir políticas que respondan con perfiles distintos sin conocer recompensas futuras. Al menos 100 semillas independientes por política principal tras calibración. Medir supervivencia censurada, oleadas, primer tarot, distribución de arcanos/inversiones, pérdidas, energía, reutilización de pala, daño y reacciones a efectos espaciales. Probar casos de 15, 30 y 60 minutos (este último de estrés), niveles altos y combinaciones adversas. No confundir política de respuestas sintética con psicología humana. Evaluar si cada invertida tiene al menos un escenario donde resulta competitiva. Ajustar director solo con evidencia y separar cambios base de modificaciones por tarot. El objetivo de ~15 minutos es referencia, no límite. No considerar diversión demostrada por supervivencia. Probar navegador en resoluciones y DPR habituales, teclado, tacto, movimiento reducido y reinicio. Evidencia visual antes/después a escala real, no declarar validación humana o física si no ocurrió.

## Fuentes de referencia

- Arthur Edward Waite, *The Pictorial Key to the Tarot* (1910): https://en.wikisource.org/wiki/The_Pictorial_Key_to_the_Tarot — fuente de iconografía y simbolismo; nuestras mecánicas no son sus significados literales.
- Walter Mischel y Yuichi Shoda (1995), *A cognitive-affective system theory of personality*: https://pubmed.ncbi.nlm.nih.gov/7740090/ — fundamento conceptual de considerar el contexto, no validación del modelo propuesto.
