# Connected visual journey — phase 2
Goal: turn the approved arrival → Docker → Kubernetes proposal into a connected scroll-controlled visual slice at /experience. Base cfe6dee, same isolated branch. User accepted this scope with “yeah build it”.

Approach: keep the establishing server aisle, then cut to the same tickets-api application on a full-width sticky stage. Package it inside a visibly assembling Docker shell; pull back as that identical packaged module becomes three replicas. End at the existing prepared recovery interaction and real courses. The scene is an explanatory software model, not a claim containers are physical shipping boxes or Kubernetes replicates machines.

Key decisions:
- One Three.js canvas for this three-beat journey. Automatic initialization near its viewport. Existing poster hero stays. Remove the old opt-in aisle view as it duplicates the opening and interrupts the narrative.
- Scroll is a deterministic, reversible timeline. Captions and semantic chapter anchors remain in HTML. Stage labels: Application, Docker, Kubernetes. Transforms for enclosure and replication must progress visibly, not just swap headlines.
- Use original Blender module and stage render assets supplied by root. Metal/graphite casing, red edge light, cream type; no generic floating cubes. Preserve existing brand fonts/logos, red accent and theme tokens.
- Initial app face reads tickets-api, Front row reserved, ON-2047. Docker describes app + dependencies as a portable image. Kubernetes describes three replicas of that same image, behind a Service. Do not invent deployment success.
- Desktop sticky scene with readable editorial captions and explicit chapter jump links. Mobile gets a deliberate compact composition, not cropped desktop. Reduced motion/no JS/failed WebGL show all three illustrated chapters in flow, no hidden captions or inert controls.
- Pause drawing when hidden/offscreen; no perpetual animation needed to drive scroll transforms. Release resources on pagehide. Genuine graphics context loss returns to fully readable static sequence; no forced retry complexity is required.
- Keep existing prepared recovery state and actual course destinations.

Asset contract (root owns assets): /models/experience/application-module.glb has centered application chassis (width3.2,height2.2,front +Z), and nodes shell_left/right/top/bottom/back, plus app-prefixed parts. Closed bounding box about4.0×2.8×1.3. Static fallback images /images/experience/journey-application.jpg, journey-docker.jpg, journey-kubernetes.jpg. Root will confirm final names/dimensions before acceptance.

Acceptance: early/mid/late real runtime screenshots show one app, enclosing shell, and 3 replicas; reverse scroll restores states; each chapter anchor lands on correct caption/state; no overflow/overlap at375/768/1440 in both themes; all three chapters readable for reduced-motion/noJS/blockedGLB; real context loss returns to static explanation; recovery tests and links retained. Browser proof owns visual acceptance; unit tests only for nontrivial timeline boundary/reversal behavior, not geometry placement. Build and required design scan run at final integrated state.

Out of scope: AWS/Terraform/CI/CD chapters, live clusters/labs, enrollment/backend, original homepage redesign, new scroll library. Full 8-chapter journey remains later.

Planning challenge resolved: describe Docker image and three Pods accurately; keep real DOM chapter illustrations until first successful 3D frame; fixed HTML captions; deduplicated shared resource cleanup; explicit anchor targets and reversible holds. Native CSS sticky plus throttled scroll keeps existing stack small. Model contract confirmed live: 16 mesh nodes, 679000-byte GLB; five named shell nodes and app-prefixed body/lettering.
