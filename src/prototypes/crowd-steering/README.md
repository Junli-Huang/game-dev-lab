# Crowd Steering Lab

## Purpose

This Prototype explains why Agents that share one Target do not have to collapse into one point. V0.1.1 combines two local movement behaviors:

~~~text
Seek
+ Separation
↓
Weighted, force-limited steering
~~~

## Seek

~~~text
desiredVelocity = normalize(target - position) * maxSpeed
seekSteering = desiredVelocity - currentVelocity
~~~

Seek adjusts the Agent's existing motion toward a desired velocity. It does not directly translate position along the target direction.

The small target stop radius is only a dead zone to prevent repeated target crossing. It is not Arrival because desired speed does not gradually decrease with distance.

## Separation

Every neighbor inside Neighbor Radius contributes a direction away from itself. Closer neighbors contribute more strongly.

The accumulated vector keeps its proximity-weighted magnitude: a distant neighbor produces a short Separation vector, while a close neighbor produces a longer one. Only the final weighted sum is limited by Max Force.

Separation is a steering force applied before overlap. It is not collision resolution and never directly pushes Agent positions apart.

## Weighted Steering

~~~text
steering = seek * seekWeight
         + separation * separationWeight

steering = clampMagnitude(steering, maxForce)
velocity += steering * dt
velocity = clampMagnitude(velocity, maxSpeed)
position += velocity * dt
~~~

Max Force limits how abruptly behaviors can redirect the current velocity. The weights expose the tradeoff between reaching the Target and preserving local space.

## Simulation Pipeline

~~~text
Pointer Input → Target / Selection
↓
Fixed 60 Hz Simulation
↓
Seek + Separation → Weighted Sum → Force / Speed Limits → Move
↓
Read-only Renderer
~~~

## Debug Views

- Velocity: current movement vector
- Seek: steering toward desired target velocity
- Separation: accumulated local avoidance steering
- Neighbor Radius: selected or hovered Agent plus recognized neighbors
- Final Steering: force-limited weighted sum
- Inspector: position, speed, neighbor count and steering magnitudes

## Recommended Experiments

1. Choose Seek Only, place the Target on the opposite side, and observe stacking.
2. Choose Balanced without changing the goal and observe local spacing.
3. Choose Strong Separation and observe local repulsion competing with target attraction.
4. Choose Crowded to make the O(N²) neighbor interaction easier to inspect.
5. Select one Agent, enable Show Separation, and watch its vector grow as neighbors crowd closer.

## Pathfinding vs Steering

~~~text
Pathfinding → Where should I go?
Steering    → How should I move right now?
~~~

A complete game may use A*, a NavMesh or a Flow Field to choose a route, then Seek the next waypoint while Separating from nearby units. V0.1 deliberately implements only a direct Target so the local Steering layer remains isolated.

## Current O(N²) Neighbor Search

V0.1 compares every Agent with every other Agent. At the supported 10–150 Agents this keeps the Separation rule explicit and readable. Spatial Hash, Quadtree and BVH are separate optimization topics and are not implemented here.

## Code Structure

- `agent.ts`: Agent and debug data
- `steering.ts`: pure Seek, Separation and vector math
- `simulation.ts`: Agent update, neighbor queries, Target and containment
- `renderer.ts`: read-only Canvas and debug visualization
- `prototype.ts`: pointer input, fixed loop, lifecycle and Inspector binding
- `index.ts`: controls, presets and teaching content

## Scope

V0.1 does not implement Arrival, Cohesion, Alignment, Flocking, Agent collision, obstacle avoidance, RVO/ORCA, formations, Flow Field integration or spatial partitioning.

## Next Experiments

- V0.2: Arrival, Cohesion and Alignment / Boids
- V0.3: Obstacle Avoidance
- V0.4: Velocity Obstacles, RVO and ORCA
