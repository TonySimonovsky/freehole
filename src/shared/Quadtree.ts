interface Point {
  x: number;
  z: number;
}

interface Rectangle {
  x: number;
  z: number;
  width: number;
  height: number;
}

export class Quadtree<T extends Point> {
  private boundary: Rectangle;
  private capacity: number;
  private items: T[] = [];
  private divided = false;
  private northeast?: Quadtree<T>;
  private northwest?: Quadtree<T>;
  private southeast?: Quadtree<T>;
  private southwest?: Quadtree<T>;

  constructor(boundary: Rectangle, capacity = 4) {
    this.boundary = boundary;
    this.capacity = capacity;
  }

  insert(item: T): boolean {
    if (!this.contains(this.boundary, item)) {
      return false;
    }

    if (this.items.length < this.capacity) {
      this.items.push(item);
      return true;
    }

    if (!this.divided) {
      this.subdivide();
    }

    return (
      this.northeast!.insert(item) ||
      this.northwest!.insert(item) ||
      this.southeast!.insert(item) ||
      this.southwest!.insert(item)
    );
  }

  query(range: Rectangle, found: T[] = []): T[] {
    if (!this.intersects(this.boundary, range)) {
      return found;
    }

    for (const item of this.items) {
      if (this.contains(range, item)) {
        found.push(item);
      }
    }

    if (this.divided) {
      this.northeast!.query(range, found);
      this.northwest!.query(range, found);
      this.southeast!.query(range, found);
      this.southwest!.query(range, found);
    }

    return found;
  }

  clear(): void {
    this.items = [];
    this.divided = false;
    this.northeast = undefined;
    this.northwest = undefined;
    this.southeast = undefined;
    this.southwest = undefined;
  }

  private subdivide(): void {
    const { x, z, width, height } = this.boundary;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    this.northeast = new Quadtree(
      { x: x + halfWidth, z: z, width: halfWidth, height: halfHeight },
      this.capacity
    );
    this.northwest = new Quadtree(
      { x: x, z: z, width: halfWidth, height: halfHeight },
      this.capacity
    );
    this.southeast = new Quadtree(
      { x: x + halfWidth, z: z + halfHeight, width: halfWidth, height: halfHeight },
      this.capacity
    );
    this.southwest = new Quadtree(
      { x: x, z: z + halfHeight, width: halfWidth, height: halfHeight },
      this.capacity
    );

    this.divided = true;
  }

  private contains(rect: Rectangle, point: Point): boolean {
    return (
      point.x >= rect.x &&
      point.x < rect.x + rect.width &&
      point.z >= rect.z &&
      point.z < rect.z + rect.height
    );
  }

  private intersects(rect1: Rectangle, rect2: Rectangle): boolean {
    return !(
      rect2.x > rect1.x + rect1.width ||
      rect2.x + rect2.width < rect1.x ||
      rect2.z > rect1.z + rect1.height ||
      rect2.z + rect2.height < rect1.z
    );
  }
}
