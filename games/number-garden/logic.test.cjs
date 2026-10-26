const test=require('node:test');
const assert=require('node:assert/strict');
const Core=require('./logic.js');
function solve(s){if(s.q.format==='build')Core.build(s,Number(s.q.answer));return Core.answer(s,s.q.answer);}
function round(save,mode,seed){const s=Core.start(save,mode,Core.seeded(seed));for(let i=0;i<5;i++){assert.equal(s.phase,'question');solve(s);if(i<4)assert.equal(Core.next(s),true);}return s;}

test('1800 generated challenges have one valid answer and stay within kindergarten ranges',()=>{
  for(const kind of Core.IDS)for(let level=0;level<3;level++)for(let seed=1;seed<=100;seed++){
    const q=Core.makeQuestion(kind,level,seed*9017);
    assert.equal(q.choices.filter(c=>c.id===q.answer).length,1);
    assert.equal(new Set(q.choices.map(c=>c.id)).size,q.choices.length);
    if(kind==='count'){assert.ok(q.n>=0&&q.n<=[5,10,20][level]);assert.equal(q.answer,String(q.n));if(q.format==='build')assert.ok(q.frameSize>=q.n);}
    if(kind==='add'){assert.equal(Number(q.answer),q.a+q.b);assert.ok(q.a>=0&&q.b>=0&&q.a+q.b<=[5,8,10][level]);}
    if(kind==='subtract'){assert.equal(Number(q.answer),q.a-q.b);assert.ok(q.a>=q.b&&q.b>=0&&q.a<=[5,8,10][level]);}
    if(kind==='compare'){const expected=q.a===q.b?'same':q.ask==='more'?(q.a>q.b?'left':'right'):(q.a<q.b?'left':'right');assert.equal(q.answer,expected);assert.ok(q.a<=10&&q.b<=10);}
    if(kind==='pattern'){
      const offsets=q.rule.map((_,i)=>i).filter(offset=>q.sequence.every((value,i)=>value===q.rule[(i+offset)%q.rule.length]));
      assert.ok(offsets.length);assert.equal(q.answer,q.rule[(5+offsets[0])%q.rule.length]);
    }
    if(kind==='shape'){assert.ok(Core.SHAPES[q.answer]);assert.ok(q.title.includes(Core.SHAPES[q.answer].name));if(q.answer==='rectangle')assert.ok(q.title.includes('long rectangle'));}
    for(const option of q.choices)if('number'in option)assert.ok(option.number>=0&&option.number<=20);
    assert.deepEqual(Core.makeQuestion(kind,level,q.seed),q,'the same saved seed must reproduce exactly the same question');
  }
});
test('wrong answers and repeated taps never grow seeds or award a flower',()=>{
  const s=Core.start(Core.blankSave(),'add',Core.seeded(18));const wrong=s.q.choices.find(c=>c.id!==s.q.answer).id;
  assert.equal(Core.answer(s,wrong).status,'try');assert.equal(s.save.answers,0);assert.equal(s.save.active.index,0);assert.equal(s.save.rounds,0);
  assert.equal(Core.answer(s,wrong).status,'ignored');assert.equal(s.save.active.attempts,1);
  assert.equal(solve(s).status,'correct');assert.equal(s.save.active.index,1);assert.equal(s.save.skills.add.independent,0);
  assert.equal(Core.answer(s,s.q.answer).status,'ignored');assert.equal(s.save.answers,1);
});
test('five solved challenges award one flower and the first new friend exactly once',()=>{
  const s=round(Core.blankSave(),'mix',37);
  assert.equal(s.phase,'complete');assert.equal(s.save.rounds,1);assert.equal(s.save.answers,5);assert.equal(s.save.active,null);
  assert.equal(s.reward.friend.id,'bunny');assert.equal(s.save.friend,'bunny');
  assert.equal(Core.answer(s,s.q.answer).status,'ignored');assert.equal(Core.next(s),false);assert.equal(s.save.rounds,1);
});
test('all six activities appear over the first two mixed adventures',()=>{
  let s=Core.start(Core.blankSave(),'mix',Core.seeded(7));const first=s.save.active.queue.slice();assert.equal(first[0],'count');
  for(let i=0;i<5;i++){solve(s);if(i<4)Core.next(s);}
  s=Core.start(s.save,'mix',Core.seeded(9));assert.equal(new Set(first.concat(s.save.active.queue)).size,6);
});
test('independent success increases difficulty, supported practice does not',()=>{
  const s=Core.start(Core.blankSave(),'add',Core.seeded(1));
  for(let i=0;i<3;i++){assert.equal(s.q.level,0);solve(s);Core.next(s);}
  assert.equal(s.save.skills.add.level,1);assert.equal(s.q.level,1);
  Core.hint(s);solve(s);Core.next(s);Core.hint(s);solve(s);
  assert.equal(s.save.skills.add.level,0);assert.equal(s.save.skills.add.independent,3);
});
test('refresh resumes the next unsolved question and keeps earned seeds',()=>{
  const s=Core.start(Core.blankSave(),'mix',Core.seeded(35));solve(s);Core.next(s);solve(s);Core.next(s);
  const restored=Core.start(JSON.stringify(s.save),'mix',Core.seeded(999));
  assert.equal(restored.save.active.index,2);assert.equal(restored.save.answers,2);assert.equal(restored.q.fingerprint,s.q.fingerprint);assert.deepEqual(restored.q.choices,s.q.choices);
});
test('build-a-number uses actual chosen slots and remembers them across reload',()=>{
  let seed=1,q;do{q=Core.makeQuestion('count',0,seed++);}while(q.format!=='build');
  const save=Core.blankSave();save.active={mode:'count',queue:['count','count','count','count','count'],index:0,seed:q.seed,level:0,attempts:0,hint:false,rejected:[],touched:[],builder:0,filled:[]};
  let s=Core.start(save,'count',Core.seeded(2));assert.equal(Core.toggleSlot(s,7),true);assert.equal(Core.toggleSlot(s,2),true);assert.equal(s.save.active.builder,2);assert.deepEqual(s.save.active.filled,[7,2]);
  s=Core.start(JSON.stringify(s.save),'mix',Core.seeded(3));assert.equal(s.save.active.builder,2);assert.deepEqual(s.save.active.filled,[7,2]);
  Core.toggleSlot(s,7);assert.equal(s.save.active.builder,1);assert.equal(Core.toggleSlot(s,22),false);
  Core.build(s,Number(s.q.answer));assert.equal(Core.answer(s,'unused').status,'correct');
});
test('touch-counting never counts one object twice',()=>{
  let s=Core.start(Core.blankSave(),'add',Core.seeded(4));assert.equal(Core.touch(s,0),1);assert.equal(Core.touch(s,0),null);assert.equal(Core.touch(s,-1),null);assert.equal(Core.touch(s,999),null);assert.equal(Core.touch(s,1),2);
  s=Core.start(JSON.stringify(s.save),'mix',Core.seeded(5));assert.deepEqual(s.save.active.touched,[0,1]);assert.equal(Core.touch(s,0),null);
});
test('changing an activity keeps earned seeds instead of discarding the round',()=>{
  let s=Core.start(Core.blankSave(),'count',Core.seeded(6));solve(s);Core.next(s);solve(s);Core.next(s);
  s=Core.start(s.save,'shape',Core.seeded(8));assert.equal(s.save.active.index,2);assert.equal(s.q.kind,'shape');assert.equal(s.save.answers,2);assert.deepEqual(s.save.active.queue.slice(2),['shape','shape','shape']);
});
test('damaged or excessive browser saves cannot prevent a new adventure',()=>{
  for(const input of ['{broken','{}',null,{version:1,rounds:-2,friend:'not-real',active:{index:999,queue:['bad']},skills:{count:{level:999,streak:999}}}]){
    const save=Core.cleanSave(input);assert.ok(save.rounds>=0);assert.ok(Core.FRIENDS.some(f=>f.id===save.friend));assert.equal(save.active,null);
    const s=round(save,'mix',17);assert.equal(s.phase,'complete');
  }
});
