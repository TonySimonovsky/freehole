import * as THREE from 'three';

export class CameraController {
  camera: THREE.PerspectiveCamera;
  private distance: number;
  private angle: number;

  constructor(
    aspectRatio: number,
    distance: number,
    angle: number
  ) {
    this.distance = distance;
    this.angle = angle;

    this.camera = new THREE.PerspectiveCamera(
      50,
      aspectRatio,
      0.1,
      1000
    );

    this.updatePosition(new THREE.Vector3(0, 0, 0));
  }

  updatePosition(targetPosition: THREE.Vector3): void {
    // Top-down angled view following the hole
    const offsetX = 0;
    const offsetZ = this.distance * Math.cos(this.angle);
    const offsetY = this.distance * Math.sin(this.angle);

    this.camera.position.set(
      targetPosition.x + offsetX,
      offsetY,
      targetPosition.z + offsetZ
    );

    this.camera.lookAt(targetPosition);
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
