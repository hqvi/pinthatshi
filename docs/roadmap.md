# pinthatshi: roadmap and build journal

Current checkpoint: **v0.6.0-alpha.1 — smooth rendering, 22-map picker, guided hints, and streak feedback.** See [implementation and validation](smooth-map-checkpoint.md). Review this Countries experience before adding other games. All development commits remain local until the complete final game is finished.

## How we'll work

Build a small piece, understand it, check it, and record it. Before implementation, explain the purpose and the concepts involved. Afterward, show the result and the diff, explain the check, and make a focused commit.

Git records the local history. GitHub holds the shared remote copy. A release contains multiple small commits; it isn't one giant upload.

| Term | Meaning in this project |
| --- | --- |
| Working tree | The files currently being edited. |
| Diff | The exact changes since a checkpoint. |
| Stage | Choose the changes for the next commit. |
| Commit | Save a named checkpoint locally. |
| Push | Upload commits to the GitHub repository. |
| Tag | Give a particular checkpoint a release name such as v0.1.0. |

Use `main` for the initial documentation checkpoint. Use short feature branches for later application changes, reviewing the diff before merging. Commit completed checkpoints locally. Do not push development checkpoints or alpha versions; pushes are reserved for the finished, complete final game under the owner’s updated instruction.

## Release path

| Milestone | Deliverable | Complete when |
| --- | --- | --- |
| v0.1 — Foundation | README, catalog, roadmap, preserved design inspection, and clickable wireframes. | Main screens and navigation can be reviewed; repository history is on GitHub. |
| v0.2 — Atlas design | Application scaffold, home, area cards, fonts, frame, parchment panels, and map styling. | Desktop and narrow layouts have been visually reviewed against the references. |
| v0.3 — Interactive map | Pan/zoom, selection, geographic scope, overseas areas, small-place handling, and content checklist. | World and regional views remain aligned and usable; coverage and attribution are documented. |
| v0.4 — First playable | Find Countries worldwide, by subregion, continent, and world; expanded areas; hints, results, local records. | A player can complete every supported scope and replay or review missed items. |
| v0.5 — Initial polish | Reference palette, map details, compass, cursor, sounds, and independent saves. | First polish checkpoint is verified locally. |
| v0.6 — Smooth maps and guided hints | Camera-synchronous grids/GPU waves, 22 maps, selection rings, hint stages, arrows, and streaks. | UI playtests and geographic/interaction checks pass. |
| v0.7 — Country recall | Name All Countries, Name the Country, silhouette reveal. | Typed answers and map reveals work across the shared scopes. |
| v0.8 — Capitals | Country selection, city pinning, capital recall and identification. | Capital exceptions are verified; distance and accuracy records are correctly separated. |
| v0.9 — Flags | Map the Flag, Name the Flag, Match the Flag, Name All Flags. | Flags remain recognizable and map fills stay clipped to boundaries. |
| v0.10 — Progress | Review Mistakes, suggested practice, export/import, improved records. | Progress persists, can be moved between devices, and survives supported upgrades. |
| v0.11 — Philippines | Province and region games, with region/island-group/national scopes. | Coverage and membership are checked against a documented PSGC version. |
| v1.0 — First stable edition | Polished world suite and Philippines pack. | Core flows, content, mobile behavior, accessibility, and failure handling meet release checks. |
| v1.1 — USA | States, capitals, state flags. | Pack-specific data and applicable modes pass the same checks. |
| v1.2 — UK | Constituent countries and flags. | Pack is complete; deeper subdivisions have a separately scoped follow-up plan. |

Versions describe order and scope, not promised dates. Don't add later features to an earlier milestone just because the infrastructure can support them.

## Immediate next steps after v0.1

1. Preserve the approved five-screen wireframe layout; apply the [measured visual direction](visual-direction.md) and review the font/color/sprite reference sheet.
2. Scaffold React, TypeScript, and Vite without replacing the project history or documents.
3. Establish the frame, typography, panel components, and responsive layout.
4. Add the real map and atlas effects, comparing world and regional screenshots.

The first v0.2 application checkpoint implements Home, Games, and the Learn Countries area picker with static atlas framing. The next checkpoint replaces the overview with the interactive map; v0.2 is not tagged complete yet. The user's requested graticule, edge coordinates, country plaques, and shared answer colors are explicitly recorded in [visual direction](visual-direction.md#map-details-reserved-for-the-interactive-renderer) for v0.3/v0.4.

That interactive-map foundation is now implemented. Before marking v0.3 complete, finish the content audit, resolve transcontinental membership and any missing small places, and complete the visual comparison. The next gameplay milestone connects this atlas to Find Countries sessions; exploration selection is not scored as an answer.

Earlier checkpoint: **v0.4.0-alpha.1 — first playable Find Countries**. The roster and primary grouping for this dataset version are published, and all 28 scopes work in both coverage modes. This is an alpha checkpoint rather than a claim that all visual matching, device checks, and later geography refinements are finished. The subsequent v0.5/v0.6 checkpoints prioritize playtest fixes before country-recall modes; the current picker now has 22 maps.

## Release checks

- Compare relevant screens at the reference desktop size and at a narrow mobile width.
- Check islands, overseas areas, small places, zoom/pan alignment, and missing-tile fallback.
- Verify geographic membership, aliases, capitals, flags, source attribution, and dataset versions.
- Test session completion, wrong answers, hints, skips, replay, and review.
- Keep records separate across modes, scopes, assistance, and datasets.
- Check keyboard navigation, focus, readable text, touch controls, and reduced motion.
- Verify persistence and migration when saved data changes.

Add automated data-integrity and game-rule checks as those systems arrive. Add browser checks for full player flows, and run them through GitHub Actions once there is application code to validate. Documentation changes don't require invented game tests.

Hosting is a later milestone. The initial source of truth is this GitHub repository; local previews let us review each version before deployment.

## Build journal

### 2026-11-20 — Foundation

- Settled on **pinthatshi** as the project name.
- Recorded the complete mode catalog and staged release path.
- Preserved the Farflung visual inspection.
- Added five responsive layout wireframes and a dependency-free local preview command.
- Kept the whole-world Find Countries milestone ahead of the other games and country packs.
- Checked navigation, area selection, coverage switching, sample results, and replay in the browser.
- Checked all five layouts at a 390px phone width without horizontal overflow, plus the normal desktop layout. Fixed map-label spacing, screen-change scrolling, and skip-link behavior.
- JavaScript syntax and local documentation links pass checks; no browser console errors were observed. This verifies the walkthrough, not the future game rules or map data.

### 2026-11-20 — Visual direction

- The user approved the wireframes and reaffirmed a 1:1 Farflung visual target.
- Documented selective pixel art: grid-based objects and flags, with detailed geographic geometry.
- Inspected the Souvenirs screen: observed 16 x 16 SVG sprites displayed at 48 x 48 with crisp edges.
- Added a reference sheet for measured typography and colors, independently recreated textures, and original sprite examples. The complete application and map remain future milestones.
- Checked the reference sheet on desktop and at 390px width: assets load, the measured heading values match, sprite dimensions stay at integer scaling, and no horizontal overflow or console errors were observed. Confirmed the link back to the approved wireframes.

### 2026-11-20 — Completion UX and detailed flags

- The user approved the visual sheet and requested Farflung-style transitions, including the completion postcard and stamp.
- Added a replayable completion experiment with skip/reset, keyboard handling, and reduced motion.
- Added Mexico, Spain, Brazil, and Philippines source-versus-pixel comparisons, preserving flag proportions and offering full-detail inspection.
- Kept prototype motion separate from claims of an exact animation match. The next implementation step is the real v0.2 application shell and area-picker/map surface.
- Browser checks covered completion, skip/reset, keyboard focus, reduced-motion transforms, and coarse/fine flag switching. The postcard fits the phone stage, flag ratios and integer scaling are preserved, source/pixel comparisons share display sizes, and no horizontal overflow or console errors were observed.

### 2026-11-20 — Raised maps and normal flags

- The user replaced the earlier pixel-flag direction with normal full-detail flag images.
- Inspected Farflung live through completion and postcard reveal; confirmed the hard red exterior offset, its 5/7px width rule, .82 alpha, and inclusion in the postcard capture.
- Added an independent masked depth layer shared by the main and postcard map previews, with a flat/raised comparison toggle.
- Removed active flag-grid conversion, switched the visual sheet to clean flag images, and added four contextual country-shaped flag previews with a full-flag reference.
- Updated static preview geometry to Natural Earth v5.1.2 1:50m. Application coverage and exact screen-pixel rendering remain separate milestones.
- Verified the shared raised map in the completion postcard, all four flag switches and outline toggles, phone layout, and clean reference images. Syntax, local HTML links, exact embedded flag sources, image coverage, and aspect ratios pass checks; no browser console errors were observed.

### 2026-11-20 — First application checkpoint

- Recorded the user's map fidelity checklist and their approval to finish those details with the real map instead of delaying the application screens.
- Added React, TypeScript, Vite, a dependency lockfile, and npm scripts for local development, checking, building, and previews.
- Built Home → Games → Learn Countries area selection, retaining the approved parchment palette, fonts, frame, atlas textures, and small compass sprite.
- Added 28 display scopes across six continents, their subregions, and the world. These bounds frame illustrations; they are not gameplay membership, final coverage, or country counts.
- Area and coverage state travel in the URL and survive refresh, Back navigation, and returning from Games. Unknown area identifiers safely show the world. Future modes are labeled planned and do not pretend to start a quiz.
- Bundled independent Natural Earth v5.1.2 1:50m illustrations; preserved font notices in production assets. Added GitHub Actions for TypeScript and build checks.
- Local production build and dependency audit pass (zero reported vulnerabilities). Browser checks passed Home → Games → Areas, every continent plus world selection, coverage toggles, refresh/navigation persistence, focus/skip link, and 390px layouts without horizontal overflow. No browser console errors were observed.

### 2026-11-20 — Interactive atlas foundation

- Replaced the area-screen illustration with lazy-loaded MapLibre, a bundled module worker, and local geographic geometry. No tile service, API key, or geolocation is required for core exploration. Static Home and thumbnail art remain lightweight entry points relative to the renderer.
- Added north-up pan/zoom, keyboard movement, cooperative touch/scroll gestures, zoom buttons, fit-to-area, and adaptive graticules with left/bottom coordinates projected from the current camera. Resize updates both map and overlay; camera animation respects reduced motion.
- Added map selection and scope-specific searchable place selection, small-place markers, a name plaque, and one shared place color in the fill, plaque, and sidebar. The coverage toggle now filters selectable places while surrounding geography stays visible.
- Built a documented 253-place exploration roster from Natural Earth v5.1.2 1:50m countries/map units. French Guiana is independently selectable in South America; ordinary UK subdivisions remain together. This is the source checklist, not finalized quiz coverage. Pacific bounds and place focus support date-line crossings.
- Added loading/error overview fallback and retry controls. Browser testing exposed and corrected the module-worker setup, map-container CSS precedence, string feature IDs, and attribution overlapping bottom coordinates. Data checks also caught and corrected the mainland France/Portugal classification after the overseas split.
- Eight automated tests cover longitude wrapping, adaptive grid spacing, short date-line intervals, French Guiana/France filtering, the unified UK, all-scope availability, finite coordinates/unique IDs, accent-insensitive search, and matching thumbnail/live-map colors. Thumbnail artwork now uses the same roster and color assignment as the interactive map.
- Local checks passed direct polygon selection, keyboard pan, zoom/fit, French Guiana coverage filtering, Monaco focus, Fiji date-line framing, and production-build rendering. Production browser logs were clear after the integration fixes. A 390px viewport resized the map and grid together without horizontal overflow. Final content audit, complete visual matching, and quiz/session behavior remain open.
- The map renderer is a separate approximately 1.1MB minified chunk (about 300KB gzipped), with a separate worker and roughly 2MB geometry asset. Vite reports its large-chunk advisory; lazy loading keeps that renderer out of the Home entry bundle. Further performance work should follow actual device measurements.

### 2026-11-20 — First playable Find Countries alpha

- Published a versioned game roster: 197 Countries and 56 additional Areas, with 253 entries in expanded coverage. Added explicit Palestine/Kosovo and Somaliland grouping choices, removed misleading disputed-parent labels, retained French Guiana → France, and documented the pinned primary geographic assignments. The full source table and game policy remain reviewable.
- Added real shuffled rounds for all 28 scopes, correct/wrong answers, duplicate/context-click handling, count-up timing, pause/hide timer, hints, reveal/skip, Found/Revealed/Still to Find, and progress ticks using the shared place colors.
- Added keyboard answers at the map crosshair. Hints focus and outline the target and mark it assisted; skipped and missed/assisted places form a replayable review subset. Review cannot overwrite a full-map speed record.
- Saved versioned active rounds and scope/coverage/dataset-specific perfect records locally. Refresh and Home continuation resume valid rounds. Invalid/obsolete saves fall back safely, storage failures leave play available, completed IDs prevent duplicate record writes, and hidden/unready/paused maps stop the clock.
- Integrated collision-aware answer plaques and hard completed-map depth (5px under 700px width, 7px otherwise, .82 alpha, original land union plus 1.4px clearance removed). Captured the actual rendered map, labels, coordinates, depth, and session results in a postcard. Pointer completion uses the approved reveal; keyboard completion is immediate and reduced motion uses a fade.
- Added replay, next map, review, completed-map view, and result recovery after refresh. Completion snapshots stay in memory and are reconstructed, not stored as large local-storage values. Existing flag previews remain normal full-detail images.
- Seventeen automated tests pass, including complete correct-answer runs for every scope/coverage pair, exact roster totals, scoring and duplicate prevention, hints/skips, review, resume validation, record separation/idempotence, storage failure, and label placement. TypeScript and the production build pass; Vite's existing large map-chunk advisory remains documented.
- Production browser checks passed a wrong answer, hint, keyboard correct answer, pause and hidden timer, refresh/resume, full regional completion, review/replay, next-map navigation, Home continuation, 390px play/results layouts, and clean console logs. A full 253-place world round was completed through Reveal & Skip to exercise long-round state, all labels, and the world postcard; its final keyboard action correctly omitted the entry animation. This verifies the world completion flow without claiming those skips were correct answers.
