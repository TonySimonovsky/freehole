export class InputController {
  private keys: Set<string> = new Set();
  private velocity = { x: 0, z: 0 };

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key);
    });
  }

  update(speed: number): { x: number; z: number } {
    this.velocity.x = 0;
    this.velocity.z = 0;

    // WASD + Arrow keys
    if (this.keys.has('w') || this.keys.has('W') || this.keys.has('ArrowUp')) {
      this.velocity.z -= speed;
    }
    if (this.keys.has('s') || this.keys.has('S') || this.keys.has('ArrowDown')) {
      this.velocity.z += speed;
    }
    if (this.keys.has('a') || this.keys.has('A') || this.keys.has('ArrowLeft')) {
      this.velocity.x -= speed;
    }
    if (this.keys.has('d') || this.keys.has('D') || this.keys.has('ArrowRight')) {
      this.velocity.x += speed;
    }

    // Normalize diagonal movement
    if (this.velocity.x !== 0 && this.velocity.z !== 0) {
      const length = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
      this.velocity.x = (this.velocity.x / length) * speed;
      this.velocity.z = (this.velocity.z / length) * speed;
    }

    return this.velocity;
  }
}
