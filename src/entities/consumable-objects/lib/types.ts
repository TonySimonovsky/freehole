import * as THREE from 'three';

export interface GameObjectConfig {
  modelPath?: string;  // Path to .glb/.gltf file
  model?: THREE.Group; // Pre-loaded model
  modelName?: string;  // Name for physics config lookup
  size: number;
  mass: number;
  friction?: number;
  restitution?: number;
}
