# Super Eric

[Play the existing public game](https://games.khokhlov.org/games/super-eric/) · [Project overview](https://i-xoxol.github.io/family-game-room/super-eric.html)

![Super Eric](../../site/assets/super-eric.jpg)

A gentle finger-flight adventure with a small superhero, friendly skies and rescue goals. The custom game engine is in `src/game/engine.ts`; `src/components/super-eric.tsx` connects it to React controls.

## Run and build

Use Node.js 22.13 or newer:

```bash
npm ci --ignore-scripts
npm run dev
npm run typecheck
npm test
npm run build
```

Development binds to http://127.0.0.1:18104/. The build creates a Nitro/Vercel server application in `.vercel/output/`; it is not a static GitHub Pages bundle. Configure a supported server adapter/hosting target for your own deployment.

The game uses browser audio and local progress. It requires no account or paid model during play. The minimal `.grok/app-env.json` records the exported game’s disabled account feature. Database migration is skipped without a database URL. The broader generated auth/app-data scaffold is retained but is not a gameplay dependency.

## Provenance and validation

Originally created with **Grok App Builder**, then exported into this collection. Original platform marks, metadata/PWA plugins and source scaffold are retained. The historical workspace instructions are archived in [builder provenance](../../docs/super-eric-builder-provenance.md), rather than installed as active instructions in the public export.

The Vite commands now invoke Node directly for Windows portability, the public development server binds to loopback, and Zod is updated to a patched compatible release. Game mechanics and artwork are unchanged by this publication pass.

`npm test` covers retained runtime app-data, auth-gate and preview-path modules. CI also typechecks and builds. Historical builder-tool tests remain under `npm run test:builder`; they require omitted sandbox skill/instruction files and Unix platform context. See the collection’s [verification notes](../../docs/verification.md).

Dependencies and Grok platform assets retain their own terms. See [third-party notices](../../THIRD_PARTY_NOTICES.md).
