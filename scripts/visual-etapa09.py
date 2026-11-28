import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path.cwd()
out = root / 'docs/capturas/etapa09'
out.mkdir(exist_ok=True)
base = os.environ.get('HERBARIUM_URL', 'http://localhost:4189')
juego = root.joinpath('src/juego.js').read_text(encoding='utf-8')
juego = juego.replace('const semilla = semillaNueva();', 'const semilla = window.semillaPrueba;')
juego = juego.replace('  function dibujar() {', """  window.escenaTarot = { tablero, director, jardin, estado, combate, simular, dibujar };
  function dibujar() {""")
juego = juego.replace('raf = requestAnimationFrame(bucle);\n  }\n\n  function detener', '/* reloj conducido por la prueba */\n  }\n\n  function detener')

avanzar = """async (politica) => {
  const { ESTRATEGIAS } = await import('/src/estrategias.js');
  const { crearAleatorio } = await import('/src/aleatorio.js');
  const s = escenaTarot;
  window.azarPrueba ??= crearAleatorio(window.semillaPrueba + 2);
  for (let i = 0; i < 6000 && !document.querySelector('.tarot-dialogo[open]') && !s.combate.derrota(); i++) {
    if (i % 30 === 0 && !s.director.enRecompensa()) {
      const accion = ESTRATEGIAS[politica]({ t: s.combate.tiempo(), ...s, enemigos: s.combate.enemigos, aleatorio: window.azarPrueba });
      if (accion) s.jardin.plantar(accion.id, accion);
    }
    s.simular(1/60);
  }
  s.dibujar();
  return { tiempo:s.combate.tiempo(), numero:s.director.vista().numero, caido:s.combate.derrota() };
}"""
def siguiente(pagina, politica):
  for _ in range(8):
    info = pagina.evaluate(avanzar, politica)
    if pagina.locator('.tarot-dialogo[open]').count() or info['caido']: return info
  return info

with sync_playwright() as pw:
  browser = pw.chromium.launch(channel='chrome')
  informe = {}
  for nombre, ancho, alto, dpr, tactil, seed, reducido in [
    ('escritorio', 1280, 800, 1, False, 94085, False),
    ('vertical', 390, 844, 1.25, True, 94058, True),
    ('horizontal', 844, 390, 2, True, 94059, False),
  ]:
    page = browser.new_page(viewport={'width': ancho, 'height': alto}, device_scale_factor=dpr, has_touch=tactil,
                           is_mobile=tactil, reduced_motion='reduce' if reducido else 'no-preference')
    page.add_init_script(f'window.semillaPrueba={seed};')
    page.route('**/src/juego.js', lambda route: route.fulfill(body=juego, content_type='text/javascript'))
    main = root.joinpath('src/main.js').read_text(encoding='utf-8')
    main = main.replace('montarHerbario(document', 'window.montaje = montarHerbario(document')
    if nombre == 'horizontal':
      main = '''document.documentElement.style.setProperty('--brand', '#619de2');
      document.documentElement.style.setProperty('--spark', '#e8bb67');
      ''' + main
    page.route('**/src/main.js', lambda route: route.fulfill(body=main, content_type='text/javascript'))
    errores = []
    page.on('pageerror', lambda error: errores.append(str(error)))
    page.goto(base)
    page.wait_for_function("typeof escenaTarot !== 'undefined'")
    page.evaluate("document.fonts.ready")
    assert page.evaluate("document.fonts.check('12px Terminus')")
    assert page.evaluate('''async () => {
      const { ilustrarArcano } = await import('/src/sprites/tarot.js');
      const { ARCANOS } = await import('/src/efectosTarot.js');
      for (const id of Object.keys(ARCANOS)) {
        const normal = ilustrarArcano(id, false).getContext('2d').getImageData(0, 0, 48, 72).data;
        const invertida = ilustrarArcano(id, true).getContext('2d').getImageData(0, 0, 48, 72).data;
        for (let i = 0; i < normal.length; i++) {
          const espejo = normal.length - (i - i % 4) - 4 + i % 4;
          if (normal[i] !== invertida[espejo]) return false;
        }
      }
      return true;
    }''')
    cartas = []
    for turno in range(7 if not tactil else 2):
      info = siguiente(page, 'compacta' if not tactil else 'reactivo')
      if info['caido'] or not page.locator('.tarot-dialogo[open]').count(): break
      ritual = page.locator('.tarot-dialogo')
      ritual.locator('[data-fase=pregunta]').wait_for()
      antes = page.evaluate("JSON.stringify([escenaTarot.estado,escenaTarot.combate.tiempo()])")
      page.evaluate("for(let i=0;i<180;i++) escenaTarot.simular(1/60)")
      assert antes == page.evaluate("JSON.stringify([escenaTarot.estado,escenaTarot.combate.tiempo()])")
      if turno == 0:
        page.evaluate('''() => {
          Object.defineProperty(document, 'hidden', { value: true, configurable: true });
          document.dispatchEvent(new Event('visibilitychange'));
          document.querySelector('.tarot-opciones button').click();
          delete document.hidden;
          document.dispatchEvent(new Event('visibilitychange'));
        }''')
        assert ritual.locator('[data-fase=pregunta]').is_visible()
        page.screenshot(path=out / f'{nombre}-pregunta.png', animations='disabled')
      opcion = ritual.locator('.tarot-opciones button').nth(turno % 3)
      anterior = opcion.element_handle()
      if tactil: opcion.tap()
      else: opcion.focus(); page.keyboard.press('Enter')
      ritual.locator('[data-fase=carta]').wait_for()
      anterior.evaluate('elemento => elemento.click()')
      assert ritual.locator('[data-fase=carta]').is_visible()
      carta = ritual.locator('h2').inner_text()
      nivel = ritual.get_by_text('Nivel 2', exact=True)
      cartas.append(carta + (' · Nivel 2' if nivel.count() else ''))
      if nivel.count() and not tactil:
        page.screenshot(path=out/'escritorio-repetida.png', animations='disabled')
      if turno == 0 or ('Invertida' in cartas[-1] and not any('Invertida' in c for c in cartas[:-1])):
        sufijo = '-invertida' if 'Invertida' in cartas[-1] else '-carta'
        page.screenshot(path=out / f'{nombre}{sufijo}.png', animations='disabled')
      continuar = ritual.get_by_role('button', name='Volver al jardín')
      if tactil:
        page.wait_for_timeout(250)
        continuar.tap()
      else: continuar.press('Enter')
      assert ritual.is_hidden()
      assert page.evaluate("escenaTarot.director.vista().fase") == 'preparacion'
      if turno == 0:
        page.get_by_role('button',name='Mazo',exact=True).click()
        assert ritual.locator('[data-fase=mazo]').is_visible()
        antes = page.evaluate("escenaTarot.combate.tiempo()")
        page.evaluate("escenaTarot.simular(1)")
        assert antes == page.evaluate("escenaTarot.combate.tiempo()")
        if not tactil: page.screenshot(path=out / 'escritorio-mazo.png', animations='disabled')
        page.keyboard.press('Escape')
        assert ritual.is_hidden()
    assert cartas, (nombre, info, errores)
    if not tactil and info['caido']:
      page.evaluate('''() => {
        for (let i = 0; i < 180; i++) escenaTarot.simular(1/60);
        escenaTarot.dibujar();
      }''')
      page.get_by_text('Resultado de la partida', exact=True).click()
      assert page.get_by_text('invasiones superadas', exact=False).is_visible()
      page.wait_for_function('''() => {
        const caja = sel => document.querySelector(sel).getBoundingClientRect();
        const datos = caja('.derrota details');
        return caja('.derrota-texto canvas').bottom <= datos.top
          && caja('.derrota-boton canvas').top >= datos.bottom;
      }''')
      page.get_by_role('button', name='Mazo', exact=True).click()
      assert page.locator('.tarot-dialogo [data-fase=mazo]').is_visible()
      page.keyboard.press('Escape')
      page.screenshot(path=out/'escritorio-derrota.png', animations='disabled')
    page.locator('.pausa-boton').click()
    page.locator('[data-accion=catalogo]').click()
    page.locator('[data-grupo=tarot]').click()
    assert page.locator('.registro-ficha .tarot-lamina').is_visible()
    if not tactil: page.screenshot(path=out / 'escritorio-catalogo.png', animations='disabled')
    page.keyboard.press('Escape')
    page.locator('[data-accion=confirmar]').click()
    page.locator('[data-accion=reiniciar]').click()
    assert page.locator('.tarot-mazo').is_hidden()
    assert page.evaluate("escenaTarot.director.vista().numero") == 1
    datos = page.evaluate("JSON.parse(localStorage.getItem('herbarium:descubrimientos'))")
    assert set(datos) == {'tarot','plantas','enemigos'}
    assert all(':' in clave for clave in datos['tarot'])
    page.evaluate('montaje.destruir()')
    assert page.locator('.tarot-dialogo, .tarot-mazo').count() == 0
    assert not errores, errores
    informe[nombre] = {'viewport': [ancho, alto], 'dpr': dpr, 'tactilEmulado': tactil, 'movimientoReducido': reducido, 'paletaAlternativa': nombre == 'horizontal', 'cartas': cartas}
    print(nombre, cartas, flush=True)
    page.close()
  atlas = browser.new_page(viewport={'width':1280,'height':420})
  atlas.goto(base)
  atlas.wait_for_function("Number(document.querySelector('.energia').dataset.valor) >= 1")
  atlas.evaluate('''async () => {
    const { ilustrarArcano } = await import('/src/sprites/tarot.js');
    const { ARCANOS } = await import('/src/efectosTarot.js');
    const fila = document.createElement('main');
    fila.style.cssText = 'position:fixed;inset:0;z-index:10;display:flex;align-items:center;justify-content:center;gap:24px;background:#070807;color:#e4dec9';
    for (const [id, arcano] of Object.entries(ARCANOS)) {
      const figura = document.createElement('figure');
      figura.style.cssText = 'width:132px;margin:0;text-align:center';
      const lamina = ilustrarArcano(id, false);
      lamina.style.cssText = 'width:96px;height:144px;image-rendering:pixelated';
      const titulo = document.createElement('figcaption');
      titulo.style.cssText = 'margin-top:12px';
      titulo.textContent = arcano.nombre;
      figura.append(lamina, titulo);
      fila.append(figura);
    }
    document.body.append(fila);
  }''')
  atlas.screenshot(path=out/'ocho-arcanos.png', animations='disabled')
  atlas.close()
  (out/'verificacion.json').write_text(json.dumps(informe, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')



