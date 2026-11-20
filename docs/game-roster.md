# Find Countries: first playable roster

Dataset ID: `natural-earth-5.1.2-pinthatshi-2`. The [complete checklist](geography-checklist.md) publishes every stable source ID, display name, grouping, subregion, relationship, and original source type. Tests assert 197 Countries and 56 additional Areas, with 253 entries in expanded coverage. Every one has source geometry and a selectable boundary or small-place aid.

## Countries and areas

Countries uses 193 UN member states plus Vatican City (Holy See), Palestine, Taiwan, and Kosovo for this learning set. This is a game inclusion policy, not a claim that all 197 are UN members. UN references distinguish [member states](https://www.un.org/en/about-us/member-states) and [non-member observer states](https://www.un.org/en/about-us/non-member-states). Natural Earth's source classifications remain available separately in the checklist.

The source incorrectly served as the initial game grouping: Palestine and Kosovo were omitted from Countries while Somaliland was included. Explicit overrides now correct that game policy. Somaliland, Western Sahara, Northern Cyprus, and the other mapped dependencies/associated areas remain selectable with expanded coverage. Do not display a disputed source's sovereign field as an administrative parent. Palestine therefore has no Israel parent label. Overseas areas with an applicable administrative relationship, including French Guiana → France, retain that relationship.

France, Portugal, Netherlands, Norway, New Zealand, and the source's Indian Ocean Territories use separate overseas map units where available. Ordinary internal subdivisions remain joined: the UK stays one country in world modes, for example. French Guiana belongs to South America and is independently selectable in expanded coverage; mainland France belongs to Europe. A round never contains a duplicate place ID. Antarctica is outside this learning set.

## Geographic grouping

Use the explicit `src/data/memberships.json` learning memberships. The checklist preserves original source labels for audit. New visits default to Countries; the picker offers 22 maps, with optional expanded coverage. North and Central combines Northern America and Central America; Oceania is one map. Asia contains 49 countries, including Maldives, whose source continent label is inconsistent with its Southern Asia subregion. Every place has one primary continent; ocean-area overrides assign IOT to Southern Asia, ATF/HMD to Oceania, and SGS to South America. Russia's primary practice group is Eastern Europe; Türkiye, Cyprus, Georgia, Armenia, and Azerbaijan use Western Asia; Kazakhstan uses Central Asia; Egypt uses Northern Africa. They occur once within a world round. The complete geometry remains visible and pannable, even when part extends beyond the initial camera bounds. Hints and small-place aids can focus remote or tiny geometry. Regional framing is not a rule for deciding membership.

Source political boundaries reflect the pinned cartographic dataset. Changes to the roster, primary membership, or boundary version require a new dataset ID so old times are not silently compared with a different challenge. Future custom disputed-place options and more detailed small-island geometry can extend this explicit policy.

## First playable session rules

- Each round shuffles its selected pool. A correct place is colored, labeled, and added to Found; a wrong selectable place adds a mistake to the current target and allows another try. Water/context clicks and already resolved places do not add mistakes.
- The first Hint/Space shows a silhouette beside the prompt. The second circles the location and pans it into view at the current zoom if necessary. Wrong guesses keep a red fill and a short eight-direction arrow; the third mistake automatically enables the location hint. These hints mark the answer assisted. Reveal & Skip adds it to Revealed and review. Both remain visible on the final map, distinct from correctly found counts.
- First-try score requires no mistake, hint, or skip for that place. A perfect run requires every place on first try without assistance. Only perfect full rounds set a speed record.
- A visible, ready, unpaused round uses a count-up timer. Hidden tabs and unavailable/loading maps pause it. Timer visibility is optional; hiding it does not stop timing. No lives or forced countdown.
- Compatible unfinished rounds, including hint stage and last wrong pin, resume after refresh and from Home. Earlier geography sessions are archived; their records are retained under the original dataset keys. Completed perfect records persist, while returning to a completed scope begins another round. Local records are separated by mode, interaction, scope, expanded coverage, and dataset ID. Results are saved once per round ID. Review rounds use their own subset and cannot replace a full-map best.
- Three, five, ten, twenty, thirty, and subsequent ten-answer streaks celebrate first-try unassisted answers. Wrong guesses, hints, and skips reset the streak.
- Completed maps use collision-aware plaques and the hard 5/7 CSS-pixel red exterior offset. The postcard captures the actual rendered map, coordinate grid, labels, depth, and real session statistics. If image capture fails, results remain usable. Snapshots and geometry are not put in local progress storage.

This is an early playable checkpoint. The broader flags, capitals, country recall, and country packs remain later milestones. Full visual matching, additional device/performance checks, broader persistent practice history, and finer data refinements remain open.
