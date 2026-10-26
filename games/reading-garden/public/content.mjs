export const NAME = 'Eric';
// Each entry is one phoneme except x/qu, explicitly marked as two sounds.
export const SOUNDS = {
 a:{ipa:'æ',kind:'vowel',keyword:'apple',hint:'Open your mouth wide. Make the short a sound in apple.'},
 b:{ipa:'b',kind:'stop',keyword:'bat',hint:'Close your lips, then pop them open. Keep it short. No extra uh.'},
 c:{ipa:'k',kind:'stop',keyword:'cat',hint:'Lift the back of your tongue, then release a tiny puff. No extra uh.'},
 d:{ipa:'d',kind:'stop',keyword:'dip',hint:'Touch your tongue just behind your top teeth, then let it pop down. No extra uh.'},
 e:{ipa:'ɛ',kind:'vowel',keyword:'egg',hint:'Open your mouth a little. Make the short e sound in egg.'},
 f:{ipa:'f',kind:'stretch',keyword:'fan',hint:'Rest your top teeth on your bottom lip. Blow gently. Your voice stays quiet.'},
 g:{ipa:'ɡ',kind:'stop',keyword:'gum',hint:'Use the back of your tongue for a quick voiced pop. No extra uh.'},
 h:{ipa:'h',kind:'stretch',keyword:'hat',hint:'Open your mouth and breathe out softly, as if warming your hands.'},
 i:{ipa:'ɪ',kind:'vowel',keyword:'itch',hint:'Relax your mouth. Make the short i sound at the start of itch.'},
 j:{ipa:'ʤ',kind:'stop',keyword:'jam',hint:'Start with your tongue near the roof of your mouth, then release with your voice.'},
 k:{ipa:'k',kind:'stop',keyword:'kit',hint:'Use the back of your tongue for a quick quiet pop. No extra uh.'},
 l:{ipa:'l',kind:'stretch',keyword:'lip',hint:'Put the tip of your tongue behind your top teeth. Let your voice hum around it.'},
 m:{ipa:'m',kind:'stretch',keyword:'mat',hint:'Close your lips and hum. Keep your voice going without adding uh.'},
 n:{ipa:'n',kind:'stretch',keyword:'net',hint:'Put your tongue behind your top teeth and hum through your nose.'},
 o:{ipa:'ɑː',kind:'vowel',keyword:'octopus',hint:'Drop your jaw and open your mouth. Make the short o sound in American English.'},
 p:{ipa:'p',kind:'stop',keyword:'pan',hint:'Close your lips and release a tiny quiet puff. Keep it short. No extra uh.'},
 qu:{ipa:'kw',kind:'pair',keyword:'quick',hint:'Q usually travels with u. Together here they make two sounds: k, then w.',count:2},
 r:{ipa:'ɹ',kind:'stretch',keyword:'red',hint:'Curl or bunch your tongue gently inside your mouth. Keep it away from your teeth.'},
 s:{ipa:'s',kind:'stretch',keyword:'sun',hint:'Keep your teeth close. Let air slide out like a soft hiss. Your voice stays quiet.'},
 t:{ipa:'t',kind:'stop',keyword:'tap',hint:'Tap your tongue behind your top teeth. Make a tiny quiet pop. No extra uh.'},
 u:{ipa:'ʌ',kind:'vowel',keyword:'up',hint:'Relax your mouth. Make the short u sound at the start of up.'},
 v:{ipa:'v',kind:'stretch',keyword:'van',hint:'Touch your top teeth to your bottom lip. Blow gently and turn your voice on.'},
 w:{ipa:'w',kind:'stretch',keyword:'wet',hint:'Round your lips, then let them relax as you turn on your voice.'},
 x:{ipa:'ks',kind:'pair',keyword:'box',hint:'X at the end of box stands for two sounds: k, then s.',count:2},
 y:{ipa:'j',kind:'stretch',keyword:'yes',hint:'Lift the middle of your tongue, then glide into the next sound. This is y in yes.'},
 z:{ipa:'z',kind:'stretch',keyword:'zip',hint:'Keep your teeth close and buzz with your voice on.'},
 sh:{ipa:'ʃ',kind:'stretch',keyword:'ship',hint:'Round your lips a little. Let air flow softly. Two letters work together for one sound.'},
 ch:{ipa:'ʧ',kind:'stop',keyword:'chin',hint:'Start with your tongue near the roof of your mouth, then release a short quiet puff. Two letters, one sound.'},
 th:{ipa:'θ',kind:'stretch',keyword:'thin',hint:'Place your tongue gently between your teeth and blow. This is the quiet th in thin.'},
 ck:{ipa:'k',kind:'stop',keyword:'duck',hint:'At the end of duck, c and k work together for one quick sound. No extra uh.'},
};

export const LESSONS = [
 {id:'a',title:'The Apple Meadow',short:'Short a',vowel:'a',color:'#d88363',words:['mat','sat','map','tap','cap','cat','nap','fan'],sentence:'Sam sat.'},
 {id:'i',title:'The Little River',short:'Short i',vowel:'i',color:'#538bba',words:['sit','sip','tip','pin','fin','fit','lip','win'],sentence:'Pip can sit.'},
 {id:'o',title:'The Otter Pond',short:'Short o',vowel:'o',color:'#438c82',words:['mop','pot','top','hop','hot','log','cot','rod'],sentence:'Pip can hop.'},
 {id:'u',title:'The Sunny Hill',short:'Short u',vowel:'u',color:'#b58a36',words:['sun','fun','run','mud','mug','cup','bug','tub'],sentence:'Run in mud.'},
 {id:'e',title:'The Pebble Path',short:'Short e',vowel:'e',color:'#8d79b6',words:['hen','pen','ten','net','pet','wet','red','bed'],sentence:'Pip can get wet.'},
 {id:'team',title:'The Sound Bridge',short:'Two letters, one sound',vowel:null,color:'#477f60',extension:true,words:['ship','shop','chin','chat','thin','math','duck','sock'],sentence:'Sam can chat.'},
];
export const EXTRA_WORDS = ['am','at','Sam','Pip','can','ran','in','get','big','dig','bud','sun','up','on','it','had','hat','not','yes','red','cap','sat','tap','sip','sit','fun','run','pet','wet','net','hen','mat'];
export function graphemes(word) { return word.toLowerCase().match(/sh|ch|th|ck|qu|[a-z]/g) || []; }
export function soundCount(word) { return graphemes(word).reduce((n,g)=>n+(SOUNDS[g]?.count||1),0); }
export const WORDS = [...new Set([...LESSONS.flatMap(l=>l.words),...EXTRA_WORDS].map(w=>w.toLowerCase()))];
export function phonemes(word) { return graphemes(word).map(g=>SOUNDS[g].ipa); }

export const STORIES = [
 {id:'star-cap',title:'Pip and the Star Cap',subtitle:'A small fox. A star that needs a friend.',art:'star-cap',color:'#e5bd7b',pages:[
  {text:'Eric found a tiny red cap beneath a fern. Inside it slept a little fox named Pip. Above them, one small star blinked.',read:'Pip sat.',picture:'cap'},
  {text:'The star drifted down like a feather. It had forgotten the way home. Eric held out the cap, and the star landed softly inside.',read:'Tap, tap, tap.',picture:'star'},
  {text:'Pip unrolled a little map. A silver path led up the hill. Eric carried the star carefully while Pip padded beside him.',read:'Pip ran.',picture:'map'},
  {text:'At the top stood a sleepy moon gate. Eric tapped it three times. The gate opened just wide enough for one small star.',read:'Tap, tap, tap.',picture:'gate'},
  {text:'The star rose through the gate and shone over the forest. One warm beam settled on the red cap. Pip gave a happy little bow.',read:'Pip can nap.',picture:'star'},
  {text:'Eric put the cap beside the fern. Pip curled up inside. Every night, the little star blinked twice to say thank you.',read:'Pip had fun.',picture:'cap'},
 ],question:'What helped the star find its way home?',options:['The map and the moon gate','A big sandwich','A rainy boot'],answer:0},
 {id:'moon-seed',title:'The Seed of Moonlight',subtitle:'A quiet garden with a little bit of magic.',art:'moon-seed',color:'#a8c7a4',pages:[
  {text:'In a quiet garden, Eric found a silver seed. Pip sniffed it. A gentle voice from the watering can said, This seed grows when someone is kind.',read:'Pip can dig.',picture:'seed'},
  {text:'Eric made a small hole. Pip tucked the seed into the soft earth. Together they gave it water, then sat nearby to wait.',read:'Pip sat.',picture:'planted'},
  {text:'A beetle needed help crossing a puddle. Eric laid down a leaf bridge. In the garden, the silver seed gave its first tiny wiggle.',read:'Pip can get wet.',picture:'leaf'},
  {text:'A bird had dropped a feather. Eric placed it safely beside the nest. A green shoot appeared where the seed had been.',read:'Up, up, up.',picture:'plant'},
  {text:'That evening, a pale flower opened. Its petals glowed like moonlight. Eric and Pip watched in silence while the garden filled with a soft silver shine.',read:'Pip had fun.',picture:'flower'},
  {text:'The watering can smiled. Small kind things help wonderful things grow, it said. Eric left a little water for the next thirsty visitor.',read:'Pip can nap.',picture:'flower'},
 ],question:'What helped the magic seed grow?',options:['Small acts of kindness','Shouting at the seed','Hiding all the water'],answer:0},
 {id:'boat-wish',title:'The Little Boat’s Wish',subtitle:'A gentle journey across the pond.',art:'boat-wish',color:'#a6c9d8',pages:[
  {text:'Eric folded a little paper boat. Pip watched from a flat stone. The boat whispered that it wished to see the other side of the pond.',read:'Pip can sit.',picture:'boat'},
  {text:'Eric set the boat on the still water. A breeze filled its paper sail. Pip followed along the bank, carrying a small red flag.',read:'Pip ran.',picture:'sail'},
  {text:'The boat stopped beside a water lily. A tiny frog was looking for a ride. The boat made room, and the frog climbed carefully aboard.',read:'Pip can hop.',picture:'lily'},
  {text:'Near the reeds, the breeze grew quiet. Eric gently fanned the air with a leaf. The little sail filled again, and the boat moved on.',read:'Pip can fan.',picture:'leaf'},
  {text:'At last, the boat reached a smooth pebble beach. The frog hopped home. The boat had crossed the pond and helped a friend along the way.',read:'Pip had fun.',picture:'pebble'},
  {text:'Eric carried the little boat back to its shelf. Pip curled up below it. Tomorrow, they would find another small adventure to share.',read:'Pip can nap.',picture:'boat'},
 ],question:'Why did the boat make room for the frog?',options:['To help a friend get home','To win a noisy race','To hide from Eric'],answer:0},
];

export const CUES = {
 welcome:'Hi, Eric! Welcome to your reading quest. We will tap the sounds, slide them together, and read. You can ask for help any time.',
 practice:'Let’s practice reading, Eric. Start with a sound, then make a word.',
 oral:'A word is hiding in these sounds, Eric. Listen without looking at letters. Put the sounds together in your head, and try saying the word. Then uncover it.',
 sounds:'Tap a letter to hear its sound. The little speaker can tell you how to make it.',
 blend:'Tap each sound from left to right. Then slide underneath to blend the sounds into a word.',
 build:'Listen to the word. Tap the letters in order to build it. One sound goes in each box.',
 choose:'Listen to the word. Read each choice, then tap the matching word. You can use the little speakers for help.',
 sentence:'Now read a little sentence. Tap a word if you want help. Listen, then try reading it yourself.',
 said:'You gave it a try, Eric! I cannot hear you. Read it once more to a grown-up if you can.',
 correct1:'You matched the sounds, Eric. That was careful reading!',
 correct2:'You kept going, Eric. Your practice is helping!',
 correct3:'You checked the letters from left to right. Well done, Eric!',
 supported:'You used a hint and kept trying. That is how readers learn, Eric.',
 retry:'Let’s look closely, Eric. Listen to the sounds, one at a time. You can try again.',
 buildRetry:'Let’s change that sound. Look at the glowing box, listen again, and try a letter.',
 next:'Ready for the next word?',
 done:'You finished your little reading quest, Eric! Your effort earned a new leaf for your reading tree.',
 storyIntro:'Let’s listen to a story, Eric. The words will glow as I read. Tap a word to hear it again.',
 yourTurn:'Your turn, Eric. Try reading the big words. Tap a word or the speaker if you want help.',
 storyDone:'You followed a whole story, Eric! Tell a grown-up your favorite part.',
 storyQuestion:'Let’s think about our story. Listen to the question, then choose an answer.',
 storyRetry:'Let’s think about what happened. You can listen to the story again, then try another answer.',
 home:'Your reading garden. Choose a little quest, practice sounds, or listen to a story.',
 replay:'Listen again.',hint:'Here is a little help.',
};

export const LABELS = { practice:'Start a little quest',sounds:'Sound workshop',stories:'Story corner',listen:'Hear it',blend:'Slide and blend',build:'Build the word',choose:'Find the word',sentence:'Read together',next:'Next word',back:'Go back',home:'Reading garden',hint:'Show me how',slow:'Blend slowly',said:'I tried reading it',play:'Read to me',pause:'Pause',pageNext:'Next page',pageBack:'Previous page',again:'Read it again',soundOff:'Turn sound off',soundOn:'Turn sound on',parents:'For grown-ups' };
