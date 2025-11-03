# Roadmap

P0 — Prototype (Apples, 2–3 weeks)
- Vite + TS + three + initial scene (ground, camera rig).
- Hole rendering (stencil+interior) and movement; basic HUD.
- Apples as InstancedMesh; suction/fall/collect loop; score and simple growth.
- Perf pass for 1–2k apples; input mobile + desktop.

P1 — Props Variety & Polish (2–4 weeks)
- Add multiple prop types/tiers; spawn tables; combo multiplier; SFX.
- Basic audio, postFX (bloom/vignette), simple UI menu.

P2 — City Blocks (4–6 weeks)
- Chunked world streaming; static buildings; navmesh groundwork.
- Vehicles as simple agents (follow lanes); collision avoidance.

P3 — Heavy Objects & Gating (3–5 weeks)
- Size gating for cars/buildings; chunked building consumption variant.
- Performance optimization; memory budgets; asset compression pipeline.

P4+ — Advanced Polish
- Destruction variants, achievements, progression; cosmetics; deeper modes.

Risks & mitigations
- GPU overdraw near hole → stencil/ordering and interior depth control.
- Physics cost at scale → hybrid kinematic suction; sleep far bodies.
- Asset sizes → KTX2/Draco pipeline; enforce budgets via CI checks.
