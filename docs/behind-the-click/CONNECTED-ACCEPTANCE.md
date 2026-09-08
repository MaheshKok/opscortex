# Connected journey acceptance

Scope: approved arrival → application → Docker image → Kubernetes Pods visual slice at `/experience`. Branch `codex/behind-the-click`, base `cfe6dee`; implementation and this report are committed together. Root owns acceptance.

## Delivered

One original tickets-api module visibly assembles into an enclosure, then becomes three replicas behind a Service. Scroll reverses deterministically. Mobile captions stay in a dedicated lower stage region; native chapter anchors and current navigation state follow the scene. Desktop keeps editorial captions beside the model.

Original hero, owl logos, Instrument Serif/Inter/JetBrains Mono, logo-red accents, prepared recovery simulation and four existing course destinations remain. Homepage/butterfly source is unchanged. No dependency manifest or lockfile changes.

Original model was authored through Blender MCP; editable Blender source, portable generator and three 1400×900 fallback renders are included. Both Blender and Spline MCP returned live scene information before authoring. No Spline-authored asset is claimed.

## Root-run checks on the integrated production build

- `npm run build`: 16 pages, exit 0 (2026-09-08 08:35:27 local).
- `node --test test/recovery.test.mjs test/journey.test.mjs`: 6 passed, 0 failed.
- `PREVIEW_URL=http://127.0.0.1:4326/experience node docs/behind-the-click/evidence/connected-check.mjs`: 14 scenarios passed. Five viewports (375×900, 768×900, 1440×900, 375×812, 375×667) in both themes; no horizontal overflow or page errors. All three anchors, current navigation, active-copy contrast ≥4.5, mobile model/caption/rail separation, reversible state, recovery/reset/completion and four course routes (HTTP 200) pass. Three additional scenarios retain illustrated normal-flow chapters without JavaScript, with reduced motion, and after blocked model loading; keyboard skip link passes.
- Same browser run checks deferred model loading, nonzero canvas backing size, and real `WEBGL_lose_context` fallback after activation. Eight desktop and eight mobile scroll positions were captured; root inspected endpoint and intermediate PNGs, including previously overlapping mobile positions and the short-screen Docker/Kubernetes layouts.
- `PREVIEW_URL=http://127.0.0.1:4326/experience node docs/behind-the-click/evidence/connected-lifecycle.mjs`: 3 passed. Two **synthetic persisted pagehide events** (mounted and loading), plus genuine graphics-context loss during model loading. Each retains all three static illustrations. This is not a claim of real browser back/forward-cache testing.
- `npx --yes impeccable detect src/pages/experience.astro src/styles/experience.css src/scripts/experience.ts src/scripts/journey.ts`: exit 2, one Instrument Serif preference warning. Font retained as required by DESIGN.md.
- `git diff --check`: clean.
- Generator Python AST and GLB header/length/names pass. GLB: 679,000 bytes, 16 meshes/nodes. SHA-256: `929ca33953d1beafb385c5c3a338481ce46c5a1b0b3d85469a317fa030ab6e29`.

## Adversarial evidence and independent review

Root's strengthened browser assertions reproduced mobile overlap before correction: `caption clears model progress 0.02`. Root also reproduced `context-loss-loading restores static flow` failing when a lost canvas incorrectly activated. Both tracked checks now pass.

An isolated constant-application mutation caused both named journey tests to fail (see `evidence/connected-mutation.txt`). Original authoring RED ordering was not verified because the initial writer's terminal hook blocked that run; this is mutation evidence, not a claim of original TDD ordering.

Astra performed the scene rewrite. An independent Astra assessor found the load-time context-loss defect, then approved its correction. Assessor independently reran the genuine-loss probe (inactive canvas, three visible fallbacks, zero page errors) and all three direct mobile URL anchors. Root inspected the integrated source and production captures and retains the final verdict.

## Replay and limits

Run `npm run dev -- --host 127.0.0.1 --port 4325` for edits. Run `npm run build`, then `npm run preview -- --host 127.0.0.1 --port 4326` for this static preview.

Tracked browser scripts use installed Chrome and local `playwright-core`. PNGs and JSON reports are local, git-ignored files in `evidence/connected/`; earlier captures are diagnostic history. Prior prototype acceptance remains in `ACCEPTANCE.md`.

This delivers the connected visual slice. Recovery remains a labeled simulation; full AWS/Terraform/CI/CD chapters, live labs and enrollment/backend are outside this phase. Browser checks used desktop Chrome with emulated viewports, not physical phones. Three.js still produces the build's large-chunk warning; browser evidence confirms its model and rendering dependencies load near the journey.
