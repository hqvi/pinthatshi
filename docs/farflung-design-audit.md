# Farflung Learn Countries: design inspection

Inspected 20 November 2026 at https://farflung.game/learn-countries.

Follow-up: the wireframes are approved, and the user reaffirmed a 1:1 visual target. The [visual direction](visual-direction.md) records the sprite investigation and selective pixel-art requirement. Wireframe colors and system fonts are not the final design.

## Target agreed with the user

Use Farflung's Learn Countries screen as the close visual reference. Discard the generated colored-terrain concept. Preserve the parchment-and-blue atlas appearance, pixel typography, thin ink borders, textured surfaces, and map-first layout. Further geography learning modes come after the design is established.

This document records observations and an implementation approach. No game has been built yet. Measurements below reflect the inspected viewport, not universal dimensions.

## Confirmed from the live frontend

- MapLibre GL JS renders an underlay (`maplibregl-canvas`), with a separate interactive canvas (`pm-canvas`) and another frame canvas (`pl-frame`). The custom canvas has accessible map instructions and supports country selection, dragging, zooming, and keyboard input.
- The public frontend identifies the tile source as `https://tiles.openfreemap.org/planet`. The inspected map module uses OpenMapTiles source layers, including water, waterways, land cover, roads, and buildings. It also supplies separate GeoJSON land, coast, and border layers.
- The MapLibre underlay is non-interactive; a separate interaction/rendering layer coordinates the experience. Its inspected constructor disables antialiasing and uses no fade duration. This does not establish that every visible layer is drawn at low resolution.
- Body, button, and map-control text use VT323. The Learn Countries heading uses Bungee. Other loaded fonts include Yellowtail and Oswald; those are not required to recreate the core learning screen.
- A repeating embedded PNG supplies paper texture. A separate walnut image supplies the surrounding desk. Textures and ornamental details are separate work from selecting a map renderer.
- Coast halos, sparse water marks, fine graticules, coordinate labels, and paper grain are visible. Their exact generating algorithms have not been fully traced.
- The observed region-selection screen has a large map and a scrollable parchment sidebar, region thumbnails, compact uppercase labels, and fine brown outlines.
- Starting Western Europe opens a regional map, timer/progress header, country prompt, hint control, zoom controls, and whole-sheet control. Countries outside the selected region are subdued. The sidebar selection layout and active-round layout differ.

## Measured visual tokens

These are observed CSS values; similar names belong to distinct map and chart rendering paths. Match screenshots rather than replacing every land/sea token with one color.

| Role | Observed value |
| --- | --- |
| Main parchment / panel | `#f4e9cd` |
| Raised card | `#f8f0dc` |
| Main ink | `#2b2118` |
| Secondary ink | `#6a583f` |
| Hairline | `#b9a67e` |
| Chart ocean | `#a9c3c9` |
| Chart land | `#ecdfb9` |
| Chart land shadow | `#e4d5a9` |
| Chart land light | `#f3e8c8` |
| Chart coast | `#3a2c1d` |
| Shallow coastal band | `#b7ced1` |
| Inner coastal band | `#c7dad9` |
| Wave marks | `#4868746b` |
| Graticule | `#3a2c1d4d` |
| Map underlay sea | `#9ab8c2` |
| Map underlay land | `#e3d2a8` |
| Map underlay coast | `#4a3a26` |
| Map underlay border | `#8a7250` |
| Red accent | `#c0362d` |
| Gold | `#f2c14e` |
| Navy | `#24394c` |

At a 1254 x 929 CSS-pixel viewport, observed text sizes were 37.5px for the learning heading, 18.75px for body text, 15px for small labels, 12.5px for fine labels, and 25px for figures/large controls. Main uppercase tracking tokens include .04em, .08em, .12em, and .16em.

The frame inset token was 12px. Controls generally use square corners, one- or two-pixel ink lines, and hard offset shadows rather than soft shadows. One observed bevel is `0 0 0 1px #2b2118, 2px 2px 0 1px #2b2118`. The observed header is 46px high; quiet controls have a 44px minimum height. The inspected desktop page has a 92px advertising reservation above it; omit advertising space from our design prototype.

## How to recreate the appearance

1. Build a local design prototype centered on the region-selection screen. Use the same font families from their upstream distributions, preserving their bundled license files. Set the measured palette, square controls, double frame, heading treatment, and sidebar hierarchy first.
2. Use MapLibre with a purpose-built atlas style and OpenFreeMap detail tiles. Obtain country/coast geometry from an independently sourced geographic dataset; do not make the project depend on Farflung's private deployment or extract its complete application as our implementation.
3. Rebuild the distinctive paper grain, water marks, shoreline bands, graticules, and frame effects. Use deterministic textures so visual comparisons are repeatable. Keep geography sufficiently detailed that small countries and zoomed coasts remain usable. A blurred or pixelated static world image is not a substitute for an interactive map.
4. Compare against the user's third reference image at 1880 x 970, then inspect a regional close-up and a narrow viewport. Match typography, proportions, coastline detail, texture density, and contrast before adding more learning games.
5. Extend the established visual components to active rounds after the selection screen matches. Keep our application code independent, with local map interaction and progress state.

## Remaining limits and acceptance checks

- A pixel-perfect match is not established. Custom drawing behavior and texture generation need implementation and visual iteration.
- The live site is responsive and includes advertising reservations. Do not infer a fixed sidebar ratio from one viewport. At the inspected 1254px width, the sidebar occupied roughly 474px; the user's wider reference gives the map substantially more room.
- Validate global view, Western Europe zoom, small islands, panning, zooming, and country selection. Borders must remain aligned with rendered land at every zoom.
- If map detail tiles fail, keep a country/coast view available and preserve interaction. The inspected site itself provides a coasts-only fallback message.
- Use the tile service's attribution requirements and upstream asset licenses. No permission to redistribute Farflung's custom assets has been established in this inspection; recreate those effects for the implementation.
- Reference screenshots are design targets, not authoritative geographic data.

## Sources

- Live page and rendered styles: https://farflung.game/learn-countries
- Observed stylesheet: https://farflung.game/assets/index-HJ9YD0VE.css
- Observed public map module: https://farflung.game/assets/maplibre-shell-9pWZiuLI.js
- Observed public frontend bundle: https://farflung.game/assets/index-vytxJ1Po.js
- OpenFreeMap integration: https://openfreemap.org/quick_start/
- VT323 upstream: https://github.com/google/fonts/tree/main/ofl/vt323
- Bungee upstream: https://github.com/google/fonts/tree/main/ofl/bungee

Hashed deployment asset URLs are inspection references, not stable application dependencies.
