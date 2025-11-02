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

    // Create the hole rim (ring)
    const rimGeometry = new THREE.RingGeometry(radius * 0.9, radius, 32);
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      side: THREE.DoubleSide,
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 0.05; // Slightly above ground

    // Create the hole interior (dark circle)
    const holeGeometry = new THREE.CircleGeometry(radius * 0.9, 32);
    const holeMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.DoubleSide,
    });
    const holeCircle = new THREE.Mesh(holeGeometry, holeMaterial);
    holeCircle.rotation.x = -Math.PI / 2;
    holeCircle.position.y = 0.01;

    this.mesh.add(rim);
    this.mesh.add(holeCircle);
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

    // Update rim
    const rim = this.mesh.children[0] as THREE.Mesh;
    rim.geometry.dispose();
    rim.geometry = new THREE.RingGeometry(this.radius * 0.9, this.radius, 32);

    // Update hole interior
    const holeCircle = this.mesh.children[1] as THREE.Mesh;
    holeCircle.geometry.dispose();
    holeCircle.geometry = new THREE.CircleGeometry(this.radius * 0.9, 32);
  }
}
