import type { Point2, SdfOperation, SdfState } from "./state";

export function sdCircle(point: Point2, radius: number) {
  return Math.hypot(point.x, point.y) - radius;
}

export function sdBox(point: Point2, halfSize: Point2) {
  const offsetX = Math.abs(point.x) - halfSize.x;
  const offsetY = Math.abs(point.y) - halfSize.y;
  const outsideDistance = Math.hypot(Math.max(offsetX, 0), Math.max(offsetY, 0));
  const insideDistance = Math.min(Math.max(offsetX, offsetY), 0);
  return outsideDistance + insideDistance;
}

export function opSmoothUnion(distanceA: number, distanceB: number, smoothness: number) {
  const safeSmoothness = Math.max(smoothness, 0.0001);
  const blend = Math.max(0, Math.min(1, 0.5 + 0.5 * (distanceB - distanceA) / safeSmoothness));
  return distanceB * (1 - blend) + distanceA * blend - safeSmoothness * blend * (1 - blend);
}

export function combineDistances(distanceA: number, distanceB: number, operation: SdfOperation, smoothness: number) {
  if (operation === "circle") return distanceA;
  if (operation === "box") return distanceB;
  if (operation === "union") return Math.min(distanceA, distanceB);
  if (operation === "intersection") return Math.max(distanceA, distanceB);
  if (operation === "subtract") return Math.max(distanceA, -distanceB);
  return opSmoothUnion(distanceA, distanceB, smoothness);
}

export function evaluateSdf(point: Point2, state: SdfState) {
  const circleDistance = sdCircle({
    x: point.x - state.circlePosition.x,
    y: point.y - state.circlePosition.y,
  }, state.circleRadius);
  const boxDistance = sdBox({
    x: point.x - state.boxPosition.x,
    y: point.y - state.boxPosition.y,
  }, { x: state.boxHalfWidth, y: state.boxHalfHeight });
  return combineDistances(circleDistance, boxDistance, state.operation, state.smoothness);
}
