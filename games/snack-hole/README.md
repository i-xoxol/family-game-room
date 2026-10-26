# Snack Hole

[Play the demo](https://i-xoxol.github.io/family-game-room/play/snack-hole/) · [Project overview](https://i-xoxol.github.io/family-game-room/snack-hole.html)

![Snack Hole](../../site/assets/snack-hole.jpg)

Slide a hungry donut through snack worlds. Scoop, grow, discover stickers and try a new style. No countdown pressure or paid services.

## Run and check

```bash
npm ci --ignore-scripts
npm test
npm run build
```

Serve `dist/` as static files or use the root collection preview. The build targets Safari 12 JavaScript; input includes pointer and legacy touch support.

`logic.js` is a deterministic game core, `game.js` handles input/rendering and `art.js` draws procedural snacks. The five regression tests simulate complete rounds at different viewport sizes, rotation, pause/resume, invalid saves and treasure progression.

Canvas 2D renders the world and Web Audio makes sound effects locally. Browser storage keeps progress and styles. There are no API requests or accounts. Fredoka’s license is included.
