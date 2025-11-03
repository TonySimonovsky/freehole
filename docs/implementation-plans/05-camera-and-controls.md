# Camera and Controls (Top‑Down 2.5D)

Camera rig
- Perspective camera with slight tilt (e.g., pitch 55–70°), top‑down framing that preserves parallax.
- Rig hierarchy: pivot (follows hole with smoothing) → boom (offset back/up) → camera.
- Framing: camera distance based on hole radius and speed; widen FOV slightly as hole grows.

Controls
- Keyboard (WASD/arrows), pointer drag, virtual joystick on mobile.
- Movement uses continuous world vectors in XZ; clamp max acceleration and turn rate for smoothness.
- Optional assistance: auto-rotate camera heading or keep fixed north-up.

Units & scales
- Use meters as units; ground at y=0; apples ~0.2–0.3 m radius; hole starts ~1–2 m radius.
- Physics/world step 60 Hz fixed; interpolate render.

Culling & clipping
- Frustum cull with padded camera bounds; fade in/out objects near far plane to avoid popping.
