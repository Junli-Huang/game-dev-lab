import { renderFlowField, type FieldView } from "./renderer";
import { FlowSimulation, type FlowSettings } from "./simulation";

export type InteractionMode = "target" | "obstacle" | "erase" | "spawn";

export function mountFlowField(canvas: HTMLCanvasElement, settings: FlowSettings, state: { mode: InteractionMode; view: FieldView; showAgents: boolean }, stats: HTMLElement, onAgentCount: (count: number) => void) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is not supported by this browser.");
  const simulation = new FlowSimulation(settings);
  const fixedDeltaTime = 1 / 60;
  const spawnInterval = 1 / 30;
  let paused = false; let painting = false; let accumulator = 0; let animationId = 0;
  let spawnActive = false; let spawnAccumulator = 0; let spawnPosition = { x: 0, y: 0 };
  let previousTime = performance.now(); let fieldBuilds = 1;

  const pointerCell = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * canvas.width / bounds.width;
    const y = (event.clientY - bounds.top) * canvas.height / bounds.height;
    return { x, y, cellX: Math.floor(x / simulation.grid.cellSize), cellY: Math.floor(y / simulation.grid.cellSize) };
  };
  const applyPointer = (event: PointerEvent) => {
    const pointer = pointerCell(event);
    if (state.mode === "target" && simulation.setTarget(pointer.cellX, pointer.cellY)) fieldBuilds += 1;
    if (state.mode === "obstacle" && simulation.setObstacle(pointer.cellX, pointer.cellY, true)) fieldBuilds += 1;
    if (state.mode === "erase" && simulation.setObstacle(pointer.cellX, pointer.cellY, false)) fieldBuilds += 1;
  };
  canvas.onpointerdown = (event) => {
    painting = true;
    canvas.setPointerCapture(event.pointerId);
    const pointer = pointerCell(event);
    if (state.mode === "spawn") {
      spawnActive = true;
      spawnAccumulator = spawnInterval;
      spawnPosition = { x: pointer.x, y: pointer.y };
    } else applyPointer(event);
  };
  canvas.onpointermove = (event) => {
    if (!painting) return;
    const pointer = pointerCell(event);
    if (state.mode === "spawn") {
      // Pointer input records spawn intent; the fixed update owns Agent state.
      spawnPosition = { x: pointer.x, y: pointer.y };
    } else if (state.mode === "obstacle" || state.mode === "erase") applyPointer(event);
  };
  canvas.onpointerup = canvas.onpointercancel = () => {
    painting = false;
    spawnActive = false;
    spawnAccumulator = 0;
  };

  const keyOffsets: Record<string, { x: number; y: number }> = {
    w: { x: 0, y: -1 }, arrowup: { x: 0, y: -1 },
    s: { x: 0, y: 1 }, arrowdown: { x: 0, y: 1 },
    a: { x: -1, y: 0 }, arrowleft: { x: -1, y: 0 },
    d: { x: 1, y: 0 }, arrowright: { x: 1, y: 0 },
  };
  const handleKeyDown = (event: KeyboardEvent) => {
    const offset = keyOffsets[event.key.toLowerCase()];
    if (!offset) return;
    if (event.key.startsWith("Arrow")) event.preventDefault();
    if (simulation.moveTarget(offset.x, offset.y)) fieldBuilds += 1;
  };
  window.addEventListener("keydown", handleKeyDown);

  const frame = (time: number) => {
    const frameTime = Math.min((time - previousTime) / 1000, 0.1); previousTime = time;
    if (!paused) {
      accumulator += frameTime;
      while (accumulator >= fixedDeltaTime) {
        simulation.step(fixedDeltaTime);
        if (spawnActive) {
          spawnAccumulator += fixedDeltaTime;
          while (spawnAccumulator >= spawnInterval) {
            simulation.spawnAgentAt(spawnPosition.x, spawnPosition.y);
            spawnAccumulator -= spawnInterval;
          }
          onAgentCount(simulation.agents.length);
        }
        accumulator -= fixedDeltaTime;
      }
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
    destroy: () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("keydown", handleKeyDown);
      canvas.onpointerdown = canvas.onpointermove = canvas.onpointerup = canvas.onpointercancel = null;
    },
  };
}
