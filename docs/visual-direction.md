# pinthatshi: visual direction

Status: wireframe layouts approved. The wireframe palette and system fonts are placeholders, not the final game style.

## Fidelity target

The user explicitly wants a **1:1 visual match to Farflung's Learn Countries experience**, extended to pinthatshi's additional games. Don't substitute a generic retro theme, a modern dashboard, colored physical terrain, or a fully blocky world map.

Use the [measured design inspection](farflung-design-audit.md) as the starting specification. Inspect public rendered screens and styles where information is missing. Compare matching viewport sizes and map framing before claiming a match. Exact fonts and sampled colors are measurable; a pixel-perfect full interface has not yet been demonstrated.

The [visual reference sheet](style-guide/index.html) previews the measured fonts and palette, recreated surface effects, and original grid-based sprite examples. It is a design reference, not v0.2's finished application.

The user also approved that appearance and requested the Farflung-style completion/postcard flow. The [UX and motion specification](ux-motion.md) and [interaction lab](interaction-lab/index.html) cover the completion experiment, reduced motion, and resolution comparisons for detailed flags. These extend the accepted visual direction rather than replacing the approved layouts.

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
| Small objects and flags | Deliberately drawn pixel-grid assets with crisp integer scaling. |

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
- Flags need their own proportions: e.g. 24 x 16 or 32 x 16 logical cells. Increase source resolution when an emblem cannot remain identifiable. Don't force all flags into a 16 x 16 square.
- Keep national colors and identifying symbols recognizable. Artistic texture must not obscure what the player needs to learn. Production flag artwork requires source verification; the reference sheet's France/Japan sprites are illustrative constructions.
- Keep a complete rectangular flag visible alongside any flag fill clipped to a country's geographic shape. Don't distort flag art to trace the coastline.
- Use sprites for small objects such as pins, books, stamps, and flag artwork. Keep panels, typography layout, map geometry, and interactions at normal browser resolution.
- No emoji as the final icon or flag system, no soft enlargement, no arbitrary gradients or 3D lighting on pixel assets.

These rules establish an asset style, not a new collectible or achievement feature. Such mechanics remain separate product decisions.

## Next milestone: v0.2 atlas design

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
