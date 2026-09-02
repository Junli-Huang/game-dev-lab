import type { FlowCell } from "./cell";

export class FlowGrid {
  readonly cells: FlowCell[];

  constructor(public width: number, public height: number, public cellSize: number) {
    this.cells = Array.from({ length: width * height }, (_, index) => ({
      x: index % width,
      y: Math.floor(index / width),
      walkable: true,
      movementCost: 1,
      integrationCost: Infinity,
      direction: { x: 0, y: 0 },
    }));
  }

  cell(x: number, y: number) {
    return x < 0 || y < 0 || x >= this.width || y >= this.height
      ? undefined : this.cells[y * this.width + x];
  }

  cellAtPosition(x: number, y: number) {
    return this.cell(Math.floor(x / this.cellSize), Math.floor(y / this.cellSize));
  }

  neighbors(cell: FlowCell) {
    const result: { cell: FlowCell; travelCost: number }[] = [];
    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        if (offsetX === 0 && offsetY === 0) continue;
        const neighbor = this.cell(cell.x + offsetX, cell.y + offsetY);
        if (!neighbor?.walkable) continue;
        const diagonal = offsetX !== 0 && offsetY !== 0;
        if (diagonal) {
          // Prevent paths from cutting through the touching corners of two walls.
          if (!this.cell(cell.x + offsetX, cell.y)?.walkable ||
              !this.cell(cell.x, cell.y + offsetY)?.walkable) continue;
        }
        result.push({ cell: neighbor, travelCost: diagonal ? Math.SQRT2 : 1 });
      }
    }
    return result;
  }
}
