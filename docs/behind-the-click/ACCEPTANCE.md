# Visual prototype acceptance

Phase 1 history. Current connected slice: [CONNECTED-ACCEPTANCE.md](CONNECTED-ACCEPTANCE.md).

Scope: four-beat look-and-feel prototype at `/experience`, isolated branch `codex/behind-the-click`, based on `9d07dc9`. Original homepage remains unchanged. Root owns final acceptance.

## Delivered
- Original Blender server aisle poster and editable source, plus opt-in Three.js GLB view.
- Scroll-linked arrival push-in and reversible copy exit.
- Sample local tickets application and explicitly prepared replica recovery demonstration.
- Four links to real existing course pages, using their collection titles and levels.
- Source conversation analysis, unchanged supplied attachment, offline lookbook, five downloaded reference images and provenance manifest.

## Integration evidence
Before authoring, fresh Blender MCP scene info returned the live default scene and local bridge listened on 127.0.0.1:9876. Fresh Spline MCP scene inspection returned the active editor scene with its directional light. Both integrations worked. Artwork was authored in Blender; no Spline-authored asset is claimed.
The initial Blender MCP authoring call timed out while Blender continued processing. A later live scene inspection confirmed completion. The optimized headless generator successfully saved and rendered the final source and exported eight material groups.

## Root-run acceptance
- `npm run build`: 16 pages built, exit 0.
- `node --test test/recovery.test.mjs`: 4 passed, 0 failed.
- `PREVIEW_URL=http://127.0.0.1:4326/experience node docs/behind-the-click/evidence/runtime-check.mjs`: PASS, 11 reported scenarios. Six width/theme combinations (375, 768, 1440 × light/dark) have no horizontal overflow or page exceptions, correct recovery/reset/completion and four course routes returning HTTP 200.
- Same script opens the actual GLB, returns to application, triggers real `WEBGL_lose_context`, and successfully reloads on a fresh canvas.
- Additional scenarios: reduced motion, no JavaScript, blocked GLB on desktop/dark and mobile/light, keyboard skip link.
- Browser control verified reverse scroll: y=962 produced progress=.95 and scale=1.096; returning to y=0 restored progress=.00 and scale=1.025.
- Inspected production hero, mobile mission, live 3D, reduced-motion hero, failed-asset mobile view and full scroll contact sheets.
- `npx --yes impeccable detect src/pages/experience.astro src/styles/experience.css src/scripts/experience.ts`: exit 2, one overused-font warning for Instrument Serif. Accepted because DESIGN.md requires this font.
- `git diff --cached --check`: clean.
- Asset generator: Python AST parses; portable checkout-root expression resolves to the repository.

Independent reviewer reproduced broken retry after genuine graphics context loss. Writer replaced the lost canvas; root reran the exact genuine-loss/retry sequence successfully. Earlier reduced-motion hero collapse, button overlap, 3D stacking and light error contrast were also corrected.

## Evidence and replay
Generated captures and JSON results are kept locally in `evidence/runtime/`; scroll-craft contact sheets in `evidence/final-desktop/`, `final-mobile/` and `final-reduced/`. Earlier non-final captures remain as diagnostic history and are not acceptance evidence. Screenshot folders are git-ignored; verification script is tracked.
Browser checks use installed Chrome and `playwright-core`, installed locally with `npm install --no-save --package-lock=false playwright-core`; package manifest and lockfile are unchanged.

Run `npm run dev -- --host 127.0.0.1 --port 4325` for edits or `npm run build` followed by `npm run preview -- --host 127.0.0.1 --port 4326` for the reviewed static build.

## Honest boundaries
This is a short visual prototype, not the complete Docker/AWS/Terraform/Kubernetes/CI journey or a live Kubernetes lab. Poster establishes the visual quality; lighter interactive GLB has simpler lighting. No purchases, subscriptions or fake testimonials added.
Scroll-craft is applied as reference-led art direction and screenshot verification. The bespoke brief intentionally departs from its strict grammar, length and four-family production gates. Its automated dead-scroll detector flags static reading/interaction/course stretches (desktop 36–44%, 83–91%, 92–100%; mobile 36–46%, 56–63%, 66–73%; reduced 78–88%, 90–100%). These show populated content in inspected sheets. No full scroll-craft compliance claim.
Viewport emulation is not real-phone performance proof. Build retains a Three.js chunk-size warning; 3D imports are requested only when its control is activated. npm reported four dependency audit findings (two low, two high) during local verification-tool installation; dependency remediation was not part of this visual scope.
