import type { VerletPoint } from "./verlet-point";

export interface DistanceConstraint {
  pointA: VerletPoint;
  pointB: VerletPoint;
  targetLength: number;
}

export function solveDistanceConstraint(constraint: DistanceConstraint) {
  const { pointA, pointB, targetLength } = constraint;
  const pointAIsControlled = pointA.isPinned || pointA.isDragged;
  const pointBIsControlled = pointB.isPinned || pointB.isDragged;
  const deltaX = pointB.position.x - pointA.position.x;
  const deltaY = pointB.position.y - pointA.position.y;
  const currentDistance = Math.hypot(deltaX, deltaY);
  if (currentDistance < 0.0001 || (pointAIsControlled && pointBIsControlled)) return;

  const distanceError = currentDistance - targetLength;
  const correctionRatio = distanceError / currentDistance;
  const correctionX = deltaX * correctionRatio;
  const correctionY = deltaY * correctionRatio;

  // Two free points share the correction. If one is controlled (pinned or
  // dragged), the free point must take all of it to satisfy the constraint.
  if (!pointAIsControlled && !pointBIsControlled) {
    pointA.position.x += correctionX * 0.5;
    pointA.position.y += correctionY * 0.5;
    pointB.position.x -= correctionX * 0.5;
    pointB.position.y -= correctionY * 0.5;
  } else if (pointAIsControlled) {
    pointB.position.x -= correctionX;
    pointB.position.y -= correctionY;
  } else {
    pointA.position.x += correctionX;
    pointA.position.y += correctionY;
  }
}
