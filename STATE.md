# Game Dev Lab — Project State

Last updated: 2026-09-08

This file is the compact current-state snapshot for ongoing planning and handoff. Detailed experiment notes remain in `docs/daily-game-dev-topics.md` and each prototype's own README.

## Current direction

- Keep prototypes small, interactive, and focused on one game-development technique at a time.
- Prefer H5 prototypes that make internal state and algorithm behavior directly observable.
- Do not expand a prototype into production engineering unless that complexity is itself the learning target.

## Prototype status

| ID | Prototype | Status | Current version / note |
| --- | --- | --- | --- |
| 001 | Verlet Rope | Prototyped | Existing lab prototype |
| 002 | Flow Field | Prototyped | Existing lab prototype |
| 003 | SDF Playground | Prototyped | Existing lab prototype |
| 004 | Crowd Steering | Prototyped | Existing lab prototype |
| 005 | Constraint Generation | Prototyped | Existing lab prototype |
| 006 | Rollback Netcode Lab | **Accepted / Stable prototype** | **V0.1.1 · 2026-09-08** |

## 006 — Rollback Netcode Lab

### Current status

**V0.1.1 is accepted.** No further V0.1.x polishing is currently planned.

Implemented and reviewed:

- Delay Based / Prediction / Rollback comparison.
- 60 Hz fixed-step simulation separated from rendering.
- Deterministic integer simulation state.
- Fake network with one-way latency, jitter / packet reordering, and experimental packet loss.
- Input History and pre-frame State History.
- Last-known-input prediction.
- Late-input mismatch detection.
- Restore + deterministic re-simulation to current state.
- Correction ghost and rollback statistics.
- Network Tick and Simulation Frame shown as separate clocks.
- Speculative Depth and Missing Remote Inputs shown as separate metrics.
- Timeline markers for Confirmed / Predicted / Mismatch / historical rollback / re-simulation.
- Separate Last Rollback Range and last-event panel.
- Explicit explanation that V0.1.1 has no retransmission or input redundancy.
- Core regression tests for deterministic oracle matching, Delay behavior, Prediction, Rollback, packet reordering, packet loss/history bounds, clock semantics, speculative depth, missing inputs, and last rollback range.

### Important semantics

```text
stateHistory[N]
= state before simulating frame N
```

```text
Network Tick
!=
Simulation Frame
```

Delay mode may advance the network/input clock while Simulation Frame remains blocked waiting for remote input.

```text
Speculative Depth
= max(0, Simulation Frame - (Contiguous Confirmed Frame + 1))
```

`Missing Remote Inputs` counts retained, already-simulated frames whose real remote input is still unknown. It is intentionally not the same metric as Speculative Depth.

Packet loss in the current prototype is permanent because retransmission / input redundancy / reliable delivery are intentionally outside the V0.1.1 scope.

### Review decision

**Accepted on 2026-09-08.**

The current implementation is considered sufficient for learning the real rollback chain:

```text
Remote input missing
→ Predict
→ Simulate and save history
→ Real input arrives late
→ Detect mismatch
→ Restore historical state
→ Re-simulate saved inputs
→ Correct current state
```

No core rewrite is required before future extension.

### Deferred next step

`V0.2 — Rollback Combat` is intentionally deferred for now.

When resumed, the intended learning target is a minimal combat case such as:

```text
Attack
→ Hitbox
→ Predicted Hit / Miss
→ Late remote input
→ Rollback
→ Hit result changes after re-simulation
```

Do **not** implement V0.2 until it is explicitly resumed.

## Source-of-truth documents

- Project/topic history: `docs/daily-game-dev-topics.md`
- Rollback implementation notes: `src/prototypes/rollback-netcode/README.md`
- Prototype architecture guidance: `docs/prototype-guide.md`
- Terminology: `docs/i18n-terminology.md`

## Immediate next action

No active development task is assigned to `006`.

Choose the next independent game-development technique for the lab, or resume a deferred prototype only when explicitly requested.
