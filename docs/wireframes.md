# Wireframe walkthrough

Open [the wireframes](wireframes/index.html) directly in a browser, or run `node scripts/preview.mjs` from the project root and open the printed address.

## What these show

Wireframes settle layout and navigation before detailed art and game rules. This is a clickable screen walkthrough, not a geography game. Sample progress, prompts, and results are illustrative. The map slots intentionally contain no geographic data.

| Screen | Question it answers |
| --- | --- |
| Home | How does a player arrive and start? |
| Games | How do collections and modes fit together? |
| Areas | How are subregions, continents, world, and expanded coverage selected? |
| Play | Where do the prompt, map, found list, timer, and hints belong? |
| Results | How does a player understand a session and choose what comes next? |

The review navigation above the screen jumps directly between wireframes. Inside the screen, **Play & Learn → Find Countries → an area card → Play** demonstrates the intended flow. The separate walkthrough control opens sample Results without pretending an actual round was completed.

Only Find Countries has an area/play walkthrough in this checkpoint. Other game cards remain visible as the agreed catalog, with future controls clearly marked rather than pretending those games are implemented.

## Design decisions represented

- A map-first home with a title panel rather than a long promotional landing page.
- A game library with clear collection and mode names.
- A scrollable area sidebar alongside a large map, following the supplied references.
- Subregion cards plus a wider continent card and World entry.
- Expanded Countries & Areas coverage selected by default.
- A large desktop map with prompt and session controls in a right sidebar.
- Stacked controls and a retained map area on narrow screens.
- Explicit replay and review actions in Results.

## What comes later

The Farflung-style textures, actual pixel fonts, detailed coastlines, map interaction, geographic data, answer checking, records, and sound are subsequent implementation work. This wireframe palette only distinguishes map, paper, and controls; it is not the final art pass.

The layout is now approved. See the [visual reference sheet](style-guide/index.html) for locally bundled VT323/Bungee, measured colors, recreated surface samples, and original grid-based sprite examples. The walkthrough header links to that sheet without changing the approved screen layouts.

## Review checklist

- Can you understand where to start without instructions?
- Can you distinguish the game choice from the geographic area choice?
- Does the map get enough space on desktop and mobile?
- Are progress, hints, and remaining items easy to find?
- Are replay and review easy to reach after a session?

Use this walkthrough to discuss layout changes before beginning v0.2.
