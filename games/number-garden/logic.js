(function(root,factory){'use strict';var api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GardenMath=api;}(typeof window!=='undefined'?window:this,function(){
  'use strict';
  var IDS=['count','add','subtract','compare','pattern','shape'];
  var SKILLS={
    count:{name:'Counting Cove',short:'Counting',tag:'COUNT & DISCOVER',icon:'berry',color:'peach',description:'One, two… a basketful of wonder.'},
    add:{name:'Adding Orchard',short:'Adding',tag:'PUT THINGS TOGETHER',icon:'apple',color:'mint',description:'Little groups make big discoveries.'},
    subtract:{name:'Take-away Trail',short:'Taking away',tag:'SEE WHAT IS LEFT',icon:'carrot',color:'butter',description:'Some hop away. How many stay?'},
    compare:{name:'Meadow Match',short:'Comparing',tag:'LOOK, MATCH & COMPARE',icon:'butterfly',color:'sky',description:'More, fewer, or just the same?'},
    pattern:{name:'Pattern Parade',short:'Patterns',tag:'SPOT WHAT COMES NEXT',icon:'flower',color:'lilac',description:'Find the rhythm. Keep it going.'},
    shape:{name:'Shape Safari',short:'Shapes',tag:'MEET THE SHAPE FRIENDS',icon:'shapes',color:'rose',description:'A world of circles, corners & curves.'}
  };
  var FRIENDS=[
    {id:'fox',name:'Pip the fox',short:'Pip',rounds:0,description:'Your curious counting companion.'},
    {id:'bunny',name:'Momo the bunny',short:'Momo',rounds:1,description:'A little hopper with big ideas.'},
    {id:'ladybug',name:'Dot the ladybug',short:'Dot',rounds:2,description:'There is always something to count.'},
    {id:'snail',name:'Nori the snail',short:'Nori',rounds:3,description:'Wonderful things take their time.'},
    {id:'bee',name:'Buzz the bee',short:'Buzz',rounds:4,description:'Small steps. Sweet discoveries.'},
    {id:'owl',name:'Olive the owl',short:'Olive',rounds:5,description:'A bright little friend full of wonder.'}
  ];
  var SHAPES={circle:{name:'circle',hint:'A circle is round. It has no corners.',explain:'A circle is one round curve.'},triangle:{name:'triangle',hint:'A triangle has three straight sides and three corners.',explain:'A triangle has 3 sides and 3 corners.'},square:{name:'square',hint:'A square has four equal sides and four corners.',explain:'A square has 4 equal sides.'},rectangle:{name:'long rectangle',hint:'Look for four corners, with two longer sides and two shorter sides.',explain:'This long rectangle has 4 corners and two longer sides.'},hexagon:{name:'hexagon',hint:'A hexagon has six straight sides. Count them slowly.',explain:'A hexagon has 6 sides and 6 corners.'}};
  var TOKEN_NAMES={leaf:'leaf',flower:'flower',berry:'berry',star:'star'};
  function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
  function int(v,a,b,fallback){var n=Number(v);return Number.isFinite(n)?clamp(Math.floor(n),a,b):fallback;}
  function seeded(seed){seed=seed>>>0;return function(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
  function pick(a,r){return a[Math.floor(r()*a.length)];}
  function shuffle(a,r){var out=a.slice();for(var i=out.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),v=out[i];out[i]=out[j];out[j]=v;}return out;}
  function between(r,a,b){return a+Math.floor(r()*(b-a+1));}
  function blankSave(){var skills={};IDS.forEach(function(id){skills[id]={level:0,streak:0,supported:0,independent:0,solved:0};});return{version:1,rounds:0,answers:0,friend:'fox',sound:true,voice:true,skills:skills,recent:[],active:null};}
  function cleanSave(raw){
    var save=blankSave();
    try{
      var v=typeof raw==='string'?JSON.parse(raw):raw;if(!v||v.version!==1)return save;
      save.rounds=int(v.rounds,0,9999,0);save.answers=int(v.answers,save.rounds*5,999999,save.rounds*5);save.sound=v.sound!==false;save.voice=v.voice!==false;
      FRIENDS.forEach(function(f){if(v.friend===f.id&&save.rounds>=f.rounds)save.friend=f.id;});
      IDS.forEach(function(id){var x=v.skills&&v.skills[id];if(x)save.skills[id]={level:int(x.level,0,2,0),streak:int(x.streak,0,2,0),supported:int(x.supported,0,1,0),independent:int(x.independent,0,99999,0),solved:int(x.solved,0,99999,0)};});
      if(Array.isArray(v.recent))save.recent=v.recent.filter(function(s){return typeof s==='string'&&s.length<160;}).slice(-12);
      var a=v.active;
      if(a&&Array.isArray(a.queue)&&a.queue.length===5&&a.queue.every(function(k){return IDS.indexOf(k)>=0;})&&Number.isInteger(a.index)&&a.index>=0&&a.index<5&&Number.isFinite(a.seed)){
        save.active={mode:IDS.indexOf(a.mode)>=0?a.mode:'mix',queue:a.queue.slice(),index:a.index,seed:a.seed>>>0,level:int(a.level,0,2,0),attempts:int(a.attempts,0,3,0),hint:!!a.hint,rejected:Array.isArray(a.rejected)?a.rejected.filter(function(x){return typeof x==='string'&&x.length<30;}).slice(0,22):[],touched:Array.isArray(a.touched)?a.touched.filter(function(x,i,arr){return Number.isInteger(x)&&x>=0&&x<20&&arr.indexOf(x)===i;}):[],builder:int(a.builder,0,20,0),filled:Array.isArray(a.filled)?a.filled.filter(function(x,i,arr){return Number.isInteger(x)&&x>=0&&x<20&&arr.indexOf(x)===i;}):[]};
      }
    }catch(_){}
    return save;
  }
  function friendFor(id){return FRIENDS.filter(function(f){return f.id===id;})[0]||FRIENDS[0];}
  function numbers(answer,max,r){var pool=[];for(var i=0;i<=max;i++)if(i!==answer)pool.push(i);pool.sort(function(a,b){return Math.abs(a-answer)-Math.abs(b-answer);});var near=shuffle(pool.slice(0,Math.min(5,pool.length)),r).slice(0,2);return shuffle([answer].concat(near),r).map(function(n){return{id:String(n),label:String(n),number:n};});}
  function makeQuestion(kind,level,seed){
    level=clamp(level||0,0,2);var r=seeded(seed),q={kind:kind,level:level,seed:seed>>>0,format:'choice',icon:'berry',groups:[],choices:[],answer:'',title:'',detail:'',speech:'',hint:'',explanation:''};
    if(IDS.indexOf(kind)<0)throw new Error('Unknown learning activity');
    var max,n,a,b;
    if(kind==='count'){
      max=[5,10,20][level];n=between(r,level?0:1,max);q.format=r()<.36?'build':'choice';q.n=n;q.frameSize=n>10?20:10;
      q.title=q.format==='build'?'Can you make a basket of '+n+'?':'How many berries are here?';
      q.detail=q.format==='build'?'Tap a space to add a berry. Tap a berry to take it out.':'Touch each berry once to count it.';
      q.speech=q.format==='build'?'Put '+n+' berries in the basket. Then tap All done.':'How many berries are here? Touch them to count, then choose a number.';
      q.hint=n===0?'An empty basket has zero berries.':q.format==='build'?'Fill one space for each number. Stop when you reach '+n+'.':'Touch each berry once. The last number you say tells how many.';
      q.explanation=n===0?'An empty basket has 0 berries.':'There '+(n===1?'is 1 berry.':'are '+n+' berries.');
      q.groups=[{n:n,icon:'berry',tone:'peach'}];q.answer=String(n);q.choices=numbers(n,max,r);
    }else if(kind==='add'){
      max=[5,8,10][level];a=between(r,1,max-1);b=between(r,1,max-a);if(level>0&&r()<.2){if(r()<.5)a=0;else b=0;}
      q.a=a;q.b=b;q.title='How many altogether?';q.detail=a+' in one basket. '+b+' in the other. Put them together.';
      q.speech='Pip has '+a+' berries. Momo has '+b+' more. How many berries are there altogether?';q.hint='Count the first group, then keep counting through the second group.';
      q.explanation=a+' and '+b+' make '+(a+b)+'. '+a+' + '+b+' = '+(a+b)+'.';q.groups=[{n:a,icon:'berry',tone:'peach'},{n:b,icon:'berry',tone:'mint'}];q.answer=String(a+b);q.choices=numbers(a+b,max,r);
    }else if(kind==='subtract'){
      max=[5,8,10][level];a=between(r,1,max);b=between(r,level&&r()<.2?0:1,a);
      q.a=a;q.b=b;q.icon='carrot';q.title='How many are left?';q.detail=b+' '+(b===1?'carrot goes':'carrots go')+' to the picnic. Count the ones that stay.';
      q.speech='There are '+a+' carrots. '+b+' go to the picnic. How many carrots are left?';q.hint='The faded carrots went to the picnic. Touch and count only the carrots that are left.';
      q.explanation=a+' take away '+b+' leaves '+(a-b)+'. '+a+' − '+b+' = '+(a-b)+'.';q.groups=[{n:a,removed:b,icon:'carrot',tone:'butter'}];q.answer=String(a-b);q.choices=numbers(a-b,max,r);
    }else if(kind==='compare'){
      max=[5,8,10][level];a=between(r,level?0:1,max);b=between(r,level?0:1,max);q.a=a;q.b=b;q.ask=r()<.5?'more':'fewer';
      q.title='Which basket has '+q.ask.toUpperCase()+'?';q.detail='Look at both baskets. They might have the same number.';q.speech='Which basket has '+q.ask+' berries? Or do they have the same number?';
      q.hint='Match one berry from each basket. '+a+' on the left. '+b+' on the right.';q.answer=a===b?'same':q.ask==='more'?(a>b?'left':'right'):(a<b?'left':'right');
      q.explanation=a===b?'Both baskets have '+a+'. They have the same number.':a+' on the left and '+b+' on the right. '+Math.max(a,b)+' is more than '+Math.min(a,b)+'.';
      q.groups=[{n:a,icon:'berry',tone:'peach'},{n:b,icon:'berry',tone:'mint'}];q.choices=[{id:'left',label:'Left basket'},{id:'same',label:'The same'},{id:'right',label:'Right basket'}];
    }else if(kind==='pattern'){
      var tokens=shuffle(['leaf','flower','berry','star'],r),rule=level===0?[tokens[0],tokens[1]]:level===1?(r()<.5?[tokens[0],tokens[0],tokens[1]]:[tokens[0],tokens[1],tokens[1]]):[tokens[0],tokens[1],tokens[2]],offset=between(r,0,rule.length-1);
      q.rule=rule;q.sequence=[];for(var s=0;s<5;s++)q.sequence.push(rule[(s+offset)%rule.length]);q.answer=rule[(5+offset)%rule.length];
      q.title='What comes next?';q.detail='Look for the little pattern. Help it keep going.';q.speech='Look at the pattern. '+q.sequence.map(function(x){return TOKEN_NAMES[x];}).join(', ')+'. What comes next?';
      q.hint='Say it with me: '+q.sequence.slice(0,rule.length).map(function(x){return TOKEN_NAMES[x];}).join(', ')+'. Then repeat.';q.explanation='The pattern repeats: '+q.sequence.slice(0,rule.length).map(function(x){return TOKEN_NAMES[x];}).join(', ')+'.';
      var distractors=shuffle(tokens.filter(function(x){return x!==q.answer;}),r).slice(0,2);q.choices=shuffle([q.answer].concat(distractors),r).map(function(x){return{id:x,label:TOKEN_NAMES[x],art:x};});
    }else{
      var available=['circle','triangle','square'];if(level>0)available.push('rectangle');if(level>1)available.push('hexagon');var target=pick(available,r);
      q.answer=target;q.rotation=(r()-.5)*(level?40:8);q.title='Can you find a '+SHAPES[target].name+'?';q.detail='Meet a little shape friend.';q.speech=q.title;q.hint=SHAPES[target].hint;q.explanation=SHAPES[target].explain;
      var others=shuffle(available.filter(function(x){return x!==target;}),r).slice(0,2);q.choices=shuffle([target].concat(others),r).map(function(x){return{id:x,label:SHAPES[x].name,art:x};});
    }
    q.fingerprint=[q.kind,q.format,q.n,q.a,q.b,q.ask,q.answer,q.sequence?q.sequence.join(','):''].join('|');
    return q;
  }
  function queue(mode,rounds,r){
    if(IDS.indexOf(mode)>=0)return[mode,mode,mode,mode,mode];
    if(rounds===0)return['count','add','compare','pattern','shape'];
    var out=[];for(var i=0;i<5;i++)out.push(IDS[(rounds*5+i)%6]);return shuffle(out,r);
  }
  function prepare(save,active,r){
    var kind=active.queue[active.index],level=save.skills[kind].level,q;
    for(var i=0;i<14;i++){var seed=Math.floor(r()*4294967296)>>>0;q=makeQuestion(kind,level,seed);if(save.recent.indexOf(q.fingerprint)<0||i===13){active.seed=seed;break;}}
    active.level=level;active.attempts=0;active.hint=false;active.rejected=[];active.touched=[];active.builder=0;active.filled=[];
    save.recent.push(q.fingerprint);save.recent=save.recent.slice(-12);
    return q;
  }
  function start(raw,mode,random){
    var save=cleanSave(raw),r=random||Math.random,active=save.active,q;
    mode=IDS.indexOf(mode)>=0?mode:'mix';
    if(active){
      if(active.mode!==mode&&mode!=='mix'){
        for(var i=active.index;i<5;i++)active.queue[i]=mode;active.mode=mode;q=prepare(save,active,r);
      }else q=makeQuestion(active.queue[active.index],active.level,active.seed);
    }else{
      active={mode:mode,queue:queue(mode,save.rounds,r),index:0,seed:0,level:0,attempts:0,hint:false,rejected:[],touched:[],builder:0};save.active=active;q=prepare(save,active,r);
    }
    if(q.format==='build'){active.filled=(active.filled||[]).filter(function(x){return x<q.frameSize;});active.builder=active.filled.length;}
    return{save:save,q:q,phase:'question',random:r,reward:null};
  }
  function hint(s){if(s.phase!=='question')return false;s.save.active.hint=true;return true;}
  function touch(s,index){
    if(s.phase!=='question')return null;var a=s.save.active;
    if(a.touched.indexOf(index)>=0)return null;
    var total=s.q.kind==='add'?s.q.a+s.q.b:s.q.kind==='subtract'?s.q.a-s.q.b:s.q.kind==='compare'?s.q.a+s.q.b:s.q.n;
    if(index<0||index>=total||!Number.isInteger(index))return null;
    a.touched.push(index);return a.touched.length;
  }
  function build(s,quantity){if(s.phase!=='question'||s.q.format!=='build')return false;var a=s.save.active;a.builder=clamp(Math.floor(quantity),0,s.q.frameSize);a.filled=[];for(var i=0;i<a.builder;i++)a.filled.push(i);return true;}
  function toggleSlot(s,index){if(s.phase!=='question'||s.q.format!=='build'||!Number.isInteger(index)||index<0||index>=s.q.frameSize)return false;var a=s.save.active,at=a.filled.indexOf(index);if(at>=0)a.filled.splice(at,1);else a.filled.push(index);a.builder=a.filled.length;return true;}
  function answer(s,id){
    if(s.phase!=='question')return{status:'ignored'};
    var active=s.save.active,q=s.q;id=String(id);
    if(q.format==='build')id=String(active.builder);
    else if(!q.choices.some(function(choice){return choice.id===id;}))return{status:'ignored'};
    if(id!==q.answer){
      if(active.rejected.indexOf(id)>=0)return{status:'ignored'};
      active.rejected.push(id);active.attempts=Math.min(3,active.attempts+1);active.hint=true;
      return{status:'try',hint:q.hint,guided:active.attempts>=2};
    }
    var skill=s.save.skills[q.kind],independent=active.attempts===0&&!active.hint;
    skill.solved++;
    if(independent){skill.independent++;skill.streak++;skill.supported=0;if(skill.streak>=3){skill.level=Math.min(2,skill.level+1);skill.streak=0;}}
    else{skill.streak=0;skill.supported++;if(skill.supported>=2){skill.level=Math.max(0,skill.level-1);skill.supported=0;}}
    s.save.answers++;active.index++;s.phase='answered';
    var finished=active.index>=5;
    if(finished){
      var before=s.save.rounds;s.save.rounds++;s.save.active=null;s.phase='complete';
      var newly=FRIENDS.filter(function(f){return f.rounds>before&&f.rounds<=s.save.rounds;});
      if(newly.length)s.save.friend=newly[0].id;
      s.reward={friend:newly[0]||friendFor(s.save.friend),isNew:!!newly.length,blooms:s.save.rounds};
    }else prepare(s.save,active,s.random);
    return{status:'correct',independent:independent,finished:finished,explanation:q.explanation,reward:s.reward};
  }
  function next(s){if(s.phase!=='answered')return false;var a=s.save.active;s.q=makeQuestion(a.queue[a.index],a.level,a.seed);s.phase='question';return true;}
  return{IDS:IDS,SKILLS:SKILLS,FRIENDS:FRIENDS,SHAPES:SHAPES,clamp:clamp,seeded:seeded,blankSave:blankSave,cleanSave:cleanSave,friendFor:friendFor,makeQuestion:makeQuestion,start:start,hint:hint,touch:touch,build:build,toggleSlot:toggleSlot,answer:answer,next:next};
}));
