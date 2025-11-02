import * as THREE from 'three';
import * as CANNON from 'cannon-es';

interface GameObjectConfig {
  modelPath?: string;  // Path to .glb/.gltf file
  model?: THREE.Group; // Pre-loaded model
  size: number;
  mass: number;
  friction?: number;
  restitution?: number;
}

export class GameObject {
  mesh: THREE.Group | THREE.Mesh;
  body: CANNON.Body;
  consumed = false;
  falling = false;
  private size: number;

  constructor(
    x: number,
    z: number,
    physicsWorld: CANNON.World,
    config: GameObjectConfig
  ) {
    this.size = config.size;

    if (config.model) {
      // Use pre-loaded model
      this.mesh = config.model.clone();
      this.setupModel(x, z, physicsWorld, config);
    } else {
      // Fallback to procedural box
      this.mesh = this.createFallbackMesh(config.size);
      this.setupModel(x, z, physicsWorld, config);
    }
  }

  private createFallbackMesh(size: number): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.7,
      metalness: 0,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    return mesh;
  }

  private setupModel(
    x: number,
    z: number,
    physicsWorld: CANNON.World,
    config: GameObjectConfig
  ): void {
    // Calculate bounding box for physics
    const box = new THREE.Box3().setFromObject(this.mesh);
    const boxSize = new THREE.Vector3();
    box.getSize(boxSize);

    // Scale model to desired size
    const maxDimension = Math.max(boxSize.x, boxSize.y, boxSize.z);
    const scale = this.size / maxDimension;
    this.mesh.scale.set(scale, scale, scale);

    // Recalculate box after scaling
    box.setFromObject(this.mesh);
    box.getSize(boxSize);

    // Position object so its bottom sits on ground (y=0)
    const startY = -box.min.y;
    this.mesh.position.set(x, startY, z);

    // Enable shadows on all children
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Create physics body with box shape
    this.body = new CANNON.Body({
      mass: config.mass,
      position: new CANNON.Vec3(x, startY, z),
      linearDamping: 0.1,
      angularDamping: 0.1,
      material: new CANNON.Material({
        friction: config.friction ?? 0.8,
        restitution: config.restitution ?? 0.3,
      }),
    });

    // Use box collision shape based on bounding box
    const halfExtents = new CANNON.Vec3(
      boxSize.x / 2,
      boxSize.y / 2,
      boxSize.z / 2
    );
    this.body.addShape(new CANNON.Box(halfExtents));

    physicsWorld.addBody(this.body);
  }

  update(): void {
    if (!this.consumed) {
      // Sync mesh with physics body
      this.mesh.position.copy(this.body.position as any);
      this.mesh.quaternion.copy(this.body.quaternion as any);
    }
  }

  startFalling(): void {
    this.falling = true;
    this.body.wakeUp();
  }

  markConsumed(): void {
    this.consumed = true;
    this.mesh.visible = false;
  }

  reset(x: number, z: number, holeRadius: number): void {
    this.consumed = false;
    this.falling = false;
    this.mesh.visible = true;

    const yPos = this.mesh.position.y;

    this.body.collisionResponse = true;
    this.body.position.set(x, yPos, z);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.body.quaternion.set(0, 0, 0, 1);
    this.body.wakeUp();

    this.mesh.position.set(x, yPos, z);
    this.mesh.quaternion.set(0, 0, 0, 1);
  }

  get position(): THREE.Vector3 {
    return this.mesh.position;
  }

  get x(): number {
    return this.mesh.position.x;
  }

  get z(): number {
    return this.mesh.position.z;
  }

  destroy(scene: THREE.Scene, physicsWorld: CANNON.World): void {
    scene.remove(this.mesh);
    physicsWorld.removeBody(this.body);

    // Dispose geometry and materials
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }
}
