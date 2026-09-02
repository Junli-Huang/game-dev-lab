import { renderFlowField, type FieldView } from "./renderer";
import { FlowSimulation, type FlowSettings } from "./simulation";

export type InteractionMode = "target" | "obstacle" | "erase" | "spawn";

export function mountFlowField(canvas: HTMLCanvasElement, settings: FlowSettings, state: { mode: InteractionMode; view: FieldView; showAgents: boolean }, stats: HTMLElement, onAgentCount: (count: number) => void) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is not supported by this browser.");
  const simulation = new FlowSimulation(settings);
  const fixedDeltaTime = 1 / 60;
  let paused = false; let painting = false; let accumulator = 0; let animationId = 0;
  let previousTime = performance.now(); let fieldBuilds = 1;

  const pointerCell = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * canvas.width / bounds.width;
    const y = (event.clientY - bounds.top) * canvas.height / bounds.height;
    return { x, y, cellX: Math.floor(x / simulation.grid.cellSize), cellY: Math.floor(y / simulation.grid.cellSize) };
  };
  const applyPointer = (event: PointerEvent) => {
    const pointer = pointerCell(event);
    if (state.mode === "target") { simulation.setTarget(pointer.cellX, pointer.cellY); fieldBuilds += 1; }
    if (state.mode === "obstacle") { simulation.setObstacle(pointer.cellX, pointer.cellY, true); fieldBuilds += 1; }
    if (state.mode === "erase") { simulation.setObstacle(pointer.cellX, pointer.cellY, false); fieldBuilds += 1; }
    if (state.mode === "spawn") { simulation.spawnAgentsAt(pointer.x, pointer.y); onAgentCount(simulation.agents.length); }
  };
  canvas.onpointerdown = (event) => { painting = true; canvas.setPointerCapture(event.pointerId); applyPointer(event); };
  canvas.onpointermove = (event) => { if (painting && (state.mode === "obstacle" || state.mode === "erase")) applyPointer(event); };
  canvas.onpointerup = canvas.onpointercancel = () => { painting = false; };

  const frame = (time: number) => {
    const frameTime = Math.min((time - previousTime) / 1000, 0.1); previousTime = time;
    if (!paused) {
      accumulator += frameTime;
      while (accumulator >= fixedDeltaTime) { simulation.step(fixedDeltaTime); accumulator -= fixedDeltaTime; }
    } else accumulator = 0;
    renderFlowField(context, simulation, state.view, state.showAgents);
    stats.textContent = `Agents ${simulation.agents.length} · Cells ${simulation.grid.cells.length} · Shared fields 1 · Rebuilds ${fieldBuilds}`;
    animationId = requestAnimationFrame(frame);
  };
  animationId = requestAnimationFrame(frame);
  return {
    simulation,
    reset: () => { simulation.reset(); fieldBuilds += 1; onAgentCount(simulation.agents.length); },
    togglePause: () => (paused = !paused),
    isPaused: () => paused,
    destroy: () => { cancelAnimationFrame(animationId); canvas.onpointerdown = canvas.onpointermove = canvas.onpointerup = canvas.onpointercancel = null; },
  };
}
