# Verification notes

## Reading builder

Checked through the actual browser UI at 1195 × 470 and 844 × 390 landscape CSS pixels. The smaller size represents substantial browser chrome on a phone or tablet.

- Entering Build played the prepared target word.
- The large speaker control replayed the same word.
- Sound boxes, letter choices, hints and next action stayed in the visible activity.
- No page overflow was reported at either size.
- Existing blending/audio regressions cover taps, full drags, reverse/cancelled drags, queue ordering, muting and navigation during a download.

This is browser viewport testing. A physical iPad still matters for Safari audio policy, touch behavior and its particular browser/toolbars.

## Automated scope

The root suite covers Number Garden’s generated challenges and progression, Snack Hole’s deterministic rounds and resizing, Reading Garden’s phonics/audio state, Robi’s backend behavior and the static server’s byte ranges.

Super Eric’s `npm test` runs the retained runtime TypeScript tests for app-data behavior, auth gates and preview paths. CI also typechecks and builds the full application. These scaffold tests do not measure gameplay quality.

The original Grok builder-tool tests remain available as `npm run test:builder`. They depend on historical sandbox instruction files and platform context omitted from the public export, and include a Unix symlink test. They are not the portable collection test target. Their original failures were not treated as a game-runtime pass.

## Publication

`npm run check:public` scans tracked/source files for private operational paths, credential signatures and known excluded family details. It also verifies all local portfolio links and image references after the build. This is a regression aid, not a proof that arbitrary future contributions contain no sensitive data.

CI verifies every published revision. Screenshots depict actual local game interfaces with synthetic/test state; no child speech is used.
