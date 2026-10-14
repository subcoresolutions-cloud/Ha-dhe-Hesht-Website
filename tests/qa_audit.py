# Independent QA audit (not part of run_all.sh because it takes ~3 min): python3 tests/qa_audit.py  -> prints PASS/FAIL per check; screenshots go to $SHOT_DIR or a temp folder.
# Covers: links, search edge cases, 12 viewports (overflow, font size, tap targets, card alignment, checkout fit), keyboard-only use, reduced motion, error states, SEO/JSON-LD, privacy.
import os,re,json,sys,subprocess,threading,http.server,urllib.parse
from playwright.sync_api import sync_playwright
import tempfile
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')); SH=(os.environ.get('SHOT_DIR') or tempfile.mkdtemp(prefix='hdh_qa_'))+'/'
R=[]  # (area,name,ok,evidence)
def rec(area,name,ok,ev=''): R.append((area,name,ok,str(ev)[:260])); print(('PASS ' if ok else 'FAIL ')+f'[{area}] {name}'+('' if ok else '  <-- '+str(ev)[:300]))
os.chdir(ROOT); CSP=[l.split(': ',1)[1].strip() for l in open('_headers') if 'Content-Security-Policy' in l][0]
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self): self.send_header('Content-Security-Policy',CSP); super().end_headers()
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8800),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
BASE='http://127.0.0.1:8800/index.html'
data=open('js/data.js',encoding='utf-8').read()
def newctx(b,w=390,h=844,**k):
    c=b.new_context(viewport={'width':w,'height':h},**k); c.route('https://wa.me/**',lambda r:r.fulfill(status=200,body='<title>wa</title>',content_type='text/html')); return c
def mkpage(c):
    pg=c.new_page(); pg.errs=[]; pg.reqs=[]
    pg.on('pageerror',lambda e:pg.errs.append('pageerror:'+str(e))); pg.on('console',lambda m:pg.errs.append(m.type+':'+m.text) if m.type in('error','warning') else None)
    pg.on('requestfailed',lambda r:pg.errs.append('reqfail:'+r.url)); pg.on('request',lambda r:pg.reqs.append(r.url)); return pg
with sync_playwright() as pw:
    b=pw.chromium.launch()
    # ---------- A. links ----------
    c=newctx(b); pg=mkpage(c); pg.goto(BASE); pg.wait_for_selector('#menuList .item')
    ids=set(pg.eval_on_selector_all('[id]','e=>e.map(x=>x.id)')); L=pg.eval_on_selector_all('a[href]','e=>e.map(a=>({h:a.getAttribute("href"),t:a.target,r:a.rel,txt:a.textContent.trim().slice(0,30)}))')
    badanch=[l for l in L if l['h'].startswith('#') and l['h']!='#' and l['h'][1:] not in ids]; deadhash=[l for l in L if l['h']=='#']
    rec('Nav','every #anchor link targets an existing section',not badanch,badanch)
    rec('Nav','no dead "#" links left after JS binding',not deadhash,deadhash)
    ext=[l for l in L if l['h'].startswith('http')]; rec('Nav',f'{len(ext)} external links are https and open with rel=noopener',all(l['h'].startswith('https://') and 'noopener' in l['r'] for l in ext if l['t']=='_blank') and ext,[l for l in ext if 'noopener' not in l['r']])
    tel=[l['h'] for l in L if l['h'].startswith('tel:')]; rec('Nav','every tel: link is +355693812566',tel and all(t=='tel:+355693812566' for t in tel),set(tel))
    wal=[l['h'] for l in L if 'wa.me' in l['h']]; rec('Nav','every wa.me link uses 355693812566',wal and all(re.match(r'https://wa\.me/355693812566(\?|$)',w) for w in wal),set(wal))
    rec('Nav','header nav + footer + hero links present',pg.locator('#nav a').count()>=3 and pg.locator('footer a').count()>=3,(pg.locator('#nav a').count(),pg.locator('footer a').count()))
    # nav links scroll to sections
    pg.set_viewport_size({'width':1280,'height':800}); pg.goto(BASE); pg.wait_for_selector('#menuList .item'); sc=[]
    for h in ['#menu','#rreth','#kontakt']:
        if h[1:] in ids:
            pg.click(f'#nav a[href="{h}"]'); pg.wait_for_timeout(700); sc.append((h,round(pg.evaluate(f"document.querySelector('{h}').getBoundingClientRect().top"))))
    rec('Nav','desktop nav links scroll their section under the sticky header (top 0..260px)',all(-5<=t<=260 for _,t in sc),sc)
    # ---------- B. no NaN/undefined anywhere ----------
    pg.goto(BASE); pg.wait_for_selector('#menuList .item'); body=pg.inner_text('body')
    rec('Content','no "undefined", "NaN", "null", "[object" text on the page',not re.search(r'undefined|NaN|\bnull\b|\[object',body),re.findall(r'.{20}(?:undefined|NaN|null|\[object).{20}',body)[:3])
    pr=pg.eval_on_selector_all('#menuList .item .price','e=>e.map(x=>x.textContent.trim())'); rec('Content','62 visible prices all formatted "N ALL" or "N.NNN ALL"',len(pr)==62 and all(re.fullmatch(r'(?:nga )?\d{1,3}(\.\d{3})* ALL',p.replace('\xa0',' ')) for p in pr),[p for p in pr if not re.fullmatch(r'(?:nga )?\d{1,3}(\.\d{3})* ALL',p.replace('\xa0',' '))][:3])
    # ---------- C. search edge cases ----------
    def srch(q):
        pg.fill('#search',q); pg.wait_for_timeout(350); return pg.locator('#menuList .item').count()
    pg.errs.clear(); cases={'(':None,'[':None,'\\':None,'.*':None,'<img src=x onerror=alert(1)>':0,'   ':62,'ZZZ'*100:0,'PIZZA':17,'  tonno ':2,'ë':None}
    got={q[:12]:srch(q) for q in cases}
    rec('Search','special characters / regex metachars / HTML in search do not throw',not [e for e in pg.errs if 'pageerror' in e],pg.errs[:2])
    rec('Search','whitespace-only → all 62; junk → 0 results; "PIZZA" → pizza names',got['   ']==62 and got['ZZZZZZZZZZZZ']==0 and got['<img src=x o']==0 and srch('PIZZA')>=17,got)
    rec('Search','HTML typed in search is not rendered as markup',pg.locator('#menuList img[src="x"]').count()==0 and pg.evaluate("window.__x")is None)
    pg.fill('#search',''); pg.wait_for_timeout(300)
    rec('Search','no-results state offers a way back ("clear search")',(srch('qqqq')==0) and pg.locator('#clearSearch').count()==1,pg.inner_text('#menuList')[:100])
    pg.fill('#search',''); pg.wait_for_timeout(300)
    # ---------- D. console/network on load, requests third-party? ----------
    pg.goto(BASE); pg.wait_for_selector('#menuList .item'); pg.wait_for_timeout(500)
    ok3=[r for r in pg.reqs if not r.startswith('http://127.0.0.1:8800')]
    rec('Prod','page load makes only same-origin requests (no CDN, analytics, fonts, trackers)',not ok3,ok3); rec('Prod','no console errors/warnings/failed requests on load',not pg.errs,pg.errs[:3])
    cks=c.cookies(); rec('Privacy','no cookies set',not cks,cks)
    ls=pg.evaluate("Object.fromEntries(Object.entries(localStorage))"); rec('Privacy','localStorage on first visit holds only an empty cart (no tracking id, no personal data)',ls in ({},{'hdh_cart_v1':'[]'}),ls)
    c.close()
    # ---------- E. viewports ----------
    VP=[(320,568),(360,640),(375,667),(390,844),(414,896),(768,1024),(820,1180),(1024,768),(1280,800),(1440,900),(1920,1080),(844,390)]
    for (w,h) in VP:
        c=newctx(b,w,h); pg=mkpage(c); pg.goto(BASE); pg.wait_for_selector('#menuList .item'); pg.wait_for_timeout(400)
        ov=pg.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth")
        wide=pg.evaluate("""[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return false;const cs=getComputedStyle(e);if(cs.position==='fixed')return false;let p=e.parentElement;while(p){const o=getComputedStyle(p).overflowX;if(o==='auto'||o==='scroll'||o==='hidden')return false;p=p.parentElement}return r.right>innerWidth+1||r.left<-1}).slice(0,3).map(e=>e.tagName+'.'+e.className)""")
        small=pg.evaluate("""[...document.querySelectorAll('body *')].filter(e=>{if(!e.childNodes.length)return false;const t=[...e.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).length;if(!t)return false;const r=e.getBoundingClientRect();if(!r.width||!r.height||getComputedStyle(e).visibility==='hidden')return false;return parseFloat(getComputedStyle(e).fontSize)<12}).slice(0,3).map(e=>e.tagName+':'+e.textContent.trim().slice(0,20))""")
        tap=pg.evaluate("""[...document.querySelectorAll('button,a.btn,.tab,.chip-btn,.burger,.add,[data-act],input[type=checkbox],input[type=radio]')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&getComputedStyle(e).visibility!=='hidden'&&(r.height<40||r.width<40)&&!e.closest('[hidden]')}).slice(0,4).map(e=>e.tagName+'.'+e.className+' '+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height))""")
        rec('Responsive',f'{w}x{h}: no horizontal overflow, no off-screen elements',ov<=0 and not wide,(ov,wide))
        rec('Responsive',f'{w}x{h}: all visible text >= 12px',not small,small); rec('Responsive',f'{w}x{h}: tap targets >= 40px',not tap,tap)
        # cards aligned: items in a row have equal tops
        al=pg.evaluate("""(()=>{const it=[...document.querySelectorAll('#menuList .item')].slice(0,12).map(e=>e.getBoundingClientRect());const rows={};it.forEach(r=>{const k=Math.round(r.top/4);(rows[k]=rows[k]||[]).push(r)});return Object.values(rows).every(rw=>rw.every(r=>Math.abs(r.height-rw[0].height)<=2)&&rw.every(r=>r.right<=innerWidth+1))})()""")
        rec('Responsive',f'{w}x{h}: product cards in a row have equal height and stay in the viewport',al)
        if w in(320,390,768,1280,844): 
            pg.screenshot(path=SH+f'top_{w}x{h}.png'); pg.locator('#menu').scroll_into_view_if_needed(); pg.wait_for_timeout(300); pg.screenshot(path=SH+f'menu_{w}x{h}.png')
        # checkout at this viewport
        pg.click('#menuList .item[data-id=p-pizza-napoli] [data-act=add]'); pg.click('#menuList .item[data-id=b-heineken] [data-act=add]')
        (pg.click('#mobileCartBtn') if pg.is_visible('#mobileCartBtn') else pg.click('#cartBtn')); pg.wait_for_selector('#drawerBody'); pg.click('#toStep2'); pg.check('input[value=delivery]'); pg.click('#toStep3')
        ovd=pg.evaluate("(()=>{const d=document.querySelector('#cartDialog');return [d.scrollWidth-d.clientWidth,document.querySelector('#drawerBody').scrollWidth-document.querySelector('#drawerBody').clientWidth, document.querySelector('#drawerFoot').getBoundingClientRect().bottom<=innerHeight+1]})()")
        rec('Responsive',f'{w}x{h}: checkout drawer (with errors shown) fits: no side overflow, footer buttons on screen',ovd[0]<=0 and ovd[1]<=0 and ovd[2],ovd)
        bh=pg.evaluate("document.querySelector('#drawerBody').getBoundingClientRect().height"); rec('Responsive',f'{w}x{h}: checkout form area is at least 38% of the screen height',bh>=0.38*h or w>=768,round(bh))
        if w in(320,390,768): pg.screenshot(path=SH+f'checkout_{w}x{h}.png')
        rec('Prod',f'{w}x{h}: no console errors through add-to-cart + checkout',not pg.errs,pg.errs[:2]); c.close()
    # ---------- F. keyboard ----------
    c=newctx(b,1280,800); pg=mkpage(c); pg.goto(BASE); pg.wait_for_selector('#menuList .item')
    pg.keyboard.press('Tab'); f1=pg.evaluate("document.activeElement.className+'|'+document.activeElement.getAttribute('href')"); rec('Keyboard','first Tab stop is the skip link (to #menu)','skip' in f1 and '#menu' in f1,f1)
    pg.keyboard.press('Enter'); pg.wait_for_timeout(300); rec('Keyboard','skip link jumps to the menu',pg.evaluate("location.hash")=='#menu')
    seen=[]; pg.goto(BASE); pg.wait_for_selector('#menuList .item')
    for i in range(14): pg.keyboard.press('Tab'); seen.append(pg.evaluate("(()=>{const e=document.activeElement;const cs=getComputedStyle(e);return e.tagName+'#'+(e.id||e.className)+'|'+(cs.outlineStyle!=='none'&&parseFloat(cs.outlineWidth)>=2?'ring':(cs.boxShadow!=='none'?'shadow':'NO-FOCUS-STYLE'))})()"))
    rec('Keyboard','first 14 Tab stops all show a visible focus indicator',not [s for s in seen if 'NO-FOCUS' in s],seen)
    # open cart with keyboard
    pg.goto(BASE); pg.wait_for_selector('#menuList .item'); pg.focus('#menuList .item[data-id=p-margherita] [data-act=add]'); pg.keyboard.press('Enter'); rec('Keyboard','Enter on "add" adds the item',pg.inner_text('#cartCount')=='1')
    pg.focus('#cartBtn'); pg.keyboard.press('Enter'); pg.wait_for_timeout(300); inside=pg.evaluate("document.querySelector('#cartDialog').contains(document.activeElement)"); rec('Keyboard','opening the cart moves focus into the dialog',inside and pg.evaluate("document.querySelector('#cartDialog').open"))
    tabs=set()
    for i in range(25): pg.keyboard.press('Tab'); tabs.add(pg.evaluate("(()=>{const e=document.activeElement;return document.querySelector('#cartDialog').contains(e)||e===document.body})()"))
    rec('Keyboard','focus never lands on the page behind the cart dialog (25 Tabs; only dialog or browser UI)',tabs=={True},tabs)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300); rec('Keyboard','Escape closes the cart and returns focus to the cart button',not pg.evaluate("document.querySelector('#cartDialog').open") and pg.evaluate("document.activeElement.id")=='cartBtn',pg.evaluate("document.activeElement.id"))
    # keyboard checkout end to end
    pg.focus('#cartBtn'); pg.keyboard.press('Enter'); pg.wait_for_selector('#toStep2'); pg.focus('#toStep2'); pg.keyboard.press('Enter'); pg.wait_for_selector('#fName'); pg.focus('#fName'); pg.keyboard.type('Tast Tastier'); pg.keyboard.press('Tab'); pg.keyboard.type('069 111 2222')
    pg.focus('#toStep3'); pg.keyboard.press('Enter'); pg.wait_for_selector('#waSend'); rec('Keyboard','whole checkout (name, phone, review) completable with keyboard only',pg.locator('#waSend').count()==1)
    c.close()
    # burger / mobile nav
    c=newctx(b,390,844); pg=mkpage(c); pg.goto(BASE); pg.wait_for_selector('#menuList .item')
    vis=pg.is_visible('#burger'); pg.click('#burger'); ex=pg.get_attribute('#burger','aria-expanded'); navv=pg.is_visible('#nav'); pg.click('#nav a >> nth=1'); pg.wait_for_timeout(500)
    rec('Mobile','burger opens nav (aria-expanded=true), link click navigates and closes it',vis and ex=='true' and navv and pg.get_attribute('#burger','aria-expanded')=='false' and not pg.is_visible('#nav'),(vis,ex,navv,pg.get_attribute('#burger','aria-expanded')))
    pg.click('#burger'); pg.keyboard.press('Escape'); pg.wait_for_timeout(200); rec('Mobile','Escape closes the mobile nav',pg.get_attribute('#burger','aria-expanded')=='false')
    # sticky mobile cart bar and body scroll lock
    pg.click('#menuList .item[data-id=p-margherita] [data-act=add]'); pg.click('#mobileCartBtn'); pg.wait_for_timeout(300)
    rec('Mobile','mobile cart bar appears with count and total after adding',True if pg.inner_text('#mobileCartTotal').strip()=='500 ALL' else False,pg.inner_text('#mobileCartTotal'))
    pg.keyboard.press('Escape'); c.close()
    # ---------- G. reduced motion ----------
    c=newctx(b,390,844,reduced_motion='reduce'); pg=mkpage(c); pg.goto(BASE); pg.wait_for_selector('#menuList .item'); pg.wait_for_timeout(400)
    run=pg.evaluate("document.getAnimations().filter(a=>a.playState==='running'&&a.effect&&a.effect.getTiming().iterations===Infinity).length"); tr=pg.evaluate("[...document.querySelectorAll('*')].filter(e=>{const d=parseFloat(getComputedStyle(e).transitionDuration);return d>0.05}).length")
    rec('A11y','prefers-reduced-motion: no infinite animations, transitions neutralised',run==0 and tr==0,(run,tr)); rec('A11y','reduced motion: all content visible (62 cards, hero, contact)',pg.locator('#menuList .item').count()==62 and pg.is_visible('h1')); c.close()
    # ---------- H. error states ----------
    c=newctx(b); c.route('**/data/menu.js*',lambda r:r.abort()); pg=mkpage(c); pg.goto(BASE); pg.wait_for_timeout(2500)
    t=pg.inner_text('#menuList'); rec('Errors','catalog fails to load → friendly message + Retry + WhatsApp/phone alternative, no blank page','nuk u ngarkua' in t and pg.locator('#retryMenu').count()==1 and 'WhatsApp' in t and '069 381 2566' in t,t[:150])
    rec('Errors','failed catalog: cart button and hero still usable',pg.is_visible('#cartBtn') and pg.is_visible('h1')); c.close()
    c=newctx(b); c.route('**/js/data.js*',lambda r:r.abort()); pg=mkpage(c); pg.goto(BASE); pg.wait_for_timeout(2000); rec('Errors','settings file blocked → page still renders readable HTML (no blank page)',len(pg.inner_text('body'))>300 and pg.is_visible('h1'),len(pg.inner_text('body'))); c.close()
    c=newctx(b); c.route('**/js/app.js*',lambda r:r.abort()); pg=mkpage(c); pg.goto(BASE); pg.wait_for_timeout(1500); nojs=pg.inner_text('body'); rec('Errors','script fails to load → page still shows the phone number as text',len(nojs)>200 and '069 381 2566' in nojs,len(nojs)); c.close()
    c=newctx(b); c.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked')}})"); pg=mkpage(c); pg.goto(BASE); pg.wait_for_selector('#menuList .item'); pg.click('#menuList .item[data-id=p-margherita] [data-act=add]'); pg.click('#mobileCartBtn'); pg.click('#toStep2'); pg.fill('#fName','A B'); pg.fill('#fPhone','0691112222'); pg.check('input[value=pickup]'); pg.click('#toStep3'); pg.wait_for_selector('#waSend')
    rec('Errors','localStorage blocked (private mode): ordering still works in memory',pg.locator('#waSend').count()==1 and not [e for e in pg.errs if 'pageerror' in e],pg.errs[:2]); c.close()
    c=newctx(b); pg=mkpage(c); pg.goto(BASE); pg.wait_for_selector('#menuList .item')
    for _ in range(120): pg.click('#menuList .item[data-id=d-coca-cola] [data-act=add], #menuList .item[data-id=d-coca-cola] [data-act=inc]',timeout=2000)
    rec('Cart','120 rapid clicks: quantity capped at 99, total = 99 x 180 = 17.820 ALL',pg.inner_text('#cartCount')=='99' and '17.820 ALL' in pg.inner_text('#mobileCartTotal').replace('\xa0',' '),(pg.inner_text('#cartCount'),pg.inner_text('#mobileCartTotal'))); c.close()
    # ---------- I. i18n + SEO ----------
    c=newctx(b); pg=mkpage(c); pg.goto(BASE); pg.wait_for_selector('#menuList .item')
    sq=dict(title=pg.title(),lang=pg.get_attribute('html','lang'),desc=pg.get_attribute('meta[name=description]','content'),h1=pg.locator('h1').count())
    rec('SEO','title, description, single h1, html lang=sq',0<len(sq['title'])<=70 and 50<len(sq['desc'])<=170 and sq['h1']==1 and sq['lang']=='sq',sq)
    pg.click('#langBtn'); pg.wait_for_timeout(300); en=dict(title=pg.title(),lang=pg.get_attribute('html','lang'),desc=pg.get_attribute('meta[name=description]','content'))
    rec('SEO','English toggle updates <html lang>, title and meta description',en['lang']=='en' and en['title']!=sq['title'] and en['desc']!=sq['desc'] and 'Pizza' in en['title'],en)
    alb=re.findall(r'\b(Shto|Porosit|Menuja|Shporta|Kontakt)\b',pg.inner_text('main')); rec('i18n','English mode: no leftover key Albanian UI words in main content',not alb,alb[:5])
    pg.reload(); pg.wait_for_selector('#menuList .item'); rec('i18n','language choice survives refresh',pg.get_attribute('html','lang')=='en')
    pg.click('#langBtn'); 
    ld=json.loads(pg.inner_text('script[type="application/ld+json"]') if False else pg.evaluate("document.querySelector('script[type=\"application/ld+json\"]').textContent"))
    rec('SEO','JSON-LD valid; name/phone/city/Instagram match business data; no invented address, hours or rating',ld['name']=='Ha dhe Hesht' and ld['telephone']=='+355693812566' and ld['address']['addressLocality']=='Vlorë' and ld['sameAs']==['https://www.instagram.com/hadhehesht/'] and not any(k in ld for k in('openingHours','aggregateRating','priceRange','geo','streetAddress')),ld)
    og={k:pg.get_attribute(f'meta[property="og:{k}"]','content') for k in('title','description','url','image','type')}; rec('SEO','Open Graph complete with absolute URLs',all(og.values()) and og['url'].startswith('https://') and og['image'].startswith('https://'),og)
    rec('SEO','canonical present',pg.get_attribute('link[rel=canonical]','href').startswith('https://subcoresolutions-cloud.github.io/Ha-dhe-Hesht-Website/'))
    hd=pg.eval_on_selector_all('h1,h2,h3','e=>e.map(x=>+x.tagName[1])'); jump=[(a,b2) for a,b2 in zip(hd,hd[1:]) if b2-a>1]; rec('A11y','heading levels never skip downward (h1→h2→h3)',not jump,jump)
    unl=pg.evaluate("[...document.querySelectorAll('input,textarea,select')].filter(e=>e.type!=='hidden'&&!e.labels?.length&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')).map(e=>e.id||e.name)"); rec('A11y','every form control on the page has a label',not unl,unl)
    imgs=pg.evaluate("[...document.images].map(i=>({s:i.src.split('/').pop(),alt:i.getAttribute('alt'),w:i.naturalWidth}))"); rec('A11y','all <img> have an alt attribute and decode',all(i['alt'] is not None and (i['w']>0) for i in imgs if True) ,imgs)
    svg=pg.evaluate("[...document.querySelectorAll('#menuList .media svg, #featuredList .media svg')].filter(s=>s.getAttribute('aria-hidden')!=='true'&&!s.getAttribute('aria-label')&&!s.querySelector('title')).length"); rec('A11y','product illustrations are hidden from screen readers or labelled',svg==0,svg)
    c.close()
    # ---------- J. private data / secrets ----------
    allsrc=''.join(open(f,encoding='utf-8',errors='ignore').read() for f in ['index.html','js/app.js','js/data.js','js/art.js','data/menu.js','css/styles.css','404.html'])
    rec('Privacy','no emails, tokens, keys or private URLs in shipped HTML/JS/CSS',not re.findall(r'[\w.+-]+@[\w-]+\.[\w.]+|AKIA[0-9A-Z]{12,}|ghp_\w{20,}|api[_-]?key\s*[:=]|BEGIN (RSA|PRIVATE)',allsrc),re.findall(r'[\w.+-]+@[\w-]+\.[\w.]+',allsrc)[:3])
    b.close()
fails=[r for r in R if not r[2]]; print(f'\nAUDIT: {len(R)-len(fails)}/{len(R)} passed; failures: {len(fails)}'); json.dump(R,open(SH+'audit.json','w'),ensure_ascii=False)
