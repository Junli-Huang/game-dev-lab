export interface Direction { x: number; y: number }

export interface FlowCell {
  x: number;
  y: number;
  walkable: boolean;
  movementCost: number;
  integrationCost: number;
  direction: Direction;
}
