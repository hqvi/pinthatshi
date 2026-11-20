# pinthatshi

A geography learning game I'm building one version at a time.

Find countries, remember capitals, recognize flags, and eventually learn the regions and provinces closer to home. The visual direction is a textured, pixel-style atlas, with Farflung's **Learn Countries** as the main reference.

## Where the project is now

**v0.1: planning and wireframes.** The game is not playable yet. This checkpoint defines what we're building and lets us walk through the main screens before implementing the map and game rules.

- [Game design and complete mode catalog](docs/game-design.md)
- [Version roadmap and how we'll build](docs/roadmap.md)
- [Wireframe guide](docs/wireframes.md)
- [Farflung design inspection](docs/farflung-design-audit.md)

## Open the wireframes

Open [docs/wireframes/index.html](docs/wireframes/index.html) in a browser. It works without installing packages or connecting to a service.

For a local browser preview with Node.js:

```sh
node scripts/preview.mjs
```

Then visit the local address printed in the terminal. Press `Ctrl+C` in that terminal to stop the preview.

The walkthrough includes Home, Games, Areas, Play, and Results. It uses illustrative content and map placeholders. Buttons demonstrate navigation; they don't check geography answers or save progress yet.

## First playable milestone

**Find Countries across the whole world:** practice by subregion, continent, or worldwide, with hints, found and remaining lists, results, and local best records. Include a clearly labeled **Countries & Areas** option so overseas areas aren't silently left out.

Later versions add country recall, capitals, flags, mistake review, and country packs. The Philippines comes first, followed by the USA and UK.

## Build approach

React, TypeScript, Vite, and MapLibre are the planned application foundation. This initial checkpoint uses plain HTML, CSS, and JavaScript so the screen flow can be reviewed before the application is scaffolded.

Each step gets an explanation, a working change, a check, and a focused Git commit. Releases mark milestones; the smaller commits show how we got there.

## References and data

The Farflung reference guides visual and interaction design. The implementation will use our own application code and independently sourced geography. Data and asset sources, attribution, and applicable licenses will be documented as they are introduced. No Farflung application bundles, custom artwork, or datasets are included in this repository.

Country and area totals will come from a published, versioned content checklist. Wireframe examples do not establish final geographic coverage.
