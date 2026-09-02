# Verlet Rope

## What You Are Seeing
A chain of position-based points connected by fixed-distance constraints, not rigid bodies and joints.

## Core Idea
`position - previousPosition` represents implicit velocity. Repeated correction of neighboring distances makes many simple rules behave like a rope.

## Minimal Algorithm
Infer velocity from two positions, integrate acceleration, then repeatedly correct every segment toward its target length.

## Implementation
Rendering accumulates real time into fixed 1/120-second physics steps. Each step integrates free points, performs N constraint passes with positional ground projection, and applies ground damping once so iteration count does not alter friction.

## Code Structure
- `verlet-point.ts`: point data
- `constraint.ts`: distance correction
- `simulation.ts`: integration, iterations and collision
- `renderer.ts`: rope and debug drawing
- `prototype.ts`: pointer interaction and lifecycle
- `index.ts`: controls and teaching page

## Parameters to Play With
Gravity, point count, segment length and constraint iterations. Compare one iteration with ten after dragging the rope sideways.

## Common Alternatives
Rigid bodies and joints, spring–mass systems, PBD and XPBD.

## Where Games Use This
Ropes, chains, cables, hair, tentacles, cloth, webs and simple soft bodies.

## Next Experiments
Multiple pins, cutting, circle collision, weights, wind, self-collision, cloth and XPBD.
