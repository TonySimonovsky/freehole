import * as THREE from 'three';

export class Plane {
  mesh: THREE.Mesh;

  constructor(size: number) {
    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshStandardMaterial({
      color: 0x4a8c4a,
      roughness: 0.8,
      metalness: 0.2,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2; // Rotate to horizontal
    this.mesh.receiveShadow = true;
  }

  addToScene(scene: THREE.Scene): void {
    scene.add(this.mesh);
  }
}
