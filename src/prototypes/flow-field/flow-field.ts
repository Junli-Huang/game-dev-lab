import type { FlowCell } from "./cell";
import type { FlowGrid } from "./grid";

export function buildFlowField(grid: FlowGrid, target: FlowCell) {
  grid.cells.forEach((cell) => {
    cell.integrationCost = Infinity;
    cell.direction = { x: 0, y: 0 };
  });
  if (!target.walkable) return;

  target.integrationCost = 0;
  const frontier: FlowCell[] = [target];

  // Build backward from the shared target. One integration field can then
  // answer the next-step question for every agent on the map.
  while (frontier.length > 0) {
    frontier.sort((a, b) => b.integrationCost - a.integrationCost);
    const currentCell = frontier.pop()!;
    for (const neighbor of grid.neighbors(currentCell)) {
      const candidateCost =
        currentCell.integrationCost +
        neighbor.travelCost * neighbor.cell.movementCost;
      if (candidateCost >= neighbor.cell.integrationCost) continue;
      neighbor.cell.integrationCost = candidateCost;
      frontier.push(neighbor.cell);
    }
  }

  for (const cell of grid.cells) {
    if (!cell.walkable || cell === target || !Number.isFinite(cell.integrationCost)) continue;
    let bestCell = cell;
    for (const neighbor of grid.neighbors(cell)) {
      if (neighbor.cell.integrationCost < bestCell.integrationCost) bestCell = neighbor.cell;
    }
    if (bestCell === cell) continue;
    const deltaX = bestCell.x - cell.x;
    const deltaY = bestCell.y - cell.y;
    const length = Math.hypot(deltaX, deltaY);
    cell.direction = { x: deltaX / length, y: deltaY / length };
  }
}
