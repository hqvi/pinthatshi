# pinthatshi

A geography learning game I'm building one version at a time.

Find countries, remember capitals, recognize flags, and eventually learn the regions and provinces closer to home. The visual direction is a textured, pixel-style atlas, with Farflung's **Learn Countries** as the main reference.

## Where the project is now

**v0.2 in progress: the application has started.** The React application includes Home, the game library, and Learn Countries area selection. Select any of the 28 region, continent, or world previews; refresh or navigate back without losing the area and coverage setting. Geography answers and scoring arrive later.

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

The current map is an independently sourced static overview. The coverage toggle records your preference; it does not yet filter a playable place list. MapLibre interaction, geographic gridlines, coordinate labels, country plaques, and shared answer colors are tracked for v0.3/v0.4. This is an application checkpoint, not the completed v0.2 release or the final map renderer.

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

React, TypeScript, and Vite now run the application. Shared components render the atlas and area cards; URL state controls navigation and area selection. MapLibre is planned for the interactive geography milestone. The original plain HTML design previews remain available separately.

Each step gets an explanation, a working change, a check, and a focused Git commit. Releases mark milestones; the smaller commits show how we got there.

## References and data

The Farflung reference guides visual and interaction design. The implementation will use our own application code and independently sourced geography. Data and asset sources, attribution, and applicable licenses will be documented as they are introduced. No Farflung application bundles, custom artwork, or datasets are included in this repository.

Country and area totals will come from a published, versioned content checklist. Wireframe examples do not establish final geographic coverage.

The app's overview artwork uses [Natural Earth v5.1.2 1:50m countries](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_50m_admin_0_countries.geojson), which is public-domain cartography. It does not establish the final place checklist or region membership. To regenerate the bundled illustration, download that GeoJSON and run `node scripts/create-atlas-art.mjs <path-to-geojson>`; normal installs and builds use the committed artwork and need no download. Pacific framing and small-place visibility will be resolved with the interactive renderer.

Upstream font notices are retained in `docs/style-guide/fonts/` and copied to `public/licenses/` for inclusion in builds. GitHub Actions runs the TypeScript and production-build checks on pushes and pull requests.
