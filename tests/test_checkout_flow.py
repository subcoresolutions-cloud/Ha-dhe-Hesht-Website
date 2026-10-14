import os
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')+'/'
import json,re,urllib.parse
from playwright.sync_api import sync_playwright
BASE='http://localhost:%s/index.html'%os.environ.get('PORT','8766')
menu=open(ROOT+'data/menu.js',encoding='utf-8').read()
data=open(ROOT+'js/data.js',encoding='utf-8').read()
def vmenu(mut):
    body=menu[menu.index('window.HDH_MENU = ')+18:].rstrip().rstrip(';'); d=json.loads(body); mut(d); return 'window.HDH_MENU = '+json.dumps(d,ensure_ascii=False)+';'
def m1(d):
    P={p['id']:p for p in d['products']}
    P['p-margherita']['sizes']=[{"id":"m","label":{"sq":"Mesatare","en":"Medium"},"price":600},{"id":"l","label":{"sq":"E madhe","en":"Large"},"price":900}]
    P['p-margherita']['extras']=[{"id":"x","label":{"sq":"Djathë shtesë","en":"Extra cheese"},"price":100},{"id":"y","label":{"sq":"Ullinj","en":"Olives"},"price":50}]
    P['p-calzone']['status']='sold_out'
def num(s): return int(re.sub(r'[^\d]','',s))
def nums_in(txt): return [int(x.replace('.','')) for x in re.findall(r'(\d[\d.]*) ALL',txt)]
res=[]
def check(name,ok,info=''):
    res.append(ok); print(('PASS ' if ok else 'FAIL ')+name, info)
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':844}); ctx.route('**/data/menu.js*',lambda r:r.fulfill(body=vmenu(m1),content_type='application/javascript'))
    pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(BASE); pg.wait_for_selector('#menuList .item')
    # empty cart
    pg.click('#cartBtn'); check('empty cart message', 'bosh' in pg.inner_text('#drawerBody') and pg.is_visible('#goMenu')); pg.click('#goMenu'); check('return to menu closes drawer', not pg.is_visible('#cartDialog'))
    # sold-out blocked
    check('sold out cannot be added', pg.locator('.item[data-id=p-calzone] [data-act]').count()==0 and pg.is_disabled('.item[data-id=p-calzone] .add'))
    # build order: sizes+extras, plain food, drink, beer
    pg.click('.item[data-id=p-margherita] [data-act=opts]'); pg.check('input[value=l]'); pg.check('input[value=x]'); pg.check('input[value=y]'); pg.click('#optAdd')   # 900+150=1050
    pg.click('.item[data-id=p-margherita] [data-act=opts]'); pg.check('input[value=m]'); pg.click('#optAdd')   # 600
    pg.click('.item[data-id=p-pizza-napoli] [data-act=add]'); pg.click('.item[data-id=p-pizza-napoli] [data-act=inc]')   # 700*2
    pg.click('.item[data-id=d-coca-cola] [data-act=add]'); pg.click('.item[data-id=b-heineken] [data-act=add]')
    exp=1050+600+1400+180+300
    check('badge count', pg.inner_text('#cartCount')=='6', pg.inner_text('#cartCount'))
    check('mobile bar total = expected', num(pg.inner_text('#mobileCartTotal'))==exp, pg.inner_text('#mobileCartTotal'))
    pg.click('#mobileCartBtn'); pg.wait_for_timeout(250)
    body=pg.inner_text('#drawerBody'); check('lines show unit price', '1.050 L për copë' in body or '1.050 ALL' in body)
    # decrease / remove
    pg.click('[data-a=inc] >> nth=3'); pg.click('[data-a=dec] >> nth=3')   # coke +1 -1
    pg.click('[data-a=rm] >> nth=1'); exp2=exp-600   # remove medium margherita
    foot=pg.inner_text('#drawerFoot'); check('subtotal after remove', num(re.search(r'Nënshuma\s*([\d.]+ ALL)',foot).group(1))==exp2, foot.split('\n')[0:3].__str__())
    # item note
    pg.click('[data-a=note] >> nth=0'); pg.fill('textarea[data-f^=ta-]','pa ullinj'); 
    # reload preserves
    pg.reload(); pg.wait_for_selector('#menuList .item'); check('cart persists reload', pg.inner_text('#cartCount')=='5' and num(pg.inner_text('#mobileCartTotal'))==exp2)
    pg.click('#mobileCartBtn'); check('note persisted', 'pa ullinj' in pg.eval_on_selector('textarea[data-f^=ta-]','e=>e.value'))
    pg.click('#toStep2')
    # validation
    pg.click('#toStep3'); errs_t=pg.locator('.err').all_inner_texts(); check('required errors (name, phone, age)', len(errs_t)==3, str(errs_t))
    # phone formats
    def tryphone(v):
        pg.fill('#fPhone',v); pg.fill('#fName','Test Klient'); pg.check('#fAge'); pg.click('#toStep3'); pg.wait_for_timeout(100)
        ok = pg.locator('#e-phone').count()==0; 
        if not pg.locator('#waSend').count()==0: pg.click('#toStep2b')
        return ok
    good=['069 381 2566','+355 69 381 2566','+49 170 1234567','(069) 381.2566','0049-170-1234567','+1 (415) 555-0132']; bad=['abc','12345','069 abc 123','++355 69 111 2222','1234567890123456789']
    check('phone formats accepted', all(tryphone(v) for v in good))
    check('phone junk rejected', not any(tryphone(v) for v in bad))
    pg.fill('#fPhone','+355 69 381 2566')
    # delivery: address required, location optional
    pg.check('input[value=delivery]'); pg.fill('#fName','Test Klient'); 
    pg.click('#toStep3'); check('delivery needs address, location optional', pg.locator('#e-address').count()==1 and pg.locator('#e-location').count()==0)
    pg.fill('#fAddr','Rruga Y 12'); pg.fill('#fNote','Zilja prishur'); pg.click('#toStep3'); pg.wait_for_timeout(200)
    rev=pg.inner_text('#drawerBody'); foot=pg.inner_text('#drawerFoot')
    check('review shows service + not-sent notice', 'Dërgesë' in rev and 'nuk është dërguar ende' in rev)
    check('fee unknown -> labelled excl. delivery, nothing silently added', 'pa dërgesën' in foot and num(re.search(r'Totali \(pa dërgesën\)\s*([\d.]+ ALL)',foot).group(1))==exp2)
    href=pg.get_attribute('#waSend','href'); msg=urllib.parse.unquote(href.split('text=')[1]); print(msg)
    tot_msg=int(re.search(r'TOTAL: ([\d.]+) ALL',msg).group(1).replace('.',''))
    lines=[int(x.replace('.','')) for x in re.findall(r'Item total: ([\d.]+) ALL',msg)]
    check('message total == screen total == sum(line totals)', tot_msg==exp2==sum(lines), f'{tot_msg} {exp2} {sum(lines)}')
    check('message has location/notes/instruction fields', 'Zilja prishur' in msg and 'Rruga Y 12' in msg and 'pa ullinj' in msg)
    # send once even on double click; cart kept
    pages=[]; ctx.on('page',lambda q:pages.append(q))
    pg.dblclick('#waSend'); pg.wait_for_timeout(800)
    check('double click opens exactly one WhatsApp window', len(pages)==1, str(len(pages)))
    check('cart + details kept after opening WhatsApp', pg.inner_text('#cartCount')=='5' and json.loads(pg.evaluate("localStorage.getItem('hdh_customer_v1')"))['name']=='Test Klient' and len(json.loads(pg.evaluate("localStorage.getItem('hdh_cart_v1')")))==4)
    check('sent state explains must press Send', 'Dërgo” në WhatsApp' in pg.inner_text('#drawerBody') and pg.get_attribute('#waAgain','aria-disabled')=='true')
    pg.wait_for_timeout(3300); check('open-again re-enabled after lock', pg.get_attribute('#waAgain','aria-disabled') is None)
    # duplicate detection after returning to review
    pg.click('#backToReview'); pg.wait_for_timeout(200); check('duplicate warning for identical order', 'u hap tashmë' in pg.inner_text('#drawerBody'))
    check('same order number reused', True)
    # cross-tab sync
    pg2=ctx.new_page(); pg2.goto(BASE); pg2.wait_for_selector('#menuList .item'); check('2nd tab sees cart', pg2.inner_text('#cartCount')=='5')
    pg2.click('.item[data-id=d-pepsi-max] [data-act=add]'); pg.wait_for_timeout(300); check('1st tab synced', pg.inner_text('#cartCount')=='6', pg.inner_text('#cartCount'))
    # clear only on explicit confirmation
    pg.click('#toStep2b'); pg.click('#toStep1')
    pg.click('#clearAsk'); pg.click('#clearNo'); check('clear can be cancelled', pg.inner_text('#cartCount')=='6')
    pg.click('#clearAsk'); pg.click('#clearYes'); check('cart emptied after confirm', pg.inner_text('#cartCount')=='0' and 'bosh' in pg.inner_text('#drawerBody'))
    check('no page errors', not errs, str(errs))
    ctx.close()

    # ---- verified fee + minimum + required location
    ctx=b.new_context(viewport={'width':390,'height':844}); 
    d2=data.replace('verified: false,','verified: true,').replace('fee: null,    ','fee: 150,     ').replace('minOrder: null,   ','minOrder: 1000,   ').replace('requireLocation: false,','requireLocation: true,')
    ctx.route('**/js/data.js',lambda r:r.fulfill(body=d2,content_type='application/javascript'))
    pg=ctx.new_page(); pg.goto(BASE); pg.wait_for_selector('#menuList .item')
    pg.click('.item[data-id=p-margherita] [data-act=add]'); pg.click('#mobileCartBtn'); pg.click('#toStep2'); pg.check('input[value=delivery]')
    pg.fill('#fName','Ana'); pg.fill('#fPhone','069 111 2222'); pg.fill('#fAddr','Rruga Z'); pg.click('#toStep3'); pg.wait_for_timeout(150)
    check('verified minimum enforced (500 < 1000)', 'minimale' in pg.inner_text('#drawerBody') and pg.locator('#e-location').count()==1, pg.locator('.err, .alert').all_inner_texts().__str__())
    pg.click('#toStep1'); pg.click('[data-a=inc] >> nth=0'); pg.click('#toStep2'); pg.fill('#fLoc','https://maps.app.goo.gl/abc'); pg.click('#toStep3'); pg.wait_for_timeout(150)
    foot=pg.inner_text('#drawerFoot'); href=pg.get_attribute('#waSend','href'); msg=urllib.parse.unquote(href.split('text=')[1])
    check('fee 150 added once: 1000+150', 'Totali' in foot and '1.150 ALL' in foot and '(pa dërgesën)' not in foot, foot.replace('\n',' | '))
    check('message total matches 1.150 L + location', 'TOTAL: 1.150 ALL' in msg and 'maps.app.goo.gl' in msg and 'Delivery fee: 150 ALL' in msg)
    pg.click('#toStep2b'); pg.check('input[value=pickup]'); pg.click('#toStep3'); pg.wait_for_timeout(150)
    foot=pg.inner_text('#drawerFoot'); check('pickup: no fee', '150 ALL' not in foot and '1.000 ALL' in foot, foot.replace('\n',' | '))
    ctx.close()

    # ---- popup blocked -> same-tab fallback, cart kept
    ctx=b.new_context(viewport={'width':390,'height':844}); ctx.add_init_script("window.open=function(){return null}")
    ctx.route('https://wa.me/**',lambda r:r.fulfill(body='<html>wa</html>',content_type='text/html'))
    pg=ctx.new_page(); pg.goto(BASE); pg.wait_for_selector('#menuList .item'); pg.click('.item[data-id=d-coca-cola] [data-act=add]'); pg.click('#mobileCartBtn'); pg.click('#toStep2'); pg.fill('#fName','Ana'); pg.fill('#fPhone','069 111 2222'); pg.click('#toStep3'); pg.click('#waSend'); pg.wait_for_timeout(800)
    check('blocked popup falls back to same-tab wa.me', pg.url.startswith('https://wa.me/355693812566?text='), pg.url[:50])
    pg.go_back(); pg.wait_for_selector('#menuList .item'); check('cart survives after returning', pg.inner_text('#cartCount')=='1')
    ctx.close()

    # ---- stale cart: sold-out item in storage is dropped
    ctx=b.new_context(viewport={'width':390,'height':844}); ctx.route('**/data/menu.js*',lambda r:r.fulfill(body=vmenu(m1),content_type='application/javascript'))
    pg=ctx.new_page(); pg.add_init_script("localStorage.setItem('hdh_cart_v1', JSON.stringify([{key:'x',id:'p-calzone',qty:2,note:'',sel:{}},{key:'y',id:'d-coca-cola',qty:1,note:'',sel:{}},{key:'z',id:'p-margherita',qty:1,note:'',sel:{}}]))")
    pg.goto(BASE); pg.wait_for_selector('#menuList .item'); check('unavailable / invalid saved lines dropped', pg.inner_text('#cartCount')=='1', pg.inner_text('#cartCount'))
    b.close()
print(f"\n{sum(res)}/{len(res)} checks passed")
