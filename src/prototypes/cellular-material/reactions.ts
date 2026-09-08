import { DIRECTIONS, FIRE_RULES, type Direction } from './materials';
import type { World, RuleTrace } from './world';
export const FIRE_NEIGHBORS: Direction[] = ['up', 'down', 'left', 'right'];
export function reactFire(world: World, index: number): RuleTrace {
  const cell = world.cells[index];
  const trace: RuleTrace = { tick: world.tick, material: 'fire', from: index, to: index, checks: [], chosen: 'burn', life: --cell.life };
  if (cell.life <= 0) { cell.material = 'air'; cell.life = 0; trace.chosen = 'expired'; world.stats.reactedCells++; return trace; }
  const x = index % world.width, y = Math.floor(index / world.width);
  for (const direction of FIRE_NEIGHBORS) {
    const [dx, dy] = DIRECTIONS[direction], target = world.index(x + dx, y + dy);
    if (target < 0) { trace.checks.push({ direction, result: 'boundary' }); continue; }
    if (world.cells[target].material !== 'wood') { trace.checks.push({ direction, result: 'notWood' }); continue; }
    const roll = world.rng.next(), ignited = roll < FIRE_RULES.ignitionProbability;
    trace.checks.push({ direction, result: ignited ? 'ignited' : 'failedRoll', roll });
    if (ignited) {
      world.set(x + dx, y + dy, 'fire');
      world.cells[target].updatedAt = world.tick; // Newly ignited fire starts acting NEXT tick.
      world.stats.reactedCells++;
    }
  }
  return trace;
}
