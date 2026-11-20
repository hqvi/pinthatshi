# pinthatshi

A geography learning game I'm building one version at a time.

Find countries, remember capitals, recognize flags, and eventually learn the regions and provinces closer to home. The visual direction is a textured, pixel-style atlas, with Farflung's **Learn Countries** as the main reference.

## Where the project is now

**UI/UX polish alpha — v0.5.0-alpha.1.** Find Countries works across 28 region, continent, and world scopes. Choose Countries (197 worldwide) or Countries & Areas (253), click a region card to start or resume, and find each named place on the atlas. Hints, reveal/skip, results, review, replay, and local perfect-time records are connected to real session state.

- [Game design and complete mode catalog](docs/game-design.md)
- [Playable roster and session rules](docs/game-roster.md)
- [Version roadmap and how we'll build](docs/roadmap.md)
- [Wireframe guide](docs/wireframes.md)
- [Visual direction and sprite rules](docs/visual-direction.md)
- [Actual font and color reference sheet](docs/style-guide/index.html)
- [Completion depth and country-shaped flag preview](docs/interaction-lab/index.html)
- [UX and motion requirements](docs/ux-motion.md)
- [Farflung design inspection](docs/farflung-design-audit.md)

## Run the application

Use Node.js 22.12 or newer and npm:

```sh
npm ci
npm run dev
```

Open the local URL printed in the terminal. `npm run build` checks TypeScript and creates the production files in `dist/`. `npm run preview` serves that build locally. The app uses bundled fonts and atlas illustrations; it needs no account or API key.

The Learn Countries screen keeps the atlas fixed while its paper sidebar scrolls. A region card starts or resumes that map directly. Drag or use arrow keys to pan; use the wheel without Ctrl, the zoom buttons, or keyboard plus/minus to zoom. Pinch zoom works on touch devices. Enter answers at the center crosshair, visible when the map has keyboard focus; Space gives a hint. Round options contain pause, reveal/skip, hide timer, and restart.

The renderer uses bundled Natural Earth v5.1.2 1:50m country, map-unit, and coastline geometry. Hover and answer checks use the displayed polygons; small places have circular selection aids. This is generalized atlas geometry, rather than street-level or cadastral boundary data. Separate coastlines keep shores solid and inland boundaries dash-dotted. Adaptive coordinate grids and world-anchored procedural horizontal waves replace the old repeating wave bitmap.

Optional OpenFreeMap/OpenMapTiles details add lakes, rivers, and roads at closer zooms. No API key is required; network access is needed for these detail tiles. Local country geometry remains playable when optional tiles fail. Country/city answer labels are deliberately absent. Compact map credits link the required source attribution.

Region cards, country plaques, sidebar dots, progress ticks, and postcards share one deterministic per-map palette. Completed maps retain their offset red edge. A captured map fills the postcard title and picture; pointer completion holds the map briefly before the postcard and stamp arrive. Keyboard completion is immediate; reduced motion removes positional entrances and compass wobble. The fine compass needle reacts to horizontal panning and settles north. A custom pixel pushpin cursor is limited to the map. Flags remain full-detail images.

Synthesized sound cues cover UI clicks, entry, correct/wrong answers, hints, paper, and stamps. Sound starts after a user gesture. Mute persists locally and audio suspends when the tab is hidden.

Unfinished rounds save separately by region and coverage, preserving old version-1 saves and perfect-time records. Learned totals count actual found places, including assisted answers; revealed/skipped answers do not count as learned. Perfect times require a complete full-scope round without mistakes, hints, or skips. Review cannot replace full-map records. The timer pauses while the tab is hidden, the map is unavailable, or the round is paused. Storage is specific to this browser/origin; no account or cross-device sync exists yet.

`npm test` runs 21 checks covering geography, adaptive grids, every scope/coverage combination, palette consistency, scoring, review, save migration, independent region saves, records, and label layout. GitHub Actions runs tests and production builds when changes are eventually pushed.

## Open the original design previews

Open [docs/wireframes/index.html](docs/wireframes/index.html) in a browser. It works without installing packages or connecting to a service.

For a local browser preview with Node.js:

```sh
node scripts/preview.mjs
```

Then visit the local address printed in the terminal. Press `Ctrl+C` in that terminal to stop the preview.

The walkthrough includes Home, Games, Areas, Play, and Results. It uses illustrative content and map placeholders. Buttons demonstrate navigation; they don't check geography answers or save progress yet.

The wireframe colors and system fonts are temporary. The [visual reference sheet](docs/style-guide/index.html) uses locally bundled VT323 and Bungee, the measured Farflung palette, pixel-grid object examples, and normal full-detail flag images. With the preview running, open `/style-guide/` to see it. This is preparation for v0.2, not a completed map or 1:1 application.

The [interaction lab](docs/interaction-lab/index.html) adds a replayable completion postcard with a hard raised-map edge, plus clean flags clipped into country shapes. Open `/interaction-lab/` with the preview running. It uses illustrative results and independent static Natural Earth crops; the real game and geographic dataset are still to be built.

## First playable milestone

**Available in this alpha:** Find Countries across the whole world, by subregion or continent, with hints, found/remaining lists, reveal/skip, a completed-map postcard, review, and local perfect-time records. Countries & Areas includes overseas places such as French Guiana.

Later versions add country recall, capitals, flags, mistake review, and country packs. The Philippines comes first, followed by the USA and UK.

## Build approach

React, TypeScript, and Vite run the application. Shared components render the atlas and area cards; URL state controls navigation and area selection. MapLibre, its worker, and the bundled geographic data load when the area screen is opened. The original plain HTML design previews remain available separately.

Each verified step gets a focused local Git commit. **Do not push development checkpoints.** Remote pushes are reserved for the finished, complete final game, per the project owner’s instruction. See [development workflow](docs/development-workflow.md).

## References and data

The Farflung reference guides visual and interaction design. The implementation will use our own application code and independently sourced geography. Data and asset sources, attribution, and applicable licenses will be documented as they are introduced. No Farflung application bundles, custom artwork, or datasets are included in this repository.

Country and area totals will come from a published, versioned content checklist. Wireframe examples do not establish final geographic coverage.

The app's overview artwork uses Natural Earth v5.1.2 1:50m public-domain cartography. It does not establish the final quiz checklist. After regenerating interactive geography, run `node scripts/create-atlas-art.mjs` to rebuild the overview from that same bundled roster and shared place colors. Normal installs and builds use committed artwork and need no source download.

Interactive geometry combines the same country source with [1:50m map units](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_50m_admin_0_map_units.geojson) so overseas areas such as French Guiana are selectable without splitting countries into ordinary internal subdivisions. Regenerate using `node scripts/create-geography.mjs <countries-file> <map-units-file>`. The generated source checklist documents the initial grouping, and tests guard the key relationships. The interactive renderer supports Pacific views across the date line; small-place aids supplement the geometry available at this resolution.

Upstream font notices are retained in `docs/style-guide/fonts/` and copied to `public/licenses/` for inclusion in builds. GitHub Actions runs the TypeScript and production-build checks on pushes and pull requests.
