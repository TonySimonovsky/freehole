import * as CANNON from 'cannon-es';

export interface PhysicsShapeConfig {
  type: 'auto' | 'cylinders' | 'spheres' | 'box' | 'custom';
  // For cylinder type (values are proportional to bounding box)
  cylinders?: {
    radiusScale: number;  // Multiplier of min(width, depth) / 2
    heightScale: number;  // Multiplier of total height
    position: { x: number; y: number; z: number }; // Proportional to bounding box (-1 to 1)
  }[];
  // For sphere type (values are proportional to bounding box)
  spheres?: {
    radiusScale: number;  // Multiplier of average dimension
    position: { x: number; y: number; z: number }; // Proportional to bounding box (-1 to 1)
  }[];
  // For box type
  box?: {
    halfExtents: { x: number; y: number; z: number };
    position?: { x: number; y: number; z: number };
  };
  // Custom function to create shapes
  customShapes?: (boxSize: { x: number; y: number; z: number }) => {
    shape: CANNON.Shape;
    offset?: CANNON.Vec3;
    quaternion?: CANNON.Quaternion;
  }[];
}

export class ModelPhysicsRegistry {
  private static configs: Map<string, PhysicsShapeConfig> = new Map();

  static register(modelName: string, config: PhysicsShapeConfig): void {
    this.configs.set(modelName, config);
  }

  static get(modelName: string): PhysicsShapeConfig | undefined {
    return this.configs.get(modelName);
  }

  static has(modelName: string): boolean {
    return this.configs.has(modelName);
  }
}

// Register known model physics configurations
// All values are proportional to bounding box dimensions
ModelPhysicsRegistry.register('duck', {
  type: 'cylinders',
  cylinders: [
    // Wide bottom (body) - main mass
    { radiusScale: 1.0, heightScale: 0.35, position: { x: 0, y: -0.3, z: 0 } },
    // Narrow middle (neck)
    { radiusScale: 0.5, heightScale: 0.25, position: { x: 0, y: 0.2, z: 0 } },
    // Small top (head)
    { radiusScale: 0.4, heightScale: 0.2, position: { x: 0, y: 0.5, z: 0 } },
  ],
});

// Alias for rubber-duck filename
ModelPhysicsRegistry.register('rubber-duck', {
  type: 'cylinders',
  cylinders: [
    // Wide bottom (body) - main mass
    { radiusScale: 1.0, heightScale: 0.35, position: { x: 0, y: -0.3, z: 0 } },
    // Narrow middle (neck)
    { radiusScale: 0.5, heightScale: 0.25, position: { x: 0, y: 0.2, z: 0 } },
    // Small top (head)
    { radiusScale: 0.4, heightScale: 0.2, position: { x: 0, y: 0.5, z: 0 } },
  ],
});

ModelPhysicsRegistry.register('police-car', {
  type: 'custom',
  customShapes: (boxSize) => {
    const quat = new CANNON.Quaternion();
    quat.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), Math.PI / 2); // Rotate for horizontal

    return [
      // Main body (wide, low)
      {
        shape: new CANNON.Box(new CANNON.Vec3(boxSize.x * 0.4, boxSize.y * 0.3, boxSize.z * 0.4)),
        offset: new CANNON.Vec3(0, -boxSize.y * 0.2, 0),
      },
      // Top cabin
      {
        shape: new CANNON.Box(new CANNON.Vec3(boxSize.x * 0.3, boxSize.y * 0.2, boxSize.z * 0.3)),
        offset: new CANNON.Vec3(0, boxSize.y * 0.2, 0),
      },
    ];
  },
});

ModelPhysicsRegistry.register('dinosaur', {
  type: 'cylinders',
  cylinders: [
    // Large body/torso
    { radiusScale: 0.9, heightScale: 0.4, position: { x: 0, y: -0.2, z: 0 } },
    // Neck
    { radiusScale: 0.5, heightScale: 0.3, position: { x: 0, y: 0.3, z: 0 } },
    // Head
    { radiusScale: 0.4, heightScale: 0.2, position: { x: 0, y: 0.6, z: 0 } },
  ],
});

ModelPhysicsRegistry.register('dragon', {
  type: 'cylinders',
  cylinders: [
    // Main body
    { radiusScale: 0.85, heightScale: 0.45, position: { x: 0, y: -0.15, z: 0 } },
    // Neck/head
    { radiusScale: 0.5, heightScale: 0.35, position: { x: 0, y: 0.4, z: 0 } },
  ],
});

ModelPhysicsRegistry.register('octopus', {
  type: 'spheres',
  spheres: [
    // Main body (bulbous head)
    { radiusScale: 0.5, position: { x: 0, y: 0.3, z: 0 } },
    // Lower body (tentacles base)
    { radiusScale: 0.4, position: { x: 0, y: -0.3, z: 0 } },
  ],
});
