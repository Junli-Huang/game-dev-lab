import { reviseCandidates } from "./constraints";
import { GenerationGrid, type GenerationCell } from "./grid";
import { directions } from "./tiles";

export type GenerationPhase = "ready" | "collapsed" | "propagating" | "complete" | "contradiction";

export interface CellCoordinate {
  x: number;
  y: number;
}

export class ConstraintGenerationSimulation {
  readonly grid = new GenerationGrid();
  phase: GenerationPhase = "ready";
  propagationQueue: GenerationCell[] = [];
  currentPropagationCell?: GenerationCell;
  lastChangedCells: GenerationCell[] = [];
  lastCollapsedCell?: GenerationCell;
  collapseCount = 0;
  propagationCount = 0;
  seed = 1337;
  private random = createSeededRandom(this.seed);
  private queued = new Set<GenerationCell>();

  restart(seed = this.seed) {
    this.seed = normalizeSeed(seed);
    this.random = createSeededRandom(this.seed);
    this.grid.reset();
    this.phase = "ready";
    this.propagationQueue = [];
    this.queued.clear();
    this.currentPropagationCell = undefined;
    this.lastChangedCells = [];
    this.lastCollapsedCell = undefined;
    this.collapseCount = 0;
    this.propagationCount = 0;
  }

  collapseStep() {
    if (this.phase === "complete" || this.phase === "contradiction" || this.propagationQueue.length > 0) {
      return false;
    }
    const unresolved = this.grid.cells.filter((cell) => cell.candidates.length > 1);
    if (unresolved.length === 0) {
      this.phase = "complete";
      return false;
    }

    const minimumEntropy = Math.min(...unresolved.map((cell) => cell.candidates.length));
    const choices = unresolved.filter((cell) => cell.candidates.length === minimumEntropy);
    // Minimum entropy chooses a cell already constrained by its surroundings;
    // it reduces uncertainty, but it cannot guarantee a contradiction-free run.
    const cell = choices[Math.floor(this.random() * choices.length)];
    const tile = cell.candidates[Math.floor(this.random() * cell.candidates.length)];
    cell.candidates = [tile];
    this.lastCollapsedCell = cell;
    this.currentPropagationCell = undefined;
    this.lastChangedCells = [cell];
    this.collapseCount += 1;
    this.enqueue(cell);
    this.phase = "collapsed";
    return true;
  }

  propagationStep() {
    if (this.phase === "complete" || this.phase === "contradiction" || this.propagationQueue.length === 0) {
      return false;
    }
    const source = this.propagationQueue.shift()!;
    this.queued.delete(source);
    // A Propagation Step counts one source Cell taken from the FIFO queue,
    // regardless of whether processing that source reveals a contradiction.
    this.propagationCount += 1;
    this.currentPropagationCell = source;
    this.lastChangedCells = [];

    for (const direction of directions) {
      const neighbor = this.grid.cellAt(source.x + direction.dx, source.y + direction.dy);
      if (!neighbor || !reviseCandidates(source, neighbor, direction.id)) {
        continue;
      }
      this.lastChangedCells.push(neighbor);
      if (neighbor.candidates.length === 0) {
        // Zero candidates means no assignment can satisfy the current local
        // decisions. V0.1 exposes the failure and intentionally does not backtrack.
        this.phase = "contradiction";
        this.propagationQueue = [];
        this.queued.clear();
        return true;
      }
      // A changed domain can invalidate every adjacent domain, so it must be
      // queued again and propagation must continue until the queue is empty.
      this.enqueue(neighbor);
    }

    if (this.propagationQueue.length === 0) {
      this.phase = this.isComplete() ? "complete" : "ready";
    } else {
      this.phase = "propagating";
    }
    return true;
  }

  generationStep() {
    if (this.propagationQueue.length > 0) {
      return this.propagationStep();
    }
    return this.collapseStep();
  }

  isComplete() {
    return this.grid.cells.every((cell) => cell.candidates.length === 1);
  }

  get collapsedCellCount() {
    return this.grid.cells.filter((cell) => cell.candidates.length === 1).length;
  }

  private enqueue(cell: GenerationCell) {
    if (this.queued.has(cell)) {
      return;
    }
    this.queued.add(cell);
    this.propagationQueue.push(cell);
  }
}

function normalizeSeed(seed: number) {
  return Number.isFinite(seed) ? Math.abs(Math.trunc(seed)) || 1 : 1;
}

function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}
