# Freehole — Implementation Plan Overview

Purpose
- Build a browser game inspired by Hole.io using fully 3D assets, presented in a top‑down 2.5D camera.
- The hole moves continuously in world space (non‑grid), consuming objects for score; scope scales from apples → props → city blocks, cars, and large buildings.

Guiding principles
- Performance-first: 60 FPS on mid‑range mobile and desktop; aggressive culling, instancing, and streaming.
- Visual clarity: strong depth cues with a convincing hole illusion without heavy geometry; scalable to large scenes.
- Modular engine: ECS-oriented systems so new object types (cars, buildings) require only components and data.
- Deterministic behaviors where possible to allow future multiplayer/recordings.

MVP scope (P0)
- 3D ground plane, 2.5D camera rig, player‑controlled hole.
- Apple collectibles (instanced) with suction → falling → removal → score.
- Hole visual: shader/stencil-based circular cutout + interior cylinder.
- Basic HUD and input (keyboard + pointer + touch).

Beyond MVP (P1–P3)
- Diverse props with size tiers; hole growth; combo streaks; timed mode.
- City chunking (streamed tiles), static buildings, simple vehicle AI.
- Audio, polish (post‑FX), settings, save/progression.

Success metrics
- Stable 60 FPS with 1–5k visible collectibles; <5 ms JS, <8 ms GPU on typical laptop.
- Smooth controls and camera; no obvious z‑fighting or popping near the hole.
- Easy addition of new prop types without touching core engine code.

Non‑goals (for now)
- Online multiplayer, complex destruction sims, photoreal assets, dynamic terrain deformation.
