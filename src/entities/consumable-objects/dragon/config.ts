import { PhysicsShapeConfig, ObjectProperties } from '@/shared/physics/types';

export const dragonConfig = {
  physics: {
    type: 'cylinders',
    cylinders: [
      // Main body
      { radiusScale: 0.85, heightScale: 0.45, position: { x: 0, y: -0.15, z: 0 } },
      // Neck/head
      { radiusScale: 0.5, heightScale: 0.35, position: { x: 0, y: 0.4, z: 0 } },
    ],
  } as PhysicsShapeConfig,
  properties: {
    mass: 2,
    friction: 0.7,
    restitution: 0.4,
  } as ObjectProperties,
  modelPath: new URL('./model/dragon.glb', import.meta.url).href,
};
