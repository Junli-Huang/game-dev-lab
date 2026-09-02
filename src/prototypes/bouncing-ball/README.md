# Bouncing Ball

## What You Are Seeing
A ball accelerated by gravity and constrained by a floor.

## Core Idea
Acceleration changes velocity; velocity changes position; collision response redirects motion.

## Minimal Algorithm
Update velocity and position, then resolve ground penetration and reflect vertical velocity.

## Implementation
Canvas 2D with semi-implicit Euler integration and restitution.

## Code Structure
- `index.ts`: page and controls
- `prototype.ts`: simulation and rendering
- `metadata.ts`: registry data

## Parameters to Play With
Gravity and the velocity-vector debug view.

## Common Alternatives
Fixed timesteps, Verlet integration, and full rigid-body physics engines.

## Where Games Use This
Platformers, projectiles, particles and dynamic props.

## Next Experiments
Air drag, multiple balls and fixed-timestep simulation.
