# Rendering the Hole (2.5D Top‑Down)

Objective
- Convincing circular hole that moves in world space and hides ground beneath; objects appear to fall into depth.

Recommended approach (Stencil + Interior, V1)
1) Stencil Mask
   - Render a thin disc (at y=0) at hole position with stencilWrite=1; write ref=1 with replace op.
   - Render the ground with stencilFunc: notEqual 1 so the disc area is cut out.
2) Interior Geometry
   - Render a short cylinder extruded downward from the disc. Dark gradient material (rim lighter, deeper darker), slight Fresnel.
   - Optionally scroll a subtle noise texture downwards for motion.
3) Object Handling
   - Objects above y=0 draw normally. When marked Suctioned and y<0, either: (a) continue drawing (they’re visible inside cylinder), or (b) fade by depth.

Alternative (Shader Cutout, simpler)
- Custom ground fragment shader that computes distance to hole center and discards inside radius. Pair with interior cylinder. Cheaper to implement but more shader work; supports multiple holes by looping.

Advanced (Later)
- Portal/depth prepass for ‘infinite’ depth illusion; multiple holes; soft-edge AA via SDF.

Implementation notes
- three.js supports stencil via material.stencil*. Keep hole renderOrder consistent: stencil disc → ground → interior → objects.
- The hole radius animates with growth; keep interior cylinder radius in sync.
- Use world-space hole center to support an infinite, tiled ground texture; sample UVs separately from hole logic.
