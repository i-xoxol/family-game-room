import test from 'node:test';
import assert from 'node:assert/strict';
import {BlendGesture} from '../public/blend.mjs';
import {AudioBank} from '../public/audio.mjs';

test('a tap anywhere on the slider previews a sound and never completes a word',()=>{
  for(const fraction of [0,.1,.5,.99,1]){
    const gesture=new BlendGesture(3),preview=gesture.begin(fraction);
    assert.equal(preview.sounds.length,1);assert.equal(gesture.end().complete,false);
  }
});
test('a fast full drag includes every sound once; moving backwards cannot replay or skip sounds',()=>{
  const gesture=new BlendGesture(3);assert.deepEqual(gesture.begin(0).sounds,[0]);
  assert.deepEqual(gesture.move(.98).sounds,[1,2]);assert.deepEqual(gesture.move(.3).sounds,[]);
  assert.deepEqual(gesture.move(1).sounds,[]);assert.equal(gesture.end().complete,true);assert.equal(gesture.end().complete,false);
});
test('partial, right-to-left and cancelled drags cannot trigger the word',()=>{
  const gesture=new BlendGesture(3);gesture.begin(.1);gesture.move(.65);assert.equal(gesture.end().complete,false);
  gesture.begin(.99);gesture.move(0);assert.equal(gesture.end().complete,false);
  gesture.begin(0);gesture.move(1);gesture.cancel();assert.equal(gesture.end().complete,false);
});

globalThis.location={href:'http://reading.test/'};
globalThis.cancelAnimationFrame=()=>{};globalThis.requestAnimationFrame=()=>1;
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function until(predicate){for(let i=0;i<100;i++){if(predicate())return;await tick();}throw Error('audio did not reach the expected state');}
class FakeContext {
  state='running';currentTime=0;destination={};sources=[];active=0;maxActive=0;
  decodeAudioData(data,resolve){resolve({id:new Uint8Array(data)[0],duration:.2,length:100,numberOfChannels:1});}
  createBufferSource(){
    const context=this,source={connect(){},disconnect(){},stopped:false,
      start(){context.active++;context.maxActive=Math.max(context.active,context.maxActive);context.sources.push(source);},
      stop(){if(!source.stopped){source.stopped=true;context.active--; }},
      end(){if(!source.stopped){source.stopped=true;context.active--;context.currentTime+=.2;source.onended?.();}}
    };return source;
  }
}
function bankFixture(fetchAudio){
  const context=new FakeContext(),audio={setAttribute(){},pause(){},currentTime:0};
  const clips=Object.fromEntries(['sound-m','sound-a','sound-t','word-mat'].map((id,i)=>[id,{file:`${i+1}.wav`,marks:[]}]));
  const bank=new AudioBank({clips},{audioElement:audio,contextFactory:()=>context,fetchAudio:fetchAudio||((url)=>Promise.resolve(new Response(new Uint8Array([Number(url.pathname.match(/\d+/)[0])]))))});
  return {bank,context};
}
test('a queued fast blend plays every sound and the word in order without overlap',async()=>{
  const {bank,context}=bankFixture(),seen=[];
  const done=bank.sequence(['sound-m','sound-a','sound-t','word-mat'],i=>seen.push(i));
  for(let i=0;i<4;i++){await until(()=>context.sources.length===i+1);assert.equal(context.sources[i].buffer.id,i+1);context.sources[i].end();}
  assert.equal(await done,true);assert.deepEqual(seen,[0,1,2,3]);assert.equal(context.maxActive,1);bank.stop();
});
test('a drag can pause between sounds while retaining its queue',async()=>{
  const {bank,context}=bankFixture(),queue=bank.queue();queue.append('sound-m',0);
  await until(()=>context.sources.length===1);context.sources[0].end();await tick();
  assert.equal(queue.append('sound-a',1),true);const done=queue.close();await until(()=>context.sources.length===2);context.sources[1].end();assert.equal(await done,true);bank.stop();
});
test('a new tap cancels the entire previous blend, including its queued word',async()=>{
  const {bank,context}=bankFixture();const blend=bank.sequence(['sound-m','sound-a','word-mat']);await until(()=>context.sources.length===1);
  const preview=bank.play('sound-t');await until(()=>context.sources.length===2);assert.equal(context.sources[0].stopped,true);context.sources[1].end();
  assert.equal(await blend,false);assert.equal(await preview,true);await tick();assert.deepEqual(context.sources.map(source=>source.buffer.id),[1,3]);bank.stop();
});
test('navigation during a cold download prevents the old sound from starting later',async()=>{
  const releases=[];const {bank,context}=bankFixture(()=>new Promise(resolve=>{releases.push(resolve);}));
  const done=bank.sequence(['sound-m','word-mat']);bank.stop();releases.forEach(release=>release(new Response(new Uint8Array([1]))));
  assert.equal(await done,false);await tick();await tick();assert.equal(context.sources.length,0);
});
test('muting cancels playback and does not report a successful silent sequence',async()=>{
  const {bank,context}=bankFixture();bank.enabled=false;assert.equal(await bank.sequence(['sound-m','sound-a','word-mat']),false);assert.equal(await bank.play('sound-m'),false);assert.equal(context.sources.length,0);
});
