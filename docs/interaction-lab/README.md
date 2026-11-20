# Completion and detailed-flag lab

Run `node scripts/preview.mjs` from the repository root, then open `/interaction-lab/`.

This is a design experiment. It is not the application scaffold, a playable quiz, or a completed 1:1 reproduction of Farflung's motion. Session numbers and lists are illustrative.

## Motion experiment

The purpose is state indication and spatial continuity: a completed map becomes a postcard summarizing the session. Completion is occasional; answer-entry and keyboard navigation must remain fast.

- Web Animations API; transform and opacity only. No animation library.
- Card entrance: 500ms; stamp: 160ms; fade: 160ms. Curve: `cubic-bezier(.23, 1, .32, 1)`.
- These are prototype timings for review, not claimed measurements of Farflung's entire completion sequence.
- Skip/reset cancel active animations. A second preview request during playback settles immediately. Completion controls remain usable without waiting.
- Reduced-motion preference or the lab toggle uses a gentle fade without tilt, scale, or stamping motion. Keyboard-triggered previews settle immediately.
- The 3× slow-preview setting supports visual timing inspection.

The public Farflung parts stylesheet confirmed postcard-specific styling and a separate stamp effect. It uses Oswald for the card face; the site's loaded fonts also include Yellowtail. Their upstream files and license notices are bundled locally for the prototype. This does not establish the exact timing or physics of every reference transition.

## Detailed flags

Mexico, Spain, Brazil, and the Philippines compare the full-detail source against coarse, medium, and fine raster grids. Source proportions remain exact by using grid dimensions that are multiples of each flag's aspect ratio. Display sizes use integer scaling.

Fine is the initial treatment for these intricate examples. Coarse deliberately demonstrates lost detail. This is source-driven rasterization, not a complete hand-polished sprite set. Do not turn the coarse example into a harder quiz difficulty: it removes information rather than testing geographic knowledge.

The final game must preserve identifying symbols and offer an enlarged full-detail reference. Individual production flags require checks; do not use a generator to invent coats of arms, lettering, or stars. Country-map fills remain secondary to the complete rectangular flag.

### Flag source

- Repository: https://github.com/hampusborgos/country-flags.
- Pinned revision: `c09927e63705529bbf59ca6684cd9b23225dddad`.
- Files: `svg/mx.svg`, `svg/es.svg`, `svg/br.svg`, `svg/ph.svg`.
- Original files are retained without recoloring or geometry edits. The upstream README describes Wikimedia Commons provenance and its public-domain treatment; production review should retain item-specific source information.

### Static map source

- Natural Earth, v5.1.2, `ne_110m_admin_0_countries.geojson`.
- https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_110m_admin_0_countries.geojson.
- https://www.naturalearthdata.com/about/terms-of-use/.
- The map is an independently rendered South America crop with illustrative colors. It does not set final coverage, political labels, or the playable dataset. At 1:110m it is too coarse for final small-country selection.
- Regenerate with `node scripts/create-demo-map.mjs PATH_TO_SOURCE_GEOJSON`. The default source path is `.preview/ne_110m_admin_0_countries.geojson`, which is not tracked.

## Checks before application integration

Check completed/reset states, interruption, rapid replay, keyboard activation, reduced motion, and a phone viewport. Check that every source flag loads, aspect ratios remain unchanged, and canvas scaling is integral. Judge emblem readability visually; source pixel count alone cannot establish that a flag is suitable for learning.
