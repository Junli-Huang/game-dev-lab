import { FIRE_RULES, type MaterialId, type Direction } from './materials';
import { SeededRandom } from './random';
export interface Cell { material: MaterialId; life: number; updatedAt: number }
export interface RuleCheck { direction: Direction; result: 'free' | 'blocked' | 'boundary' | 'notWood' | 'ignited' | 'failedRoll'; roll?: number }
export interface RuleTrace { tick: number; material: MaterialId; from: number; to: number; checks: RuleCheck[]; chosen: Direction | 'stay' | 'burn' | 'expired' | 'static'; life?: number }
export type UpdateMode = 'correct' | 'bug';
export type LateralPolicy = 'alternate' | 'left';
export class World {
  cells: Cell[];
  traces: (RuleTrace | undefined)[];
  tick = 0;
  lastScan?: { bottomUp: boolean; forward: boolean };
  rng: SeededRandom;
  mode: UpdateMode = 'correct';
  lateral: LateralPolicy = 'alternate';
  stats = { movedCells: 0, reactedCells: 0 };
  constructor(public width = 120, public height = 80, public seed = 12345) {
    this.rng = new SeededRandom(seed);
    this.cells = Array.from({ length: width * height }, () => ({ material: 'air', life: 0, updatedAt: -1 }));
    this.traces = new Array(width * height);
  }
  index(x: number, y: number) { return x < 0 || y < 0 || x >= this.width || y >= this.height ? -1 : y * this.width + x; }
  set(x: number, y: number, material: MaterialId, life?: number) {
    const i = this.index(x, y); if (i < 0) return;
    if (this.cells[i].material === material && life === undefined) return;
    this.cells[i] = { material, life: material === 'fire' ? life ?? FIRE_RULES.minLife + Math.floor(this.rng.next() * (FIRE_RULES.maxLife - FIRE_RULES.minLife + 1)) : 0, updatedAt: -1 };
    this.traces[i] = undefined;
  }
}
export function paintBrush(world: World, x: number, y: number, material: MaterialId, size: number) {
  const offset = Math.floor((size - 1) / 2);
  for (let dy = 0; dy < size; dy++) for (let dx = 0; dx < size; dx++) world.set(x + dx - offset, y + dy - offset, material);
}
export function paintLine(world: World, from: [number, number], to: [number, number], material: MaterialId, size: number) {
  const steps = Math.max(Math.abs(to[0] - from[0]), Math.abs(to[1] - from[1]));
  for (let i = 0; i <= steps; i++) {
    const fraction = steps ? i / steps : 0;
    paintBrush(world, Math.round(from[0] + (to[0] - from[0]) * fraction), Math.round(from[1] + (to[1] - from[1]) * fraction), material, size);
  }
}
