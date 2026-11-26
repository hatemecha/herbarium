# Herbarium

Un jardín chico que crece en la oscuridad. Una planta en el centro genera energía y luz. Con esa energía se planta una cerbatana. Un escarabajo intenta llegar al centro. Si la planta central muere, el jardín cae.

El proyecto es independiente. Más adelante va a vivir dentro de la web personal del autor. Ahora es una partida continua: tablero, dos plantas, tres insectos y oleadas procedurales. No hay tarot, sonido ni progresión entre partidas.

![Planta central, contador de energía y tarjeta de la cerbatana](docs/capturas/jardin.png)

## Estado

Etapas 1 a 6 están en código. La etapa 6 añade el director de oleadas, el pulgón, la oruga y el espino. Los números son experimentales. Detalle en [docs/ROADMAP.md](docs/ROADMAP.md) y [docs/BALANCE.md](docs/BALANCE.md).

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

Corre las pruebas de colocación, combate, escenarios e insecto. No abren el navegador.

## Documentación

- [AGENTS.md](AGENTS.md) — reglas para quien modifique el proyecto
- [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md)
- [docs/ART_DIRECTION.md](docs/ART_DIRECTION.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/BALANCE.md](docs/BALANCE.md)
- [docs/ROADMAP.md](docs/ROADMAP.md)
- [docs/PROPUESTA_OLEADAS.md](docs/PROPUESTA_OLEADAS.md)

## Créditos

MonoMEK Text, de Michael Alexander (MEK.txt), 2023. Dominio público, [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). Archivos en `assets/fonts/`. El texto legal está en `assets/fonts/MonoMEK-LICENSE.txt`.

La paleta de color sigue la de la web personal (`nicotinalex-web`).

## Licencia del juego

No definida. Publicar este repositorio no lo pone bajo una licencia open source. Los archivos de MonoMEK conservan su CC0.
