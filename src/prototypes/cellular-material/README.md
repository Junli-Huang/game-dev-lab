# 008 — Cellular Material Lab V0.1.2

120 × 80 discrete-material sandbox, fixed 30 Hz, bilingual controls and traces.
Route: `#/prototype/cellular-material`. **Implemented / pending review.**

## Surface Leveling

V0.1.1 stopped water oscillation by requiring a nearby lower opening. V0.1.2 adds
long-range surface equalization without pressure simulation:

Down → Diagonal → Nearby Drop → Long-range Surface Level Search → Stay.

Drop Search remains unchanged: inspect at most 6 continuous Air cells horizontally,
looking for Air immediately below, then move one cell toward the nearest opening.
Level Search runs only after those rules fail and only on Water with no Water above.
It inspects at most 24 columns, with vertical inspection also bounded to 24 rows.

Level Search follows water-column boundaries. Adjacent columns must have overlapping
Water intervals, preventing comparisons across disconnected pools. It can inspect
through Water at the same surface row, but cannot physically move through it: the
immediate destination must be Air. Solid material or a boundary terminates the
search. A dry bank can be a terminal target if its empty landing cell touches the
previous Water column; it never becomes a bridge through a solid barrier.

A target surface must be at least 2 rows lower. Surface means world-space top-row Y,
not water depth (different floor depths must not be mistaken for uneven surfaces).
Nearest qualifying target wins, then lower surface, then the existing deterministic
left/alternate tie-break. Movement swaps Water with adjacent Air exactly one cell;
normal updatedAt guards remain intact. No velocity, momentum, partial fill or RNG
is introduced. Sand, Fire and the teaching bug's scan/guard semantics are unchanged.

## Try the wide pool

Choose **Wide pool leveling**, pause, reset, enable Debug and inspect `(59, 54)`.
Step once: both nearby-drop searches fail, but Level Search finds surfaces 13 cells
away and 2 rows lower. The top unit moves one cell left on the first odd Tick.
Continue to watch it reach the lower region and settle. Reset preserves pause and
policy; use Alternate for this example. Under V0.1.1 every Water in this initial
fixture has no legal move. The new rule genuinely adds behavior beyond six cells.

Water Tank demonstrates the larger falling-water case. Empty, Sand Pile, Fire Test
and Mixed remain available. Brushes 1/2/4/8 paint square areas; dragging interpolates
strokes, holding paints each simulation tick, Air erases. Debug clicks inspect rather
than paint. Apply Seed commits the input and resets; language changes preserve state.

## Stable State and discrete surfaces

Not every cell needs to move every Tick. One cell holds one complete material unit,
so a surface difference of one cell is legitimate discrete balance. Tested wide
pools reach max/min column-height difference ≤ 1, then remain unchanged for 200
additional ticks with movedCells = 0. updatedAt still records evaluation ticks and
is not part of the material-grid stability comparison.

The rule is bounded and local: it does not guarantee global equilibrium for every
shape, long pipe or distant pool. Targets beyond 24 columns/rows remain invisible;
higher obstructing surfaces and non-overlapping water columns stop this search.
Complex pressure transfer, siphons, sealed-space pressure, distant water columns,
partial fill, Navier–Stokes, SPH, CFD and volume/pressure solvers are not modeled.

## Other material and execution rules

Sand tries down, diagonals, then stays. All movement enters Air only; no sand/water
exchange. Edges are solid. Wood is static. Fire decrements finite 30–90 Tick life,
expires to Air, and otherwise ignites orthogonal Wood with seeded probability 0.12.
Newly ignited Fire waits until the next Tick before acting.

Normal mode scans bottom-up and stamps both swapped cells. Bug mode deliberately
scans top-down AND bypasses the movement guard, showing multiple moves per Tick;
fire retains its guard. Top-down order alone with a guard is not this bug.
In-place updates see earlier changes. Double buffering would read old cells but
would additionally need destination-conflict resolution. All 9,600 cells are scanned.

movedCells counts successful swaps in the latest Tick, not distinct particles in
Bug mode. reactedCells counts ignitions plus expirations. The seeded integer LCG
and fixed order reproduce identical tick-indexed inputs; live mouse timing is not
a recorded replay. No chunks, sleeping cells, optimization or physics claims.

## Debug and code

Traces describe the last active evaluation at a fixed coordinate, possibly a prior
occupant. Current neighbors and updatedAt are separate from that historical trace.
Level traces show surface eligibility, source/target Y, height difference, distance,
dry-bank targets, nearest observed surfaces and the movement/Stay reason. A failed
search reports balanced-or-blocked within bounds, not an unsupported global-balance
claim. Higher-priority rules do not fabricate unexecuted Level Search results.

Read materials → world/random → movement/leveling/reactions → simulation → presets
→ renderer/prototype. Core modules are DOM-free.

## Validation and history

44 repository tests include the V0.1.1 stability regressions, proof that the wide
fixture has no old-rule move, new one-cell progression, conserved water, eventual
balance and another 200 stable Ticks, Drop priority, internal cells, barriers,
logical connectivity, bounded search and deterministic ties. Both Water Tank and
Wide pool presets settle after extended runs. Browser checks cover controls,
English/Chinese traces, reset, route lifecycle and mobile layout.

- V0.1: five materials, local movement, update-order experiments, seeded Fire, Debug.
- V0.1.1: nearby-drop horizontal movement eliminates periodic flat-floor oscillation.
- V0.1.2: long-range connected-surface equalization, then stable discrete balance.

V0.1.2 awaits review; not Accepted. V0.2 remains deferred.
