# Production-parity test. There is no build step, so the "build output" is the repository tree that GitHub Pages publishes from the root of main.
# This test exports exactly the files that git would commit (the index) into <tmp>/Ha-dhe-Hesht-Website/, serves them the way a GitHub Pages
# project site does (under the repo path, NO custom headers, 404.html for unknown paths) and checks the site there.
import os,re,sys,json,subprocess,tempfile,threading,http.server,mimetypes,urllib.parse,shutil
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
from playwright.sync_api import sync_playwright
REPO='Ha-dhe-Hesht-Website'; PFX='/'+REPO+'/'; res=[]
def check(n,ok,i=''):
    res.append(bool(ok)); print(('PASS ' if ok else 'FAIL ')+n,(str(i)[:400] if not ok else ''))
DIST=tempfile.mkdtemp(prefix='hdh_dist_'); out=os.path.join(DIST,REPO)+'/'
# exactly what `git add -A && git commit` would publish: tracked + untracked-but-not-ignored files (the index is left untouched)
for f in subprocess.run(['git','ls-files','-co','--exclude-standard','-z'],cwd=ROOT,capture_output=True,check=True).stdout.decode().split('\0'):
    if f and os.path.isfile(os.path.join(ROOT,f)): os.makedirs(os.path.dirname(out+f) or out,exist_ok=True); shutil.copy2(os.path.join(ROOT,f),out+f)
files=sorted(os.path.relpath(os.path.join(d,f),out) for d,_,fs in os.walk(out) for f in fs)
class H(http.server.BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def do_GET(self):
        u=urllib.parse.urlsplit(self.path); p=urllib.parse.unquote(u.path); code=200
        fp=None
        if p.startswith(PFX):
            rel=p[len(PFX):]; cand=os.path.join(out,rel)
            if os.path.isdir(cand): cand=os.path.join(cand,'index.html') if p.endswith('/') else None
            if cand and os.path.isfile(cand) and os.path.realpath(cand).startswith(os.path.realpath(out)): fp=cand
            else: fp=os.path.join(out,'404.html'); code=404
        else: self.send_response(404); self.send_header('Content-Type','text/plain'); self.end_headers(); self.wfile.write(b'not the project site'); return
        ct=mimetypes.guess_type(fp)[0] or 'application/octet-stream'
        if fp.endswith('.js'): ct='application/javascript; charset=utf-8'
        if ct.startswith('text/html'): ct='text/html; charset=utf-8'
        b=open(fp,'rb').read(); self.send_response(code); self.send_header('Content-Type',ct); self.send_header('Content-Length',str(len(b))); self.send_header('Cache-Control','max-age=600'); self.end_headers(); self.wfile.write(b)
srv=http.server.ThreadingHTTPServer(('127.0.0.1',0),H); PORT=srv.server_address[1]; threading.Thread(target=srv.serve_forever,daemon=True).start()
ORIGIN=f'http://127.0.0.1:{PORT}'; URL=ORIGIN+PFX
print('published tree ('+str(len(files))+' files):',', '.join(files))
check('no node_modules, env files, keys or build artifacts in the published tree', not [f for f in files if re.search(r'node_modules|\.env|\.pem|\.key|id_rsa|\.map$|dist/|\.log$',f)])
sec=[f for f in files if f.split('.')[-1] in('js','html','css','json','md','txt','xml','sh','py') and re.search(r'(api[_-]?key|secret|passw(or)?d|token)\s*[:=]\s*["\'][^"\']{6,}',open(out+f,encoding='utf-8',errors='ignore').read(),re.I)]
check('no credential-looking strings in shipped files', not sec, sec)
with sync_playwright() as pw:
    b=pw.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':844}); reqs=[]; bad=[]; errs=[]; viol=[]
    ctx.route('https://wa.me/**',lambda r:r.fulfill(status=200,body='<title>wa</title>',content_type='text/html'))
    pg=ctx.new_page(); pg.on('response',lambda r:reqs.append((r.url,r.status,r.headers.get('content-type','')))); pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:errs.append(m.text) if m.type in('error','warning') else None)
    r=pg.goto(URL); pg.wait_for_selector('#menuList .item')
    check('home page 200 text/html at the project URL', r.status==200 and 'text/html' in r.headers['content-type'])
    mine=[x for x in reqs if x[0].startswith(ORIGIN)]
    check('every request stays under /'+REPO+'/ (no root-absolute path leaks)', all(x[0].startswith(URL) for x in mine), [x[0] for x in mine if not x[0].startswith(URL)])
    check('every local asset returned 200', all(x[1]==200 for x in mine), [x for x in mine if x[1]!=200])
    ctmap={'.js':'javascript','.css':'text/css','.jpg':'image/jpeg'}
    wrong=[x for x in mine if any(x[0].split('?')[0].endswith(e) and t not in x[2] for e,t in ctmap.items())]
    check('JS/CSS/JPG served with correct MIME types (no blank-page/MIME errors)', not wrong, wrong)
    kinds=sorted({x[0].split('?')[0].rsplit('/',1)[-1] for x in mine}); print('  loaded:',', '.join(kinds))
    check('catalog loaded: 62 items, 6 featured, logo decoded', pg.locator('#menuList .item').count()==62 and pg.locator('#featuredList .item:not(.skeleton)').count()==6 and pg.evaluate("[...document.images].filter(i=>i.complete&&i.src).every(i=>i.naturalWidth>0||i.loading==='lazy')"))
    check('no console errors/warnings and no uncaught exceptions', not errs, errs[:3])
    check('canonical/og tags point to the production URL', pg.get_attribute('link[rel=canonical]','href')=='https://subcoresolutions-cloud.github.io/'+REPO+'/' and pg.get_attribute('meta[property="og:image"]','content').startswith('https://subcoresolutions-cloud.github.io/'+REPO+'/assets/'))
    # CSP delivered by the meta tag only (GitHub Pages sends no CSP header)
    check('Pages-style server sends no CSP header (policy comes from the meta tag)', 'content-security-policy' not in r.headers)
    pg.evaluate("document.addEventListener('securitypolicyviolation',e=>window.__v=(window.__v||[]).concat(e.violatedDirective))")
    pg.evaluate("(()=>{const s=document.createElement('script');s.textContent='window.__pwn=1';document.body.appendChild(s)})()"); pg.wait_for_timeout(200)
    check('meta CSP blocks an injected inline script', pg.evaluate("window.__pwn")is None and pg.evaluate("(window.__v||[]).length")>=1)
    # direct navigation / refresh on every relevant address
    for label,u in [('index.html',URL+'index.html'),('hash #menu',URL+'#menu'),('hash #kontakt',URL+'#kontakt'),('query string',URL+'?utm_source=qr&x=%C3%AB')]:
        pg.goto('about:blank'); r=pg.goto(u); pg.wait_for_selector('#menuList .item'); check(f'direct navigation: {label} -> 200 and menu renders', r.status==200 and pg.locator('#menuList .item').count()==62)
    pg.goto(URL+'#menu'); pg.wait_for_selector('#menuList .item'); pg.wait_for_timeout(800); pg.reload(); pg.wait_for_selector('#menuList .item'); pg.wait_for_timeout(800); info=pg.evaluate("[location.hash,document.querySelector('#menu').getBoundingClientRect().top,scrollY]"); check('refresh on #menu keeps the page working and scrolls to the menu', info[0]=='#menu' and abs(info[1])<400, info)
    # unknown addresses -> 404.html (project-site behaviour), self-contained and with working links
    for u in [URL+'does-not-exist',URL+'menu/pica/margherita',URL+'assets/missing.jpg']:
        reqs.clear(); r=pg.goto(u); pg.wait_for_selector('h1')
        check(f'unknown path {u[len(ORIGIN):]} -> 404.html, logo loads, back link goes home', r.status==404 and 'nuk ekziston' in pg.inner_text('h1') and pg.evaluate("document.querySelector('img').naturalWidth")>0 and pg.eval_on_selector('main a','a=>a.href')==URL, (r.status,pg.eval_on_selector('main a','a=>a.href')))
    pg.click('main a'); pg.wait_for_selector('#menuList .item'); check('404 page "Go to the menu" opens the real home page', pg.url==URL)
    # cart survives refresh in production + WhatsApp works
    pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_selector('#menuList .item'); errs.clear()
    pg.click('.item[data-id=p-pizza-napoli] [data-act=add]'); pg.click('.item[data-id=d-coca-cola] [data-act=add]'); pg.reload(); pg.wait_for_selector('#menuList .item')
    check('cart (localStorage) survives refresh at the project URL', pg.inner_text('#cartCount')=='2')
    pg.click('#mobileCartBtn'); pg.click('#toStep2'); pg.fill('#fName','Prod Test'); pg.fill('#fPhone','069 000 0000'); pg.check('input[value=pickup]'); pg.click('#toStep3'); pg.wait_for_selector('#waSend')
    href=pg.get_attribute('#waSend','href'); msg=urllib.parse.unquote(href.split('text=',1)[1])
    check('production WhatsApp link: number, header, items and total', href.startswith('https://wa.me/355693812566?text=') and msg.startswith('NEW ORDER — HA DHE HESHT') and 'Pizza Napoli × 1' in msg and 'TOTAL: 880 ALL' in msg, msg[:200])
    with ctx.expect_page() as np_: pg.click('#waSend')
    check('production click opens wa.me in a new tab', np_.value.url==href)
    check('no console errors during the order flow', not errs, errs[:3])
    # desktop width, no horizontal scroll
    d=b.new_context(viewport={'width':1280,'height':800}).new_page(); d.goto(URL); d.wait_for_selector('#menuList .item'); check('desktop: no horizontal scroll', d.evaluate("document.documentElement.scrollWidth<=document.documentElement.clientWidth"))
    b.close()
shutil.rmtree(DIST,ignore_errors=True)
print(f'{sum(res)}/{len(res)} checks passed'); print('FAILED:',[i for i,r in enumerate(res) if not r]); raise SystemExit(0 if all(res) else 1)
