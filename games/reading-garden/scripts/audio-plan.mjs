import { mkdir,writeFile } from 'node:fs/promises';
import { SOUNDS,WORDS,LESSONS,STORIES,CUES,LABELS,phonemes } from '../public/content.mjs';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const markText=(text,decodable=false)=>text.split(/\s+/).map((w,i)=>{const word=w.replace(/[^a-z]/gi,'').toLowerCase();return `<mark name="w${i}"/>`+(decodable&&WORDS.includes(word)?`<phoneme alphabet="ipa" ph="${phonemes(word).join('')}">${escape(w)}</phoneme>`:escape(w));}).join(' ')+'<mark name="end"/><break time="40ms"/>';
const jobs=[];
const add=(id,text,extra={})=>jobs.push({id,text,ssml:`<speak>${escape(text)}</speak>`,rate:.87,...extra});
for(const [id,s] of Object.entries(SOUNDS)) {
 const label=id==='qu'?'Q and U':id==='ck'?'C and K':id.toUpperCase();
 // Isolated sounds are prepared separately by prepare-sounds.py. Google can
 // substitute letter names for consonants that do not form a valid syllable.
 add('hint-'+id,s.hint);
 add('letter-'+id,`${label}. ${s.keyword}.`,{ssml:`<speak><say-as interpret-as="characters">${escape(id==='qu'?'qu':id)}</say-as><break time="180ms"/>${escape(s.keyword)}.</speak>`});
}
for(const word of WORDS) add('word-'+word,word,{ssml:`<speak><phoneme alphabet="ipa" ph="${phonemes(word).join('')}">${word}</phoneme></speak>`});
for(const [key,text] of Object.entries(CUES)) add('cue-'+key,text);
for(const [key,text] of Object.entries(LABELS)) add('label-'+key,text);
for(const lesson of LESSONS) { add('lesson-'+lesson.id,`${lesson.title}. ${lesson.short}.`); add('sentence-'+lesson.id,lesson.sentence,{ssml:`<speak>${markText(lesson.sentence,true)}</speak>`,marks:true}); }
for(const story of STORIES) {
 add('title-'+story.id,story.title); add('question-'+story.id,story.question);
 story.options.forEach((text,i)=>add(`option-${story.id}-${i}`,text));
 story.pages.forEach((page,i)=>{add(`story-${story.id}-${i}`,page.text,{ssml:`<speak>${markText(page.text)}</speak>`,marks:true});add(`read-${story.id}-${i}`,page.read,{ssml:`<speak>${markText(page.read,true)}</speak>`,marks:true});});
}
await mkdir(new URL('../qa-output/',import.meta.url),{recursive:true});
await writeFile(new URL('../qa-output/audio-jobs.json',import.meta.url),JSON.stringify(jobs,null,2));
const characters=jobs.reduce((n,j)=>n+j.ssml.length,0);
console.log(JSON.stringify({clips:jobs.length,ssmlCharacters:characters,neural2EstimateDollars:characters*16/1e6,maxGenerationBudgetDollars:3,stories:STORIES.length,lessonWords:LESSONS.reduce((n,l)=>n+l.words.length,0)}));
