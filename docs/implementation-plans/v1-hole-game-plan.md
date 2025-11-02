# Hole.io-Style Game - Version 1 Implementation Plan

## Overview
Browser-based 3D game where players control a hole moving across a plane, consuming objects (starting with apples) to score points and grow larger.

## Visual & Control Style
- **3D Assets**: Full 3D models and meshes for all game objects
- **2.5D Camera View**: Top-down angled perspective (45-60° from vertical)
- **Continuous Movement**: Hole moves freely in world space with floating-point coordinates, not grid-based

## Tech Stack

### Core Technologies
- **TypeScript** - Type-safe game logic and development
- **Three.js** (r159+) - 3D rendering engine
- **Cannon.js** or **Rapier** - Physics engine for realistic object falling and collision detection
- **Vite** - Fast development server and build tooling
- **HTML5/CSS3** - UI overlay for score, controls, menus

### Development Tools
- **ESLint + Prettier** - Code quality and formatting
- **TypeScript Strict Mode** - Maximum type safety
- **Vite HMR** - Hot module replacement for rapid iteration

## Project Structure (FSD-aligned)
```
code/main/
├── src/
│   ├── app/           # Application initialization, game loop
│   ├── entities/      # Game entities (Hole, Apple, Plane)
│   ├── features/      # Game mechanics (movement, collision, scoring)
│   ├── shared/        # Utils, types, constants, spatial partitioning
│   └── main.ts        # Entry point
├── public/            # Static assets (textures, models)
├── docs/              # Documentation and plans
└── package.json
```

## First Version Features

### 1. Core Game Loop
- Render loop (60 FPS target)
- Input handling (keyboard: WASD/arrows, mouse, touch)
- Score tracking
- Game state management (playing, paused, game over)

### 2. Hole Entity
- Circular mesh representing the hole opening
- Collision detection volume (cylinder beneath surface)
- **Continuous movement**: Floating-point position (x, y, z), not grid-based
- Grows in radius as score increases
- Smooth movement controls with acceleration/deceleration
- Camera follows hole smoothly

### 3. Plane Entity
- Large flat ground (e.g., 200×200 units)
- Simple texture (grass or pavement)
- Boundaries to prevent hole from leaving play area
- Collision surface for objects

### 4. Apple Entity
- Sphere geometry with apple texture/color
- Rigid body physics
- Random spawn positions across plane (continuous coordinates)
- Falls through hole on collision
- Respawns after being consumed
- Simple rolling physics when falling

### 5. Physics System
- Gravity for objects falling into hole
- Ground collision for apples (resting state)
- **Continuous collision detection**: Circle-vs-point checks every frame
- Trigger volumes for hole (objects fall when overlapping)
- Physics timestep decoupled from render loop

### 6. Collision Detection System
- **Spatial Partitioning (Quadtree)**: Mandatory for performance
  - Divides plane into hierarchical regions
  - Apples register in tree cells they occupy
  - Hole queries only nearby cells when moving
  - Handles hole overlapping multiple regions efficiently
- Distance-based collision: `√((apple.x - hole.x)² + (apple.z - hole.z)²) < hole.radius`
- Early exit optimizations for distant objects

### 7. Scoring System
- Points per apple consumed
- Visual score display (HTML overlay)
- Hole size increases at score milestones (e.g., every 10 apples)
- High score tracking (localStorage)

### 8. Camera System
- Top-down angled view (isometric-style)
- Smooth following of hole with lerp interpolation
- Fixed distance and angle relative to hole
- Keeps hole centered in viewport

## Scalability Considerations

### For Future City Features

#### 1. Entity System Design
- Abstract `GameObject` base class with properties:
  - `mass`: Physics weight
  - `size`: Bounding volume (sphere/box radius)
  - `pointValue`: Score when consumed
  - `model`: 3D mesh reference
  - `consumable`: Can hole eat this at current size?
- Easy extension for Buildings, Cars, Trees, Pedestrians, etc.

#### 2. Level of Detail (LOD)
- Multiple mesh complexities per object type
- Switch based on camera distance
- Critical for cities with hundreds of buildings
- Reduces polygon count for distant objects

#### 3. Spatial Partitioning (Already in V1)
- Quadtree for 2D plane positioning
- Octree consideration for tall buildings later
- Only check collisions with nearby objects
- Efficient insertion/removal as objects move

#### 4. Asset Pipeline
- Support for GLTF/GLB models (industry standard)
- Texture atlasing for performance (batch draw calls)
- Model instancing for repeated objects (cars, trees, street lights)
- Lazy loading for larger levels
- Asset compression (Draco for geometry, KTX2 for textures)

#### 5. Size-Based Consumption Rules
- Hole can only consume objects smaller than itself
- Small hole: Apples, trash cans, people
- Medium hole: Cars, small trees, market stalls
- Large hole: Buildings, buses, large trees
- Creates natural progression system
- Visual feedback when object is too large (bounce off, shake, etc.)

## Development Phases

### Phase 1: Foundation (Week 1)
- Setup Vite + TypeScript + Three.js project
- Basic plane mesh and rendering
- Camera system with top-down angle
- Hole mesh and continuous movement
- Input handling (keyboard/mouse)

### Phase 2: Physics & Apples (Week 1)
- Integrate physics engine (Cannon.js or Rapier)
- Apple entity with 3D model/sphere
- Apple spawning system (random positions)
- Collision detection with spatial partitioning (quadtree)
- Falling mechanics when apple overlaps hole
- Apple respawning logic

### Phase 3: Game Loop & Polish (Week 1)
- Scoring system and UI overlay
- Hole growth on score milestones
- Sound effects (optional for V1)
- Win/lose conditions or endless mode
- Performance monitoring (FPS counter)
- Mobile touch controls

### Phase 4: Future-Proofing
- Refactor to entity component system (ECS pattern)
- Add LOD system scaffolding
- Finalize spatial partitioning API
- Asset loader architecture for multiple object types
- Configuration system for object types (JSON definitions)

## Key Technical Decisions

### 1. Three.js over Canvas 2D
- Easier to add 3D buildings, cars, complex geometry later
- Built-in camera controls, lighting, shadows
- Better community support and ecosystem

### 2. Physics Engine (Cannon.js vs Rapier)
- **Cannon.js**: Pure JavaScript, easier debugging, mature
- **Rapier**: Rust/WASM, much faster, modern
- **Decision**: Start with Cannon.js for simplicity, migrate to Rapier if performance issues arise

### 3. Continuous Movement (Not Grid-Based)
- Floating-point positions for smooth, natural feel
- Spatial partitioning handles efficient collision queries
- Allows for realistic physics and momentum

### 4. Component-Based Architecture
- Separation of concerns (rendering, physics, input, game logic)
- Makes adding new object types trivial
- Easier testing and maintenance

### 5. Separation of Rendering and Logic
- 60 FPS render loop (requestAnimationFrame)
- Variable or fixed physics timestep (decoupled)
- Prevents physics bugs from framerate drops

## Performance Targets

### Version 1 (Apples Only)
- **60 FPS** on mid-range devices (5-year-old laptops, modern phones)
- Support **50-100 simultaneous apples** on plane
- Collision checks: <1ms per frame with quadtree
- Load time: <2 seconds on broadband

### Future Versions (City)
- Scalable to **1000+ objects** with LOD and instancing
- Maintain 60 FPS with spatial culling
- Dynamic loading/unloading of distant objects

## Movement & Collision Details

### Continuous Movement System
```typescript
// Hole position example
holePosition = { x: 45.7, y: 0, z: 128.3 }
holeRadius = 5.0

// Movement per frame
velocity = { x: 0.5, z: -0.2 }
holePosition.x += velocity.x * deltaTime
holePosition.z += velocity.z * deltaTime
```

### Spatial Query Example
```
Hole at (100.5, 0, 75.8) with radius 5
├─ Query quadtree for region: bounds(95.5, 70.8, 105.5, 80.8)
├─ Returns apples in overlapping cells: [apple1, apple3, apple7]
├─ Check distance to each:
│   ├─ apple1: distance = 3.2 < radius (5) → CONSUME
│   ├─ apple3: distance = 6.8 > radius (5) → IGNORE
│   └─ apple7: distance = 4.9 < radius (5) → CONSUME
└─ Trigger physics for consumed apples
```

## Next Steps
1. Initialize project structure with Vite + TypeScript
2. Setup Three.js basic scene (plane, camera, lighting)
3. Implement hole entity with continuous movement
4. Add apple spawning and rendering
5. Implement quadtree spatial partitioning
6. Add collision detection and falling physics
7. Implement scoring and growth mechanics
8. Polish and optimize

---

**Plan Version**: 1.0
**Date**: 2025-11-02
**Status**: Ready for implementation
