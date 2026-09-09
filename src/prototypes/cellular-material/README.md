# 008 — Cellular Material Lab V0.1.1

Interactive 120 × 80 cellular sandbox, fixed 30 Hz simulation, bilingual UI.
Route: `#/prototype/cellular-material`.

## Experiments

Pause, choose Empty and brush 1, paint Sand, then Step Tick. One grain falls one
cell. Reset and repeat with Bug mode: the top-down scan deliberately bypasses the
movement guard, so the same grain can fall many rows in one tick. Top-down order
alone with a valid guard would not cause this repeated-update bug.

Water on a solid floor now stays still without a lower opening. Compare Always Left with
Alternate; the latter alternates both horizontal scan and neighbor preference by
tick parity, reducing systematic directional bias without promising perfect symmetry.
Fire Test demonstrates seeded orthogonal ignition and finite fire lifetime.

## Rules and state

Air is empty/eraser. Sand tries down, then diagonals. Water additionally searches up to six Air cells horizontally for a lower opening. Movement only swaps with Air; grid edges are solid. Wood
is static. Fire decrements life each tick, becomes Air at zero, otherwise tries
orthogonal Wood with probability 0.12. Initial fire life is 30–90 ticks. Newly
ignited Fire is stamped and does not actively update until the next tick.

The normal bottom-up in-place scan stamps `updatedAt` on moved particles and
both swapped locations. No material actively updates more than once per tick.
In-place updates let later cells observe earlier moves; a double buffer would
read the old grid but also need destination-conflict resolution. This prototype
intentionally exposes order dependence instead of hiding it.

`movedCells` counts successful swaps in the latest tick (not distinct particles
in Bug mode); `reactedCells` counts ignitions plus expirations. All 9,600 cells are
scanned each tick. No active chunks or performance claims.

Debug selects a coordinate instead of painting. It shows current material, last
update stamp, six current neighbors, and the last active rule evaluation at that
coordinate, including tick, source/destination, candidate occupancy and real fire
rolls. The stored trace may belong to a prior occupant. Last scan records actual
execution; next scan reflects current controls.

## Determinism and controls

Seeded integer LCG, fixed rule order and tick-based lateral choice reproduce the
same state for the same seed, initial grid and tick-indexed paint inputs. Wall-clock
mouse events are not a recorded replay. Reset restores the selected preset and
committed seed, preserving pause/mode/policy. Apply Seed commits the field and
resets. Language changes preserve the simulation. Pointer dragging interpolates
strokes; holding a pointer paints each simulation tick. Brushes are square 1/2/4/8.

## Code and validation

Read materials → world/random → movement/reactions → simulation → presets →
renderer/prototype. Simulation modules have no DOM dependency.

16 core tests cover movement/guard/bias, bug cascade, fire lifetime/seed/new-fire
guard, deterministic replay/reset, conservation, boundaries, painting and scan
history. Browser checks cover painting, Step, traces, bug mode, reset determinism,
language preservation, mobile layout and route cleanup. Full repository: 38 tests.

V0.2 is deferred: no pressure, sand/water exchange, temperature, water extinguishing,
chunks, GPU, save/load or Step Cell. Local rules produce piles, spreading and fire
fronts; they are a teaching model, not a physically complete material simulation.

## Water Horizontal Movement

Water does not move forever just because an adjacent cell is Air.
Down → Diagonal → Search nearby lower opening → Move one horizontal cell toward
it → Stay. Search is bounded by WATER_SPREAD_DISTANCE = 6 and stops at non-Air
or the boundary. An opening requires Air at the searched coordinate and directly
below it. Prefer the nearer drop; equal distances use Always Left or tick-parity
Alternate. Debug records both search distances (or No Drop), only when the search
actually ran. It does not label this decision as ordinary Left/Right free.

## Stable State

Cellular simulation does not require every cell to move every tick. A flat water
body with no lower opening legally stays still. The stable-state test compares
material grids through another 200 ticks and requires zero moves at each tick;
updatedAt remains an execution stamp and therefore still changes when evaluated.

## Why no Pressure?

V0.1.1 remains a Discrete Cellular Liquid, not Navier–Stokes, a Pressure Solver,
a Volume Field or Continuous Fluid Dynamics. It approximates gameplay liquids
with simple local rules. A drop beyond six cells or behind another material is
not visible to this search; full pressure/volume equalization is not promised.

## Version history

- V0.1: Air/Sand/Water/Wood/Fire, local movement, update order, seeded randomness and Debug.
- V0.1.1: fixes periodic horizontal Water oscillation. Horizontal movement seeks
  nearby lower openings and stays still without one. Implemented / pending review.
