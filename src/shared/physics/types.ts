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

export interface ObjectProperties {
  mass: number;
  friction: number;
  restitution: number;
}
