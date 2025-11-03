# Architecture and Folders

Goals
- Clean separation between engine-like systems and game content; allow new objects with components/configs.
- Keep three.js scene in sync with ECS state without tight coupling.

Proposed structure
```
src/
  app/                 # App bootstrap, Vite entry, router (if any)
  core/
    ecs/               # Entity registry, components, systems scheduler
    math/              # Vec/Mat utilities if needed
    input/
    time/
  render/
    scene.ts           # Scene/camera/renderer setup
    materials/         # Custom shaders/material helpers
    postfx/
  physics/
    world.ts           # Rapier init, step, helper queries
  gameplay/
    systems/           # Input, Movement, Suction, Collect, Score, Growth
    entities/          # Hole, Apple, (later: Car, Building, etc.)
    spawners/
  assets/              # Loaders, registries, GLTF mappings
  ui/                  # HUD, debug
  util/
```

ECS components (initial)
- Transform (position, rotation, scale)
- Velocity (linear)
- RenderMesh (three Object3D ref or InstancedMesh index)
- Collectible (points, sizeTier, mass)
- Hole (radius, maxSlope)
- Suctioned (progress, startTime)
- PhysicsBody (rapier handle, type: dynamic/kinematic/static)
- Lifetime (despawnAt)

Core systems (order)
1) InputSystem → 2) MovementSystem → 3) PhysicsStep → 4) SuctionSystem → 5) CollectSystem → 6) Growth/ScoreSystem → 7) RenderSyncSystem.

Notes
- Start with a minimal ECS scheduler; if we hit limits, migrate to bitecs by mapping component arrays.
- Use InstancedMesh for apples; store instanceId on entity; free-list for churn.
- Keep rendering data (meshes) outside of ECS when possible; ECS stores indices/handles only.