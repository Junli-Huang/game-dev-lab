# 006 — Rollback Netcode Lab · V0.1.1

Status: Prototype / Prototyped. Route: `#/prototype/rollback-netcode`.

## What It Demonstrates

Input Delay, Last Known Input Prediction, Input History, State History, Rollback,
Re-simulation and Deterministic Simulation. The page and all runtime labels support
English and Simplified Chinese without resetting the experiment on language changes.

- **Delay Based:** wait for each frame's actual remote input. Local input is sampled
  at the source frame and buffered, so player A visibly experiences input latency too.
- **Prediction:** run immediately with the most recent confirmed input at or before
  the simulated frame (idle when none exists). Check late arrivals but do not rewrite
  old states. Wrong motion can persist; the independent horizontal movements make the
  effect easy to inspect, though errors may also cancel during periodic motion.
- **Rollback:** when an arrival differs from the input used to simulate its frame,
  restore that frame's snapshot and replay saved inputs to the present. The previous
  current position becomes a 600 ms ghost when a position actually changes.

## One-minute Experiments

Use the A–D preset buttons, which reset the experiment and disable loss and jitter:

| Experiment | Settings | Expected result |
| --- | --- | --- |
| A | Rollback, 0 ms | No predictions or rollbacks |
| B | Delay, 200 ms | Initially wait; A input is buffered by about 12 ticks |
| C | Prediction, 200 ms | Continuous motion, original prediction mismatches, no state correction |
| D | Rollback, 200 ms | M / R / ↻ timeline markers, correction ghost and replay depth |
| E | Pause, then Step Tick | Frozen clocks between clicks; inspect input arrival and replay one tick at a time |

B–D use the fast B script for frequent transitions. Default B input is right 120,
idle 30, left 120, idle 30 frames. Fast mode uses 30 / 15 / 30 / 15. Forced left,
idle and right affect newly generated inputs only, never rewrite input history.
Player A accepts A / D, arrow keys and pointer buttons; simultaneous directions cancel.

## Core Loop and Clock Semantics

```text
Fixed source/network tick (60 Hz)
  → Sample local input + generate scripted remote input
  → Enqueue remote input in FakeNetwork
  → Receive due packets (including zero-delay packets)
  → Record truth and check original prediction
  → Earliest simulated-input mismatch? Restore + replay once for this packet batch
  → Delay: wait if next remote input is missing
    Prediction / Rollback: predict missing input from the last known past input
  → Simulate at most one NEW game frame
  → Save state and prune history
Render reads current state; replay never renders intermediate states
```

The input source/network clock keeps ticking when Delay simulation stalls, preventing
an input-delivery deadlock. At most one new game frame runs per tick, preserving the
Delay buffer rather than instantly catching up. Pause freezes network, simulation
and ghost age. **Step Tick advances one 1/60 s source/network tick**; Delay can advance zero
game frames if input is still missing. This necessary distinction is also in the UI.

`requestAnimationFrame` accumulates elapsed time; it never supplies a variable gameplay
delta. Long render gaps are capped at 250 ms; hidden tabs suspend progression without
catching up after return. Game simulation uses integer logical pixels, 2 px per tick,
clamped to x = 20…880. A and B occupy separate visual lanes and do not collide.

## History and Replay Invariants

- Frame IDs start at 0. `state.frame` / Current Frame is the **next frame to execute**.
- `stateHistory[N]` is the snapshot **before** frame N; `stateHistory[0]` is initial state.
- `rollbackFrom(N)` restores `stateHistory[N]`, executes N through Current Frame − 1,
  and rewrites snapshots N + 1 through Current Frame. Depth = Current Frame − N.
- Replay reads saved local inputs and already received real remote inputs; it recomputes
  missing predictions chronologically. A future packet must not predict an earlier frame,
  even if jitter delivered it first. Snapshot copying prevents mutable aliasing.
- The network RNG is seeded and outside simulation. Replay never samples the keyboard,
  generates remote inputs, advances the RNG or sends network packets.
- Keep at most 300 input records and 301 boundary snapshots. A single scalar retains
  the last confirmed input preceding the window. No unbounded event log or ghost list.
- A lost input can permanently block Delay. At 300 outstanding source frames it stops
  explicitly with “History buffer full”; Reset recovers. It never silently skips inputs.

## Debug Semantics

- **Contiguous confirmed frame:** largest frame for which every input from 0 has arrived;
  starts at −1, remains behind a permanent loss gap. Highest received frame is separate.
- **Missing Remote Inputs:** retained simulated frames still missing real input;
  not `currentFrame - confirmedFrame`, which would overcount with out-of-order delivery.
- **Prediction count / correct / wrong:** count each original prediction once; assess
  once on receipt. Replay does not inflate counters. Accuracy = correct / (correct + wrong),
  excluding unresolved or permanently lost inputs. Original mismatches remain visible as M.
- **Rollback trigger:** compare received input with the input most recently USED for that
  frame. After an earlier replay this can differ from the original prediction used for stats.
- Timeline displays the latest 32 simulated frames. C/P identifies confirmation, M the
  original mismatch, R any replay start, ↻ any re-simulated frame. Markers can coexist.
  R and ↻ are historical markers, not necessarily the latest event. The separate
  double underline / striped `last-rollback` range uses `lastRollback.from <= frame <=
  lastRollback.to`. The Last Rollback event panel shows from, to, depth and correction;
  before any event it displays —. Older history markers remain when this highlight moves.
  Select a frame to inspect original vs used input, generation/delivery times, and the
  latest saved pre-frame state. Selection remains until its history record expires.
- Simulation FPS measures new game frames per wall-clock second, excluding replay work.
- Ghost is render-only and lasts 600 ms of network time. Correction distance measures B's
  displacement immediately before/after the last replay, before the next new game frame.

## Why Rollback Exists / 为什么需要回滚

等待对方输入会把网络延迟变成操作延迟；预测让本地立即响应，但可能出错。
回滚恢复到错误输入发生前的状态，再使用历史输入重演。完整游戏的碰撞与命中
依赖整个过程，因此只修正当前位置不足以恢复正确结果。

相同状态 + 相同输入 → 相同结果。确定性模拟让历史能够可靠重演；输入历史保存
“执行什么”，状态历史保存“从哪里重新开始”。UI、语言、残影均不属于模拟状态。

## Code Reading Path

1. `simulation.ts`: pure fixed-step transition and copyable game state.
2. `remote-input-generator.ts`, `fake-network.ts`: scripted inputs and seeded delayed delivery.
3. `history.ts`: input records, pre-frame snapshots, bounded pruning.
4. `rollback.ts`: shared mode driver, late-input handling, `rollbackFrom`.
5. `prototype.ts`: lifecycle, accumulator, controls, pause/step/reset and input cleanup.
6. `renderer.ts`, `timeline.ts`, `stats.ts`: read-only visualization and inspection.
7. `../../i18n/rollback.ts`: typed English / Simplified Chinese copy.

## Limits

Fake network only. Not production netcode. No real P2P transport, server authority,
WebSocket/WebRTC, reliable transport, input redundancy, combat, physics engine,
interpolation, snapshot compression or replay-file system. One-way latency 0–500 ms,
jitter ±0–200 ms clamped to a nonnegative delay, independent packet loss 0–20%.
Packets already queued keep their delivery times after a parameter change. There is
no retransmission: loss is experimental and may leave permanent unconfirmed inputs.

Next versions may add combat (V0.2), determinism failures (V0.3), then real peers (V0.4).

## Validation

Run `npm test` for the DOM-free acceptance/regression tests, then `npm run build`.
Browser checks cover pause/step, timeline inspection, keyboard, language-state
preservation, mobile overflow and route cleanup.

## V0.1.1 — Network Tick vs Simulation Frame

**Network Tick = `generatedFrame`**, the number of executed source/network ticks,
starting at 0. It is not the latest generated frame ID (which is `generatedFrame - 1`).
**Simulation Frame = `state.frame`**, the next frame to simulate, also starting at 0.
Network/input time can advance while the simulation waits. Pause freezes both clocks.
In Delay with 200 ms latency, Step Tick can change (5, 0) → (6, 0), then (12, 0) → (13, 1).
If the history buffer is full, Step Tick is disabled until Reset.

## Speculative Depth

How far simulation has advanced beyond the contiguous confirmed remote-input frontier:

```text
speculativeDepth = max(0, state.frame - (confirmedFrame + 1))
```

For confirmedFrame = 120 and state.frame = 128, depth = 7 (frames 121…127).
It includes confirmed inputs beyond an earlier missing gap, since the contiguous
frontier has not passed that gap. With permanent loss, this depth can grow beyond
300 even after the old missing frame is pruned; it is not a count of retained records.
It is clamped to zero when the confirmed frontier is ahead of Delay simulation.

## Missing Remote Inputs

Number of retained, previously simulated frames whose real remote input has not arrived:

```text
frame < state.frame && remote === undefined
```

Limited to the 300-frame history window; excludes inputs buffered for unsimulated frames.
It can stay nonzero after packet loss. Unlike Speculative Depth, it counts missing
records only, not the whole span beyond a contiguous frontier. Both metrics are shown
separately; the ambiguous `predictedFrames` getter has been removed.

## Packet Loss Limitation

V0.1.1 implements no retransmission or input redundancy. A dropped input may remain
permanently unknown and stop the contiguous confirmed frame. Production rollback
netcode commonly combines rollback with redundant recent inputs, retransmission or
reliable transport. These are explanations only, not new transport mechanisms.

V0.1.1 changes naming, debug metrics, last-event visualization and explanatory copy.
Simulation, prediction, replay, history pruning, seeded network and ghosts are unchanged.
