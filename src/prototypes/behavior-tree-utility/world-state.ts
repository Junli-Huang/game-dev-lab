export interface WorldState { health: number; hunger: number; ammo: number; fatigue: number; enemyDistance: number }
export const WORLD_RANGES = { health: 100, hunger: 100, ammo: 10, fatigue: 100, enemyDistance: 30 } as const;
export type WorldKey = keyof WorldState;
export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
