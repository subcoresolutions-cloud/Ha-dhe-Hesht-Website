/* Deployment consistency checks (no browser needed). Run by tests/run_all.sh.
   1. cache-busting ?v= tags match across index.html and js/app.js (fix: sh tools/bump-version.sh)
   2. every local file referenced by index.html / 404.html / css exists and is committed-path-relative (works under /<repo>/)
   3. production URL is the same in canonical, og:url, og:image, twitter:image, JSON-LD, sitemap.xml, robots.txt, 404.html <base>
   4. the CSP meta tag equals the CSP in _headers (minus frame-ancestors, which a meta tag cannot carry) */
var fs = require('fs'), path = require('path'), root = path.join(__dirname, '..'), bad = 0;
function rd(f) { return fs.readFileSync(path.join(root, f), 'utf8'); }
function ok(c, msg) { console.log((c ? 'ok    ' : 'ERROR ') + msg); if (!c) bad++; }
var html = rd('index.html'), app = rd('js/app.js'), css = rd('css/styles.css'), nf = rd('404.html');
var tags = (html.match(/(?:styles\.css|data\.js|art\.js|app\.js)\?v=([0-9A-Za-z]+)/g) || []).map(function (x) { return x.split('=')[1]; });
var m = app.match(/var ASSET_V = '([0-9A-Za-z]+)'/);
ok(tags.length === 4 && m && tags.every(function (t) { return t === m[1]; }), 'asset version tags consistent' + (m ? ' (' + m[1] + ')' : ''));
// local references must be relative (no leading slash) and exist
var refs = []; html.replace(/(?<![-\w])(?:src|href)="([^"#]+)"/g, function (_, u) { refs.push(u); });
css.replace(/url\(["']?([^"')]+)["']?\)/g, function (_, u) { refs.push('css/' + u); });
var local = refs.filter(function (u) { return !/^(https?:|mailto:|tel:|data:|\/\/)/.test(u); });
ok(local.every(function (u) { return u.charAt(0) !== '/'; }), 'no root-absolute (/…) references: all paths work under /<repo>/');
var missing = local.filter(function (u) { return !fs.existsSync(path.join(root, u.split('?')[0])); });
ok(!missing.length, local.length + ' local references exist' + (missing.length ? ': missing ' + missing.join(', ') : ''));
ok(!/localhost|127\.0\.0\.1/.test(html + app + css + rd('js/data.js') + rd('js/art.js')), 'no localhost references in shipped files');
// one production URL everywhere
var canon = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
var urls = { 'og:url': (html.match(/property="og:url" content="([^"]+)"/) || [])[1], 'og:image': ((html.match(/property="og:image" content="([^"]+)"/) || [])[1] || '').replace(/assets\/logo\.jpg$/, ''),
  'twitter:image': ((html.match(/name="twitter:image" content="([^"]+)"/) || [])[1] || '').replace(/assets\/logo\.jpg$/, ''), 'json-ld url': (html.match(/"url":"([^"]+)"/) || [])[1],
  'json-ld image': ((html.match(/"image":"([^"]+)"/) || [])[1] || '').replace(/assets\/logo\.jpg$/, ''), 'sitemap.xml': (rd('sitemap.xml').match(/<loc>([^<]+)<\/loc>/) || [])[1],
  'robots.txt': ((rd('robots.txt').match(/Sitemap: (\S+)/) || [])[1] || '').replace(/sitemap\.xml$/, '') };
ok(/^https:\/\/[^/]+\/[^/]+\/$/.test(canon || ''), 'canonical is an absolute https project URL: ' + canon);
Object.keys(urls).forEach(function (k) { ok(urls[k] === canon, k + ' matches canonical'); });
var base = (nf.match(/<base href="([^"]+)"/) || [])[1];
ok(canon && base === new URL(canon).pathname, '404.html <base> (' + base + ') matches the canonical path');
// CSP meta == _headers
var hcsp = rd('_headers').split('\n').filter(function (l) { return /Content-Security-Policy/.test(l); })[0].split(': ').slice(1).join(': ').trim();
var mcsp = (html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/) || [])[1];
ok(mcsp === hcsp.split('; ').filter(function (d) { return d.indexOf('frame-ancestors') !== 0; }).join('; '), 'CSP meta tag equals _headers policy');
ok(fs.existsSync(path.join(root, '.nojekyll')), '.nojekyll present (files and folders are served as they are)');
process.exit(bad ? 1 : 0);
