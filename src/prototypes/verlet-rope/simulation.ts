import { solveDistanceConstraint, type DistanceConstraint } from "./constraint";
import { createPoint, type VerletPoint } from "./verlet-point";

export interface RopeSettings { gravity: number; pointCount: number; segmentLength: number; iterations: number }

export class RopeSimulation {
  points: VerletPoint[] = [];
  constraints: DistanceConstraint[] = [];
  groundY: number;
  private anchorX: number;
  private anchorY = 42;

  constructor(private width: number, height: number, public settings: RopeSettings) {
    this.groundY = height - 38;
    this.anchorX = width * 0.5;
    this.rebuild();
  }

  rebuild() {
    this.points = Array.from({ length: this.settings.pointCount }, (_, index) =>
      createPoint(this.anchorX, this.anchorY + index * this.settings.segmentLength, index === 0));
    this.constraints = this.points.slice(1).map((point, index) => ({
      pointA: this.points[index], pointB: point, targetLength: this.settings.segmentLength,
    }));
  }

  step(deltaTime: number) {
    this.integratePoints(deltaTime);
    // Each pass fixes errors introduced by neighboring constraints. Repeating
    // the pass makes the full chain converge toward all target lengths.
    for (let pass = 0; pass < this.settings.iterations; pass += 1) {
      this.constraints.forEach(solveDistanceConstraint);
      this.resolveGroundCollision();
    }
  }

  private integratePoints(deltaTime: number) {
    for (const point of this.points) {
      if (point.isPinned) continue;
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

  private resolveGroundCollision() {
    for (const point of this.points) {
      if (point.isPinned || point.position.y <= this.groundY) continue;
      point.position.y = this.groundY;
      // Moving the previous position toward the current position removes some
      // tangential energy and prevents endless skating along the ground.
      point.previousPosition.x += (point.position.x - point.previousPosition.x) * 0.08;
    }
  }
}
