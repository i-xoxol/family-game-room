# Reading Garden · Eric Reads

[Play the demo](https://i-xoxol.github.io/family-game-room/play/reading-garden/) · [Project overview](https://i-xoxol.github.io/family-game-room/reading-garden.html) · [Teaching rationale](docs/research.md)

![The word builder with its large Hear the word button](../../site/assets/reading-builder.jpg)

Original US English practice for a child who knows letters and is beginning to blend. Six sound paths lead through visible letter sounds, blending, building a heard word and choosing its printed form. Short sentences and three original illustrated tales add connected reading and listening.

The target word plays when the builder opens. A large replay button stays visible beside sound boxes and letter tiles, even in a short landscape viewport. Tapping the blending rail previews a sound; completing a full left-to-right drag queues the sounds and then the word.

## Run and check

```bash
npm run dev
npm run check
npm test
```

The standalone preview is http://127.0.0.1:18098/. It has no login service. A family deployment can place the reader behind the private game-room gateway.

## Audio and content

All **266 referenced audio files** are included. Spoken directions, word models and stories use prepared synthetic narration; isolated phonemes are prepared separately. No API, microphone, speech recognition or recurring synthesis request is used during play. Audio buttons model speech; progress does not assess what the child says.

Generation tools are in `scripts/`. They are optional authoring tools and require separately configured provider access. Do not put account credentials in the source. Review pronunciation and timing before publishing new material.

Read [research.md](docs/research.md) for primary teaching sources, local alignment, phoneme decisions and limitations. The materials are original supplementary practice and do not reproduce proprietary curriculum cards.

Browser progress stays on the device. Rich narrated stories are shared listening; their short, simpler child turns are explicitly separate from fluent adult narration.
