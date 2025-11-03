import { PhysicsShapeConfig, ObjectProperties } from '@/shared/physics/types';

export const dinosaurConfig = {
  physics: {
    type: 'cylinders',
    cylinders: [
      // Large body/torso
      { radiusScale: 0.9, heightScale: 0.4, position: { x: 0, y: -0.2, z: 0 } },
      // Neck
      { radiusScale: 0.5, heightScale: 0.3, position: { x: 0, y: 0.3, z: 0 } },
      // Head
      { radiusScale: 0.4, heightScale: 0.2, position: { x: 0, y: 0.6, z: 0 } },
    ],
  } as PhysicsShapeConfig,
  properties: {
    mass: 2,
    friction: 0.7,
    restitution: 0.4,
  } as ObjectProperties,
  modelPath: new URL('./model/dinosaur.glb', import.meta.url).href,
};
