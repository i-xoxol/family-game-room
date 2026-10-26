(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SnackLogic = api;
}(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  var WORLDS = [
    { name: 'Picnic Park', icon: '✿', sticker: 'Happy Strawberry', symbol: '🍓', color: '#dcebb8', ground: '#cce2a8', edge: '#91b976', dark: '#47774f', snacks: ['berry', 'apple', 'cookie', 'orange', 'carrot'], prize: 'cookie' },
    { name: 'Bubble Bay', icon: '≈', sticker: 'Sunny Sea Star', symbol: '⭐', color: '#c8eef0', ground: '#f2dfab', edge: '#81cdd1', dark: '#3f8390', snacks: ['orange', 'berry', 'icecream', 'cookie', 'melon'], prize: 'icecream' },
    { name: 'Candy Carnival', icon: '♜', sticker: 'Party Cupcake', symbol: '🧁', color: '#f7d2df', ground: '#f0d8dd', edge: '#d49eb6', dark: '#a15b85', snacks: ['donut', 'cookie', 'berry', 'icecream', 'orange'], prize: 'cake' },
    { name: 'Moon Munch', icon: '☾', sticker: 'Little Rocket', symbol: '🚀', color: '#dad7f0', ground: '#c9c5e4', edge: '#a49fc9', dark: '#69678f', snacks: ['star', 'melon', 'donut', 'berry', 'cookie'], prize: 'star' },
    { name: 'Rainbow Garden', icon: '✦', sticker: 'Rainbow Friend', symbol: '🌈', color: '#e5eab9', ground: '#d5e5b8', edge: '#a7c79b', dark: '#5d8259', snacks: ['apple', 'carrot', 'melon', 'berry', 'orange'], prize: 'cake' }
  ];
  var SKINS = [
    { id: 'berry', name: 'Berry Sprinkle', cost: 0, icing: '#ee83ae', shade: '#c85991', sprinkles: ['#fff3ad','#93d7dd','#fff5ee'], hole: '#41304c', accent: '#ffb8d0' },
    { id: 'sunshine', name: 'Sunshine', cost: 3, icing: '#ffd66b', shade: '#e8ac3a', sprinkles: ['#fff2ca','#f8a1b8','#96c6e5'], hole: '#523d30', accent: '#ffe7a7' },
    { id: 'ocean', name: 'Bubble Blue', cost: 6, icing: '#86d4dd', shade: '#53a9ba', sprinkles: ['#fff6c1','#f2a5be','#b39fe3'], hole: '#254b62', accent: '#c3f2f1' },
    { id: 'galaxy', name: 'Galaxy Glaze', cost: 9, icing: '#a198df', shade: '#7770bc', sprinkles: ['#ffe991','#e8d9ff','#90ddd9'], hole: '#302647', accent: '#d9ccff' },
    { id: 'mint', name: 'Minty Magic', cost: 12, icing: '#a7dab0', shade: '#71b88e', sprinkles: ['#fff4b8','#efa9c4','#c3bcff'], hole: '#304b48', accent: '#d7f5d5' },
    { id: 'rainbow', name: 'Rainbow Royal', cost: 15, icing: '#f3a1bd', shade: '#ce79a5', sprinkles: ['#ffdc79','#91d7d9','#b8a1e3','#b3dc8e'], hole: '#4f3558', accent: '#ffe2b4' }
  ];
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function distance(a, b) { var x = a.x - b.x, y = a.y - b.y; return Math.sqrt(x * x + y * y); }
  function blankSave() { return { version: 2, stars: 0, completed: 0, skin: 'berry', stickers: [], sound: true }; }
  function cleanSave(raw) {
    var save = blankSave();
    try {
      var v = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!v || v.version !== 2) return save;
      save.completed = clamp(Math.floor(Number(v.completed) || 0), 0, 99999);
      save.stars = save.completed * 3;
      save.sound = v.sound !== false;
      if (Array.isArray(v.stickers)) save.stickers = v.stickers.filter(function (id, i, arr) {
        return Number.isInteger(id) && id >= 0 && id < WORLDS.length && arr.indexOf(id) === i;
      });
      for (var i = 0; i < SKINS.length; i++) {
        if (SKINS[i].id === v.skin && save.stars >= SKINS[i].cost) save.skin = v.skin;
      }
    } catch (_) { /* A damaged or unavailable browser save must never block play. */ }
    return save;
  }
  function skinFor(id) { return SKINS.filter(function (s) { return s.id === id; })[0] || SKINS[0]; }
  function makeState(width, height, save, random) {
    var s = { w: width, h: height, save: cleanSave(save), random: random || Math.random,
      phase: 'home', worldIndex: 0, world: WORLDS[0], round: null, items: [], events: [],
      hole: { x: width * .7, y: height * .58, tx: width * .7, ty: height * .58, r: 40, size: 40, vx: 0, vy: 0 },
      t: 0, idle: 0, rainbow: 0, lastGulp: -10, chain: 0, inputSeen: false, serial: 0 };
    return s;
  }
  function unit(s) { return clamp(Math.min(s.w, s.h) / 570, .72, 1.3); }
  function bounds(s) {
    var u = unit(s), top = s.w < 600 ? 145 : 105;
    return { left: 32 * u, right: s.w - 32 * u, top: Math.min(top, s.h * .3), bottom: s.h - 66 * u };
  }
  function nearest(s, includePrize) {
    var best = null, d = Infinity;
    for (var i = 0; i < s.items.length; i++) {
      var item = s.items[i];
      if (item.taken || item.fade || (item.prize && !includePrize)) continue;
      var current = distance(s.hole, item);
      if (current < d) { best = item; d = current; }
    }
    return best;
  }
  function emit(s, type, data) { s.events.push({ type: type, data: data || {} }); }
  function newItem(s, forcedType, prize) {
    var u = unit(s), b = bounds(s), r = prize ? s.hole.size * .82 : (12 + s.random() * 9) * u;
    var item = { id: ++s.serial, type: forcedType || s.world.snacks[Math.floor(s.random() * s.world.snacks.length)],
      x: 0, y: 0, r: r, angle: (s.random() - .5) * .35, seed: s.random() * 100, taken: false, prize: !!prize, born: s.t };
    var margin = r + 6 * u, bestScore = -Infinity, chosen = null;
    for (var k = 0; k < 45; k++) {
      var p = { x: b.left + margin + s.random() * Math.max(1, b.right - b.left - 2 * margin),
        y: b.top + margin + s.random() * Math.max(1, b.bottom - b.top - 2 * margin) };
      var gap = distance(s.hole, p) - s.hole.r - r;
      for (var j = 0; j < s.items.length; j++) {
        if (!s.items[j].taken) gap = Math.min(gap, distance(s.items[j], p) - s.items[j].r - r - 12 * u);
      }
      if (gap > bestScore) { bestScore = gap; chosen = p; }
      if (gap > 15 * u) break;
    }
    item.x = chosen.x; item.y = chosen.y;
    if (prize) {
      item.x = clamp(s.w * .5, b.left + r, b.right - r);
      item.y = clamp(b.top + (b.bottom - b.top) * .44, b.top + r, b.bottom - r);
    }
    s.items.push(item);
    return item;
  }
  function begin(s) {
    s.phase = 'play'; s.worldIndex = s.save.completed % WORLDS.length; s.world = WORLDS[s.worldIndex];
    s.items = []; s.events = []; s.rainbow = 0; s.idle = 0; s.chain = 0; s.lastGulp = -10; s.inputSeen = false;
    var goal = s.save.completed === 0 ? 10 : Math.min(18, 11 + Math.floor(s.save.completed * .6));
    s.round = { count: 0, goal: goal, stars: 0, prizeReady: false, rewarded: false, baseCompleted: s.save.completed };
    var u = unit(s), b = bounds(s);
    s.hole.x = s.hole.tx = s.w * .5; s.hole.y = s.hole.ty = b.top + (b.bottom - b.top) * .6;
    s.hole.r = s.hole.size = 28 * u; s.hole.vx = s.hole.vy = 0;
    for (var i = 0; i < Math.min(goal + 3, 16); i++) newItem(s);
    // A first snack stays close enough to discover with a single small gesture.
    s.items[0].x = clamp(s.hole.x + 73 * u, b.left + 25 * u, b.right - 25 * u);
    s.items[0].y = clamp(s.hole.y - 28 * u, b.top + 25 * u, b.bottom - 25 * u);
    emit(s, 'begin');
  }
  function target(s, x, y) {
    if (s.phase !== 'play') return;
    var b = bounds(s), pad = s.hole.size * .45;
    s.hole.tx = clamp(x, b.left + pad, b.right - pad);
    s.hole.ty = clamp(y, b.top + pad, b.bottom - pad);
    s.idle = 0; s.inputSeen = true;
  }
  function earnWin(s) {
    if (s.round.rewarded) return;
    s.round.rewarded = true; s.phase = 'reward';
    var beforeStars = s.save.stars;
    var newSticker = s.save.stickers.indexOf(s.worldIndex) < 0;
    if (newSticker) s.save.stickers.push(s.worldIndex);
    s.save.completed++; s.save.stars = s.save.completed * 3;
    var unlocked = SKINS.filter(function (skin) { return skin.cost > beforeStars && skin.cost <= s.save.stars; });
    if (unlocked.length) s.save.skin = unlocked[unlocked.length - 1].id;
    emit(s, 'win', { newSticker: newSticker, skin: unlocked.length ? unlocked[0] : null, world: s.worldIndex });
  }
  function gulp(s, item) {
    if (s.phase !== 'play' || item.taken || s.round.rewarded) return false;
    item.taken = true;
    emit(s, 'gulp', { item: item, x: item.x, y: item.y, radius: s.hole.r, prize: item.prize });
    if (item.prize) { earnWin(s); return true; }
    var r = s.round;
    r.count++;
    s.chain = s.t - s.lastGulp < 2.7 ? s.chain + 1 : 1;
    s.lastGulp = s.t;
    var nextStars = r.count >= r.goal ? 3 : r.count >= Math.ceil(r.goal * .65) ? 2 : r.count >= Math.ceil(r.goal * .3) ? 1 : 0;
    if (nextStars > r.stars) {
      r.stars = nextStars;
      emit(s, 'star', { stars: nextStars });
    }
    s.hole.size = (28 + Math.min(1, r.count / r.goal) * 31) * unit(s);
    if (r.count === Math.ceil(r.goal * .5)) {
      s.rainbow = 7;
      emit(s, 'rainbow');
    }
    if (r.count >= r.goal && !r.prizeReady) {
      r.prizeReady = true;
      s.items.forEach(function (other) { if (!other.taken) other.fade = true; });
      var prize = newItem(s, s.world.prize, true);
      emit(s, 'prize', { item: prize });
    }
    return true;
  }
  function step(s, dt) {
    dt = clamp(dt, 0, .05);
    s.t += dt;
    if (s.phase !== 'play') return;
    s.idle += dt; s.rainbow = Math.max(0, s.rainbow - dt);
    var h = s.hole, dx = h.tx - h.x, dy = h.ty - h.y, d = Math.sqrt(dx * dx + dy * dy);
    var speed = (s.rainbow > 0 ? 450 : 365) * unit(s);
    var move = Math.min(d, speed * dt, d * (1 - Math.exp(-12 * dt)));
    h.vx = d > .1 ? dx / d * move / Math.max(dt, .001) : 0;
    h.vy = d > .1 ? dy / d * move / Math.max(dt, .001) : 0;
    if (d > .1) { h.x += dx / d * move; h.y += dy / d * move; }
    h.r += (h.size - h.r) * (1 - Math.exp(-8 * dt));
    for (var i = 0; i < s.items.length; i++) {
      var item = s.items[i];
      if (item.taken || item.fade) continue;
      var dist = distance(h, item), capture = h.r * .88;
      var pull = h.r * (s.rainbow > 0 ? 2.8 : 1.62) + item.r * .35;
      if (dist < pull && dist > 1) {
        var force = (1 - dist / pull) * (s.rainbow > 0 ? 260 : 170) * unit(s) * dt;
        item.x += (h.x - item.x) / dist * force;
        item.y += (h.y - item.y) / dist * force;
      }
      if (dist < capture && item.r < h.r * 1.03 && (!item.prize || (h.r > h.size * .95 && s.t - item.born > 1))) {
        gulp(s, item);
        if (s.phase !== 'play') break;
      }
    }
    if (!s.round.prizeReady) {
      var alive = s.items.filter(function (item) { return !item.taken && !item.fade; }).length;
      if (alive < Math.min(8, s.round.goal - s.round.count + 2)) newItem(s);
    }
  }
  function resize(s, width, height) {
    var rx = width / s.w, ry = height / s.h;
    s.w = width; s.h = height;
    var b = bounds(s), u = unit(s);
    s.hole.x = s.hole.tx = clamp(s.hole.x * rx, b.left + 25 * u, b.right - 25 * u);
    s.hole.y = s.hole.ty = clamp(s.hole.y * ry, b.top + 25 * u, b.bottom - 25 * u);
    s.hole.r = s.hole.size = (s.round ? 28 + Math.min(1, s.round.count / s.round.goal) * 31 : 40) * u;
    s.items.forEach(function (item) {
      item.x = clamp(item.x * rx, b.left + item.r, b.right - item.r);
      item.y = clamp(item.y * ry, b.top + item.r, b.bottom - item.r);
      if (item.prize) item.r = s.hole.size * .82;
      else item.r = clamp(item.r, 12 * u, 21 * u);
    });
  }
  return { WORLDS: WORLDS, SKINS: SKINS, clamp: clamp, distance: distance,
    blankSave: blankSave, cleanSave: cleanSave, skinFor: skinFor,
    makeState: makeState, begin: begin, target: target, step: step,
    resize: resize, nearest: nearest, bounds: bounds, unit: unit };
}));
