# UI/UX polish checkpoint — v0.5.0-alpha.1

This local milestone follows the provided gameplay recording. It continues the existing Find Countries game; it adds no new game modes.

## Reference decisions

The reference uses a custom OpenFreeMap style, not an unmodified stock OpenMapTiles theme. Our application implements its own paper atlas layers, procedural waves, cursor, compass, and Web Audio cues. No extracted reference bundles or custom assets are shipped.

Measured palette: `#ff5e7e`, `#ffb81c`, `#00a99d`, `#4f7cff`, `#a35cff`, `#ff7a2f`, `#7dcc3a`, `#ff8fd0`. Per-scope assignments balance usage and avoid neighbouring same/near colors. The map composites fills over parchment, with assisted/revealed places lighter. Sidebar dots and plaque dots retain the corresponding palette color.

Grids use a 46px minimum nominal interval, adapting through fractional/whole degrees as the camera zooms. Ocean crests are eight-pixel horizontal marks sampled from deterministic world-space cells with level blending. Cached Mercator land paths mask their shore clearance; there is no repeating wallpaper tile.

The compass is a fine SVG dial. Its needle receives horizontal pan impulses and springs back north; zoom does not introduce a pan impulse. Reduced motion keeps it steady. Completion uses a brief map hold followed by a paper entrance and stamp. Keyboard completion skips positional motion. Buttons retain quick press feedback.

## Geographic sources and accuracy

Country and map-unit geometry remain Natural Earth v5.1.2 1:50m, with the frozen 253-place roster and documented country/area policy. Separate physical coastlines from the same version/resolution prevent inland borders from acquiring coastline halos or solid coast strokes. Long coastline paths are split at shared endpoints to stay under the renderer’s 16-bit mesh limit, retaining every source vertex. These are atlas-scale generalized shapes; tiny places use explicit aid circles. The map uses Mercator projection consistently for land, waves, labels, grids, hit tests, and capture.

Optional detail tiles use OpenFreeMap's planet vector endpoint. The custom detail style adds water, waterways, and transportation without place-name labels. They do not replace quiz geometry or alter scoring. Local country/coast assets remain the fallback when detail requests fail. Required OpenMapTiles/OpenStreetMap credits are available through the compact © control.

The physical coastlines can be regenerated from the [Natural Earth v5.1.2 coastline GeoJSON](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_50m_coastline.geojson) with `node scripts/create-coastlines.mjs <downloaded-file>`. Country geometry and overview regeneration retain their existing scripts.

## Verification

Automated checks cover the unchanged roster, all scope/coverage combinations, scoring, label collisions, adaptive spacing, deterministic palettes, backward-compatible saves, and independent map slots. Browser checks cover region entry/resume, direct wheel zoom, Space hint, correct/wrong feedback, completion capture, mute persistence, and phone width.

Normal detailed flag imagery remains the chosen direction. Remaining modes and country packs are not part of this polish checkpoint. All commits stay local under the owner's updated Git policy.
