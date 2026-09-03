import { renderConstraintGeneration, type GenerationDebugOptions } from "./renderer";
import { ConstraintGenerationSimulation } from "./simulation";

export function mountConstraintGeneration(
  canvas: HTMLCanvasElement,
  debug: GenerationDebugOptions,
  stats: HTMLElement,
  queuePanel: HTMLElement,
  phaseMessage: HTMLElement,
) {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D is not supported by this browser.");
  }
  const simulation = new ConstraintGenerationSimulation();
  let autoRunning = false;
  let autoAccumulator = 0;
  let animationId = 0;
  let previousTime = performance.now();

  const updatePanels = () => {
    const queue = simulation.propagationQueue;
    stats.textContent = `Phase ${formatPhase(simulation.phase)} · Collapsed ${simulation.collapsedCellCount}/${simulation.grid.cells.length} · Queue ${queue.length} · Collapse Decisions ${simulation.collapseCount} · Propagation Steps ${simulation.propagationCount}`;
    queuePanel.innerHTML = queue.length
      ? queue.slice(0, 12).map((cell, index) => `<span class="${index === 0 ? "next" : ""}">(${cell.x}, ${cell.y})</span>`).join("") + (queue.length > 12 ? `<span>+${queue.length - 12}</span>` : "")
      : "<span class=\"queue-empty\">Queue empty — the next generation action is Collapse.</span>";
    phaseMessage.className = `generation-phase ${simulation.phase}`;
    phaseMessage.textContent = phaseText(simulation);
  };

  const frame = (time: number) => {
    const deltaTime = Math.min((time - previousTime) / 1000, 0.1);
    previousTime = time;
    if (autoRunning) {
      autoAccumulator += deltaTime;
      if (autoAccumulator >= 0.12) {
        autoAccumulator = 0;
        simulation.generationStep();
        if (simulation.phase === "complete" || simulation.phase === "contradiction") {
          autoRunning = false;
        }
      }
    }
    renderConstraintGeneration(context, simulation, debug);
    updatePanels();
    animationId = requestAnimationFrame(frame);
  };

  animationId = requestAnimationFrame(frame);
  return {
    simulation,
    collapseStep: () => simulation.collapseStep(),
    propagationStep: () => simulation.propagationStep(),
    toggleAuto: () => {
      if (simulation.phase === "complete" || simulation.phase === "contradiction") {
        return false;
      }
      autoRunning = !autoRunning;
      autoAccumulator = 0;
      return autoRunning;
    },
    stopAuto: () => {
      autoRunning = false;
    },
    isAutoRunning: () => autoRunning,
    destroy: () => cancelAnimationFrame(animationId),
  };
}

function formatPhase(phase: ConstraintGenerationSimulation["phase"]) {
  return phase[0].toUpperCase() + phase.slice(1);
}

function phaseText(simulation: ConstraintGenerationSimulation) {
  if (simulation.phase === "contradiction") {
    return "Generation Failed — a Cell has no valid candidates. V0.1 does not backtrack; restart and try again.";
  }
  if (simulation.phase === "complete") {
    return "Generation Complete — every Cell has exactly one remaining Tile.";
  }
  if (simulation.phase === "collapsed") {
    return "Collapsed one minimum-entropy Cell. Constraints have NOT propagated yet.";
  }
  if (simulation.phase === "propagating") {
    return "Propagating — one changed domain can enqueue more neighbors.";
  }
  return "Ready — the queue is empty, so the next algorithm action is a minimum-entropy Collapse.";
}
