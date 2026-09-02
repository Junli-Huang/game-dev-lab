export interface Vector2 { x: number; y: number }

export interface VerletPoint {
  position: Vector2;
  previousPosition: Vector2;
  isPinned: boolean;
  isDragged: boolean;
}

export function createPoint(x: number, y: number, isPinned = false): VerletPoint {
  return {
    position: { x, y },
    previousPosition: { x, y },
    isPinned,
    isDragged: false,
  };
}
