# Herbarium

Un jardín chico que crece en la oscuridad. Una planta en el centro genera energía y luz. Con esa energía se planta una cerbatana. Un escarabajo intenta llegar al centro. Si la planta central muere, el jardín cae.

El proyecto es independiente. Más adelante va a vivir dentro de la web personal del autor. Ahora es un prototipo jugable: tablero, catálogo de una planta, un insecto y combate básico. No hay oleadas, progresión ni sonido.

![Planta central, contador de energía y tarjeta de la cerbatana](docs/capturas/jardin.png)

## Estado

Etapas 1 a 3 implementadas. La etapa 4 (primer enemigo y combate) está en código y cubierta por pruebas de lógica; el duelo completo no se revalidó en el navegador durante la preparación del repositorio. El detalle está en [docs/ROADMAP.md](docs/ROADMAP.md).

Los números de daño, vida y tiempos son provisionales.

## Tecnología

HTML, CSS y módulos ES. Canvas 2D. Sin dependencias y sin bundler. Node 24 solo para el servidor estático de desarrollo y para `node --test`.

## Requisitos

- Node.js 24
- Un navegador con módulos ES y Canvas 2D

## Uso

```
npm start
```

Abre <http://localhost:4173/>. Otro puerto: `PORT=4180 npm start` (en PowerShell, `$env:PORT=4180; npm start`).

```
npm test
```

Corre las pruebas de colocación y de combate. No abren el navegador.

## Documentación

- [AGENTS.md](AGENTS.md) — reglas para quien modifique el proyecto
- [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md)
- [docs/ART_DIRECTION.md](docs/ART_DIRECTION.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/BALANCE.md](docs/BALANCE.md)
- [docs/ROADMAP.md](docs/ROADMAP.md)

## Créditos

MonoMEK Text, de Michael Alexander (MEK.txt), 2023. Dominio público, [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Archivos en `assets/fonts/`. El texto legal está en `assets/fonts/MonoMEK-LICENSE.txt`.

La paleta de color sigue la de la web personal (`nicotinalex-web`).

## Licencia del juego

No definida. Publicar este repositorio no lo pone bajo una licencia open source. Los archivos de MonoMEK conservan su CC0.
