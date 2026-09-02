# Flow Field Pathfinding

## What You Are Seeing
One target builds a shared navigation field. Hundreds of agents query only the direction stored in their current grid cell.

## Core Idea
Cost describes entering a cell, Integration describes total cost to the target, and Direction chooses the neighboring step with the lowest edge cost plus remaining integration cost.

The Integration Field is built backward from the Target so one expansion computes the remaining cost for every reachable cell. All agents sharing that target can then reuse the same result.

## Minimal Algorithm
Run Dijkstra backward from the target, derive a direction from each cell's cheapest neighbor, then move each agent along its local direction.

## Implementation
A 36×24 grid uses eight neighbors, straight cost 1, diagonal cost √2, and no diagonal corner cutting. Editing obstacles or the target rebuilds the field. Agents use a fixed 60 Hz step.

V0.1 has no local avoidance, steering, or agent collision. Agents follow the direction of their current cell and may overlap or behave poorly near cell boundaries.

## Terrain Cost
Normal cells cost 1 to enter. Mud cells cost 4.

The integration field accumulates traversal cost rather than geometric distance, so agents may choose a longer but cheaper route. Mud changes pathfinding preference only; it does not reduce actual agent speed.

## Code Structure
- `cell.ts`: field state
- `grid.ts`: coordinates and neighbors
- `flow-field.ts`: integration and direction generation
- `agent.ts`: agent data
- `simulation.ts`: movement and rebuilds
- `renderer.ts`: map and debug overlays
- `prototype.ts`: fixed loop and pointer input

## Parameters to Play With
Agent count, speed, target, obstacles, and Cost/Integration/Direction views. Move the target one cell at a time with WASD or Arrow Keys. Spawn mode treats a held pointer as input intent and creates agents at 30 per second during fixed updates.

## Common Alternatives
A*, Dijkstra, NavMesh, hierarchical A*, and steering.

## Where Games Use This
RTS, tower defense, zombie hordes, crowds, and mass enemy AI.

## Next Experiments
Terrain weights, dynamic obstacles, multiple targets, separation, local avoidance, hierarchical fields, and incremental rebuild.
