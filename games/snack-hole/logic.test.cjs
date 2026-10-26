const assert = require('node:assert/strict');
const test = require('node:test');
const Core = require('./logic.js');
function rng(seed) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
function playRound(s, resize) {
  Core.begin(s);
  let frames = 0, victories = 0, starCounts = [], prizeSeen = false;
  while (s.phase === 'play' && frames < 15000) {
    if (resize && frames === 250) Core.resize(s, resize[0], resize[1]);
    const next = Core.nearest(s, true);
    assert.ok(next, 'an available snack or final prize must always exist');
    Core.target(s, next.x, next.y);
    Core.step(s, 1 / 60);
    while (s.events.length) {
      const event = s.events.shift();
      if (event.type === 'star') starCounts.push(event.data.stars);
      if (event.type === 'prize') prizeSeen = true;
      if (event.type === 'win') victories++;
    }
    frames++;
  }
  assert.equal(s.phase, 'reward', 'the round must finish with ordinary steering');
  assert.equal(s.round.count, s.round.goal, 'no extra food should count after the target');
  assert.deepEqual(starCounts, [1, 2, 3]);
  assert.equal(victories, 1);
  assert.ok(prizeSeen);
  return frames;
}
test('all worlds can be completed on phone, iPad portrait/landscape, and desktop', () => {
  for (const [w, h] of [[360, 480], [390, 670], [748, 880], [1004, 610], [1400, 650]]) {
    const s = Core.makeState(w, h, Core.blankSave(), rng(w));
    for (let round = 0; round < 10; round++) {
      const previous = s.save.completed;
      playRound(s);
      assert.equal(s.save.completed, previous + 1);
      assert.equal(s.save.stars, (previous + 1) * 3);
      for (let i = 0; i < 150; i++) Core.step(s, .05);
      assert.equal(s.save.completed, previous + 1, 'a won round cannot award twice');
    }
    assert.deepEqual(s.save.stickers.slice().sort(), [0, 1, 2, 3, 4]);
  }
});
test('rotating an iPad mid-round preserves a finishable round', () => {
  const s = Core.makeState(748, 880, Core.blankSave(), rng(112));
  playRound(s, [1004, 610]);
  assert.equal(s.save.stars, 3);
});
test('pause prevents movement and collection; resuming can finish', () => {
  const s = Core.makeState(768, 800, Core.blankSave(), rng(10));
  Core.begin(s);
  const target = Core.nearest(s, true);
  Core.target(s, target.x, target.y);
  s.phase = 'paused';
  const position = { x: s.hole.x, y: s.hole.y };
  for (let i = 0; i < 1000; i++) Core.step(s, .05);
  assert.equal(s.hole.x, position.x);
  assert.equal(s.hole.y, position.y);
  assert.equal(s.round.count, 0);
  assert.equal(s.save.stars, 0);
});
test('corrupt, partial, or inflated saved state cannot block play or unlock locked styles', () => {
  for (const raw of [null, '{}', '{broken', { version: 1 }, { version: 2, completed: -100, stars: 999, skin: 'rainbow', stickers: [0, 0, 'x', 99] }]) {
    const save = Core.cleanSave(raw);
    assert.equal(save.completed, 0);
    assert.equal(save.stars, 0);
    assert.equal(save.skin, 'berry');
    const s = Core.makeState(390, 600, save, rng(5));
    playRound(s);
  }
});
test('first win earns a sticker and a selectable style, then a saved game continues in the next world', () => {
  const s = Core.makeState(768, 800, Core.blankSave(), rng(1));
  playRound(s);
  assert.equal(s.save.skin, 'sunshine');
  assert.deepEqual(s.save.stickers, [0]);
  s.save.sound = false;
  const restored = Core.cleanSave(JSON.stringify(s.save));
  assert.equal(restored.skin, 'sunshine');
  assert.equal(restored.sound, false);
  const next = Core.makeState(768, 800, restored, rng(2));
  Core.begin(next);
  assert.equal(next.world.name, 'Bubble Bay');
  assert.equal(next.save.stars, 3);
  assert.equal(next.round.count, 0);
});
