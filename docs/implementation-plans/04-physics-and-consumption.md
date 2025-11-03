# Physics and Consumption System

Goals
- Continuous world-space movement; non-grid suction logic.
- Scalable from small apples to heavy cars/buildings via size tiers and mass.

Detection
- Broadphase: 2D spatial grid or BVH over entity bounding circles (x,z in world), keyed per chunk.
- For each entity near the hole, test: distance2D(hole.xz, ent.xz) < (hole.radius - margin(ent))
- margin(ent) reduces false positives for large models; use bounding sphere radius.

States
- Idle → Drawn → Falling → Collected.
- Transition triggers: entry of circle → mark Drawn; after brief delay (0.05–0.1s) set Falling; below y-threshold or progress≥1 → Collected.

Motion
- While Drawn/Falling: disable ground collision; drive kinematically:
  - Direction = normalize(hole.center - ent.position) with y bias downward (e.g., add (0,-β,0)).
  - Speed = base + k1*(hole.radius - d) + k2*sizeWeight; clamp for stability.
  - Optional spiral by adding tangent component for nicer motion.

Large objects
- Require hole.radius ≥ sizeTier.unlockRadius.
- Buildings: either (a) monolithic (simple), or (b) break into chunks (LOD 0) when entering suction region; chunks are what actually fall.

Rapier integration
- Keep dynamic bodies for props/vehicles; when Drawn, switch to kinematic and set nextTransform each step; disable collisions with ground via collision groups or sensor shapes.
- Enable CCD only for fast movers; keep sleeping on for distant entities.

Scoring & Growth
- Score += Collectible.points; Hole.radius growth via easing with caps.
- Optional: combo multiplier based on consecutive collections time window.
