# Design / responsive / accessibility / performance checks (desktop, tablet, mobile). Run via tests/run_all.sh.
import os, re, json, tempfile
from playwright.sync_api import sync_playwright
BASE='http://localhost:%s/index.html'%os.environ.get('PORT','8766')
SHOTS=os.environ.get('SHOT_DIR') or tempfile.mkdtemp(prefix='hdh_shots_')
res=[]
def check(n,ok,i=''): res.append(ok); print(('PASS ' if ok else 'FAIL ')+n,(str(i)[:400] if (not ok or i=='!') else ''))

CONTRAST_JS = r"""
() => {
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if(!m) return null; const p=m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1}; };
  const lum = c => { const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)}; return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b); };
  const ratio = (a,b) => { const l1=lum(a),l2=lum(b); return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05); };
  const over = (fg,bg) => ({r:fg.r*fg.a+bg.r*(1-fg.a),g:fg.g*fg.a+bg.g*(1-fg.a),b:fg.b*fg.a+bg.b*(1-fg.a),a:1});
  const bgFor = el => {           // list of candidate opaque backgrounds (worst case over gradient stops)
    let layers=[]; let e=el;
    while(e && e.nodeType===1){
      const cs=getComputedStyle(e); const bc=parse(cs.backgroundColor);
      const bi=cs.backgroundImage;
      if(bi && bi!=='none' && /gradient/.test(bi)){
        const stops=(bi.match(/rgba?\([^)]+\)/g)||[]).map(parse).filter(s=>s&&s.a>0.5);
        if(stops.length) return stops.map(s=>({r:s.r,g:s.g,b:s.b,a:1}));
      }
      if(bc && bc.a>0){ if(bc.a>=1) return [bc].concat([]); layers.push(bc); }
      e=e.parentElement;
    }
    return [{r:255,g:255,b:255,a:1}];
  };
  const out=[]; const seen=new Set();
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  let n; while(n=walker.nextNode()){
    const t=n.textContent.trim(); if(!t) continue; const el=n.parentElement; if(!el||seen.has(el)) continue;
    if(el.closest('script,style,noscript,[hidden],[aria-hidden=true],dialog:not([open])')) continue;
    const r=el.getBoundingClientRect(); if(r.width<1||r.height<1) continue;
    const cs=getComputedStyle(el); if(cs.visibility==='hidden'||cs.display==='none'||parseFloat(cs.opacity)===0) continue;
    seen.add(el);
    const fg=parse(cs.color); if(!fg) continue;
    const size=parseFloat(cs.fontSize), bold=parseInt(cs.fontWeight)>=700, large=size>=24||(size>=18.66&&bold);
    const need=large?3:4.5;
    let worst=99; for(const bg of bgFor(el)){ const f=over(fg,bg); worst=Math.min(worst,ratio(f,bg)); }
    if(worst<need) out.push({text:t.slice(0,40),cls:el.className||el.tagName,ratio:Math.round(worst*100)/100,need});
  }
  return out;
}
"""

with sync_playwright() as p:
    b=p.chromium.launch()
    sizes=[('360',360,740),('390',390,844),('768',768,1024),('1024',1024,768),('1280',1280,900),('1920',1920,1080)]
    for label,w,h in sizes:
        ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page(); errs=[]
        pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None); pg.on('pageerror',lambda e: errs.append(str(e)))
        pg.add_init_script("window.__cls=0;new PerformanceObserver(l=>{for(const e of l.getEntries()){if(!e.hadRecentInput)window.__cls+=e.value}}).observe({type:'layout-shift',buffered:true});")
        pg.goto(BASE); pg.wait_for_selector('#menuList .item'); pg.wait_for_timeout(600)
        cls=pg.evaluate('window.__cls')   # measured before any screenshot: full-page screenshots resize the viewport and would add fake shifts
        sw=pg.evaluate('document.documentElement.scrollWidth'); check(f'{label}px: no horizontal scroll',sw<=w,sw)
        pg.screenshot(path=f'{SHOTS}/top_{label}.png'); pg.screenshot(path=f'{SHOTS}/full_{label}.png',full_page=True)
        # tap targets: primary controls >= 44px (WCAG 2.2 AAA target; footer text links excluded)
        small=pg.evaluate("""()=>[...document.querySelectorAll('.btn,.add,.tab,.cart-btn,.lang,.burger,.stepper button,.tile,.chip-btn,#menuTools input')].filter(e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return r.width>0&&cs.visibility!=='hidden'&&(r.height<43.5||r.width<43.5)}).map(e=>e.className+':'+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height)).slice(0,8)""")
        check(f'{label}px: touch targets >= 44px',not small,small)
        check(f'{label}px: layout shift (CLS) <= 0.1',cls<=0.1,cls)
        check(f'{label}px: no console/page errors',not errs,errs)
        low=pg.evaluate(CONTRAST_JS); check(f'{label}px: text contrast meets WCAG AA',not low,low[:6])
        # the only horizontally scrollable regions allowed are tabs and the featured carousel
        wide=pg.evaluate("""()=>{const W=document.documentElement.clientWidth;return [...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>W+1||r.left<-1)&&!e.closest('.tabs,.grid-scroll,.nav,dialog,.toast,.skip,.sr-only,svg')&&getComputedStyle(e).position!=='fixed'}).map(e=>e.tagName+'.'+e.className).slice(0,6)}""")
        check(f'{label}px: nothing pokes outside the viewport',not wide,wide)
        ctx.close()

    # images: meaningful ones have alt, decorative are hidden, sizes declared, lazy where below the fold
    ctx=b.new_context(viewport={'width':1280,'height':900}); pg=ctx.new_page(); pg.goto(BASE); pg.wait_for_selector('#menuList .item')
    imgs=pg.evaluate("()=>[...document.images].map(i=>({src:i.getAttribute('src'),alt:i.getAttribute('alt'),w:i.getAttribute('width'),h:i.getAttribute('height'),lazy:i.loading,hidden:!!i.closest('[aria-hidden=true]'),natW:i.naturalWidth}))")
    check('every <img> has an alt attribute (empty only if decorative)',all(i['alt'] is not None for i in imgs),imgs)
    check('every <img> has width/height (no layout shift)',all(i['w'] and i['h'] for i in imgs),imgs)
    check('all images load',all(i['natW']>0 or i['lazy']=='lazy' for i in imgs),imgs)
    svgs=pg.evaluate("()=>[...document.querySelectorAll('.media svg,.hero-pizza svg,.tile .art svg')].filter(s=>!s.closest('[aria-hidden=true]')&&s.getAttribute('aria-hidden')!=='true'&&!s.getAttribute('role')&&!s.getAttribute('aria-label')).length")
    check('illustrations are hidden from assistive tech (names are in the card text)',svgs==0,svgs)
    # keyboard: skip link first, visible focus ring on key controls
    pg.keyboard.press('Tab'); first=pg.evaluate("document.activeElement.className"); check('first Tab stop is the skip link',first=='skip',first)
    bad=[]
    for sel in ['.nav a','#langBtn','#cartBtn','.hero .btn-primary','.tab','.add','#search']:
        pg.focus(sel); ol=pg.evaluate("(()=>{const cs=getComputedStyle(document.activeElement);return [cs.outlineStyle,parseFloat(cs.outlineWidth),cs.boxShadow!=='none']})()")
        if not (ol[0]!='none' and ol[1]>=2 or ol[2]): bad.append((sel,ol))
    check('visible focus indicator on nav, cart, hero CTA, tabs, add buttons, search',not bad,bad)
    # semantic structure
    sem=pg.evaluate("()=>({h1:document.querySelectorAll('h1').length,main:document.querySelectorAll('main').length,nav:document.querySelectorAll('nav[aria-label]').length,order:[...document.querySelectorAll('h1,h2,h3')].map(h=>+h.tagName[1]).every((v,i,a)=>i==0||v-a[i-1]<=1)})")
    check('semantic landmarks and heading order',sem['h1']==1 and sem['main']==1 and sem['nav']>=2 and sem['order'],sem)
    # add-to-cart button label is explicit on desktop
    lab=pg.inner_text('.item >> nth=0 >> [data-act=add]'); check('desktop add button reads "Shto në shportë"','shportë' in lab,lab)
    ctx.close()

    # reduced motion: no running animations/transitions
    ctx=b.new_context(viewport={'width':1280,'height':900},reduced_motion='reduce'); pg=ctx.new_page(); pg.goto(BASE); pg.wait_for_selector('#menuList .item')
    pg.click('.item >> nth=0 >> [data-act=add]'); pg.wait_for_timeout(100)
    anim=pg.evaluate("()=>document.getAnimations().filter(a=>a.playState==='running'&&a.effect&&a.effect.getTiming().duration>1).length"); check('prefers-reduced-motion: no running animations',anim==0,anim)
    sb=pg.evaluate("getComputedStyle(document.documentElement).scrollBehavior"); check('prefers-reduced-motion: no smooth scroll',sb=='auto',sb)
    ctx.close()

    # mobile menu rows + drawer fit the viewport
    ctx=b.new_context(viewport={'width':390,'height':844}); pg=ctx.new_page(); pg.goto(BASE); pg.wait_for_selector('#menuList .item')
    r=pg.evaluate("(()=>{const i=document.querySelector('#menuList .item');const m=i.querySelector('.media').getBoundingClientRect();const f=i.querySelector('.item-foot').getBoundingClientRect();const ib=i.getBoundingClientRect();return {mediaLeftOfBody:m.right<=ib.left+120,footInside:f.right<=ib.right+1,cols:getComputedStyle(i).gridTemplateColumns}})()")
    check('mobile menu items are compact rows (picture left, price + add inside card)',r['mediaLeftOfBody'] and r['footInside'],r)
    pg.click('#menuList .item >> nth=0 >> [data-act=add]'); pg.click('#mobileCartBtn'); pg.wait_for_selector('#cartDialog[open]'); pg.wait_for_timeout(300)
    dw=pg.evaluate("(()=>{const d=document.querySelector('#cartDialog').getBoundingClientRect();return [Math.round(d.left),Math.round(d.right),document.documentElement.scrollWidth]})()")
    check('mobile cart drawer fits the screen',dw[0]>=0 and dw[1]<=390 and dw[2]<=390,dw)
    pg.screenshot(path=f'{SHOTS}/drawer_390.png'); ctx.close(); b.close()
print(f'\n{sum(res)} / {len(res)} passed  (screenshots: {SHOTS})')
