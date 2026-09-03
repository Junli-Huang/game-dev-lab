# Verlet Rope / PBD Constraint Lab

## Purpose

This prototype uses a particle-chain rope to show how two stages cooperate:

~~~text
Verlet Integration
→ predicts particle positions

PBD-style Constraint Solver
→ corrects positions that violate constraints
~~~

Verlet and PBD are not presented as competing algorithms. Verlet supplies the predicted motion; position-based constraints make the result satisfy rope length, pins, kinematic dragging and ground collision.

## Simulation Pipeline

~~~text
Fixed 1/120-second step
↓
Integrate free particles
↓
Apply distance, controlled-point and collision constraints
↓
Repeat constraint pass N times
↓
Apply ground velocity response once
↓
Render read-only state
~~~

## Verlet Integration

~~~text
motion = position - previousPosition
previousPosition = position
position += motion + acceleration * dt²
~~~

position - previousPosition is the displacement that encodes velocity in the fixed-step simulation. The implementation stores no explicit velocity.

## Position-Based Distance Constraint

For each neighboring pair, the solver compares the current length with the rest length and directly corrects particle positions. Two dynamic particles share the correction. If one endpoint is pinned or temporarily controlled by dragging, the free endpoint takes the entire correction.

Correcting one segment can disturb an adjacent segment, so the full chain is solved repeatedly. In classic PBD, more iterations generally reduce remaining constraint error and visually resemble greater stiffness. Iteration count is not itself a physical material-stiffness parameter.

## Constraint Experiment

Available iteration counts:

~~~text
1  2  4  8  16  32
~~~

The live panel reports:

~~~text
Average Constraint Error
Maximum Constraint Error
~~~

Each segment error is:

~~~text
abs(currentLength - restLength)
~~~

The presets provide intentionally instructional, rather than real-world, parameters:

- Loose Solver: 1 iteration, normal gravity
- Normal Rope: 8 iterations, normal gravity
- Tight Solver: 32 iterations, normal gravity
- Heavy Gravity: 4 iterations, increased gravity

Pause and Frame Step advance one complete physics step for controlled observation.

## Solver Step and Physics Step Phases

V0.2.1 exposes the stages inside one fixed physics step:

~~~text
Ready
↓ Solver Step
Predicted — Verlet Integration has run, constraints have not
↓ Solver Step
Solving 1 / N
↓ Solver Step
Solving 2 / N
...
↓ Solver Step
Complete N / N — one-time ground response has run
~~~

The first Solver Step begins a new frame and performs only position prediction. Every later click executes exactly one shared constraint pass. After the final pass, the simulation applies the per-frame ground damping once and marks the step complete.

Frame Step still means one complete physics step. If a partial step already exists, it finishes the remaining passes without integrating a second time. Resume also completes a partial step before returning to the realtime fixed loop.

Changing a parameter or preset during a partial teaching step resets the rope to the Ready phase, avoiding ambiguous states such as changing from pass 3/8 to 3/32.

## Constraint Convergence

The current-step history records the real average error at Prediction and after every constraint pass:

~~~text
Pred  8.42
1     4.51
2     2.73
3     1.62
~~~

Values are not modified to appear monotonic. A Gauss-Seidel-style local correction can disturb neighboring constraints even while the chain generally converges.

## Debug Views

- Particles: current particle positions
- Constraints: segment lengths
- Previous Position: the hidden Verlet state, visualized at 5× scale
- Velocity: enlarged fixed-step displacement, capped at 50 px
- Constraint Error: a colored overlay plus sampled per-segment error labels

All debug rendering is read-only and does not change simulation state.

## Input Ownership

Pointer events update only a drag target. During fixed simulation the dragged particle becomes temporarily kinematic: integration skips it and every constraint pass treats it as controlled. On release, current and previous positions are aligned to encode zero release velocity.

## Code Structure

- verlet-point.ts: particle state
- constraint.ts: distance correction
- simulation.ts: integration, constraint passes, collision and error metrics
- renderer.ts: rope and read-only debug overlays
- prototype.ts: pointer interaction, fixed timestep, pause, frame stepping and solver stepping
- index.ts: controls, presets and teaching content

## Scope

V0.2.1 remains a rope/particle-chain experiment. It intentionally does not add XPBD, bending constraints, cloth, soft bodies, fluids, ragdolls or a general-purpose constraint framework.

## Next Experiments

- V0.3: bending constraints for hair, tails, tentacles and vines
- V0.4: classic PBD versus XPBD, focusing on compliance, timestep and iteration dependence
