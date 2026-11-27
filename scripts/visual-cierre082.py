"""Verificación puntual de cierre, sin repetir el laboratorio completo."""
import runpy
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
h=runpy.run_path(str(Path(__file__).with_name('visual-etapa082.py')))
preparar, pagina, tick, sembrar, caja, shot, click_card, celda, avanzar_rapido = (h[k] for k in ('preparar','pagina','tick','sembrar','caja','shot','click_card','celda','avanzar_rapido'))
OUT, BASE = h['OUT'],h['BASE']
informe={}
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium-browser',args=['--no-sandbox'])
 for nombre,w,alto,touch in [('desktop',1280,800,False),('movil',390,844,True),('pequeno',320,568,True),('horizontal',844,390,True)]:
  p=pagina(b,w,alto,touch)
  err=preparar(p,BASE)
  sembrar(p,h['AVANZADO']); avanzar_rapido(p,1200);h['batalla'](p);tick(p,30)
  p.evaluate('__escena.jardin.central.vida=8');tick(p,2);shot(p,'cierre-'+nombre+'-critico')
  p.evaluate("""()=>{let {jardin,combate,crearEnemigo,ENEMIGOS}=__escena;jardin.central.vida=1;let e=crearEnemigo({x:5.5,y:5.5,tipo:ENEMIGOS.escarabajo});e.objetivo=jardin.central;e.cooldown=0;combate.enemigos.unshift(e);}""")
  tick(p,110);p.wait_for_timeout(1300)
  shot(p,'cierre-'+nombre+'-derrota')
  assert p.locator('.derrota').is_visible()
  assert p.locator('.carta:disabled').count()==4
  c=caja(p); assert not c['solapan'] and c['scroll']==c['viewport']
  p.locator('.derrota-boton').click();tick(p,2)
  assert p.locator('.derrota').is_hidden() and p.locator('.carta:enabled').count()==4
  assert p.evaluate('Math.ceil(__escena.jardin.central.vida)')==30
  assert not err
  informe[nombre]={'errores':err,'caja':c,'derrota':True,'cartas_cerradas':4,'reinicio':True}
  p.close()
  print(nombre, informe[nombre],flush=True)
 # Check actual laboratory switches, not just query-string variants.
 p=pagina(b,1280,800);err=[];p.on('pageerror',lambda e:err.append(str(e)));p.goto(BASE+'/lab082.html')
 for modo in ['horizonte','gabinete','pliego']:
  p.locator('button[data-modo="'+modo+'"]').click();p.wait_for_timeout(100)
  assert p.locator('body').get_attribute('data-modo')==modo and not caja(p)['solapan']
 assert not err
 informe['laboratorio']={'errores':err,'alternancia':True}
 p.close()
 # Confirm visual signals via actual event stream (no changes to production).
 p=pagina(b,1280,800);err=preparar(p,BASE);sembrar(p,h['MEDIO']);avanzar_rapido(p,1202)
 p.evaluate("""()=>{const {combate,crearEnemigo,ENEMIGOS,jardin}=__escena;
 window.senales=[];const eventos=combate.eventos.bind(combate);combate.eventos=()=>{const ev=eventos();senales.push(...ev);return ev;};
 const datos=[['escarabajo',4,5.5],['oruga',5.5,7],['escarabajo',7.9,5.5],['pulgon',5.6,6.9],['pulgon',6.8,6.8],['escarabajo',5.5,2.8]];
 for(const [id,x,y] of datos)combate.enemigos.push(crearEnemigo({x,y,tipo:ENEMIGOS[id]}));}""")
 tick(p,240)
 eventos=p.evaluate('senales')
 tipos={e['tipo'] for e in eventos}
 assert {'disparo','impacto','control','esporas','reflejo'}<=tipos
 assert all('ux' in e and 'uy' in e for e in eventos if e['tipo']=='reflejo')
 # Destroy an ordinary plant via a real bite.
 p.evaluate("""()=>{const {jardin,combate,crearEnemigo,ENEMIGOS}=__escena;const planta=jardin.plantas.find(p=>p.id==='espino'&&!p.muerta);if(planta){planta.vida=1;const e=crearEnemigo({x:planta.celda.x+.1,y:planta.celda.y+.5,tipo:ENEMIGOS.escarabajo});e.objetivo=planta;e.cooldown=0;combate.enemigos.unshift(e);}}""")
 tick(p,2);shot(p,'destruccion-planta')
 assert p.evaluate("senales.some(e=>e.tipo==='muerte-planta'&&!e.central)")
 assert not err
 informe['senales']={'errores':err,'tipos':sorted({e['tipo'] for e in p.evaluate('senales')}),'destruccion':True}
 p.close();b.close()
(OUT/'cierre-validacion.json').write_text(json.dumps(informe,ensure_ascii=False,indent=2))
print(json.dumps(informe,ensure_ascii=False),flush=True)
