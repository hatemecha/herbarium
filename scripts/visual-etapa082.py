"""Capturas reproducibles de Chromium. Requiere Python Playwright y Chromium local.
Servir la versión actual en 4182 y git archive a6bc20d en 4183.
La instrumentación vive solo en la ruta de prueba; no se exporta al juego.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, os, time, tempfile, subprocess, sys
OUT=Path(os.getenv('HERBARIUM_CAPTURAS','docs/capturas/etapa082/final'))
OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('HERBARIUM_URL','http://127.0.0.1:4182')
ANTES=os.getenv('HERBARIUM_ANTES','http://127.0.0.1:4183')
INIT="""let t=0, id=0, q=new Map();
Object.defineProperty(performance,'now',{value:()=>t});
Date.now=()=>100000;
let seed=12345; Math.random=()=>((seed=Math.imul(1664525,seed)+1013904223|0)>>>0)/4294967296;
window.requestAnimationFrame=f=>{q.set(++id,f);return id}; window.cancelAnimationFrame=i=>q.delete(i);
window.pasos=n=>{for(let i=0;i<n;i++){t+=1000/60;const actual=[...q.values()];q.clear();actual.forEach(f=>f(t));}};
"""
def preparar(page,url):
 page.add_init_script(INIT)
 def modificar(route):
  r=route.fetch()
  s=r.text()
  s="import { crearEnemigo } from './entidades/enemigo.js';\n"+s
  s=s.replace('  actualizarEnergia();\n\n  return {','  globalThis.__escena = { jardin, combate, estado, director, render, roles, tablero, crearEnemigo, ENEMIGOS, simular, dibujar };\n  actualizarEnergia();\n\n  return {')
  route.fulfill(response=r,body=s)
 page.route('**/src/juego.js',modificar)
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(url)
 page.evaluate('document.fonts.ready')
 page.evaluate('pasos(2)')
 return errors
def shot(p,name):
 p.screenshot(path=str(OUT/(name+'.png')),scale='css')
def tick(p,n): p.evaluate('n=>pasos(n)',n)
def avanzar_rapido(p,n):
 # El mismo paso fijo y las mismas funciones del juego, sin dibujar fotogramas descartados.
 p.evaluate('n=>{for(let i=0;i<n;i++)__escena.simular(1/60);__escena.dibujar()}',n)
def click_card(p,id):
 loc=p.locator(f'.carta[data-tipo="{id}"]')
 if not loc.count(): loc=p.locator('.carta').nth(['cerbatana','espino','campanilla','hongo'].index(id))
 loc.click()
def celda(p,x,y,touch=False):
 r=p.locator('.tablero').bounding_box()
 px=r['x']+(x+.5)*r['width']/11; py=r['y']+(y+.5)*r['height']/11
 if touch: p.touchscreen.tap(px,py)
 else: p.mouse.click(px,py)
def sembrar(p,plantas):
 p.evaluate('ps=>{for(const [id,x,y] of ps)__escena.jardin.sembrar(id,{x,y});}',plantas)
def caja(p):
 return p.evaluate("""()=>{let b=s=>document.querySelector(s).getBoundingClientRect();let a=b('.tablero'),c=b('.catalogo');return {viewport:[innerWidth,innerHeight],scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],tablero:[a.x,a.y,a.width,a.height],catalogo:[c.x,c.y,c.width,c.height],solapan:a.left<c.right&&a.right>c.left&&a.top<c.bottom&&a.bottom>c.top}}""")
def pagina(b,w,h,touch=False,reduce=False):
 return b.new_page(viewport={'width':w,'height':h},device_scale_factor=1,has_touch=touch,is_mobile=touch,reduced_motion='reduce' if reduce else 'no-preference')
MEDIO=[['cerbatana',5,4],['espino',4,5],['campanilla',6,5],['hongo',5,6]]
AVANZADO=MEDIO+[['cerbatana',4,4],['cerbatana',6,4],['espino',3,5],['espino',7,5],['hongo',4,6],['campanilla',6,6],['cerbatana',5,7]]
def batalla(p):
 p.evaluate("""()=>{let {combate,crearEnemigo,ENEMIGOS}=__escena;for(let i=0;i<24;i++){const a=i*Math.PI*2/24;const r=2.1+(i%3)*.75;combate.enemigos.push(crearEnemigo({x:5.5+Math.cos(a)*r,y:5.5+Math.sin(a)*r,tipo:ENEMIGOS[['pulgon','escarabajo','oruga'][i%3]],desfase:i*.01}));}}""")
def escenario(p,modo):
 tick(p,60);shot(p,modo+'-reposo')
 p.evaluate('__escena.estado.energia=19');tick(p,2);click_card(p,'campanilla');tick(p,2)
 r=p.locator('.tablero').bounding_box()
 touch=p.evaluate("matchMedia('(pointer: coarse)').matches")
 if touch: celda(p,6,5,True)
 else: p.mouse.move(r['x']+r['width']*6.5/11,r['y']+r['height']*5.5/11)
 tick(p,5);shot(p,modo+'-seleccion')
 celda(p,6,5,touch)
 tick(p,3);shot(p,modo+'-compra')
 sembrar(p,[['cerbatana',5,4],['espino',4,5],['hongo',5,6]])
 tick(p,15);shot(p,modo+'-preparacion')
 # fase de combate real, con jardín de prueba idéntico
 avanzar_rapido(p,1200);shot(p,modo+'-combate')
if __name__ == '__main__':
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium-browser',args=['--no-sandbox'])
  informe=json.loads((OUT/"validacion.json").read_text()) if "--solo-carga" in sys.argv else {}
  if "--solo-carga" not in sys.argv:
   for modo in ['pliego','horizonte','gabinete']:
    for dispositivo,w,h,touch in [('desktop',1280,800,False),('movil',390,844,True)]:
     p=pagina(b,w,h,touch)
     err=preparar(p,BASE+'/lab082.html?modo='+modo)
     escenario(p,modo+'-'+dispositivo)
     informe[modo+'-'+dispositivo]={'caja':caja(p),'errores':err}
     p.close()
     print(modo,dispositivo,informe[modo+'-'+dispositivo],flush=True)
   # Antes y después: mismas entidades, semilla, tiempo y resolución.
   for dispositivo,w,h,touch in [('desktop',1280,800,False),('movil',390,844,True),('horizontal',844,390,True)]:
    for nombre,url in [('antes',ANTES),('despues',BASE)]:
     p=pagina(b,w,h,touch)
     err=preparar(p,url)
     pref=nombre+'-'+dispositivo
     tick(p,60);shot(p,pref+'-vacio')
     sembrar(p,MEDIO);tick(p,2);shot(p,pref+'-medio')
     sembrar(p,AVANZADO[len(MEDIO):]);avanzar_rapido(p,1200);batalla(p);tick(p,10);shot(p,pref+'-avanzado')
     tick(p,20);shot(p,pref+'-efectos')
     metricas=p.evaluate("""()=>{const {combate,jardin}=__escena;return {vivos:combate.enemigos.filter(e=>!e.muerto).length,control:combate.enemigos.filter(e=>e.ralentizado).length,plantas:jardin.plantas.length,vida:jardin.central.vida}}""")
     p.evaluate('__escena.jardin.central.vida=8');tick(p,2);shot(p,pref+'-critico')
     p.evaluate("""()=>{let {jardin,combate,crearEnemigo,ENEMIGOS}=__escena;jardin.central.vida=1;let e=crearEnemigo({x:5.5,y:5.5,tipo:ENEMIGOS.escarabajo});e.objetivo=jardin.central;e.cooldown=0;combate.enemigos.unshift(e);}""")
     tick(p,100);p.wait_for_timeout(1300);shot(p,pref+'-derrota')
     informe[pref]={'errores':err,'caja':caja(p),'escena':metricas}
     p.close()
     print(pref,informe[pref],flush=True)
   # Confirmación táctil y estabilidad de las cajas con cambios de estado.
   for dispositivo,w,h,touch,reduce in [('movil',390,844,True,False),('pequeno',320,568,True,False),('horizontal',844,390,True,False),('reducido',1280,800,False,True)]:
    p=pagina(b,w,h,touch,reduce);err=preparar(p,BASE)
    click_card(p,'hongo');tick(p,2);shot(p,dispositivo+'-sin-energia')
    p.evaluate('__escena.estado.energia=20');tick(p,2);click_card(p,'hongo');tick(p,2)
    antes=p.evaluate('__escena.jardin.plantas.length')
    cajaAntes=caja(p)
    celda(p,6,5,touch);tick(p,2);primero=p.evaluate('__escena.jardin.plantas.length')
    shot(p,dispositivo+'-preview')
    if touch: celda(p,6,5,True);tick(p,2)
    despues=p.evaluate('__escena.jardin.plantas.length')
    shot(p,dispositivo+'-compra')
    cajaDespues=caja(p)
    informe[dispositivo]={'errores':err,'caja':cajaDespues,'plantas':[antes,primero,despues],'objetivo_estable':cajaAntes['catalogo']==cajaDespues['catalogo'],'tablero_estable':cajaAntes['tablero']==cajaDespues['tablero']}
    assert not err and not cajaDespues['solapan'] and cajaDespues['scroll']==cajaDespues['viewport']
    assert [antes,primero,despues]==([1,1,2] if touch else [1,2,2])
    p.close()
   # Cierre de oleada con el director real: avanzar la cola, dejar un superviviente.
   p=pagina(b,1280,800);err=preparar(p,BASE)
   sembrar(p,AVANZADO)
   avanzar_rapido(p,1202)
   # Mantener a los enemigos en el perímetro mientras se agota la cola, sin alterar el director.
   p.evaluate("""()=>{const {combate,director,simular,dibujar}=__escena;for(let i=0;i<3600&&director.vista().porSalir>0;i++){for(const e of combate.enemigos)if(!e.muerto){e.x=.5;e.y=.5;e.objetivo=null;}simular(1/60);}dibujar()}""")
   p.evaluate("""()=>{const {combate,crearEnemigo,ENEMIGOS}=__escena;combate.enemigos.splice(0,combate.enemigos.length,crearEnemigo({x:.5,y:.5,tipo:ENEMIGOS.pulgon}));}""")
   tick(p,1);shot(p,'ultimo-enemigo')
   p.evaluate('__escena.combate.enemigos[0].muerto=true;__escena.combate.enemigos[0].umbrales=Array(256).fill(.5)')
   tick(p,2);shot(p,'cierre-oleada')
   informe['cierre']={'errores':err,'fase':p.evaluate('__escena.director.vista()'),'evento':p.locator('.escenario-evento').inner_text()}
   p.close()
  # Paleta alternativa y rendimiento con 48 enemigos iniciales, con/sin reducción.
  for reducido in (False,True):
   p=pagina(b,1280,800,False,reducido)
   p.route(BASE+'/',lambda ruta: ruta.fulfill(response=(r:=ruta.fetch()),body=r.text().replace('</head>','<style>:root{--brand:#a89aff;--spark:#f9ca70}</style></head>')))
   err=preparar(p,BASE);sembrar(p,AVANZADO);avanzar_rapido(p,1202);batalla(p);batalla(p)
   tick(p,30)
   etiqueta='reducida' if reducido else 'alternativa'
   shot(p,'paleta-'+etiqueta)
   inicio=time.perf_counter();tick(p,120);dur=time.perf_counter()-inicio
   informe['carga-'+etiqueta]={'errores':err,'marca':p.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--brand').trim()"),'chispa':p.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--spark').trim()"),'segundos_120_frames':round(dur,3),'fps_procesamiento':round(120/dur,1),'nota':'Chromium headless, 48 enemigos iniciales; reloj controlado, no FPS de teléfono'}
   assert not err and informe['carga-'+etiqueta]['marca']=='#a89aff'
   p.close()
  informe.pop('carga',None)
  # Escena focalizada: las cuatro especies se activan mediante combate real.
  p=pagina(b,1280,800);err=preparar(p,BASE);sembrar(p,MEDIO);avanzar_rapido(p,1202)
  p.evaluate("""()=>{const {combate,crearEnemigo,ENEMIGOS}=__escena;
  const datos=[['escarabajo',4.0,5.5],['oruga',5.5,7.0],['escarabajo',7.9,5.5],['pulgon',5.6,6.9],['pulgon',6.8,6.8],['escarabajo',5.5,2.8]];
  for(const [id,x,y] of datos)combate.enemigos.push(crearEnemigo({x,y,tipo:ENEMIGOS[id]}));}""")
  with tempfile.TemporaryDirectory() as carpeta:
   for i in range(48):
    tick(p,5);p.screenshot(path=f'{carpeta}/{i:03d}.png',scale='css')
   subprocess.run(['ffmpeg','-loglevel','error','-y','-framerate','12','-i',carpeta+'/%03d.png','-vf','fps=12,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer','-loop','0',str(OUT/'combate-focal.gif')],check=True)
  informe['movimiento']={'errores':err,'fotogramas':48,'fps_captura':12,'duracion_simulada':4}
  p.close()
  # Partida sin instrumentar: comprobar reloj real y ausencia de errores.
  p=pagina(b,390,844,True);err=[];p.on('pageerror',lambda e:err.append(str(e)));p.goto(BASE);p.wait_for_timeout(1700)
  informe['reloj-real']={'errores':err,'energia':p.locator('.energia-valor').inner_text()}
  assert not err and int(informe['reloj-real']['energia'])>=1
  p.close()
  b.close()
  (OUT/'validacion.json').write_text(json.dumps(informe,ensure_ascii=False,indent=2))
  print(json.dumps({k:v for k,v in informe.items() if k.startswith('carga') or k in ('movimiento','reloj-real')},ensure_ascii=False,indent=2),flush=True)
