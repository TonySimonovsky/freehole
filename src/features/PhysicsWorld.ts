import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export class PhysicsWorld {
  world: CANNON.World;
  private groundBody: CANNON.Body;
  private holeX = 0;
  private holeZ = 0;
  private holeRadius = 3;
  debugMeshes: THREE.Mesh[] = [];
  debugMeshOriginalPositions: { x: number; z: number }[] = [];

  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -30, 0),
    });

    // Create one static body with multiple shapes
    this.groundBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      position: new CANNON.Vec3(0, 0, 0),
    });

    this.rebuildGround();
    this.world.addBody(this.groundBody);
  }

  private rebuildGround(): void {
    // Remove all shapes
    while (this.groundBody.shapes.length > 0) {
      this.groundBody.removeShape(this.groundBody.shapes[0]);
    }

    // Clear debug meshes
    this.debugMeshes = [];
    this.debugMeshOriginalPositions = [];

    // Build ground using many small boxes arranged in a circular pattern
    // to match the visual ring shape (but 5% bigger)
    const far = 200;
    const thickness = 0.5;
    const segments = 32; // Number of radial segments (matches visual hole)
    const innerRadius = this.holeRadius * 0.85 * 1.05; // 5% bigger than visual inner radius
    const outerRadius = this.holeRadius * 1.05; // 5% bigger than visual outer radius

    // Create radial boxes forming a ring
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const nextAngle = ((i + 1) / segments) * Math.PI * 2;

      // Calculate positions for inner and outer edges
      const innerX1 = Math.cos(angle) * innerRadius;
      const innerZ1 = Math.sin(angle) * innerRadius;
      const innerX2 = Math.cos(nextAngle) * innerRadius;
      const innerZ2 = Math.sin(nextAngle) * innerRadius;

      const outerX1 = Math.cos(angle) * outerRadius;
      const outerZ1 = Math.sin(angle) * outerRadius;
      const outerX2 = Math.cos(nextAngle) * outerRadius;
      const outerZ2 = Math.sin(nextAngle) * outerRadius;

      // Create a box for this segment of the ring
      const centerX = (innerX1 + innerX2 + outerX1 + outerX2) / 4;
      const centerZ = (innerZ1 + innerZ2 + outerZ1 + outerZ2) / 4;

      const segmentWidth = outerRadius - innerRadius;
      const segmentLength = Math.PI * 2 * ((innerRadius + this.holeRadius) / 2) / segments;

      const boxShape = new CANNON.Box(new CANNON.Vec3(segmentWidth / 2, thickness, segmentLength / 2));
      const quaternion = new CANNON.Quaternion();
      quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angle + Math.PI / segments);

      this.groundBody.addShape(boxShape, new CANNON.Vec3(centerX, -thickness, centerZ), quaternion);

      // Create debug visualization mesh (above the visual hole)
      const debugGeometry = new THREE.BoxGeometry(segmentWidth, thickness * 2, segmentLength);
      const debugMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.3,
        wireframe: false,
        depthTest: false, // Render on top
      });
      const debugMesh = new THREE.Mesh(debugGeometry, debugMaterial);
      // Position at relative offset (will be moved by Game.ts update loop)
      debugMesh.position.set(centerX, 0.5, centerZ);
      debugMesh.quaternion.copy(quaternion as any);
      debugMesh.renderOrder = 999; // Render last
      this.debugMeshes.push(debugMesh);
      // Store relative positions (offset from hole center)
      this.debugMeshOriginalPositions.push({ x: centerX, z: centerZ });
    }

    // Add outer ground boxes (same as before, but starting from outer radius)
    // North box
    this.groundBody.addShape(
      new CANNON.Box(new CANNON.Vec3(far, thickness, far)),
      new CANNON.Vec3(0, -thickness, -(outerRadius + far))
    );

    // South box
    this.groundBody.addShape(
      new CANNON.Box(new CANNON.Vec3(far, thickness, far)),
      new CANNON.Vec3(0, -thickness, outerRadius + far)
    );

    // West box
    this.groundBody.addShape(
      new CANNON.Box(new CANNON.Vec3(far, thickness, outerRadius * 2)),
      new CANNON.Vec3(-(outerRadius + far), -thickness, 0)
    );

    // East box
    this.groundBody.addShape(
      new CANNON.Box(new CANNON.Vec3(far, thickness, outerRadius * 2)),
      new CANNON.Vec3(outerRadius + far, -thickness, 0)
    );
  }

  updateHole(x: number, z: number, radius: number): void {
    const grown = Math.abs(radius - this.holeRadius) > 0.01;

    // Update hole position first, before rebuilding
    this.holeX = x;
    this.holeZ = z;

    if (grown) {
      this.holeRadius = radius;
      this.rebuildGround();
    }

    // Move the entire ground body to follow the hole
    this.groundBody.position.set(x, 0, z);
  }

  step(deltaTime: number): void {
    this.world.step(1 / 60, deltaTime, 3);
  }
}
