# Teaching rationale — Eric’s Reading Garden

Researched October 25, 2026. Eric knows letters and is beginning to blend.
This is original home practice in US English, not an official district product or
a replacement for his teacher’s sequence.

## Local alignment

[Hamden Public Schools’ language arts overview](https://www.hamden.org/elementary-language-arts)
describes Fundations for foundational reading, Heggerty for phonemic awareness,
and Wit & Wisdom with Geodes for knowledge-building reading. The
[Connecticut district program list](https://portal.ct.gov/sde/academic-office/center-for-literacy-research-and-reading-success/information-about-districts-and-charter-schools/approved-k-3-reading-curriculum-models-or-programs-by-district)
also names this combination for Hamden. These are district-level sources; they
do not identify Eric’s current classroom unit.

The [publisher’s Level K overview](https://legacy.wilsonlanguage.com/knowledge-library/programs/fundations/fundations-level-k-curriculum/)
includes sound-letter relationships, short vowels and blending. We reinforce
these skills with our own words, drawings, scripts and interactions. We do not
copy branded keyword cards, lesson plans, passages, assessment items or artwork.

## Evidence translated into the game

The [IES/What Works Clearinghouse practice guide](https://ies.ed.gov/ncee/wwc/PracticeGuide/21)
rates linking speech sounds to print and teaching decoding as supported by
strong evidence; daily connected-text reading has moderate evidence. This
supports the instructional approach, not a claim that this particular app has
been validated in a study.

| Design | Purpose |
|---|---|
| Letters visible from the start | Make the connection between each visible grapheme and its sound clear. |
| Tap sounds from left to right, then slide and hear the whole word | Connect graphemes to phonemes and model blending. |
| Build a heard word with sound boxes | Practice segmenting and mapping sounds to spellings. |
| Contrast similar printed words | Attend to every grapheme; illustrations do not provide the answer. |
| Short sentences after word practice | Use decoding in connected text with replay support. |
| Richer narrated stories with separate simple child turns | Support language, story meaning and accessible reading practice. |
| A simple comprehension question and a retell invitation | Attend to meaning as well as saying words. |

The [full IES guide, recommendation 3](https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/wwc_foundationalreading_040717.pdf)
advises minimizing added schwa sounds when blending. Accordingly, isolated
consonant clips use explicit phonemes rather than spoken letter names, and stop
consonants are brief. The app offers separate letter-name/keyword audio. A
digraph such as sh occupies one sound box. X and qu, which can represent two
phonemes, are excluded from starter words.

## Starter scope

Five short-vowel paths contain eight words each. A later, parent-enabled path
has eight words with sh, ch, th or ck. Initial sessions use three words followed
by one short sentence. This order groups regular patterns for home practice;
it is not presented as Hamden’s exact weekly pacing. A parent can select the
path that matches current school work.

Three original six-page tales have separate listening text and short child-read
lines. The listening text is deliberately richer than the beginner word list.
It is not labeled fully decodable. Children can enjoy every story from the start.

## Feedback and records

Hints model a sound or draw attention to a position. The game does not recommend
guessing from pictures. Wrong attempts lose no points or lives, and there is no
countdown. Leaves recognize completed practice and persistence. Reviews favor
less-practiced words. Records distinguish completed practice from matches made
without an answer hint; they do not diagnose ability or prove independent reading.

There is no microphone, pronunciation scoring, or child speech recording. Adults
can listen to Eric’s attempts and compare them with his teacher’s models. Simple
mouth drawings are reminders, not precise articulation diagrams or speech therapy.

## Audio and privacy

Prepared Google Cloud narration uses full-word IPA where appropriate and
[SSML timepoints](https://docs.cloud.google.com/text-to-speech/docs/ssml#ssml_timepoints)
for word highlighting. Google isolated consonant SSML was rejected after checks
found letter-name fallback. The 30 sound models instead use explicit US phonemes
from [eSpeak NG](https://github.com/espeak-ng/espeak-ng). Engine phoneme events
identify the carrier-vowel boundary, which is excluded from saved sound clips.
The preparation script asserts the emitted IPA and non-silent audio. Short i and
American r have explicit controls to avoid final-vowel and trill substitutions.
These models have a synthetic timbre; an adult should compare Eric's practice
with the models used by his teacher. Automated audio checks are not a human
phonetics evaluation. A failed audio request never falls back to live generation.
Only fixed scripts are sent during preparation. At play time, the browser loads
saved files from the family server and stores progress locally.
