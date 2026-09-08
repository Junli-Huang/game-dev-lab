import { DIRECTIONS, type Direction } from './materials';
import type { World, RuleTrace } from './world';
export const MOVEMENT_PRIORITY = { sand: ['down', 'diagonal'], water: ['down', 'diagonal', 'horizontal'] } as const;
export function leftFirst(world: World, tick = world.tick) { return world.lateral === 'left' || tick % 2 === 1; }
export function moveMaterial(world: World, index: number): RuleTrace {
  const cell = world.cells[index], x = index % world.width, y = Math.floor(index / world.width);
  const groups: Record<string, Direction[]> = {
    down: ['down'], diagonal: leftFirst(world) ? ['downLeft', 'downRight'] : ['downRight', 'downLeft'],
    horizontal: leftFirst(world) ? ['left', 'right'] : ['right', 'left'],
  };
  const priority = MOVEMENT_PRIORITY[cell.material as 'sand' | 'water'].flatMap(group => groups[group]);
  const trace: RuleTrace = { tick: world.tick, material: cell.material, from: index, to: index, checks: [], chosen: 'stay' };
  for (const direction of priority) {
    const [dx, dy] = DIRECTIONS[direction], destination = world.index(x + dx, y + dy);
    trace.checks.push({ direction, result: destination < 0 ? 'boundary' : world.cells[destination].material === 'air' ? 'free' : 'blocked' });
  }
  const chosen = trace.checks.find(c => c.result === 'free');
  if (chosen) {
    const [dx, dy] = DIRECTIONS[chosen.direction], destination = world.index(x + dx, y + dy);
    world.cells[index] = world.cells[destination]; world.cells[destination] = cell;
    // Mark both locations. The moved material cannot actively update again this tick.
    world.cells[index].updatedAt = world.tick; cell.updatedAt = world.tick;
    trace.to = destination; trace.chosen = chosen.direction; world.stats.movedCells++;
  }
  return trace;
}
