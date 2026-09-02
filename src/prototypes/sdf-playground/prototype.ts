import { SdfRenderer } from "./renderer";
import { evaluateSdf, sdBox, sdCircle } from "./sdf";
import type { Point2, SdfState } from "./state";

type DragShape = "circle" | "box";

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
    const circleSignedDistance = sdCircle({ x: point.x - state.circlePosition.x, y: point.y - state.circlePosition.y }, state.circleRadius);
    const boxSignedDistance = sdBox({ x: point.x - state.boxPosition.x, y: point.y - state.boxPosition.y }, { x: state.boxHalfWidth, y: state.boxHalfHeight });
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
  };
  canvas.onpointerleave = () => { if (!draggedShape) pointer = undefined; };
  canvas.onpointerup = canvas.onpointercancel = () => { draggedShape = undefined; };

  const frame = () => {
    renderer.render(state);
    status.textContent = `Operation ${state.operation} · View ${state.view} · Circle (${state.circlePosition.x.toFixed(2)}, ${state.circlePosition.y.toFixed(2)}) · Box (${state.boxPosition.x.toFixed(2)}, ${state.boxPosition.y.toFixed(2)})`;
    if (pointer) {
      const distance = evaluateSdf(pointer, state);
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
