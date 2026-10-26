// One playback owner for an entire blend/drag. Decoded Web Audio avoids reloading
// a media element for every short sound; long narration keeps HTML audio seeking.
export class AudioBank {
  constructor(manifest,{onError=()=>{},onSpeaking=()=>{},audioElement=null,contextFactory=null,fetchAudio=null}={}) {
    this.clips=manifest.clips;this.onError=onError;this.onSpeaking=onSpeaking;
    this.enabled=true;this.token=0;this.cache=new Map();this.pending=new Map();this.buffers=new Map();this.decoding=new Map();
    this.fetchAudio=fetchAudio||((...args)=>fetch(...args));
    this.contextFactory=contextFactory||(()=>{const Constructor=globalThis.AudioContext||globalThis.webkitAudioContext;return Constructor?new Constructor():null;});
    this.audio=audioElement||document.createElement('audio');this.audio.setAttribute('playsinline','');this.audio.preload='auto';
    if(!audioElement)document.body.append(this.audio);
  }
  unlock() {
    try{if(this.context===undefined)this.context=this.contextFactory();if(this.context&&this.context.state!=='running'&&this.context.state!=='closed')this.context.resume().catch(()=>{});}catch{this.context=null;}
    return this.context;
  }
  async prepare(id) {
    if(this.cache.has(id)){const item=this.cache.get(id);this.cache.delete(id);this.cache.set(id,item);return item.url;}
    if(this.pending.has(id))return this.pending.get(id);
    const clip=this.clips[id];if(!clip)throw new Error(`Missing prepared audio: ${id}`);
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
    const promise=this.fetchAudio(new URL(clip.file,location.href),{credentials:'same-origin',signal:controller.signal}).then(async response=>{
      if(!response.ok)throw new Error('Audio could not be loaded.');
      const blob=await response.blob(),url=URL.createObjectURL(blob);this.cache.set(id,{blob,url});this.pending.delete(id);
      if(this.cache.size>65){const old=[...this.cache.keys()].find(k=>!k.startsWith('sound-')&&k!==id&&k!==this.currentId);if(old){URL.revokeObjectURL(this.cache.get(old).url);this.cache.delete(old);}}
      return url;
    }).catch(error=>{this.pending.delete(id);throw error;}).finally(()=>clearTimeout(timeout));this.pending.set(id,promise);return promise;
  }
  async decode(id) {
    if(this.buffers.has(id)){const buffer=this.buffers.get(id);this.buffers.delete(id);this.buffers.set(id,buffer);return buffer;}
    if(this.decoding.has(id))return this.decoding.get(id);
    const promise=(async()=>{
      await this.prepare(id);const data=await this.cache.get(id).blob.arrayBuffer();
      const buffer=await new Promise((resolve,reject)=>this.context.decodeAudioData(data,resolve,reject));
      this.buffers.set(id,buffer);
      let bytes=[...this.buffers.values()].reduce((n,b)=>n+b.length*b.numberOfChannels*4,0);
      while(bytes>12*1024*1024&&this.buffers.size>1){const old=this.buffers.keys().next().value,b=this.buffers.get(old);bytes-=b.length*b.numberOfChannels*4;this.buffers.delete(old);}
      return buffer;
    })().finally(()=>this.decoding.delete(id));this.decoding.set(id,promise);return promise;
  }
  warm(ids) {return Promise.allSettled([...new Set(ids)].filter(id=>this.clips[id]).map(id=>this.context?this.decode(id):this.prepare(id)));}
  get currentTime(){return this.bufferClock?Math.min(this.bufferClock.duration,Math.max(0,this.context.currentTime-this.bufferClock.started)):this.audio.currentTime||0;}
  stop() {
    this.token++;this.audio.pause();cancelAnimationFrame(this.frame);
    const source=this.source;this.source=null;this.bufferClock=null;
    if(source){source.onended=null;try{source.stop();}catch{}source.disconnect();}
    if(this.complete){const done=this.complete;this.complete=null;done(false);}
    if(this.cancelQueue){const cancel=this.cancelQueue;this.cancelQueue=null;cancel();}
    this.onSpeaking(false);
  }
  play(id,options={}) {
    this.stop();options.onWord?.(-1);this.unlock();if(!this.enabled)return Promise.resolve(false);
    return this.playOwned(id,options,this.token,/^(sound|word)-/.test(id));
  }
  async playOwned(id,{start=0,end=null,onWord=null,onStart=null}={},token,buffered=false) {
    try {
      if(buffered&&this.context){
        const buffer=await this.decode(id);if(token!==this.token)return false;
        if(this.context.state!=='running')await this.context.resume();if(token!==this.token)return false;
        return await new Promise(resolve=>{
          const source=this.context.createBufferSource();source.buffer=buffer;source.connect(this.context.destination);this.source=source;this.currentId=id;
          const finish=ok=>{if(token!==this.token)return;this.source=null;this.bufferClock=null;this.complete=null;source.disconnect();this.onSpeaking(false);resolve(ok);};
          this.complete=resolve;source.onended=()=>finish(true);this.bufferClock={started:this.context.currentTime,duration:buffer.duration};
          source.start();this.onSpeaking(true);onStart?.();
        });
      }
      const url=this.cache.get(id)?.url||await this.prepare(id);if(token!==this.token)return false;
      this.audio.src=url;this.currentId=id;
      try{this.audio.currentTime=start;}catch{}
      return await new Promise(resolve=>{
        this.complete=resolve;
        const finish=ok=>{if(token!==this.token)return;cancelAnimationFrame(this.frame);this.audio.pause();this.complete=null;this.onSpeaking(false);resolve(ok);};
        this.audio.onended=()=>finish(true);
        this.audio.onerror=()=>{if(token===this.token)this.onError('That sound could not play. Tap its speaker to try again.');finish(false);};
        const marks=this.clips[id]?.marks||[];let last=-2;
        const tick=()=>{
          if(token!==this.token)return;const time=this.audio.currentTime;
          if(end!==null&&time>=end){finish(true);return;}
          if(onWord&&marks.length){let index=-1;for(const mark of marks){if(time+.015>=mark.time)index=mark.word;else break;}if(index!==last){last=index;onWord(index);}}
          this.frame=requestAnimationFrame(tick);
        };
        this.audio.onloadedmetadata=()=>{if(token===this.token&&start)this.audio.currentTime=start;};
        this.audio.play().then(()=>{if(token!==this.token)return;this.onSpeaking(true);onStart?.();tick();}).catch(()=>{if(token===this.token)this.onError('Tap the speaker again to let Safari play the sound.');finish(false);});
      });
    }catch{if(token===this.token){this.stop();this.onError('That sound could not load. Check your connection and try again.');}return false;}
  }
  queue(onIndex=()=>{}) {
    this.stop();this.unlock();const token=this.token,items=[];let running=false,closed=false,settled=false,resolveDone;
    const done=new Promise(resolve=>{resolveDone=resolve;});
    const finish=ok=>{if(settled)return;settled=true;if(token===this.token)this.cancelQueue=null;resolveDone(ok);};
    this.cancelQueue=()=>finish(false);
    const pump=async()=>{
      if(running||settled)return;running=true;
      while(items.length&&!settled){
        if(token!==this.token){finish(false);break;}
        const item=items.shift(),played=await this.playOwned(item.id,{onStart:()=>{if(token===this.token)onIndex(item.index);}},token,true);
        if(!played){finish(false);break;}
      }
      running=false;if(closed&&!items.length&&!settled)finish(true);
    };
    const append=(id,index)=>{if(closed||settled||token!==this.token)return false;items.push({id,index});if(this.context)this.decode(id).catch(()=>{});else this.prepare(id).catch(()=>{});void pump();return true;};
    const close=()=>{closed=true;if(!running&&!items.length)finish(true);return done;};
    if(!this.enabled)finish(false);
    return {append,close,done,cancel:()=>{if(token===this.token)this.stop();else finish(false);}};
  }
  sequence(ids,onIndex=()=>{}) {const queue=this.queue(onIndex);ids.forEach((id,i)=>queue.append(id,i));return queue.close();}
  async word(id,index,onWord) {
    const marks=this.clips[id]?.marks||[],current=marks.find(mark=>mark.word===index),next=marks.find(mark=>mark.word===index+1);
    if(!current)return false;
    return this.play(id,{start:current.time,end:next?.time??null,onWord});
  }
}
