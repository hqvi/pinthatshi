# Completion depth and country-shaped flags

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

## Completed-map depth

The live Farflung completion effect was inspected by finishing a Central Asia sheet, observing the raised map, and observing the postcard. The current public `learn-CdQkcsgz.js` module confirms a separate `lc-print` canvas with a down/right offset union, original-shape subtraction, and a thin outline clearance. The source uses 5px for map widths below 700px and 7px otherwise, with the accent fill at .82 alpha. Its postcard capture includes that canvas.

Our independent SVG preview reproduces that layer structure using a stationary mask and a shifted silhouette, avoiding red seams between adjacent countries. The static illustration uses a 7-unit offset that scales with the image; exact screen-pixel behavior belongs in the actual renderer. **Raised map edge** switches both the main map and postcard between the same flat/raised assets. There is no blur filter.

## Normal flag images and map fills

The user chose normal full-detail flags, replacing the earlier pixel-grid experiment. No flag canvas, pixel filter, or simplified coat of arms remains in the active preview.

Brazil, Mexico, Spain, and the Philippines each have a contextual map preview. The unchanged flag is embedded in a self-contained SVG, sized explicitly to cover the geographic bounding rectangle at its original aspect ratio, and clipped to the selected polygon. Explicit dimensions avoid letterboxing inside nested SVG images. Neighboring countries remain visible. The separate complete flag remains visible because clipping an irregular outline naturally removes parts of the rectangular design.

Spain uses an Iberian crop, including nearby islands rather than extending the frame to the Canary Islands. These are viewport examples, not coverage decisions. A busy/loading state prevents a new country label from being paired with the previously loaded map while its replacement image loads.

Switch country or turn off **Fill the country with its flag** to compare the highlighted outline. These are correct-answer appearance previews, not live quiz selection or final geographic coverage.

### Flag source

- Repository: https://github.com/hampusborgos/country-flags.
- Pinned revision: `c09927e63705529bbf59ca6684cd9b23225dddad`.
- Files: `svg/mx.svg`, `svg/es.svg`, `svg/br.svg`, `svg/ph.svg`, `svg/fr.svg`, `svg/jp.svg`. France and Japan are used in the visual reference sheet.
- Original files are retained without recoloring or geometry edits. The upstream README describes Wikimedia Commons provenance and its public-domain treatment; production review should retain item-specific source information.

### Static map source

- Natural Earth, v5.1.2, `ne_50m_admin_0_countries.geojson`.
- https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_50m_admin_0_countries.geojson.
- https://www.naturalearthdata.com/about/terms-of-use/.
- Maps are independently rendered Mercator crops with illustrative colors. They do not set final coverage, political labels, or the playable dataset. 1:50m geometry still isn't the final small-country selection dataset.
- Regenerate with `node scripts/create-demo-map.mjs PATH_TO_SOURCE_GEOJSON` and `node scripts/create-flag-maps.mjs PATH_TO_SOURCE_GEOJSON`. Both use `scripts/map-art.mjs`. The default source is `.preview/ne_50m_admin_0_countries.geojson`, which is not tracked.

## Checks before application integration

Check completion/reset, interruption, keyboard activation, reduced motion, and phone layout. Compare flat/raised maps in both views. Verify every country switch and fill toggle, load the embedded flag image, and keep the complete flag alongside the clipped map. Judge clipping visually, especially for archipelagos and outlying islands.
