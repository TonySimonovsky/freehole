import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsShapeConfig } from '@/shared/physics/types';
import { GameObjectConfig } from './types';

export class GameObject {
  mesh: THREE.Group | THREE.Mesh;
  body: CANNON.Body;
  consumed = false;
  falling = false;
  private size: number;
  private physicsConfig?: PhysicsShapeConfig;

  constructor(
    x: number,
    z: number,
    physicsWorld: CANNON.World,
    config: GameObjectConfig,
    physicsConfig?: PhysicsShapeConfig
  ) {
    this.size = config.size;
    this.physicsConfig = physicsConfig;

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

    // Create physics body
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

    // Use provided physics config or fallback to automatic generation
    if (this.physicsConfig) {
      this.applyPhysicsConfig(this.physicsConfig, boxSize);
    } else {
      this.generateAutoPhysics(boxSize);
    }

    physicsWorld.addBody(this.body);
  }

  private applyPhysicsConfig(config: any, boxSize: THREE.Vector3): void {
    const cylinderQuat = new CANNON.Quaternion();
    cylinderQuat.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);

    if (config.type === 'cylinders' && config.cylinders) {
      const baseRadius = Math.min(boxSize.x, boxSize.z) / 2;

      for (const cyl of config.cylinders) {
        const radius = baseRadius * cyl.radiusScale;
        const height = boxSize.y * cyl.heightScale;

        const cylinder = new CANNON.Cylinder(radius, radius, height, 8);

        // Position is relative to bounding box (-1 to 1 range)
        const offset = new CANNON.Vec3(
          cyl.position.x * boxSize.x / 2,
          cyl.position.y * boxSize.y / 2,
          cyl.position.z * boxSize.z / 2
        );

        this.body.addShape(cylinder, offset, cylinderQuat);
      }
    } else if (config.type === 'spheres' && config.spheres) {
      const avgSize = (boxSize.x + boxSize.y + boxSize.z) / 3;

      for (const sph of config.spheres) {
        const radius = avgSize * sph.radiusScale;
        const sphere = new CANNON.Sphere(radius);

        // Position is relative to bounding box (-1 to 1 range)
        const offset = new CANNON.Vec3(
          sph.position.x * boxSize.x / 2,
          sph.position.y * boxSize.y / 2,
          sph.position.z * boxSize.z / 2
        );

        this.body.addShape(sphere, offset);
      }
    } else if (config.type === 'box' && config.box) {
      const box = new CANNON.Box(new CANNON.Vec3(
        config.box.halfExtents.x * boxSize.x,
        config.box.halfExtents.y * boxSize.y,
        config.box.halfExtents.z * boxSize.z
      ));
      const offset = config.box.position
        ? new CANNON.Vec3(
            config.box.position.x * boxSize.x / 2,
            config.box.position.y * boxSize.y / 2,
            config.box.position.z * boxSize.z / 2
          )
        : undefined;
      this.body.addShape(box, offset);
    } else if (config.type === 'custom' && config.customShapes) {
      const shapes = config.customShapes(boxSize);
      for (const shapeData of shapes) {
        this.body.addShape(shapeData.shape, shapeData.offset, shapeData.quaternion);
      }
    }
  }

  private generateAutoPhysics(boxSize: THREE.Vector3): void {
    // Automatic physics generation - 3 cylinders with estimated mass center
    const cylinderQuat = new CANNON.Quaternion();
    cylinderQuat.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);

    // Bottom cylinder - always larger for ground stability
    const bottomRadius = Math.min(boxSize.x, boxSize.z) / 2 * 1.2;
    const bottomHeight = boxSize.y * 0.4;
    const bottomCylinder = new CANNON.Cylinder(bottomRadius, bottomRadius, bottomHeight, 8);
    this.body.addShape(bottomCylinder, new CANNON.Vec3(0, -boxSize.y * 0.3, 0), cylinderQuat);

    // Middle cylinder
    const midRadius = Math.min(boxSize.x, boxSize.z) / 2 * 0.9;
    const midHeight = boxSize.y * 0.4;
    const midCylinder = new CANNON.Cylinder(midRadius, midRadius, midHeight, 8);
    this.body.addShape(midCylinder, new CANNON.Vec3(0, 0, 0), cylinderQuat);

    // Top cylinder
    const topRadius = Math.min(boxSize.x, boxSize.z) / 2 * 0.7;
    const topHeight = boxSize.y * 0.3;
    const topCylinder = new CANNON.Cylinder(topRadius, topRadius, topHeight, 8);
    this.body.addShape(topCylinder, new CANNON.Vec3(0, boxSize.y * 0.35, 0), cylinderQuat);
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
