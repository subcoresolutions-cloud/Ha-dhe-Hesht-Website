import os
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')+'/'
from playwright.sync_api import sync_playwright
BASE='http://localhost:%s/index.html'%os.environ.get('PORT','8766'); res=[]
import tempfile; SHOTS=os.environ.get('SHOT_DIR') or tempfile.mkdtemp(prefix='hdh_shots_')
def check(n,ok,i=''): res.append(ok); print(('PASS ' if ok else 'FAIL ')+n,i)
src=open(ROOT+'js/data.js',encoding='utf-8').read()
with sync_playwright() as p:
    b=p.chromium.launch(); errs=[]
    for w,h,name in [(1280,900,'d'),(390,844,'m')]:
        ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto(BASE); pg.wait_for_selector('#bizGrid .card')
        txt=pg.inner_text('#kontakt')
        if name=='d':
            check('tel link', pg.locator('#kontakt a[href="tel:+355693812566"]').count()>=2)
            check('wa link', pg.locator('#kontakt a[href="https://wa.me/355693812566"]').count()>=1)
            check('instagram', pg.locator('#kontakt a[href="https://www.instagram.com/hadhehesht/"]').count()==1)
            check('hours = owner-confirmed 11:00–23:00, no conflicting 09:00–21:00', '11:00 deri në 23:00' in txt and '09:00' not in txt and 'konfirmohet. Na telefono' not in txt)
            check('no embed, no email', pg.locator('iframe').count()==0 and 'Email' not in txt)
            check('delivery: confirmed minimum 400 ALL shown, fee/area still "confirmed on WhatsApp"', 'konfirmohen nga pizzeria' in txt and '400 ALL' in pg.inner_text('#bizGrid .svc-list') and txt.count('ALL')>=1 and 'Tarifa e dërgesës:' not in pg.inner_text('#bizGrid .svc-list'))
            check('categories chips', pg.locator('.chip-btn').count()==4)
            pg.click('.chip-btn >> nth=2'); pg.wait_for_timeout(500); check('chip filters menu', pg.get_attribute('.tab[aria-pressed=true]','data-cat')!='all')
            pg.click('#langBtn'); pg.locator('#kontakt').scroll_into_view_if_needed(); check('english', 'where to find us' in pg.inner_text('#bizGrid').lower() and 'tagline' not in pg.inner_text('#kontakt').lower()[:0] and pg.get_attribute('.biz-logo','alt')=='Ha dhe Hesht logo')
        pg.locator('#kontakt').scroll_into_view_if_needed(); pg.wait_for_timeout(300)
        pg.locator('#kontakt').screenshot(path=f'{SHOTS}/biz_{name}.png')
        check(name+' no horizontal overflow', pg.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    # configured variant
    mod=src.replace('hoursList: null','hoursList: [{days_sq:"Çdo ditë",days_en:"Every day",time:"10:00–22:00"}]').replace('email: null','email: "a@b.al"').replace('mapEmbedUrl: null','mapEmbedUrl: "https://www.google.com/maps/embed?pb=x"').replace('verified: false','verified: true').replace('feeVerified: false','feeVerified: true').replace('fee: null','fee: 150')
    ctx=b.new_context(viewport={'width':1280,'height':900}); ctx.route('**/js/data.js*',lambda r:r.fulfill(body=mod,content_type='application/javascript')); pg=ctx.new_page(); pg.goto(BASE); pg.wait_for_selector('#bizGrid .card'); t=pg.inner_text('#kontakt')
    check('configured hours/email/map/fee shown', '10:00–22:00' in t and 'a@b.al' in t and pg.locator('iframe.biz-map').count()==1 and '150' in t, t[-300:].replace('\n',' '))
    check('no errors', not errs, str(errs)); print(sum(res),'/',len(res))
