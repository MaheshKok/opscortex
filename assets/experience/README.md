# Original environment assets

Created for the Behind the Click prototype in Blender. Both Blender and Spline MCPs were live-checked before authoring; these assets were authored in Blender.

- `scene-final.blend`: editable source scene.
- `build_scene.py`: deterministic source generator; run with Blender's `--background --python` from this checkout.
- `public/images/experience/arrival.jpg`: 1600 × 1000 Cycles poster, 32 samples, denoised.
- `public/models/experience/aisle.glb`: runtime export, 8 merged material groups, 2,388,372 bytes.

The poster includes bevels and rendered lighting. The web export merges base meshes by material and receives lightweight lighting in Three.js, so the interactive preview is less photorealistic.

The initial MCP geometry call exceeded its response timeout while Blender continued working. A later live scene call confirmed completion. The optimized generator subsequently rendered and exported successfully in background Blender. The local `behind-the-click.blend` file preserves the first authoring session; `scene-final.blend` is the reproducible delivery source.

## Connected application journey

- `application-journey.blend`: editable 16-object module, created through the verified Blender MCP.
- `build_application.py`: source generator and optional three-stage still renders. Run with `JOURNEY_RENDER=1` in the environment to produce the fallback illustrations.
- `public/models/experience/application-module.glb`: 679,000 bytes; 16 named meshes; +Z is the ticket face. Five `shell_*` nodes animate independently. Lettering is part of the model, with equivalent semantic captions provided by the webpage.
- `public/images/experience/journey-{application,docker,kubernetes}.jpg`: 1400 × 900 Cycles renders of the same model; three replicas use non-intersecting enclosures.

The enclosure is an explanatory software model. Docker packages an image; Kubernetes runs Pods from that image. It is not a depiction of physical container infrastructure.
