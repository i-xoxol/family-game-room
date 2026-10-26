const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const Core=require('./logic.js');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'audio-manifest.json'),'utf8'));
test('every challenge and help route has a real prerecorded clip',()=>{
  const audio={setAttribute(){},pause(){},play(){return Promise.resolve();},currentTime:0};
  const context={window:{},document:{createElement(){return audio;},body:{appendChild(){}},documentElement:{classList:{add(){},remove(){}}}},Number};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'audio-map.js'),'utf8'),context);
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'voice.js'),'utf8'),context);
  const voice=context.window.GardenVoice,ids=new Set(manifest.clips.map(c=>c.id));
  for(const kind of Core.IDS)for(let level=0;level<3;level++)for(let seed=1;seed<=100;seed++){
    const q=Core.makeQuestion(kind,level,seed*9017);
    for(const id of [...voice.prompt(q,false),...voice.prompt(q,true),voice.help(q)])assert.ok(ids.has(id),`missing ${id}`);
  }
  for(let i=0;i<=20;i++){assert.ok(ids.has('number_'+i));assert.ok(ids.has('prompt_build_'+i));}
  for(const clip of manifest.clips){const file=path.join(__dirname,clip.file);assert.ok(fs.statSync(file).size>500,clip.id);}
});
