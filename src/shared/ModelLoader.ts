import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

export class ModelLoader {
  private static loader = new GLTFLoader();
  private static cache = new Map<string, THREE.Group>();

  static async load(path: string): Promise<THREE.Group> {
    // Check cache first
    if (this.cache.has(path)) {
      return this.cache.get(path)!.clone();
    }

    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => {
          // Cache the original
          this.cache.set(path, gltf.scene);
          // Return a clone
          resolve(gltf.scene.clone());
        },
        (progress) => {
          console.log(`Loading ${path}: ${(progress.loaded / progress.total * 100).toFixed(0)}%`);
        },
        (error) => {
          console.error(`Error loading ${path}:`, error);
          reject(error);
        }
      );
    });
  }

  static preload(paths: string[]): Promise<void[]> {
    return Promise.all(paths.map(path => this.load(path).then(() => {})));
  }
}
