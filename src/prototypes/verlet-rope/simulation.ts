import { solveDistanceConstraint, type DistanceConstraint } from "./constraint";
import { createPoint, type Vector2, type VerletPoint } from "./verlet-point";

export interface RopeSettings { gravity: number; pointCount: number; segmentLength: number; iterations: number }

export interface ConstraintErrorStats {
  average: number;
  maximum: number;
}

export class RopeSimulation {
  points: VerletPoint[] = [];
  constraints: DistanceConstraint[] = [];
  groundY: number;
  private anchorX: number;
  private anchorY = 42;
  private draggedPoint?: VerletPoint;
  private dragTarget?: Vector2;

  constructor(private width: number, height: number, public settings: RopeSettings) {
    this.groundY = height - 38;
    this.anchorX = width * 0.5;
    this.rebuild();
  }

  rebuild() {
    this.draggedPoint = undefined;
    this.dragTarget = undefined;
    this.points = Array.from({ length: this.settings.pointCount }, (_, index) =>
      createPoint(this.anchorX, this.anchorY + index * this.settings.segmentLength, index === 0));
    this.constraints = this.points.slice(1).map((point, index) => ({
      pointA: this.points[index], pointB: point, targetLength: this.settings.segmentLength,
    }));
  }

  step(deltaTime: number) {
    this.integratePoints(deltaTime);
    this.synchronizeDraggedPoint();
    // Each pass fixes errors introduced by neighboring constraints. Repeating
    // the pass makes the full chain converge toward all target lengths.
    for (let pass = 0; pass < this.settings.iterations; pass += 1) {
      // The mouse target is a hard kinematic constraint. Reapplying it before
      // every pass makes ownership explicit even if new solvers are added later.
      this.synchronizeDraggedPoint();
      this.constraints.forEach(solveDistanceConstraint);
      this.projectPointsAboveGround();
    }
    this.applyGroundDamping();
  }

  getConstraintErrorStats(): ConstraintErrorStats {
    if (this.constraints.length === 0) return { average: 0, maximum: 0 };
    let total = 0;
    let maximum = 0;
    for (const constraint of this.constraints) {
      const distance = Math.hypot(
        constraint.pointB.position.x - constraint.pointA.position.x,
        constraint.pointB.position.y - constraint.pointA.position.y,
      );
      const error = Math.abs(distance - constraint.targetLength);
      total += error;
      maximum = Math.max(maximum, error);
    }
    return { average: total / this.constraints.length, maximum };
  }

  private integratePoints(deltaTime: number) {
    for (const point of this.points) {
      if (point.isPinned || point.isDragged) continue;
      // Verlet infers velocity from two positions, so no explicit velocity is stored.
      const velocityX = (point.position.x - point.previousPosition.x) * 0.995;
      const velocityY = (point.position.y - point.previousPosition.y) * 0.995;
      const currentX = point.position.x;
      const currentY = point.position.y;
      point.position.x += velocityX;
      point.position.y += velocityY + this.settings.gravity * deltaTime * deltaTime;
      point.previousPosition.x = currentX;
      point.previousPosition.y = currentY;
    }
  }

  beginDrag(point: VerletPoint, target: Vector2) {
    this.endDrag();
    point.isDragged = true;
    this.draggedPoint = point;
    this.dragTarget = { ...target };
    this.synchronizeDraggedPoint();
  }

  updateDragTarget(target: Vector2) {
    if (!this.draggedPoint) return;
    // Input records intent only. The simulation applies this target at its own
    // fixed-step boundary instead of pointer events writing physics state.
    this.dragTarget = { ...target };
  }

  endDrag() {
    if (!this.draggedPoint) return;
    this.synchronizeDraggedPoint();
    // Aligning both positions encodes zero release velocity. A future throw
    // mode could instead reconstruct previousPosition from pointer velocity.
    this.draggedPoint.previousPosition.x = this.draggedPoint.position.x;
    this.draggedPoint.previousPosition.y = this.draggedPoint.position.y;
    this.draggedPoint.isDragged = false;
    this.draggedPoint = undefined;
    this.dragTarget = undefined;
  }

  isDragging() {
    return Boolean(this.draggedPoint);
  }

  synchronizeDraggedPoint() {
    if (!this.draggedPoint || !this.dragTarget) return;
    this.draggedPoint.position.x = this.dragTarget.x;
    this.draggedPoint.position.y = this.dragTarget.y;
    this.draggedPoint.previousPosition.x = this.dragTarget.x;
    this.draggedPoint.previousPosition.y = this.dragTarget.y;
  }

  private projectPointsAboveGround() {
    for (const point of this.points) {
      if (point.isPinned || point.position.y <= this.groundY) continue;
      point.position.y = this.groundY;
    }
  }

  private applyGroundDamping() {
    for (const point of this.points) {
      if (point.isPinned || point.position.y < this.groundY - 0.001) continue;
      // This velocity response runs once per simulation step, outside the
      // constraint loop. Iterations therefore change solver accuracy without
      // secretly changing the amount of ground friction.
      point.previousPosition.x += (point.position.x - point.previousPosition.x) * 0.08;
    }
  }
}
