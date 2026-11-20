# pinthatshi: roadmap and build journal

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

Use `main` for the initial documentation checkpoint. Use short feature branches for later application changes, reviewing the diff before merging. Push completed checkpoints; use a clearly described draft branch if sharing unfinished work.

## Release path

| Milestone | Deliverable | Complete when |
| --- | --- | --- |
| v0.1 — Foundation | README, catalog, roadmap, preserved design inspection, and clickable wireframes. | Main screens and navigation can be reviewed; repository history is on GitHub. |
| v0.2 — Atlas design | Application scaffold, home, area cards, fonts, frame, parchment panels, and map styling. | Desktop and narrow layouts have been visually reviewed against the references. |
| v0.3 — Interactive map | Pan/zoom, selection, geographic scope, overseas areas, small-place handling, and content checklist. | World and regional views remain aligned and usable; coverage and attribution are documented. |
| v0.4 — First playable | Find Countries worldwide, by subregion, continent, and world; expanded areas; hints, results, local records. | A player can complete every supported scope and replay or review missed items. |
| v0.5 — Country recall | Name All Countries, Name the Country, silhouette reveal. | Typed answers and map reveals work across the shared scopes. |
| v0.6 — Capitals | Country selection, city pinning, capital recall and identification. | Capital exceptions are verified; distance and accuracy records are correctly separated. |
| v0.7 — Flags | Map the Flag, Name the Flag, Match the Flag, Name All Flags. | Flags remain recognizable and map fills stay clipped to boundaries. |
| v0.8 — Progress | Review Mistakes, suggested practice, export/import, improved records. | Progress persists, can be moved between devices, and survives supported upgrades. |
| v0.9 — Philippines | Province and region games, with region/island-group/national scopes. | Coverage and membership are checked against a documented PSGC version. |
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
