# Development workflow

Build pinthatshi in understandable, working increments. Explain the change, check the affected flow, and commit verified checkpoints locally.

## Git policy

The owner’s instruction on 20 November 2026 supersedes the earlier push-each-checkpoint workflow:

- Commit completed work locally.
- Do not push after prompts, checkpoints, alpha releases, or ordinary polish passes.
- Push only when the complete final game is finished and ready for its final release.
- Never force-push or rewrite shared history as part of this workflow.

This polish milestone is an alpha, not the complete final game. New game modes and country packs remain future work.

## Current acceptance checks

- Region card → active round → answers/hints → completion map → postcard → replay/review.
- Fixed desktop map with independent sidebar scrolling; usable phone layout.
- Direct cursor-anchored wheel zoom, touch zoom, keyboard pan/zoom/answers, Space hint.
- Shared country colors; hover outlines, dash-dot borders, solid coasts, adaptive grids, horizontal world-anchored waves.
- Local map geometry drives both visible land and answer hit testing. Optional network detail tiles must not decide quiz answers.
- Completed-map depth survives postcard capture.
- Compass pan response, map-only pushpin cursor, persistent sound mute, reduced-motion styles.
- Independent saves by map and coverage; old records remain valid.

Run `npm test` and `npm run build` before committing. Keep downloaded reference bundles and recordings outside tracked source. Retain public data/font attribution.
