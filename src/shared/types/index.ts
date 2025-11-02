export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface GameConfig {
  planeSize: number;
  initialHoleRadius: number;
  holeSpeed: number;
  cameraDistance: number;
  cameraAngle: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  planeSize: 200,
  initialHoleRadius: 3,
  holeSpeed: 20,
  cameraDistance: 40,
  cameraAngle: Math.PI / 3, // 60 degrees
};
