import test from 'node:test';
import assert from 'node:assert/strict';
import {SOUNDS,LESSONS,WORDS,STORIES,graphemes,soundCount} from '../public/content.mjs';
import {parseProgress,freshProgress,completeWord} from '../public/progress.mjs';
test('starter paths are regular three-phoneme words; digraphs take one box',()=>{
  assert.equal(LESSONS.length,6);assert.equal(LESSONS.flatMap(l=>l.words).length,48);
  for(const lesson of LESSONS)for(const word of lesson.words){assert.equal(soundCount(word),3,word);for(const g of graphemes(word))assert.ok(SOUNDS[g],g);}
  assert.deepEqual(graphemes('ship'),['sh','i','p']);assert.deepEqual(graphemes('duck'),['d','u','ck']);assert.equal(soundCount('fox'),4);assert.equal(soundCount('quick'),4);
});
test('all simple story reading turns and connected sentences have prepared decodable word entries',()=>{
  assert.equal(STORIES.length,3);for(const s of STORIES){assert.equal(s.pages.length,6);assert.ok(s.options[s.answer]);}
  const lines=[...LESSONS.map(l=>l.sentence),...STORIES.flatMap(s=>s.pages.map(p=>p.read))];
  for(const line of lines)for(const token of line.toLowerCase().match(/[a-z]+/g))assert.ok(WORDS.includes(token),token);
});
test('practice records distinguish hints without claiming to assess spoken reading',()=>{
  const p=freshProgress();completeWord(p,'mat',false);completeWord(p,'mat',true);
  assert.deepEqual(p.words.mat,{practices:2,hinted:1,matches:1});assert.equal(p.leaves,2);
});
test('invalid or unknown browser progress is not trusted',()=>{
  assert.deepEqual(parseProgress('{bad',WORDS,STORIES.map(s=>s.id)),freshProgress());
  const p={...freshProgress(),words:{mat:{practices:2,hinted:1,matches:1},'<script>':{practices:1,hinted:0,matches:1}},stories:{unknown:1}};
  const valid=parseProgress(JSON.stringify(p),WORDS,STORIES.map(s=>s.id));assert.deepEqual(Object.keys(valid.words),['mat']);assert.deepEqual(valid.stories,{});
  assert.deepEqual(parseProgress({...p,leaves:-1},WORDS,[]),freshProgress());
});
