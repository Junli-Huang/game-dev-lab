import type { World, WaterLevelTrace, LevelCandidate } from './world';

export const WATER_LEVEL_SEARCH_DISTANCE = 24;
export function isSurfaceWater(world: World, x: number, y: number) {
  const index = world.index(x, y), above = world.index(x, y - 1);
  return index >= 0 && world.cells[index].material === 'water'
    && (above < 0 || world.cells[above].material !== 'water');
}
// Bound vertical inspection as well as horizontal search; never flood-fill the map.
function stackBottom(world: World, x: number, top: number, limit: number) {
  let bottom = top;
  while (bottom < limit) {
    const below = world.index(x, bottom + 1);
    if (below < 0 || world.cells[below].material !== 'water') break;
    bottom++;
  }
  return bottom;
}
export function findWaterLevelDirection(world: World, x: number, y: number): WaterLevelTrace {
  const trace: WaterLevelTrace = { isSurface: isSurfaceWater(world, x, y), currentSurfaceY: y, reason: 'internal' };
  if (!trace.isSurface) return trace;
  const limit = Math.min(world.height - 1, y + WATER_LEVEL_SEARCH_DISTANCE);
  const initialBottom = stackBottom(world, x, y, limit);
  const search = (sign: number): LevelCandidate | undefined => {
    const adjacent = world.index(x + sign, y);
    if (adjacent < 0 || world.cells[adjacent].material !== 'air') return undefined;
    let previousTop = y, previousBottom = initialBottom;
    for (let distance = 1; distance <= WATER_LEVEL_SEARCH_DISTANCE; distance++) {
      const column = x + sign * distance;
      let top = y;
      while (top <= limit) {
        const i = world.index(column, top);
        if (i < 0) return undefined;
        if (world.cells[i].material !== 'air') break;
        top++;
      }
      if (top > limit) return undefined;
      const material = world.cells[world.index(column, top)].material;
      if (material !== 'water') {
        // The dry bank is a terminal target, never a bridge across a solid wall.
        // Its prospective landing cell must touch the preceding water column.
        const landing = top - 1;
        if (top - y >= 2 && landing >= previousTop && landing <= previousBottom)
          return { distance, surfaceY: top, dry: true };
        return undefined;
      }
      if (!isSurfaceWater(world, column, top)) return undefined;
      const bottom = stackBottom(world, column, top, limit);
      if (top > previousBottom || bottom < previousTop) return undefined;
      const observed = sign < 0 ? 'leftObservedSurfaceY' : 'rightObservedSurfaceY';
      trace[observed] = Math.max(trace[observed] ?? y, top);
      if (top - y >= 2) return { distance, surfaceY: top, dry: false };
      previousTop = top; previousBottom = bottom;
    }
    return undefined;
  };
  trace.left = search(-1); trace.right = search(1);
  const { left, right } = trace;
  if (!left && !right) { trace.reason = 'balancedOrBlocked'; return trace; }
  // Nearest useful surface first; lower surface second; exact ties use scan policy.
  const preferLeft = world.lateral === 'left' || world.tick % 2 === 1;
  trace.direction = !right ? 'left' : !left ? 'right'
    : left.distance !== right.distance ? (left.distance < right.distance ? 'left' : 'right')
    : left.surfaceY !== right.surfaceY ? (left.surfaceY > right.surfaceY ? 'left' : 'right')
    : preferLeft ? 'left' : 'right';
  trace.reason = 'lowerSurface';
  return trace;
}
