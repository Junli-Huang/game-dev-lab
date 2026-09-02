import { SdfRenderer } from "./renderer";
import { evaluateApplicationSdf, sdBox, sdCircle } from "./sdf";
import type { Point2, SdfState } from "./state";

type DragShape = "circle" | "box" | "player";

export function mountSdfPlayground(canvas: HTMLCanvasElement, state: SdfState, status: HTMLElement, probe: HTMLElement, error: HTMLElement) {
  let renderer: SdfRenderer;
  try {
    renderer = new SdfRenderer(canvas);
  } catch (reason) {
    console.error("SDF shader initialization failed.", reason);
    error.hidden = false;
    error.textContent = `Shader initialization failed: ${reason instanceof Error ? reason.message : String(reason)}`;
    return { destroy: () => undefined };
  }

  let draggedShape: DragShape | undefined;
  let pointer: Point2 | undefined;
  let animationId = 0;
  const canvasPoint = (event: PointerEvent): Point2 => {
    const bounds = canvas.getBoundingClientRect();
    const pixelX = (event.clientX - bounds.left) * canvas.width / bounds.width;
    const pixelY = (event.clientY - bounds.top) * canvas.height / bounds.height;
    return {
      x: (pixelX * 2 - canvas.width) / canvas.height,
      y: (canvas.height - pixelY * 2) / canvas.height,
    };
  };
  canvas.onpointerdown = (event) => {
    const point = canvasPoint(event);
    if (state.application === "spell-area" || state.application === "collision") {
      const playerDistance = Math.hypot(point.x - state.playerPosition.x, point.y - state.playerPosition.y);
      if (playerDistance <= 0.12) {
        draggedShape = "player";
        canvas.setPointerCapture(event.pointerId);
        return;
      }
    }
    const circleSignedDistance = sdCircle({ x: point.x - state.circlePosition.x, y: point.y - state.circlePosition.y }, state.circleRadius);
    const boxSignedDistance = state.application === "metaball"
      ? sdCircle({ x: point.x - state.boxPosition.x, y: point.y - state.boxPosition.y }, state.circleRadius * 0.86)
      : sdBox({ x: point.x - state.boxPosition.x, y: point.y - state.boxPosition.y }, { x: state.boxHalfWidth, y: state.boxHalfHeight });
    // Negative distance means the pointer is inside; a small positive margin
    // also makes the visible boundary easy to grab.
    const circleCanDrag = circleSignedDistance <= 0.14;
    const boxCanDrag = boxSignedDistance <= 0.14;
    if (!circleCanDrag && !boxCanDrag) return;
    if (circleCanDrag && boxCanDrag) draggedShape = Math.abs(circleSignedDistance) <= Math.abs(boxSignedDistance) ? "circle" : "box";
    else draggedShape = circleCanDrag ? "circle" : "box";
    canvas.setPointerCapture(event.pointerId);
  };
  canvas.onpointermove = (event) => {
    pointer = canvasPoint(event);
    if (draggedShape === "circle") state.circlePosition = { ...pointer };
    if (draggedShape === "box") state.boxPosition = { ...pointer };
    if (draggedShape === "player") state.playerPosition = { ...pointer };
  };
  canvas.onpointerleave = () => { if (!draggedShape) pointer = undefined; };
  canvas.onpointerup = canvas.onpointercancel = () => { draggedShape = undefined; };

  const frame = () => {
    renderer.render(state);
    status.textContent = `Application ${state.application} · Operation ${state.operation} · View ${state.view}`;
    if (state.application === "spell-area" || state.application === "collision") {
      // The same signed distance used for rendering can answer gameplay
      // questions such as "is the player inside this area?"
      const distance = evaluateApplicationSdf(state.playerPosition, state);
      if (state.application === "spell-area") {
        const sign = Math.abs(distance) < 0.003 ? "Boundary" : distance < 0 ? "Inside Spell" : "Outside Spell";
        const influence = Math.max(0, Math.min(1, -distance / Math.max(state.circleRadius, 0.001)));
        probe.innerHTML = `<strong>Spell Area Query</strong><span>distance ${distance.toFixed(4)} · ${sign}</span><span>center influence ${(influence * 100).toFixed(0)}%</span>`;
      } else {
        const relation = distance < 0
          ? `Inside · penetration ${Math.abs(distance).toFixed(4)}`
          : `Outside · surface distance ${distance.toFixed(4)}`;
        probe.innerHTML = `<strong>Collision Distance Query</strong><span>signed distance ${distance.toFixed(4)}</span><span>${relation}</span>`;
      }
    } else if (pointer) {
      const distance = evaluateApplicationSdf(pointer, state);
      const sign = Math.abs(distance) < 0.003 ? "Boundary ≈ 0" : distance < 0 ? "Inside · negative" : "Outside · positive";
      probe.innerHTML = `<strong>SDF Probe</strong><span>x ${pointer.x.toFixed(3)} · y ${pointer.y.toFixed(3)}</span><span>distance ${distance.toFixed(4)} · ${sign}</span>`;
    } else probe.innerHTML = "<strong>SDF Probe</strong><span>Move the pointer over the canvas.</span>";
    animationId = requestAnimationFrame(frame);
  };
  animationId = requestAnimationFrame(frame);
  return {
    destroy: () => {
      cancelAnimationFrame(animationId);
      canvas.onpointerdown = canvas.onpointermove = canvas.onpointerleave = canvas.onpointerup = canvas.onpointercancel = null;
    },
  };
}
