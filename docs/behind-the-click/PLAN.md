# Behind the Click — analysis and build plan

Date: 2026-09-08
Status: analysis and reference collection complete; implementation not started.
Acceptance owner: root. Independent planning challenger: gpt-6-astra, xhigh (DONE_WITH_CONCERNS).
Checkout: /Users/maheshkokare/.config/superpowers/worktrees/opscortex_ai_labs/behind-the-click
Branch: codex/behind-the-click. Base: main at 9d07dc9.
Original checkout remains on main; its existing untracked newsletter plan is untouched.

## Goal

Create an OpsCortex course homepage where visitors understand how production engineering tools fit together, experience one controlled failure/recovery example, and find an accurate course or learning-path destination.

The source is a strong narrative brief, not production artwork, a working simulation, validated curriculum, or evidence of increased conversion. The visual treatment must earn attention; verified lessons, labs, instruction and a working enrollment destination must earn trust.

## Sources inspected

- Full visible ChatGPT exchange: https://chatgpt.com/c/6a9f3594-3504-83eb-a563-7bc38b932482 (3D Course Website Concept).
- Original user-supplied HTML: references/behind_the_click_reference_lookbook.html. One downloadable attachment found in the conversation.
- All five embedded reference images downloaded and visually inspected. references/manifest.json records origins, byte lengths and hashes.
- Original Google resized image URL returned HTTP 404. The same New Albany photograph was recovered through the official gallery's Download link: https://datacenters.google/discover-more/photo-gallery/.
- references/lookbook-offline.html uses the five local images. Original attachment remains byte-identical to the supplied file.
- Repo DESIGN.md, package.json, homepage, motion controller, waitlist component, routes inventory and eight course frontmatter records.
- Referenced artwork remains research material. Build original assets; these downloads do not grant production usage rights.
- Reference screenshots were inspected, not live reference-site animation, frame rate or conversion performance.

## Judgment

Keep the one-application story and optional failure interaction. The decisive creative move is a transition from a familiar successful booking into a clearly labelled logical view of its system. Keep tickets-api and its artifact identity recognizable throughout.

The opening aisle must not delay comprehension. Show what is sold immediately, with the ticket application and launch mission established within the first two narrative beats. The proposed 90–120 seconds is an optional leisurely journey, never a forced duration.

Use Igloo's disciplined composition and material consistency, Opal's large object plus adjacent benefit and accessible offer, Immersive Garden's restrained light/composition, Apple's explanatory reveal, and Google's real construction detail. Lusion and Bruno Simon are conceptual references in the attachment, not downloaded image references.

Major production gaps:
1. The lookbook's scenes are written descriptions. Eight designed frames, asset specifications, camera positions and transitions still need creation.
2. Repo has eight course content records, but no standalone Docker course. AWS appears in Cloud Architecture Patterns and Terraform content. Do not invent a Docker lesson or relabel an advanced course as beginner AWS training.
3. The existing homepage explicitly marks testimonials as placeholders. Waitlist.astro prevents submission and shows success without persisting data. This cannot be reused as proof of conversion.
4. There is no verified lesson, lab, checkout or capstone delivery evidence from this inspection. A connected Production Engineering Path is a proposed product promise until course material supports it.
5. Live MCP probes failed: Spline reports no connected editor; Blender reports it cannot connect to the addon. Exposed tools are not live authoring proof.

## Approach and decisions

Retain Astro, Tailwind, vanilla Three.js and GSAP already installed. No React/R3F migration is justified by this feature. Rebuild the homepage experience within the existing site.

Use Blender to author a small modular environment: rack sections, vents, overhead cable trays, aisle surfaces and an engineering console. Use believable proportions, bevels and material roughness. Export optimized GLB assets with shared materials and baked static lighting where appropriate. Preserve editable .blend sources separately from web exports.

Use Spline for a bounded camera/material/composition experiment once its live editor connects. It is a tool for rapid exploration, not a requirement for a second production renderer. Evaluate its exported result only against the same asset, device and interaction criteria. Default production renderer remains one Three.js canvas.

Start with real-time rendering. If the opening cannot meet the agreed visual and device targets, compare a pre-rendered alternative using measured loading, seek latency, memory and frame pacing. Do not assume video scrubbing is cheaper.

Keep headlines, explanations, navigation, course links and buttons in semantic HTML. Render the story without JavaScript as illustrated chapters. With JavaScript but no WebGL, keep the recovery interaction functional through HTML state.

Use native scroll on the journey route. Existing Lenis and hide-on-scroll navigation need a scoped bypass; do not introduce a competing scroll loop. Scroll owns camera/chapter progress. Recovery has separate explicit state.

Preserve the supplied theme-specific owl logos, Instrument Serif, Inter, JetBrains Mono and #f73938 text accents. The source lookbook's green accent and system font are not a new brand system. New homepage composition may replace the butterfly-led presentation under the user's redesign authority; do not recolor butterfly source artwork. Document intentional composition/motion departures in DESIGN.md when implemented.

## Eight-scene specification

| Scene | Visible story and movement | Understanding / destination |
| --- | --- | --- |
| 1 Arrival | Human-height graphite server aisle; modest forward camera move; readable course offer and Explore courses visible immediately | Production engineering courses; direct catalogue bypass |
| 2 Mission | Console reveals fictional ticket booking locally; recognizable app preview remains as an HTML anchor | Get tickets-api ready for opening night |
| 3 Package | Label BUILD; code, dependencies and runtime combine into a versioned image; distinguish image from running container | Packaging capability; Docker curriculum gap explicitly recorded |
| 4 Provision | Label PROVISION; show selective AWS resources, then Terraform configuration, plan, review and apply as separate beats | Existing Cloud Architecture Patterns / Terraform at Scale destinations |
| 5 Run | Label RUN; configured demand signal causes finite replicas to start, become ready, then receive traffic | Kubernetes in Production |
| 6 Release | Label RELEASE; failed test blocks one version; corrected version passes configured checks and deploys | CI/CD & GitOps with Argo CD |
| 7 Test | Optional Stop one replica button; serving peers remain, replacement starts then becomes ready; visible booking and diagnosis | Kubernetes and Observability Engineering; clearly labelled simulation |
| 8 Learn | Scene settles into readable curriculum and prerequisites; individual course choices remain available | Verified learning evidence and truthful availability; path offer only when supported |

These are build/provision/release/run views, never consecutive network hops for a booking request. A Pod is a logical workload, not a physical server component.

## Recovery behavior to freeze before code

- Initial state: three ready replicas, desired count three, healthy simulated service. Persistent label explains prepared simulation and its spare capacity assumption.
- One click stops one replica. Two remain serving; a replacement progresses through starting to ready. Unready replicas receive no traffic in the simulation.
- While recovery is running, the same action is visibly disabled with an explanation; never silently ignore rapid clicks or create unlimited failures.
- After completion, Replay/Reset restores the initial three-ready state. One prepared scenario only; this is an explicit scope limit.
- Leaving/re-entering the chapter retains simulation state for that page visit. Reverse scrolling changes presentation, not past outcomes. Reload resets state.
- Reduced motion exposes the same state sequence and explanation with discrete updates instead of camera/object interpolation.
- Keyboard and screen-reader users receive status in HTML. With JavaScript disabled, the complete prepared scenario and outcome are readable as static steps.
- Asset load errors and WebGL context loss reveal illustrated fallback plus intact HTML controls/content; they never block catalogue access.
- Test counts, readiness, blocked repeat action, reset, revisit/reverse scroll, reduced motion and rendering failure before implementation.

## Dependency-ordered delivery

### 1. Storyboard and offer mapping

Create eight actual desktop frames and mobile compositions with the intended copy, persistent app anchor and destination links. Specify the same asset names, camera framing, semantic labels and transition purpose.

Make original stills for Arrival, mission and failure scene; do not treat a generic box blockout as the final aesthetic. Freeze course mappings and distinguish confirmed content records from missing course material.

Acceptance: what is sold, what the visitor is preparing, and where to go next are clear without animation. Check against the five inspected visual references. Real learner comprehension feedback remains separate from agent design review.

### 2. First production-quality slice

Restore live Blender/Spline editor connections as needed; do not reinstall already configured tools by default. Create original environment assets and export a real browser slice: Arrival → mission → catalogue destination. Add scoped native scrolling and navigation, both themes, poster fallback and mobile camera framing from the outset.

Then attach the working recovery scene. This validates both visual quality and the concept's meaningful interaction before scaling the asset set.

Acceptance: rendered desktop/mobile evidence, actual loading/frame measurements, keyboard operation, reverse scroll and repeat interaction checks. A pretty Blender render alone does not accept browser quality. A blockout alone does not accept reference fidelity.

### 3. Expand the explanation

Implement packaging, provision, run and release chapters using the same app/artifact identity and visual vocabulary. Add contextual links to existing relevant courses. Spend detail on the Arrival, physical-to-logical reveal and failure interaction; keep intermediate explanation legible.

Acceptance: each chapter explains one capability; transitions remain reversible and technically accurate; no resource or scene leak across repeated full journeys.

### 4. Integrate learning and conversion evidence

Use existing collection data for accurate course titles and displayed prices; verify commercial terms before publication. Add real lesson/lab/instructor assets only when supplied or verified. Remove placeholder social proof from the redesigned homepage.

Use accurate availability and a real validated enrollment or waitlist integration before launch. Connecting a backend is a separate bounded implementation scope that needs provider and content decisions; never ship the existing simulated success as a working subscription.

### 5. Acceptance and release readiness

Root owns integrated acceptance; independent review challenges findings. Run npm run build, focused behavior checks, npx --yes impeccable detect on affected UI paths, and git diff --check. No tests script currently exists; select minimal behavior tooling when implementation begins.

Check 375px, 768px and 1440px in both themes; keyboard, focus, touch, reduced motion, no JavaScript, asset failure and WebGL failure. Inspect first/last chapter and failure/revisit states. Check every course destination.

Proposed performance targets, not measured results: initial HTML/CSS/poster usable before 3D; first-scene compressed model/texture budget 3 MB desktop / 1.5 MB mobile; p95 animated frame interval <=33 ms on named target devices, aim <=20 ms on target desktop. Set texture/draw-call limits from the measured first slice, not invented universal numbers. Measure memory across repeated traversals.

Retain lookbook's LCP <=2.5s, INP <=200ms, CLS <=0.1 goals; lab tests are only lab evidence. Field 75th-percentile compliance and conversion uplift require post-launch traffic. Actual mobile hardware testing is distinct from desktop viewport emulation.

After functional launch readiness, compare static and cinematic offers with identical prices/evidence and clear qualified-conversion events. No analytics or checkout vendor is chosen by this plan.

## Out of scope for this preparation

No runtime source changes, framework migration, public deployment, fabricated course assets, replacement LMS, paid asset purchase, or claim of completed visual/runtime acceptance. No application build or test run was needed for these reference and planning files.

## First next action

Create the eight visual frames and verify the Arrival/mission composition on desktop and mobile, then author/export the first Blender environment. Keep missing commerce evidence and disconnected authoring bridges visible as dependencies; neither prevents storyboard work.
