# SDF Playground

## What You Are Seeing
WebGL2 evaluates an analytic signed-distance function for every pixel. Negative values are inside, zero is the boundary, and positive values are outside.

## Core Idea
An SDF is a function from position to signed boundary distance. Distance data can directly produce fill, outlines, glow, soft edges, contours, and boolean shape operations.

The same CPU math can also answer gameplay questions: whether a Player is inside a spell, how far it is from a collision surface, or how deep it penetrates.

## Minimal Algorithm
Evaluate Circle and Box distance, combine them with min/max/smooth-min, then classify or shade the resulting distance.

## Implementation
The fragment shader performs actual rendering-time SDF evaluation in centered, aspect-correct coordinates. A matching CPU copy exists only for the interactive Probe.

## Code Structure
- `sdf.ts`: CPU formulas and probe evaluation
- `shader.ts`: readable GLSL and compilation
- `state.ts`: positions and parameters
- `renderer.ts`: WebGL program and uniform upload
- `prototype.ts`: dragging, probe and lifecycle
- `index.ts`: controls and teaching content

## Parameters to Play With
Circle radius, Box half-size, outline, glow, edge softness, Smooth Union blend, operation, and debug view.

## Application Modes
- Playground: primitives, booleans, and raw distance
- UI Outline: fill, outline, glow, and soft scalable edges
- Spell Area: inside test and center falloff at a draggable Player point
- Metaball: hard Union versus Smooth Union
- Collision Probe: signed surface distance and penetration depth

## Common Alternatives
Traditional geometry, vector paths, texture/alpha masks, SDF, and MSDF.

## Where Games Use This
UI, text, masks, icons, glow, soft shadows, VFX, collision queries, and ray-marched scenes.

## Next Experiments
Rounded Box, Capsule, transforms, repetition, shells, smooth subtraction, metaballs, Text SDF/MSDF, and 3D ray marching.
