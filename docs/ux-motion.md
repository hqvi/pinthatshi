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

The [interaction lab](interaction-lab/index.html) implements the completion experiment and detailed-flag comparison. The application, map interactions, and the other rows above remain future work. The prototype isn't proof that all Farflung timing, camera behavior, or physics has been matched.

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

Not every flag belongs on the same tiny grid. Use a resolution appropriate to its symbols and preserve its actual proportions. Source detail and symbol recognition take priority over forcing a coarse sprite.

The lab compares Mexico, Spain, Brazil, and the Philippines at coarse, medium, and fine grids alongside their full-detail sources. Coarse is a diagnostic comparison, not a game difficulty. Fine rasterization is still a prototype and needs visual review and hand refinement where appropriate.

Keep a larger full-detail flag available. Don't invent emblem details, replace lettering with misleading marks, omit identifying stars, or rely only on a small country-shaped flag fill. Existing 24 x 16 France/Japan examples demonstrate simple designs; they do not set the universal resolution for all flags.

## Next integration step

Build the v0.2 React/TypeScript application and the faithful area-picker/map surface. Carry these UX requirements into its components, then connect completion and flag rendering to real session data during the relevant gameplay milestones. Avoid adding more disconnected demo pages before starting that application work.
