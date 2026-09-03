import type { GenerationCell } from "./grid";
import type { ConstraintGenerationSimulation } from "./simulation";
import { tiles } from "./tiles";

export interface GenerationDebugOptions {
  showEntropy: boolean;
  showCandidates: boolean;
}

const cellSize = 64;
const gridOffsetX = 26;
const gridOffsetY = 24;

export function renderConstraintGeneration(
  context: CanvasRenderingContext2D,
  simulation: ConstraintGenerationSimulation,
  debug: GenerationDebugOptions,
) {
  const { canvas } = context;
  context.fillStyle = "#091326";
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (const cell of simulation.grid.cells) {
    drawCell(context, cell, simulation, debug);
  }
}

function drawCell(
  context: CanvasRenderingContext2D,
  cell: GenerationCell,
  simulation: ConstraintGenerationSimulation,
  debug: GenerationDebugOptions,
) {
  const x = gridOffsetX + cell.x * cellSize;
  const y = gridOffsetY + cell.y * cellSize;
  const entropy = cell.candidates.length;
  const changed = simulation.lastChangedCells.includes(cell);
  const queued = simulation.propagationQueue.includes(cell);
  const current = simulation.currentPropagationCell === cell;

  if (entropy === 1) {
    drawCollapsedTile(context, x, y, cellSize, cell.candidates[0]);
  } else {
    context.fillStyle = entropy === 0 ? "#5c1f35" : "#14233b";
    context.fillRect(x, y, cellSize, cellSize);
  }

  if (queued) {
    context.fillStyle = "#ffcf7618";
    context.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
  }
  context.strokeStyle = current ? "#ffffff" : changed ? "#ffcf76" : queued ? "#d7a84d" : "#2d4161";
  context.lineWidth = current ? 4 : changed ? 3 : queued ? 2 : 1;
  context.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

  if (entropy === 0) {
    drawCenteredText(context, "0", x, y, cellSize, "#ff8ea1", 24);
    return;
  }
  if (entropy > 1 && debug.showEntropy) {
    drawCenteredText(context, String(entropy), x, y - (debug.showCandidates ? 8 : 0), cellSize, "#eaf1ff", 22);
  }
  if (entropy > 1 && debug.showCandidates) {
    const labels = cell.candidates.map((tile) => tiles[tile].shortLabel).join(" ");
    context.fillStyle = "#8fa2bf";
    context.font = "700 10px ui-monospace, monospace";
    context.textAlign = "center";
    context.fillText(labels, x + cellSize / 2, y + cellSize - 11);
  }
}

function drawCollapsedTile(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  tileId: GenerationCell["candidates"][number],
) {
  const tile = tiles[tileId];
  context.fillStyle = tile.color;
  context.fillRect(x, y, size, size);
  context.fillStyle = "#ffffff10";
  context.fillRect(x + 6, y + 6, size - 12, size - 12);
  context.fillStyle = tile.accent;
  context.font = "800 11px ui-sans-serif, system-ui";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(tile.label, x + size / 2, y + size / 2);
}

function drawCenteredText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  fontSize: number,
) {
  context.fillStyle = color;
  context.font = `800 ${fontSize}px ui-monospace, monospace`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, x + size / 2, y + size / 2);
}
