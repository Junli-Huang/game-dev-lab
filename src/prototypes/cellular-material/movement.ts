import { findWaterLevelDirection } from './leveling';
import { DIRECTIONS, type Direction } from './materials';
import type { World, RuleTrace } from './world';
export const MOVEMENT_PRIORITY = { sand: ['down', 'diagonal'], water: ['down', 'diagonal'] } as const;
export function leftFirst(world: World, tick = world.tick) { return world.lateral === 'left' || tick % 2 === 1; }
export const WATER_SPREAD_DISTANCE = 6;
export function findWaterDropDirection(world: World, x: number, y: number) {
  const search = (sign: number): number | undefined => {
    for (let distance = 1; distance <= WATER_SPREAD_DISTANCE; distance++) {
      const path = world.index(x + sign * distance, y);
      if (path < 0 || world.cells[path].material !== 'air') break;
      const below = world.index(x + sign * distance, y + 1);
      if (below >= 0 && world.cells[below].material === 'air') return distance;
    }
    return undefined;
  };
  const leftDropDistance = search(-1), rightDropDistance = search(1);
  const left = leftDropDistance ?? Infinity, right = rightDropDistance ?? Infinity;
  const direction: Direction | undefined = left === Infinity && right === Infinity ? undefined
    : left < right ? 'left' : right < left ? 'right' : leftFirst(world) ? 'left' : 'right';
  return { direction, leftDropDistance, rightDropDistance };
}
export function moveMaterial(world: World, index: number): RuleTrace {
  const cell = world.cells[index], x = index % world.width, y = Math.floor(index / world.width);
  const groups: Record<string, Direction[]> = {
    down: ['down'], diagonal: leftFirst(world) ? ['downLeft', 'downRight'] : ['downRight', 'downLeft'],
  };
  const priority = MOVEMENT_PRIORITY[cell.material as 'sand' | 'water'].flatMap(group => groups[group]);
  const trace: RuleTrace = { tick: world.tick, material: cell.material, from: index, to: index, checks: [], chosen: 'stay' };
  for (const direction of priority) {
    const [dx, dy] = DIRECTIONS[direction], destination = world.index(x + dx, y + dy);
    trace.checks.push({ direction, result: destination < 0 ? 'boundary' : world.cells[destination].material === 'air' ? 'free' : 'blocked' });
  }
  let chosen = trace.checks.find(c => c.result === 'free')?.direction;
  if (!chosen && cell.material === 'water') {
    const search = findWaterDropDirection(world, x, y);
    trace.waterSearch = { leftDropDistance: search.leftDropDistance, rightDropDistance: search.rightDropDistance };
    chosen = search.direction;
    if (!chosen) {
      trace.waterLevel = findWaterLevelDirection(world, x, y);
      chosen = trace.waterLevel.direction;
    }
  }
  if (chosen) {
    const [dx, dy] = DIRECTIONS[chosen], destination = world.index(x + dx, y + dy);
    world.cells[index] = world.cells[destination]; world.cells[destination] = cell;
    // Mark both locations. The moved material cannot actively update again this tick.
    world.cells[index].updatedAt = world.tick; cell.updatedAt = world.tick;
    trace.to = destination; trace.chosen = chosen; world.stats.movedCells++;
  }
  return trace;
}
