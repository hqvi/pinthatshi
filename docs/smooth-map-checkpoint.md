# Smooth-map and guided-hint checkpoint — v0.6.0-alpha.1

## Rendering and controls

MapLibre's render event drives coordinate grids, labels, wrong-answer arrows, and location circles from one camera snapshot. No camera frame sets React state. The atlas component is memoized; clock ticks use a stable selection callback. Canvases resize only when dimensions change. Completed-map silhouettes and plaque measurements are cached.

Horizontal waves use an independent Mercator GPU point-sprite layer beneath land and shore bands. Deterministic world positions persist across detail levels; finer levels fade in. GPU resources are recreated after context restoration and released on removal. Static internal boundaries are deduplicated so two neighbouring dash patterns cannot combine into a solid edge.

LMB selects, including double clicks. RMB zooms half a level about its position; a dragged RMB does not zoom. Wheel, pinch, keyboard, and zoom buttons remain available. Location hints may pan without changing zoom. Completion first holds the map stationary, then covers it with paper before preparing a scope-wide postcard capture, so answer clicks do not visibly refit the camera.

Small-country rings have transparent centers, a faint rim and parchment halo. They are anchored on actual source land, select the nearest eligible country when overlapping, and fade with projected footprint and at maximum zoom. Tiny-country plaques prefer offset placement with leader lines rather than covering the shape. The new pin cursor is an original 16×20 pixel-grid SVG with a needle-tip hotspot.

## Memberships and geographic audit

The 22-map picker follows the selected reference arrangement: North and Central, Caribbean, South America; four European regions plus Europe; five Asian regions plus Asia; five African regions plus Africa; Oceania; World. Source geometry is retained separately from the explicit learning memberships. Country continent totals are 23, 12, 45, 49, 54, and 14, summing to 197. Expanded coverage retains all 253 places. Every place has exactly one primary continent.

Maldives is now included in whole Asia. French Guiana remains independently selectable in expanded South America. The source's ocean-area classifications have explicit learning assignments rather than being omitted from continent pools. Old region URLs resolve to the new combined maps.

Morocco/Western Sahara geometry was compared with the independent Natural Earth v5.1.2 1:10m country source. The pinned 1:50m shapes agree at atlas scale; the source geometry was retained. Coverage, shared-border rendering, and valid anchors were corrected instead of inventing a new boundary. Countries coverage shows Western Sahara as faded context; expanded coverage makes it separately selectable. Tests check representative point ownership and all selection-aid anchors. Earlier data and records remain stored; dataset version 2 prevents comparison with changed pools/rules.

Thumbnail framing uses local member geometry within regional display windows, so Russia's remote extent does not shrink Eastern Europe. Explicit SVG clipping prevents repeated world copies appearing in letterbox margins. World thumbnail framing crops polar margins to match the reference composition. Outside geography is faded. Capitals and Flags retain placeholder artwork.

## Gameplay feedback

- Space/Hint: silhouette first; Show it/Space: red location circle second.
- Wrong answer: persistent red country, pin origin, and short eight-direction arrow. The third mistake also circles the location. Feedback clears on advancing or is replaced by the next valid wrong guess.
- Streak milestones: 3, 5, 10, 20, 30, then every ten. Gold styling and small confetti from ten onward, with synthesized milestone cues. Assistance/mistakes/skips reset the streak.
- Hover motion straightens the playable game card; region cards use a small translation and border response, with constant shadows. Reduced motion and keyboard-initiated celebrations omit positional motion/particles.

## Validation

31 automated checks cover geography/coverage, all region pools, single primary continents, source point ownership, valid aid anchors, aid fading, dateline direction, unique boundary edges, regional framing, leader-label space, staged hints, third-mistake reveal, streaks, record separation, and legacy archive preservation.

Browser verification used a separate local test origin, leaving the user's existing preview/progress untouched. Actual UI selections produced 3/5/10 streaks and a perfect ten-country result. Checked first/second Space hints, persistent wrong fill/arrow, third-mistake circle, island-ring clicks outside tiny land, LMB/RMB/wheel behavior, capture, and phone width/resume. During a settled atlas wheel zoom, React render count stayed at 12 across 32 measured render samples; observed overlay p95 was 1.3ms. Another quiz run measured 2.5ms. These are local CPU overlay measurements, not a guarantee of whole-page FPS on other devices.

All checks and production builds run locally. Commits remain local; no push or deployment is part of this checkpoint.
