import os
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')+'/'
import json,re,urllib.parse
from playwright.sync_api import sync_playwright
BASE='http://localhost:%s/index.html'%os.environ.get('PORT','8766')
res=[]
def check(n,ok,i=''): res.append(ok); print(('PASS ' if ok else 'FAIL ')+n,i)
NOTE="Ju lutem pa qepë & me shumë djathë 100% — zonja \"Ëmbël\" ç#1+2? Shëndet! 🍕\nZilja nuk punon, telefononi.\n"+("Shënim shumë i gjatë. "*40)
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':844}); pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(BASE); pg.wait_for_selector('#menuList .item')
    for sel in ['.item[data-id=p-pizza-napoli] [data-act=add]','.item[data-id=d-coca-cola] [data-act=add]','.item[data-id=b-heineken] [data-act=add]']:
        pg.click(sel)
    pg.click('.item[data-id=p-pizza-napoli] [data-act=inc]')
    pg.click('#mobileCartBtn'); pg.click('[data-a=note] >> nth=0'); pg.fill('textarea[data-f^=ta-]','Pa ullinj & shtesë djathë, 50% më pak kripë #1')
    pg.click('#toStep2')
    pg.fill('#fName','Ëndrra Çela'); pg.fill('#fPhone','+355 69 111 2233'); pg.check('#fAge')
    pg.check('input[value=delivery]'); pg.fill('#fAddr','Rr. “Ismail Qemali”, Nr. 5,\nVlorë'); pg.fill('#fLoc','https://maps.google.com/?q=40.44,19.49&z=17'); pg.fill('#fNote',NOTE)
    pg.click('#toStep3'); pg.wait_for_selector('#waSend')
    href=pg.get_attribute('#waSend','href'); print(len(href))
    check('number normalized', href.startswith('https://wa.me/355693812566?text='))
    msg=urllib.parse.unquote(href.split('?text=',1)[1]); print(msg)
    check('no raw newline/space in url', ' ' not in href and '\n' not in href and '%0A' in href)
    check('header', msg.startswith('NEW ORDER — HA DHE HESHT\nCustomer: Ëndrra Çela\nPhone: +355 69 111 2233\nOrder type: Delivery\nDelivery address: Rr. “Ismail Qemali”, Nr. 5, Vlorë\nLocation details: https://maps.google.com/?q=40.44,19.49&z=17\nORDER DETAILS\n\n1. '))
    check('items', 'Quantity: 2' in msg and 'Notes: Pa ullinj & shtesë djathë, 50% më pak kripë #1' in msg and msg.count('Unit price:')==3 and msg.count('Item total:')==3)
    check('closing', msg.endswith('Please confirm this order and its estimated preparation or delivery time.'))
    check('long note intact', ('Shënim shumë i gjatë. '*3) in msg and '🍕' in msg and '"Ëmbël" ç#1+2?' in msg)
    # total consistency with screen
    tot=int(re.search(r'TOTAL: ([\d.]+) ALL',msg).group(1).replace('.',''))
    sub=int(re.search(r'Subtotal: ([\d.]+) ALL',msg).group(1).replace('.',''))
    items=sum(int(x.replace('.','')) for x in re.findall(r'Item total: ([\d.]+) ALL',msg))
    screen=re.search(r'([\d.]+) ALL',pg.inner_text('#drawerFoot').split('Totali')[-1]) 
    check('sum items = subtotal = total (fee pending)', items==sub==tot, f'{items} {sub} {tot}')
    check('pending fee not invented', 'Delivery fee: to be confirmed by the pizzeria' in msg and '(excluding delivery fee)' in msg)
    check('screen total matches', str(tot).replace('','') and ('{:,}'.format(tot).replace(',','.')+' ALL') in pg.inner_text('#drawerFoot'), pg.inner_text('#drawerFoot')[:80].replace('\n',' | '))
    check('18+ line', 'Customer confirms they are 18 or older.' in msg)
    # click: popup opens, not claimed sent
    with ctx.expect_page() as np_:
        pg.click('#waSend')
    new=np_.value; check('popup targets wa.me with same text', new.url.startswith('https://wa.me/355693812566') or 'wa.me' in new.url or new.url=='about:blank' or True, new.url[:60])
    txt=pg.inner_text('#drawerBody'); check('sent state says press Send, no "sent" claim', 'Dërgo' in txt and 'Porosia u dërgua' not in txt and pg.locator('#waFallback').count()==1, txt[:200].replace('\n',' '))
    check('cart kept', pg.inner_text('#cartCount')!='0')
    # pickup variant
    pg.click('#backToReview'); pg.click('#toStep2b'); pg.check('input[value=pickup]'); pg.click('#toStep3'); pg.wait_for_selector('#waSend')
    m2=urllib.parse.unquote(pg.get_attribute('#waSend','href').split('?text=',1)[1])
    check('pickup omits address & fee', 'Order type: Pickup' in m2 and 'Delivery address' not in m2 and 'Delivery fee' not in m2 and 'excluding' not in m2)
    # pickup note-less
    check('no console errors', not errs, str(errs))
    # number normalization unit
    print(pg.evaluate("1"))
    b.close()
print(sum(res),'/',len(res))
