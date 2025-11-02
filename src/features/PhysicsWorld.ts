import * as CANNON from 'cannon-es';

export class PhysicsWorld {
  world: CANNON.World;
  private groundBody: CANNON.Body;

  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -30, 0),
    });

    // Simple flat ground
    this.groundBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Plane(),
    });
    this.groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(this.groundBody);
  }

  step(deltaTime: number): void {
    this.world.step(1 / 60, deltaTime, 3);
  }
}
