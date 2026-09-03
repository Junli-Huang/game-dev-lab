export interface Vector2 {
  x: number;
  y: number;
}

export interface AgentDebugState {
  desiredVelocity: Vector2;
  seek: Vector2;
  separation: Vector2;
  finalSteering: Vector2;
  neighborCount: number;
}

export interface SteeringAgent {
  id: number;
  position: Vector2;
  velocity: Vector2;
  radius: number;
  debug: AgentDebugState;
}

export function createAgent(id: number, position: Vector2): SteeringAgent {
  return {
    id,
    position,
    velocity: { x: 0, y: 0 },
    radius: 5,
    debug: {
      desiredVelocity: { x: 0, y: 0 },
      seek: { x: 0, y: 0 },
      separation: { x: 0, y: 0 },
      finalSteering: { x: 0, y: 0 },
      neighborCount: 0,
    },
  };
}
