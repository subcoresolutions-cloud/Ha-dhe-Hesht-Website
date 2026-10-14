# WhatsApp ordering, exact-output test. The expected message is built here in Python from data/menu.js and the typed form values
# (never read back from the page), then compared character for character with what the page puts into the wa.me link.
import os,re,json,urllib.parse
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')+'/'
from playwright.sync_api import sync_playwright
BASE='http://localhost:%s/index.html'%os.environ.get('PORT','8766'); res=[]
def check(n,ok,i=''):
    res.append(bool(ok)); print(('PASS ' if ok else 'FAIL ')+n,(str(i)[:400] if not ok else ''))
menu=open(ROOT+'data/menu.js',encoding='utf-8').read(); data=open(ROOT+'js/data.js',encoding='utf-8').read()
M=json.loads(menu.split('window.HDH_MENU = ',1)[1].rstrip().rstrip(';'))
P={p['id']:p for p in M['products']}
SIZE_L={"id":"l","label":{"sq":"E madhe","en":"Large"},"price":900}; EXTRA_X={"id":"x","label":{"sq":"Djathë shtesë","en":"Extra cheese"},"price":100}
for p in M['products']:
    if p['id']=='p-margherita': p['sizes']=[{"id":"m","label":{"sq":"Mesatare","en":"Medium"},"price":600},SIZE_L]; p['extras']=[EXTRA_X]
MENU='window.HDH_MENU = '+json.dumps(M,ensure_ascii=False)+';'
def money(n): return f'{n:,}'.replace(',','.')+' ALL'
def nm(i): return P[i]['name']['sq'].split(' / ')[0]
def one(s): return re.sub(r'\s*[\r\n]+\s*',' ',s).strip()
NAME='Ëndrit Çela'; PHONE='+355 69 111 2233'; ADDR='Rr. “Ismail Qemali”, Nr. 5,\nVlorë'; LOC='Pranë Diambe Market, kati 2, zilja “Çela” & https://maps.google.com/?q=40.44,19.49&z=17'
ONOTE='Pa ullinj & më shumë djathë, 50% kripë #1 + zgjedhje? 🍕 “Shëndet”! '+'Shënim i gjatë. '*14
INOTE='Pa qepë, e prerë në 8 pjesë; ç ë Ç Ë'
ONOTE=ONOTE[:300]; 
def expected(kind):
    lines=[]; sub=0
    L=['NEW ORDER — HA DHE HESHT',f'Customer: {NAME}',f'Phone: {PHONE}','Order type: '+('Delivery' if kind=='delivery' else 'Pickup')]
    if kind=='delivery': L+=['Address: '+one(ADDR),'Location details: '+one(LOC)]
    L.append('ORDER ITEMS')
    items=[('p-margherita',1,900+100,'E madhe, + Djathë shtesë — '+INOTE),('p-pizza-napoli',2,700,None),('d-coca-cola',3,180,None),('b-heineken',1,300,None)]
    for i,q,u,opt in items:
        L+= [f'{nm(i)} × {q}',f'Unit price: {money(u)}',f'Item total: {money(u*q)}']; sub+=u*q
        if opt: L.append('Options/notes: '+opt)
    L.append(f'Subtotal: {money(sub)}')
    if kind=='delivery': L.append('Delivery fee: to be confirmed by the pizzeria')
    L.append(f'TOTAL: {money(sub)}'+(' (excluding delivery fee)' if kind=='delivery' else ''))
    L.append('Additional notes: '+one(ONOTE)); L.append('Customer confirms they are 18 or older.')
    L.append('Please confirm availability and the estimated preparation or delivery time.')
    return '\n'.join(L),sub
def ctxmk(b,datajs=None,menu_body=MENU):
    ctx=b.new_context(viewport={'width':390,'height':844}); ctx.route('**/data/menu.js*',lambda r:r.fulfill(body=menu_body,content_type='application/javascript'))
    if datajs: ctx.route('**/js/data.js*',lambda r:r.fulfill(body=datajs,content_type='application/javascript'))
    pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); return ctx,pg,errs
def build(pg):
    pg.goto(BASE); pg.wait_for_selector('#menuList .item')
    pg.click('.item[data-id=p-margherita] [data-act=opts]'); pg.check('input[value=l]'); pg.check('input[value=x]'); pg.click('#optAdd')
    pg.click('.item[data-id=p-pizza-napoli] [data-act=add]'); pg.click('.item[data-id=p-pizza-napoli] [data-act=inc]')
    pg.click('.item[data-id=d-coca-cola] [data-act=add]'); pg.click('.item[data-id=d-coca-cola] [data-act=inc]'); pg.click('.item[data-id=d-coca-cola] [data-act=inc]')
    pg.click('.item[data-id=b-heineken] [data-act=add]')
    pg.click('#mobileCartBtn'); pg.click('#drawerBody [data-a=note][data-k^="p-margherita"]'); pg.fill('#drawerBody textarea[data-k^="p-margherita"]',INOTE)
def details(pg,kind):
    pg.check(f'input[value={kind}]'); pg.fill('#fName',NAME); pg.fill('#fPhone',PHONE)
    if kind=='delivery': pg.fill('#fAddr',ADDR); pg.fill('#fLoc',LOC)
    pg.fill('#fNote',ONOTE)
    if pg.locator('#fAge').count(): pg.check('#fAge')
with sync_playwright() as pw:
    b=pw.chromium.launch()
    for kind in ('delivery','pickup'):
        ctx,pg,errs=ctxmk(b); build(pg); pg.click('#toStep2'); details(pg,kind); pg.click('#toStep3'); pg.wait_for_selector('#waSend')
        href=pg.get_attribute('#waSend','href'); text=href.split('?text=',1)[1]; msg=urllib.parse.unquote(text); exp,sub=expected(kind)
        print(f'\n===== {kind.upper()} message ({len(msg)} chars, URL {len(href)} chars) =====\n{msg}\n')
        check(f'[{kind}] message equals the independently built expected text, character for character', msg==exp, '\n'+msg+'\n--- expected ---\n'+exp)
        check(f'[{kind}] destination is exactly wa.me/355693812566', href.startswith('https://wa.me/355693812566?text='))
        check(f'[{kind}] text is fully percent-encoded (only A-Z a-z 0-9 - _ . ! ~ * \' ( ) and %XX)', re.fullmatch(r"[A-Za-z0-9\-_.!~*'()%]+",text) is not None)
        check(f'[{kind}] encoding round-trips (decode(encode(msg)) == msg, UTF-8)', urllib.parse.quote(msg,safe="-_.!~*'()")==text)
        check(f'[{kind}] newlines are %0A, Albanian Ë/Ç/ë/ç are UTF-8 (%C3%8B, %C3%87)', text.count('%0A')==msg.count('\n') and '%C3%8B' in text and '%C3%87' in text)
        check(f'[{kind}] link well under the 7000-char safety limit', len(href)<7000, len(href))
        check(f'[{kind}] review screen total == message total', money(sub) in pg.inner_text('#drawerFoot').replace('\xa0',' '))
        check(f'[{kind}] review warns the order is NOT sent and the customer must press Send', 'nuk është dërguar' in pg.inner_text('#drawerBody').lower() and 'Dërgo” në WhatsApp' in pg.inner_text('#drawerBody'))
        check(f'[{kind}] no page errors', not errs, errs)
        if kind=='delivery':
            # click -> opens WhatsApp once, cart kept, no false confirmation
            opened=[]; ctx.route('https://wa.me/**',lambda r:(opened.append(r.request.url),r.fulfill(status=200,body='<title>wa</title>',content_type='text/html')))
            with ctx.expect_page() as np_: pg.click('#waSend')
            np_.value.wait_for_load_state(); pg.wait_for_timeout(300)
            check('click opens a new tab on the same URL', len(opened)==1 and opened[0]==href, opened)
            body=pg.inner_text('#drawerBody').lower()
            check('after click: says WhatsApp opened and only a Send in WhatsApp places the order', 'u hap whatsapp' in body and 'vetëm kur' in body)
            check('after click: NO "confirmed"/"received"/"u konfirmua" claim anywhere', not re.search(r'konfirmua|u pranua|order confirmed|order placed|thank you',pg.inner_text('#cartDialog').lower()), pg.inner_text('#cartDialog')[:300])
            check('after click: cart and customer data are kept', pg.inner_text('#cartCount')=='7' and json.loads(pg.evaluate("localStorage.getItem('hdh_customer_v1')"))['name']==NAME)
            check('fallbacks offered: open again, copy message, phone number', pg.locator('#waAgain').count()==1 and pg.locator('#copyMsg').count()==1 and '069 381 2566' in pg.inner_text('#waFallback'))
            # copy fallback gives the identical message
            pg.evaluate("window.__clip='';Object.defineProperty(navigator,'clipboard',{value:{writeText:t=>{window.__clip=t;return Promise.resolve()}},configurable:true})")
            pg.click('#copyMsg'); pg.wait_for_timeout(200); check('copy button copies the identical message', pg.evaluate('window.__clip')==exp, pg.evaluate('window.__clip')[:80])
        ctx.close()
    # ---- missing info is caught before WhatsApp
    ctx,pg,errs=ctxmk(b); build(pg); pg.click('#toStep2'); pg.check('input[value=delivery]'); pg.click('#toStep3')
    check('missing name/phone/address/age: no WhatsApp link is produced', pg.locator('#waSend').count()==0 and pg.locator('#e-name').count()==1 and pg.locator('#e-phone').count()==1 and pg.locator('#e-address').count()==1 and pg.locator('#e-age').count()==1)
    ctx.close()
    # ---- number normalisation (configurable, never silently changed)
    for raw,ok in [('+355 69 381 2566',True),('069 381 2566',True),('00355693812566',True),('355693812566',True)]:
        d=data.replace('whatsappNumber: "355693812566"',f'whatsappNumber: "{raw}"')
        ctx,pg,errs=ctxmk(b,datajs=d); build(pg); pg.click('#toStep2'); details(pg,'pickup'); pg.click('#toStep3'); pg.wait_for_selector('#waSend')
        check(f'number "{raw}" -> wa.me/355693812566', pg.get_attribute('#waSend','href').startswith('https://wa.me/355693812566?text=')); ctx.close()
    d=data.replace('whatsappNumber: "355693812566"','whatsappNumber: "abc"')
    ctx,pg,errs=ctxmk(b,datajs=d); build(pg); pg.click('#toStep2'); details(pg,'pickup'); pg.click('#toStep3'); pg.wait_for_selector('#waSend')
    check('invalid configured number: no fake link, clear warning, copy still offered', pg.get_attribute('#waSend','aria-disabled')=='true' and 'wa.me' not in (pg.get_attribute('#waSend','href') or '') and pg.locator('#drawerBody .alert').count()>=1 and pg.locator('#copyMsg').count()==1); ctx.close()
    # ---- popup blocked -> same-tab navigation fallback
    ctx,pg,errs=ctxmk(b); nav=[]; ctx.route('https://wa.me/**',lambda r:(nav.append(r.request.url),r.fulfill(status=200,body='<title>wa</title>',content_type='text/html')))
    ctx.add_init_script("window.open=function(){return null}")
    build(pg); pg.click('#toStep2'); details(pg,'pickup'); pg.click('#toStep3'); pg.wait_for_selector('#waSend'); href=pg.get_attribute('#waSend','href'); pg.click('#waSend'); pg.wait_for_timeout(1200)
    check('popup blocked: falls back to opening WhatsApp in the same tab with the same link', nav and nav[0]==href and pg.url.startswith('https://wa.me/'), (nav,pg.url))
    pg.go_back(); pg.wait_for_selector('#menuList .item'); check('returning from WhatsApp: cart still there', pg.inner_text('#cartCount')=='7'); ctx.close()
    # ---- very long order: never truncated silently; if too long the send button is disabled and copy is highlighted
    mm=json.loads(json.dumps(M)); ctx,pg,errs=ctxmk(b); pg.goto(BASE); pg.wait_for_selector('#menuList .item')
    pg.evaluate("localStorage.setItem('hdh_cart_v1',JSON.stringify(%s))"%json.dumps([{'id':i,'qty':99,'note':'ç'*200,'sel':{}} for i in P if i[0] in 'psdb'][:40]))
    pg.reload(); pg.wait_for_selector('#menuList .item'); pg.click('#mobileCartBtn'); pg.click('#toStep2'); details(pg,'pickup'); pg.click('#toStep3'); pg.wait_for_selector('#waSend')
    h=pg.get_attribute('#waSend','href'); dis=pg.get_attribute('#waSend','aria-disabled')
    print('HUGE: url',len(h),'aria-disabled',dis)
    check('huge order (40 lines with 200-char notes): link either complete or disabled with a warning, never cut', (dis=='true' and pg.locator('#drawerBody .alert').count()>=1) or (len(h)<7000 and urllib.parse.unquote(h.split('text=',1)[1]).count('Item total:')==40), (len(h),dis)); ctx.close()
    b.close()
print(f'\n{sum(res)}/{len(res)} checks passed'); print('FAILED:',[i for i,r in enumerate(res) if not r]); raise SystemExit(0 if all(res) else 1)
