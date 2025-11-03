import * as CANNON from 'cannon-es';
import { PhysicsShapeConfig, ObjectProperties } from '@/shared/physics/types';

export const policeCarConfig = {
  physics: {
    type: 'custom',
    customShapes: (boxSize) => {
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
  } as PhysicsShapeConfig,
  properties: {
    mass: 2,
    friction: 0.7,
    restitution: 0.4,
  } as ObjectProperties,
  modelPath: new URL('./model/police-car.glb', import.meta.url).href,
};
