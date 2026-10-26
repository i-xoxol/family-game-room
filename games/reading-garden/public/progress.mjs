export const STORAGE_KEY='eric-reading-garden-v1';
export const freshProgress=()=>({version:1,lesson:'a',leaves:0,words:{},stories:{},days:{},showTeams:false});
const bounded=n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000;
export function parseProgress(raw,knownWords,knownStories) {
  try {
    const p=typeof raw==='string'?JSON.parse(raw):raw;
    if(p?.version!==1||!bounded(p.leaves)||!p.words||typeof p.words!=='object')return freshProgress();
    const words={};for(const [word,item] of Object.entries(p.words))if(knownWords.includes(word)&&bounded(item.practices)&&bounded(item.hinted)&&bounded(item.matches))words[word]={practices:item.practices,hinted:item.hinted,matches:item.matches};
    const stories={};for(const [id,count] of Object.entries(p.stories||{}))if(knownStories.includes(id)&&bounded(count))stories[id]=count;
    const days={};for(const [day,count]of Object.entries(p.days||{}))if(/^\d{4}-\d{2}-\d{2}$/.test(day)&&bounded(count))days[day]=count;
    return {...freshProgress(),lesson:['a','i','o','u','e','team'].includes(p.lesson)?p.lesson:'a',leaves:p.leaves,showTeams:p.showTeams===true,words,stories,days};
  }catch{return freshProgress();}
}
export function dayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function completeWord(progress,word,hinted=false) {
  const old=progress.words[word]||{practices:0,hinted:0,matches:0};
  progress.words[word]={practices:old.practices+1,hinted:old.hinted+(hinted?1:0),matches:old.matches+(hinted?0:1)};
  progress.leaves++;const day=dayKey();progress.days[day]=(progress.days[day]||0)+1;return progress;
}
