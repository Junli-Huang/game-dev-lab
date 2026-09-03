# Constraint Generation Lab

## Purpose

This Prototype isolates the core loop behind tile-based Wave Function Collapse:

```text
Possible States
→ Local Collapse
→ Constraint Propagation
→ Reduced Possibilities
→ Repeat
```

It demonstrates why procedural generation is not the same as placing random Tiles independently.

## Tile Candidates

Every Cell begins with all four candidates:

```text
{ Water, Sand, Grass, Forest }
```

An uncollapsed Cell is therefore uncertain, not empty. A candidate set records every state that remains legal at that position.

## Compatibility Rules

The fixed V0.1 rules create a gradual adjacency chain:

```text
Water  → Water / Sand
Sand   → Water / Sand / Grass
Grass  → Sand / Grass / Forest
Forest → Grass / Forest
```

Rules are stored separately for Up, Right, Down and Left. This teaching set uses the same compatibility in all directions, while the data model remains ready to explain directional Tile sockets.

## Collapse

Collapse selects one candidate from a Cell and reduces its set to that single Tile:

```text
{ Grass, Sand, Forest } → { Sand }
```

The word does not mean physical collapse. It means resolving several possible states into one state.

## Entropy and Minimum Entropy

V0.1 uses candidate count as a simple teaching entropy metric:

```text
Entropy = remaining candidate count
```

The algorithm selects an unresolved Cell with minimum entropy because fewer candidates indicate stronger existing constraints. Ties and Tile choices are randomized by a reproducible seed. This heuristic reduces uncertainty but does not guarantee success.

## Propagation

After a candidate set changes, the Cell enters a FIFO queue. Processing it revises all four neighbors against directional compatibility rules. Every changed neighbor re-enters the queue because its smaller candidate set can invalidate candidates farther away.

Propagation continues until the queue is empty:

```text
A changes → B loses candidates → B is queued → C re-checks
```

This is the step that turns local rules into global structure. The approach is related to Constraint Satisfaction and Arc Consistency without introducing a general CSP framework.

## Contradiction

A Cell with zero candidates is a contradiction: no remaining state satisfies the current decisions. Auto Run stops and exposes the failure. V0.1 intentionally does not implement backtracking; restart with the same or a new seed instead.

## Simulation Pipeline

```text
Initialize all Cells with every candidate
→ Choose a minimum-entropy Cell
→ Collapse one candidate
→ Propagate until the queue is empty
→ Repeat until complete or contradictory
```

`Collapse Step` performs only the decision and seeds the queue. `Propagation Step` processes one queued Cell. `Auto Run` chooses the appropriate next action until generation ends.

## Debug Views

- Entropy displays the remaining candidate count and is enabled by default.
- Candidates displays the surviving Tile abbreviations.
- White highlights the propagation Cell currently being processed.
- Gold highlights candidate sets changed by the last step.
- The Queue panel shows pending Cells in FIFO order.

Rendering reads Simulation state and never changes candidates.

## Recommended Experiments

1. Restart and use Collapse Step to see one Cell change from four candidates to one.
2. Use Propagation Step repeatedly and watch neighbors lose candidates while the queue changes.
3. Restart and use Auto Run to observe Collapse and Propagation alternate.
4. Restart with the same seed to replay the same random decision sequence.

## Pure Random vs Constraint Generation

Pure random placement chooses every Cell independently, so incompatible Tiles can touch. Constraint generation makes every choice affect the legal states of its neighbors. Random choice remains, but it operates only inside the current valid candidate set.

## Code Structure

- `tiles.ts`: Tile definitions and four directions
- `constraints.ts`: compatibility data and pure candidate revision
- `grid.ts`: Cell candidates and Grid storage
- `simulation.ts`: minimum-entropy collapse, FIFO propagation and phases
- `renderer.ts`: read-only Grid visualization
- `prototype.ts`: Auto Run timing and lifecycle
- `index.ts`: controls and teaching content

## Scope

V0.1 does not include backtracking, weighted randomness, Shannon entropy, Tile frequency, biomes, overlapping WFC, pattern learning, image input, large maps, 3D generation or a rule editor.

## Next Experiments

- V0.2: weighted Tile frequency, weighted choice and Shannon-style entropy
- V0.3: contradiction recovery through backtracking
- V0.4: overlapping WFC or pattern extraction
