import { renderConstraintGeneration, type GenerationDebugOptions } from "./renderer";
import { ConstraintGenerationSimulation } from "./simulation";
import { t } from "../../i18n";

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
    stats.textContent = `${t("stats.phase")} ${formatPhase(simulation.phase)} · ${t("stats.collapsed")} ${simulation.collapsedCellCount}/${simulation.grid.cells.length} · ${t("stats.queue")} ${queue.length} · ${t("stats.collapseDecisions")} ${simulation.collapseCount} · ${t("stats.propagationSteps")} ${simulation.propagationCount}`;
    queuePanel.innerHTML = queue.length
      ? queue.slice(0, 12).map((cell, index) => `<span class="${index === 0 ? "next" : ""}">(${cell.x}, ${cell.y})</span>`).join("") + (queue.length > 12 ? `<span>+${queue.length - 12}</span>` : "")
      : `<span class="queue-empty">${t("constraint.queueEmpty")}</span>`;
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
  return t(`phase.${phase}` as "phase.ready");
}

function phaseText(simulation: ConstraintGenerationSimulation) {
  if (simulation.phase === "contradiction") {
    return t("constraint.phaseFailed");
  }
  if (simulation.phase === "complete") {
    return t("constraint.phaseComplete");
  }
  if (simulation.phase === "collapsed") {
    return t("constraint.phaseCollapsed");
  }
  if (simulation.phase === "propagating") {
    return t("constraint.phasePropagating");
  }
  return t("constraint.phaseReady");
}
