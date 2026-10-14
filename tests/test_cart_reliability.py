# Cart & checkout reliability: the 8 requested cases + hardening (corrupt storage, two tabs, odd characters, sizes/extras, double submit).
# Expected amounts are computed independently from data/menu.js (never read back from the page).
import os,re,json,urllib.parse
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')+'/'
from playwright.sync_api import sync_playwright
BASE='http://localhost:%s/index.html'%os.environ.get('PORT','8766'); res=[]
def check(n,ok,i=''):
    res.append(bool(ok)); print(('PASS ' if ok else 'FAIL ')+n,(str(i)[:300] if not ok else ''))
menu=open(ROOT+'data/menu.js',encoding='utf-8').read(); data=open(ROOT+'js/data.js',encoding='utf-8').read()
M=json.loads(menu.split('window.HDH_MENU = ',1)[1].rstrip().rstrip(';')); P={p['id']:p for p in M['products']}
def money(n): return f'{n:,}'.replace(',','.')+' ALL'
def T(pg,sel): return pg.inner_text(sel).replace('\xa0',' ')
def mk(b,w=390,menu_body=None,init=None):
    ctx=b.new_context(viewport={'width':w,'height':844}); errs=[]
    if menu_body: ctx.route('**/data/menu.js*',lambda r:r.fulfill(body=menu_body,content_type='application/javascript'))
    if init: ctx.add_init_script(init)
    pg=ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    return ctx,pg,errs
def ready(pg): pg.goto(BASE); pg.wait_for_selector('#menuList .item')
def add(pg,i,extra=0):
    pg.click(f'#menuList .item[data-id="{i}"] [data-act=add]')
    for _ in range(extra): pg.click(f'#menuList .item[data-id="{i}"] [data-act=inc]')
def openCart(pg): pg.click('#mobileCartBtn' if pg.is_visible('#mobileCartBtn') else '#cartBtn'); pg.wait_for_selector('#drawerBody')
def fill(pg,name='Arben Hoxha',phone='069 381 2566',type_='pickup',addr='Rr. Test 1',age=True,note=''):
    pg.check(f'input[value={type_}]'); pg.fill('#fName',name); pg.fill('#fPhone',phone)
    if type_=='delivery': pg.fill('#fAddr',addr)
    if note: pg.fill('#fNote',note)
    if age and pg.locator('#fAge').count(): pg.check('#fAge')
def wa(pg): return urllib.parse.unquote(pg.get_attribute('#waSend','href').split('text=',1)[1])
with sync_playwright() as pw:
    b=pw.chromium.launch()
    # ---- 4. empty cart
    ctx,pg,errs=mk(b); ready(pg); openCart(pg)
    check('4 empty cart: friendly message, no totals, no checkout button', 'bosh' in T(pg,'#drawerBody') and pg.locator('#toStep2').count()==0 and pg.is_hidden('#mobileCart'))
    # ---- 1. one pizza
    pg.click('#goMenu'); add(pg,'p-margherita'); openCart(pg)
    check('1 one pizza: line shows unit, qty, line total', all(x in T(pg,'#drawerBody') for x in ['500 ALL','× 1']) and money(500) in T(pg,'#drawerFoot'))
    # ---- 2. several pizzas + drinks
    pg.click('#continueShop')
    for i,q in {'p-pizza-italy':2,'p-calzone':1,'d-coca-cola':2,'d-red-bull':1}.items(): add(pg,i,q-1)
    want={'p-margherita':1,'p-pizza-italy':2,'p-calzone':1,'d-coca-cola':2,'d-red-bull':1}; exp=sum(P[i]['price']*q for i,q in want.items())
    check('2 badge counts units (7)', pg.inner_text('#cartCount')=='7')
    check('2 mobile cart bar total == catalog', money(exp) in T(pg,'#mobileCartTotal'), T(pg,'#mobileCartTotal'))
    openCart(pg); d=T(pg,'#drawerBody')
    check('2 every line total correct', all(money(P[i]['price']*q) in d for i,q in want.items()))
    check('2 subtotal correct (cart footer)', money(exp) in T(pg,'#drawerFoot'), (exp,T(pg,'#drawerFoot')))
    # ---- 3. change quantities / remove
    pg.click('#drawerBody [data-a=inc][data-k^="p-margherita"]'); pg.click('#drawerBody [data-a=dec][data-k^="d-coca-cola"]'); pg.click('#drawerBody [data-a=rm][data-k^="d-red-bull"]')
    want={'p-margherita':2,'p-pizza-italy':2,'p-calzone':1,'d-coca-cola':1}; exp=sum(P[i]['price']*q for i,q in want.items())
    check('3 qty change / remove: subtotal recomputed', money(exp) in T(pg,'#drawerFoot') and 'Red Bull' not in T(pg,'#drawerBody'), T(pg,'#drawerFoot'))
    pg.click('#drawerBody [data-a=dec][data-k^="d-coca-cola"]'); check('3 decrementing to 0 removes the line', 'Coca-Cola' not in T(pg,'#drawerBody'))
    want.pop('d-coca-cola'); exp=sum(P[i]['price']*q for i,q in want.items())
    # ---- 8. refresh keeps cart, step resets to cart, no phantom items
    pg.reload(); pg.wait_for_selector('#menuList .item'); check('8 refresh: cart kept (5 units)', pg.inner_text('#cartCount')=='5')
    openCart(pg); check('8 refresh: drawer reopens on the cart step with same subtotal', money(exp) in T(pg,'#drawerFoot'))
    # ---- 5. missing customer details
    pg.click('#toStep2'); pg.check('input[value=delivery]'); pg.click('#toStep3')
    errs_txt=T(pg,'#drawerBody')
    check('5 missing name/phone/address: three inline errors, stays on step 2', pg.locator('#e-name').count()==1 and pg.locator('#e-phone').count()==1 and pg.locator('#e-address').count()==1 and pg.locator('#waSend').count()==0)
    check('5 error sits next to its field & field is aria-invalid', pg.get_attribute('#fName','aria-invalid')=='true' and pg.evaluate("document.querySelector('#fName').parentElement.contains(document.querySelector('#e-name'))"))
    pg.fill('#fName','A'); pg.fill('#fPhone','12ab'); pg.click('#toStep3')
    check('5 too-short name and letters in phone rejected, typed values preserved', pg.locator('#e-name').count()==1 and pg.locator('#e-phone').count()==1 and pg.input_value('#fName')=='A' and pg.input_value('#fPhone')=='12ab')
    pg.fill('#fName','Arben Hoxha'); pg.fill('#fPhone','069 381 2566'); pg.click('#toStep3')
    check('5 fixing one field clears only its error', pg.locator('#e-name').count()==0 and pg.locator('#e-address').count()==1)
    pg.check('input[value=pickup]'); check('5 switching to pickup keeps name/phone', pg.input_value('#fName')=='Arben Hoxha' and pg.input_value('#fPhone')=='069 381 2566')
    pg.click('#toStep3'); pg.wait_for_selector('#waSend')
    check('5 pickup needs no address; review is reached', pg.locator('#waSend').count()==1)
    # ---- 7. every displayed total (review + message) ; no unverified fee ; not claimed as confirmed
    rv=T(pg,'#drawerBody')+T(pg,'#drawerFoot'); m=wa(pg).replace('\xa0',' ')
    check('7 review: total == catalog sum, no fee line for pickup', money(exp) in T(pg,'#drawerFoot') and 'Dërgesa' not in T(pg,'#drawerFoot'))
    check('7 review says the order is NOT sent yet', 'nuk është dërguar' in rv.lower())
    check('7 WhatsApp message: lines, subtotal and TOTAL from catalog', all(f"Item total: {money(P[i]['price']*q)}" in m for i,q in want.items()) and f'TOTAL: {money(exp)}' in m and f'Subtotal: {money(exp)}' in m, m[-300:])
    pg.click('#toStep2b'); fill(pg,type_='delivery'); pg.click('#toStep3'); pg.wait_for_selector('#waSend'); m=wa(pg)
    # delivery 400 minimum satisfied here (exp>400). Fee must never be silently added
    check('7 delivery with unverified fee: fee shown as "to be confirmed", total excludes it', 'Delivery fee: to be confirmed' in m and f'TOTAL: {money(exp)} (excluding delivery fee)' in m, m[-260:])
    ctx.close()
    # ---- 6. long notes and special characters (HTML/URL/emoji/quotes/newlines)
    ctx,pg,errs=mk(b); ready(pg); add(pg,'p-margherita'); add(pg,'d-coca-cola'); openCart(pg)
    pg.click('#drawerBody [data-a=note][data-k^="p-margherita"]'); pg.fill('#drawerBody textarea[data-k^="p-margherita"]','Pa qepë <b>&amp;</b> "shumë" të nxehtë 🍕 & më shumë ' + 'x'*400)
    ln=pg.input_value('#drawerBody textarea[data-k^="p-margherita"]'); check('6 per-item note limited to 200 chars (browser never splits an emoji)', 198<=len(ln)<=200, len(ln))
    pg.click('#toStep2'); weird='Çela & Bija <script>alert(1)</script> "Ç" ë 🍕\nrreshti 2 %20 #hash ?x=1&y=2'
    fill(pg,name='Ëndrit Çela <i>x</i>',type_='delivery',addr='Rr. "Sadik Zotaj" 12/B, kati 2\nVlorë',note=weird+'z'*400)
    pg.click('#toStep3'); pg.wait_for_selector('#waSend'); rv=pg.inner_html('#drawerBody')
    check('6 HTML in name/notes is escaped on the review screen (no injected tags)', '<script' not in rv and '<i>' not in rv and '&lt;script&gt;' in rv and pg.evaluate("window.__x===undefined"))
    m=wa(pg); check('6 message keeps special chars, one line per field, notes <=300', 'Çela' in m and '🍕' in m and 'Rr. "Sadik Zotaj" 12/B, kati 2 Vlorë' in m and '%20 #hash ?x=1&y=2' in m and len(re.search(r'Additional notes: (.*)',m).group(1))<=300, m[:600])
    check('6 URL is valid and not too long', len(pg.get_attribute('#waSend','href'))<7000 and pg.get_attribute('#waSend','href').startswith('https://wa.me/355693812566?text='))
    check('6 no console/page errors with odd input', not errs, errs[:2]); ctx.close()
    # lone surrogate (emoji cut in half by a paste/limit) must not break the link
    ctx,pg,errs=mk(b); ready(pg); add(pg,'p-margherita'); openCart(pg); pg.click('#toStep2'); fill(pg)
    pg.evaluate("(()=>{const e=document.querySelector('#fNote');e.value='ok \\uD83C end \\uDF55';e.dispatchEvent(new Event('input',{bubbles:true}))})()")
    pg.click('#toStep3'); pg.wait_for_selector('#waSend'); href=pg.get_attribute('#waSend','href')
    check('6 lone surrogate characters do not break the WhatsApp link', href.startswith('https://wa.me/') and 'ok' in urllib.parse.unquote(href) and not errs, errs[:2]); ctx.close()
    # ---- hardening: corrupted / hostile localStorage
    bad={'string':'"hello"','object':'{"a":1}','mixed':'[null,5,"x",{"id":"p-margherita","qty":"3","note":42,"sel":"zz","price":1},{"id":"nope","qty":1},{"id":"p-calzone","qty":-4},{"id":"p-margherita","qty":2}]'}
    for k,v in bad.items():
        ctx,pg,errs=mk(b,init=f"localStorage.setItem('hdh_cart_v1',{json.dumps(v)});localStorage.setItem('hdh_customer_v1','[1,2]')"); ready(pg)
        n=int(pg.inner_text('#cartCount'))
        if k=='mixed':
            check('storage mixed: valid lines merged (3+2 pizzas), junk dropped, client "price" ignored', n==5 and money(500*5) in T(pg,'#mobileCartTotal'), (n,T(pg,'#mobileCartTotal')))
        else: check(f'storage {k}: menu still renders, cart empty', n==0 and pg.locator('#menuList .item').count()==62)
        check(f'storage {k}: no uncaught errors', not [e for e in errs if 'Failed to load' not in e], errs[:2]); ctx.close()
    # ---- unavailable product saved in cart
    body=menu.replace('"id": "p-calzone"','"id": "p-calzone"')
    mm=json.loads(menu.split('window.HDH_MENU = ',1)[1].rstrip().rstrip(';'))
    for p in mm['products']:
        if p['id']=='p-calzone': p['status']='sold_out'
    sold='window.HDH_MENU = '+json.dumps(mm,ensure_ascii=False)+';'
    ctx,pg,errs=mk(b,menu_body=sold,init="localStorage.setItem('hdh_cart_v1',JSON.stringify([{id:'p-calzone',qty:2,sel:{}},{id:'p-margherita',qty:1,sel:{}}]))"); ready(pg)
    check('unavailable saved item removed with notice; others kept', pg.inner_text('#cartCount')=='1' and pg.locator('#toast.show').count()>=0 and pg.eval_on_selector('#toast','e=>e.textContent').strip()!='' )
    ctx.close()
    # ---- sizes & extras + notes survive refresh, totals right
    mm=json.loads(menu.split('window.HDH_MENU = ',1)[1].rstrip().rstrip(';'))
    for p in mm['products']:
        if p['id']=='p-margherita':
            p['sizes']=[{"id":"m","label":{"sq":"Mesatare","en":"Medium"},"price":600},{"id":"l","label":{"sq":"E madhe","en":"Large"},"price":900}]
            p['extras']=[{"id":"x","label":{"sq":"Djathë shtesë","en":"Extra cheese"},"price":100}]
    sz='window.HDH_MENU = '+json.dumps(mm,ensure_ascii=False)+';'
    ctx,pg,errs=mk(b,menu_body=sz); ready(pg)
    pg.click('.item[data-id=p-margherita] [data-act=opts]'); pg.check('input[value=l]'); pg.check('input[value=x]'); pg.click('#optAdd')
    pg.click('.item[data-id=p-margherita] [data-act=opts]'); pg.check('input[value=l]'); pg.check('input[value=x]'); pg.click('#optAdd')
    pg.click('.item[data-id=p-margherita] [data-act=opts]'); pg.check('input[value=m]'); pg.click('#optAdd')
    pg.reload(); pg.wait_for_selector('#menuList .item'); openCart(pg); d=T(pg,'#drawerBody')
    check('sizes/extras: identical selections merge (2x1000), different size is its own line (600)', pg.locator('#drawerBody .line').count()==2 and '1.000 ALL' in d and '2.000 ALL' in d and '600 ALL' in d, d[:300])
    check('sizes/extras: subtotal 2.600 after refresh', 'Nënshuma' in T(pg,'#drawerFoot') and '2.600 ALL' in T(pg,'#drawerFoot'), T(pg,'#drawerFoot'))
    ctx.close()
    # ---- 400 ALL minimum shortfall hint; pickup unaffected
    ctx,pg,errs=mk(b); ready(pg); add(pg,'d-coca-cola'); openCart(pg); pg.click('#toStep2'); pg.check('input[value=delivery]')
    check('min order: shortfall hint says how much to add (220 ALL)', '220 ALL' in T(pg,'#minShort'), T(pg,'#drawerFoot'))
    fill(pg,type_='delivery'); pg.click('#toStep3'); check('min order: delivery blocked with inline message', pg.locator('#e-min').count()==1 and pg.locator('#waSend').count()==0)
    pg.check('input[value=pickup]'); check('min order: pickup has no hint and no block', pg.locator('#minShort').count()==0 and pg.locator('#e-min').count()==0)
    pg.click('#toStep3'); pg.wait_for_selector('#waSend'); check('min order: pickup of 180 ALL reaches review', True)
    # ---- double submit
    opened=[]; ctx.route('https://wa.me/**',lambda r:(opened.append(1),r.fulfill(status=200,body='<title>wa</title>',content_type='text/html')))
    pg.click('#waSend'); pg.wait_for_timeout(100)
    check('double submit: button locked right after first click', pg.locator('#waAgain[aria-disabled=true]').count()==1 or pg.locator('#waSend[aria-disabled=true]').count()==1)
    for _ in range(3):
        try: pg.click('#waAgain',timeout=300,force=True)
        except Exception: pass
    pg.wait_for_timeout(500); check('double submit: WhatsApp opened exactly once', len(opened)==1, len(opened))
    check('after sending: not claimed as confirmed, cart kept', 'vetëm kur' in T(pg,'#drawerBody').lower() and pg.inner_text('#cartCount')=='1')
    # re-opening the same unchanged order after the lock warns about a duplicate
    pg.wait_for_timeout(3200); pg.click('#backToReview'); check('same order again: duplicate warning shown', pg.locator('#drawerBody .alert').count()>=1 and 'HH-' in T(pg,'#drawerBody'))
    ctx.close()
    # ---- two tabs stay in sync
    ctx=b.new_context(viewport={'width':390,'height':844}); a=ctx.new_page(); c=ctx.new_page(); ready(a); ready(c)
    add(a,'p-margherita'); c.wait_for_timeout(400)
    check('two tabs: cart added in tab A appears in tab B', c.inner_text('#cartCount')=='1', c.inner_text('#cartCount'))
    add(c,'d-coca-cola'); a.wait_for_timeout(400); check('two tabs: tab B change reaches tab A (no stale overwrite)', a.inner_text('#cartCount')=='2')
    ctx.close(); b.close()
print(f'{sum(res)}/{len(res)} checks passed'); print('FAILED:',[i for i,r in enumerate(res) if not r]); raise SystemExit(0 if all(res) else 1)
