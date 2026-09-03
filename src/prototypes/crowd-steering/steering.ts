import type { SteeringAgent, Vector2 } from "./agent";

export function magnitude(vector: Vector2) {
  return Math.hypot(vector.x, vector.y);
}

export function clampMagnitude(vector: Vector2, maximum: number): Vector2 {
  const length = magnitude(vector);
  if (length <= maximum || length < 0.0001) {
    return { ...vector };
  }
  const scale = maximum / length;
  return { x: vector.x * scale, y: vector.y * scale };
}

export function calculateSeek(
  position: Vector2,
  velocity: Vector2,
  target: Vector2,
  maxSpeed: number,
) {
  const offsetX = target.x - position.x;
  const offsetY = target.y - position.y;
  const distance = Math.hypot(offsetX, offsetY);

  // Seek changes the current motion toward a desired velocity. It is not the
  // same as directly translating the Agent along the target direction.
  // The small stop radius prevents endless target crossing. It is only a dead
  // zone, not Arrival: desired speed does not gradually decrease with distance.
  const desiredVelocity = distance < 6
    ? { x: 0, y: 0 }
    : { x: offsetX / distance * maxSpeed, y: offsetY / distance * maxSpeed };

  return {
    desiredVelocity,
    steering: {
      x: desiredVelocity.x - velocity.x,
      y: desiredVelocity.y - velocity.y,
    },
  };
}

export function calculateSeparation(
  agent: SteeringAgent,
  agents: readonly SteeringAgent[],
  neighborRadius: number,
  maxSpeed: number,
) {
  let awayX = 0;
  let awayY = 0;
  let neighborCount = 0;

  // V0.1 deliberately uses an O(N²) query so the local steering rule remains
  // visible. Spatial hashing is a separate optimization topic.
  for (const neighbor of agents) {
    if (neighbor.id === agent.id) {
      continue;
    }
    const deltaX = agent.position.x - neighbor.position.x;
    const deltaY = agent.position.y - neighbor.position.y;
    const distance = Math.hypot(deltaX, deltaY);
    if (distance >= neighborRadius || distance < 0.0001) {
      continue;
    }
    const proximity = 1 - distance / neighborRadius;
    awayX += deltaX / distance * proximity;
    awayY += deltaY / distance * proximity;
    neighborCount += 1;
  }

  const awayLength = Math.hypot(awayX, awayY);
  if (neighborCount === 0 || awayLength < 0.0001) {
    return { steering: { x: 0, y: 0 }, neighborCount };
  }

  // Preserve the accumulated proximity magnitude so distant neighbors create
  // weak steering and close neighbors create strong steering. Normalizing here
  // would erase the distance weighting before behavior weights are combined.
  return {
    steering: {
      x: awayX * maxSpeed,
      y: awayY * maxSpeed,
    },
    neighborCount,
  };
}
