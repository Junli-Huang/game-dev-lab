import { ACTION_IDS, type ActionId } from '../actions';
import type { WorldState } from '../world-state';
import { evaluateConsideration, type ConsiderationId, type ConsiderationResult } from './considerations';
export const UTILITY_RULES = {
  attack: { baseScore: 1, considerations: ['enemyNear', 'health', 'hasAmmo'] },
  run: { baseScore: 1, considerations: ['enemyNear', 'lowHealth'] },
  reload: { baseScore: 1, considerations: ['lowAmmo', 'enemyNear'] },
  eat: { baseScore: 1, considerations: ['hunger'] },
  sleep: { baseScore: 1, considerations: ['fatigue'] },
  explore: { baseScore: .2, considerations: ['lowHunger', 'lowFatigue', 'enemyFar'] },
} as const satisfies Record<ActionId, { baseScore: number; considerations: readonly ConsiderationId[] }>;
export interface UtilityActionResult { action: ActionId; baseScore: number; considerations: ConsiderationResult[]; finalScore: number }
export interface UtilityDecisionResult { selectedAction: ActionId; actions: UtilityActionResult[] }
export function evaluateUtility(state: Readonly<WorldState>): UtilityDecisionResult {
  const actions = ACTION_IDS.map(action => {
    const rule = UTILITY_RULES[action];
    const considerations = rule.considerations.map(id => evaluateConsideration(id, state));
    return { action, baseScore: rule.baseScore, considerations, finalScore: considerations.reduce((score, item) => score * item.score, rule.baseScore as number) };
  });
  // Strict comparison preserves definition order on exact ties; never round before selecting.
  const winner = actions.reduce((best, item) => item.finalScore > best.finalScore ? item : best);
  return { selectedAction: winner.action, actions };
}
