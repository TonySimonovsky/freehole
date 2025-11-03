# Tech Stack and Rationale

Language & Tooling
- TypeScript 5.x (strict) — type safety and DX.
- Vite — fast dev server + TS/ESM build; static export suitable for CDN.
- ESLint + Prettier — consistency; Husky + lint-staged optional.
- Vitest — unit tests for math/systems; Playwright — e2e smoke for regressions.

Rendering
- three.js (latest) — mature WebGL2/3D engine, rich ecosystem (postprocessing, loaders, helpers).
- PostFX: three-stdlib/postprocessing for bloom, vignette, color grading (later).
- Rationale: big community, robust GLTF + KTX2/Draco pipelines, easy instancing.

Physics
- Rapier3D (WASM) — modern, fast, stable; CCD and sleeping; good perf for many bodies.
- Strategy: hybrid. Use light-weight analytic checks for hole suction; use Rapier for world collisions/stacking when needed (cars/props). Falling objects switch to kinematic control for deterministic intake.

Assets & Compression
- GLTF 2.0 (glb) with Draco mesh compression + KTX2/Basis texture compression.
- Tools: gltf-transform, gltfpack, basisu; HDRI environment maps (RGBE/KTX2).

UI & Debug
- HUD via DOM overlay (Vanilla/TS); Debug: Tweakpane, stats.js.

State/Architecture
- ECS-centric architecture to scale: bitecs or a minimal custom ECS (start minimal, keep API compatible with bitecs for a drop-in swap if needed).
- Data-driven entities (JSON/GLTF extras) for spawn tables and size tiers.

Packaging & Deployment
- Single-page static app; deploy to any static host (Render static site, Vercel, GH Pages).
- CI: build + smoke e2e; bundle size checks.
