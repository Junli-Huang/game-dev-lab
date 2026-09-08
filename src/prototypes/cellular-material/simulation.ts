import { moveMaterial, leftFirst } from './movement';
import { reactFire } from './reactions';
import type { World } from './world';
export const SIMULATION_HZ = 30;
export function stepSimulation(world: World) {
  world.tick++;
  world.stats = { movedCells: 0, reactedCells: 0 };
  const bottomUp = world.mode === 'correct', forward = leftFirst(world);
  world.lastScan = { bottomUp, forward };
  for (let row = 0; row < world.height; row++) {
    const y = bottomUp ? world.height - 1 - row : row;
    for (let col = 0; col < world.width; col++) {
      const x = forward ? col : world.width - 1 - col, index = world.index(x, y), cell = world.cells[index];
      if (cell.material === 'air') continue;
      const movable = cell.material === 'sand' || cell.material === 'water';
      // Teaching bug bypasses the movement guard AND scans top-down; fire keeps its guard.
      if (cell.updatedAt === world.tick && !(world.mode === 'bug' && movable)) continue;
      cell.updatedAt = world.tick;
      world.traces[index] = movable ? moveMaterial(world, index) : cell.material === 'fire' ? reactFire(world, index)
        : { tick: world.tick, material: cell.material, from: index, to: index, checks: [], chosen: 'static' };
    }
  }
  return { tick: world.tick, ...world.stats };
}
