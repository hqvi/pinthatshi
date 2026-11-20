# pinthatshi: game design

Status: wireframe layout approved; visual reference established; React application started with Home, Games, and area selection. The geography quiz is not playable yet.

## The idea

A map-first geography playground that makes it enjoyable to learn where places are, what they're called, their capitals, and their flags. Keep the Farflung Learn Countries visual direction: parchment panels, pixel text, blue oceans, fine coastlines, textured surfaces, and region cards.

**Visual requirement:** target a 1:1 match to Farflung's Learn Countries interface, not a generic retro reinterpretation. The approved wireframes establish layout only. Replace their placeholder colors and fonts with the measured system. Use souvenir-style pixel sprites for small objects; flags use normal full-detail images. Preserve detailed map geometry and the hard offset completed-map depth layer. See the [visual direction](visual-direction.md) and [reference sheet](style-guide/index.html).

The first playable version covers Find Countries worldwide. Everything is freely selectable, with suggested learning paths from smaller regions to larger challenges.

## Game catalog

| Collection | Game | Prompt and answer | Correct-answer feedback |
| --- | --- | --- | --- |
| Countries | Find Countries | Read a place name; select that place on the map. | Color its shape, add it to Found, and advance the prompt. |
| Countries | Name All Countries | Type all the places remembered in the selected area. | Color and label each accepted place. |
| Countries | Name the Country | Name a highlighted place with its neighbors visible. | Confirm its name and continue. |
| Countries | Name the Country: Silhouette | Name an isolated geographic outline. | Reveal the surrounding map and its real location. |
| Capitals | Find Capitals | Read a capital name; select its country. | Reveal the country and capital marker. |
| Capitals | Pin Capitals | Read a capital name; pin the city's actual position. | Show the actual location and distance from the submitted pin. |
| Capitals | Name All Capitals | Recall all capitals in the chosen area. | Reveal each capital marker and associated country. |
| Capitals | Name the Capital | See a highlighted country; type its capital. | Confirm the capital and reveal its marker. |
| Flags | Map the Flag | See a clean full-detail flag; select its place on the map. | Fill the selected shape with the flag image, clipped to the boundary, and retain a complete rectangular reference. |
| Flags | Name the Flag | See a flag; type the place it represents. | Reveal its name and geographic context. |
| Flags | Match the Flag | See a highlighted place; choose its flag from four options. | Confirm the choice and show the flag on the map. |
| Flags | Name All Flags | See a flag collection for the chosen area; name the places represented. | Label accepted flags and reveal their locations. |
| Practice | Review Mistakes | Replay missed or assisted items using their original interaction. | Update local practice history and offer another review. |

These are modes in one application, sharing geography, navigation, controls, and progress handling.

## Coverage and learning paths

World modes support subregions, continents, and the whole world. Offer **Countries** and **Countries & Areas**, with the expanded option selected by default. Label prompts and totals appropriately when a set includes overseas areas.

French Guiana must be selectable in South America and identified as an overseas area of France. Geographic group membership and administrative relationships are different concepts. An overseas area must not disappear because its parent country is associated with another continent, or be counted twice within one challenge.

Create and publish the exact place checklist during the geography milestone. Calculate counts from data rather than copying totals from reference screenshots. Document the source, version, treatment of disputed boundaries, and alternate names.

### Country Packs

| Pack | Content and grouping |
| --- | --- |
| Philippines | Find Regions, Name All Regions, Name the Region; Find Provinces, Name All Provinces, Name the Province; silhouette difficulty. Province practice by region, island group, and nationwide. Region practice by island group and nationwide. |
| USA | States, state capitals, and state flags. Apply find, recall, identification, and flag modes where suitable. Washington, DC has a separately labeled inclusion option. |
| UK | Begin with constituent countries and their flags. Deeper subdivisions are separate additions, with appropriate geography for each constituent country. |

The Philippines is the first pack. Verify regional membership against the versioned Philippine Standard Geographic Code; don't treat island groups as administrative regions or force cities without a province into fictional provinces. Capital and flag variants require verified, applicable data.

## Session behavior

- Default to a count-up clock, with an option to hide it. No lives or forced countdown.
- A mistake allows another attempt. A hint makes that item assisted; a skip reveals the answer and adds it to review.
- Found and Still to Find lists reflect the selected scope. Identification games hide information that would give away their answers.
- A perfect run has no mistakes, hints, or skips. Track completion, accuracy, elapsed time, hints, and missed items separately.
- Separate records by mode, difficulty, scope, content selection, and dataset version.
- Typed answers accept documented aliases, case differences, normalized spacing, and diacritic differences. Don't count duplicates twice or silently accept arbitrary misspellings. Disambiguate names when needed.
- Pin Capitals displays distance and uses a 25 km initial success radius, explained before play. Don't compare its distance records with polygon-selection accuracy.
- Let the player replay, review mistakes, or choose a new area from Results.
- Keep flag designs recognizable. Preserve a full rectangular reference even when a flag is clipped inside a country shape.
- Respect reduced-motion preferences when revealing the map around a silhouette.

## Screens

**Home → collection and game → area → play → results → review or replay**

1. **Home:** full-page atlas, pinthatshi title panel, Play & Learn, and Continue Practice when local progress exists.
2. **Games:** Countries, Capitals, Flags, Country Packs, and Review Mistakes; concise descriptions of each mode.
3. **Areas:** continent headings, smaller subregion cards, larger continent cards, and World. Show completion and best records when available.
4. **Play:** large map, prompt, progress/timer header, found/remaining lists where appropriate, hints, and map controls. Desktop uses a parchment sidebar; narrow screens rearrange controls around the map.
5. **Results:** completion, accuracy, time, assisted items, and replay/review actions.

The home screen is the game's front door, not a long marketing page. The map remains central throughout.

## Planned technical foundation

Use React, TypeScript, Vite, and MapLibre. Rebuild atlas textures and drawing effects with independent application code. Use separately sourced geographic data, with OpenFreeMap providing supporting detail tiles where appropriate.

Keep four shared concepts: game definition, geographic scope, place record, and session result. Place records connect stable identifiers, names/aliases, geometry references, grouping, administrative relationships, capitals, and flag availability. Game definitions select a topic and interaction rather than duplicating the application for every mode.

Lazy-load geography packs and detailed boundaries. Store versioned preferences, records, and review history locally first; exclude geometry from progress storage. Provide a country/coast view when detail tiles are unavailable.

## First-edition defaults

English first, desktop and mobile browsers, no account required, local progress, open access to all areas. Accounts, advertisements, multiplayer, and leaderboards are outside the first edition.

## Geography references

- [Farflung design inspection](farflung-design-audit.md)
- [French overseas departments: INSEE](https://www.insee.fr/en/metadonnees/definition/c2031)
- [Philippine Standard Geographic Code: PSA](https://psa.gov.ph/classification/psgc)
- [OpenFreeMap integration](https://openfreemap.org/quick_start/)
