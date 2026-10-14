/* Ha dhe Hesht – ordering site logic. All business info and the menu live in js/data.js. No build step needed. */
(function () {
  'use strict';
  if (!window.HDH || !window.HDH.business || !window.HDH.order) {
    var bn = document.createElement('p'); bn.className = 'noscript'; bn.setAttribute('role', 'alert');
    bn.textContent = 'Konfigurimi i faqes (js/data.js) mungon ose është i dëmtuar. Site configuration (js/data.js) is missing or broken.';
    document.body.insertBefore(bn, document.body.firstChild); return;
  }
  var D = window.HDH, B = D.business, O = D.order;
  /* safe defaults so a missing setting never breaks the page or shows "undefined" */
  O.currencyLabel = O.currencyLabel || 'ALL'; O.orderPrefix = O.orderPrefix || 'HH';
  O.pickup = O.pickup || { enabled: false }; O.delivery = O.delivery || { enabled: false };
  ['phoneDisplay', 'phoneInternational', 'city_sq', 'city_en', 'landmarks_sq', 'landmarks_en'].forEach(function (k) { if (B[k] == null) B[k] = ''; });

  var WA_NUMBER = waDigits(B.whatsappNumber || B.phoneInternational);
  var WA_OK = WA_NUMBER.length >= 8 && WA_NUMBER.length <= 15;   // false = number missing/invalid: ordering is disabled, never a broken link
  /* ---------- tiny helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function fmt(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ' + O.currencyLabel; }

  /* ---------- language ---------- */
  var lang = store('hdh_lang') === 'en' ? 'en' : 'sq';
  var T = {
    sq: {
      add: 'Shto', addTail: 'në shportë', choose: 'Zgjidh', added: 'U shtua në shportë: ', removed: 'U hoq: ', inCart: 'në shportë',
      inc: 'Shto një', dec: 'Hiq një', remove: 'Hiq', qty: 'Sasia', addNote: 'Shto shënim', editNote: 'Ndrysho shënimin', notePh: 'p.sh. pa qepë, shumë e pjekur…',
      orderNote: 'Shënim për porosinë (opsionale)', orderNotePh: 'p.sh. zilja nuk punon, telefononi kur mbërrini…',
      emptyT: 'Shporta është bosh', emptyP: 'Shto pica, sanduiçe ose pije nga menuja.', browse: 'Shiko menunë',
      subtotal: 'Nënshuma', deliveryFee: 'Dërgesa', feeConfirm: 'konfirmohet në WhatsApp', total: 'Totali', totalNote: 'Totali përfundimtar konfirmohet nga pizzeria.',
      next: 'Vazhdo', back: 'Mbrapa', toReview: 'Rishiko porosinë', cart: 'Shporta',
      how: 'Si e merr porosinë?', pickup: 'Marrje në lokal', delivery: 'Dërgesë', name: 'Emri', phone: 'Numri i telefonit', address: 'Adresa e dërgesës',
      addressHint: 'Rruga, numri, pika referimi (p.sh. pranë Omonias).', ageOk: 'Konfirmoj se jam mbi 18 vjeç (shporta ka birrë).',
      eName: 'Shkruaj emrin.', ePhone: 'Shkruaj një numër telefoni të vlefshëm (7–15 shifra; lejohen +, hapësira, viza).', eAddress: 'Shkruaj adresën për dërgesë.', eAge: 'Duhet të konfirmosh moshën për të porositur birrë.',
      eMin: function (n) { return 'Porosia minimale për dërgesë është ' + fmt(n) + '.'; },
      review: 'Rishiko porosinë', send: 'Dërgo në WhatsApp', copy: 'Kopjo mesazhin', copied: 'Mesazhi u kopjua', edit: 'Ndrysho',
      type: 'Lloji', customer: 'Klienti', items: 'Artikujt', notes: 'Shënim',
      sentFb: function (n) { return 'Nuk u hap WhatsApp? Provo “Hap WhatsApp përsëri”, kopjo mesazhin dhe dërgoje te ' + n + ', ose telefono pizzerinë.'; }, sentT: 'U hap WhatsApp', sentP: 'Porosia vendoset vetëm kur ta shtypësh “Dërgo” në WhatsApp. Nëse nuk u hap ose e mbylle, hape përsëri ose kopjo mesazhin. Shporta ruhet derisa ta boshatisësh vetë.',
      openAgain: 'Hap WhatsApp përsëri', clear: 'E dërgova në WhatsApp – boshatis shportën', cleared: 'Shporta u boshatis',
      sendHint: 'Do të hapet WhatsApp me porosinë të gatshme. Porosia konsiderohet e dërguar vetëm pasi ta shtypësh “Dërgo” në WhatsApp.',
      all: 'Të gjitha', noResults: 'Nuk u gjet asgjë. Provo një fjalë tjetër.', spicy: 'Pikant', age: '18+', items_n: 'artikuj',
      required: 'e detyrueshme', none: 'Asnjë', optTitle: 'Zgjidh opsionet', results: function (n) { return n + ' rezultate'; },
      msgHead: 'Porosi e re – Ha dhe Hesht', msgNo: 'Nr. porosisë', msgName: 'Emri', msgPhone: 'Tel', msgType: 'Lloji', msgAddr: 'Adresa', msgItems: 'Artikujt',
      msgSub: 'Nënshuma', msgFee: 'Dërgesa', msgFeeConf: 'për t’u konfirmuar', msgTotal: 'Totali', msgNote: 'Shënim', msgAge: 'Konfirmoj se jam mbi 18 vjeç.', msgItemNote: 'shënim',
      pickupName: 'Marrje në lokal', deliveryName: 'Dërgesë', steps: ['Shporta', 'Detajet', 'Rishiko'], thanks: 'Faleminderit!',
      title: 'Ha dhe Hesht – Pica & sanduiçe në Vlorë | Porosit në WhatsApp',
      intro: 'Ha dhe Hesht është pizzeri dhe bar në Vlorë. Zgjidh nga menuja me pica, sanduiçe, pije freskuese dhe birra, dhe porosit në pak hapa.',
      each: 'për copë', lineTotal: 'Totali i rreshtit', cancel: 'Anulo', addMore: 'Shto më shumë', clearCart: 'Boshatis shportën', clearAsk: 'Të boshatisim shportën?', yesClear: 'Po, boshatis',
      cartTotalHint: 'Dërgesa (nëse e zgjedh) dhe totali përfundimtar shfaqen në hapin tjetër.', totalExDel: 'Totali (pa dërgesën)', feeLater: 'Dërgesa nuk është përfshirë: konfirmohet nga pizzeria në WhatsApp.',
      phoneHint: 'Çdo format pranohet (p.sh. 069 123 4567 ose +355 69 123 4567).', locOpt: 'Vendndodhja ose lidhje harte (opsionale)', locReq: 'Vendndodhja ose lidhje harte *', locHint: 'p.sh. lidhje nga Google Maps ose një pikë referimi.', locShort: 'Vendndodhja',
      eLoc: 'Shkruaj vendndodhjen ose një lidhje harte.', noService: 'Porosia online nuk është e disponueshme tani. Na telefono ose shkruaj në WhatsApp.',
      notSentT: 'Porosia nuk është dërguar ende.', notSentP: 'Shtyp “Dërgo në WhatsApp”, pastaj shtyp “Dërgo” në WhatsApp me mesazhin e gatshëm. Vetëm atëherë pizzeria e merr porosinë.',
      dupWarn: function (id) { return 'Kjo porosi (Nr. ' + id + ') u hap tashmë në WhatsApp. Kontrollo WhatsApp para se ta dërgosh sërish, që mos të dyfishohet.'; },
      sending: 'Po hapet…', noWa: 'Porosia nuk mund të hapet në WhatsApp sepse numri i biznesit nuk është konfiguruar. Telefono pizzerinë për të porositur.', erased: 'Të dhënat e ruajtura u fshinë.', privHint: 'Të dhënat përdoren vetëm për porosinë dhe ruhen në këtë pajisje.', privLink: 'Njoftimi i privatësisë', tooLong: 'Porosia është shumë e gjatë për lidhjen e WhatsApp. Kopjo mesazhin dhe dërgoje manualisht te ' + B.phoneDisplay + '.',
      msgLoc: 'Vendndodhja', msgTotalEx: 'Totali (pa dërgesën)',
      size: 'Madhësia', extras: 'Shtesa (opsionale)', soldOut: 'Nuk disponohet', askPrice: 'Pyet çmimin', askPriceMsg: 'Përshëndetje! Sa kushton:', noPrice: 'Çmimi me kërkesë',
      loading: 'Po ngarkohet menuja…', errT: 'Menuja nuk u ngarkua', errP: 'Provo përsëri ose na kontakto direkt për të porositur.', retry: 'Provo përsëri', callUs: 'Telefono',
      emptyMenuT: 'Menuja po përditësohet', emptyMenuP: 'Menuja nuk është e disponueshme tani. Na kontakto për të porositur.', clearSearch: 'Pastro kërkimin',
      cartUpdated: 'Disa artikuj u hoqën nga shporta sepse nuk disponohen më.',
      from: 'nga', woltNote: 'Mund të na porosisni edhe në Wolt.', pickupNote: 'Për marrje në lokal, dërgo porosinë paraprakisht në WhatsApp.'
    },
    en: {
      add: 'Add', addTail: 'to cart', choose: 'Choose', added: 'Added to cart: ', removed: 'Removed: ', inCart: 'in cart',
      inc: 'Add one', dec: 'Remove one', remove: 'Remove', qty: 'Quantity', addNote: 'Add note', editNote: 'Edit note', notePh: 'e.g. no onions, well done…',
      orderNote: 'Note for the order (optional)', orderNotePh: 'e.g. doorbell is broken, call when you arrive…',
      emptyT: 'Your cart is empty', emptyP: 'Add pizza, sandwiches or drinks from the menu.', browse: 'See the menu',
      subtotal: 'Subtotal', deliveryFee: 'Delivery', feeConfirm: 'confirmed on WhatsApp', total: 'Total', totalNote: 'The final total is confirmed by the pizzeria.',
      next: 'Continue', back: 'Back', toReview: 'Review order', cart: 'Cart',
      how: 'How do you want your order?', pickup: 'Pickup', delivery: 'Delivery', name: 'Name', phone: 'Phone number', address: 'Delivery address',
      addressHint: 'Street, number, landmark (e.g. near Omonia).', ageOk: 'I confirm I am 18 or older (your cart contains beer).',
      eName: 'Please enter your name.', ePhone: 'Please enter a valid phone number (7–15 digits; +, spaces and dashes are fine).', eAddress: 'Please enter the delivery address.', eAge: 'You must confirm your age to order beer.',
      eMin: function (n) { return 'The minimum order for delivery is ' + fmt(n) + '.'; },
      review: 'Review your order', send: 'Send on WhatsApp', copy: 'Copy message', copied: 'Message copied', edit: 'Edit',
      type: 'Type', customer: 'Customer', items: 'Items', notes: 'Note',
      sentFb: function (n) { return 'WhatsApp did not open? Try “Open WhatsApp again”, copy the message and send it to ' + n + ', or call the pizzeria.'; }, sentT: 'WhatsApp opened', sentP: 'Your order is only placed when you press “Send” in WhatsApp. If it did not open or you closed it, open it again or copy the message. Your cart is kept until you empty it yourself.',
      openAgain: 'Open WhatsApp again', clear: 'I sent it on WhatsApp – empty my cart', cleared: 'Cart emptied',
      sendHint: 'WhatsApp will open with your order ready. The order is only sent once you press “Send” in WhatsApp.',
      all: 'All', noResults: 'Nothing found. Try another word.', spicy: 'Spicy', age: '18+', items_n: 'items',
      required: 'required', none: 'None', optTitle: 'Choose options', results: function (n) { return n + ' results'; },
      msgHead: 'New order – Ha dhe Hesht', msgNo: 'Order no.', msgName: 'Name', msgPhone: 'Phone', msgType: 'Type', msgAddr: 'Address', msgItems: 'Items',
      msgSub: 'Subtotal', msgFee: 'Delivery', msgFeeConf: 'to be confirmed', msgTotal: 'Total', msgNote: 'Note', msgAge: 'I confirm I am 18 or older.', msgItemNote: 'note',
      pickupName: 'Pickup', deliveryName: 'Delivery', steps: ['Cart', 'Details', 'Review'], thanks: 'Thank you!',
      title: 'Ha dhe Hesht – Pizza & sandwiches in Vlorë | Order on WhatsApp',
      intro: 'Ha dhe Hesht is a pizzeria and bar in Vlorë. Pick from our pizza, sandwiches, soft drinks and beer, and order in a few steps.',
      each: 'each', lineTotal: 'Line total', cancel: 'Cancel', addMore: 'Add more', clearCart: 'Empty the cart', clearAsk: 'Empty your cart?', yesClear: 'Yes, empty it',
      cartTotalHint: 'Delivery (if you choose it) and the final total are shown in the next step.', totalExDel: 'Total (excl. delivery)', feeLater: 'Delivery is not included: the pizzeria confirms it on WhatsApp.',
      phoneHint: 'Any format is accepted (e.g. 069 123 4567 or +355 69 123 4567).', locOpt: 'Location details or map link (optional)', locReq: 'Location details or map link *', locHint: 'e.g. a Google Maps link or a landmark.', locShort: 'Location',
      eLoc: 'Please enter location details or a map link.', noService: 'Online ordering is not available right now. Please call us or write on WhatsApp.',
      notSentT: 'Your order has not been sent yet.', notSentP: 'Press “Send on WhatsApp”, then press “Send” in WhatsApp with the message ready. Only then does the pizzeria receive your order.',
      dupWarn: function (id) { return 'This order (No. ' + id + ') was already opened in WhatsApp. Check WhatsApp before sending it again so it is not duplicated.'; },
      sending: 'Opening…', noWa: 'The order cannot be opened in WhatsApp because the business number is not configured. Please call the pizzeria to order.', erased: 'Saved details erased.', privHint: 'Your details are used only for this order and stay on this device.', privLink: 'Privacy notice', tooLong: 'The order is too long for a WhatsApp link. Copy the message and send it manually to ' + B.phoneDisplay + '.',
      msgLoc: 'Vendndodhja', msgTotalEx: 'Totali (pa dërgesën)',
      size: 'Size', extras: 'Extras (optional)', soldOut: 'Not available', askPrice: 'Ask for price', askPriceMsg: 'Hello! How much is:', noPrice: 'Price on request',
      loading: 'Loading the menu…', errT: 'The menu could not be loaded', errP: 'Try again or contact us directly to order.', retry: 'Try again', callUs: 'Call',
      emptyMenuT: 'The menu is being updated', emptyMenuP: 'The menu is not available right now. Contact us to order.', clearSearch: 'Clear search',
      cartUpdated: 'Some items were removed from your cart because they are no longer available.',
      from: 'from', woltNote: 'You can also order from us on Wolt.', pickupNote: 'For pickup, send your order ahead on WhatsApp.'
    }
  };
  // The order message that goes to the business is always written in Albanian.
  var TS = T.sq;
  function t(k) { return T[lang][k]; }
  function pick(o, base) { return o[base + '_' + lang] || o[base + '_sq'] || ''; }

  function applyStaticLang() {
    document.documentElement.lang = lang;
    $$('*').forEach(function (el) {
      if (el.hasAttribute('data-en')) {
        if (el.dataset.sq == null) el.dataset.sq = el.textContent;
        el.textContent = lang === 'en' ? el.getAttribute('data-en') : el.dataset.sq;
      }
      Array.prototype.slice.call(el.attributes).forEach(function (a) {
        if (a.name.indexOf('data-en-') === 0) {
          var real = a.name.slice(8), key = 'data-sq-' + real;
          if (!el.hasAttribute(key)) el.setAttribute(key, el.getAttribute(real) || '');
          el.setAttribute(real, lang === 'en' ? a.value : el.getAttribute(key));
        }
      });
    });
    $('#langBtn').textContent = lang === 'en' ? 'SQ' : 'EN';
    document.title = t('title');
    var md = document.querySelector('meta[name=description]'); if (md) { if (!md.dataset.sq) md.dataset.sq = md.content; md.content = lang === 'en' ? 'Ha dhe Hesht, pizzeria in Vlorë, Albania. Browse the menu with prices in lek, add to your cart and send your order straight to WhatsApp.' : md.dataset.sq; }
    $('#heroTagline').textContent = lang === 'en' ? B.tagline_en : B.tagline_sq;
    $$('[data-bind="city"]').forEach(function (e) { e.textContent = pick(B, 'city'); });
    $$('[data-bind="landmarks"]').forEach(function (e) { e.textContent = pick(B, 'landmarks'); });
  }

  /* ---------- static business bindings ---------- */
  function bindBusiness() {
    var vals = { phoneDisplay: B.phoneDisplay, plusCode: B.plusCode, instagramHandle: B.instagramHandle };
    $$('[data-bind]').forEach(function (e) { var k = e.dataset.bind; if (vals[k] != null) e.textContent = vals[k]; });
    var hrefs = { tel: 'tel:+' + waDigits(B.phoneInternational || B.whatsappNumber), wa: WA_OK ? 'https://wa.me/' + WA_NUMBER : '', maps: B.mapsUrl, instagram: B.instagramUrl, wolt: B.woltUrl };
    $$('[data-bind-href]').forEach(function (e) {
      var u = hrefs[e.dataset.bindHref];
      if (u) e.setAttribute('href', u); else e.hidden = true;
    });
    if (!O.pickup.enabled) $$('[data-service="pickup"]').forEach(function (e) { e.hidden = true; });
    if (!O.delivery.enabled) $$('[data-service="delivery"]').forEach(function (e) { e.hidden = true; });
    $('#year').textContent = new Date().getFullYear();
  }

  /* ---------- catalog (data/menu.js) ---------- */
  var items = [], byId = {}, cats = [], catalogState = 'loading', pendingCart = null;
  function str(o) { return o && typeof o === 'object' ? o : { sq: o || '', en: o || '' }; }
  function normalizeCatalog(raw) {
    var warns = [];
    if (!raw || !Array.isArray(raw.products) || !Array.isArray(raw.categories)) throw new Error('Catalog needs "categories" and "products" arrays.');
    var S = raw.settings || {}, show = Array.isArray(S.displayConfidence) ? S.displayConfidence : ['listed', 'single_source', 'conflicting'];
    var catMap = {}, outCats = [];
    raw.categories.slice().sort(function (a, b) { return ((a && a.order) || 0) - ((b && b.order) || 0); }).forEach(function (c) {
      if (!c || !c.id || catMap[c.id]) { warns.push('category skipped: ' + (c && c.id)); return; }
      var l = str(c.label), n = c.notice ? str(c.notice) : null;
      var o = { id: c.id, label_sq: l.sq || l.en || c.id, label_en: l.en || l.sq || c.id, ageRestricted: !!c.ageRestricted, notice_sq: n ? (n.sq || n.en) : '', notice_en: n ? (n.en || n.sq) : '' };
      catMap[c.id] = o; outCats.push(o);
    });
    var seen = {}, out = [], hidden = 0;
    function opts(list, kind, w) {
      return (Array.isArray(list) ? list : []).filter(function (o) { var ok = o && o.id && o.label && isFinite(o.price) && o.price >= 0; if (!ok) warns.push(w + ': invalid ' + kind + ' skipped'); return ok; })
        .map(function (o) { var l = str(o.label); return { id: String(o.id), label_sq: l.sq || l.en, label_en: l.en || l.sq, price: Math.round(o.price) }; });
    }
    raw.products.forEach(function (p, i) {
      var w = 'product #' + (i + 1) + ' ' + (p && p.id);
      if (!p || typeof p.id !== 'string' || !p.id) { warns.push(w + ': missing id'); return; }
      if (seen[p.id]) { warns.push(w + ': duplicate id'); return; }
      var cat = catMap[p.category]; if (!cat) { warns.push(w + ': unknown category'); return; }
      var nm = str(p.name); if (!nm.sq && !nm.en) { warns.push(w + ': missing name'); return; }
      if (p.price != null && !(isFinite(p.price) && p.price >= 0)) { warns.push(w + ': invalid price'); return; }
      seen[p.id] = 1;
      var conf = p.confidence || 'listed';
      if (p.status === 'hidden' || conf === 'unverified' || show.indexOf(conf) < 0 || (p.status === 'sold_out' && S.showSoldOut === false)) { hidden++; return; }
      var d = str(p.description), cu = p.customization || {}, pr = cu.prompt ? str(cu.prompt) : null;
      out.push({ id: p.id, category: p.category, name_sq: nm.sq || nm.en, name_en: nm.en || nm.sq, desc_sq: d.sq || d.en || '', desc_en: d.en || d.sq || '',
        price: p.price == null ? null : Math.round(p.price), image: p.image || '', sizes: opts(p.sizes, 'size', w), extras: opts(p.extras, 'extra', w),
        custom: { enabled: cu.enabled !== false, prompt_sq: pr ? (pr.sq || pr.en) : '', prompt_en: pr ? (pr.en || pr.sq) : '' },
        available: (p.status || 'available') === 'available', spicy: !!p.spicy, abv: p.abv || 0, alcohol: cat.ageRestricted, featured: !!p.featured });
    });
    return { cats: outCats, items: out, warns: warns, hidden: hidden };
  }
  function orderable(it) { return it.available && (it.sizes.length > 0 || it.price !== null); }
  function needsDialog(it) { return it.sizes.length > 0 || it.extras.length > 0; }
  function minPrice(it) { return it.sizes.length ? Math.min.apply(null, it.sizes.map(function (z) { return z.price; })) : it.price; }
  function selValid(it, sel) {
    sel = sel || {};
    if (it.sizes.length ? !it.sizes.some(function (z) { return z.id === sel.size; }) : sel.size != null) return false;
    return (sel.extras || []).every(function (x) { return it.extras.some(function (e) { return e.id === x; }); });
  }
  function catById(id) { return cats.filter(function (c) { return c.id === id; })[0]; }
  var menuScript = null, retryCount = 0;
  function loadCatalog() {
    catalogState = 'loading'; renderAll();
    if (menuScript) menuScript.remove(); try { delete window.HDH_MENU; } catch (e) { window.HDH_MENU = undefined; }
    var sc = document.createElement('script'), finished = false;
    sc.src = 'data/menu.js' + (retryCount ? '?v=' + Date.now() : ''); menuScript = sc;
    function fail(why) { if (finished) return; finished = true; clearTimeout(timer); console.error('[menu] could not load catalog:', why); catalogState = 'error'; renderAll(); }
    var timer = setTimeout(function () { fail('timeout'); }, 10000);
    sc.onerror = function () { fail('network/file error'); };
    sc.onload = function () {
      if (finished) return; finished = true; clearTimeout(timer);
      try { applyCatalog(window.HDH_MENU); } catch (e) { console.error('[menu] invalid catalog:', e); catalogState = 'error'; renderAll(); }
    };
    document.head.appendChild(sc);
  }
  function applyCatalog(raw) {
    var r = normalizeCatalog(raw);
    r.warns.forEach(function (w) { console.warn('[menu] ' + w); });
    cats = r.cats; items = r.items; byId = {}; items.forEach(function (i) { byId[i.id] = i; });
    catalogState = items.length ? 'ready' : 'empty';
    var sc = sanitizeCart(pendingCart || []); cart = sc.list; var dropped = sc.dropped;
    pendingCart = null; saveCart();
    $$('[data-bind="menuCount"]').forEach(function (e) { e.textContent = items.length; });
    renderAll(); if (dropped) toast(t('cartUpdated'));
  }
  function sanitizeCart(list) {
    var dropped = 0, out = (list || []).filter(function (l) {
      var it = l && byId[l.id], ok = it && l.qty > 0 && orderable(it) && selValid(it, l.sel);
      if (!ok && l && l.qty > 0) dropped++; return ok;
    }).map(function (l) { l.qty = Math.min(Math.floor(l.qty), 99); l.key = lineKey(l.id, l.sel); return l; });
    return { list: out, dropped: dropped };
  }
  function renderAll() { renderHome(); renderTabs(); renderMenu(); updateBadges(); if (cartDlg && cartDlg.open) renderDrawer(); }

  var ICONS = {
    pizza: '<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="currentColor" opacity=".18" d="M32 4C16 4 6 14 4 20c14 8 42 8 56 0C58 14 48 4 32 4Z"/><path fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" d="M4 20C6 14 16 4 32 4s26 10 28 16L32 60 4 20Z"/><circle cx="26" cy="22" r="4" fill="currentColor"/><circle cx="38" cy="26" r="3.5" fill="currentColor"/><circle cx="31" cy="38" r="3.5" fill="currentColor"/></svg>',
    sandwich: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 26c0-10 10-16 24-16s24 6 24 16Z" fill="currentColor" opacity=".25" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M8 32h48M10 38c6 4 10-4 16 0s10-4 16 0 10-4 12 0" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M8 44h48v4c0 5-4 8-9 8H17c-5 0-9-3-9-8Z" fill="currentColor" opacity=".25" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>',
    soft_drink: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M24 6h16v8l4 6v36a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V20l4-6Z" fill="currentColor" opacity=".18" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M20 30h24M20 44h24" stroke="currentColor" stroke-width="3"/></svg>',
    beer: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 14h28v38a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4Z" fill="currentColor" opacity=".18" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M42 22h6a6 6 0 0 1 6 6v8a6 6 0 0 1-6 6h-6M14 14c0-6 6-8 10-6 3-4 10-4 12 0 4-2 6 2 6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M23 26v22M32 26v22" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>'
  };

  /* ---------- cart state ---------- */
  var cart = []; pendingCart = store('hdh_cart_v1') || [];
  var cust = store('hdh_customer_v1') || {};
  function services() { var s = []; if (O.pickup.enabled) s.push('pickup'); if (O.delivery.enabled) s.push('delivery'); return s; }
  var co = { step: 1, type: cust.type, name: cust.name || '', phone: cust.phone || '', address: cust.address || '', location: cust.location || '', orderNote: cust.orderNote || '',
             ageOk: false, errors: {}, orderId: null, orderSig: null, sent: false, sending: false, lockUntil: 0, confirmClear: false };
  if (services().indexOf(co.type) < 0) co.type = services()[0] || 'pickup';

  function saveCart() { store('hdh_cart_v1', cart); }
  function saveCust() { store('hdh_customer_v1', { name: co.name, phone: co.phone, address: co.address, location: co.location, orderNote: co.orderNote, type: co.type }); }

  function lineKey(id, sel) { sel = sel || {}; return id + '|s:' + (sel.size || '') + '|x:' + (sel.extras || []).slice().sort().join(','); }
  function lineInfo(l) {
    var it = byId[l.id], sel = l.sel || {}, labels = [], labelsSq = [], unit = it.price || 0;
    var z = it.sizes.filter(function (x) { return x.id === sel.size; })[0];
    if (z) { unit = z.price; labels.push(pick(z, 'label')); labelsSq.push(z.label_sq); }
    (sel.extras || []).forEach(function (id) { var e = it.extras.filter(function (x) { return x.id === id; })[0]; if (e) { unit += e.price; labels.push('+ ' + pick(e, 'label')); labelsSq.push('+ ' + e.label_sq); } });
    return { it: it, unit: unit, total: unit * l.qty, labels: labels, labelsSq: labelsSq };
  }
  function subtotal() { return cart.reduce(function (s, l) { return s + lineInfo(l).total; }, 0); }
  function count() { return cart.reduce(function (s, l) { return s + l.qty; }, 0); }
  function hasAlcohol() { return cart.some(function (l) { return byId[l.id].alcohol; }); }
  /* Money: everything is whole lek. Fees / minimums apply ONLY when js/data.js marks the delivery settings as verified. */
  function deliveryRules() {
    var d = O.delivery, okF = (d.feeVerified != null ? d.feeVerified : d.verified) === true, okM = (d.minOrderVerified != null ? d.minOrderVerified : d.verified) === true;
    return { fee: okF && typeof d.fee === 'number' && d.fee >= 0 ? Math.round(d.fee) : null, min: okM && typeof d.minOrder === 'number' && d.minOrder > 0 ? Math.round(d.minOrder) : null, requireLocation: d.requireLocation === true };
  }
  function orderTotals() {
    var sub = subtotal(), del = co.type === 'delivery', r = deliveryRules(), fee = del && r.fee !== null ? r.fee : 0;
    return { subtotal: sub, delivery: del, fee: fee, feePending: del && r.fee === null, total: sub + fee };
  }
  function qtyOf(id) { return cart.filter(function (l) { return l.id === id; }).reduce(function (s, l) { return s + l.qty; }, 0); }
  function name(it) { return pick(it, 'name'); }

  function addLine(id, sel) {
    var it = byId[id]; if (!it || !orderable(it) || !selValid(it, sel)) return;
    var key = lineKey(id, sel), ex = cart.filter(function (l) { return l.key === key; })[0];
    if (ex) ex.qty++; else cart.push({ key: key, id: id, qty: 1, note: '', sel: sel || {} });
    afterCartChange(); toast(t('added') + name(byId[id])); bump();
  }
  function setQty(key, q) {
    var l = cart.filter(function (x) { return x.key === key; })[0]; if (!l) return;
    if (q <= 0) { cart = cart.filter(function (x) { return x !== l; }); toast(t('removed') + name(byId[l.id])); } else l.qty = Math.min(q, 99);
    afterCartChange();
  }
  function afterCartChange() {
    saveCart(); updateBadges(); var seen = {}; $$('.item').forEach(function (el) { if (!seen[el.dataset.id]) { seen[el.dataset.id] = 1; refreshControl(el.dataset.id); } });
    if (!cart.length && co.step > 1) co.step = 1;
    if (cartDlg.open) renderDrawer();
  }

  /* ---------- toast / badges ---------- */
  var toastT;
  function toast(msg) { var e = $('#toast'); e.textContent = msg; e.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { e.classList.remove('show'); }, 2200); }
  function bump() { var b = $('#cartBtn'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
  function updateBadges() {
    var n = count();
    $('#cartCount').textContent = n; $('#mobileCartCount').textContent = n; $('#mobileCartTotal').textContent = fmt(subtotal());
    $('#mobileCart').hidden = n === 0;
    $('#cartBtn').setAttribute('aria-label', t('cart') + ', ' + n + ' ' + t('items_n') + ', ' + fmt(subtotal()));
  }

  /* ---------- menu ---------- */
  var activeCat = 'all', query = '';
  function renderTabs() {
    var cs = cats.filter(function (c) { return items.some(function (i) { return i.category === c.id; }); });
    var html = '<button type="button" class="tab" data-cat="all" aria-pressed="' + (activeCat === 'all') + '">' + esc(t('all')) + '</button>';
    cs.forEach(function (c) { html += '<button type="button" class="tab" data-cat="' + esc(c.id) + '" aria-pressed="' + (activeCat === c.id) + '">' + esc(pick(c, 'label')) + '</button>'; });
    $('#tabs').innerHTML = html;
  }
  function controlHTML(it) {
    var q = qtyOf(it.id);
    if (!it.available) return '<button type="button" class="add" disabled>' + esc(t('soldOut')) + '</button>';
    if (!orderable(it)) return !WA_OK ? '<span class="add" aria-disabled="true">' + esc(t('askPrice')) + '</span>' : '<a class="add" href="https://wa.me/' + esc(WA_NUMBER) + '?text=' + encodeURIComponent(TS.askPriceMsg + ' ' + it.name_sq) + '" target="_blank" rel="noopener">' + esc(t('askPrice')) + '</a>';
    if (needsDialog(it)) return '<button type="button" class="add" data-act="opts" data-id="' + esc(it.id) + '" aria-label="' + esc(t('choose') + ': ' + name(it)) + '">' + esc(t('choose')) + (q ? ' (' + q + ')' : '') + '</button>';
    if (!q) return '<button type="button" class="add" data-act="add" data-id="' + esc(it.id) + '" aria-label="' + esc(t('add') + ': ' + name(it) + ', ' + fmt(it.price)) + '">+ ' + esc(t('add')) + '<span class="add-more"> ' + esc(t('addTail')) + '</span></button>';
    return '<div class="stepper" role="group" aria-label="' + esc(name(it) + ': ' + t('qty')) + '"><button type="button" data-act="dec" data-id="' + esc(it.id) + '" aria-label="' + esc(t('dec') + ': ' + name(it)) + '">−</button><output aria-live="polite">' + q + '</output><button type="button" data-act="inc" data-id="' + esc(it.id) + '" aria-label="' + esc(t('inc') + ': ' + name(it)) + '">+</button></div>';
  }
  function refreshControl(id) {
    $$('.item[data-id="' + id + '"] .ctl').forEach(function (el) {
      var had = el.contains(document.activeElement) ? document.activeElement.dataset.act : null;
      el.innerHTML = controlHTML(byId[id]);
      if (had) { var n = el.querySelector('[data-act="' + had + '"]') || el.querySelector('button'); if (n) n.focus(); }
    });
  }
  function catById(id) { for (var i = 0; i < cats.length; i++) if (cats[i].id === id) return cats[i]; return null; }
  function matches(it) {
    if (activeCat !== 'all' && it.category !== activeCat) return false;
    if (!query) return true;
    var c = catById(it.category), hay = norm([it.name_sq, it.name_en, it.desc_sq, it.desc_en, c ? c.label_sq : '', c ? c.label_en : ''].join(' '));
    return query.split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; });
  }
  function priceHTML(it) {
    if (it.sizes.length) { var mn = minPrice(it), same = it.sizes.every(function (z) { return z.price === mn; }); return (same ? '' : '<small>' + esc(t('from')) + '</small> ') + fmt(mn); }
    return it.price === null ? '<small>' + esc(t('noPrice')) + '</small>' : fmt(it.price);
  }
  function cardHTML(it) {
    var other = lang === 'sq' ? it.name_en : it.name_sq, desc = pick(it, 'desc');
    var media = it.image ? '<img src="' + esc(it.image) + '" alt="' + esc(name(it)) + '" decoding="async" loading="lazy" width="640" height="480">' : (window.HDHArt ? HDHArt.forItem(it) : '');
    var badges = (it.spicy ? '<span class="badge">🌶️ ' + esc(t('spicy')) + '</span>' : '') + (it.alcohol ? '<span class="badge age">' + esc(t('age')) + (it.abv ? ' · ' + it.abv + '%' : '') + '</span>' : '') + (!it.available ? '<span class="badge off">' + esc(t('soldOut')) + '</span>' : '');
    return '<li class="item' + (it.available ? '' : ' is-off') + '" data-id="' + esc(it.id) + '"><div class="media cat-' + esc(it.category) + '">' + media + '</div><div class="item-body">' +
      '<h3>' + esc(name(it)) + '</h3>' + (other && other !== name(it) ? '<p class="alt" lang="' + (lang === 'sq' ? 'en' : 'sq') + '">' + esc(other) + '</p>' : '') +
      (desc ? '<p class="desc">' + esc(desc) + '</p>' : '') + (badges ? '<div class="badges">' + badges + '</div>' : '') +
      '<div class="item-foot"><span class="price">' + priceHTML(it) + '</span><span class="ctl">' + controlHTML(it) + '</span></div></div></li>';
  }
  function contactActions() {
    return '<div class="actions">' + (WA_OK ? '<a class="btn btn-wa btn-sm" href="https://wa.me/' + esc(WA_NUMBER) + '" target="_blank" rel="noopener">WhatsApp</a>' : '') + '<a class="btn btn-outline btn-sm" href="tel:+' + esc(waDigits(B.phoneInternational || B.whatsappNumber)) + '">' + esc(t('callUs')) + ' ' + esc(B.phoneDisplay) + '</a></div>';
  }
  function skeletons(n) { var h = ''; for (var i = 0; i < n; i++) h += '<li class="item skeleton"><div class="media"></div><div class="item-body"><span class="sk w70"></span><span class="sk w90"></span><span class="sk w40"></span></div></li>'; return h; }
  function renderMenu() {
    var box = $('#menuList'); $('#menuTools').hidden = catalogState !== 'ready';
    if (catalogState === 'loading') { box.innerHTML = '<p class="sr-only" role="status">' + esc(t('loading')) + '</p><ul class="grid" aria-hidden="true">' + skeletons(8) + '</ul>'; return; }
    if (catalogState === 'error') { box.innerHTML = '<div class="state" role="alert"><h3>' + esc(t('errT')) + '</h3><p>' + esc(t('errP')) + '</p><div class="actions"><button type="button" class="btn btn-primary btn-sm" id="retryMenu">' + esc(t('retry')) + '</button></div>' + contactActions() + '</div>'; return; }
    if (catalogState === 'empty') { box.innerHTML = '<div class="state"><h3>' + esc(t('emptyMenuT')) + '</h3><p>' + esc(t('emptyMenuP')) + '</p>' + contactActions() + '</div>'; return; }
    var html = '', shown = 0;
    cats.forEach(function (c) {
      var list = items.filter(function (i) { return i.category === c.id && matches(i); });
      if (!list.length) return; shown += list.length;
      html += '<section aria-labelledby="cat-' + esc(c.id) + '" class="cat"><h3 class="cat-title" id="cat-' + esc(c.id) + '">' + esc(pick(c, 'label')) + ' <small>' + list.length + '</small></h3>' +
        (pick(c, 'notice') ? '<p class="cat-notice">' + esc(pick(c, 'notice')) + '</p>' : '') + '<ul class="grid">' + list.map(cardHTML).join('') + '</ul></section>';
    });
    box.innerHTML = html || '<div class="state"><p>' + esc(t('noResults')) + '</p><div class="actions"><button type="button" class="btn btn-outline btn-sm" id="clearSearch">' + esc(t('clearSearch')) + '</button></div></div>';
    $('#menuStatus').textContent = query ? t('results')(shown) : '';
  }

  /* ---------- options dialog (sizes + extras) ---------- */
  var optDlg = $('#optDialog'), optItem = null;
  function optSelection() {
    var f = $('#optForm'), sz = f.querySelector('input[name="size"]:checked'), sel = {};
    if (sz) sel.size = sz.value;
    var ex = $$('input[name="extra"]:checked', f).map(function (i) { return i.value; }); if (ex.length) sel.extras = ex;
    return sel;
  }
  function optTotalText() {
    var it = optItem, sel = optSelection(), z = it.sizes.filter(function (x) { return x.id === sel.size; })[0];
    if (it.sizes.length && !z) return t('add');
    var tot = z ? z.price : it.price; (sel.extras || []).forEach(function (id) { tot += it.extras.filter(function (e) { return e.id === id; })[0].price; });
    return t('add') + ' · ' + fmt(tot);
  }
  function openOptions(id) {
    optItem = byId[id]; $('#optTitle').textContent = name(optItem);
    var html = '';
    if (optItem.sizes.length) {
      html += '<fieldset><legend>' + esc(t('size')) + ' <small>(' + esc(t('required')) + ')</small></legend>';
      optItem.sizes.forEach(function (z) { html += '<label class="choice"><input type="radio" name="size" value="' + esc(z.id) + '" required><span>' + esc(pick(z, 'label')) + '</span><span>' + fmt(z.price) + '</span></label>'; });
      html += '</fieldset>';
    }
    if (optItem.extras.length) {
      html += '<fieldset><legend>' + esc(t('extras')) + '</legend>';
      optItem.extras.forEach(function (e) { html += '<label class="choice"><input type="checkbox" name="extra" value="' + esc(e.id) + '"><span>' + esc(pick(e, 'label')) + '</span><span>+' + fmt(e.price) + '</span></label>'; });
      html += '</fieldset>';
    }
    $('#optBody').innerHTML = html; $('#optAdd').textContent = optTotalText();
    optDlg.showModal();
  }
  $('#optBody').addEventListener('change', function () { $('#optAdd').textContent = optTotalText(); });
  $('#optForm').addEventListener('submit', function () { addLine(optItem.id, optSelection()); });
  $('#optCancel').addEventListener('click', function () { optDlg.close(); });
  optDlg.addEventListener('click', function (e) { if (e.target === optDlg) optDlg.close(); });

  /* ---------- cart drawer / checkout ---------- */
  var cartDlg = $('#cartDialog'), lastFocus = null;
  function openCart() { lastFocus = document.activeElement; if (!cart.length) co.step = 1; if (co.sent && !cart.length) co.sent = false; co.confirmClear = false; renderDrawer(true); cartDlg.showModal(); focusHeading(); }
  function closeCart() { cartDlg.close(); }
  function focusHeading() { var h = $('#drawerBody [data-heading]'); (h || $('#drawerTitle')).focus(); }
  cartDlg.addEventListener('close', function () { if (lastFocus && lastFocus.focus) lastFocus.focus(); });
  cartDlg.addEventListener('click', function (e) { if (e.target === cartDlg) closeCart(); });
  $('#drawerClose').addEventListener('click', closeCart);
  $('#cartBtn').addEventListener('click', openCart);
  $('#mobileCartBtn').addEventListener('click', openCart);

  function totalsHTML(mode) {
    var T_ = orderTotals(), h = '<div class="totals"><div><span>' + esc(t('subtotal')) + '</span><span>' + fmt(T_.subtotal) + '</span></div>', hint;
    if (mode === 'cart' && O.delivery.enabled) hint = t('cartTotalHint');
    else {
      if (T_.delivery) h += '<div><span>' + esc(t('deliveryFee')) + '</span><span>' + (T_.feePending ? esc(t('feeConfirm')) : fmt(T_.fee)) + '</span></div>';
      h += '<div class="grand"><span>' + esc(T_.feePending ? t('totalExDel') : t('total')) + '</span><span>' + fmt(T_.total) + '</span></div>';
      hint = T_.feePending ? t('feeLater') : t('totalNote');
    }
    return h + '</div><p class="hint">' + esc(hint) + '</p>';
  }
  function phoneValid(p) { p = String(p).trim(); if (!/^\+?[\d\s().\-\/]+$/.test(p)) return false; var d = p.replace(/\D/g, ''); return d.length >= 7 && d.length <= 15; }

  function renderDrawer(stepChanged) {
    var body = $('#drawerBody'), foot = $('#drawerFoot'), focusKey = null;
    var ae = document.activeElement; if (ae && body.contains(ae) && ae.dataset.f) focusKey = ae.dataset.f;
    var scroll = body.scrollTop;
    $$('#progress li').forEach(function (li, i) {
      var n = i + 1; li.textContent = t('steps')[i];
      li.className = n === co.step ? 'on' : (n < co.step ? 'done' : ''); if (n === co.step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    $('#progress').hidden = co.sent || !cart.length;
    if (co.sent) renderSent(body, foot);
    else if (co.step === 1 || !cart.length) renderStep1(body, foot);
    else if (co.step === 2) renderStep2(body, foot);
    else renderStep3(body, foot);
    if (stepChanged === true) body.scrollTop = 0; else body.scrollTop = scroll;
    if (focusKey) { var n2 = $('[data-f="' + focusKey + '"]', cartDlg); if (n2) n2.focus(); }
  }

  function renderStep1(body, foot) {
    if (!cart.length) {
      body.innerHTML = '<div class="sent"><h3 data-heading tabindex="-1">' + esc(t('emptyT')) + '</h3><p>' + esc(t('emptyP')) + '</p><button type="button" class="btn btn-primary" id="goMenu">' + esc(t('browse')) + '</button></div>';
      foot.innerHTML = ''; return;
    }
    var h = '<h3 class="sr-only" data-heading tabindex="-1">' + esc(t('cart')) + '</h3>';
    cart.forEach(function (l) {
      var li = lineInfo(l), nm = name(li.it), canNote = li.it.custom.enabled;
      h += '<div class="line"><div class="line-top"><div><div class="line-name">' + esc(nm) + '</div>' + (li.labels.length ? '<div class="line-opts">' + esc(li.labels.join(', ')) + '</div>' : '') +
        '<div class="line-opts">' + fmt(li.unit) + ' ' + esc(t('each')) + ' × ' + l.qty + '</div></div><strong aria-label="' + esc(t('lineTotal') + ' ' + fmt(li.total)) + '">' + fmt(li.total) + '</strong></div>' +
        '<div class="line-bottom"><div class="stepper sm" role="group" aria-label="' + esc(nm + ': ' + t('qty')) + '"><button type="button" data-f="dec-' + esc(l.key) + '" data-a="dec" data-k="' + esc(l.key) + '" aria-label="' + esc(t('dec') + ': ' + nm) + '">−</button><output>' + l.qty + '</output><button type="button" data-f="inc-' + esc(l.key) + '" data-a="inc" data-k="' + esc(l.key) + '" aria-label="' + esc(t('inc') + ': ' + nm) + '"' + (l.qty >= 99 ? ' disabled' : '') + '>+</button></div>' +
        '<span>' + (canNote ? '<button type="button" class="linkbtn" data-f="note-' + esc(l.key) + '" data-a="note" data-k="' + esc(l.key) + '">' + esc(l.note || l.showNote ? t('editNote') : t('addNote')) + '</button>' : '') +
        '<button type="button" class="linkbtn" data-a="rm" data-k="' + esc(l.key) + '" aria-label="' + esc(t('remove') + ': ' + nm) + '">' + esc(t('remove')) + '</button></span></div>' +
        (canNote && (l.note || l.showNote) ? '<label class="sr-only" for="n-' + esc(l.key) + '">' + esc(t('addNote') + ': ' + nm) + '</label><textarea id="n-' + esc(l.key) + '" data-f="ta-' + esc(l.key) + '" data-k="' + esc(l.key) + '" maxlength="200" placeholder="' + esc(pick(li.it.custom, 'prompt') || t('notePh')) + '">' + esc(l.note) + '</textarea>' : '') + '</div>';
    });
    h += co.confirmClear ? '<div class="alert" role="alert">' + esc(t('clearAsk')) + ' <button type="button" class="linkbtn" id="clearYes">' + esc(t('yesClear')) + '</button> <button type="button" class="linkbtn" id="clearNo">' + esc(t('cancel')) + '</button></div>'
                         : '<button type="button" class="linkbtn" id="clearAsk">' + esc(t('clearCart')) + '</button>';
    body.innerHTML = h;
    foot.innerHTML = totalsHTML('cart') + '<div class="foot-actions"><button type="button" class="btn btn-outline" id="continueShop">' + esc(t('addMore')) + '</button><button type="button" class="btn btn-primary" id="toStep2">' + esc(t('next')) + '</button></div>';
  }

  function fieldErr(id) { return co.errors[id] ? '<div class="err" id="e-' + id + '">' + esc(co.errors[id]) + '</div>' : ''; }
  function inv(id, extra) { return co.errors[id] ? ' aria-invalid="true" aria-describedby="e-' + id + (extra ? ' ' + extra : '') + '"' : (extra ? ' aria-describedby="' + extra + '"' : ''); }
  function renderStep2(body, foot) {
    var svc = services(), h = '<h3 class="sr-only" data-heading tabindex="-1">' + esc(t('steps')[1]) + '</h3>';
    if (!svc.length) {
      body.innerHTML = h + '<div class="alert" role="alert">' + esc(t('noService')) + '</div>' + contactActions();
      foot.innerHTML = '<div class="foot-actions"><button type="button" class="btn btn-outline" id="toStep1">' + esc(t('back')) + '</button></div>'; return;
    }
    var rules = deliveryRules(), del = co.type === 'delivery';
    h += '<fieldset class="field"><legend class="lbl">' + esc(t('how')) + '</legend><div class="seg' + (svc.length === 1 ? ' one' : '') + '">';
    svc.forEach(function (s) { h += '<label class="choice"><input type="radio" name="ftype" value="' + s + '" data-f="type-' + s + '"' + (co.type === s ? ' checked' : '') + '><span>' + esc(t(s)) + '</span><span></span></label>'; });
    h += '</div>';
    if (del) h += '<p class="hint">' + esc(pick(O.delivery, 'note')) + (rules.min ? ' ' + esc(t('eMin')(rules.min)) : '') + '</p>';
    h += '</fieldset>';
    h += '<div class="field"><label for="fName">' + esc(t('name')) + ' *</label><input type="text" id="fName" data-f="name" autocomplete="name" value="' + esc(co.name) + '"' + inv('name') + ' required>' + fieldErr('name') + '</div>';
    h += '<div class="field"><label for="fPhone">' + esc(t('phone')) + ' *</label><input type="tel" id="fPhone" data-f="phone" autocomplete="tel" inputmode="tel" value="' + esc(co.phone) + '"' + inv('phone', 'h-phone') + ' required><p class="hint" id="h-phone">' + esc(t('phoneHint')) + '</p>' + fieldErr('phone') + '</div>';
    if (del) {
      h += '<div class="field"><label for="fAddr">' + esc(t('address')) + ' *</label><textarea id="fAddr" data-f="address" autocomplete="street-address" maxlength="250"' + inv('address', 'h-addr') + ' required>' + esc(co.address) + '</textarea><p class="hint" id="h-addr">' + esc(t('addressHint')) + '</p>' + fieldErr('address') + '</div>';
      h += '<div class="field"><label for="fLoc">' + esc(rules.requireLocation ? t('locReq') : t('locOpt')) + '</label><input type="text" id="fLoc" data-f="location" maxlength="300" value="' + esc(co.location) + '"' + inv('location', 'h-loc') + (rules.requireLocation ? ' required' : '') + '><p class="hint" id="h-loc">' + esc(t('locHint')) + '</p>' + fieldErr('location') + '</div>';
    }
    h += '<div class="field"><label for="fNote">' + esc(t('orderNote')) + '</label><textarea id="fNote" data-f="orderNote" maxlength="300" placeholder="' + esc(t('orderNotePh')) + '">' + esc(co.orderNote) + '</textarea></div>';
    if (hasAlcohol()) h += '<div class="field"><label class="choice"><input type="checkbox" id="fAge" data-f="age"' + (co.ageOk ? ' checked' : '') + inv('age') + '><span>' + esc(t('ageOk')) + '</span><span></span></label>' + fieldErr('age') + '</div>';
    h += '<p class="hint">' + esc(t('privHint')) + ' <button type="button" class="link-btn" id="privLink">' + esc(t('privLink')) + '</button></p>';
    if (co.errors.min) h += '<div class="alert" role="alert" tabindex="-1" id="e-min">' + esc(co.errors.min) + '</div>';
    body.innerHTML = h;
    foot.innerHTML = totalsHTML('checkout') + '<div class="foot-actions"><button type="button" class="btn btn-outline" id="toStep1">' + esc(t('back')) + '</button><button type="button" class="btn btn-primary" id="toStep3">' + esc(t('toReview')) + '</button></div>';
  }

  /* Re-check the cart against the live catalog (sold out / removed items cannot be ordered). */
  function revalidateCart() {
    var r = sanitizeCart(cart); if (!r.dropped) return true;
    cart = r.list; afterCartChange(); toast(t('cartUpdated')); return false;
  }
  function validate() {
    var e = {}, rules = deliveryRules(), del = co.type === 'delivery';
    if (co.name.trim().length < 2) e.name = t('eName');
    if (!phoneValid(co.phone)) e.phone = t('ePhone');
    if (del && co.address.trim().length < 3) e.address = t('eAddress');
    if (del && rules.requireLocation && !co.location.trim()) e.location = t('eLoc');
    if (hasAlcohol() && !co.ageOk) e.age = t('eAge');
    if (del && rules.min && subtotal() < rules.min) e.min = t('eMin')(rules.min);
    co.errors = e; return e;
  }

  function newOrderId() {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return O.orderPrefix + '-' + p(d.getMonth() + 1) + p(d.getDate()) + '-' + Math.random().toString(36).slice(2, 5).toUpperCase();
  }
  function orderSig() {
    var del = co.type === 'delivery', s = JSON.stringify([cart.map(function (l) { return [l.key, l.qty, (l.note || '').trim()]; }), co.type, co.name.trim(), co.phone.trim(), del ? co.address.trim() : '', del ? co.location.trim() : '', co.orderNote.trim(), orderTotals().total]);
    var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return String(h >>> 0);
  }
  function lastOrder() { var o = store('hdh_last_order_v1'); return o && o.at && Date.now() - o.at < 12 * 3600 * 1000 ? o : null; }

  /* ---- WhatsApp message ----
     The destination comes ONLY from HDH.business.whatsappNumber (js/data.js). waDigits() accepts "+355 69 381 2566",
     "00355 69…", "069 381 2566" etc. and returns international digits only (355693812566). */
  function waDigits(raw) {
    var d = String(raw == null ? '' : raw).replace(/\D/g, '');
    if (d.indexOf('00') === 0) d = d.slice(2);
    else if (d.charAt(0) === '0' && d.length <= 10) d = '355' + d.slice(1);   // Albanian national format
    return d;
  }
  function msgMoney(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ALL'; }
  function oneLine(s) { return String(s || '').replace(/\s*[\r\n]+\s*/g, ' ').replace(/[ \t]+/g, ' ').trim(); }

  function buildMessage() {
    var L = [], T_ = orderTotals(), del = co.type === 'delivery';
    L.push('NEW ORDER — HA DHE HESHT');
    L.push('Customer: ' + oneLine(co.name));
    L.push('Phone: ' + oneLine(co.phone));
    L.push('Order type: ' + (del ? 'Delivery' : 'Pickup'));
    if (del) {
      L.push('Delivery address: ' + oneLine(co.address));
      if (oneLine(co.location)) L.push('Location details: ' + oneLine(co.location));
    }
    L.push('ORDER DETAILS');
    cart.forEach(function (l, i) {
      var li = lineInfo(l);
      L.push('');
      L.push((i + 1) + '. ' + li.it.name_sq + (li.labelsSq.length ? ' (' + li.labelsSq.join(', ') + ')' : ''));
      L.push('Quantity: ' + l.qty);
      L.push('Unit price: ' + msgMoney(li.unit));
      L.push('Item total: ' + msgMoney(li.total));
      if (oneLine(l.note)) L.push('Notes: ' + oneLine(l.note));
    });
    L.push('');
    L.push('Subtotal: ' + msgMoney(T_.subtotal));
    if (del) L.push('Delivery fee: ' + (T_.feePending ? 'to be confirmed by the pizzeria' : msgMoney(T_.fee)));
    L.push('TOTAL: ' + msgMoney(T_.total) + (del && T_.feePending ? ' (excluding delivery fee)' : ''));
    if (oneLine(co.orderNote)) L.push('Additional notes: ' + oneLine(co.orderNote));
    if (hasAlcohol() && co.ageOk) L.push('Customer confirms they are 18 or older.');
    L.push('Please confirm this order and its estimated preparation or delivery time.');
    return L.join('\n');
  }
  var MAX_URL = 7000;
  function waUrl() { return !WA_OK ? '' : 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(buildMessage()); }

  function renderStep3(body, foot) {
    var sig = orderSig(), lo = lastOrder(), dup = !!(lo && lo.sig === sig);
    co.orderId = dup ? lo.id : (co.orderId && co.orderSig === sig ? co.orderId : newOrderId()); co.orderSig = sig;
    var T_ = orderTotals(), del = co.type === 'delivery', url = waUrl(), tooLong = !WA_OK || url.length > MAX_URL;
    var h = '<div class="review"><h3 data-heading tabindex="-1">' + esc(t('review')) + '</h3>' +
      '<div class="notice" role="note"><strong>' + esc(t('notSentT')) + '</strong> ' + esc(t('notSentP')) + '</div>' +
      (dup ? '<div class="alert" role="alert">' + esc(t('dupWarn')(co.orderId)) + '</div>' : '') +
      (tooLong ? '<div class="alert" role="alert">' + esc(t(WA_OK ? 'tooLong' : 'noWa')) + '</div>' : '') +
      '<dl><dt>' + esc(t('type')) + '</dt><dd>' + esc(del ? t('delivery') : t('pickup')) + '</dd>' +
      '<dt>' + esc(t('name')) + '</dt><dd>' + esc(co.name) + '</dd><dt>' + esc(t('phone')) + '</dt><dd>' + esc(co.phone) + '</dd>' +
      (del ? '<dt>' + esc(t('address')) + '</dt><dd>' + esc(co.address) + '</dd>' + (co.location.trim() ? '<dt>' + esc(t('locShort')) + '</dt><dd>' + esc(co.location) + '</dd>' : '') : '') +
      (co.orderNote.trim() ? '<dt>' + esc(t('notes')) + '</dt><dd>' + esc(co.orderNote) + '</dd>' : '') + '</dl><ul>';
    cart.forEach(function (l) {
      var li = lineInfo(l);
      h += '<li><span>' + l.qty + ' × ' + esc(name(li.it)) + (li.labels.length ? '<span class="sub">' + esc(li.labels.join(', ')) + '</span>' : '') + '<span class="sub">' + fmt(li.unit) + ' ' + esc(t('each')) + '</span>' + (l.note ? '<span class="sub">' + esc(t('notes')) + ': ' + esc(l.note) + '</span>' : '') + '</span><strong>' + fmt(li.total) + '</strong></li>';
    });
    h += '</ul></div>';
    body.innerHTML = h;
    foot.innerHTML = totalsHTML('review') + '<a class="btn btn-wa" id="waSend" href="' + esc(url || '#') + '" target="_blank" rel="noopener"' + (tooLong ? ' aria-disabled="true"' : '') + '>' + esc(dup ? t('openAgain') : t('send')) + '</a>' +
      '<div class="foot-actions"><button type="button" class="btn btn-outline" id="toStep2b">' + esc(t('edit')) + '</button><button type="button" class="btn btn-outline' + (tooLong ? ' emph' : '') + '" id="copyMsg">' + esc(t('copy')) + '</button></div>';
  }

  function renderSent(body, foot) {
    var locked = Date.now() < co.lockUntil;
    body.innerHTML = '<div class="sent"><h3 data-heading tabindex="-1">' + esc(t('sentT')) + '</h3><div class="notice" role="note">' + esc(t('sentP')) + '</div><p class="muted" id="waFallback">' + esc(t('sentFb')(B.phoneDisplay)) + '</p></div>';
    foot.innerHTML = '<a class="btn btn-wa" id="waAgain" href="' + esc(waUrl()) + '" target="_blank" rel="noopener"' + (locked ? ' aria-disabled="true"' : '') + '>' + esc(t('openAgain')) + '</a>' +
      '<div class="foot-actions"><button type="button" class="btn btn-outline" id="copyMsg">' + esc(t('copy')) + '</button><button type="button" class="btn btn-outline" id="backToReview">' + esc(t('edit')) + '</button></div>' +
      '<button type="button" class="btn btn-primary" id="clearCart">' + esc(t('clear')) + '</button>';
    if (locked) setTimeout(function () { if (co.sent && cartDlg.open) renderDrawer(); }, Math.max(0, co.lockUntil - Date.now()) + 50);
    focusHeading();
  }

  /* Opens the prefilled WhatsApp message. The cart and customer details are NOT cleared here: only the customer can confirm the order was sent. */
  function sendOrder() {
    if (co.sending || Date.now() < co.lockUntil) return;
    if (!revalidateCart()) { goStep(1); return; }
    if (Object.keys(validate()).length) { goStep(2); renderDrawer(); return; }
    var url = waUrl(); if (!WA_OK || url.length > MAX_URL) { renderDrawer(); return; }
    co.sending = true; co.lockUntil = Date.now() + 3000;
    var a = $('#waSend'); if (a) { a.setAttribute('aria-disabled', 'true'); a.textContent = t('sending'); }
    saveCart(); saveCust();
    store('hdh_last_order_v1', { sig: co.orderSig, id: co.orderId, at: Date.now() });
    var w = null; try { w = window.open(url, '_blank'); } catch (e) { w = null; }
    if (w) { try { w.opener = null; } catch (e2) {} } else { window.location.href = url; }
    co.sent = true; renderDrawer(true);
    setTimeout(function () { co.sending = false; }, 3000);
  }

  function goStep(n) { co.step = n; co.errors = {}; renderDrawer(true); focusHeading(); }

  function copyText(s) {
    function done() { toast(t('copied')); }
    if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(s).then(done, fallback); } else fallback();
    function fallback() { var ta = document.createElement('textarea'); ta.value = s; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} ta.remove(); }
  }

  /* drawer events (delegated) */
  cartDlg.addEventListener('click', function (e) {
    var b = e.target.closest('button, a'); if (!b) return;
    if (b.id === 'privLink') { openPriv(); return; }
    if (b.id === 'waSend' || b.id === 'waAgain') { e.preventDefault(); if (b.getAttribute('aria-disabled') !== 'true') sendOrder(); return; }
    var a = b.dataset.a, k = b.dataset.k, l = k && cart.filter(function (x) { return x.key === k; })[0];
    if (a === 'inc' && l) setQty(k, l.qty + 1);
    else if (a === 'dec' && l) { var q = l.qty - 1; setQty(k, q); if (q <= 0) { var f = $('#drawerBody [data-f]'); (f || $('#drawerTitle')).focus(); } }
    else if (a === 'rm' && l) { setQty(k, 0); var f2 = $('#drawerBody [data-f]'); (f2 || $('#drawerTitle')).focus(); }
    else if (a === 'note' && l) { l.showNote = true; renderDrawer(); var ta = $('[data-f="ta-' + k + '"]', cartDlg); if (ta) ta.focus(); }
    else if (b.id === 'goMenu' || b.id === 'continueShop') { closeCart(); $('#menu').scrollIntoView(); }
    else if (b.id === 'clearAsk') { co.confirmClear = true; renderDrawer(); var y = $('#clearYes'); if (y) y.focus(); }
    else if (b.id === 'clearNo') { co.confirmClear = false; renderDrawer(); }
    else if (b.id === 'clearYes') { cart = []; co.confirmClear = false; co.step = 1; afterCartChange(); toast(t('cleared')); }
    else if (b.id === 'toStep2') { if (cart.length && revalidateCart()) goStep(2); }
    else if (b.id === 'toStep1') goStep(1);
    else if (b.id === 'toStep2b') goStep(2);
    else if (b.id === 'backToReview') { co.sent = false; goStep(3); }
    else if (b.id === 'toStep3') {
      if (!revalidateCart()) { goStep(1); return; }
      var errs = validate();
      if (Object.keys(errs).length) {
        renderDrawer(); var first = errs.name ? '#fName' : errs.phone ? '#fPhone' : errs.address ? '#fAddr' : errs.location ? '#fLoc' : errs.age ? '#fAge' : '#e-min';
        var fe = $(first); if (fe) fe.focus();
      } else goStep(3);
    }
    else if (b.id === 'copyMsg') copyText(buildMessage());
    else if (b.id === 'clearCart') { cart = []; co.sent = false; co.step = 1; co.orderNote = ''; co.orderId = null; co.ageOk = false; saveCust(); afterCartChange(); toast(t('cleared')); closeCart(); }
  });
  cartDlg.addEventListener('input', function (e) {
    var el = e.target, f = el.dataset.f; if (!f) return;
    var map = { name: 'name', phone: 'phone', address: 'address', location: 'location', orderNote: 'orderNote' };
    if (map[f]) { co[map[f]] = el.value; saveCust(); if (co.errors[f]) { delete co.errors[f]; var er = $('#e-' + f, cartDlg); if (er) er.remove(); el.removeAttribute('aria-invalid'); } }
    else if (f.indexOf('ta-') === 0) { var l = cart.filter(function (x) { return x.key === el.dataset.k; })[0]; if (l) { l.note = el.value; saveCart(); } }
  });
  cartDlg.addEventListener('change', function (e) {
    var el = e.target, f = el.dataset.f; if (!f) return;
    if (f.indexOf('type-') === 0) { co.type = el.value; co.errors = {}; saveCust(); renderDrawer(); var r = $('[data-f="type-' + co.type + '"]'); if (r) r.focus(); }
    else if (f === 'age') { co.ageOk = el.checked; delete co.errors.age; var ae2 = $('#e-age', cartDlg); if (ae2) ae2.remove(); }
  });

  /* ---------- menu & page events ---------- */
  $('#tabs').addEventListener('click', function (e) {
    var b = e.target.closest('.tab'); if (!b) return; activeCat = b.dataset.cat; renderTabs(); renderMenu();
    var nb = $('.tab[data-cat="' + activeCat + '"]'); if (nb) nb.focus();
  });
  var st; $('#search').addEventListener('input', function (e) { clearTimeout(st); var v = e.target.value; st = setTimeout(function () { query = norm(v).trim(); renderMenu(); }, 120); });
  function onItemClick(e) {
    var b = e.target.closest('button[data-act]'); if (!b) return;
    var id = b.dataset.id, act = b.dataset.act;
    if (act === 'add') addLine(id, {});
    else if (act === 'opts') openOptions(id);
    else { var l = cart.filter(function (x) { return x.id === id && !Object.keys(x.sel || {}).length; })[0]; if (l) setQty(l.key, l.qty + (act === 'inc' ? 1 : -1)); }
  }
  $('#menuList').addEventListener('click', function (e) {
    if (e.target.closest('#retryMenu')) { retryCount++; loadCatalog(); return; }
    if (e.target.closest('#clearSearch')) { $('#search').value = ''; query = ''; activeCat = 'all'; renderTabs(); renderMenu(); return; }
    onItemClick(e);
  });
  $('#featuredList').addEventListener('click', onItemClick);
  function onCatPick(e) {
    var b = e.target.closest('.tile, .chip-btn'); if (!b) return;
    activeCat = b.dataset.cat; renderTabs(); renderMenu(); $('#menu').scrollIntoView({ behavior: 'smooth' });
  }
  $('#catTiles').addEventListener('click', onCatPick);
  $('#bizGrid').addEventListener('click', onCatPick);
  $('#langBtn').addEventListener('click', function () {
    lang = lang === 'sq' ? 'en' : 'sq'; store('hdh_lang', lang); applyStaticLang(); renderHome(); renderTabs(); renderMenu(); updateBadges(); if (cartDlg.open) renderDrawer();
  });
  window.addEventListener('storage', function (e) {   // cart stays in sync between open tabs/pages
    if (e.key !== 'hdh_cart_v1' || catalogState !== 'ready') return;
    var r = sanitizeCart(store('hdh_cart_v1') || []); cart = r.list; updateBadges();
    var seen = {}; $$('.item').forEach(function (el) { if (!seen[el.dataset.id]) { seen[el.dataset.id] = 1; refreshControl(el.dataset.id); } });
    if (!cart.length && co.step > 1) co.step = 1; if (cartDlg.open) renderDrawer();
  });

  /* ---------- home sections ---------- */
  function renderHome() {
    var hp = $('#heroPizza'); if (hp && !hp.innerHTML) hp.innerHTML = HDHArt.hero();
    $('#introText').textContent = t('intro');
    $('#aboutText').innerHTML = (B['about_' + lang] || B.about_sq || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
    $('#footTagline').textContent = lang === 'en' ? B.tagline_en : B.tagline_sq;
    var note = []; if (O.delivery.enabled) note.push(pick(O.delivery, 'note')); if (O.pickup.enabled) note.push(t('pickupNote')); if (B.woltUrl) note.push(t('woltNote'));
    $('#svcNote').textContent = note.join(' ');
    /* while the catalog is still loading keep the placeholder cards from index.html (no empty section, no layout shift) */
    if (catalogState === 'loading') { renderBusiness(); return; }
    var feat = items.filter(function (i) { return i.featured; });
    $('#featured').hidden = !feat.length;
    $('#featuredList').innerHTML = feat.map(cardHTML).join(''); $('#featuredList').removeAttribute('aria-busy');
    $('#catTiles').innerHTML = cats.map(function (c) {
      var list = items.filter(function (i) { return i.category === c.id; }); if (!list.length) return '';
      var min = Math.min.apply(null, list.map(function (i) { return i.price; }));
      return '<li><button type="button" class="tile" data-cat="' + esc(c.id) + '"><span class="art">' + HDHArt.category(c.id) + '</span><strong>' + esc(pick(c, 'label')) + '</strong><span>' + list.length + ' ' + esc(t('items_n')) + ' · ' + esc(t('from')) + ' ' + fmt(min) + '</span></button></li>';
    }).join('');
    renderBusiness();
  }

  /* ---------- business information section (all values come from js/data.js) ---------- */
  var BZ = {
    sq: { call: 'Telefono', wa: 'Shkruaj në WhatsApp', phoneT: 'Telefon & WhatsApp', phoneP: 'Na telefono ose na shkruaj për pyetje, porosi dhe konfirmime.', emailT: 'Email',
      whereT: 'Ku të gjejmë', near: 'Pranë', dirs: 'Merr udhëzimet', code: 'Kodi i hartës', hoursT: 'Orari i punës', hoursNone: 'Orari do të konfirmohet. Na telefono ose na shkruaj në WhatsApp për të ditur nëse jemi të hapur.',
      catT: 'Çfarë ofrojmë', seeMenu: 'Shiko menunë', svcT: 'Si mund të porosisësh', svcWeb: 'Porosit nga kjo faqe: shto artikujt në shportë dhe dërgoje porosinë në WhatsApp.',
      pickup: 'Marrje në lokal', pickupP: 'Dërgo porosinë paraprakisht në WhatsApp dhe merre në lokal.', delivery: 'Dërgesë', fee: 'Tarifa e dërgesës', min: 'Porosia minimale', area: 'Zona e dërgesës',
      wolt: 'Porosit edhe në Wolt', payT: 'Mënyrat e pagesës', onlineT: 'Në rrjete', ig: 'Instagram', new_tab: ' (hapet në skedë të re)', mapT: 'Harta e vendndodhjes', items: 'artikuj' },
    en: { call: 'Call', wa: 'Message on WhatsApp', phoneT: 'Phone & WhatsApp', phoneP: 'Call or message us with questions, orders and confirmations.', emailT: 'Email',
      whereT: 'Where to find us', near: 'Near', dirs: 'Get directions', code: 'Map code', hoursT: 'Opening hours', hoursNone: 'Opening hours are being confirmed. Call or message us on WhatsApp to check whether we are open.',
      catT: 'What we serve', seeMenu: 'See the menu', svcT: 'How to order', svcWeb: 'Order on this website: add items to your cart and send the order on WhatsApp.',
      pickup: 'Pickup', pickupP: 'Send your order ahead on WhatsApp and collect it at the pizzeria.', delivery: 'Delivery', fee: 'Delivery fee', min: 'Minimum order', area: 'Delivery area',
      wolt: 'Also order on Wolt', payT: 'Payment methods', onlineT: 'Online', ig: 'Instagram', new_tab: ' (opens in a new tab)', mapT: 'Location map', items: 'items' }
  };
  function renderBusiness() {
    var g = $('#bizGrid'); if (!g) return;
    var z = BZ[lang], tel = 'tel:+' + waDigits(B.phoneInternational || B.whatsappNumber), wa = WA_OK ? 'https://wa.me/' + WA_NUMBER : '';
    var ext = ' target="_blank" rel="noopener"', sr = '<span class="sr-only">' + esc(z.new_tab) + '</span>';
    $('#bizTagline').textContent = lang === 'en' ? B.tagline_en : B.tagline_sq;
    $('#bizIntro').textContent = ((B['about_' + lang] || B.about_sq || [])[0]) || '';
    // quick actions (always visible, big touch targets)
    var q = '<a class="btn btn-primary btn-lg" href="' + esc(tel) + '"><span aria-hidden="true">☎</span> ' + esc(z.call) + ' ' + esc(B.phoneDisplay) + '</a>' +
      (wa ? '<a class="btn btn-wa btn-lg" href="' + esc(wa) + '"' + ext + '>' + esc(z.wa) + sr + '</a>' : '');
    if (B.mapsUrl) q += '<a class="btn btn-outline btn-lg" href="' + esc(B.mapsUrl) + '"' + ext + '>' + esc(z.dirs) + sr + '</a>';
    $('#bizQuick').innerHTML = q;
    var c = [];
    // 1 contact
    c.push('<article class="card"><h3>' + esc(z.phoneT) + '</h3><p class="big"><a href="' + esc(tel) + '">' + esc(B.phoneDisplay) + '</a></p><p class="muted">' + esc(z.phoneP) + '</p>' +
      (B.email ? '<p><strong>' + esc(z.emailT) + ':</strong> <a href="mailto:' + esc(B.email) + '">' + esc(B.email) + '</a></p>' : '') + '</article>');
    // 2 location
    var street = pick(B, 'streetAddress');
    c.push('<article class="card"><h3>' + esc(z.whereT) + '</h3><p><strong>' + esc(pick(B, 'city')) + '</strong></p>' + (street ? '<p>' + esc(street) + '</p>' : '') + '<p>' + esc(pick(B, 'landmarks')) + '</p>' +
      (B.plusCode ? '<p class="muted">' + esc(z.code) + ': ' + esc(B.plusCode) + '</p>' : '') +
      (B.mapsUrl ? '<div class="actions"><a class="btn btn-outline btn-sm" href="' + esc(B.mapsUrl) + '"' + ext + '>' + esc(z.dirs) + sr + '</a></div>' : '') + '</article>');
    // 3 hours (never guessed)
    var hl = Array.isArray(B.hoursList) && B.hoursList.length ? B.hoursList : null, ht = pick(B, 'hours'), hh;
    if (hl) hh = '<dl class="hours">' + hl.map(function (r) { return '<dt>' + esc(pick(r, 'days')) + '</dt><dd>' + esc(r.time) + '</dd>'; }).join('') + '</dl>';
    else if (ht) hh = '<p>' + esc(ht) + '</p>';
    else hh = '<p class="muted" id="hoursText">' + esc(z.hoursNone) + '</p>';
    c.push('<article class="card"><h3>' + esc(z.hoursT) + '</h3>' + hh + '</article>');
    // 4 categories (from the live catalog)
    var cl = cats.map(function (k) { var n = items.filter(function (i) { return i.category === k.id; }).length; return n ? '<li><button type="button" class="chip-btn" data-cat="' + esc(k.id) + '">' + esc(pick(k, 'label')) + ' <span>' + n + '</span></button></li>' : ''; }).join('');
    c.push('<article class="card"><h3>' + esc(z.catT) + '</h3>' + (cl ? '<ul class="chips chips-btn">' + cl + '</ul>' : '') + '<div class="actions"><a class="btn btn-outline btn-sm" href="#menu">' + esc(z.seeMenu) + '</a></div></article>');
    // 5 ordering & services (only what is configured / verified)
    var sv = '<li>' + esc(z.svcWeb) + '</li>';
    if (O.pickup.enabled) sv += '<li><strong>' + esc(z.pickup) + '.</strong> ' + esc(z.pickupP) + '</li>';
    if (O.delivery.enabled) {
      var dv = '<li><strong>' + esc(z.delivery) + '.</strong> ';
      var dr = deliveryRules(), parts = [], ar = O.delivery.verified ? pick(O.delivery, 'area') : '';
      if (dr.fee != null) parts.push(z.fee + ': ' + fmt(dr.fee)); if (dr.min != null) parts.push(z.min + ': ' + fmt(dr.min)); if (ar) parts.push(z.area + ': ' + ar);
      dv += esc(parts.join(' · ') + (parts.length ? '.' : ''));
      if (dr.fee == null || !ar) dv += (parts.length ? ' ' : '') + esc(pick(O.delivery, 'note'));
      sv += dv + '</li>';
    }
    var pay = pick(B, 'payment'); if (pay) sv += '<li><strong>' + esc(z.payT) + ':</strong> ' + esc(pay) + '</li>';
    c.push('<article class="card"><h3>' + esc(z.svcT) + '</h3><ul class="svc-list">' + sv + '</ul>' + (B.woltUrl ? '<div class="actions"><a class="btn btn-outline btn-sm" href="' + esc(B.woltUrl) + '"' + ext + '>' + esc(z.wolt) + sr + '</a></div>' : '') + '</article>');
    // 6 social
    if (B.instagramUrl) c.push('<article class="card"><h3>' + esc(z.onlineT) + '</h3><p>' + esc(B.instagramHandle || '') + '</p><div class="actions"><a class="btn btn-outline btn-sm" href="' + esc(B.instagramUrl) + '"' + ext + '>' + esc(z.ig) + sr + '</a></div></article>');
    g.innerHTML = c.join('');
    // embedded map only if the owner supplied a verified embed URL
    var m = $('#bizMap');
    m.innerHTML = B.mapEmbedUrl && /^https:\/\/www\.google\.com\/maps\/embed/.test(B.mapEmbedUrl) ? '<iframe class="biz-map" title="' + esc(z.mapT) + '" src="' + esc(B.mapEmbedUrl) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>' : '';
  }
  /* privacy notice + erase saved details */
  var privDlg = $('#privDialog');
  function openPriv() { if (privDlg && !privDlg.open) privDlg.showModal(); }
  $('#privOpen').addEventListener('click', openPriv);
  $('#privClose').addEventListener('click', function () { privDlg.close(); });
  privDlg.addEventListener('click', function (e) { if (e.target === privDlg) privDlg.close(); });
  $('#privClear').addEventListener('click', function () {
    try { localStorage.removeItem('hdh_customer_v1'); localStorage.removeItem('hdh_last_order_v1'); } catch (e) {}
    co.name = co.phone = co.address = co.location = co.orderNote = ''; co.ageOk = false; co.orderId = null; co.orderSig = null; co.sent = false; co.errors = {};
    if (cartDlg.open) renderDrawer(); toast(t('erased'));
  });
  var burger = $('#burger'), nav = $('#nav');
  function closeNav() { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () { var o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', String(o)); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
  document.addEventListener('click', function (e) { if (!e.target.closest('.site-header')) closeNav(); });
  var navMap = [['top', 'top'], ['menu', 'menu'], ['si-funksionon', 'menu'], ['rreth-nesh', 'rreth-nesh'], ['kontakt', 'kontakt']], ticking = false;
  function markNav() {
    ticking = false; var cur = 'top', y = 140;
    navMap.forEach(function (m) { var el = m[0] === 'top' ? null : document.getElementById(m[0]); if (el && el.getBoundingClientRect().top <= y) cur = m[1]; });
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) cur = 'kontakt';
    $$('#nav a').forEach(function (a) { if (a.dataset.nav === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(markNav); } }, { passive: true });

  /* ---------- init ---------- */
  var status = document.createElement('p'); status.id = 'menuStatus'; status.className = 'sr-only'; status.setAttribute('role', 'status'); $('#menuTools').appendChild(status);
  bindBusiness(); applyStaticLang(); markNav(); loadCatalog();
})();
