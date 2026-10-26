(function () {
  'use strict';
  var Core=window.SnackLogic, Art=window.SnackArt, TAU=Math.PI*2, SAVE_KEY='snack-hole-adventure-v2';
  var $=function(id){return document.getElementById(id);};
  var canvas=$('game'),ctx=canvas.getContext('2d'),arena=$('arena'),app=$('app');
  if(!ctx||!Core||!Art){$('startup-error').hidden=false;return;}
  var stored=null;try{stored=localStorage.getItem(SAVE_KEY);}catch(_){}
  var state=Core.makeState(800,600,Core.cleanSave(stored));
  var width=800,height=600,dpr=1,background=null,bgIndex=-1,bgWidth=0,bgHeight=0;
  var particles=[],falling=[],pops=[],ripples=[],keys={},pointerDown=false;
  var lastTime=0,frameId=0,visualTime=0,toastUntil=0,popTime=0,shake=0,rewardDelay=-1,trailTime=0;
  var albumContext='home',soundContext=null,audioMaster=null,lastSoundAt=0;
  var lastCount=-1,lastStars=-1,lastRainbow=false,lastGuide='',slowFrames=0,lowPower=false;
  var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse=window.matchMedia&&window.matchMedia('(pointer: coarse)').matches;
  var colors=['#f6d469','#ee98b5','#99d9d2','#b6a3df','#b4d48e','#fff0b4'];

  function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state.save));}catch(_){}updateBank();}
  function updateBank(){$('bank-count').textContent=String(state.save.stars);$('sound-btn').setAttribute('aria-pressed',String(state.save.sound));$('sound-btn').setAttribute('aria-label',state.save.sound?'Turn sound off':'Turn sound on');$('sound-btn').classList.toggle('is-muted',!state.save.sound);}
  function unlockAudio(){
    if(!state.save.sound)return;
    try{
      if(!soundContext){var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;soundContext=new AC();audioMaster=soundContext.createGain();audioMaster.gain.value=.17;audioMaster.connect(soundContext.destination);}
      if(soundContext.state==='suspended'){var p=soundContext.resume();if(p&&p.catch)p.catch(function(){});}
    }catch(_){}
  }
  function tone(freq,when,duration,volume,type,end){
    if(!soundContext||!state.save.sound||soundContext.state!=='running')return;
    try{var osc=soundContext.createOscillator(),gain=soundContext.createGain(),t=soundContext.currentTime+(when||0);
      osc.type=type||'sine';osc.frequency.setValueAtTime(freq,t);if(end)osc.frequency.exponentialRampToValueAtTime(end,t+duration);
      gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(volume||.3,t+.012);gain.gain.exponentialRampToValueAtTime(.001,t+duration);
      osc.connect(gain);gain.connect(audioMaster);osc.start(t);osc.stop(t+duration+.03);
    }catch(_){}
  }
  function gulpSound(prize){
    if(visualTime-lastSoundAt<.075&&!prize)return;lastSoundAt=visualTime;
    tone(prize?180:230+Math.min(5,state.chain)*23,0,.16,.45,'sine',prize?70:105);
    tone(prize?530:690,.035,.16,.13,'triangle',prize?930:850);
  }
  function starSound(){[523.25,659.25,783.99].forEach(function(n,i){tone(n,i*.09,.23,.3,'sine');});}
  function winSound(){[523.25,659.25,783.99,1046.5,987.77,1046.5].forEach(function(n,i){tone(n,i*.13,.35,.35,'triangle');});}
  function toast(text,duration){$('cheer').textContent=text;$('cheer').classList.add('show');toastUntil=visualTime+(duration||1.8);}
  function refreshBackground(){
    if(bgIndex!==state.worldIndex||bgWidth!==width||bgHeight!==height){background=Art.background(width,height,state.worldIndex);bgIndex=state.worldIndex;bgWidth=width;bgHeight=height;}
    arena.style.backgroundColor=state.world.ground;
  }
  function size(){
    var screenHeight=window.visualViewport?window.visualViewport.height:window.innerHeight;
    app.style.height=Math.round(screenHeight)+'px';document.documentElement.style.setProperty('--screen-height',Math.round(screenHeight)+'px');
    var rect=arena.getBoundingClientRect();width=Math.max(240,Math.round(rect.width));height=Math.max(230,Math.round(rect.height));
    dpr=Math.min(window.devicePixelRatio||1,lowPower?1:coarse?1.25:1.5);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    Core.resize(state,width,height);refreshBackground();
  }
  function newParticle(x,y,kind,speed,color,life){
    var limit=lowPower?60:reduced?45:130;if(particles.length>=limit)particles.shift();
    var a=Math.random()*TAU,v=(speed||65)*(.3+Math.random()*.7);
    particles.push({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-(kind==='confetti'?50:0),life:life||.7,max:life||.7,kind:kind||'dot',r:kind==='star'?3+Math.random()*4:2+Math.random()*3,rotation:Math.random()*TAU,spin:(Math.random()-.5)*8,color:color||colors[Math.floor(Math.random()*colors.length)]});
  }
  function burst(x,y,count,speed,kind){for(var i=0;i<(reduced?Math.min(count,9):count);i++)newParticle(x,y,kind||'star',speed,colors[i%colors.length],.55+Math.random()*.75);}
  function confetti(){
    for(var i=0;i<(reduced?12:80);i++){
      newParticle(width*(.1+Math.random()*.8),height*.25,'confetti',180,colors[i%colors.length],1.4+Math.random()*1.2);
    }
  }
  function popText(x,y,text,color){pops.push({x:x,y:y,text:text,life:1,max:1,color:color||state.world.dark});if(pops.length>7)pops.shift();}
  function processEvents(){
    while(state.events.length){
      var event=state.events.shift(),data=event.data;
      if(event.type==='begin'){
        refreshBackground();$('world-name').textContent=state.world.name;$('world-symbol').textContent=state.world.icon;
        $('goal').textContent=String(state.round.goal);$('mission-label').textContent='Scoop '+state.round.goal+' snacks';
        lastCount=-1;lastStars=-1;lastGuide='';
      }
      if(event.type==='gulp'){
        falling.push({type:data.item.type,x:data.x,y:data.y,r:data.item.r,angle:data.item.angle,life:data.prize ? .65 : .42,max:data.prize ? .65 : .42,prize:data.prize});
        burst(state.hole.x,state.hole.y,10,data.prize?150:90,'star');
        ripples.push({x:state.hole.x,y:state.hole.y,r:state.hole.r,life:.45,max:.45});
        popTime=.45;gulpSound(data.prize);if(data.prize&&!reduced)shake=.28;
        if(!data.prize&&(state.round.count===1||state.chain>=3||state.round.count%3===0))popText(data.x,data.y-data.item.r-8,['Yum!','Slurp!','Lovely!','Nom nom!'][state.round.count%4]);
      }
      if(event.type==='star'){
        starSound();burst(state.hole.x,state.hole.y,23,150,'star');
        if(data.stars<3)toast(data.stars===1?'Getting bigger!':'Super scooper!');
      }
      if(event.type==='rainbow'){
        toast('A little rainbow magic!',2.2);burst(state.hole.x,state.hole.y,35,170,'star');
        [523,659,784,1046].forEach(function(n,i){tone(n,i*.08,.3,.2,'sine');});
      }
      if(event.type==='prize'){
        $('mission-label').textContent='One BIG surprise!';toast('Your surprise is here!',2.5);burst(data.item.x,data.item.y,35,150,'star');
        $('footer-text').textContent='You are big enough. Scoop the giant surprise!';
      }
      if(event.type==='win'){
        persist();winSound();confetti();toast('You did it!',2.2);rewardDelay=1.15;state.rainbow=0;
        state.winInfo=data;$('guide').hidden=true;$('power-banner').hidden=true;
      }
    }
  }
  function syncHud(){
    if(!state.round)return;
    if(lastCount!==state.round.count){lastCount=state.round.count;$('collected').textContent=String(lastCount);$('progress-fill').style.width=(100*lastCount/state.round.goal)+'%';}
    if(lastStars!==state.round.stars){lastStars=state.round.stars;var nodes=document.querySelectorAll('.track-star');for(var i=0;i<nodes.length;i++)nodes[i].classList.toggle('earned',i<lastStars);}
    var rainbow=state.rainbow>0&&state.phase==='play';if(lastRainbow!==rainbow){$('power-banner').hidden=!rainbow;lastRainbow=rainbow;}
    if(state.phase==='play'){
      var show=(!state.inputSeen||state.idle>7)&&!rainbow;
      $('guide').hidden=!show;
      var text=state.inputSeen?'Follow the sparkles':'Drag or tap to move';
      if(text!==lastGuide){$('guide-text').textContent=text;lastGuide=text;}
    }else $('guide').hidden=true;
  }
  function begin(){
    unlockAudio();hideModals();$('home').hidden=true;$('play-hud').hidden=false;$('pause-btn').hidden=false;
    app.className='game-mode';Core.begin(state);particles=[];falling=[];pops=[];ripples=[];rewardDelay=-1;
    $('footer-text').textContent='Every snack is a good snack. Scoop, grow, and explore.';
    size();processEvents();syncHud();canvas.setAttribute('aria-label',state.world.name+'. '+state.round.goal+' snacks to scoop. Drag or tap to move the donut.');
  }
  function home(){
    hideModals();state.phase='home';state.round=null;state.items=[];state.rainbow=0;
    state.worldIndex=state.save.completed%Core.WORLDS.length;state.world=Core.WORLDS[state.worldIndex];
    app.className='home-mode';$('home').hidden=false;$('play-hud').hidden=true;$('guide').hidden=true;$('pause-btn').hidden=true;$('power-banner').hidden=true;
    $('cheer').classList.remove('show');$('footer-text').textContent='A small world full of delicious possibilities.';
    canvas.setAttribute('aria-label','Move the donut with a finger, mouse, or arrow keys to collect snacks.');
    particles=[];falling=[];ripples=[];pops=[];rewardDelay=-1;size();$('play-btn').focus();
  }
  function hideModals(){['pause-modal','reward-modal','album-modal'].forEach(function(id){$(id).hidden=true;});}
  function pause(){
    if(state.phase!=='play')return;
    state.phase='paused';pointerDown=false;keys={};$('pause-modal').hidden=false;$('resume-btn').focus();
  }
  function resume(){if(state.phase!=='paused')return;unlockAudio();state.phase='play';$('pause-modal').hidden=true;lastTime=0;}
  function showReward(){
    var info=state.winInfo||{},world=Core.WORLDS[info.world===undefined?state.worldIndex:info.world];
    $('reward-eyebrow').textContent=world.name.toUpperCase()+' · COMPLETE';
    $('reward-sticker').textContent=world.symbol;$('reward-sticker').style.backgroundColor=world.color;
    $('sticker-badge').textContent=info.newSticker?'NEW STICKER!':'HAPPY TO SEE YOU!';
    $('reward-description').textContent=info.newSticker?'You found '+world.sticker+'. It is in your sticker garden!':'Three more stars for a wonderful adventure.';
    $('skin-unlock').hidden=!info.skin;
    if(info.skin){$('unlock-name').textContent=info.skin.name;drawPreview($('unlock-canvas'),info.skin);}
    $('reward-modal').hidden=false;$('next-btn').focus();
  }
  function drawPreview(target,skin){var c=target.getContext('2d');c.clearRect(0,0,target.width,target.height);Art.hole(c,target.width/2,target.height*.53,31,skin,1,{pop:0});}
  function openAlbum(){
    if(state.phase==='play'){albumContext='play';state.phase='paused';}else albumContext=state.phase;
    if(state.phase==='reward')rewardDelay=-1;
    $('reward-modal').hidden=true;renderAlbum();$('album-modal').hidden=false;$('close-album-btn').focus();
  }
  function closeAlbum(){
    $('album-modal').hidden=true;
    if(albumContext==='play')state.phase='play';
    if(albumContext==='reward')showReward();
    if(albumContext==='home')$('play-btn').focus();
    unlockAudio();
  }
  function renderAlbum(){
    var grid=$('skin-grid');grid.textContent='';
    Core.SKINS.forEach(function(skin){
      var unlocked=state.save.stars>=skin.cost,button=document.createElement('button');button.type='button';
      button.className='skin-card'+(unlocked?'':' locked')+(state.save.skin===skin.id?' selected':'');
      button.disabled=!unlocked;button.setAttribute('aria-label',skin.name+(unlocked?', select this donut':', unlock at '+skin.cost+' stars'));
      button.setAttribute('aria-pressed',String(state.save.skin===skin.id));
      var preview=document.createElement('canvas');preview.width=110;preview.height=82;preview.setAttribute('aria-hidden','true');drawPreview(preview,skin);button.appendChild(preview);
      var title=document.createElement('strong');title.textContent=skin.name;button.appendChild(title);
      var note=document.createElement('small');note.textContent=unlocked?(state.save.skin===skin.id?'Wearing it!':'Tap to wear'):skin.cost+' ★ to unlock';button.appendChild(note);
      button.addEventListener('click',function(){if(state.save.stars<skin.cost)return;state.save.skin=skin.id;persist();renderAlbum();tone(660,0,.14,.2);});grid.appendChild(button);
    });
    var stickers=$('sticker-grid');stickers.textContent='';
    Core.WORLDS.forEach(function(world,index){var unlocked=state.save.stickers.indexOf(index)>=0,slot=document.createElement('div');slot.className='sticker-slot'+(unlocked?'':' locked');
      var art=document.createElement('div');art.className='sticker-art';art.textContent=unlocked?world.symbol:'?';if(unlocked)art.style.backgroundColor=world.color;slot.appendChild(art);
      var label=document.createElement('small');label.textContent=unlocked?world.sticker:world.name;slot.appendChild(label);stickers.appendChild(slot);
    });$('sticker-count').textContent=state.save.stickers.length+' / '+Core.WORLDS.length;
  }

  function shadow(x,y,r,alpha){Art.ellipse(ctx,x,y+r*.45,r*.84,r*.27,'rgba(64,73,48,'+(alpha||.13)+')');}
  function homeScene(){
    var portrait=width/height<1.05,u=Core.unit(state),x=portrait?width*.57:width*.71,y=portrait?height*.74:height*.49;
    var r=portrait?Math.min(width*.18,height*.11):Math.min(height*.2,width*.1),orbitX=portrait?width*.33:Math.min(width*.21,height*.43),orbitY=portrait?height*.13:height*.31;
    Art.ellipse(ctx,x,y+r*.9,r*1.8,r*.45,'rgba(139,167,105,.12)');
    var foodTypes=['berry','cookie','orange','icecream','apple','donut'];
    for(var i=0;i<foodTypes.length;i++){
      var a=-Math.PI*.5+i*TAU/foodTypes.length,fx=x+Math.cos(a)*orbitX,fy=y+Math.sin(a)*orbitY,fr=r*(i%2?.28:.31),bob=reduced?0:Math.sin(visualTime*1.2+i)*5*u;
      shadow(fx,fy+8*u,fr,.09);Art.food(ctx,foodTypes[i],fx,fy+bob,fr,Math.sin(visualTime*.5+i)*.06);
    }
    Art.hole(ctx,x,y,r*(1+(reduced?0:Math.sin(visualTime*.8)*.018)),Core.skinFor(state.save.skin),visualTime,{pop:0});
    for(var j=0;j<8;j++){var angle=j*2.4+visualTime*.06,px=x+Math.cos(angle)*r*(1.3+j%3*.3),py=y+Math.sin(angle)*r*(.9+j%2*.2);Art.star(ctx,px,py,3+Math.sin(visualTime+j),1.5,angle,'rgba(255,249,192,.85)');}
  }
  function guidance(){
    if(state.phase!=='play'||(state.inputSeen&&state.idle<5))return;
    var item=Core.nearest(state,true);if(!item)return;
    var h=state.hole;ctx.save();ctx.globalAlpha=.6;ctx.strokeStyle=state.world.dark;ctx.lineWidth=2;ctx.setLineDash([3,10]);ctx.lineDashOffset=-visualTime*22;
    ctx.beginPath();ctx.moveTo(h.x,h.y);ctx.quadraticCurveTo((h.x+item.x)/2,(h.y+item.y)/2-30,item.x,item.y);ctx.stroke();ctx.setLineDash([]);
    ctx.beginPath();ctx.ellipse(item.x,item.y+item.r*.2,item.r*1.6,item.r*1.05,0,0,TAU);ctx.strokeStyle='#fff9db';ctx.lineWidth=3;ctx.stroke();
    Art.star(ctx,item.x+item.r*1.2,item.y-item.r,6,3,-Math.PI/2,'#fff7b9');ctx.restore();
  }
  function gameplayScene(){
    guidance();
    var h=state.hole;
    if(state.phase==='play'&&Core.distance(h,{x:h.tx,y:h.ty})>20&&state.inputSeen){ctx.save();ctx.globalAlpha=.3;ctx.strokeStyle=state.world.dark;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(h.tx,h.ty,6,0,TAU);ctx.stroke();ctx.restore();}
    Art.hole(ctx,h.x,h.y,h.r,Core.skinFor(state.save.skin),visualTime,{pop:Math.max(0,popTime/.45),rainbow:state.rainbow>0});
    for(var i=0;i<ripples.length;i++){var ring=ripples[i];ctx.save();ctx.globalAlpha=ring.life/ring.max*.4;ctx.strokeStyle='#fff6cf';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(ring.x,ring.y,ring.r*(1.1+(1-ring.life/ring.max)*.5),ring.r*(.75+(1-ring.life/ring.max)*.35),0,0,TAU);ctx.stroke();ctx.restore();}
    var items=state.items.filter(function(item){return !item.taken;}).sort(function(a,b){return a.y-b.y;});
    for(i=0;i<items.length;i++){
      var item=items[i],age=state.t-item.born,alpha=item.fade ? .23 : 1,bob=reduced?0:Math.sin(visualTime*1.5+item.seed)*1.8;
      if(item.prize){
        ctx.save();ctx.translate(item.x,item.y);ctx.rotate(visualTime*.12);ctx.globalAlpha=.21;
        for(var k=0;k<10;k++){ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,item.r*2.8,k*TAU/10,k*TAU/10+.13);ctx.closePath();ctx.fillStyle=k%2?'#fff8db':'#f7d986';ctx.fill();}ctx.restore();
        for(var j=0;j<5;j++){var a=j*TAU/5+visualTime*.6;Art.star(ctx,item.x+Math.cos(a)*item.r*1.6,item.y+Math.sin(a)*item.r*1.3,4.5,2.2,a,'#fff7cc');}
      }
      var scale=item.prize?Math.min(1,age*2):1;shadow(item.x,item.y,item.r*scale,item.fade ? .03 : .12);
      Art.food(ctx,item.type,item.x,item.y+bob,item.r*scale,item.angle+(item.prize?Math.sin(visualTime*2)*.06:0),alpha);
    }
    for(i=0;i<falling.length;i++){
      var f=falling[i],t=1-f.life/f.max,ease=t*t*(3-2*t),fx=f.x+(h.x-f.x)*ease,fy=f.y+(h.y-f.y)*ease;
      var swirl=Math.sin(t*Math.PI)*f.r*.6;Art.food(ctx,f.type,fx+Math.cos(t*7)*swirl,fy+Math.sin(t*7)*swirl,f.r*Math.pow(1-t,.75),f.angle+t*3,1-t*t);
    }
  }
  function effects(dt){
    var active=state.phase!=='paused';
    for(var i=particles.length-1;i>=0;i--){var p=particles[i];if(active){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.3,dt);p.vy+=(p.kind==='confetti'?180:45)*dt;p.rotation+=p.spin*dt;}if(p.life<=0){particles.splice(i,1);continue;}
      ctx.save();ctx.globalAlpha=Math.min(1,p.life/.3);ctx.translate(p.x,p.y);ctx.rotate(p.rotation);var r=p.r*Math.min(1,p.life*4);
      if(p.kind==='star')Art.star(ctx,0,0,r,r*.45,0,p.color);else if(p.kind==='confetti'){ctx.fillStyle=p.color;ctx.fillRect(-r,-r*.5,r*2*Math.cos(p.life*8),r);}else Art.circle(ctx,0,0,r,p.color);ctx.restore();
    }
    for(i=pops.length-1;i>=0;i--){var text=pops[i];if(active){text.life-=dt;text.y-=22*dt;}if(text.life<=0){pops.splice(i,1);continue;}
      ctx.save();ctx.globalAlpha=Math.min(1,text.life*3);ctx.translate(text.x,text.y);ctx.rotate(-.1);ctx.font='700 '+Math.round(19*Core.unit(state))+'px Fredoka, sans-serif';ctx.textAlign='center';ctx.strokeStyle='#fff9e5';ctx.lineWidth=5;ctx.lineJoin='round';ctx.strokeText(text.text,0,0);ctx.fillStyle=text.color;ctx.fillText(text.text,0,0);ctx.restore();
    }
  }
  function frame(now){
    frameId=0;if(document.hidden)return;
    var raw=lastTime?(now-lastTime)/1000:1/60;lastTime=now;var dt=Math.min(.05,Math.max(.001,raw));visualTime+=state.phase==='paused'?0:dt;
    if(raw>.032&&raw<.2)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);
    if(slowFrames>80&&!lowPower){lowPower=true;size();}
    if(state.phase==='play'){
      var kx=(keys.ArrowRight||keys.KeyD?1:0)-(keys.ArrowLeft||keys.KeyA?1:0),ky=(keys.ArrowDown||keys.KeyS?1:0)-(keys.ArrowUp||keys.KeyW?1:0);
      if(kx||ky)Core.target(state,state.hole.x+kx*100,state.hole.y+ky*100);
    }
    if(state.phase!=='paused')Core.step(state,dt);processEvents();syncHud();
    if(state.phase!=='paused'){
      popTime=Math.max(0,popTime-dt);shake=Math.max(0,shake-dt);
      for(var i=falling.length-1;i>=0;i--){falling[i].life-=dt;if(falling[i].life<=0)falling.splice(i,1);}
      for(i=ripples.length-1;i>=0;i--){ripples[i].life-=dt;if(ripples[i].life<=0)ripples.splice(i,1);}
      if(state.phase==='play'&&state.inputSeen){trailTime+=dt;var v=Math.abs(state.hole.vx)+Math.abs(state.hole.vy);if(trailTime>.055&&v>40&&!reduced){trailTime=0;newParticle(state.hole.x,state.hole.y,'dot',15,state.rainbow>0?colors[Math.floor(visualTime*12)%colors.length]:'#fff1ad',.42);}}
      if(rewardDelay>=0){rewardDelay-=dt;if(rewardDelay<0)showReward();}
    }
    if(visualTime>toastUntil)$('cheer').classList.remove('show');
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);ctx.save();
    if(shake>0&&!reduced)ctx.translate(Math.sin(visualTime*77)*shake*8,Math.cos(visualTime*53)*shake*5);
    ctx.drawImage(background,0,0,width,height);
    if(state.phase==='home')homeScene();else gameplayScene();effects(dt);ctx.restore();
    frameId=requestAnimationFrame(frame);
  }
  function coordinates(clientX,clientY){var rect=canvas.getBoundingClientRect();return{x:(clientX-rect.left)*width/rect.width,y:(clientY-rect.top)*height/rect.height};}
  function moveInput(clientX,clientY){var p=coordinates(clientX,clientY);Core.target(state,p.x,p.y);}
  function pointerStart(e){if(state.phase!=='play')return;e.preventDefault();pointerDown=true;unlockAudio();moveInput(e.clientX,e.clientY);if(canvas.setPointerCapture&&e.pointerId!==undefined){try{canvas.setPointerCapture(e.pointerId);}catch(_){}}}
  if(window.PointerEvent){
    canvas.addEventListener('pointerdown',pointerStart,{passive:false});canvas.addEventListener('pointermove',function(e){if(pointerDown&&state.phase==='play'){e.preventDefault();moveInput(e.clientX,e.clientY);}},{passive:false});
    window.addEventListener('pointerup',function(){pointerDown=false;});window.addEventListener('pointercancel',function(){pointerDown=false;});
  }else{
    canvas.addEventListener('touchstart',function(e){if(state.phase!=='play')return;e.preventDefault();pointerDown=true;unlockAudio();if(e.touches.length)moveInput(e.touches[0].clientX,e.touches[0].clientY);},{passive:false});
    canvas.addEventListener('touchmove',function(e){if(pointerDown&&e.touches.length){e.preventDefault();moveInput(e.touches[0].clientX,e.touches[0].clientY);}},{passive:false});
    window.addEventListener('touchend',function(){pointerDown=false;});window.addEventListener('touchcancel',function(){pointerDown=false;});
    canvas.addEventListener('mousedown',pointerStart);window.addEventListener('mousemove',function(e){if(pointerDown)moveInput(e.clientX,e.clientY);});window.addEventListener('mouseup',function(){pointerDown=false;});
  }
  canvas.addEventListener('contextmenu',function(e){e.preventDefault();});
  window.addEventListener('keydown',function(e){
    if(e.key==='Escape'){if(!$('album-modal').hidden)closeAlbum();else if(state.phase==='play')pause();else if(state.phase==='paused'&&!$('pause-modal').hidden)resume();return;}
    if(e.key==='Tab'){
      var modal=document.querySelector('.modal:not([hidden])');if(!modal)return;var nodes=modal.querySelectorAll('button:not([disabled]):not([hidden])'),first=nodes[0],last=nodes[nodes.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}return;
    }
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS'].indexOf(e.code)>=0&&state.phase==='play'){e.preventDefault();keys[e.code]=true;unlockAudio();}
  });
  window.addEventListener('keyup',function(e){delete keys[e.code];});window.addEventListener('blur',function(){keys={};pointerDown=false;});
  document.addEventListener('visibilitychange',function(){
    if(document.hidden){if(state.phase==='play')pause();if(frameId)cancelAnimationFrame(frameId);frameId=0;if(soundContext&&soundContext.state==='running'){var p=soundContext.suspend();if(p&&p.catch)p.catch(function(){});}}
    else{lastTime=0;size();if(!frameId)frameId=requestAnimationFrame(frame);}
  });
  $('play-btn').addEventListener('click',begin);$('pause-btn').addEventListener('click',pause);$('resume-btn').addEventListener('click',resume);$('go-home-btn').addEventListener('click',home);
  $('next-btn').addEventListener('click',begin);$('reward-home-btn').addEventListener('click',home);$('album-btn').addEventListener('click',openAlbum);$('reward-album-btn').addEventListener('click',openAlbum);$('close-album-btn').addEventListener('click',closeAlbum);
  $('sound-btn').addEventListener('click',function(){state.save.sound=!state.save.sound;unlockAudio();persist();if(state.save.sound)tone(660,0,.15,.2);});
  window.addEventListener('resize',size);window.addEventListener('orientationchange',function(){setTimeout(size,180);});
  if(window.visualViewport)window.visualViewport.addEventListener('resize',size);
  updateBank();state.worldIndex=state.save.completed%Core.WORLDS.length;state.world=Core.WORLDS[state.worldIndex];size();frameId=requestAnimationFrame(frame);
  // Read-only development view: the same positions and rewards visible in play.
  window.SnackGame={snapshot:function(){var rect=canvas.getBoundingClientRect();return{phase:state.phase,world:state.world.name,stars:state.save.stars,skin:state.save.skin,completed:state.save.completed,stickers:state.save.stickers.slice(),count:state.round?state.round.count:0,goal:state.round?state.round.goal:0,rainbow:state.rainbow>0,width:width,height:height,dpr:dpr,canvas:{x:rect.left,y:rect.top},hole:{x:state.hole.x,y:state.hole.y,r:state.hole.r},items:state.items.filter(function(item){return !item.taken&&!item.fade;}).map(function(item){return{x:item.x,y:item.y,type:item.type,prize:item.prize,r:item.r};})};}};
}());
