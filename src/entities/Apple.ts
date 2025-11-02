import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Apple {
  mesh: THREE.Mesh;
  body: CANNON.Body;
  consumed = false;
  falling = false;

  constructor(x: number, z: number, physicsWorld: CANNON.World, holeRadius: number, isBox: boolean = false) {
    const size = holeRadius * 0.75;
    const color = isBox ? 0x8B4513 : 0xFFD700; // Brown for boxes, Gold for pyramids

    if (isBox) {
      // Create box (cube or parallelepiped)
      const width = size * (0.8 + Math.random() * 0.4);
      const height = size * (0.8 + Math.random() * 0.4);
      const depth = size * (0.8 + Math.random() * 0.4);

      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.7,
        metalness: 0,
      });
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.castShadow = true;
      const startY = height / 2; // Center of box at half height so bottom touches ground
      this.mesh.position.set(x, startY, z);

      // Physics body
      this.body = new CANNON.Body({
        mass: 5,
        position: new CANNON.Vec3(x, startY, z),
        linearDamping: 0.1,
        angularDamping: 0.1,
        material: new CANNON.Material({
          friction: 0.8,
          restitution: 0.3,
        }),
      });
      this.body.addShape(new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2)));
    } else {
      // Create pyramid (cone or tetrahedron)
      const baseRadius = size * (0.6 + Math.random() * 0.4);
      const height = size * (1 + Math.random() * 0.5);
      const segments = Math.random() > 0.5 ? 4 : 3; // Triangle or square base

      const geometry = new THREE.ConeGeometry(baseRadius, height, segments);
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.6,
        metalness: 0,
      });
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.castShadow = true;
      this.mesh.position.set(x, height / 2, z);

      // Physics body - use cylinder for pyramid approximation
      this.body = new CANNON.Body({
        mass: 3,
        position: new CANNON.Vec3(x, height / 2, z),
        linearDamping: 0.1,
        angularDamping: 0.1,
        material: new CANNON.Material({
          friction: 0.8,
          restitution: 0.3,
        }),
      });
      this.body.addShape(new CANNON.Cylinder(baseRadius * 0.1, baseRadius, height, 8));
    }

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
    // Don't set collisionResponse to false - let natural physics handle the fall
    // Apply slight random spin for visual effect
    this.body.angularVelocity.set(
      (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 3
    );
  }

  markConsumed(): void {
    this.consumed = true;
    this.mesh.visible = false;
  }

  reset(x: number, z: number, holeRadius: number): void {
    this.consumed = false;
    this.falling = false;
    this.mesh.visible = true;

    const yPos = this.mesh.position.y; // Keep existing height

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

  // For Quadtree compatibility
  get x(): number {
    return this.mesh.position.x;
  }

  get z(): number {
    return this.mesh.position.z;
  }

  destroy(scene: THREE.Scene, physicsWorld: CANNON.World): void {
    scene.remove(this.mesh);
    physicsWorld.removeBody(this.body);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
