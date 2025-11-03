import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Hole {
  mesh: THREE.Group;
  radius: number;
  velocity: THREE.Vector3;
  slopeBody?: CANNON.Body;

  constructor(radius: number, physicsWorld?: CANNON.World) {
    this.radius = radius;
    this.velocity = new THREE.Vector3(0, 0, 0);

    this.mesh = new THREE.Group();

    const height = 0.5; // Shim height
    const innerRadius = radius * 0.85; // Slightly smaller for better rim visibility

    // Create outer rim (torus for smooth metallic look) - GOLDEN
    const torusGeometry = new THREE.TorusGeometry(
      (radius + innerRadius) / 2, // Ring radius (middle of rim)
      (radius - innerRadius) / 2, // Tube radius (rim thickness)
      16,                         // Tubular segments
      32                          // Radial segments
    );
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFD700, // Gold color
      metalness: 0.7,
      roughness: 0.2,
    });
    const rim = new THREE.Mesh(torusGeometry, rimMaterial);
    rim.rotation.x = Math.PI / 2; // Make it horizontal
    rim.position.y = 0.02;
    rim.castShadow = true;
    rim.receiveShadow = true;

    // Create black circle at plane level (fills the space inside ring)
    const blackCircleGeometry = new THREE.CircleGeometry(innerRadius, 32);
    const blackCircleMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.DoubleSide,
      depthWrite: true,
    });
    const blackCircle = new THREE.Mesh(blackCircleGeometry, blackCircleMaterial);
    blackCircle.rotation.x = -Math.PI / 2;
    blackCircle.position.y = 0.015; // Slightly above plane to avoid z-fighting
    blackCircle.renderOrder = 1; // Render after plane

    // Create inner wall (cylinder with gradient-like shading)
    const innerWallGeometry = new THREE.CylinderGeometry(
      innerRadius,     // top radius
      innerRadius * 0.95, // bottom radius (slightly tapered for depth)
      height,
      32,
      1,
      true            // open ended
    );
    const innerWallMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      side: THREE.BackSide,
      roughness: 0.9,
      metalness: 0.1,
    });
    const innerWall = new THREE.Mesh(innerWallGeometry, innerWallMaterial);
    innerWall.position.y = -height / 2;

    // Create bottom ring (darker gradient at bottom of hole)
    const bottomRingGeometry = new THREE.CircleGeometry(innerRadius * 0.95, 32);
    const bottomRingMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      side: THREE.DoubleSide,
      roughness: 1.0,
    });
    const bottomRing = new THREE.Mesh(bottomRingGeometry, bottomRingMaterial);
    bottomRing.rotation.x = -Math.PI / 2;
    bottomRing.position.y = -height;

    // Create deep black void below (for falling objects)
    const voidGeometry = new THREE.CylinderGeometry(innerRadius, innerRadius, height * 4, 32);
    const voidMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.DoubleSide,
    });
    const voidCylinder = new THREE.Mesh(voidGeometry, voidMaterial);
    voidCylinder.position.y = -height - (height * 4) / 2;

    this.mesh.add(rim);
    this.mesh.add(blackCircle);
    this.mesh.add(innerWall);
    this.mesh.add(bottomRing);
    this.mesh.add(voidCylinder);
  }

  addToScene(scene: THREE.Scene): void {
    scene.add(this.mesh);
  }

  get position(): THREE.Vector3 {
    return this.mesh.position;
  }

  update(deltaTime: number, planeSize: number): void {
    // Update position based on velocity
    this.mesh.position.x += this.velocity.x * deltaTime;
    this.mesh.position.z += this.velocity.z * deltaTime;

    // Keep hole within plane boundaries
    const halfSize = planeSize / 2;
    const margin = this.radius;
    this.mesh.position.x = Math.max(-halfSize + margin, Math.min(halfSize - margin, this.mesh.position.x));
    this.mesh.position.z = Math.max(-halfSize + margin, Math.min(halfSize - margin, this.mesh.position.z));
  }

  setVelocity(x: number, z: number): void {
    this.velocity.set(x, 0, z);
  }

  grow(amount: number): void {
    this.radius += amount;

    const height = 0.5;
    const innerRadius = this.radius * 0.85;

    // Update rim (torus)
    const rim = this.mesh.children[0] as THREE.Mesh;
    rim.geometry.dispose();
    rim.geometry = new THREE.TorusGeometry(
      (this.radius + innerRadius) / 2,
      (this.radius - innerRadius) / 2,
      16,
      32
    );

    // Update black circle
    const blackCircle = this.mesh.children[1] as THREE.Mesh;
    blackCircle.geometry.dispose();
    blackCircle.geometry = new THREE.CircleGeometry(innerRadius, 32);

    // Update inner wall
    const innerWall = this.mesh.children[2] as THREE.Mesh;
    innerWall.geometry.dispose();
    innerWall.geometry = new THREE.CylinderGeometry(
      innerRadius,
      innerRadius * 0.95,
      height,
      32,
      1,
      true
    );

    // Update bottom ring
    const bottomRing = this.mesh.children[3] as THREE.Mesh;
    bottomRing.geometry.dispose();
    bottomRing.geometry = new THREE.CircleGeometry(innerRadius * 0.95, 32);

    // Update void cylinder
    const voidCylinder = this.mesh.children[4] as THREE.Mesh;
    voidCylinder.geometry.dispose();
    voidCylinder.geometry = new THREE.CylinderGeometry(innerRadius, innerRadius, height * 4, 32);
  }
}
