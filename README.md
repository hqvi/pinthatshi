# pinthatshi

A geography learning game I'm building one version at a time.

Find countries, remember capitals, recognize flags, and eventually learn the regions and provinces closer to home. The visual direction is a textured, pixel-style atlas, with Farflung's **Learn Countries** as the main reference.

## Where the project is now

**The interactive atlas foundation is working.** Home and the game library lead to 28 region, continent, and world scopes. The atlas supports pan/zoom, fit-to-area, geographic gridlines, edge coordinates, and place selection. Select a shape or search for a place; its fill, name plaque, and sidebar dot share one color. Geography quizzes and scoring arrive later.

- [Game design and complete mode catalog](docs/game-design.md)
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

The area screen now uses MapLibre with bundled Natural Earth geometry, without external tiles or API keys. Drag or use arrow keys to pan; use the buttons, keyboard plus/minus, or Ctrl+wheel to zoom. Touch interaction uses two fingers so scrolling the page remains possible. The coverage toggle filters selectable places; out-of-scope geography stays visible as context. Search is scope-specific and also provides keyboard access to tiny places, which have circular selection aids on the map.

Home and card thumbnails remain static illustrations. If interactive rendering fails, an overview and retry action stay available. The [253-place exploration checklist](docs/geography-checklist.md) records the current source roster and grouping; the final quiz roster and geographic exceptions still need auditing. Map styling and selected-place plaques are implemented, while answered-country labels, completion depth, and postcard captures await real session state. This is a checkpoint, not a declaration that v0.3 or the visual fidelity work is complete.

`npm test` checks coordinate wrapping, date-line bounds, scope and coverage filtering, overseas relationships, search normalization, and geographic data integrity. GitHub Actions runs these checks alongside the production build.

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

**Find Countries across the whole world:** practice by subregion, continent, or worldwide, with hints, found and remaining lists, results, and local best records. Include a clearly labeled **Countries & Areas** option so overseas areas aren't silently left out.

Later versions add country recall, capitals, flags, mistake review, and country packs. The Philippines comes first, followed by the USA and UK.

## Build approach

React, TypeScript, and Vite run the application. Shared components render the atlas and area cards; URL state controls navigation and area selection. MapLibre, its worker, and the bundled geographic data load when the area screen is opened. The original plain HTML design previews remain available separately.

Each step gets an explanation, a working change, a check, and a focused Git commit. Releases mark milestones; the smaller commits show how we got there.

## References and data

The Farflung reference guides visual and interaction design. The implementation will use our own application code and independently sourced geography. Data and asset sources, attribution, and applicable licenses will be documented as they are introduced. No Farflung application bundles, custom artwork, or datasets are included in this repository.

Country and area totals will come from a published, versioned content checklist. Wireframe examples do not establish final geographic coverage.

The app's overview artwork uses Natural Earth v5.1.2 1:50m public-domain cartography. It does not establish the final quiz checklist. After regenerating interactive geography, run `node scripts/create-atlas-art.mjs` to rebuild the overview from that same bundled roster and shared place colors. Normal installs and builds use committed artwork and need no source download.

Interactive geometry combines the same country source with [1:50m map units](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_50m_admin_0_map_units.geojson) so overseas areas such as French Guiana are selectable without splitting countries into ordinary internal subdivisions. Regenerate using `node scripts/create-geography.mjs <countries-file> <map-units-file>`. The generated source checklist documents the initial grouping, and tests guard the key relationships. The interactive renderer supports Pacific views across the date line; small-place aids supplement the geometry available at this resolution.

Upstream font notices are retained in `docs/style-guide/fonts/` and copied to `public/licenses/` for inclusion in builds. GitHub Actions runs the TypeScript and production-build checks on pushes and pull requests.
