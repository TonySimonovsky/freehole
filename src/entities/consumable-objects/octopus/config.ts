import { PhysicsShapeConfig, ObjectProperties } from '@/shared/physics/types';

export const octopusConfig = {
  physics: {
    type: 'spheres',
    spheres: [
      // Main body (bulbous head)
      { radiusScale: 0.5, position: { x: 0, y: 0.3, z: 0 } },
      // Lower body (tentacles base)
      { radiusScale: 0.4, position: { x: 0, y: -0.3, z: 0 } },
    ],
  } as PhysicsShapeConfig,
  properties: {
    mass: 2,
    friction: 0.7,
    restitution: 0.4,
  } as ObjectProperties,
  modelPath: new URL('./model/octopus.glb', import.meta.url).href,
};
