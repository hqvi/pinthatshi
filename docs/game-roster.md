# Find Countries: first playable roster

Dataset ID: `natural-earth-5.1.2-pinthatshi-1`. The [complete checklist](geography-checklist.md) publishes every stable source ID, display name, grouping, subregion, relationship, and original source type. Tests assert 197 Countries and 56 additional Areas, with 253 entries in expanded coverage. Every one has source geometry and a selectable boundary or small-place aid.

## Countries and areas

Countries uses 193 UN member states plus Vatican City (Holy See), Palestine, Taiwan, and Kosovo for this learning set. This is a game inclusion policy, not a claim that all 197 are UN members. UN references distinguish [member states](https://www.un.org/en/about-us/member-states) and [non-member observer states](https://www.un.org/en/about-us/non-member-states). Natural Earth's source classifications remain available separately in the checklist.

The source incorrectly served as the initial game grouping: Palestine and Kosovo were omitted from Countries while Somaliland was included. Explicit overrides now correct that game policy. Somaliland, Western Sahara, Northern Cyprus, and the other mapped dependencies/associated areas remain selectable with expanded coverage. Do not display a disputed source's sovereign field as an administrative parent. Palestine therefore has no Israel parent label. Overseas areas with an applicable administrative relationship, including French Guiana → France, retain that relationship.

France, Portugal, Netherlands, Norway, New Zealand, and the source's Indian Ocean Territories use separate overseas map units where available. Ordinary internal subdivisions remain joined: the UK stays one country in world modes, for example. French Guiana belongs to South America and is independently selectable in expanded coverage; mainland France belongs to Europe. A round never contains a duplicate place ID. Antarctica is outside this learning set.

## Geographic grouping

Use the checklist's primary Natural Earth continent/subregion assignment, with region-based grouping for the Americas, Africa, and Oceania. Russia's primary practice group is Eastern Europe; Türkiye, Cyprus, Georgia, Armenia, and Azerbaijan use Western Asia; Kazakhstan uses Central Asia; Egypt uses Northern Africa. They occur once within a world round. The complete geometry remains visible and pannable, even when part extends beyond the initial camera bounds. Hints and small-place aids can focus remote or tiny geometry. Regional framing is not a rule for deciding membership.

Source political boundaries reflect the pinned cartographic dataset. Changes to the roster, primary membership, or boundary version require a new dataset ID so old times are not silently compared with a different challenge. Future custom disputed-place options and more detailed small-island geometry can extend this explicit policy.

## First playable session rules

- Each round shuffles its selected pool. A correct place is colored, labeled, and added to Found; a wrong selectable place adds a mistake to the current target and allows another try. Water/context clicks and already resolved places do not add mistakes.
- Hints focus and outline the target, marking it assisted. Reveal & Skip adds it to Revealed and review. Both remain visible on the final map, distinct from correctly found counts.
- First-try score requires no mistake, hint, or skip for that place. A perfect run requires every place on first try without assistance. Only perfect full rounds set a speed record.
- A visible, ready, unpaused round uses a count-up timer. Hidden tabs and unavailable/loading maps pause it. Timer visibility is optional; hiding it does not stop timing. No lives or forced countdown.
- The current round resumes after refresh and from Home. Completed results can be reconstructed after refresh. Local records are separated by mode, interaction, scope, expanded coverage, and dataset ID. Results are saved once per round ID. Review rounds use their own subset and cannot replace a full-map best.
- Completed maps use collision-aware plaques and the hard 5/7 CSS-pixel red exterior offset. The postcard captures the actual rendered map, coordinate grid, labels, depth, and real session statistics. If image capture fails, results remain usable. Snapshots and geometry are not put in local progress storage.

This is an early playable checkpoint. The broader flags, capitals, country recall, and country packs remain later milestones. Full visual matching, additional device/performance checks, broader persistent practice history, and finer data refinements remain open.
