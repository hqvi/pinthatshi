# UX, motion, and detailed flags

The approved appearance includes behavior as well as colors. Completion should feel like the map has become a kept postcard, following the supplied Farflung screenshots. Normal practice must remain quick and legible.

## Planned interactions

| Interaction | Purpose and behavior |
| --- | --- |
| Area selection | Focus the chosen geographic area and move between the picker and play layout while preserving spatial context. |
| Correct country | Confirm the selection with color, a label, and progress update; keep the next prompt responsive. |
| Incorrect selection | Brief, readable feedback and another attempt; avoid a large shake or disruptive camera move. |
| Hint | Guide attention to the target without making subsequent controls wait for an animation. Mark the answer as assisted. |
| Completion | Keep the completed map visible, then reveal a postcard with its snapshot, summary, and completion stamp. Offer replay and another area. |
| Silhouette answer | Reveal surrounding geography so the shape is connected to its real location. |
| Flag answer | Confirm the correct place and reveal the flag inside its boundary while retaining a complete rectangular flag reference. |

The [interaction lab](interaction-lab/index.html) preserves the original completion and flag-fill experiments. Find Countries now uses real answer state, collision-aware map labels, a hard 5/7 CSS-pixel red exterior depth layer, and a captured-map postcard with actual results. Answer feedback is immediate; the pointer-triggered postcard uses the approved 500ms transform/opacity entry, with a 160ms fade under reduced motion and no entry animation after a keyboard completion. Other game modes remain future work. This implementation is not a claim that every Farflung timing or camera detail has been matched.

## Motion requirements

- Frequent actions get brief feedback; the larger celebration occurs at session completion.
- Don't animate every component or make answer entry wait for decorative effects.
- Use transform and opacity where practical. Keep integer scaling for sprite artwork itself.
- Every sequence must support interruption, reset, and an accessible end state.
- Reduced motion removes zoom, tilt, and stamping motion while preserving state information through a gentle fade.
- Keyboard-triggered lab previews settle immediately; keyboard use must not depend on decorative animation timing.
- Play, replay, and next-area controls remain available promptly. No forced countdown before continuing.
- Use actual session state and a captured map snapshot in the application. The lab's numbers and static illustration are sample content only.

## Detailed flag policy

The user chose normal flag images. Use full-detail SVG or adequately resolved raster artwork, preserving proportions and original symbols. Pixel-grid conversion is removed from the active previews and planned game.

The lab shows Brazil, Mexico, Spain, and the Philippines in geographic context. A proportion-preserving flag image covers the country's bounding rectangle and is clipped to its actual polygon, including holes and island components. This naturally hides some artwork outside the shape; a complete rectangular reference stays beside the map. Do not warp the flag to trace the coastline or claim every emblem will remain visible inside every country shape.

Keep a larger full-detail flag available. Don't invent emblem details, replace lettering, or omit identifying stars. Country-shaped fills supplement the full flag rather than replacing it.

## Confirmed completed-map depth

Inspected a live five-country round through completion and postcard reveal on 20 November 2026, then the current public rendering module. The effect is a separate `lc-print` canvas: the answered land union is offset down/right, and the original union plus its outline is removed, leaving the hard side face. The source chooses 5 CSS pixels below a 700px map width and 7px at wider widths, with the red accent at .82 alpha. The postcard capture includes this layer.

The independent static preview uses an equivalent SVG mask with a 7-unit offset and .82 opacity. The playable application's canvas uses the measured 5/7 CSS-pixel rule, removes the original union plus its 1.4px outline, and includes that canvas in the captured postcard. Labels move to nearby clear positions or hide when crowded, while the Found/Revealed lists retain every name.

## Next integration step

Find Countries now connects the atlas to live prompts, answers, review, records, and completion. Camera changes use a 350ms transition, or immediate updates with reduced motion. The next milestone adds country recall and identification; normal-image flag rendering joins real sessions in the flags milestone. Continue refining the common atlas surfaces rather than adding disconnected demos.
