import os
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')+'/'
import json,re,urllib.parse
from playwright.sync_api import sync_playwright
BASE='http://localhost:%s/index.html'%os.environ.get('PORT','8766'); ROOT=ROOT+''
res=[]; fails=[]
def check(n,ok,i=''):
    res.append(ok); 
    if not ok: fails.append(n)
    print(('PASS ' if ok else 'FAIL ')+n,(str(i)[:200] if (i and not ok) or i=='!' else ''))
data=open(ROOT+'js/data.js',encoding='utf-8').read(); menu=open(ROOT+'data/menu.js',encoding='utf-8').read()
def vmenu(mut):
    d=json.loads(menu[menu.index('window.HDH_MENU = ')+18:].rstrip().rstrip(';')); mut(d); return 'window.HDH_MENU = '+json.dumps(d,ensure_ascii=False)+';'
def mk(b,w=390,h=844,datajs=None,menujs=None,block_menu=False,block_data=False):
    ctx=b.new_context(viewport={'width':w,'height':h}); logs={'req':[],'con':[],'err':[]}
    if datajs: ctx.route('**/js/data.js*',lambda r:r.fulfill(body=datajs,content_type='application/javascript'))
    if block_data: ctx.route('**/js/data.js*',lambda r:r.fulfill(status=404,body=''))
    if menujs: ctx.route('**/data/menu.js*',lambda r:r.fulfill(body=menujs,content_type='application/javascript'))
    if block_menu: ctx.route('**/data/menu.js*',lambda r:r.fulfill(status=500,body=''))
    pg=ctx.new_page(); pg.on('request',lambda r:logs['req'].append(r.url)); pg.on('console',lambda m:logs['con'].append((m.type,m.text))); pg.on('pageerror',lambda e:logs['err'].append(str(e)))
    return ctx,pg,logs
def overflow(pg): return pg.evaluate('document.documentElement.scrollWidth-innerWidth')
with sync_playwright() as p:
    b=p.chromium.launch()
    # ---------- A. responsive ----------
    for w,h in [(360,740),(390,844),(768,1024),(1024,768),(1280,900),(1920,1080)]:
        ctx,pg,L=mk(b,w,h); pg.goto(BASE); pg.wait_for_selector('#menuList .item')
        ok=overflow(pg)<=0; 
        check(f'{w}px no horizontal overflow (page)',ok,overflow(pg))
        pg.click('.item >> nth=0 >> [data-act=add]'); pg.click('#cartBtn'); pg.wait_for_timeout(200); o1=overflow(pg)
        pg.click('#toStep2'); pg.wait_for_timeout(100); o2=overflow(pg)
        pg.fill('#fName','Test'); pg.fill('#fPhone','069 381 2566'); pg.click('#toStep3'); pg.wait_for_selector('#waSend'); o3=overflow(pg)
        bb=pg.locator('#cartDialog').bounding_box(); inview=bb['x']>=-1 and bb['x']+bb['width']<=w+1
        check(f'{w}px cart/checkout/review no overflow & drawer fits',o1<=0 and o2<=0 and o3<=0 and inview,(o1,o2,o3,bb))
        wab=pg.locator('#waSend').bounding_box(); check(f'{w}px WhatsApp button visible+tall',wab['height']>=44 and 0<=wab['x'] and wab['x']+wab['width']<=w+1,wab)
        pg.keyboard.press('Escape'); pg.wait_for_timeout(100); check(f'{w}px Escape closes drawer',not pg.is_visible('#cartDialog'))
        nav_ok = pg.is_visible('#burger') if w<=900 else pg.is_visible('#nav a >> nth=0')
        check(f'{w}px navigation reachable',nav_ok)
        if w<=900:
            pg.click('#burger'); check(f'{w}px burger opens nav', pg.is_visible('#nav a >> nth=1'))
        pg.click('#privOpen') if False else None
        ctx.close()
    # ---------- B. CSP / network / console / storage ----------
    ctx,pg,L=mk(b); pg.goto(BASE); pg.wait_for_selector('#menuList .item')
    pg.click('.item >> nth=0 >> [data-act=add]'); pg.click('#cartBtn'); pg.click('#toStep2'); pg.fill('#fName','Ana Hoxha'); pg.fill('#fPhone','069 111 2233')
    pg.click('#privLink'); check('privacy dialog opens from checkout', pg.is_visible('#privDialog')); pg.click('#privClose')
    pg.click('#toStep3'); 
    with ctx.expect_page() as np_: pg.click('#waSend')
    pg.wait_for_timeout(300)
    hosts=set(re.sub(r'^https?://([^/]+).*',r'\1',u) for u in L['req'] if u.startswith('http'))
    check('only same-origin requests before WhatsApp opens', hosts<= {'localhost:'+os.environ.get('PORT','8766')}, hosts)
    check('no CSP violations / console errors', not [c for c in L['con'] if c[0] in('error','warning')] and not L['err'], (L['con'],L['err']))
    check('no PII in console', not any(('Ana' in c[1] or '111 2233' in c[1]) for c in L['con']))
    keys=pg.evaluate('Object.keys(localStorage)'); check('only expected localStorage keys', set(keys)<= {'hdh_cart_v1','hdh_customer_v1','hdh_last_order_v1','hdh_lang'}, keys)
    st=pg.evaluate("localStorage.getItem('hdh_customer_v1')+localStorage.getItem('hdh_cart_v1')"); check('no card/payment fields stored', not re.search(r'card|cvv|iban|pan',st,re.I))
    check('opening WhatsApp != sent (no success claim)', 'u dërgua' not in pg.inner_text('#cartDialog').lower() and 'Dërgo” në WhatsApp' in pg.inner_text('#cartDialog') and pg.evaluate("localStorage.getItem('hdh_cart_v1')")!='[]')
    # erase saved details
    pg.keyboard.press('Escape'); pg.click('#privOpen'); pg.click('#privClear'); pg.wait_for_timeout(100)
    check('erase removes customer details', pg.evaluate("localStorage.getItem('hdh_customer_v1')") in (None,) or 'Ana' not in pg.evaluate("localStorage.getItem('hdh_customer_v1')||''"))
    ctx.close()
    # ---------- C. browse / search / cart math ----------
    ctx,pg,L=mk(b,1280,900); pg.goto(BASE); pg.wait_for_selector('#menuList .item')
    total_items=pg.locator('#menuList .item').count(); check('menu shows 62 items', total_items==62, total_items)
    tabs=pg.locator('#tabs .tab').count(); check('tabs: all + 4 categories', tabs==5, tabs)
    counts=[]
    for i in range(1,5):
        pg.click(f'#tabs .tab >> nth={i}'); counts.append(pg.locator('#menuList .item').count())
    check('category counts 17/18/20/7', counts==[17,18,20,7], counts)
    pg.click('#tabs .tab >> nth=0')
    pg.fill('#search','heineken'); pg.wait_for_timeout(300); check('search finds Heineken', pg.locator('#menuList .item').count()>=1 and 'Heineken' in pg.inner_text('#menuList'))
    pg.fill('#search','pica'); pg.wait_for_timeout(300); n1=pg.locator('#menuList .item').count(); check('search "pica" (accent-insensitive) returns pizzas', n1>=10, n1)
    pg.fill('#search','xyzxyz'); pg.wait_for_timeout(300); check('search no-results state', pg.locator('#menuList .item').count()==0 and len(pg.inner_text('#menuList').strip())>5, pg.inner_text('#menuList')[:80])
    pg.fill('#search','')
    pg.wait_for_timeout(200)
    ids=pg.eval_on_selector_all('#menuList .item','els=>els.map(e=>e.dataset.id)')
    def firstid(prefix): return [i for i in ids if i.startswith(prefix)][0]
    pz,sw,dr=firstid('p-'),firstid('s-'),[i for i in ids if i.startswith('d-')][0]
    for i in (pz,sw,dr): pg.click(f'.item[data-id="{i}"] [data-act=add]')
    pg.click(f'.item[data-id="{pz}"] [data-act=inc]'); pg.click(f'.item[data-id="{pz}"] [data-act=inc]')
    badge=pg.inner_text('#cartCount'); check('badge counts 3 pizza + sandwich + drink = 5', badge=='5', badge)
    pg.click('#cartBtn'); body=pg.inner_text('#drawerBody')
    prices={i:int(re.sub(r'\D','',pg.inner_text(f'.item[data-id="{i}"] .price').split('\n')[0]) or 0) for i in (pz,sw,dr)} if pg.locator(f'.item[data-id="{pz}"] .price').count() else None
    print('  prices',prices)
    ctx.close()
    # ---------- D. edge cases ----------
    def m_edge(d):
        P={x['id']:x for x in d['products']}; ids=list(P)
        P[ids[0]]['price']=None; P[ids[1]]['status']='sold_out'
    ctx,pg,L=mk(b,menujs=vmenu(m_edge)); pg.goto(BASE); pg.wait_for_selector('#menuList .item')
    first=pg.locator('#menuList .item').nth(0); second=pg.locator('#menuList .item').nth(1)
    check('missing price: no add-to-cart, shows ask-price link', first.locator('[data-act]').count()==0 and 'wa.me/355693812566' in (first.locator('a.add').get_attribute('href') or ''))
    check('sold out: cannot be added', second.locator('[data-act]').count()==0)
    pg.click('#cartBtn'); check('empty cart message + menu button', pg.is_visible('#goMenu')); pg.click('#goMenu'); ctx.close()
    # catalog failure
    ctx,pg,L=mk(b,block_menu=True); pg.goto(BASE); pg.wait_for_timeout(2500); check('catalog failure shows error with retry', pg.locator('text=Provo përsëri').count()>=1 and not [e for e in L['err']], L['err']); ctx.close()
    # missing business config
    ctx,pg,L=mk(b,block_data=True); pg.goto(BASE); pg.wait_for_timeout(800); check('data.js missing: clear banner, no crash', pg.locator('[role=alert]').count()>=1 and 'Konfigurimi' in pg.inner_text('body'), L['err']); ctx.close()
    nowa=data.replace('whatsappNumber: "355693812566"','whatsappNumber: null').replace('phoneInternational: "+355 69 381 2566"','phoneInternational: null')
    ctx,pg,L=mk(b,datajs=nowa); pg.goto(BASE); pg.wait_for_selector('#menuList .item')
    pg.click('.item >> nth=0 >> [data-act=add]'); pg.click('#cartBtn'); pg.click('#toStep2'); pg.fill('#fName','Test'); pg.fill('#fPhone','069 381 2566'); pg.click('#toStep3'); pg.wait_for_selector('#waSend')
    check('no WhatsApp number: send disabled + explanation, no wa.me link', pg.get_attribute('#waSend','aria-disabled')=='true' and 'nuk është konfiguruar' in pg.inner_text('#cartDialog') and 'wa.me' not in pg.content().split('id="waSend"')[0][-0:]+pg.get_attribute('#waSend','href'), pg.get_attribute('#waSend','href'))
    check('no WhatsApp number: no wa.me anywhere on page', 'wa.me' not in pg.content(), re.findall(r'.{30}wa\.me.{20}',pg.content())[:2]); check('no WA number: no js errors', not L['err'], L['err']); ctx.close()
    noser=data.replace('pickup:   { enabled: true }','pickup:   { enabled: false }').replace('      enabled: true,\n','      enabled: false,\n',1)
    ctx,pg,L=mk(b,datajs=noser); pg.goto(BASE); pg.wait_for_selector('#menuList .item'); pg.click('.item >> nth=0 >> [data-act=add]'); pg.click('#cartBtn'); pg.click('#toStep2')
    check('no services enabled: clear message, no crash', pg.locator('#drawerBody .alert').count()>=1 and not L['err'], L['err']); ctx.close()
    nocur=data.replace('currencyLabel: "ALL",','')
    ctx,pg,L=mk(b,datajs=nocur); pg.goto(BASE); pg.wait_for_selector('#menuList .item'); check('missing currencyLabel falls back to ALL, no "undefined"', 'undefined' not in pg.inner_text('body') and ' ALL' in pg.inner_text('#menuList')); ctx.close()
    # verified delivery fee math + minimum
    fee=data.replace('verified: false','verified: true').replace('fee: null','fee: 200').replace('feeVerified: false','feeVerified: true').replace('minOrder: 400,','minOrder: 1000,')
    ctx,pg,L=mk(b,datajs=fee); pg.goto(BASE); pg.wait_for_selector('#menuList .item')
    pg.fill('#search','heineken'); pg.wait_for_timeout(250); pg.click('#menuList .item >> nth=0 >> [data-act=add]'); pg.click('#cartBtn'); pg.click('#toStep2'); pg.check('input[value=delivery]'); pg.fill('#fName','Test'); pg.fill('#fPhone','069 381 2566'); pg.fill('#fAddr','Rr X 1'); pg.check('#fAge'); pg.click('#toStep3')
    check('below delivery minimum is blocked', pg.locator('#waSend').count()==0 and pg.locator('#e-min').count()==1)
    pg.click('#toStep1'); 
    for _ in range(3): pg.click('[data-a=inc]')
    pg.click('#toStep2'); pg.click('#toStep3'); pg.wait_for_selector('#waSend')
    m=urllib.parse.unquote(pg.get_attribute('#waSend','href').split('?text=')[1]); sub=int(re.search(r'Subtotal: ([\d.]+)',m).group(1).replace('.','')); tot=int(re.search(r'TOTAL: ([\d.]+)',m).group(1).replace('.',''))
    check('delivery: subtotal + 200 fee = total (message)', 'Delivery fee: 200 ALL' in m and tot==sub+200 and sub==1200, (sub,tot)); 
    check('screen total == message total', f'{tot:,}'.replace(',','.')+' ALL' in pg.inner_text('#drawerFoot')); ctx.close()
    # ---------- E. static a11y / SEO ----------
    ctx,pg,L=mk(b,1280,900); pg.goto(BASE); pg.wait_for_selector('#menuList .item'); pg.click('.item >> nth=0 >> [data-act=add]'); pg.click('#cartBtn'); pg.click('#toStep2'); pg.keyboard.press('Escape')
    r=pg.evaluate('''()=>{const o={};const ids={};document.querySelectorAll('[id]').forEach(e=>ids[e.id]=(ids[e.id]||0)+1);o.dupIds=Object.keys(ids).filter(k=>ids[k]>1);
      const name=e=>(e.getAttribute('aria-label')||e.getAttribute('aria-labelledby')&&1||e.textContent.trim()||e.getAttribute('title')||'');
      o.unnamedButtons=[...document.querySelectorAll('button,a[href]')].filter(e=>!name(e)).map(e=>e.outerHTML.slice(0,80));
      o.noAlt=[...document.querySelectorAll('img')].filter(i=>!i.hasAttribute('alt')).length;
      o.unlabeled=[...document.querySelectorAll('input,select,textarea')].filter(e=>e.type!='hidden'&&!(e.labels&&e.labels.length)&&!e.getAttribute('aria-label')).map(e=>e.id||e.name);
      o.h1=document.querySelectorAll('h1').length; o.landmarks=['header','nav','main','footer'].map(t=>document.querySelectorAll(t).length);
      o.lang=document.documentElement.lang; o.title=document.title.length; o.desc=(document.querySelector('meta[name=description]')||{}).content.length;
      o.og=['og:title','og:description','og:image','og:type'].every(p=>document.querySelector('meta[property="'+p+'"]'));
      o.ld=JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent); o.svgNoHide=[...document.querySelectorAll('svg')].filter(s=>!s.closest('[aria-hidden=true]')&&!s.getAttribute('aria-hidden')&&!s.getAttribute('role')&&!s.getAttribute('aria-label')).length;
      o.small=[...document.querySelectorAll('button,a.btn,.add,.tab,input[type=checkbox],input[type=radio]')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.height<32)}).map(e=>e.className+':'+Math.round(e.getBoundingClientRect().height)).slice(0,8);
      return o}''')
    check('no duplicate ids',not r['dupIds'],r['dupIds']); check('all buttons/links have names',not r['unnamedButtons'],r['unnamedButtons'][:3]); check('all images have alt attr',r['noAlt']==0)
    check('all form fields labelled',not r['unlabeled'],r['unlabeled']); check('single h1',r['h1']==1,r['h1']); check('landmarks header/nav/main/footer present',all(x>=1 for x in r['landmarks']),r['landmarks'])
    check('lang + title + description + OG present',r['lang']=='sq' and 20<r['title']<=70 and 70<r['desc']<=170 and r['og'],(r['title'],r['desc']))
    ld=r['ld']; check('JSON-LD has only verified fields', set(ld)<= {'@context','@type','name','servesCuisine','telephone','address','sameAs','image'} and set(ld['address'])<= {'@type','addressLocality','addressCountry'}, ld)
    check('decorative/unlabelled svg hidden from AT',r['svgNoHide']==0,r['svgNoHide']); print('  small targets (<32px):',r['small'])
    ctx.close(); b.close()
print(f'\n{sum(res)} / {len(res)} passed'); print('FAILED:',fails)
