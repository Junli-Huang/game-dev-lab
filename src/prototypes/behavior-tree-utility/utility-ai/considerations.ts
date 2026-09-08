import { clamp01, WORLD_RANGES, type WorldKey, type WorldState } from '../world-state';
const DEFINITIONS = {
  enemyNear: { field: 'enemyDistance', curve: 'inverse' },
  enemyFar: { field: 'enemyDistance', curve: 'linear' },
  health: { field: 'health', curve: 'linear' },
  lowHealth: { field: 'health', curve: 'inverse' },
  hasAmmo: { field: 'ammo', curve: 'binary' },
  lowAmmo: { field: 'ammo', curve: 'inverse' },
  hunger: { field: 'hunger', curve: 'linear' },
  lowHunger: { field: 'hunger', curve: 'inverse' },
  fatigue: { field: 'fatigue', curve: 'linear' },
  lowFatigue: { field: 'fatigue', curve: 'inverse' },
} as const satisfies Record<string, { field: WorldKey; curve: 'linear' | 'inverse' | 'binary' }>;
export type ConsiderationId = keyof typeof DEFINITIONS;
export interface ConsiderationResult { id: ConsiderationId; input: number; score: number; formula: string }
export function evaluateConsideration(id: ConsiderationId, state: Readonly<WorldState>): ConsiderationResult {
  const { field, curve } = DEFINITIONS[id];
  const input = state[field], maximum = WORLD_RANGES[field];
  const normalized = clamp01(input / maximum);
  const score = curve === 'binary' ? Number(input > 0) : curve === 'inverse' ? 1 - normalized : normalized;
  const formula = curve === 'binary' ? `${input} > 0 ? 1 : 0` : `${curve === 'inverse' ? '1 − ' : ''}clamp(${input} / ${maximum})`;
  return { id, input, score, formula };
}
