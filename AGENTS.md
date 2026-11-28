# AGENTS.md

Contrato de trabajo para cualquier agente que modifique Herbarium. El código ejecutable manda sobre este archivo. Si un documento y el código se contradicen, describir la diferencia como pendiente y no “corregirla” por cuenta propia.

Leer este archivo antes de tocar el proyecto. El detalle vive en `docs/` y se consulta según la tarea:

- [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) — intención, lo implementado y lo futuro
- [docs/ART_DIRECTION.md](docs/ART_DIRECTION.md) — estética vigente y cómo extenderla
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — módulos, ciclo de juego y cómo añadir contenido
- [docs/BALANCE.md](docs/BALANCE.md) — lectura de los valores de `src/config.js`
- [docs/ROADMAP.md](docs/ROADMAP.md) — etapas y problemas conocidos

La hoja de ruta no autoriza implementar etapas futuras.

## Filosofía

- El desarrollo es incremental y lo dirige el propietario. Implementar solo la etapa o el cambio pedido.
- No anticipar funcionalidades, no tomar la hoja de ruta como permiso y no ampliar el alcance.
- No refactorizar por preferencia ni sustituir un sistema que ya funciona.
- Preferir la solución simple, proporcionada al tamaño del proyecto. Sin dependencias ni abstracciones nuevas salvo pedido explícito.
- Mantener el español y los nombres que ya usa el código.
- No revertir trabajo ajeno sin entender para qué está.
- Si una decisión importante no está tomada, preguntar o dejarla como propuesta.

## Antes de modificar un sistema

1. Leer este archivo y el documento de `docs/` que corresponda.
2. Leer el código relacionado y el diff local (`git status` cuando el repositorio exista).
3. Hacer el cambio mínimo.
4. Comprobar qué más del juego se ve afectado.
5. Actualizar solo la documentación que el cambio haya dejado falsa.

Separar, como ya hace el código, estado, simulación, entidades, configuración, render, sprites, iluminación, paleta e interacción. No reestructurar el proyecto para que coincida con otra lista.

Los valores de balance viven en `src/config.js`. No duplicarlos. La simulación no depende de la tasa de fotogramas: un cambio de FPS, resolución o `devicePixelRatio` no altera las reglas.

## Arte

La estética actual es parte del juego. Nadie está autorizado a rediseñarla en general.

Conservar pixel art auténtico, grilla interna, oscuridad como composición, luz ambiental corta, glow medido, espacio negativo, paleta semántica, Terminus, animación orgánica, interfaz mínima integrada y píxeles nítidos. La referencia de identidad es el propio juego y, por detrás, `nicotinalex-web`.

Antes de un sprite nuevo, estudiar `src/sprites/`. Nada de emojis, iconos de librería, vectores genéricos ni fotos como sustituto del pixel art. El glow no tapa un sprite flojo. Sin suavizado, rotación interpolada ni colores sueltos donde corresponda un rol de `src/paleta.js`. El pixel art original sigue nítido aunque un resplandor se dibuje en otra capa. No subir tamaño, brillo o densidad sin una razón artística o funcional.

## Escritorio y táctil

Toda mecánica nueva vale igual en puntero y en dedo. Sin hover obligatorio, sin clic derecho y sin arrastre si un toque alcanza. Misma lógica en todos los dispositivos. La casilla bajo el dedo se resuelve en coordenadas lógicas, no en píxeles de pantalla. Respetar safe areas. No bloquear el scroll o el zoom de la página que embeba el juego más de lo que el tablero ya necesita. Un `PointerEvent` sintético no cuenta como prueba en un teléfono.

## Balance

Los números actuales son provisionales hasta que el propietario diga lo contrario. Un cambio de balance se justifica con cálculo, simulación o partida, mirando energía, coste, vida, daño, DPS, alcance, velocidad, cadencia, tiempo de llegada, cantidad de enemigos y duración. La dificultad sale de decisiones, no de controles incómodos ni de cifras infladas. Unos 15 minutos es una referencia de diseño, no un límite. Sin monetización, anuncios ni retención manipulativa.

## Validación

Que compile no cierra la tarea. Cuando corresponda: `npm test`, pruebas nuevas para reglas nuevas, regresión, consola, resoluciones, paletas, sprites, táctil, pausa al ocultar la pestaña, rendimiento y la mecánica misma jugada. Decir qué no se pudo probar. No declarar verde una prueba que no se ejecutó. No esconder pendientes.

## Git

Mirar el estado antes de editar. No pisar cambios ajenos. Sin comandos destructivos, force-push, merge ni cambio de visibilidad sin autorización. Sin secretos, temporales ni `node_modules`. Commits enfocados, con mensaje que diga por qué. No mezclar un refactor no pedido con una función nueva. No tocar licencias ni atribuciones de terceros. Publicar el repositorio no elige una licencia open source: eso lo decide el propietario.

## Al cerrar una tarea

Informar qué se hizo, qué archivos cambiaron, qué se decidió, qué pruebas corrieron y con qué resultado, qué quedó pendiente y qué decisión necesita al propietario. No avanzar solo a la etapa siguiente.
