# Contrato propuesto de rasterización · revisión 2026-11-27

## Qué existe y qué falta
- `src/escala.js` acepta escala fraccionaria cuando el entero ocupa menos que `ESCALA.aprovechamientoMinimo` (0,8). Esto contradice una exigencia estricta de bloques de tamaño uniforme. La alternativa debe probarse en móviles antes de adoptarla.
- `src/render.js` ya dibuja escena, luz y sprites en lienzos lógicos de 176 y hace nearest-neighbor a salida. Mantenerlo. La luz de color usa una grilla más gruesa (2 px lógicos); es una decisión por capas, no un permiso para mezclar tamaños de sprites o UI.
- `src/catalogoUI.js` y `pintarEnergia` en `src/juego.js` escalan el contexto y dibujan `fillText` directamente: un canvas escalado puede producir antialiasing del texto en resolución física aunque `imageSmoothingEnabled=false`. La opción `maxWidth` de las cartas puede comprimir glifos.
- `src/pausa.js` conserva diálogo semántico y retratos animados; `styles.css` usa `clip-path`, bordes, rem, fuentes y medidas CSS propias. Los retratos tienen múltiplos CSS de casilla, no una garantía de múltiplo físico a cualquier DPR.
- Motas de energía DOM de 2px CSS, `drop-shadow` de carta y foco CSS: revisar integración con la misma grilla. No tocar automáticamente sin comprobar la función accesible.

## Tres espacios
1. Simulación: posición y velocidad continuas en casillas, paso 1/60 s; no redondear mecánica.
2. Arte: píxeles lógicos enteros. Mundo: 176×176. UI: elegir escala visual propia, coherente por familia; usar módulo común de métricas y primitivas. No obligar a toda la pantalla a tener la resolución del tablero, porque texto y accesibilidad tienen necesidades distintas.
3. Presentación: para W×H lógicos, escala física entera k >= 1; backing store W*k × H*k; tamaño CSS backing / DPR. Origen físico entero. Medir el rectángulo efectivo del canvas y no asumir que CSS entero implica píxel físico entero (DPR 1.25, 1.5, etc.). Recalcular si cambia viewport, DPR o fuente. Mantener hit testing a partir del rect real.

Ejemplo: 390 CSS px y DPR=3 dan 1170 físicos; 176*6=1056 físicos, 352 CSS px. Con espacio horizontal suficiente, centrar con margen; los 114 físicos restantes no justifican estirar. Calcular ambos ejes. Si no entra ni a 1×, priorizar reorganizar/permitir zoom o scroll accesible; documentar un fallback, no fingir pixel-perfect.

## Arquitectura mínima sugerida, no obligación de crear archivos
- Reutilizar `escala.js` para elegir escala y alinear origen. Extraer una utilidad común solo si elimina duplicación real.
- Render de UI: un canvas fuente 1× por familia o superficie + salida escalada mediante nearest-neighbor; copiar rectángulos de atlas enteros. DOM semántico encima/alrededor para eventos, lectores, foco, texto largo. El overlay debe coincidir exactamente con el elemento visual.
- Atlas MonoMEK: conservar OTF y CC0, comprobar sus métricas reales y glifos; rasterizar una vez por tamaño lógico aprobado. Comparar silueta del glifo y legibilidad antes de optar por umbral de alfa; un umbral indiscriminado puede borrar trazos. No exigir que el texto accesible invisible sea bitmap.
- Marcos y paneles con primitivas raster: rectángulos, esquinas escalonadas, marcas de selección. `dialog` sigue manejando modal, Escape y foco; no perder la semántica por cambiar su piel. El texto de lectura prolongada puede quedar como DOM legible con excepción explícita si una solución bitmap lo perjudica.
- Capas: cualquier opacidad uniforme o bruma cuantizada se compone en la capa lógica; no interpolar los bordes de la geometría. Si se conserva una luz de salida suave aprobada, aislarla de sprites, texto y controles y declararla como excepción. La dirección reciente del juego favorece luz escalonada.

No introducir motores, librerías de UI o pipeline de build solo por aplicar este contrato. El objetivo es una migración de superficies visuales, sin tocar balance, comportamiento ni eventos.
