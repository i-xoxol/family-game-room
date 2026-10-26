# Number Garden · Math Adventure

[Play the demo](https://i-xoxol.github.io/family-game-room/play/number-garden/) · [Project overview](https://i-xoxol.github.io/family-game-room/number-garden.html)

![Number Garden](../../site/assets/number-garden.jpg)

Short math adventures with garden friends: count visible objects, match quantities, compare groups and build numbers. Gentle retries, earned flowers and prepared narration support a young player.

## Run and check

```bash
npm ci --ignore-scripts
npm test
npm run build
```

Serve the generated `dist/` with any static web server, or use the collection’s root build/preview. The build targets Safari 12 JavaScript. Physical Safari behavior still depends on device and OS version.

`logic.js` owns challenge generation and progression, `app.js` the interaction, `art.js` the SVG art and `voice.js` prepared audio playback. Tests cover 1,800 generated challenges, one-answer validity, wrong/repeated taps, supported progress, saved-state recovery and complete narration mapping.

The 83 audio clips are included and fetched only as needed. No model API or TTS service is contacted while playing. Local browser storage keeps garden progress. Fredoka’s license is included.
