import type { FlowAgent } from "./agent";
import { buildFlowField } from "./flow-field";
import { FlowGrid } from "./grid";

export interface FlowSettings { agentCount: number; agentSpeed: number }

export class FlowSimulation {
  readonly grid = new FlowGrid(36, 24, 25);
  agents: FlowAgent[] = [];
  target = this.grid.cell(29, 12)!;

  constructor(public settings: FlowSettings) {
    this.reset();
  }

  reset() {
    this.grid.cells.forEach((cell) => { cell.walkable = true; cell.movementCost = 1; });
    // Two offset walls make the initial field visibly bend without forming a maze.
    for (let y = 3; y < 17; y += 1) if (y < 9 || y > 11) this.grid.cell(18, y)!.walkable = false;
    for (let x = 7; x < 16; x += 1) if (x < 11 || x > 12) this.grid.cell(x, 14)!.walkable = false;
    // The geometrically short route crosses this mud band and the wall gap.
    // At cost 4, the field prefers a longer route over normal ground.
    for (let y = 7; y <= 13; y += 1) {
      for (let x = 13; x <= 22; x += 1) {
        const cell = this.grid.cell(x, y)!;
        if (cell.walkable) cell.movementCost = 4;
      }
    }
    this.target = this.grid.cell(29, 12)!;
    this.rebuildField();
    // Reset means fresh simulation state, not merely restoring the desired
    // array length. Keep the user's count setting but regenerate every agent.
    this.agents = [];
    this.setAgentCount(this.settings.agentCount);
  }

  rebuildField() {
    buildFlowField(this.grid, this.target);
  }

  setTarget(x: number, y: number) {
    const cell = this.grid.cell(x, y);
    if (!cell?.walkable || cell === this.target) return false;
    this.target = cell;
    this.rebuildField();
    return true;
  }

  moveTarget(offsetX: number, offsetY: number) {
    return this.setTarget(this.target.x + offsetX, this.target.y + offsetY);
  }

  setObstacle(x: number, y: number, blocked: boolean) {
    const cell = this.grid.cell(x, y);
    if (!cell || cell === this.target || cell.walkable === !blocked) return false;
    cell.walkable = !blocked;
    this.rebuildField();
    return true;
  }

  setMovementCost(x: number, y: number, movementCost: number) {
    const cell = this.grid.cell(x, y);
    if (!cell || cell === this.target) return false;
    const changed = !cell.walkable || cell.movementCost !== movementCost;
    if (!changed) return false;
    cell.walkable = true;
    cell.movementCost = movementCost;
    this.rebuildField();
    return true;
  }

  setAgentCount(count: number) {
    this.settings.agentCount = count;
    while (this.agents.length < count) this.agents.push(this.createAgent());
    this.agents.length = count;
  }

  spawnAgentAt(x: number, y: number) {
    if (this.agents.length >= 500) return false;
    const cell = this.grid.cellAtPosition(x, y);
    if (!cell?.walkable) return false;
    this.agents.push({ x, y, radius: 3, phase: Math.random() * Math.PI * 2 });
    this.settings.agentCount = this.agents.length;
    return true;
  }

  step(deltaTime: number) {
    const targetX = (this.target.x + 0.5) * this.grid.cellSize;
    const targetY = (this.target.y + 0.5) * this.grid.cellSize;
    for (const agent of this.agents) {
      if (Math.hypot(agent.x - targetX, agent.y - targetY) < 7) continue;
      const cell = this.grid.cellAtPosition(agent.x, agent.y);
      if (!cell?.walkable || !Number.isFinite(cell.integrationCost)) continue;
      // Every agent performs the same O(1) local lookup. No agent runs A*.
      agent.x += cell.direction.x * this.settings.agentSpeed * deltaTime;
      agent.y += cell.direction.y * this.settings.agentSpeed * deltaTime;
    }
  }

  private createAgent(): FlowAgent {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const x = 2 + Math.floor(Math.random() * 10);
      const y = 2 + Math.floor(Math.random() * 20);
      const cell = this.grid.cell(x, y)!;
      if (cell.walkable && Number.isFinite(cell.integrationCost)) {
        return { x: (x + 0.5) * 25 + (Math.random() - 0.5) * 12, y: (y + 0.5) * 25 + (Math.random() - 0.5) * 12, radius: 3, phase: Math.random() * Math.PI * 2 };
      }
    }
    return { x: 40, y: 40, radius: 3, phase: 0 };
  }
}
