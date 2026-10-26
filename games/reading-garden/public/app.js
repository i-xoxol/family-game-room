import {NAME,SOUNDS,LESSONS,WORDS,STORIES,CUES,LABELS,graphemes} from './content.mjs';
import {illustration,tree,mouth} from './art.mjs';
import {AudioBank} from './audio.mjs';
import {BlendGesture} from './blend.mjs';
import {STORAGE_KEY,freshProgress,parseProgress,completeWord,dayKey} from './progress.mjs';
const $=s=>document.querySelector(s),stage=$('#stage');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let progress=freshProgress();try{progress=parseProgress(localStorage.getItem(STORAGE_KEY),WORDS,STORIES.map(s=>s.id));}catch{}
let bank,view='home',lesson=LESSONS.find(l=>l.id===progress.lesson)||LESSONS[0],quest=null,phase='learn',selectedSound='m',soundGroup='lesson',lastDirection='home',renderToken=0,toastTimer,story=null,page=0,storyPart='text',saved=false;
function fit(){document.documentElement.style.setProperty('--height',`${Math.floor(window.visualViewport?.scale===1?window.visualViewport.height:innerHeight)}px`);}
fit();window.addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4500);}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(progress));}catch{toast('Progress can’t be saved on this browser. You can still play.');}$('#leaf-count').textContent=`${progress.leaves} ${progress.leaves===1?'leaf':'leaves'}`;}
function stop(){renderToken++;bank?.stop();}
function direction(id){lastDirection=id;return bank?.play('cue-'+id);}
function listen(id,label='Hear it',classes='speaker'){return `<button class="${classes}" data-audio="${esc(id)}" aria-label="${esc(label)}"><span aria-hidden="true">♫</span></button>`;}
function bindAudio(root=stage){root.querySelectorAll('[data-audio]').forEach(b=>b.addEventListener('click',()=>{if(view==='quest'&&phase==='choose')quest.hinted=true;bank.play(b.dataset.audio);}));}
function show(html){clearTimeout(questAdvanceTimer);stop();stage.innerHTML=html;stage.dataset.view=view;bindAudio();}
function shuffle(list){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function header(back,title,subtitle=''){return `<div class="screen-heading"><button id="back" class="back-button" aria-label="Go back">←</button><div><p class="eyebrow">${esc(subtitle)}</p><h1>${esc(title)}</h1></div></div>`;}
function back(action){$('#back')?.addEventListener('click',action);}
function home(speak=false){
  view='home';quest=null;
  const today=progress.days[dayKey()]||0;
  show(`<section class="home-layout"><div class="home-welcome"><p class="eyebrow">YOUR OWN LITTLE READING GARDEN</p><h1>Hello, ${NAME}.<br>Let’s grow a word.</h1><p class="home-copy">A sound. A word. A little more<br>you can read all by yourself.</p><div class="reading-tree">${tree(progress.leaves)}</div><div class="daily"><span>${Math.min(today,5)} of 5 little words today</span><div class="daily-leaves">${Array.from({length:5},(_,i)=>`<i class="${i<today?'earned':''}">❧</i>`).join('')}</div></div></div><div class="home-choices"><div class="start-quest"><p class="eyebrow">YOUR NEXT LITTLE QUEST</p><div class="quest-choice"><span class="vowel-badge" style="--lesson-color:${lesson.color}">${lesson.vowel||'sh'}</span><div><h2>${esc(lesson.title)}</h2><p>${esc(lesson.short)} · 3 words, then a sentence</p></div></div><button id="start-quest" class="primary">Start a little quest <span aria-hidden="true">→</span></button><button id="change-lesson" class="text-button">Choose another path</button></div><button id="sound-workshop" class="mode-button"><span class="mode-symbol" aria-hidden="true">a</span><span><strong>Sound workshop</strong><small>Hear it. See how to say it.</small></span><span aria-hidden="true">↗</span></button><button id="story-corner" class="mode-button"><span class="mode-symbol book-symbol" aria-hidden="true">▤</span><span><strong>Story corner</strong><small>Three little tales to share.</small></span><span aria-hidden="true">↗</span></button></div></section>`);
  $('#start-quest').onclick=startQuest;$('#change-lesson').onclick=chooseLesson;$('#sound-workshop').onclick=()=>soundWorkshop(true);$('#story-corner').onclick=()=>storyShelf(true);
  lastDirection='home';$('#footer-hint').textContent='No hurry. No lost lives. Just a little practice.';if(speak)direction('home');
}
function chooseLesson(){
  view='lessons';const available=LESSONS.filter(l=>!l.extension||progress.showTeams);
  show(`${header(true,'Choose a little path','ONE SHORT VOWEL AT A TIME')}<div class="lesson-grid">${available.map(l=>`<div class="lesson-card"><button data-lesson="${l.id}"><span class="vowel-badge" style="--lesson-color:${l.color}">${l.vowel||'sh'}</span><h2>${esc(l.title)}</h2><p>${esc(l.short)}</p><small>${l.words.filter(w=>progress.words[w]).length} of ${l.words.length} words practiced</small></button>${listen('lesson-'+l.id,'Hear '+l.title)}</div>`).join('')}</div>`);
  back(()=>home());stage.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>{lesson=LESSONS.find(l=>l.id===b.dataset.lesson);progress.lesson=lesson.id;save();home();bank.play('lesson-'+lesson.id);});lastDirection='practice';
}
let nextQuestAdvance=0,questAdvanceTimer;
function startQuest(){
  const words=lesson.words.map((word,i)=>({word,count:progress.words[word]?.practices||0,i})).sort((a,b)=>a.count-b.count||a.i-b.i).slice(0,3).map(x=>x.word);
  quest={words,index:0,hinted:false,built:[],slot:0,recorded:false,options:[],correct:false,retrySpoken:false};
  view='quest';phase='learn';nextQuestAdvance=0;
  // Download the small quest before the next interaction, including all sound
  // models. There is no hidden-letter stage or extra reveal button.
  bank.warm([...new Set(words.flatMap(word=>[...graphemes(word).map(g=>'sound-'+g),'word-'+word])),'cue-blend','cue-build','cue-choose']);
  renderQuest(true);
}
function questProgress(){return `<div class="quest-progress" aria-label="Word ${quest.index+1} of ${quest.words.length}">${quest.words.map((_,i)=>`<i class="${i<quest.index?'done':i===quest.index?'now':''}"></i>`).join('')}<span>Little word ${quest.index+1} of ${quest.words.length}</span></div>`;}
function currentWord(){return quest.words[quest.index];}
function tiles(gs,{slots=false}={}){
  return `<div class="sound-tiles ${slots?'build-slots':''}" aria-label="Sound boxes, left to right">${gs.map((g,i)=>`<button class="sound-tile ${g&&g.length>1?'digraph':''} ${g&&SOUNDS[g]?.kind==='vowel'?'vowel':''} ${slots&&i===quest.slot?'selected':''}" data-${slots?'slot':'sound-index'}="${i}" aria-label="${slots?'Sound box '+(i+1)+(g?', '+g:', empty'):'Hear sound '+g}"><span>${g||'·'}</span><i></i></button>`).join('')}</div>`;
}
function renderQuest(speak=false){
  const word=currentWord(),gs=graphemes(word),title=phase==='learn'?'Tap. Slide. Read.':phase==='build'?'Build the word.':phase==='choose'?'Find the word.':'You grew a word!';
  let body='';
  if(phase==='learn')body=`<p class="instruction">Tap a letter. Then move the arrow all the way across.</p>${tiles(gs)}<div id="blend-rail" class="blend-rail" role="slider" tabindex="0" aria-label="Slide the arrow from the first sound to the last to blend ${word}" aria-valuemin="0" aria-valuemax="${gs.length}" aria-valuenow="0" aria-valuetext="Start at the left arrow"><span class="rail-track"></span><span class="rail-handle" aria-hidden="true">→</span><span class="rail-label">start here · slide to the end →</span></div><div class="action-row"><button id="blend" class="secondary">♫ Blend for me</button><button id="whole-word" class="secondary word-listen">♫ Whole word</button></div><button id="continue" class="primary next-action">Let’s build it <span>→</span></button>`;
  if(phase==='build'){
    if(!quest.built.length)quest.built=Array(gs.length).fill(null);
    if(!quest.bank){const extra=graphemes(lesson.words[(quest.index+2)%lesson.words.length]);quest.bank=shuffle([...new Set([...gs,...extra])].slice(0,6));}
    body=`<section class="word-builder" aria-label="Build the word"><div class="build-prompt"><button id="build-word" class="hear-word-button" aria-label="Hear the word to build"><span class="hear-icon" aria-hidden="true">🔊</span><strong>Hear the word</strong><small>Tap to hear it again</small></button><p class="feedback" id="feedback" role="status">Listen, then choose the letters.</p><div class="build-tools"><button id="build-hint" class="text-button">♫ Help me start</button><button id="undo" class="text-button">↶ Change a sound</button></div></div><div class="build-workbench"><p class="build-instruction">One sound in each box</p>${tiles(quest.built,{slots:true})}<div class="letter-bank" aria-label="Letters to build the word">${quest.bank.map(g=>`<button data-letter="${g}" class="letter-choice ${SOUNDS[g].kind==='vowel'?'vowel':''}">${g}</button>`).join('')}</div><button id="continue" class="primary next-action" ${quest.correct?'':'disabled'}>Now find it <span>→</span></button></div></section>`;
  }
  if(phase==='choose'){
    if(!quest.options.length){const distance=w=>{const other=graphemes(w);return gs.reduce((n,g,i)=>n+(g===other[i]?0:1),0)+Math.abs(gs.length-other.length);};const others=shuffle(lesson.words.filter(w=>w!==word)).sort((a,b)=>distance(a)-distance(b)).slice(0,2);quest.options=shuffle([word,...others]);}
    body=`<p class="instruction">Hear the word. Find it with your reading eyes.</p><button id="target-word" class="round-listen" aria-label="Hear the word to find">♫</button><div class="word-options">${quest.options.map(w=>`<div class="word-option"><button data-word="${w}" class="printed-word">${w}</button>${listen('word-'+w,'Help: hear '+w)}</div>`).join('')}</div><p class="feedback" id="feedback">You can sound out every choice.</p>`;
  }
  if(phase==='success')body=`<div class="success-leaf" aria-hidden="true">❧</div><div class="success-word">${word}</div><p class="feedback">${quest.hinted?'You used help and kept going.':'You checked the sounds carefully.'}</p>${listen('word-'+word,'Hear '+word,'secondary word-listen')}<button id="continue" class="primary next-action">${quest.index===quest.words.length-1?'A little sentence':'Next little word'} <span>→</span></button>`;
  const step=phase==='learn'?0:phase==='build'?1:2;
  show(`<section class="quest-layout"><aside class="quest-sidebar"><button id="back" class="back-button" aria-label="Go back to the reading garden">←</button><p class="eyebrow">${esc(lesson.short.toUpperCase())}</p><h1>${title}</h1><div class="quest-steps" aria-label="${['Sounds','Build','Find'][step]}, step ${step+1} of 3">${['Sounds','Build','Find'].map((label,i)=>`<span class="${i===step?'current':i<step?'done':''}"><b>${i+1}</b>${label}</span>`).join('')}</div><div class="guide-art">${tree(progress.leaves)}</div>${questProgress()}<p class="sidebar-note">${phase==='learn'?'Tap a letter to hear its sound.':phase==='build'?'Read from left to right.':phase==='choose'?'Look at all the letters.':'One small step, Eric.'}</p></aside><div class="activity" data-phase="${phase}">${body}</div></section>`);
  back(()=>home());bindQuest(word,gs);$('#footer-hint').textContent='Sounds first. Blend them. Then read the whole word.';
  lastDirection=phase==='learn'?'blend':phase==='build'?'build':phase==='choose'?'choose':'next';
  if(speak){if(phase==='build')bank.play('word-'+word);else direction(lastDirection);}
}
function bindQuest(word,gs){
  const currentQuest=quest,boundPhase=phase,token=renderToken,gesture=new BlendGesture(gs.length);
  let action=0,transport=null,pointer=null,lastLetter='',lastLetterAt=0;
  const alive=id=>token===renderToken&&quest===currentQuest&&phase===boundPhase&&(id===undefined||id===action);
  const activate=i=>stage.querySelectorAll('.sound-tile').forEach((button,n)=>button.classList.toggle('active',i===n||i===gs.length));
  const rail=$('#blend-rail');
  const position=fraction=>{if(!rail)return;rail.style.setProperty('--position',`${fraction*100}%`);rail.style.setProperty('--fraction',String(fraction));rail.setAttribute('aria-valuenow',String(Math.round(fraction*gs.length)));rail.setAttribute('aria-valuetext',fraction===1?'The word is blended':fraction===0?'Start at the left arrow':`Sound ${Math.min(gs.length,Math.floor(fraction*gs.length)+1)} of ${gs.length}`);};
  function startAction(){action++;activate(-1);gesture.cancel();pointer=null;transport?.cancel();transport=null;rail?.classList.remove('dragging');$('#blend')?.removeAttribute('disabled');return action;}
  function preview(id,index=-1){const own=startAction();activate(-1);bank.play(id,{onStart:()=>{if(alive(own))activate(index);}}).then(()=>{if(alive(own))activate(-1);});}
  function playQueue({followAudio=false}={}){
    const own=startAction();activate(-1);
    const queue=bank.queue(i=>{if(alive(own)){activate(i);if(followAudio&&i>=0)position(i>=gs.length?1:(i+.5)/gs.length);}});transport=queue;
    queue.done.then(()=>{if(alive(own)){activate(-1);$('#blend')?.removeAttribute('disabled');rail?.classList.remove('dragging');}});
    return queue;
  }
  stage.querySelectorAll('[data-sound-index]').forEach(button=>button.onclick=()=>preview('sound-'+gs[Number(button.dataset.soundIndex)],Number(button.dataset.soundIndex)));
  function blend(){
    const queue=playQueue({followAudio:true});position(0);$('#blend').disabled=true;
    gs.forEach((g,i)=>queue.append('sound-'+g,i));queue.append('word-'+word,gs.length);queue.close();
  }
  $('#blend')?.addEventListener('click',blend);$('#whole-word')?.addEventListener('click',()=>preview('word-'+word,gs.length));
  if(rail){
    const fraction=e=>{const rect=rail.getBoundingClientRect();return Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));};
    const enqueue=result=>result.sounds.forEach(i=>transport.append('sound-'+gs[i],i));
    const move=e=>{if(pointer!==e.pointerId||!gesture.active)return;const result=gesture.move(fraction(e));position(result.position);enqueue(result);};
    rail.onpointerdown=e=>{
      if(e.isPrimary===false)return;e.preventDefault();const queue=playQueue(),result=gesture.begin(fraction(e));position(0);enqueue(result);
      if(!result.dragging){$('.rail-label').textContent='Start at the arrow on the left →';queue.close();return;}
      $('.rail-label').textContent='slide all the way to the end →';pointer=e.pointerId;rail.setPointerCapture?.(pointer);rail.classList.add('dragging');
    };
    rail.onpointermove=move;
    rail.onpointerup=e=>{
      if(pointer!==e.pointerId||!gesture.active)return;move(e);const result=gesture.end();pointer=null;position(result.position);rail.classList.remove('dragging');
      if(result.complete)transport.append('word-'+word,gs.length);
      transport.close();$('.rail-label').textContent=result.complete?'You blended the word!':'start here · slide to the end →';
    };
    const cancel=()=>{if(gesture.active){startAction();position(0);activate(-1);}};
    rail.onpointercancel=cancel;rail.onlostpointercapture=cancel;
    rail.onkeydown=e=>{
      if(e.repeat)return;
      if(['Enter',' '].includes(e.key)){e.preventDefault();blend();}
      else if(e.key==='Home'){e.preventDefault();startAction();position(0);activate(-1);}
      else if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const value=Number(rail.getAttribute('aria-valuenow'));const i=Math.max(0,Math.min(gs.length-1,value+(e.key==='ArrowRight'?0:-2)));preview('sound-'+gs[i],i);position((i+1)/gs.length);}
    };
  }
  function setNextAvailability(){
    const button=$('#continue');if(!button)return;
    const wait=Math.max(0,nextQuestAdvance-performance.now());button.disabled=(phase==='build'&&!quest.correct)||wait>0;
    clearTimeout(questAdvanceTimer);if(wait)questAdvanceTimer=setTimeout(()=>{if(alive())button.disabled=phase==='build'&&!quest.correct;},wait+5);
  }
  function updateBuild(message='',wrong=-1){
    stage.querySelectorAll('[data-slot]').forEach((button,i)=>{
      const g=quest.built[i];button.querySelector('span').textContent=g||'·';button.setAttribute('aria-label',`Sound box ${i+1}${g?', '+g:', empty'}`);
      button.classList.toggle('vowel',!!g&&SOUNDS[g].kind==='vowel');button.classList.toggle('digraph',!!g&&g.length>1);button.classList.toggle('selected',i===quest.slot&&!quest.correct);button.classList.toggle('needs-help',i===wrong);
    });
    stage.querySelectorAll('[data-letter]').forEach(button=>button.disabled=quest.correct);
    if(message)$('#feedback').textContent=message;setNextAvailability();
  }
  stage.querySelectorAll('[data-slot]').forEach(button=>button.onclick=()=>{
    quest.slot=Number(button.dataset.slot);updateBuild();const g=quest.built[quest.slot];if(g)preview('sound-'+g,quest.slot);
  });
  stage.querySelectorAll('[data-letter]').forEach(button=>button.onclick=()=>{
    if(quest.correct)return;const g=button.dataset.letter,now=performance.now();if(g===lastLetter&&now-lastLetterAt<220)return;lastLetter=g;lastLetterAt=now;
    const filledSlot=quest.slot;quest.built[filledSlot]=g;
    const wrong=quest.built.findIndex((x,i)=>x!==null&&x!==gs[i]),next=quest.built.findIndex(x=>x===null),complete=next<0;
    quest.slot=next>=0?next:Math.max(0,wrong);quest.correct=complete&&wrong<0;
    if(!transport||!transport.append('sound-'+g,filledSlot)){const queue=playQueue();queue.append('sound-'+g,filledSlot);}
    if(quest.correct){updateBuild('You built it, Eric!');transport.append('word-'+word,gs.length);transport.close();}
    else if(complete){quest.hinted=true;updateBuild('Try a different sound in the glowing box.',wrong);if(!quest.retrySpoken){quest.retrySpoken=true;transport.append('cue-buildRetry',-1);}transport.close();}
    else updateBuild('Choose the sounds from left to right.');
  });
  $('#build-word')?.addEventListener('click',()=>preview('word-'+word));
  $('#undo')?.addEventListener('click',()=>{
    const filled=quest.built.map((x,i)=>x?i:-1).filter(i=>i>=0),i=quest.built[quest.slot]?quest.slot:filled[filled.length-1];
    if(i===undefined)return;startAction();bank.stop();quest.correct=false;quest.built[i]=null;quest.slot=i;updateBuild('Choose a new sound for this box.');
  });
  $('#build-hint')?.addEventListener('click',()=>{
    quest.hinted=true;const i=quest.built.findIndex((x,i)=>x!==gs[i]);
    if(i>=0){quest.slot=i;updateBuild('Listen to this sound, then choose its letter.',i);preview('sound-'+gs[i],i);}
  });
  $('#target-word')?.addEventListener('click',()=>preview('word-'+word));
  stage.querySelectorAll('[data-word]').forEach(button=>button.onclick=()=>{
    if(quest.correct)return;
    if(button.dataset.word!==word){quest.hinted=true;button.classList.add('try-again');button.disabled=true;$('#feedback').textContent='Look closely. Sound it out and try again.';bank.play('cue-retry');return;}
    quest.correct=true;if(!quest.recorded){completeWord(progress,word,quest.hinted);quest.recorded=true;save();}
    nextQuestAdvance=performance.now()+450;phase='success';renderQuest();celebrate();bank.play(quest.hinted?'cue-supported':'cue-correct'+(quest.index%3+1));
  });
  setNextAvailability();
  $('#continue')?.addEventListener('click',()=>{
    if(!alive()||performance.now()<nextQuestAdvance||(phase==='build'&&!quest.correct))return;
    nextQuestAdvance=performance.now()+400;
    if(phase==='learn'){phase='build';quest.correct=false;renderQuest(true);}
    else if(phase==='build'){phase='choose';quest.correct=false;renderQuest();bank.sequence(['cue-choose','word-'+word]);}
    else if(phase==='success'){
      if(quest.index===quest.words.length-1){readSentence();return;}
      quest.index++;Object.assign(quest,{hinted:false,built:[],slot:0,bank:null,options:[],correct:false,recorded:false,retrySpoken:false});phase='learn';renderQuest(true);
    }
  });
}

function highlight(index){stage.querySelectorAll('[data-token]').forEach(b=>b.classList.toggle('reading-now',Number(b.dataset.token)===index));}
function tokenText(text){return text.split(/\s+/).map((w,i)=>`<button class="read-token" data-token="${i}">${esc(w)}</button>`).join(' ');}
function bindTokens(audioId){stage.querySelectorAll('[data-token]').forEach(b=>b.onclick=()=>bank.word(audioId,Number(b.dataset.token),highlight));}
function readSentence(){
  view='sentence';const id='sentence-'+lesson.id;
  show(`${header(true,'Put your words together','A LITTLE SENTENCE')}<section class="sentence-layout"><div class="sentence-words">${tokenText(lesson.sentence)}</div><p>Tap a word for help. Listen, then try reading it.</p><div class="action-row"><button id="sentence-play" class="secondary">♫ Read with me</button><button id="sentence-said" class="primary">I tried reading it →</button></div></section>`);
  back(()=>home());bindTokens(id);$('#sentence-play').onclick=()=>bank.play(id,{onWord:highlight});$('#sentence-said').onclick=()=>questDone();lastDirection='sentence';direction('sentence');
}
function questDone(){view='complete';show(`<section class="completion"><p class="eyebrow">YOUR PRACTICE IS GROWING</p><div class="completion-tree">${tree(progress.leaves)}</div><h1>Three little words.<br>A bigger reading garden.</h1><p>You listened, blended, and kept trying, Eric.</p><div class="action-row"><button id="another" class="primary">Another little quest →</button><button id="done-home" class="secondary">Back to my garden</button></div></section>`);$('#another').onclick=startQuest;$('#done-home').onclick=()=>home();lastDirection='done';direction('done');celebrate();}
function soundWorkshop(speak=false){
  view='sounds';let sounds=soundGroup==='vowels'?['a','e','i','o','u']:soundGroup==='all'?Object.keys(SOUNDS).filter(g=>progress.showTeams||!['sh','ch','th','ck','qu','x'].includes(g)):[...new Set(lesson.words.flatMap(graphemes))];
  if(!sounds.includes(selectedSound))selectedSound=sounds[0];const s=SOUNDS[selectedSound];
  show(`${header(true,'Sound workshop','A LETTER HAS A NAME AND A SOUND')}<div class="sound-layout"><div class="sound-picker"><div class="tab-row"><button data-group="lesson" class="${soundGroup==='lesson'?'selected':''}">This path</button><button data-group="vowels" class="${soundGroup==='vowels'?'selected':''}">Vowels</button><button data-group="all" class="${soundGroup==='all'?'selected':''}">More sounds</button></div><div class="sound-grid">${sounds.map(g=>`<button data-pick="${g}" class="${g===selectedSound?'selected':''} ${SOUNDS[g].kind==='vowel'?'vowel':''}">${g}</button>`).join('')}</div></div><section class="sound-detail"><div class="letter-pair"><span>${selectedSound.toUpperCase()}</span> ${selectedSound}</div><p class="sound-keyword">${esc(s.keyword)} · ${s.count===2?'two sounds':s.kind==='vowel'?'short vowel sound':selectedSound.length>1?'two letters, one sound':'one sound'}</p><div class="mouth-demo">${mouth(s.kind,selectedSound)}</div><p class="pronunciation-hint">${esc(s.hint)}</p><div class="action-row"><button id="hear-sound" class="primary">♫ Hear the sound</button><button id="hear-hint" class="secondary">Show me how ♫</button></div><button id="hear-name" class="text-button">Hear the letter name and its word</button></section></div>`);
  back(()=>home());stage.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>{soundGroup=b.dataset.group;soundWorkshop();});stage.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{selectedSound=b.dataset.pick;soundWorkshop();bank.play('sound-'+selectedSound);});$('#hear-sound').onclick=()=>bank.play('sound-'+selectedSound);$('#hear-hint').onclick=()=>bank.play('hint-'+selectedSound);$('#hear-name').onclick=()=>bank.sequence(['letter-'+selectedSound,'sound-'+selectedSound]);lastDirection='sounds';if(speak)direction('sounds');
}
function storyShelf(speak=false){view='stories';show(`${header(true,'The story corner','LISTEN. FOLLOW. READ A LITTLE TOGETHER.')}<div class="story-shelf">${STORIES.map(s=>`<article class="story-book"><button data-story="${s.id}"><div class="book-cover" style="background:${s.color}26">${illustration(s.pages[0].picture)}</div><h2>${esc(s.title)}</h2><p>${esc(s.subtitle)}</p><small>${progress.stories[s.id]?'Read together before · Read it again':'6 little pages · Your reading turns, too'}</small></button>${listen('title-'+s.id,'Hear '+s.title)}</article>`).join('')}</div>`);back(()=>home());stage.querySelectorAll('[data-story]').forEach(b=>b.onclick=()=>{story=STORIES.find(s=>s.id===b.dataset.story);page=0;storyPart='text';storyPage();bank.play('title-'+story.id);});lastDirection='storyIntro';if(speak)direction('storyIntro');}
function storyPage(){
  view='story';const p=story.pages[page],id=`${storyPart==='text'?'story':'read'}-${story.id}-${page}`;
  show(`<section class="storybook"><aside class="story-art"><button id="back" class="back-button" aria-label="Back to the story corner">←</button><p class="eyebrow">${esc(story.title.toUpperCase())}</p><div class="story-illustration">${illustration(p.picture)}</div><span class="page-count">Page ${page+1} of ${story.pages.length}</span><div class="page-dots">${story.pages.map((_,i)=>`<i class="${i===page?'current':''}"></i>`).join('')}</div></aside><div class="story-reading"><p class="eyebrow">${storyPart==='text'?'LISTEN AND FOLLOW THE GLOWING WORDS':'YOUR TURN, ERIC'}</p><div class="story-words ${storyPart==='read'?'child-turn':''}">${tokenText(storyPart==='text'?p.text:p.read)}</div><div class="story-controls"><button id="story-play" class="secondary">♫ ${storyPart==='text'?'Read to me':'Read with me'}</button><button id="story-pause" class="text-button">Pause</button></div><div class="page-actions"><button id="previous-page" class="text-button" ${page===0&&storyPart==='text'?'disabled':''}>← Back</button><button id="next-page" class="primary">${storyPart==='text'?'My reading turn':page===story.pages.length-1?'Think about the story':'Next page'} <span>→</span></button></div><p class="story-note">${storyPart==='text'?'Tap any word to hear it again.':'Try it first. A grown-up can listen with you.'}</p></div></section>`);
  back(()=>storyShelf());bindTokens(id);let pausedAt=0;$('#story-play').onclick=()=>{const start=pausedAt;pausedAt=0;$('#story-play').textContent='♫ '+(storyPart==='text'?'Read to me':'Read with me');bank.play(id,{start,onWord:highlight});};$('#story-pause').onclick=()=>{pausedAt=bank.currentId===id?bank.currentTime:0;bank.stop();$('#story-play').textContent='♫ Continue reading';};
  if(storyPart==='text'){const all=document.createElement('button');all.className='text-button';all.textContent='Read all pages →';all.id='story-all';all.onclick=autoStory;$('.story-controls').append(all);}
  $('#previous-page').onclick=()=>{if(storyPart==='read'){storyPart='text';}else{page--;storyPart='read';}storyPage();};$('#next-page').onclick=()=>{if(storyPart==='text'){storyPart='read';storyPage();direction('yourTurn');}else if(page===story.pages.length-1){storyQuestion();}else{page++;storyPart='text';storyPage();}};lastDirection=storyPart==='text'?'storyIntro':'yourTurn';$('#footer-hint').textContent='Listening text is richer. Your reading turns use simpler words.';bank.warm([id]);
}
async function autoStory(){
  const chosen=story.id;storyPart='text';storyPage();const token=renderToken;
  const played=await bank.play(`story-${story.id}-${page}`,{onWord:highlight});
  if(!played||token!==renderToken||view!=='story'||story.id!==chosen)return;
  if(page<story.pages.length-1){page++;autoStory();}else storyQuestion();
}
function storyQuestion(){
  view='story-question';show(`${header(true,'Think about our story','YOU LISTENED TO A WHOLE LITTLE TALE')}<section class="story-question"><h2>${esc(story.question)} ${listen('question-'+story.id,'Hear the question')}</h2><div class="story-answers">${shuffle(story.options.map((text,index)=>({text,index}))).map((o,i)=>`<div><button data-answer="${o.index}" class="secondary">${esc(o.text)}</button>${listen(`option-${story.id}-${o.index}`,'Hear answer '+(i+1))}</div>`).join('')}</div><p id="feedback" class="feedback"></p><button id="story-finish" class="primary" hidden>Back to the story corner →</button></section>`);back(()=>storyPage());stage.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{if(Number(b.dataset.answer)!==story.answer){b.disabled=true;$('#feedback').textContent='Think about what happened. You can try again.';bank.play('cue-storyRetry');return;}progress.stories[story.id]=(progress.stories[story.id]||0)+1;save();stage.querySelectorAll('[data-answer]').forEach(x=>x.disabled=true);$('#feedback').textContent='You thought about the story, Eric!';$('#story-finish').hidden=false;bank.play('cue-storyDone');celebrate();});$('#story-finish').onclick=()=>storyShelf();lastDirection='storyQuestion';bank.play('question-'+story.id);
}
function celebrate(){const el=$('#celebration');el.replaceChildren();for(let i=0;i<7;i++){const bit=document.createElement('i');bit.textContent='❧';bit.style.left=`${25+Math.random()*50}%`;bit.style.animationDelay=`${Math.random()*.3}s`;el.append(bit);}setTimeout(()=>el.replaceChildren(),1800);}
function parents(){
  bank?.stop();const practiced=Object.values(progress.words).reduce((n,w)=>n+w.practices,0),matches=Object.values(progress.words).reduce((n,w)=>n+w.matches,0);
  $('#parent-body').innerHTML=`<p>This garden is set up for <strong>Eric: knows letters, beginning to blend</strong>. It uses original US English phonics practice that reinforces Hamden’s published approach.</p><div class="parent-stat-row"><div><strong>${Object.keys(progress.words).length}</strong><span>different words practiced</span></div><div><strong>${practiced}</strong><span>completed word practices</span></div><div><strong>${matches}</strong><span>matches without an answer hint</span></div></div><p>These are practice records, not a reading assessment. The game does not listen to, record, or score Eric’s voice. “I tried reading it” is an invitation to practice, not proof of correct pronunciation.</p><label class="setting"><input id="teams-setting" type="checkbox" ${progress.showTeams?'checked':''}> Show the later “two letters, one sound” path</label><h3>A useful little routine</h3><ol><li>Hear and tap each sound from left to right.</li><li>Blend the sounds smoothly, then say the whole word.</li><li>Build and recognize the word. Use help whenever needed.</li><li>Read the short sentence together, then enjoy a story.</li></ol><p>Keep stop sounds short and avoid adding a strong “uh.” In sound boxes, <strong>sh</strong> or <strong>ck</strong> takes one box because it represents one sound. X and qu can represent two sounds and are kept out of starter words.</p><p>All narration and phoneme audio was prepared in advance. There are no live AI calls, ads, analytics, purchases, or microphone permissions. Progress stays in this browser; another iPad has its own garden.</p><p>Stories have richer listening text and separate simple reading turns. Narration highlights are based on saved speech timestamps. The mouth pictures are simple reminders, not precise speech-therapy diagrams.</p><p><a href="./research.html" target="_blank" rel="noopener">Teaching rationale and sources ↗</a></p><button id="reset-progress" class="danger">Reset this browser’s practice records</button>`;
  $('#teams-setting').onchange=e=>{progress.showTeams=e.target.checked;if(!progress.showTeams&&lesson.extension){lesson=LESSONS[0];progress.lesson=lesson.id;}save();};$('#reset-progress').onclick=()=>{if(confirm('Reset Eric’s practice records on this browser? This cannot be undone.')){progress=freshProgress();lesson=LESSONS[0];save();$('#parent-dialog').close();home();}};$('#parent-dialog').showModal();
}
$('#home').onclick=()=>home(true);$('#parents').onclick=parents;$('#close-parents').onclick=()=>$('#parent-dialog').close();$('#audio-toggle').onclick=()=>{if(!bank)return;bank.enabled=!bank.enabled;bank.stop();$('#audio-toggle').setAttribute('aria-pressed',String(bank.enabled));$('#audio-toggle').setAttribute('aria-label',bank.enabled?'Turn sound off':'Turn sound on');$('#audio-toggle').textContent=bank.enabled?'♪':'♫';};$('#repeat-direction').onclick=()=>direction(lastDirection);
$('#start').onclick=()=>{bank?.unlock();$('#welcome').hidden=true;home();direction('welcome');};
document.addEventListener('visibilitychange',()=>{if(document.hidden)bank?.stop();});window.addEventListener('pagehide',()=>bank?.stop());
const orientation=matchMedia('(orientation: portrait)'),rotated=e=>{if(e.matches)bank?.stop();};if(orientation.addEventListener)orientation.addEventListener('change',rotated);else orientation.addListener(rotated);
async function boot(){try{const r=await fetch('./audio-manifest.json',{credentials:'same-origin'});if(!r.ok)throw new Error('The sound library is not ready. Please try reloading.');const manifest=await r.json();bank=new AudioBank(manifest,{onError:toast,onSpeaking:value=>{document.body.classList.toggle('speaking',value);document.body.dataset.audio=value?bank.currentId:'';if(value)document.body.dataset.lastAudio=bank.currentId;const target=$('#build-word');if(target){const playing=value&&view==='quest'&&phase==='build'&&bank.currentId==='word-'+currentWord();target.classList.toggle('playing',playing);target.setAttribute('aria-busy',String(playing));}}});await bank.warm(['cue-welcome','cue-home']);home();save();$('#start').disabled=false;$('#start').textContent='Let’s grow a word →';}catch(e){$('#start').textContent='Reload the sound library';$('#start').disabled=false;$('#start').onclick=()=>location.reload();toast(e.message);}}
boot();
