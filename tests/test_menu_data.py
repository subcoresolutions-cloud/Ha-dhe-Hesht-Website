# Menu data audit in the browser: filters, search, selection, price formatting, and price consistency
# between menu card -> cart -> checkout -> WhatsApp message. Expected prices are read from data/menu.js (single source).
import os,json,urllib.parse,re,tempfile
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')+'/'
from playwright.sync_api import sync_playwright
BASE='http://localhost:%s/index.html'%os.environ.get('PORT','8766'); res=[]
def check(n,ok,i=''):
    res.append(bool(ok)); print(('PASS ' if ok else 'FAIL ')+n,(str(i)[:300] if not ok else ''))
M=json.loads(open(ROOT+'data/menu.js',encoding='utf-8').read().split('window.HDH_MENU = ',1)[1].rstrip().rstrip(';'))
P={p['id']:p for p in M['products']}; cats=[c['id'] for c in M['categories']]
def money(n): return f'{n:,}'.replace(',','.')+' ALL'
def num(t): return int(re.sub(r'\D','',t))
with sync_playwright() as pw:
    b=pw.chromium.launch(); ctx=b.new_context(viewport={'width':1280,'height':900}); sent=[]
    ctx.route('https://wa.me/**',lambda r:(sent.append(r.request.url),r.fulfill(status=200,body='<title>wa</title>',content_type='text/html')))
    pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.goto(BASE); pg.wait_for_selector('#menuList .item')
    ids=lambda: pg.eval_on_selector_all('#menuList .item','e=>e.map(x=>x.dataset.id)')
    check('catalog: 62 unique products, ids unique', len(P)==62 and len(M['products'])==62)
    check('catalog: every price is a positive whole number', all(isinstance(p['price'],int) and p['price']>0 for p in P.values()))
    check('catalog: every product available and shown', set(ids())==set(P))
    # category filters
    for c in cats:
        pg.click(f'#tabs .tab[data-cat="{c}"]'); pg.wait_for_timeout(150)
        check(f'filter {c}: exactly its products', set(ids())=={i for i,p in P.items() if p['category']==c} and len(ids())>0)
    pg.click('#tabs .tab[data-cat="all"]'); pg.wait_for_timeout(150); check('filter all restores 62', len(ids())==62)
    # search
    def search(q):
        pg.fill('#search',q); pg.wait_for_timeout(300); return ids()
    check('search "heineken" -> b-heineken', search('heineken')==['b-heineken'])
    check('search is case-insensitive', search('HEINEKEN')==['b-heineken'])
    check('search by English name "tuna" finds both tuna items', {'p-tuna-pizza','s-tuna-sandwich'}<=set(search('tuna')))
    check('search by Albanian ingredient "gorgonzola"', {'p-pizza-eat-shut-up','s-eat-shut-up-sandwich'}<=set(search('gorgonzola')))
    check('search ignores accents ("kercudha"->mushrooms)', 'p-omonia-pizza' in search('kerpudha') )
    check('search with no match shows 0 cards', search('zzzzqq')==[])
    pg.fill('#search',''); pg.wait_for_timeout(250); check('clearing search restores 62', len(ids())==62)
    # price formatting on cards equals catalog
    bad=[]
    for i,p in P.items():
        t=pg.inner_text(f'#menuList .item[data-id="{i}"] .price')
        if money(p['price']) not in t.replace('\xa0',' '): bad.append((i,t))
    check('every card price == catalog price (format 1.000 ALL / 500 ALL)', not bad, bad[:3])
    # unverified/optional data not fabricated
    check('no sizes/extras invented', all(not p.get('sizes') and not p.get('extras') for p in P.values()))
    # food + drinks together, with prices end-to-end
    pick={'p-margherita':2,'s-tuna-sandwich':1,'d-coca-cola':3,'b-heineken':1}
    for i,q in pick.items():
        pg.fill('#search',''); pg.wait_for_timeout(100); pg.click(f'#menuList .item[data-id="{i}"] [data-act=add]')
        for _ in range(q-1): pg.click(f'#menuList .item[data-id="{i}"] [data-act=inc]')
    exp=sum(P[i]['price']*q for i,q in pick.items())
    check('cart badge counts all units', pg.inner_text('#cartCount')=='7', pg.inner_text('#cartCount'))
    pg.click('#cartBtn'); pg.wait_for_selector('#drawerBody')
    drawer=pg.inner_text('#cartDialog').replace('\xa0',' ')
    check('cart lists food and drinks together', all(P[i]['name']['sq'].split(' / ')[0] in drawer for i in pick), drawer[:200])
    check('cart shows each product price', all(money(P[i]['price']) in drawer for i in pick))
    check('cart subtotal == sum(catalog prices x qty)', money(exp) in drawer, (exp, drawer[-200:]))
    # pickup: no minimum applies; delivery: 400 minimum enforced; fee pending
    pg.click('#toStep2'); pg.fill('#fName','Test'); pg.fill('#fPhone','069 381 2566'); pg.check('#fAge')
    pg.check('input[value=pickup]')
    check('pickup: no delivery minimum message', pg.locator('#e-min').count()==0)
    pg.check('input[value=delivery]'); pg.fill('#fAddr','Rr Test 1')
    check('delivery hint shows 400 ALL minimum', '400 ALL' in pg.inner_text('#drawerBody').replace('\xa0',' '))
    pg.check('input[value=pickup]'); pg.click('#toStep3'); pg.wait_for_selector('#waSend')
    href=pg.get_attribute('#waSend','href'); sent.append(href)
    check('WhatsApp url targets the verified number', href.startswith('https://wa.me/355693812566?text='), href[:60])
    msg=urllib.parse.unquote(href.split('text=',1)[1])
    check('WA message total == catalog total', money(exp) in msg.replace('\xa0',' '), msg[-250:])
    m2=msg.replace('\xa0',' ')
    ok=all((P[i]['name']['sq'].split(' / ')[0] in m2) and (f"Unit price: {money(P[i]['price'])}" in m2) and (f"Item total: {money(P[i]['price']*q)}" in m2) and (f" × {q}\n" in m2) for i,q in pick.items())
    check('WA message has every product with qty, unit price and line total from the catalog', ok, m2[:500])
    check('no console errors', not errs, errs[:2])
    # delivery below minimum is blocked (fresh cart: one 180 ALL drink)
    pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_selector('#menuList .item')
    pg.click('#menuList .item[data-id="d-coca-cola"] [data-act=add]'); pg.click('#cartBtn'); pg.click('#toStep2')
    pg.fill('#fName','Test'); pg.fill('#fPhone','069 381 2566'); pg.check('input[value=delivery]'); pg.fill('#fAddr','Rr Test 1')
    if pg.locator('#fAge').count(): pg.check('#fAge')
    pg.click('#toStep3'); pg.wait_for_timeout(300)
    check('delivery order of 180 ALL (< 400) is blocked with minimum message', pg.locator('#e-min').count()==1 and '400' in pg.inner_text('#e-min'), pg.inner_text('#cartDialog')[-200:])
    check('...and no WhatsApp button is offered', pg.locator('#waSend').count()==0)
    b.close()
print(f'{sum(res)}/{len(res)} checks passed'); print('FAILED:',[i for i,r in enumerate(res) if not r]); raise SystemExit(0 if all(res) else 1)
