#!/usr/bin/env node
/* Menu audit:  node tools/check-menu.js [path-to-research-json]
 * 1) validates data/menu.js   2) compares it with the research JSON (every name, price, category) when that file is found. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'data', 'menu.js'), 'utf8'), ctx);
const M = ctx.window.HDH_MENU; let errors = 0, warns = 0;
const err = m => { errors++; console.log('  ERROR  ' + m); }, warn = m => { warns++; console.log('  note   ' + m); };

console.log('Structure');
const catIds = new Set(M.categories.map(c => c.id)), ids = new Set();
const CONF = ['listed', 'single_source', 'conflicting', 'unverified'], STAT = ['available', 'sold_out', 'hidden'];
M.products.forEach((p, i) => {
  const w = `#${i + 1} ${p.id || '(no id)'}`;
  if (!p.id) err(w + ' missing id'); else if (ids.has(p.id)) err(w + ' duplicate id'); ids.add(p.id);
  if (!catIds.has(p.category)) err(w + ' unknown category ' + p.category);
  if (!p.name || !p.name.sq || !p.name.en) err(w + ' missing name.sq / name.en');
  if (p.price !== null && !(Number.isInteger(p.price) && p.price >= 0)) err(w + ' price must be a whole number of lek or null');
  if (p.price === null && !(p.sizes || []).length) warn(w + ' has no price and no sizes: shown as "ask for price", not orderable');
  if (!STAT.includes(p.status)) err(w + ' bad status ' + p.status);
  if (!CONF.includes(p.confidence)) err(w + ' bad confidence ' + p.confidence);
  ['sizes', 'extras'].forEach(k => (p[k] || []).forEach(o => { if (!o.id || !o.label || !o.label.sq || !o.label.en || !Number.isInteger(o.price)) err(w + ` ${k} entry needs id, label.sq/en and integer price`); }));
});
console.log(`  ${M.products.length} products, ${M.categories.length} categories`);

console.log('Comparison with research');
const rp = process.argv[2] || [path.join(root, 'menu_and_business_data.json'), path.join(root, 'ha_dhe_hesht_website_research', 'ha_dhe_hesht_research', 'menu_and_business_data.json')].find(fs.existsSync);
if (!rp || !fs.existsSync(rp)) warn('research JSON not found – skipped (pass its path as an argument)');
else {
  const R = JSON.parse(fs.readFileSync(rp, 'utf8')), rm = R.menu;
  if (rm.length !== M.products.length) err(`research has ${rm.length} items, catalog has ${M.products.length}`);
  rm.forEach((r, i) => {
    const p = M.products[i]; if (!p) return;
    if (p.source_name !== r.name) err(`#${i + 1} name differs: "${p.source_name}" vs research "${r.name}"`);
    if (p.price !== r.price_all) err(`#${i + 1} ${r.name}: price ${p.price} vs research ${r.price_all}`);
    if (p.category !== r.category) err(`#${i + 1} ${r.name}: category ${p.category} vs research ${r.category}`);
    const clean = r.name.replace('🌶️', '').replace(/\s+/g, ' ').trim(), parts = clean.split(' / ');
    if (p.name.sq !== parts[0] || p.name.en !== (parts[1] || parts[0])) err(`#${i + 1} displayed names do not match source_name`);
    if (!!p.spicy !== r.name.includes('🌶️')) err(`#${i + 1} ${r.name}: spicy flag mismatch`);
  });
  const per = {}; M.products.forEach(p => per[p.category] = (per[p.category] || 0) + 1);
  const rper = R.menu_summary.counts_by_category;
  Object.keys(rper).forEach(k => { if (per[k] !== rper[k]) err(`category ${k}: ${per[k]} products vs research ${rper[k]}`); });
  console.log(`  compared ${rm.length} research items with the catalog (name, price, category, spicy flag)`);
}

console.log('Status summary');
const by = f => M.products.reduce((a, p) => (a[f(p)] = (a[f(p)] || 0) + 1, a), {});
console.log('  confidence:', JSON.stringify(by(p => p.confidence)), '| status:', JSON.stringify(by(p => p.status)));
M.products.filter(p => p.confidence !== 'listed').forEach(p => console.log(`  review  ${p.id} [${p.confidence}] ${p.notes || ''}`));
console.log('Missing information (not invented)');
console.log(`  sizes defined for ${M.products.filter(p => (p.sizes || []).length).length}/${M.products.length}; extras for ${M.products.filter(p => (p.extras || []).length).length}/${M.products.length}; real photos for ${M.products.filter(p => p.image).length}/${M.products.length}`);
console.log(`\n${errors ? 'FAILED' : 'OK'}: ${errors} error(s), ${warns} note(s)`);
process.exit(errors ? 1 : 0);
