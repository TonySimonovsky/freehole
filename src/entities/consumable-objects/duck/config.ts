import { PhysicsShapeConfig, ObjectProperties } from '@/shared/physics/types';

export const duckConfig = {
  physics: {
    type: 'cylinders',
    cylinders: [
      // Wide bottom (body) - main mass
      { radiusScale: 1.0, heightScale: 0.35, position: { x: 0, y: -0.3, z: 0 } },
      // Narrow middle (neck)
      { radiusScale: 0.5, heightScale: 0.25, position: { x: 0, y: 0.2, z: 0 } },
      // Small top (head)
      { radiusScale: 0.4, heightScale: 0.2, position: { x: 0, y: 0.5, z: 0 } },
    ],
  } as PhysicsShapeConfig,
  properties: {
    mass: 2,
    friction: 0.7,
    restitution: 0.4,
  } as ObjectProperties,
  modelPath: new URL('./model/rubber-duck.glb', import.meta.url).href,
};
