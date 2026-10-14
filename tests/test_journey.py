# End-to-end customer journey + link/button audit. Prices are recomputed independently from data/menu.js.
import os,re,json,urllib.parse
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')+'/'
from playwright.sync_api import sync_playwright
BASE='http://localhost:%s/index.html'%os.environ.get('PORT','8766'); res=[]
import tempfile; SHOTS=os.environ.get('SHOT_DIR') or tempfile.mkdtemp(prefix='hdh_shots_')
def check(n,ok,i=''):
    res.append(ok); print(('PASS ' if ok else 'FAIL ')+n,(str(i)[:300] if not ok else ''))
M=json.loads(open(ROOT+'data/menu.js',encoding='utf-8').read().split('window.HDH_MENU = ',1)[1].rstrip().rstrip(';'))
P={p['id']:p for p in M['products']}
def money(n): return f'{n:,}'.replace(',','.')+' ALL'
with sync_playwright() as pw:
    b=pw.chromium.launch()
    for (w,h,label) in [(390,844,'mobile'),(1280,900,'desktop')]:
        ctx=b.new_context(viewport={'width':w,'height':h}); errs=[]; opened=[]
        ctx.route('https://wa.me/**',lambda r:(opened.append(r.request.url),r.fulfill(status=200,body='<title>wa</title>',content_type='text/html')))
        pg=ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
        pg.goto(BASE); pg.wait_for_selector('#menuList .item')
        # --- all menu cards come from the catalog ---
        shown=pg.eval_on_selector_all('#menuList .item','e=>e.map(x=>x.dataset.id)'); check(f'{label}: every menu card is a catalog product, none missing', set(shown)==set(P) and len(shown)==62, (len(shown)))
        # --- homepage -> featured product (same catalog) ---
        feat=pg.eval_on_selector_all('#featuredList .item','e=>e.map(x=>x.dataset.id)'); check(f'{label}: featured items exist in catalog', feat and all(f in P for f in feat), feat)
        fid=feat[0]; pg.click(f'#featuredList .item[data-id="{fid}"] [data-act=add]')
        check(f'{label}: adding from homepage updates cart badge', pg.inner_text('#cartCount')=='1')
        # --- category tile -> menu filter ---
        pg.click('#catTiles .tile >> nth=1'); pg.wait_for_timeout(300); n=pg.locator('#menuList .item').count(); check(f'{label}: category tile filters menu', n==18, n)
        pg.click('#tabs .tab >> nth=0')
        # --- pick: pizza (again, qty 2), sandwich, soft drink, beer ---
        pz=[i for i in P if i.startswith('p-') and P[i]['price']][1]; sw=[i for i in P if i.startswith('s-') and P[i]['price']][2]; dr=[i for i in P if P[i]['category']=='soft_drink' and P[i]['price']][3]; bj=[i for i in P if P[i]['category']=='beer' and P[i]['price']][1]
        for i in (pz,sw,dr,bj):
            pg.locator(f'.item[data-id="{i}"]').scroll_into_view_if_needed(); pg.click(f'.item[data-id="{i}"] [data-act=add]')
        pg.click(f'.item[data-id="{pz}"] [data-act=inc]')
        pg.click(f'#featuredList .item[data-id="{fid}"] [data-act=inc]') if pg.locator(f'#featuredList .item[data-id="{fid}"] [data-act=inc]').count() else None
        want={fid:2,pz:2,sw:1,dr:1,bj:1} if fid not in (pz,sw,dr,bj) else None
        # cart state across reload (navigation)
        pg.reload(); pg.wait_for_selector('#menuList .item'); cnt=int(pg.inner_text('#cartCount')); check(f'{label}: cart survives page reload', cnt>=6, cnt)
        # --- cart ---
        pg.click('#cartBtn' if w>900 else '#mobileCartBtn'); pg.wait_for_selector('#drawerBody')
        lines=pg.eval_on_selector_all('#drawerBody [data-a=inc]','e=>e.map(x=>x.dataset.k)'); check(f'{label}: cart has 5 distinct lines', len(lines)==5, lines)
        cart=json.loads(pg.evaluate("localStorage.getItem('hdh_cart_v1')")); exp_sub=sum(P[l['id']]['price']*l['qty'] for l in cart)
        check(f'{label}: all cart ids are catalog ids', all(l['id'] in P for l in cart))
        pg.click('[data-a=note] >> nth=0'); pg.fill('textarea[data-f^=ta-]','pa djathë & shtesë “ullinj” 100%')
        pg.click('#toStep2')
        pg.fill('#fName','Besnik Çela'); pg.fill('#fPhone','+355 69 555 1234'); pg.check('input[value=delivery]'); pg.fill('#fAddr','Lagjja Pavarësia, Rr. Sadik Zotaj 12\nVlorë'); pg.fill('#fLoc','Pranë Diambe Market, kati 2, zilja "Çela"'); pg.fill('#fNote','Pa ngut, thirrni para se të vini.'); pg.check('#fAge')
        pg.click('#toStep3'); pg.wait_for_selector('#waSend')
        review=pg.inner_text('#drawerBody'); foot=pg.inner_text('#drawerFoot')
        check(f'{label}: review shows contact details', all(x in review for x in ['Besnik Çela','+355 69 555 1234','Sadik Zotaj','Diambe Market','Pa ngut']))
        check(f'{label}: review warns order is NOT sent yet', 'nuk është dërguar ende' in review.lower())
        href=pg.get_attribute('#waSend','href'); m=urllib.parse.unquote(href.split('?text=',1)[1])
        check(f'{label}: destination is 355693812566', href.startswith('https://wa.me/355693812566?text='))
        # details match
        check(f'{label}: message carries every checkout field', all(x in m for x in ['Customer: Besnik Çela','Phone: +355 69 555 1234','Order type: Delivery','Delivery address: Lagjja Pavarësia, Rr. Sadik Zotaj 12 Vlorë','Location details: Pranë Diambe Market, kati 2, zilja "Çela"','Additional notes: Pa ngut, thirrni para se të vini.','Notes: pa djathë & shtesë “ullinj” 100%']), m)
        # every line in message == cart == catalog price
        got=re.findall(r'\d+\. (.+)\nQuantity: (\d+)\nUnit price: ([\d.]+) ALL\nItem total: ([\d.]+) ALL',m)
        okl=len(got)==len(cart)
        for (nm,q,u,t),l in zip(got,cart):
            pr=P[l['id']]; okl&= nm.startswith(pr['name']['sq']) and int(q)==l['qty'] and int(u.replace('.',''))==pr['price'] and int(t.replace('.',''))==pr['price']*l['qty']
        check(f'{label}: message lines = cart lines = catalog names & prices', okl, got)
        sub=int(re.search(r'Subtotal: ([\d.]+) ALL',m).group(1).replace('.','')); tot=int(re.search(r'TOTAL: ([\d.]+) ALL',m).group(1).replace('.',''))
        check(f'{label}: subtotal == independently computed ({exp_sub})', sub==exp_sub==tot, (sub,tot,exp_sub))
        check(f'{label}: fee not fabricated', 'Delivery fee: to be confirmed by the pizzeria' in m and 'excluding delivery fee' in m)
        check(f'{label}: screen total == message total', money(tot) in foot, foot[:120])
        check(f'{label}: message ends with confirmation request & is under URL limit', m.rstrip().endswith('estimated preparation or delivery time.') and len(href)<7000, len(href))
        # --- click: real navigation target
        with ctx.expect_page() as np_: pg.click('#waSend')
        np_.value.wait_for_load_state(); 
        check(f'{label}: opened URL == prefilled link', opened and opened[-1]==href, opened[-1:] )
        check(f'{label}: after opening WhatsApp the cart + details are kept', int(pg.inner_text('#cartCount'))>=6 and 'Besnik' in pg.evaluate("localStorage.getItem('hdh_customer_v1')"))
        check(f'{label}: UI says to press Send, no sent claim', 'Dërgo' in pg.inner_text('#drawerBody') and 'u dërgua' not in pg.inner_text('#drawerBody').lower())
        check(f'{label}: no JS/console errors across journey', not errs, errs)
        ctx.close()
    # ---------- link & button audit (desktop) ----------
    ctx=b.new_context(viewport={'width':1280,'height':900}); pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    ctx.route('https://**',lambda r:r.abort()) if False else None
    pg.goto(BASE); pg.wait_for_selector('#menuList .item')
    links=pg.eval_on_selector_all('a[href]','e=>e.map(a=>[a.getAttribute("href"),a.textContent.trim().slice(0,30),a.closest("[hidden]")?1:0])')
    bad=[l for l in links if l[0] in ('#','') ]; check('no placeholder href="#" links left', not bad, bad)
    anch=[l[0] for l in links if l[0].startswith('#') and len(l[0])>1]; missing=[a for a in anch if not pg.evaluate(f'!!document.getElementById("{a[1:]}")')]; check('every #anchor link has a target', not missing, missing)
    ext=sorted(set(l[0] for l in links if l[0].startswith('http'))); print('  external links:',ext)
    allowed=lambda u: u.startswith('https://wa.me/355693812566') or u.startswith('https://www.instagram.com/hadhehesht') or u.startswith('https://wolt.com/') or u.startswith('https://www.google.com/maps/')
    check('external links limited to WhatsApp (correct number), Instagram, Wolt, Maps', all(allowed(u) for u in ext), ext)
    check('tel links use the business number', set(l[0] for l in links if l[0].startswith('tel:'))=={'tel:+355693812566'}, [l[0] for l in links if l[0].startswith('tel:')])
    check('every external link opens safely (rel=noopener)', pg.evaluate('[...document.querySelectorAll("a[target=_blank]")].every(a=>/noopener/.test(a.rel))'))
    # nav links scroll to their sections
    for t in ['menu','rreth-nesh','kontakt']:
        pg.click(f'#nav a[href="#{t}"]'); pg.wait_for_timeout(1800); top=pg.evaluate(f'document.getElementById("{t}").getBoundingClientRect().top'); check(f'nav → #{t} lands on section', -5<top<250, top)
    pg.click('#langBtn'); check('language toggle EN', pg.inner_text('#langBtn')=='SQ' and 'Menu' in pg.inner_text('#nav')); pg.click('#langBtn')
    pg.click('#privOpen'); check('privacy dialog opens/closes', pg.is_visible('#privDialog')); pg.click('#privClose'); check('privacy dialog closed', not pg.is_visible('#privDialog'))
    check('no hidden/placeholder text like undefined/NaN/[object', not re.search(r'undefined|NaN|\[object|null',pg.inner_text('body')), re.findall(r'.{20}(?:undefined|NaN|null).{10}',pg.inner_text('body'))[:2])
    check('no JS errors in audit', not errs, errs)
    pg.screenshot(path=os.path.join(SHOTS,'final_full.png'),full_page=True)
    b.close()
print(f'\n{sum(res)}/{len(res)} checks passed')
