# Performance and Scaling Strategy

Targets
- 60 FPS on mid-range devices; CPU ≤ 5 ms/frame JS; GPU ≤ 8–10 ms.

Rendering
- InstancedMesh for high-count props (apples); merge static city geometry by chunk.
- Frustum and distance culling; optional cell-based occlusion (simple horizon/heightmap for buildings later).
- LOD switches with hysteresis; keep draw calls < 300 typical.

Physics
- Rapier broadphase + sleeping; switch far entities to sleeping; CCD only where needed.
- Kinematic control during suction to avoid solver cost; disable ground contacts.

World streaming
- Chunk manager (grid in XZ): loads props/buildings per visible cells; maintain N-ring around camera.
- Asset prefetch for next cells based on velocity.

Memory
- Reuse buffers; object pools for entities; textures compressed to KTX2; avoid per-object uniforms.

Instrumentation
- Stats.js, threejs inspector; custom perf HUD; log counts (entities, draw calls, active bodies).
