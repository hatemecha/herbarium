# Hoja de ruta

Orientativa. No autoriza a implementar la etapa siguiente. El estado de abajo sale de leer el código y de correr `npm test` y el navegador en la etapa 05, no de dar por cerrada una etapa porque un agente anterior la diera por hecha.

Ninguna etapa está aceptada formalmente por el propietario en esta consolidación.

## Etapas

| # | Etapa | Estado |
| --- | --- | --- |
| 1 | Tablero, planta central, iluminación y energía | Implementada en código. La matriz de viewports de la etapa 1 sigue sin repetirse en esta consolidación; ver “Compatibilidad” abajo. |
| 2 | Hover, selección y hormigas | Implementada. La selección solo cae en casillas ocupadas. Sigue sin efecto de juego. |
| 3 | Catálogo, cerbatana y expansión por adyacencia | Implementada. Tarjeta en canvas, no un control web genérico. |
| 4 | Primer escarabajo y combate básico | Implementada. Lógica y pruebas en verde. |
| 5 | Consolidación artística y jugable del combate | Implementada en código y verificada en navegador (ver abajo). Pendiente de aceptación del propietario. |
| 6 | Oleadas | No empezada. Propuesta en [PROPUESTA_OLEADAS.md](PROPUESTA_OLEADAS.md). |
| 7 | Nuevas plantas y enemigos | No empezada. |
| 8 | Economía y progresión de dificultad | No empezada. Hoy solo existe +1 energía/s y el coste 10. |
| 9 | Preguntas de personalidad | No empezada. No hay preguntas escritas. |
| 10 | Tarot y mejoras | No empezada. No hay cartas ni efectos. |
| 11 | Balance de una partida completa | No empezada. Los números actuales son provisionales. |
| 12 | Sonido y detalle artístico | No empezada. No hay audio. |
| 13 | Integración en la web personal | No empezada. Notas en [ARCHITECTURE.md](ARCHITECTURE.md). |

## Etapa 05: lo hecho y lo verificado

- **Escarabajo rediseñado** desde cero, de perfil, con siete cuadros de pixel art. Ver [ART_DIRECTION.md](ART_DIRECTION.md).
- **Familia cromática de insectos** derivada de los colores activos (`rolesInsecto`), no de hex nuevos.
- **Vuelo, despegue, aterrizaje, alimentación y caída** como estados visuales derivados de temporizadores que no tocan la simulación.
- **Derrota** con economía y combate detenidos, marchitez y desintegración terminadas, luz de la central apagada de forma continua y aviso retardado.
- **Pruebas**: 46 en verde, en `tests/`. Incluyen escenarios de balance deterministas (`tests/escenario.mjs`, `tests/escenarios.test.mjs`) y pruebas del sprite, los estados visuales y la paleta (`tests/insecto.test.mjs`).
- **Navegador (Chromium headless, reloj falso y semilla fija)**: partidas con cerbatana y sin defensa, derrota, reinicio en dos rondas (energía a 0 y los mismos tiempos de aparición), movimiento reducido, viewport 390×844 a dpr 3, horizontal 844×390 y marca distinta. Sin errores de página ni de consola. El único 404 es `/favicon.ico`, que el proyecto no incluye.

## Problemas conocidos

- **Sin dispositivo físico.** No hay prueba en un teléfono, ni en Safari iOS, ni en Android. Los toques sintéticos no sustituyen eso.
- **Pausa al ocultar la pestaña.** Verificada la lógica: con `document.hidden` forzado y `visibilitychange`, la energía se congela y se reanuda sin saltos. No verificada con una pestaña oculta de verdad: en headless no se puede ocultar una pestaña.
- **Selección inerte.** Marca la planta y se limpia al colocar. No abre estadísticas. El propietario todavía no eligió entre quitarla o reservarla.
- **Escarabajo que sobrevive a la derrota.** Si la central cae con un escarabajo vivo, queda congelado en su último cuadro debajo del aviso. Es una decisión visual, no un error: el combate se detiene. Confirmar con el propietario si debe posarse, irse o desaparecer.
- **Derrota y el primer encuentro.** El balance del primer escarabajo está medido, no ajustado. Una cerbatana bien colocada basta. Ver [BALANCE.md](BALANCE.md).
- **Movimiento reducido.** Cubierto para pulso, idle, hormigas, emisión ambiente, ráfaga de energía, ráfagas de combate, retroceso de la cerbatana y aleteo del escarabajo. Los fundidos (muerte y marchitez) se mantienen porque son opacidad, no desplazamiento.
- **Compatibilidad con la web personal.** `--mono` de `nicotinalex-web` no incluye MonoMEK; hay que decidir la pila al integrar. `touch-action: none` en el canvas; hay que revisar el scroll al embeberlo.
- **Git.** No hay commit de esta etapa. Ver el estado en la respuesta de consolidación.

## Fuera de alcance hasta nuevo pedido

Oleadas, más enemigos, más plantas, recompensas, tarot, mejoras, progresión, sonido, monetización y la integración en `nicotinalex-web`.
