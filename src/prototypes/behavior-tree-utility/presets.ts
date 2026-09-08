import type { WorldState } from './world-state';
export const PRESETS = {
  healthy: { health: 90, hunger: 20, ammo: 8, fatigue: 20, enemyDistance: 4 },
  critical: { health: 15, hunger: 20, ammo: 5, fatigue: 10, enemyDistance: 3 },
  hungry: { health: 70, hunger: 95, ammo: 5, fatigue: 20, enemyDistance: 5 },
  peaceful: { health: 80, hunger: 90, ammo: 5, fatigue: 20, enemyDistance: 25 },
  exhausted: { health: 80, hunger: 20, ammo: 5, fatigue: 95, enemyDistance: 25 },
  different: { health: 45, hunger: 90, ammo: 6, fatigue: 20, enemyDistance: 6 },
} as const satisfies Record<string, WorldState>;
export type PresetId = keyof typeof PRESETS;
export const defaultState = (): WorldState => ({ ...PRESETS.healthy });
