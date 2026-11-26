import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('.', import.meta.url));
const puerto = Number(process.env.PORT) || 4173;

const tipos = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

createServer(async (req, res) => {
  try {
    let ruta = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (ruta.endsWith('/')) ruta += 'index.html';
    const archivo = resolve(raiz, `.${ruta}`);
    if (!archivo.startsWith(raiz)) {
      res.writeHead(403).end();
      return;
    }
    const contenido = await readFile(archivo);
    res.writeHead(200, {
      'Content-Type': tipos[extname(archivo)] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(contenido);
  } catch {
    res.writeHead(404).end('No encontrado');
  }
}).listen(puerto, () => console.log(`herbarium en http://localhost:${puerto}`));
