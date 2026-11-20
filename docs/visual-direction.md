# pinthatshi: visual direction

Status: wireframe layouts approved. The wireframe palette and system fonts are placeholders, not the final game style.

## Fidelity target

The user explicitly wants a **1:1 visual match to Farflung's Learn Countries experience**, extended to pinthatshi's additional games. Don't substitute a generic retro theme, a modern dashboard, colored physical terrain, or a fully blocky world map.

Use the [measured design inspection](farflung-design-audit.md) as the starting specification. Inspect public rendered screens and styles where information is missing. Compare matching viewport sizes and map framing before claiming a match. Exact fonts and sampled colors are measurable; a pixel-perfect full interface has not yet been demonstrated.

The [visual reference sheet](style-guide/index.html) previews the measured fonts and palette, recreated surface effects, and original grid-based sprite examples. It is a design reference, not v0.2's finished application.

The user also approved that appearance and requested the Farflung-style completion/postcard flow. The [UX and motion specification](ux-motion.md) and [interaction lab](interaction-lab/index.html) cover completion, map depth, and clean flag images clipped into country shapes. The later explicit choice of normal flag images supersedes the earlier pixel-flag experiment.

## What changes after the wireframes

| Part | Required treatment |
| --- | --- |
| Body, prompts, counters, controls | VT323, with the measured sizes and tracking. Don't keep the system monospace placeholder. |
| Major section titles | Bungee; measured reference title size 37.5px, line height 39.375px, and a 2px blue offset shadow. |
| Paper and cards | Warm cream with fine, restrained pixel grain; ink rules and square corners. |
| Water and coastlines | Dusty blue water, sparse wave marks, layered pale coastal bands, fine dark coast outlines. |
| Country geometry | Detailed real geography with legible boundaries, including small places. Don't apply a blanket pixelation filter. |
| Frames and buttons | Thin ink lines, double outlines, hard offset shadows, cream/navy/red/gold hierarchy. |
| Desk surround | Dark, restrained wood texture behind the atlas frame, following the reference. |
| Small objects | Deliberately drawn pixel-grid assets with crisp integer scaling. |
| Flags | Normal full-detail SVG or suitably resolved raster images, with original proportions and identifying details. No pixel filter. |
| Completed map | Hard red offset exterior of the answered land union; include the same layer in the postcard snapshot. |

Use the fonts from their upstream distributions, stored locally with their license files. The reference sheet contains those fonts; it doesn't depend on a third-party font service at runtime.

## Confirmed souvenir construction

On 20 November 2026, the inspected Farflung Souvenirs screen used inline SVG objects with:

- `viewBox="0 0 16 16"`.
- A displayed size of 48 x 48 CSS pixels: a 3x enlargement.
- `shape-rendering="crispEdges"`.
- Integer-coordinate paths defining the pixel clusters.
- Muted pencil outlines for the observed locked state, and clipped fill/progress layers on some objects.

This confirms that a pixel sprite can be SVG. It doesn't have to be a blurry enlarged bitmap or an emoji. The inspection covered locked objects and their markup; it did not verify the complete unlocked color artwork or every souvenir animation. Do not label invented artwork as an extracted Farflung asset.

## Sprite rules for our assets

- Start small interface objects on a 16 x 16 logical grid; render at integer multiples such as 32, 48, and 64px.
- Use a consistent one-cell contour, limited shading, clear silhouettes, and the measured ink/paper palette where appropriate.
- Use SVG with integer pixel geometry or a deliberately drawn PNG. Raster assets require nearest-neighbor scaling; SVG assets require crisp edges.
- Flags are images, not pixel sprites. Keep national colors, symbols, and proportions intact. Don't reduce them to a logical pixel grid or approximate their emblems.
- Keep a complete rectangular flag visible alongside any flag fill clipped to a country's geographic shape. Don't distort flag art to trace the coastline.
- Use sprites for small objects such as pins, books, and stamps. Keep flags, panels, typography layout, and map geometry at normal browser resolution.
- No emoji as the final icon or flag system, no soft enlargement, no arbitrary gradients or 3D lighting on pixel assets.

These rules establish an asset style, not a new collectible or achievement feature. Such mechanics remain separate product decisions.

## Next milestone: v0.2 atlas design

### Map details reserved for the interactive renderer

The current static experiments are not the final map renderer. Preserve these explicit requirements from the user's latest reference:

- Geographic graticule lines tied to longitude/latitude, with spacing that adapts to zoom; not a decorative screen-space grid.
- Latitude labels along the left edge and longitude labels along the bottom, aligned with the visible map coordinates during pan, zoom, and resize.
- One shared country-color assignment for the map fill, Found list dots, progress ticks, and country-name plaques; sidebar surfaces must use the same approved parchment tokens.
- Legible parchment country-name plaques with ink borders and matching color dots, anchored to each place with collision handling for small or crowded countries.

Implement these with the real map and answer-state integration (v0.3/v0.4), then preserve them in postcard captures. They are tracked fidelity requirements, not discarded details. The user approved moving on to the application screens before these corrections.

The interactive-atlas checkpoint now implements adaptive geographic gridlines and edge coordinates through the actual map projection, plus a selected-place plaque and shared map/sidebar color. Panning, zooming, and resizing update the overlay. The map remains north-up so its edges represent longitude and latitude consistently. Completed-map label collision handling and postcard capture still need real session integration. Continue comparing overall texture, coastline treatment, boundary detail, and type scale against the references; this is not a completed 1:1 claim.

1. Preserve the approved wireframes as the layout reference.
2. Scaffold React, TypeScript, and Vite; turn the measured visual tokens into application styles and shared components.
3. Match the Learn Countries area picker first: frame, sidebar proportions, fonts, dividers, card labels, and map framing.
4. Add independent geographic data and reproduce water, coast, grain, and graticule treatments. Check world and regional views against reference screenshots.
5. Apply the same system to Home and the other approved screens, adding small sprite assets where they serve the interface.
6. Review desktop and mobile screenshots and document remaining differences. Don't call the map 1:1 merely because the colors and fonts match.

## Sources and asset provenance

- Visual and sprite measurements: https://farflung.game/ (Menu → Souvenirs), and https://farflung.game/learn-countries.
- VT323: https://github.com/google/fonts/tree/main/ofl/vt323.
- Bungee: https://github.com/google/fonts/tree/main/ofl/bungee.
- Local font files retain their upstream SIL Open Font License notices.
- Reference-sheet textures and example SVG sprites are independent, editable constructions. No souvenir drawing paths or custom textures from Farflung are distributed here.
