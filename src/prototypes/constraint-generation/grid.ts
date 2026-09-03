import { tileTypes, type TileType } from "./tiles";

export interface GenerationCell {
  x: number;
  y: number;
  candidates: TileType[];
}

export class GenerationGrid {
  readonly cells: GenerationCell[];

  constructor(public readonly width = 12, public readonly height = 8) {
    this.cells = Array.from({ length: width * height }, (_, index) => ({
      x: index % width,
      y: Math.floor(index / width),
      candidates: [...tileTypes],
    }));
  }

  cellAt(x: number, y: number) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return undefined;
    }
    return this.cells[y * this.width + x];
  }

  reset() {
    for (const cell of this.cells) {
      cell.candidates = [...tileTypes];
    }
  }
}
