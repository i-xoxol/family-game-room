(function(){
  'use strict';
  var media=document.createElement('audio'),clips=window.GardenAudioClips||{},generation=0,queue=[],playing=false,onStep=null,onFinish=null,position=0;
  media.preload='none';media.setAttribute('playsinline','');media.setAttribute('aria-hidden','true');media.volume=.85;
  media.hidden=true;document.body.appendChild(media);
  function finish(){playing=false;document.documentElement.classList.remove('voice-playing');var callback=onFinish;onStep=null;onFinish=null;if(callback)callback();}
  function stop(){generation++;queue=[];try{media.pause();}catch(_){}finish();}
  function next(token){
    if(token!==generation)return;
    if(!queue.length){finish();return;}
    var id=queue.shift(),clip=clips[id];
    if(!clip){next(token);return;}
    media.onended=function(){next(token);};media.onerror=function(){if(token===generation){queue=[];finish();}};
    media.src=clip.file;playing=true;document.documentElement.classList.add('voice-playing');
    if(onStep)onStep(position,id);position++;
    try{var result=media.play();if(result&&result.catch)result.catch(function(){if(token===generation){queue=[];finish();}});}catch(_){queue=[];finish();}
  }
  function play(ids,options){
    options=options||{};stop();if(options.enabled===false)return;
    queue=(Array.isArray(ids)?ids:[ids]).filter(function(id){return !!clips[id];});position=0;onStep=options.onStep||null;onFinish=options.onFinish||null;
    next(generation);
  }
  function prompt(q,readPattern){
    if(q.kind==='count')return[q.format==='build'?'prompt_build_'+q.n:'prompt_count'];
    if(q.kind==='compare')return['prompt_compare_'+q.ask];
    if(q.kind==='shape')return['prompt_shape_'+q.answer];
    if(q.kind==='pattern'&&readPattern)return q.sequence.map(function(x){return'token_'+x;}).concat(['prompt_pattern']);
    return['prompt_'+q.kind];
  }
  function help(q){
    if(q.kind==='count')return q.n===0?'help_zero':q.format==='build'?'help_build':'help_count';
    if(q.kind==='compare')return'help_compare_'+q.ask;
    if(q.kind==='shape')return'help_shape_'+q.answer;
    return'help_'+q.kind;
  }
  window.GardenVoice={play:play,stop:stop,prompt:prompt,help:help,isPlaying:function(){return playing;},status:function(){return{playing:playing,source:media.currentSrc||media.src||'',readyState:media.readyState,error:media.error?media.error.code:null,queued:queue.length,currentTime:media.currentTime||0,duration:Number.isFinite(media.duration)?media.duration:null};}};
}());
