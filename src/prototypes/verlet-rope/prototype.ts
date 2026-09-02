import { renderRope, type DebugOptions } from "./renderer";
import { RopeSimulation, type RopeSettings } from "./simulation";
import type { VerletPoint } from "./verlet-point";

export function mountVerletRope(canvas: HTMLCanvasElement, settings: RopeSettings, debug: DebugOptions, stats: HTMLElement) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is not supported by this browser.");
  const simulation = new RopeSimulation(canvas.width, canvas.height, settings);
  let paused = false; let animationId = 0;
  const fixedDeltaTime = 1 / 120;
  const maximumFrameTime = 0.1;
  let accumulator = 0;
  let previousTime = performance.now(); let fpsTime = previousTime; let frames = 0; let fps = 60;

  const pointerPosition = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect();
    return { x: (event.clientX - bounds.left) * canvas.width / bounds.width, y: (event.clientY - bounds.top) * canvas.height / bounds.height };
  };
  canvas.onpointerdown = (event) => {
    const mouse = pointerPosition(event);
    const draggedPoint = simulation.points.reduce<VerletPoint | undefined>((nearest, point) => {
      if (point.isPinned) return nearest;
      const distance = Math.hypot(point.position.x - mouse.x, point.position.y - mouse.y);
      const nearestDistance = nearest ? Math.hypot(nearest.position.x - mouse.x, nearest.position.y - mouse.y) : 22;
      return distance < nearestDistance ? point : nearest;
    }, undefined);
    if (draggedPoint) {
      simulation.beginDrag(draggedPoint, mouse);
      canvas.setPointerCapture(event.pointerId);
    }
  };
  canvas.onpointermove = (event) => {
    if (!simulation.isDragging()) return;
    simulation.updateDragTarget(pointerPosition(event));
  };
  canvas.onpointerup = canvas.onpointercancel = () => simulation.endDrag();

  const frame = (time: number) => {
    const frameTime = Math.min((time - previousTime) / 1000, maximumFrameTime);
    previousTime = time;
    if (!paused) {
      accumulator += frameTime;
      // Physics advances in identical steps on 60, 120 and 144 Hz displays.
      // Rendering remains tied to requestAnimationFrame.
      while (accumulator >= fixedDeltaTime) {
        simulation.step(fixedDeltaTime);
        accumulator -= fixedDeltaTime;
      }
    } else {
      // Discard time spent paused so Resume never tries to catch up.
      accumulator = 0;
      // There is no physics step while paused, so synchronize only for
      // interactive inspection. During normal playback, physics exclusively
      // owns simulation state and rendering remains read-only.
      simulation.synchronizeDraggedPoint();
    }
    renderRope(context, simulation, debug);
    frames += 1;
    if (time - fpsTime >= 500) { fps = Math.round(frames * 1000 / (time - fpsTime)); frames = 0; fpsTime = time; }
    stats.textContent = `FPS ${fps}  ·  Physics 120 Hz  ·  Points ${simulation.points.length}  ·  Constraints ${simulation.constraints.length}  ·  Iterations ${settings.iterations}`;
    animationId = requestAnimationFrame(frame);
  };
  animationId = requestAnimationFrame(frame);
  return {
    rebuild: () => simulation.rebuild(),
    togglePause: () => (paused = !paused),
    isPaused: () => paused,
    destroy: () => { cancelAnimationFrame(animationId); canvas.onpointerdown = canvas.onpointermove = canvas.onpointerup = canvas.onpointercancel = null; },
  };
}
