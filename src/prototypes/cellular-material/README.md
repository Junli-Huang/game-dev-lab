# 008 — Cellular Material Lab V0.1

Interactive 120 × 80 cellular sandbox, fixed 30 Hz simulation, bilingual UI.
Route: `#/prototype/cellular-material`.

## Experiments

Pause, choose Empty and brush 1, paint Sand, then Step Tick. One grain falls one
cell. Reset and repeat with Bug mode: the top-down scan deliberately bypasses the
movement guard, so the same grain can fall many rows in one tick. Top-down order
alone with a valid guard would not cause this repeated-update bug.

Water on a solid floor tests horizontal movement. Compare Always Left with
Alternate; the latter alternates both horizontal scan and neighbor preference by
tick parity, reducing systematic directional bias without promising perfect symmetry.
Fire Test demonstrates seeded orthogonal ignition and finite fire lifetime.

## Rules and state

Air is empty/eraser. Sand tries down, then diagonals. Water additionally tries
horizontal neighbors. Movement only swaps with Air; grid edges are solid. Wood
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

12 core tests cover movement/guard/bias, bug cascade, fire lifetime/seed/new-fire
guard, deterministic replay/reset, conservation, boundaries, painting and scan
history. Browser checks cover painting, Step, traces, bug mode, reset determinism,
language preservation, mobile layout and route cleanup. Full repository: 34 tests.

V0.2 is deferred: no pressure, sand/water exchange, temperature, water extinguishing,
chunks, GPU, save/load or Step Cell. Local rules produce piles, spreading and fire
fronts; they are a teaching model, not a physically complete material simulation.
