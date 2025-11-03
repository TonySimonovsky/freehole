import { PhysicsShapeConfig, ObjectProperties } from '@/shared/physics/types';
import { duckConfig } from './duck/config';
import { policeCarConfig } from './police-car/config';
import { dinosaurConfig } from './dinosaur/config';
import { dragonConfig } from './dragon/config';
import { octopusConfig } from './octopus/config';

export interface ConsumableObjectConfig {
  physics: PhysicsShapeConfig;
  properties: ObjectProperties;
  modelPath: string;
}

class ConsumableObjectRegistry {
  private configs: Map<string, ConsumableObjectConfig> = new Map();

  constructor() {
    // Register all known consumable objects
    this.register('duck', duckConfig);
    this.register('rubber-duck', duckConfig); // Alias for filename
    this.register('police-car', policeCarConfig);
    this.register('dinosaur', dinosaurConfig);
    this.register('dragon', dragonConfig);
    this.register('octopus', octopusConfig);
  }

  register(name: string, config: ConsumableObjectConfig): void {
    this.configs.set(name, config);
  }

  get(name: string): ConsumableObjectConfig | undefined {
    return this.configs.get(name);
  }

  has(name: string): boolean {
    return this.configs.has(name);
  }

  getAllNames(): string[] {
    return Array.from(this.configs.keys());
  }
}

export const consumableObjectRegistry = new ConsumableObjectRegistry();
