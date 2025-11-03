// Basic Hole.io-like prototype with apples.
// Controls: WASD/Arrows to move the hole. Mouse/touch drag also supported.

type Vec2 = { x: number; y: number };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const len2 = (dx: number, dy: number) => dx * dx + dy * dy;
const dist = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.y - b.y);

class Input {
  keys = new Set<string>();
  pointer: Vec2 | null = null;
  dragging = false;
  constructor(canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", (e) => this.keys.add(e.key.toLowerCase()));
    window.addEventListener("keyup", (e) => this.keys.delete(e.key.toLowerCase()));

    const toCanvasPos = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top } as Vec2;
    };

    canvas.addEventListener("pointerdown", (e) => {
      this.dragging = true;
      this.pointer = toCanvasPos(e.clientX, e.clientY);
    });
    window.addEventListener("pointermove", (e) => {
      if (!this.dragging) return;
      this.pointer = toCanvasPos(e.clientX, e.clientY);
    });
    window.addEventListener("pointerup", () => {
      this.dragging = false;
    });
  }
}

class Hole {
  pos: Vec2;
  r: number; // radius in screen pixels
  speed = 280; // px/s
  constructor(x: number, y: number, r: number) {
    this.pos = { x, y };
    this.r = r;
  }
  update(input: Input, dt: number, width: number, height: number) {
    let vx = 0, vy = 0;
    if (input.keys.has("arrowleft") || input.keys.has("a")) vx -= 1;
    if (input.keys.has("arrowright") || input.keys.has("d")) vx += 1;
    if (input.keys.has("arrowup") || input.keys.has("w")) vy -= 1;
    if (input.keys.has("arrowdown") || input.keys.has("s")) vy += 1;

    if (vx || vy) {
      const inv = 1 / Math.hypot(vx, vy);
      this.pos.x += vx * inv * this.speed * dt;
      this.pos.y += vy * inv * this.speed * dt;
    } else if (input.dragging && input.pointer) {
      // Smoothly move toward pointer
      const dx = input.pointer.x - this.pos.x;
      const dy = input.pointer.y - this.pos.y;
      const m = Math.hypot(dx, dy);
      const step = this.speed * dt;
      if (m > step) {
        this.pos.x += (dx / m) * step;
        this.pos.y += (dy / m) * step;
      } else {
        this.pos.x = input.pointer.x;
        this.pos.y = input.pointer.y;
      }
    }

    this.pos.x = clamp(this.pos.x, this.r, width - this.r);
    this.pos.y = clamp(this.pos.y, this.r, height - this.r);
  }
  draw(ctx: CanvasRenderingContext2D) {
    const g = ctx.createRadialGradient(this.pos.x, this.pos.y, this.r * 0.2, this.pos.x, this.pos.y, this.r);
    g.addColorStop(0, "#000");
    g.addColorStop(0.7, "#0008");
    g.addColorStop(1, "#0000");

    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Apple {
  pos: Vec2;
  r: number;
  falling = false;
  depth = 0; // 0..1 fall progress
  constructor(x: number, y: number, r: number) {
    this.pos = { x, y };
    this.r = r;
  }
  tryConsume(hole: Hole) {
    // Trigger falling when the apple center is within the hole radius - a small margin
    const d = dist(this.pos, hole.pos);
    if (!this.falling && d < Math.max(0, hole.r - this.r * 0.6)) {
      this.falling = true;
    }
  }
  update(hole: Hole, dt: number): boolean {
    if (!this.falling) return false;
    // Move toward hole center while shrinking (simulate depth)
    const dx = hole.pos.x - this.pos.x;
    const dy = hole.pos.y - this.pos.y;
    const m = Math.hypot(dx, dy) || 1;
    const pull = 220 * dt; // suction speed
    this.pos.x += (dx / m) * pull;
    this.pos.y += (dy / m) * pull;
    this.depth = clamp(this.depth + dt * 1.2, 0, 1);
    return this.depth >= 1;
  }
  draw(ctx: CanvasRenderingContext2D) {
    const scale = 1 - this.depth; // shrink as it falls
    const r = this.r * scale;

    // shadow
    ctx.save();
    ctx.globalAlpha = 0.3 * scale;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(this.pos.x + r * 0.1, this.pos.y + r * 0.35, r * 0.9, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // body
    const grd = ctx.createRadialGradient(this.pos.x - r * 0.3, this.pos.y - r * 0.3, r * 0.2, this.pos.x, this.pos.y, r);
    grd.addColorStop(0, "#ff6b6b");
    grd.addColorStop(0.8, "#bd2d2d");
    grd.addColorStop(1, "#821b1b");

    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, r, 0, Math.PI * 2);
    ctx.fill();

    // leaf
    ctx.save();
    ctx.translate(this.pos.x - r * 0.2, this.pos.y - r * 0.9);
    ctx.rotate(-0.3);
    ctx.fillStyle = "#2ecc71";
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.25, r * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  input: Input;
  hole: Hole;
  apples: Apple[] = [];
  width = 0;
  height = 0;
  score = 0;
  last = performance.now();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D context not available");
    this.ctx = ctx;

    this.input = new Input(canvas);
    this.hole = new Hole(200, 200, 60);

    this.onResize = this.onResize.bind(this);
    window.addEventListener("resize", this.onResize);
    this.onResize();

    // spawn apples
    for (let i = 0; i < 25; i++) this.spawnApple();

    requestAnimationFrame(this.loop);
  }

  onResize() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const w = Math.floor(window.innerWidth);
    const h = Math.floor(window.innerHeight);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = w;
    this.height = h;
  }

  spawnApple() {
    // avoid spawning too close to the hole
    let x = 0, y = 0;
    let tries = 0;
    do {
      x = Math.random() * this.width;
      y = Math.random() * this.height;
      tries++;
    } while (dist({ x, y }, this.hole.pos) < this.hole.r * 2 && tries < 20);
    const r = 14 + Math.random() * 10;
    this.apples.push(new Apple(x, y, r));
  }

  loop = (t: number) => {
    const dt = Math.min(0.035, (t - this.last) / 1000);
    this.last = t;
    this.update(dt);
    this.render();
    requestAnimationFrame(this.loop);
  };

  update(dt: number) {
    this.hole.update(this.input, dt, this.width, this.height);
    for (const a of this.apples) a.tryConsume(this.hole);

    // update apples and collect consumed ones
    const consumed: number[] = [];
    for (let i = 0; i < this.apples.length; i++) {
      if (this.apples[i].update(this.hole, dt)) consumed.push(i);
    }
    if (consumed.length) {
      this.score += consumed.length;
      (document.getElementById("score") as HTMLSpanElement).textContent = String(this.score);
      // remove consumed apples and respawn same count
      for (let i = consumed.length - 1; i >= 0; i--) this.apples.splice(consumed[i], 1);
      for (let i = 0; i < consumed.length; i++) this.spawnApple();
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // ground gradient
    const g = ctx.createLinearGradient(0, 0, 0, this.height);
    g.addColorStop(0, "#1a2333");
    g.addColorStop(1, "#0d141f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.width, this.height);

    // draw apples below hole shadow (so they can appear to fall in)
    for (const a of this.apples) a.draw(ctx);
    this.hole.draw(ctx);
  }
}

function main() {
  const canvas = document.getElementById("game") as HTMLCanvasElement | null;
  if (!canvas) throw new Error("Missing #game canvas");
  new Game(canvas);
}

main();
