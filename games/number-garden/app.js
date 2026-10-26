(function(){
  'use strict';
  var Core=window.GardenMath,Art=window.GardenArt,Voice=window.GardenVoice,$=function(id){return document.getElementById(id);},KEY='eric-number-garden-v1';
  if(!Core||!Art||!Voice){$('startup-error').hidden=false;return;}
  var raw=null;try{raw=localStorage.getItem(KEY);}catch(_){}
  var save=Core.cleanSave(raw),model=null,view='home',lastMode='mix',gardenContext='home',lab={a:2,b:1,op:'+'},audioCtx=null,toneMaster=null,celebrationFrame=0,coachTimer=0;
  var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function store(){if(model)save=model.save;try{localStorage.setItem(KEY,JSON.stringify(save));}catch(_){}updateHeader();}
  function updateHeader(){$('bloom-count').textContent=String(save.rounds);$('sound-btn').setAttribute('aria-pressed',String(save.sound));$('sound-btn').setAttribute('aria-label',save.sound?'Turn sounds off':'Turn sounds on');$('sound-btn').classList.toggle('muted',!save.sound);}
  function unlockTone(){if(!save.sound)return;try{if(!audioCtx){var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audioCtx=new AC();toneMaster=audioCtx.createGain();toneMaster.gain.value=.12;toneMaster.connect(audioCtx.destination);}if(audioCtx.state==='suspended'){var p=audioCtx.resume();if(p&&p.catch)p.catch(function(){});}}catch(_){}}
  function tone(f,delay,duration){if(!audioCtx||!save.sound)return;try{var osc=audioCtx.createOscillator(),gain=audioCtx.createGain(),t=audioCtx.currentTime+(delay||0);osc.type='sine';osc.frequency.setValueAtTime(f,t);gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(.3,t+.02);gain.gain.exponentialRampToValueAtTime(.001,t+(duration||.22));osc.connect(gain);gain.connect(toneMaster);osc.start(t);osc.stop(t+(duration||.22)+.02);}catch(_){}}
  function say(ids,options){options=options||{};options.enabled=save.sound&&save.voice;Voice.play(ids,options);}
  function stopCoach(){if(coachTimer)clearTimeout(coachTimer);coachTimer=0;document.querySelectorAll('.coach-current').forEach(function(n){n.classList.remove('coach-current');});}
  function stopVoice(){stopCoach();Voice.stop();}
  function setView(next){stopVoice();view=next;['home','lesson','playground'].forEach(function(id){$(id).hidden=id!==next;});$('reward-modal').hidden=true;$('garden-modal').hidden=true;window.scrollTo(0,0);}
  function renderHome(){
    if(model)save=model.save;updateHeader();var friend=Core.friendFor(save.friend);
    $('hero-art').innerHTML=Art.hero(friend.id);document.querySelector('.hero-caption>span:last-child').innerHTML='Meet '+esc(friend.short)+'.<br>Your counting companion.';
    $('start-label').textContent=save.active?'Keep growing!':"Let's grow!";$('resume-note').hidden=!save.active;document.querySelector('.hero').classList.toggle('has-resume',!!save.active);
    $('activity-grid').innerHTML=Core.IDS.map(function(id){var s=Core.SKILLS[id];return'<button type="button" class="activity-card" data-activity="'+id+'" aria-label="Play '+esc(s.name)+'"><span class="activity-picture '+s.color+'">'+Art.icon(s.icon)+'</span><span><h3>'+esc(s.name)+'</h3><p>'+esc(s.description)+'</p></span></button>';}).join('');
  }
  function goHome(){store();setView('home');renderHome();$('start-btn').focus();}
  function begin(mode){
    var resuming=!!save.active;unlockTone();lastMode=mode||'mix';model=Core.start(save,lastMode);save=model.save;setView('lesson');renderQuestion();store();
    say((save.answers===0&&!resuming?['welcome']:[]).concat(Voice.prompt(model.q,false)));
  }
  function seedCount(){return model?model.phase==='complete'?5:model.save.active?model.save.active.index:0:0;}
  function renderSeeds(){var count=seedCount();$('seed-dots').innerHTML=[0,1,2,3,4].map(function(i){return'<span class="seed-dot'+(i<count?' filled':'')+'">'+Art.icon('seed')+'</span>';}).join('');$('seed-count').textContent=count+' / 5 seeds';$('challenge-number').textContent=count>=5?'FIVE LITTLE DISCOVERIES!':model.phase==='answered'?count+' OF 5 LITTLE DISCOVERIES':'LITTLE CHALLENGE '+(count+1)+' OF 5';}
  function token(index,icon,group,removed){
    return'<button type="button" class="count-token'+(removed?' removed':'')+'" '+(removed?'disabled aria-label="Went to the picnic"':'data-count="'+index+'" data-group="'+group+'" aria-label="Touch this '+(icon==='carrot'?'carrot':'berry')+' to count"')+'>'+Art.icon(icon)+'</button>';
  }
  function tray(group,label,base,groupIndex){
    var remaining=group.n-(group.removed||0),content='';
    for(var i=0;i<group.n;i++)content+=token(base+Math.min(i,remaining),group.icon,groupIndex,i>=remaining);
    return'<div class="object-tray '+(group.tone==='mint'?'mint':group.tone==='butter'?'butter':'')+(model.q.groups.length===1?' single':' double-tray')+'"><p class="tray-label">'+label+'</p>'+(group.n?'<div class="count-grid">'+content+'</div>':'<div class="empty-basket" aria-label="Empty basket">0</div>')+'</div>';
  }
  function buildBoard(){var q=model.q,a=save.active,slots='';for(var i=0;i<q.frameSize;i++){var filled=a.filled.indexOf(i)>=0;slots+='<button class="build-slot'+(filled?' has-berry':'')+'" type="button" data-slot="'+i+'" aria-label="'+(filled?'Take this berry out':'Put a berry in this space')+'" aria-pressed="'+filled+'">'+(filled?Art.icon('berry'):'')+'</button>';}
    return'<div class="builder-wrap"><div class="target-number" aria-label="Make '+q.n+'">'+q.n+'</div><div><div class="build-board">'+slots+'</div><p class="build-counter">'+a.builder+' in your basket</p></div></div>';
  }
  function renderQuestion(){
    stopVoice();var q=model.q,s=Core.SKILLS[q.kind],friend=Core.friendFor(save.friend),a=save.active;renderSeeds();
    $('buddy-art').innerHTML=Art.friend(friend.id);$('buddy-name').textContent=friend.short.toUpperCase()+' · YOUR GARDEN PAL';$('buddy-message').textContent=['Let’s discover together!','Little steps. Big ideas.','Take your time, Eric.','I wonder what you’ll find!'][save.answers%4];
    $('question-title').textContent=q.title;$('question-detail').textContent=q.detail;$('skill-label').textContent=s.tag;$('lesson-tag').textContent=s.name;
    $('feedback').textContent='';$('feedback').className='feedback';$('hint-btn').hidden=false;$('next-btn').hidden=true;$('answer-area').innerHTML='';
    var stage='',answers='';
    if(q.format==='build'){
      stage=buildBoard();answers='<button class="answer-btn build-answer" type="button" data-submit-build="true">All done <span aria-hidden="true"> ✓</span></button>';
    }else if(q.kind==='compare'){
      for(var c=0;c<2;c++)stage+='<div class="compare-group">'+tray(q.groups[c],c?'RIGHT BASKET':'LEFT BASKET',c?q.a:0,c)+'<div class="tray-number" data-total="'+c+'" hidden>'+q.groups[c].n+'</div><button type="button" class="answer-btn compare-pick" data-choice="'+(c?'right':'left')+'"><span aria-hidden="true">'+(c?'→':'←')+'</span>This basket</button></div>';
      answers='<button class="answer-btn same-answer" type="button" data-choice="same"><span aria-hidden="true">＝</span>Same number</button>';
    }else if(q.kind==='pattern'){
      stage='<div class="pattern-row">'+q.sequence.map(function(x,i){return'<div class="pattern-piece" data-pattern="'+i+'">'+Art.icon(x)+'</div>';}).join('')+'<div class="pattern-piece unknown" aria-label="What comes next?">?</div></div>';
    }else if(q.kind==='shape'){
      stage='<div class="shape-prompt"><div>'+Art.friend(friend.id)+'</div><div class="shape-speech">Shapes are hiding<br>all around us.</div><div class="shape-help" hidden></div></div>';
    }else{
      var base=0;for(var g=0;g<q.groups.length;g++){if(g)stage+='<span class="equation-symbol" aria-hidden="true">＋</span>';stage+=tray(q.groups[g],q.kind==='subtract'?'THE PICNIC BASKET':q.groups.length>1?(g?'MOMO’S BASKET':'PIP’S BASKET'):'A LITTLE BASKET OF BERRIES',base,g);base+=q.groups[g].n;}
    }
    if(!answers&&q.kind!=='compare')answers=q.choices.map(function(choice){return'<button type="button" class="answer-btn'+(choice.art?' art-answer':'')+'" data-choice="'+choice.id+'" aria-label="'+esc(choice.label)+'">'+(choice.art?Art.icon(choice.art)+(q.kind==='shape'?'<span>'+esc(choice.label)+'</span>':'') :esc(choice.label))+'</button>';}).join('');
    $('question-stage').innerHTML=stage;$('answer-area').innerHTML=answers;
    if(q.kind==='add'||q.kind==='subtract'){$('answer-area').insertAdjacentHTML('beforebegin','<div class="math-equation" id="math-equation">'+q.a+' '+(q.kind==='add'?'+':'−')+' '+q.b+' = ?</div>');}
    var equations=document.querySelectorAll('.math-equation');for(var e=0;e<equations.length-1;e++)equations[e].remove();if(q.kind!=='add'&&q.kind!=='subtract')equations.forEach(function(el){el.remove();});
    if(q.kind==='shape')document.querySelectorAll('.art-answer .art-icon').forEach(function(el){el.style.transform='rotate('+q.rotation+'deg)';});
    a.touched.forEach(function(index){markCount(index,false);});
    if(a.hint)showHint(false);
    a.rejected.forEach(function(id){var node=document.querySelector('[data-choice="'+id+'"]');if(node){node.classList.add('tried');node.disabled=true;}});
    if(a.attempts>=2)guideAnswer();
  }
  function countOrdinal(index){if(model.q.kind!=='compare')return save.active.touched.indexOf(index)+1;var left=index<model.q.a;return save.active.touched.filter(function(i){return left?i<model.q.a:i>=model.q.a;}).indexOf(index)+1;}
  function markCount(index,record){
    var node=document.querySelector('[data-count="'+index+'"]');if(!node)return;
    var value=record?Core.touch(model,index):save.active.touched.indexOf(index)>=0?countOrdinal(index):null;if(value===null)return;
    if(model.q.kind==='compare')value=countOrdinal(index);
    node.classList.add('is-counted');node.disabled=true;
    if(!node.querySelector('.count-label'))node.insertAdjacentHTML('beforeend','<span class="count-label">'+value+'</span>');
    if(record){store();tone(400+value*23,0,.12);say('number_'+Math.min(20,value));}
  }
  function guideAnswer(){if(!model||model.phase!=='question')return;document.querySelectorAll('[data-choice]').forEach(function(node){node.classList.toggle('guided',node.getAttribute('data-choice')===model.q.answer);});}
  function showHint(withAudio){
    if(!model||model.phase!=='question')return;Core.hint(model);store();var q=model.q,a=save.active;
    $('feedback').textContent=q.hint;$('feedback').className='feedback';$('buddy-message').textContent='We can figure it out together.';
    if(q.kind==='compare'){
      document.querySelectorAll('[data-total]').forEach(function(n){n.hidden=false;});
      var matched=Math.min(q.a,q.b);document.querySelectorAll('[data-count]').forEach(function(n){var ix=Number(n.getAttribute('data-count'));if((ix<q.a&&ix<matched)||(ix>=q.a&&ix-q.a<matched))n.classList.add('paired');});
    }
    if(q.kind==='pattern')document.querySelectorAll('[data-pattern]').forEach(function(n,i){n.classList.add('pattern-hint');n.style.animationDelay=(i*.2)+'s';});
    if(q.kind==='shape'){var help=document.querySelector('.shape-help');help.hidden=false;help.innerHTML=Art.icon(q.answer);}
    if(q.format==='build'){
      var remaining=Math.max(0,q.n-a.builder);document.querySelectorAll('[data-slot]').forEach(function(n){n.classList.remove('hint-fill');if(!n.classList.contains('has-berry')&&remaining>0){n.classList.add('hint-fill');remaining--;}});
      if(a.builder>q.n)$('feedback').textContent='You have '+a.builder+'. Try taking a berry out. Stop when you have '+q.n+'.';
    }
    if(withAudio){
      stopCoach();var ids=[Voice.help(q)],countable=(q.kind==='count'&&q.format!=='build')||q.kind==='add'||q.kind==='subtract';
      if(countable){var total=Number(q.answer);if(total===0)ids.push('number_0');else for(var n=1;n<=total;n++)ids.push('number_'+n);
        say(ids,{onStep:function(position,id){if(position>0&&total>0){var index=position-1;var tokenNode=document.querySelector('[data-count="'+index+'"]');if(tokenNode){document.querySelectorAll('.coach-current').forEach(function(x){x.classList.remove('coach-current');});tokenNode.classList.add('coach-current');Core.touch(model,index);markCount(index,false);store();}}},onFinish:stopCoach});
      }else if(q.kind==='pattern'){
        ids=ids.concat(q.sequence.map(function(x){return'token_'+x;}));say(ids,{onStep:function(position){document.querySelectorAll('.coach-current').forEach(function(x){x.classList.remove('coach-current');});if(position>0){var p=document.querySelector('[data-pattern="'+(position-1)+'"]');if(p)p.classList.add('coach-current');}},onFinish:stopCoach});
      }else say(ids);
    }
    if(a.attempts>=2)guideAnswer();
  }
  function submit(id){
    if(!model||model.phase!=='question')return;var q=model.q,assisted=save.active.hint||save.active.attempts>0;stopVoice();var result=Core.answer(model,id);save=model.save;store();
    if(result.status==='ignored')return;
    if(result.status==='try'){
      var wrong=document.querySelector('[data-choice="'+String(id)+'"]');if(wrong){wrong.classList.add('tried');wrong.disabled=true;}
      showHint(false);$('feedback').textContent='Let’s look together. '+q.hint;say(Voice.help(q));return;
    }
    document.querySelectorAll('#question-stage button,#answer-area button').forEach(function(n){n.disabled=true;});
    document.querySelectorAll('[data-choice]').forEach(function(n){n.classList.remove('guided');if(n.getAttribute('data-choice')===q.answer)n.classList.add('correct');});
    var buildButton=document.querySelector('[data-submit-build]');if(buildButton)buildButton.classList.add('correct');
    var equation=$('math-equation');if(equation)equation.textContent=q.a+' '+(q.kind==='add'?'+':'−')+' '+q.b+' = '+q.answer;
    if(q.kind==='pattern'){var unknown=document.querySelector('.pattern-piece.unknown');unknown.innerHTML=Art.icon(q.answer);unknown.classList.remove('unknown');}
    $('feedback').textContent='A little discovery! '+q.explanation;$('feedback').className='feedback good';$('hint-btn').hidden=true;
    $('buddy-message').textContent=assisted?'You kept trying. That’s how we grow!':'A little seed for a big discovery!';
    $('buddy-art').classList.remove('celebrate');void $('buddy-art').offsetWidth;$('buddy-art').classList.add('celebrate');
    renderSeeds();celebrate(result.finished);[523,659,784].forEach(function(f,i){tone(f,i*.09,.22);});
    if(result.finished){
      $('next-btn').hidden=false;$('next-btn').textContent='See what you grew ✿';$('next-btn').focus();say(assisted?'correct_retry':['correct_one','correct_two','correct_three'][save.answers%3]);
    }else{
      $('next-btn').hidden=false;$('next-btn').textContent='Next little challenge →';$('next-btn').focus();
      var ids=[];if(['count','add','subtract'].indexOf(q.kind)>=0)ids.push('number_'+q.answer);ids.push(assisted?'correct_retry':['correct_one','correct_two','correct_three'][save.answers%3]);say(ids);
    }
  }
  function advance(){
    if(!model)return;if(model.phase==='complete'){showReward();return;}
    if(Core.next(model)){renderQuestion();store();say(Voice.prompt(model.q,false));$('hear-btn').focus();}
  }
  function showReward(){
    stopVoice();var reward=model.reward;$('reward-art').innerHTML=Art.friend(reward.friend.id);$('reward-friend').textContent=reward.friend.name;$('new-friend-tag').textContent=reward.isNew?'A NEW GARDEN FRIEND!':'ANOTHER HAPPY LITTLE BLOOM!';
    $('reward-text').textContent=reward.isNew?reward.friend.description+' Your garden has '+save.rounds+' '+(save.rounds===1?'flower':'flowers')+' now.':'You grew another flower. Your garden has '+save.rounds+' happy little blooms.';
    $('reward-modal').hidden=false;$('another-btn').focus();celebrate(true);say(reward.isNew?'reward_new':'reward_again');
  }
  function openGarden(){
    stopVoice();gardenContext=$('reward-modal').hidden?view:'reward';$('reward-modal').hidden=true;renderGarden();$('garden-modal').hidden=false;$('close-garden-btn').focus();
  }
  function closeGarden(){stopVoice();$('garden-modal').hidden=true;if(gardenContext==='reward')showReward();else if(view==='home')$('start-btn').focus();else if(view==='lesson')$('hear-btn').focus();}
  function renderGarden(){
    $('garden-description').textContent=save.rounds?save.rounds+' '+(save.rounds===1?'flower grown':'flowers grown')+' from '+save.answers+' little discoveries.':'Your first five seeds will grow a flower and bring Momo to the garden.';
    $('garden-scene').innerHTML=Art.garden(save.rounds);$('friend-count').textContent=Core.FRIENDS.filter(function(f){return save.rounds>=f.rounds;}).length+' / 6';
    $('friend-grid').innerHTML=Core.FRIENDS.map(function(f){var available=save.rounds>=f.rounds;return'<button type="button" class="friend-card'+(available?'':' locked')+(save.friend===f.id?' selected':'')+'" data-friend="'+f.id+'" '+(available?'':'disabled')+' aria-label="'+esc(f.name)+(available?', choose this garden pal':', joins after '+f.rounds+' adventures')+'" aria-pressed="'+(save.friend===f.id)+'">'+Art.friend(f.id)+'<strong>'+esc(f.name)+'</strong><small>'+(available?(save.friend===f.id?'Your garden pal!':'Tap to choose'):f.rounds+' little '+(f.rounds===1?'adventure':'adventures'))+'</small></button>';}).join('');
  }
  function renderLab(){
    if(lab.op==='-'&&lab.b>lab.a)lab.b=lab.a;
    function frame(n){var content='';for(var i=0;i<10;i++)content+=i<n?Art.icon('berry'):'<span class="lab-empty-slot" aria-hidden="true"></span>';return content;}
    $('lab-left').innerHTML=frame(lab.a);$('lab-right').innerHTML=frame(lab.b);$('lab-a').textContent=lab.a;$('lab-b').textContent=lab.b;
    $('lab-operation').textContent=lab.op==='+'?'＋':'−';$('lab-operation').setAttribute('aria-label',lab.op==='+'?'Change from adding to taking away':'Change from taking away to adding');
    var result=lab.op==='+'?lab.a+lab.b:lab.a-lab.b;$('lab-result').textContent=result;var objects='';for(var i=0;i<result;i++)objects+=Art.icon('berry');$('lab-result-art').innerHTML=objects;
    $('lab-note').textContent=lab.op==='+'?lab.a+' and '+lab.b+' make '+result+'. Look at them all together!':lab.a+' take away '+lab.b+' leaves '+result+'. Count the berries that stay.';
    $('left-minus').disabled=lab.a<=0;$('left-plus').disabled=lab.a>=10;$('right-minus').disabled=lab.b<=0;$('right-plus').disabled=lab.b>=(lab.op==='-'?lab.a:10);
  }
  function playground(){store();setView('playground');renderLab();say('playground');}
  function celebrate(big){
    if(reduced)return;var c=$('celebration'),context=c.getContext('2d');if(!context)return;if(celebrationFrame)cancelAnimationFrame(celebrationFrame);
    var w=window.innerWidth,h=window.innerHeight,dpr=Math.min(window.devicePixelRatio||1,1.25);c.width=w*dpr;c.height=h*dpr;context.setTransform(dpr,0,0,dpr,0,0);
    var colors=['#a8c59a','#e9c982','#e5ad91','#bbd1cf','#d6bfd7'],pieces=[],count=big?65:23;for(var i=0;i<count;i++)pieces.push({x:w*.55,y:h*(big?.3:.48),vx:(Math.random()-.5)*(big?390:220),vy:-80-Math.random()*(big?240:140),r:3+Math.random()*4,a:Math.random()*6,t:1.1+Math.random()*.6,color:colors[i%colors.length]});
    var last=0;function draw(now){var dt=last?Math.min(.05,(now-last)/1000):.016;last=now;context.clearRect(0,0,w,h);var alive=0;pieces.forEach(function(p){p.t-=dt;if(p.t<=0)return;alive++;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=240*dt;p.a+=dt*2;context.save();context.globalAlpha=Math.min(1,p.t*3);context.translate(p.x,p.y);context.rotate(p.a);context.fillStyle=p.color;context.beginPath();context.ellipse(0,0,p.r,p.r*.55,0,0,Math.PI*2);context.fill();context.restore();});if(alive)celebrationFrame=requestAnimationFrame(draw);else{celebrationFrame=0;context.clearRect(0,0,w,h);}}
    celebrationFrame=requestAnimationFrame(draw);
  }
  document.addEventListener('click',function(e){
    var target=e.target.closest('button');if(!target||target.disabled)return;
    if(target.hasAttribute('data-activity'))begin(target.getAttribute('data-activity'));
    else if(target.hasAttribute('data-count')){stopCoach();markCount(Number(target.getAttribute('data-count')),true);}
    else if(target.hasAttribute('data-slot')){
      if(Core.toggleSlot(model,Number(target.getAttribute('data-slot')))){stopVoice();store();var slot=target.getAttribute('data-slot');$('question-stage').innerHTML=buildBoard();if(save.active.hint)showHint(false);say('number_'+save.active.builder);tone(420+save.active.builder*20,0,.13);var node=document.querySelector('[data-slot="'+slot+'"]');if(node&&e.detail===0)node.focus();}
    }else if(target.hasAttribute('data-choice'))submit(target.getAttribute('data-choice'));
    else if(target.hasAttribute('data-submit-build'))submit(String(save.active.builder));
    else if(target.hasAttribute('data-friend')){
      var friend=Core.friendFor(target.getAttribute('data-friend'));if(save.rounds>=friend.rounds){save.friend=friend.id;if(model)model.save.friend=friend.id;store();renderGarden();if(view==='home')renderHome();if(view==='lesson'){$('buddy-art').innerHTML=Art.friend(friend.id);$('buddy-name').textContent=friend.short.toUpperCase()+' · YOUR GARDEN PAL';}tone(660,0,.2);}
    }
  });
  $('start-btn').addEventListener('click',function(){begin('mix');});$('lesson-home-btn').addEventListener('click',goHome);$('playground-home-btn').addEventListener('click',goHome);$('playground-btn').addEventListener('click',playground);$('next-btn').addEventListener('click',advance);
  $('hint-btn').addEventListener('click',function(){unlockTone();showHint(true);});$('hear-btn').addEventListener('click',function(){if(!model)return;save.sound=true;store();if(model.phase==='question')say(Voice.prompt(model.q,true));});
  $('sound-btn').addEventListener('click',function(){save.sound=!save.sound;if(model)model.save.sound=save.sound;if(!save.sound)stopVoice();else{unlockTone();tone(660,0,.18);}store();});
  $('garden-btn').addEventListener('click',openGarden);$('reward-garden-btn').addEventListener('click',openGarden);$('close-garden-btn').addEventListener('click',closeGarden);$('reward-home-btn').addEventListener('click',goHome);$('another-btn').addEventListener('click',function(){begin(lastMode);});
  ['left-minus','left-plus','right-minus','right-plus'].forEach(function(id){$(id).addEventListener('click',function(){stopVoice();unlockTone();var first=id.indexOf('left')===0,delta=id.indexOf('minus')>=0?-1:1;if(first)lab.a=Core.clamp(lab.a+delta,0,10);else lab.b=Core.clamp(lab.b+delta,0,lab.op==='-'?lab.a:10);renderLab();tone(370+(first?lab.a:lab.b)*25,0,.13);});});
  $('lab-operation').addEventListener('click',function(){stopVoice();lab.op=lab.op==='+'?'-':'+';renderLab();tone(590,0,.14);});
  $('lab-hear').addEventListener('click',function(){save.sound=true;store();var result=lab.op==='+'?lab.a+lab.b:lab.a-lab.b;say(['discovery','number_'+lab.a,lab.op==='+'?'plus':'minus','number_'+lab.b,'equals','number_'+result]);});
  document.addEventListener('visibilitychange',function(){if(document.hidden){stopVoice();store();if(celebrationFrame){cancelAnimationFrame(celebrationFrame);celebrationFrame=0;var c=$('celebration'),x=c.getContext('2d');if(x)x.clearRect(0,0,c.width,c.height);}}});
  window.addEventListener('pagehide',store);window.addEventListener('keydown',function(e){
    if(e.key==='Escape'){if(!$('garden-modal').hidden)closeGarden();else if(!$('reward-modal').hidden)goHome();else if(view!=='home')goHome();return;}
    if(e.key==='Tab'){var modal=document.querySelector('.modal:not([hidden])');if(!modal)return;var all=modal.querySelectorAll('button:not([disabled])'),first=all[0],last=all[all.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  });
  $('art-defs').innerHTML=Art.defs;$('brand-art').innerHTML=Art.icon('flower');renderHome();updateHeader();
  window.NumberGarden={snapshot:function(){return{view:view,phase:model?model.phase:'home',blooms:save.rounds,discoveries:save.answers,friend:save.friend,seeds:seedCount(),question:model?JSON.parse(JSON.stringify(model.q)):null,active:save.active?JSON.parse(JSON.stringify(save.active)):null,voice:Voice.status(),lab:{a:lab.a,b:lab.b,op:lab.op,result:lab.op==='+'?lab.a+lab.b:lab.a-lab.b}};}};
}());
