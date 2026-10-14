/* Original flat illustrations generated from each item's ingredients.
 * These are ILLUSTRATIONS, not photos of the restaurant's food. When real photos exist, set "image" on the item in data.js. */
(function () {
  'use strict';
  function seed(str) { var h = 1779033703 ^ str.length; for (var i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return function () { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; }
  function f(n) { return Math.round(n * 10) / 10; }

  /* ---------- pizza ---------- */
  var TOP = {
    ham: function (x, y, r) { return '<path transform="translate(' + x + ' ' + y + ') rotate(' + r + ')" d="M-9 -5 Q0 -10 9 -5 Q12 2 6 6 Q-4 9 -9 3Z" fill="#E98C86" stroke="#D26E69" stroke-width="1"/>'; },
    salami: function (x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="7.5" fill="#B22A1C"/><circle cx="' + (x - 2) + '" cy="' + (y - 2) + '" r="1.4" fill="#E9A59A"/><circle cx="' + (x + 2.5) + '" cy="' + (y + 2) + '" r="1.2" fill="#E9A59A"/>'; },
    spicy: function (x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="7.5" fill="#8E1B12"/><circle cx="' + (x - 2) + '" cy="' + (y - 1) + '" r="1.5" fill="#D9694F"/><circle cx="' + (x + 2) + '" cy="' + (y + 2.5) + '" r="1.2" fill="#D9694F"/>'; },
    mushroom: function (x, y, r) { return '<g transform="translate(' + x + ' ' + y + ') rotate(' + r + ')"><path d="M-8 3 Q-8 -8 0 -8 Q8 -8 8 3Z" fill="#DCC7A1" stroke="#B89E74" stroke-width="1"/><rect x="-3" y="3" width="6" height="6" rx="2" fill="#E9DABB" stroke="#B89E74" stroke-width="1"/></g>'; },
    olive: function (x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="4.6" fill="#3A3328"/><circle cx="' + x + '" cy="' + y + '" r="1.7" fill="#F4D98C"/>'; },
    arugula: function (x, y, r) { return '<ellipse transform="translate(' + x + ' ' + y + ') rotate(' + r + ')" rx="9" ry="3.6" fill="#4F8A35"/><path transform="translate(' + x + ' ' + y + ') rotate(' + r + ')" d="M-8 0H8" stroke="#BBD98E" stroke-width="1"/>'; },
    tomato: function (x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="6" fill="#D93E27" stroke="#A92816" stroke-width="1"/><circle cx="' + (x - 1.8) + '" cy="' + (y - 1.8) + '" r="1.6" fill="#F4968A"/>'; },
    tuna: function (x, y, r) { return '<ellipse transform="translate(' + x + ' ' + y + ') rotate(' + r + ')" rx="7" ry="4" fill="#DDB898" stroke="#BE9570" stroke-width="1"/>'; },
    pepper: function (x, y, r) { return '<rect transform="translate(' + x + ' ' + y + ') rotate(' + r + ')" x="-9" y="-2.4" width="18" height="4.8" rx="2.4" fill="#4E9A3A"/>'; },
    cheese: function (x, y, r) { return '<path transform="translate(' + x + ' ' + y + ') rotate(' + r + ')" d="M-8 -3 Q-2 -9 7 -4 Q11 3 3 7 Q-6 8 -8 -3Z" fill="#F8F4E6" stroke="#CFC8B0" stroke-width="1"/><circle cx="' + (x - 2) + '" cy="' + (y + 1) + '" r="1.2" fill="#8FA6BD"/><circle cx="' + (x + 3) + '" cy="' + (y - 1) + '" r="1" fill="#8FA6BD"/>'; },
    burrata: function (x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="15" fill="#FFFDF5" stroke="#E2DAC3" stroke-width="1.5"/><circle cx="' + (x - 4) + '" cy="' + (y - 4) + '" r="4" fill="#fff"/>'; },
    anchovy: function (x, y, r) { return '<rect transform="translate(' + x + ' ' + y + ') rotate(' + r + ')" x="-9" y="-1.8" width="18" height="3.6" rx="1.8" fill="#8A4B2B"/>'; },
    caper: function (x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="2.4" fill="#6E8B3A"/>'; },
    corn: function (x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="2.8" fill="#F2C63A"/>'; },
    bresaola: function (x, y, r) { return '<path transform="translate(' + x + ' ' + y + ') rotate(' + r + ')" d="M-10 -3 Q0 -8 10 -3 Q11 4 0 6 Q-9 5 -10 -3Z" fill="#8C2F33" stroke="#6D2024" stroke-width="1"/>'; },
    pancetta: function (x, y, r) { return '<g transform="translate(' + x + ' ' + y + ') rotate(' + r + ')"><rect x="-8" y="-3" width="16" height="6" rx="1.5" fill="#EFB1A6"/><path d="M-8 0H8" stroke="#fff" stroke-width="1.6"/></g>'; },
    onion: function (x, y, r) { return '<path transform="translate(' + x + ' ' + y + ') rotate(' + r + ')" d="M-8 0 A8 5 0 0 1 8 0" fill="none" stroke="#EEE3EE" stroke-width="2.2" stroke-linecap="round"/>'; }
  };
  var COUNT = { ham: 6, salami: 7, spicy: 7, mushroom: 6, olive: 7, arugula: 9, tomato: 6, tuna: 6, pepper: 6, cheese: 4, burrata: 1, anchovy: 5, caper: 8, corn: 14, bresaola: 5, pancetta: 6, onion: 6 };

  function pizzaKinds(d) {
    var k = [], has = function () { for (var i = 0; i < arguments.length; i++) if (d.indexOf(arguments[i]) > -1) return true; return false; };
    if (has('spicy salami')) k.push('spicy'); else if (has('salami', 'milanese sausage', 'sausage')) k.push('salami');
    if (has('prosciutto')) k.push('ham'); else if (has(' ham', 'ham,', 'ham ') || /^ham|, ham/.test(d)) k.push('ham');
    if (has('mushroom')) k.push('mushroom'); if (has('olive')) k.push('olive'); if (has('arugula')) k.push('arugula');
    if (has('pomodorini', 'tomato')) k.push('tomato'); if (has('tuna')) k.push('tuna'); if (has('pepper')) k.push('pepper');
    if (has('gorgonzola', 'grana')) k.push('cheese'); if (has('burrata')) k.push('burrata'); if (has('anchov')) k.push('anchovy');
    if (has('caper')) k.push('caper'); if (has('corn')) k.push('corn'); if (has('bresaola')) k.push('bresaola');
    if (has('pancetta')) k.push('pancetta'); if (has('onion')) k.push('onion');
    return k.length ? k : ['tomato', 'arugula'];
  }
  function pizza(id, desc, calzone) {
    var rnd = seed(id), kinds = pizzaKinds((desc || '').toLowerCase()), list = [];
    kinds.forEach(function (kd) { for (var i = 0; i < COUNT[kd]; i++) list.push(kd); });
    // shuffle
    for (var i = list.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var tmp = list[i]; list[i] = list[j]; list[j] = tmp; }
    var out = '<svg viewBox="0 0 200 200" role="img" aria-hidden="true" focusable="false">';
    if (calzone) {
      out += '<path d="M18 128 A82 82 0 0 1 182 128 Z" fill="#D99A45"/><path d="M18 128 A82 82 0 0 1 182 128 Z" fill="none" stroke="#B8782A" stroke-width="4"/>';
      for (var c = 0; c < 15; c++) { var cx = 24 + c * 11.4; out += '<circle cx="' + f(cx) + '" cy="128" r="4.6" fill="#E8B160" stroke="#B8782A" stroke-width="1.5"/>'; }
      out += '<path d="M40 112 A62 62 0 0 1 160 112" fill="none" stroke="#F0C27A" stroke-width="5" stroke-linecap="round" opacity=".7"/><circle cx="82" cy="92" r="7" fill="#C9361F" opacity=".75"/><circle cx="118" cy="98" r="6" fill="#F4D98C" opacity=".9"/>';
      return out + '</svg>';
    }
    out += '<circle cx="100" cy="100" r="96" fill="#D99A45"/><circle cx="100" cy="100" r="90" fill="none" stroke="#C0802F" stroke-width="3"/>' +
      '<circle cx="100" cy="100" r="82" fill="#C9361F"/><circle cx="100" cy="100" r="77" fill="#F4D98C"/>' +
      '<circle cx="70" cy="64" r="16" fill="#FBEBB5" opacity=".75"/><circle cx="136" cy="132" r="19" fill="#FBEBB5" opacity=".7"/><circle cx="142" cy="70" r="9" fill="#E2A64F" opacity=".45"/><circle cx="62" cy="136" r="10" fill="#E2A64F" opacity=".4"/>';
    var n = list.length, burrata = false;
    for (var p = 0; p < n; p++) {
      var kd = list[p];
      var ang = p * 2.39996 + rnd() * 0.5, rad = 14 + Math.sqrt((p + 0.5) / n) * 54 + rnd() * 5;
      var x = f(100 + Math.cos(ang) * rad), y = f(100 + Math.sin(ang) * rad), rot = Math.round(rnd() * 180);
      if (kd === 'burrata') { x = 100; y = 100; }
      out += TOP[kd](x, y, rot);
    }
    return out + '</svg>';
  }

  /* ---------- sandwich ---------- */
  var LAYER = {
    lettuce: function (y) { return '<path d="M26 ' + y + ' q9 -9 18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 v9 h-144z" fill="#6FA83F"/>'; },
    tomato: function (y) { var s = ''; for (var i = 0; i < 6; i++) s += '<ellipse cx="' + (38 + i * 25) + '" cy="' + (y + 4) + '" rx="12" ry="5.5" fill="#D93E27"/>'; return s; },
    cucumber: function (y) { var s = ''; for (var i = 0; i < 7; i++) s += '<ellipse cx="' + (34 + i * 22) + '" cy="' + (y + 4) + '" rx="10" ry="4.5" fill="#A9CF7B" stroke="#6FA83F" stroke-width="1.2"/>'; return s; },
    mozzarella: function (y) { return '<rect x="26" y="' + y + '" width="148" height="8" rx="4" fill="#FBF6E6" stroke="#E2DAC3"/>'; },
    cheese: function (y) { return '<path d="M26 ' + y + ' h148 l-10 9 l-18 -4 l-24 6 l-30 -6 l-30 5 l-18 -5z" fill="#F2C94C"/>'; },
    meat: function (y) { return '<rect x="22" y="' + y + '" width="156" height="10" rx="5" fill="#E98C86" stroke="#D26E69"/>'; },
    salami: function (y) { var s = ''; for (var i = 0; i < 6; i++) s += '<circle cx="' + (38 + i * 25) + '" cy="' + (y + 5) + '" r="8" fill="#B22A1C"/>'; return s; },
    tuna: function (y) { return '<rect x="26" y="' + y + '" width="148" height="11" rx="5.5" fill="#DDB898"/>'; },
    olive: function (y) { var s = ''; for (var i = 0; i < 8; i++) s += '<circle cx="' + (34 + i * 19) + '" cy="' + (y + 4) + '" r="4.2" fill="#3A3328"/>'; return s; },
    onion: function (y) { return '<rect x="30" y="' + y + '" width="140" height="5" rx="2.5" fill="#EEE3EE"/>'; },
    mushroom: function (y) { var s = ''; for (var i = 0; i < 6; i++) s += '<ellipse cx="' + (38 + i * 25) + '" cy="' + (y + 4) + '" rx="10" ry="5" fill="#DCC7A1"/>'; return s; },
    pesto: function (y) { return '<rect x="26" y="' + y + '" width="148" height="6" rx="3" fill="#5E8B3A"/>'; }
  };
  function sandwichKinds(d) {
    var k = [], has = function () { for (var i = 0; i < arguments.length; i++) if (d.indexOf(arguments[i]) > -1) return true; return false; };
    if (has('salad', 'arugula')) k.push('lettuce'); if (has('pesto')) k.push('pesto'); if (has('mozzarella')) k.push('mozzarella');
    if (has('gorgonzola', 'white cheese', 'grana', 'parmigiano')) k.push('cheese');
    if (has('salami', 'sausage')) k.push('salami'); if (has('ham', 'prosciutto', 'bresaola', 'pancetta')) k.push('meat');
    if (has('tuna', 'sardines')) k.push('tuna'); if (has('mushroom')) k.push('mushroom'); if (has('onion')) k.push('onion');
    if (has('olive')) k.push('olive'); if (has('cucumber')) k.push('cucumber'); if (has('tomato', 'pomodorini')) k.push('tomato');
    return k.length ? k.slice(0, 5) : ['lettuce', 'tomato', 'meat'];
  }
  function sandwich(desc) {
    var kinds = sandwichKinds((desc || '').toLowerCase()), y = 64, out = '<svg viewBox="0 0 200 150" role="img" aria-hidden="true" focusable="false">';
    out += '<path d="M14 66 Q14 14 100 14 Q186 14 186 66Z" fill="#D99A45" stroke="#B8782A" stroke-width="3"/><path d="M42 46 Q60 26 92 26" fill="none" stroke="#F0C27A" stroke-width="5" stroke-linecap="round"/>' +
      '<circle cx="118" cy="30" r="1.8" fill="#F6E2B0"/><circle cx="140" cy="40" r="1.8" fill="#F6E2B0"/><circle cx="104" cy="44" r="1.8" fill="#F6E2B0"/>';
    kinds.forEach(function (k) { out += LAYER[k](y); y += k === 'tomato' || k === 'cucumber' || k === 'mushroom' ? 10 : k === 'meat' || k === 'tuna' ? 12 : 9; });
    out += '<path d="M14 ' + (y + 2) + ' H186 V' + (y + 22) + ' Q186 ' + (y + 34) + ' 172 ' + (y + 34) + ' H28 Q14 ' + (y + 34) + ' 14 ' + (y + 22)+ 'Z" fill="#D99A45" stroke="#B8782A" stroke-width="3"/>';
    return out.replace('viewBox="0 0 200 150"', 'viewBox="0 0 200 ' + Math.max(150, y + 40) + '"') + '</svg>';
  }

  /* ---------- drinks ---------- */
  function drinkColor(n) {
    n = n.toLowerCase();
    var map = [['coca', '#3B2218'], ['pepsi', '#2B3A67'], ['orange', '#F08A1C'], ['portokall', '#F08A1C'], ['exotic', '#F2A31C'], ['lemon', '#E8C93A'], ['limon', '#E8C93A'], ['lipton', '#E8C93A'], ['kajsi', '#F2A65A'], ['apricot', '#F2A65A'], ['peach', '#F2A65A'], ['pjesh', '#F2A65A'], ['apple', '#8DB84A'], ['moll', '#8DB84A'], ['strawberry', '#D94467'], ['luleshtr', '#D94467'], ['grape', '#7B4A9E'], ['rrush', '#7B4A9E'], ['tonic', '#9FD0E6'], ['water', '#9FD0E6'], ['uj', '#9FD0E6'], ['dhall', '#F2EDE0']];
    for (var i = 0; i < map.length; i++) if (n.indexOf(map[i][0]) > -1) return map[i][1];
    return '#C9361F';
  }
  function drink(it) {
    var n = it.name_en + ' ' + it.name_sq, col = drinkColor(n);
    if (/energy|red bull/i.test(n)) return '<svg viewBox="0 0 120 160" role="img" aria-hidden="true" focusable="false"><rect x="34" y="14" width="52" height="132" rx="10" fill="#C9D2DC" stroke="#8D98A5" stroke-width="3"/><rect x="34" y="52" width="52" height="64" fill="#2D5FA8"/><path d="M44 74 l12 14 l-12 14 M64 74 l12 14 l-12 14" stroke="#F2C63A" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="42" y="8" width="36" height="10" rx="4" fill="#8D98A5"/></svg>';
    return '<svg viewBox="0 0 120 160" role="img" aria-hidden="true" focusable="false"><rect x="50" y="6" width="20" height="12" rx="3" fill="#3A3328"/><path d="M52 18 H68 V44 Q68 52 82 62 Q90 70 90 84 V140 Q90 152 78 152 H42 Q30 152 30 140 V84 Q30 70 38 62 Q52 52 52 44Z" fill="' + col + '" stroke="#3A3328" stroke-width="3" stroke-linejoin="round"/><rect x="30" y="86" width="60" height="38" fill="#FFFBF3" opacity=".92"/><circle cx="60" cy="105" r="9" fill="' + col + '"/><path d="M42 62 Q38 80 38 100" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45" fill="none"/></svg>';
  }
  function beer() {
    return '<svg viewBox="0 0 120 160" role="img" aria-hidden="true" focusable="false"><path d="M28 36 H84 L80 138 Q80 148 70 148 H42 Q32 148 32 138Z" fill="#E5A126" stroke="#3A3328" stroke-width="3" stroke-linejoin="round"/><path d="M84 54 H98 Q106 54 106 64 V100 Q106 110 96 110 H82" fill="none" stroke="#3A3328" stroke-width="3"/><path d="M26 38 Q22 18 40 22 Q46 8 62 16 Q76 8 82 22 Q98 20 86 38Z" fill="#FFF7E0" stroke="#3A3328" stroke-width="3" stroke-linejoin="round"/><path d="M42 58 V126 M56 58 V126 M70 58 V126" stroke="#F8C95A" stroke-width="4" stroke-linecap="round" opacity=".7"/><circle cx="46" cy="98" r="2" fill="#FFF1C2"/><circle cx="62" cy="80" r="2.4" fill="#FFF1C2"/><circle cx="72" cy="112" r="1.8" fill="#FFF1C2"/></svg>';
  }

  window.HDHArt = {
    forItem: function (it) {
      if (it.category === 'pizza') return pizza(it.id, it.desc_en, /calzone/i.test(it.name_en));
      if (it.category === 'sandwich') return sandwich(it.desc_en);
      if (it.category === 'beer') return beer();
      return drink(it);
    },
    hero: function () { return pizza('hero-house', 'ham, mushrooms, olives, arugula, pomodorini, grana'); },
    category: function (id) {
      var map = { pizza: pizza('cat-pizza', 'salami, olives, tomato, pepper'), sandwich: sandwich('mozzarella, ham, salad, tomato, cucumber'), soft_drink: drink({ name_en: 'Fanta Orange', name_sq: '' }), beer: beer() };
      return map[id] || map.pizza;
    }
  };
})();
