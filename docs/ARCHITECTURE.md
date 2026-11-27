# Arquitectura

Juego estático. Módulos ES nativos, Canvas 2D, sin bundler y sin dependencias. Node 24 sirve los archivos y corre las pruebas; el navegador no necesita Node.

## Disposición

```
index.html              monta #herbario y carga src/main.js
styles.css              página, energía, catálogo, derrota, MonoMEK
servidor.mjs            estático, puerto 4173 o PORT
package.json            start y test
src/main.js             llama a montarHerbario
src/juego.js            partida, bucle, pausa, reinicio
src/config.js           constantes, incluido el balance
src/estado.js           energía, tiempo, impulso de luz
src/tablero.js          casillas y ocupación
src/jardin.js           alta, reglas de colocación, marchitez
src/combate.js          enemigos, disparos, reflejo, eventos, derrota
src/oleadas.js          director, presupuesto, patrones y apariciones
src/economia.js         coste según plantas vivas
src/aleatorio.js        generador con semilla
src/simular.js          partida sin interfaz
src/estrategias.js      políticas automáticas de compra
src/catalogo.js         definición de plantas y enemigos
src/entidades/          planta y enemigo: datos, estados visuales y temporizadores de dibujo
src/sprites/            matrices y construcción de fotogramas
src/render.js           capas y dibujo
src/iluminacion.js      oscuridad por transmisión
src/paleta.js           lectura de variables y roles
src/escala.js           DPR, escala, puntero → casilla
src/interfazPixel.js    presentación física, glifos y primitivas raster de UI
src/seleccion.js        hover y selección
src/colocacion.js       modo de plantado
src/catalogoUI.js       tarjetas de compra en canvas
src/pausa.js            diálogo de pausa y fichas de especies
src/descubrimientos.js  registro persistente de especies
src/marcadores.js       hormigas y halos
src/particulas.js       pool visual, tope 12
src/animacion.js        secuencia temporal
src/derrota.js          aviso y reinicio
tests/                  node:test, importa src/ directo
assets/fonts/           MonoMEK y su CC0
```

## Arranque

`montarHerbario` (`src/juego.js`) asegura las variables CSS, lee la paleta, arma el DOM, preconstruye los fotogramas y crea la partida. Una partida tiene tablero, estado, partículas, renderer, jardín con la central sembrada, combate, selección, catálogo y colocación. `reiniciar` destruye los listeners de esa partida y construye otra. `destruir` además corta el frame, el `ResizeObserver` y vacía el contenedor.

## Simulación

`requestAnimationFrame`. El delta se recorta a `SIMULACION.tiempoMaximo` (0,1 s) y se acumula. Cada paso fijo es `1/60` s. En ese paso, si no hay derrota:

1. `avanzar` suma energía y, al cruzar un entero, dispara el impulso de luz.
2. El jardín actualiza animación, destello y marchitez. Al llegar la opacidad a 0 retira la planta y avisa al render para quitar la luz.
3. El combate avanza el director de oleadas, el movimiento, los disparos, los proyectiles y las muertes. Sin director, conserva el encuentro único de un escarabajo: lo usan las pruebas de la etapa 05.
4. Los eventos de ese paso generan partículas. Una mordida a la central también sube el impulso.
5. Selección, colocación y animación del catálogo avanzan con el mismo `dt`.

Si `document.hidden` es verdadero, se cancela el frame y no se simula. Al volver, el acumulador se pone a 0: no hay salto ni doble bucle. Verificado con `visibilitychange` forzado; no con una pestaña oculta de verdad, que headless no permite.

Con la central muerta (`derrota()`), el paso cambia de función:

1. Energía e impulso no suben. El impulso cae con `apagar` (`src/estado.js`), y el tiempo visual sigue corriendo para que la luz se atenúe sin salto.
2. El jardín sigue actualizando la marchitez: la opacidad de la central baja y, al llegar a 0, se retira.
3. El combate solo termina las desintegraciones en curso, quita los proyectiles y no dispara, no muerde y no mueve nada.
4. `juego.js` muestra el aviso cuando la opacidad de la central llega a 0. Una vez.

`colocable` (`src/jardin.js`) devuelve falso con la central muerta, y el catálogo no entra en modo colocación. Así no hay compra después de la derrota aunque se toque la tarjeta.

El dibujo corre una vez por frame, después de los pasos, y no empuja la simulación.

## Render

Cuatro lienzos lógicos de 176 y el canvas visible:

1. Fondo: terreno y grilla de 1 px, pintados una vez.
2. Escena: plantas (con opacidad y retroceso) y, antes que el insecto, la sombra de cada escarabajo vivo en el suelo. Luego el insecto con el cuadro que pide su estado.
3. Capa luminosa: los mismos sprites atenuados o a plena luz propia, destellos, proyectil de 2 px, partículas, hormigas y fantasma de colocación.
4. Oscuridad: `ImageData` con alfa Bayer, encima de la escena.
5. Salida: escena, oscuridad y capa luminosa, nearest-neighbor, a `pixeles` físicos. Luego, con suavizado, los gradientes.

`registrarPlanta` / `retirarPlanta` conectan la luz estática. La central no usa ese mapa: su luz es la dinámica de `iluminacion.actualizar`, que recibe la opacidad de la central para apagarse con su marchitez.

Un escarabajo se dibuja en la capa luminosa con alfa `AUTOLUZ_ENEMIGO` (0,8). Esa capa va encima de la oscuridad, así que el insecto se lee en lo oscuro sin pasar por el halo.

`fotogramaEnemigo` y `elevacion` (`src/entidades/enemigo.js`) son funciones puras de estado y tiempo visual. Ninguna de ellas escribe en `x`, `y` ni en los contadores de combate.

## Coordenadas

- Casilla entera `(x, y)`. Centro de juego: `(x + 0,5, y + 0,5)`.
- Píxel lógico de una casilla: `tablero.origen`.
- El escarabajo guarda `x, y` en casillas. Se dibuja en `round(x * celda - 8)`.
- El puntero: rectángulo real del canvas en CSS → 176 px lógicos (`pantallaAMundo`) → `floor` de casilla (`celdaEnMundo`). La salida usa un múltiplo físico entero, incluso si la caja CSS es fraccionaria.

El bloqueo del escarabajo mira media casilla por delante de su centro (`ALCANCE_DE_BLOQUEO`).

## Eventos de entrada

Pointer Events. `gestos.js` captura el puntero y distingue toque, pellizco, desplazamiento y arrastre de carta. Un toque se resuelve al soltar, con prioridad para la semilla seleccionada. El arrastre de carta reutiliza la previsualización y valida la compra al soltar. El hover ignora `pointerType === 'touch'`. La cámara ajusta escala y origen físico del tablero dentro de su área visible. El HUD y los menús conservan sus propias escalas.

## Paleta en caliente

Los fotogramas se rasterizan una vez en `montarHerbario`, con la paleta de ese momento. Reiniciar la partida reutiliza esos canvas. Cambiar las variables CSS después no recolorea nada hasta volver a montar el juego. Hoy la página no ofrece ese cambio.

## Pruebas

`npm test` ejecuta `node --test` sobre `tests/*.test.mjs`. No levantan DOM ni canvas.

- `tests/jardin.test.mjs` — centro, adyacencia de ocho, ocupación, energía, expansión.
- `tests/combate.test.mjs` — aparición a los 20 s, un solo escarabajo, velocidad, bloqueo, mordisco, reanudación, retirada, alcance, cadencia, colisión con paso grande, muerte, derrota, ocho direcciones. Tras la derrota: sin disparos, mordidas ni proyectiles, y la desintegración termina. Gesto de mordida y despegue.
- `tests/insecto.test.mjs` — sprite (16×16, códigos con rol, vuelo solo con alas, cuerpo de 8 a 11 px), estados visuales y sus transiciones, altura visual sin tocar la posición lógica, paleta derivada y su distancia a la marca y a la chispa.
- `tests/escenarios.test.mjs` — el encuentro único de la etapa 05, no la partida de oleadas.
- `tests/oleadas.test.mjs`, `tests/especies.test.mjs`, `tests/simular.test.mjs` — presupuesto, semilla, reflejo, cupo, perímetro lleno, especies y reproducibilidad.
- `tests/corrida.mjs` — 100 semillas por estrategia. No entra en `npm test`. Sale el resumen en `docs/simulacion.json`.

## Ejecutar

```
npm start
npm test
```

`npm start` publica el directorio en <http://localhost:4173/> con `Cache-Control: no-cache` y rechaza rutas que salgan de la raíz. No envía cabeceras CORS. El mapa de tipos incluye `.otf` para MonoMEK. `galeria.html` es una hoja de sprites y no está enlazada desde `index.html`.

## Cómo añadir contenido

Planta:

1. Matriz, códigos, variantes, secuencia y núcleo en `src/sprites/`.
2. Entrada en `PLANTAS` (`src/catalogo.js`): id, nombre, `comprable`, coste, vida, ataque si dispara, luz y resplandor si ilumina, `arte`.
3. Si el ataque no es el de la cerbatana, extender `dispararCerbatanas` en `src/combate.js` o extraer ahí el comportamiento. No copiar la fórmula en el render.
4. El catálogo UI lista `COMPRABLES` solo. La central queda fuera.
5. Prueba de colocación o de ataque en `tests/`, con los números leídos de `BALANCE`.

Enemigo:

1. Sprite en `src/sprites/` y entrada en `ENEMIGOS`.
2. Entrada en `ENEMIGOS` con vida, velocidad, daño, intervalo, radio, amenaza y `locomocion` (`vuelo` o `suelo`). El combate ya lee el tipo de cada individuo. El dibujo pide `fotogramaEnemigo`.
3. El dibujo asume `frames[id][0][variante]` y `mirada` ±1. Otra orientación pide el mismo esquema de direcciones que la cerbatana.

Mecánica nueva: regla en el módulo que ya posee ese estado (`jardin`, `combate`, `estado`), presentación en `render` o en la UI existente, número en `src/config.js`.

## Integración futura en nicotinalex-web

La web es Astro y ya define las mismas variables de color. `asegurarVariables` no las pisa. El juego puede montarse llamando a `montarHerbario(elemento)` sin bundler, sirviendo `src/`, `styles.css` y `assets/fonts/`.

Choques a resolver cuando toque, no antes:

- `--mono` de la web no incluye MonoMEK. Hay que cargar el `@font-face` y decidir la pila.
- `touch-action: none` está en el canvas. El resto de la página debe poder hacer scroll.
- El juego ocupa la altura de la vista (`100dvh`) cuando es la página entera. Embebido, el contenedor tiene que darle alto.
- No hay build. Copiar los estáticos o servirlos como están evita meter un bundler solo para el juego.


## Etapa 07

La Campanilla y el Hongo se registran en `catalogo.js` con `ralentiza` y `area`. El combate aplica la ralentización mayor solo al desplazar, y usa el mismo evento de impacto para proyectiles y esporas. El renderer lee el estado y dibuja el alcance desde la selección o la previsualización. El toque confirma sobre la misma casilla. Son los mismos módulos en escritorio y móvil.

El director planifica composición, sector, punto de referencia y tiempo. Al emitir, resuelve el punto efectivo contra la ocupación vigente. Las pinzas intercalan lados y corrigen el tiempo de salida según el trayecto estimado. La política del simulador recibe enemigos presentes y el estado del jardín. La cola del director permanece fuera de ese contrato.

## Etapa 08

`juego.js` coordina pulsos breves de entrada y de fase usando el reloj de la partida. La compra y la colocación notifican sus señales desde los caminos existentes. `render.js` dibuja marcas, alcance y estados en la capa luminosa, sobre la grilla interna. El combate expone el color semántico del último golpe junto con los temporizadores visuales ya existentes. Los contadores escriben en el DOM al cambiar de texto y la región de anuncio comunica los cambios de fase.


## Etapa 08.2

La composición de producción vive en `styles.css`; el laboratorio cambia solo su distribución con `lab082.css`. `juego.js` coordina energía, cartas y estado cerrado del catálogo. `catalogoUI.js` mantiene la interacción con botones y dibujo en canvas; al cerrar se deshabilitan y se reconstruyen al reiniciar. `combate.js` añade metadatos de dirección y entrada al estado de ralentización, sin cambiar las decisiones ni cifras de combate. `render.js` y `entidades/enemigo.js` los traducen a píxeles y cadencia. El presupuesto de partículas se limita en config y usa un generador aleatorio visual separado; no consume la semilla del director. Los scripts de desarrollo instrumentan respuestas HTTP en Chromium, no abren una API de depuración de producción. Ver [dirección artística y validación](ART_DIRECTION.md#etapa-082--composición-movimiento-y-cierre-artístico).

## Etapa 08.3

`combate.js` fija el señuelo al entrar en su radio y reinicia el contador de mordidas al fijar el siguiente objetivo. Las reglas dependen del estado del enemigo. El director planifica al comienzo de la preparación y expone en `aviso()` solo la primera entrada durante los últimos cuatro segundos de esa fase. La simulación entrega a las políticas el jardín, el saldo y los insectos presentes. El catálogo dibuja una descripción DOM vinculada a la carta consultada. Los avisos de perímetro y de desvío consumen estado del juego en el renderer.
