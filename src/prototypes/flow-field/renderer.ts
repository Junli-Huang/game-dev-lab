import type { FlowSimulation } from "./simulation";

export type FieldView = "normal" | "cost" | "integration" | "direction";

export function renderFlowField(context: CanvasRenderingContext2D, simulation: FlowSimulation, view: FieldView, showAgents: boolean) {
  const { grid } = simulation;
  context.fillStyle = "#0e1930"; context.fillRect(0, 0, context.canvas.width, context.canvas.height);

  for (const cell of grid.cells) {
    const left = cell.x * grid.cellSize; const top = cell.y * grid.cellSize;
    if (!cell.walkable) context.fillStyle = "#29344a";
    else if (view === "integration" && Number.isFinite(cell.integrationCost)) {
      const intensity = Math.max(0, 1 - cell.integrationCost / 45);
      context.fillStyle = `rgb(${18 + intensity * 20}, ${34 + intensity * 85}, ${55 + intensity * 72})`;
    } else context.fillStyle = (cell.x + cell.y) % 2 ? "#122039" : "#15243e";
    context.fillRect(left, top, grid.cellSize, grid.cellSize);

    if (view === "cost") drawCellText(context, cell.walkable ? "1" : "∞", left, top, grid.cellSize);
    if (view === "integration") drawCellText(context, Number.isFinite(cell.integrationCost) ? cell.integrationCost.toFixed(0) : "∞", left, top, grid.cellSize);
    if (view === "direction" && cell.walkable && cell !== simulation.target) drawDirection(context, left + grid.cellSize / 2, top + grid.cellSize / 2, cell.direction.x, cell.direction.y);
  }

  context.strokeStyle = "#26375388"; context.lineWidth = 1;
  for (let x = 0; x <= grid.width; x += 1) { context.beginPath(); context.moveTo(x * grid.cellSize, 0); context.lineTo(x * grid.cellSize, grid.height * grid.cellSize); context.stroke(); }
  for (let y = 0; y <= grid.height; y += 1) { context.beginPath(); context.moveTo(0, y * grid.cellSize); context.lineTo(grid.width * grid.cellSize, y * grid.cellSize); context.stroke(); }

  const targetX = (simulation.target.x + 0.5) * grid.cellSize;
  const targetY = (simulation.target.y + 0.5) * grid.cellSize;
  context.fillStyle = "#ffbe55"; context.beginPath(); context.arc(targetX, targetY, 9, 0, Math.PI * 2); context.fill();
  context.strokeStyle = "#fff1b8"; context.lineWidth = 2; context.beginPath(); context.arc(targetX, targetY, 13, 0, Math.PI * 2); context.stroke();

  if (showAgents) {
    context.fillStyle = "#6ee7c7";
    for (const agent of simulation.agents) { context.beginPath(); context.arc(agent.x, agent.y, agent.radius, 0, Math.PI * 2); context.fill(); }
  }
}

function drawCellText(context: CanvasRenderingContext2D, text: string, left: number, top: number, size: number) {
  context.fillStyle = text === "∞" ? "#ff718a" : "#aabbd2";
  context.font = "9px ui-monospace, monospace"; context.textAlign = "center"; context.textBaseline = "middle";
  context.fillText(text, left + size / 2, top + size / 2);
}

function drawDirection(context: CanvasRenderingContext2D, x: number, y: number, directionX: number, directionY: number) {
  if (directionX === 0 && directionY === 0) return;
  const length = 7; const endX = x + directionX * length; const endY = y + directionY * length;
  const angle = Math.atan2(directionY, directionX);
  context.strokeStyle = "#7cd7ff"; context.fillStyle = "#7cd7ff"; context.lineWidth = 1.4;
  context.beginPath(); context.moveTo(x - directionX * 3, y - directionY * 3); context.lineTo(endX, endY); context.stroke();
  context.beginPath(); context.moveTo(endX, endY);
  context.lineTo(endX - 4 * Math.cos(angle - Math.PI / 6), endY - 4 * Math.sin(angle - Math.PI / 6));
  context.lineTo(endX - 4 * Math.cos(angle + Math.PI / 6), endY - 4 * Math.sin(angle + Math.PI / 6)); context.fill();
}
