# Behind the Click visual prototype
Brief source: user's supplied conversation and lookbook, plus explicit instruction to start building look and feel. No new interview was conducted. These are source-derived decisions, not invented verbatim interview answers.

## User's current words
"first make sure spline and blender are working and then start"
"we are testing how it would look i wanna check the look and feel so build that first"

## Existing brief answers
1. Vibe: precise, cinematic, believable engineering. Source: supplied lookbook.
2. Journey: server aisle, local tickets-api mission, logical engineering, prepared failure, learning. This prototype samples Arrival, mission, recovery and course close.
3. Energy: atmospheric opening, quiet mission, participatory peak, resolved ending.
4. Feeling: curiosity from real infrastructure; recognition from familiar ticket app; agency/relief from recovery; confidence from clear course destinations.
5. Signature: stop one replica while the visible booking experience continues.
6. Aesthetic: restrained engineering documentary, existing OpsCortex identity. No clay diorama or decorative flying logos.
7. World: coherent materials/application across distinct explanatory views. No endless unbroken flythrough.
8. Assets: supplied research lookbook/reference images, existing owl logos/fonts; original Blender environment created for this prototype.

## Feeling curve (before score)
Arrival: curiosity. Camera sees a believable destination down a rack aisle.
Mission: recognition and tension. The app works, but preparation is unfinished.
Recovery: agency then relief. A replica stops; simulated service remains available.
Close: resolve. Actual course titles and destinations explain next step.

Peak / tell-someone sentence: "It's the site where I stop part of the system and the booking still works."
Authored silence: brief stable mission frame for reading. No artificial blank scroll.

## Grammar
Bespoke cinematic demonstration, constrained by accepted PLAN.md. Uses a filmic establishing image with explicit navigation and cuts to a semantic logical simulation. We do not claim strict compliance with scroll-craft's mutually exclusive eight presets: filmic one-shot bans the required jump navigation, continuous-world bans the required physical/logical separation; live-surface bans the requested photographic arrival; editorial bans the arrival image; gallery/poster/split/cutlist conflict with the agreed narrative.
This is an intentional source-brief override rather than hiding a hybrid behind a false label.

## Score
| Beat | Device | Purpose |
| Arrival | spatial camera/parallax | Sense of place, grounded dimensions |
| Mission | reveal and asymmetric composition | Familiar app becomes the anchor |
| Recovery | held semantic interaction | Optional prepared failure with real state |
| Close | readable flow | Resolve in actual course destinations |
Short prototype targets roughly 5-7 viewport heights. Full 8-14vh / four-family production gate deferred until full journey; do not inflate preview to satisfy length.
Existing Astro/Three.js/GSAP integration takes precedence over adding another runtime. Engine copies retained only as reference; no double scroll engine.

## Verification contract
Render actual preview at 375,768,1440 in both themes. Exercise recovery, reset, reverse scroll, keyboard, reduced motion, noJS and WebGL fallback. Inspect every major chapter and intervening positions; no claim real phone performance from viewport emulation.
Generated geometry/artwork judged through Blender render, GLB load and actual browser screenshots rather than meaningless unit tests on cube placement.
Recovery executable behavior gets focused RED/GREEN checks.
MCP live checks passed: Blender Scene with 3 original objects; Spline active scene with directional light.
