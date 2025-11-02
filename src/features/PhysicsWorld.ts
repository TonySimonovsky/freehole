import * as CANNON from 'cannon-es';

export class PhysicsWorld {
  world: CANNON.World;
  private groundBody: CANNON.Body;
  private holeX = 0;
  private holeZ = 0;
  private holeRadius = 3;

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

    // Build ground using 4 large boxes with a square hole
    // This is stable and never needs rebuilding during movement
    const far = 200;
    const thickness = 0.5;

    // North box
    this.groundBody.addShape(
      new CANNON.Box(new CANNON.Vec3(far, thickness, far)),
      new CANNON.Vec3(0, -thickness, -(this.holeRadius + far))
    );

    // South box
    this.groundBody.addShape(
      new CANNON.Box(new CANNON.Vec3(far, thickness, far)),
      new CANNON.Vec3(0, -thickness, this.holeRadius + far)
    );

    // West box
    this.groundBody.addShape(
      new CANNON.Box(new CANNON.Vec3(far, thickness, this.holeRadius * 2)),
      new CANNON.Vec3(-(this.holeRadius + far), -thickness, 0)
    );

    // East box
    this.groundBody.addShape(
      new CANNON.Box(new CANNON.Vec3(far, thickness, this.holeRadius * 2)),
      new CANNON.Vec3(this.holeRadius + far, -thickness, 0)
    );
  }

  updateHole(x: number, z: number, radius: number): void {
    const grown = Math.abs(radius - this.holeRadius) > 1;

    if (grown) {
      this.holeRadius = radius;
      this.rebuildGround();
    }

    // Simply move the entire ground body to follow the hole
    this.groundBody.position.set(x, 0, z);
    this.holeX = x;
    this.holeZ = z;
  }

  step(deltaTime: number): void {
    this.world.step(1 / 60, deltaTime, 3);
  }
}
