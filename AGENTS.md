# Family Game Room

Keep the source, runnable demos and documentation consistent. Games live under
`games/`; the public portfolio is `site/`. `games/robi` is a Git submodule, so
make Robi changes in its own repository and update the pinned commit here.

Never commit live credentials, family profiles, databases, recordings, raw
transcripts, deployment backups or private operations notes. Run
`npm run check:public` before publication. Screenshots must use synthetic play,
without private family settings or a child's data.

Preserve progress storage keys during UI fixes. Test the reading builder at
1195×470 and 844×390 as well as ordinary tablet dimensions: browser chrome can
leave very little height. Keep its target-word button visible and replayable.

Run `npm test` and `npm run build`. Super Eric also has its own build, typecheck
and framework test job. Its exported platform bridge and branding stay intact.
The provenance file records the original sandbox instructions; it is historical
documentation, not this repository's execution environment.

Public static demos never call paid APIs. Robi runs separately behind its own
authentication; do not attach a live family's voice endpoint to GitHub Pages.
