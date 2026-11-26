# Hoja de ruta

Orientativa. No autoriza a implementar la etapa siguiente. El estado de abajo sale de leer el código y de correr `npm test` el 26 de noviembre de 2026, no de dar por cerrada una etapa porque un agente anterior la diera por hecha.

Ninguna etapa está aceptada formalmente por el propietario en esta consolidación.

## Etapas

| # | Etapa | Estado |
| --- | --- | --- |
| 1 | Tablero, planta central, iluminación y energía | Implementada en código. Esta auditoría no repitió la matriz de viewports (320×568, 360×640, 390×844, 844×390, 768×1024, 1280×720, 1920×1080). |
| 2 | Hover, selección y hormigas | Implementada. La selección solo cae en casillas ocupadas. Sigue sin efecto de juego. |
| 3 | Catálogo, cerbatana y expansión por adyacencia | Implementada. Tarjeta en canvas, no un control web genérico. |
| 4 | Primer escarabajo y combate básico | Lógica implementada. 14 pruebas de combate en verde. El duelo completo en el navegador (tiro, baja, desintegración, luz que se va, derrota, reinicio) no se rejugó aquí. |
| 5 | Evaluación y ajuste del combate | No empezada. Depende de jugar la etapa 4 y de una decisión del propietario. |
| 6 | Oleadas | No empezada. |
| 7 | Nuevas plantas y enemigos | No empezada. |
| 8 | Economía y progresión de dificultad | No empezada. Hoy solo existe +1 energía/s y el coste 10. |
| 9 | Preguntas de personalidad | No empezada. No hay preguntas escritas. |
| 10 | Tarot y mejoras | No empezada. No hay cartas ni efectos. |
| 11 | Balance de una partida completa | No empezada. Los números actuales son provisionales. |
| 12 | Sonido y detalle artístico | No empezada. No hay audio. |
| 13 | Integración en la web personal | No empezada. Notas en [ARCHITECTURE.md](ARCHITECTURE.md). |

## Problemas conocidos

- **Duelo sin verificar en vivo.** Una cerbatana en `(6, 5)` no alcanza el perímetro. El escarabajo puede tardar unos 10–14 s en acercarse. Mirar a los 5 s del spawn y no ver una baja no demuestra un fallo. Tampoco hay una partida de esta auditoría en la que se lo vea morir.
- **Derrota congelada.** En cuanto `derrota()` es verdadero, `simular` no vuelve a avanzar el jardín ni el combate. La marchitez de la central y la desintegración que estuviera en curso se quedan en el frame de la muerte, debajo del aviso.
- **Selección inerte.** Marca la planta y se limpia al colocar. No abre estadísticas. El propietario todavía no eligió entre quitarla o reservarla.
- **Movimiento reducido a medias.** El pulso, el idle, las hormigas, la emisión ambiente y la ráfaga de energía se calman. Las ráfagas de impacto, mordida y disparo se siguen pidiendo.
- **Pausa al ocultar la pestaña.** El código corta el frame y no recupera el tiempo perdido. No se comprobó con una pestaña real: un `document.hidden` forzado no gobierna el `requestAnimationFrame` del navegador.
- **Sin dispositivo físico.** No hay prueba en un teléfono, ni en Safari iOS, ni en Android. Los toques sintéticos no sustituyen eso.
- **MIME de la fuente.** `servidor.mjs` no declara `.otf`. Chromium la aplicó igual en la captura. Otro navegador puede rechazar `application/octet-stream`.
- **`package.json`.** La descripción vieja hablaba solo de la etapa 01. Quedó actualizada en esta consolidación. El comportamiento del juego no cambió.
- **Git.** El directorio no era un repositorio al auditarlo. No hay remoto, ni commit, ni licencia del juego.

## Fuera de alcance hasta nuevo pedido

Oleadas, más enemigos, más plantas, recompensas, tarot, mejoras, progresión, sonido, monetización y la integración en `nicotinalex-web`.
