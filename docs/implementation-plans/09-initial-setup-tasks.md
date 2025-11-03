# Initial Setup Tasks (Actionable)

Pre-setup
- Confirm tech stack (three.js + Rapier + Vite + TS strict).

Step 1 — Tooling
- Add package.json with Vite, TypeScript, ESLint, Prettier, Vitest; set tsconfig (paths, strict, dom libs).
- Scripts: dev, build, preview, test, lint, typecheck.

Step 2 — Rendering bootstrap
- Install three, @types/three; create src/app/main.ts as Vite entry; init renderer/scene/camera; resize handler.
- Add ground plane material with tiled texture; HUD overlay.

Step 3 — Hole V1
- Implement stencil disc + interior cylinder; param radius; simple animation; update per-frame.
- Movement from input (keyboard/touch), continuous world space.

Step 4 — Apples
- Create InstancedMesh for apples; spawn N in bounds; per-instance data (state, progress) tracked in arrays.
- Suction detection and kinematic intake; scoring; growth ties to count.

Step 5 — Perf + QA
- Add stats HUD; perf-test with thousands of instances; ensure mobile responsiveness.
- Add basic unit tests for math (distance, suction progress), and a Playwright smoke (canvas present, FPS > threshold if measurable).

Deliverable
- Running Vite app with apples falling into moving hole; docs kept in sync; CI-ready scripts.
