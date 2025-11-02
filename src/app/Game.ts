import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Plane } from '../entities/Plane';
import { Hole } from '../entities/Hole';
import { Apple } from '../entities/Apple';
import { InputController } from '../features/InputController';
import { CameraController } from '../features/CameraController';
import { PhysicsWorld } from '../features/PhysicsWorld';
import { Quadtree } from '../shared/Quadtree';
import { DEFAULT_CONFIG } from '../shared/types';

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private cameraController: CameraController;
  private inputController: InputController;
  private physicsWorld: PhysicsWorld;

  private plane: Plane;
  private hole: Hole;
  private apples: Apple[] = [];
  private quadtree: Quadtree<Apple>;

  private score = 0;
  private lastTime = 0;
  private running = false;

  constructor(canvas: HTMLCanvasElement) {
    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Setup scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Sky blue

    // Setup lighting
    this.setupLighting();

    // Setup camera
    this.cameraController = new CameraController(
      window.innerWidth / window.innerHeight,
      DEFAULT_CONFIG.cameraDistance,
      DEFAULT_CONFIG.cameraAngle
    );

    // Setup physics
    this.physicsWorld = new PhysicsWorld();

    // Setup quadtree for collision detection
    const halfSize = DEFAULT_CONFIG.planeSize / 2;
    this.quadtree = new Quadtree(
      { x: -halfSize, z: -halfSize, width: DEFAULT_CONFIG.planeSize, height: DEFAULT_CONFIG.planeSize },
      4
    );

    // Setup entities
    this.plane = new Plane(DEFAULT_CONFIG.planeSize);
    this.plane.addToScene(this.scene);

    this.hole = new Hole(DEFAULT_CONFIG.initialHoleRadius, this.physicsWorld.world);
    this.hole.addToScene(this.scene);

    // Initialize quadtree
    const halfPlane = DEFAULT_CONFIG.planeSize / 2;
    this.quadtree = new Quadtree({
      x: -halfPlane,
      y: -halfPlane,
      width: DEFAULT_CONFIG.planeSize,
      height: DEFAULT_CONFIG.planeSize,
    });

    // Spawn boxes and pyramids around the hole
    this.spawnObjects();

    // Setup input
    this.inputController = new InputController();

    // Handle window resize
    window.addEventListener('resize', () => this.onResize());
  }

  private setupLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -100;
    dirLight.shadow.camera.right = 100;
    dirLight.shadow.camera.top = 100;
    dirLight.shadow.camera.bottom = -100;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 500;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.scene.add(dirLight);
  }

  private spawnObjects(): void {
    const spacing = this.hole.radius * 4; // 2 hole sizes between objects
    const positions = [
      // 5 boxes arranged in a pattern
      { x: spacing, z: 0 },
      { x: -spacing, z: 0 },
      { x: 0, z: spacing },
      { x: 0, z: -spacing },
      { x: spacing, z: spacing },
      // 10 pyramids arranged around
      { x: -spacing, z: -spacing },
      { x: spacing, z: -spacing },
      { x: -spacing, z: spacing },
      { x: spacing * 2, z: 0 },
      { x: -spacing * 2, z: 0 },
      { x: 0, z: spacing * 2 },
      { x: 0, z: -spacing * 2 },
      { x: spacing * 2, z: spacing },
      { x: -spacing * 2, z: spacing },
      { x: spacing * 2, z: -spacing },
    ];

    for (let i = 0; i < positions.length; i++) {
      const { x, z } = positions[i];
      const isBox = i < 5;

      const apple = new Apple(x, z, this.physicsWorld.world, this.hole.radius, isBox);
      this.apples.push(apple);
      this.scene.add(apple.mesh);
    }

    console.log(`Spawned ${this.apples.length} objects (${positions.filter((_, i) => i < 5).length} boxes, ${positions.length - 5} pyramids)`);
    console.log(`Hole at (${this.hole.position.x}, ${this.hole.position.z}), radius: ${this.hole.radius}`);
    console.log(`First object at (${this.apples[0].position.x}, ${this.apples[0].position.z}), y: ${this.apples[0].position.y}`);
  }

  private checkCollisions(): void {
    const holePos = this.hole.position;

    // Direct distance check - check all objects
    for (const apple of this.apples) {
      if (apple.consumed) continue;

      const dx = apple.position.x - holePos.x;
      const dz = apple.position.z - holePos.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < 15) {
        console.log(`Object nearby! Distance: ${distance.toFixed(1)}, hole: (${holePos.x.toFixed(1)}, ${holePos.z.toFixed(1)}), obj: (${apple.position.x.toFixed(1)}, ${apple.position.z.toFixed(1)})`);
      }

      // Object is over the hole - disable ground collision so it falls
      if (!apple.falling && distance < this.hole.radius * 0.8) {
        console.log(`Object falling! Distance: ${distance.toFixed(2)}, hole radius: ${this.hole.radius}`);
        apple.body.collisionResponse = false;
        apple.startFalling();
      }

      // Score when object has fallen deep into the hole
      if (apple.falling && apple.body.position.y < -5) {
        const previousScore = this.score;
        this.score++;
        this.updateScoreUI();

        // Grow hole every 10 objects
        if (Math.floor(this.score / 10) > Math.floor(previousScore / 10)) {
          this.hole.grow(0.5);
        }

        apple.markConsumed();
      }
    }
  }

  private updateScoreUI(): void {
    const scoreEl = document.getElementById('score');
    if (scoreEl) {
      scoreEl.textContent = `Score: ${this.score}`;
    }

    const sizeEl = document.getElementById('size');
    if (sizeEl) {
      const sizeMultiplier = 1 + this.score * 0.1;
      sizeEl.textContent = `Size: ${sizeMultiplier.toFixed(1)}x`;
    }
  }

  private onResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer.setSize(width, height);
    this.cameraController.resize(width, height);
  }

  private update(deltaTime: number): void {
    // Get input and update hole velocity
    const velocity = this.inputController.update(DEFAULT_CONFIG.holeSpeed);
    this.hole.setVelocity(velocity.x, velocity.z);

    // Update hole position
    this.hole.update(deltaTime, DEFAULT_CONFIG.planeSize);

    // Debug hole movement
    if (velocity.x !== 0 || velocity.z !== 0) {
      console.log(`Hole moving: pos (${this.hole.position.x.toFixed(1)}, ${this.hole.position.z.toFixed(1)}), vel (${velocity.x}, ${velocity.z})`);
    }

    // Update physics
    this.physicsWorld.step(deltaTime);

    // Update all apples
    for (const apple of this.apples) {
      apple.update();

      // Mark apples that fell too far as consumed and respawn them
      if (apple.falling && apple.mesh.position.y < -10 && !apple.consumed) {
        apple.markConsumed();

        // Respawn after a delay
        setTimeout(() => {
          const halfSize = DEFAULT_CONFIG.planeSize / 2;
          const newX = Math.random() * DEFAULT_CONFIG.planeSize - halfSize;
          const newZ = Math.random() * DEFAULT_CONFIG.planeSize - halfSize;
          apple.reset(newX, newZ, this.hole.radius);
        }, 1000);
      }
    }

    // Check collisions
    this.checkCollisions();

    // Update camera to follow hole
    this.cameraController.updatePosition(this.hole.position);
  }

  private render(): void {
    this.renderer.render(this.scene, this.cameraController.camera);
  }

  private gameLoop = (time: number): void => {
    if (!this.running) return;

    const deltaTime = Math.min((time - this.lastTime) / 1000, 0.1); // Cap at 100ms
    this.lastTime = time;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame(this.gameLoop);
  };

  start(): void {
    if (this.running) return;

    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop);
  }

  stop(): void {
    this.running = false;
  }
}
