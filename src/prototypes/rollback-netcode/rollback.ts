import { copyState, DT_MS, HISTORY_LIMIT, initialState, simulate, type GameState, type Move } from './simulation';
import { FakeNetwork, type NetworkSettings } from './fake-network';
import { History } from './history';
import { remoteInput, type RemotePattern } from './remote-input-generator';
export type Mode = 'delay' | 'prediction' | 'rollback';
export interface LabSettings extends NetworkSettings { mode: Mode; pattern: RemotePattern }
export const defaultSettings = (): LabSettings => ({ mode: 'rollback', pattern: 'cycle', latency: 150, jitter: 0, loss: 0 });
export class RollbackLab {
  state = initialState();
  history = new History();
  network: FakeNetwork;
  generatedFrame = 0;
  confirmedFrame = -1;
  latestArrivalFrame = -1;
  now = 0;
  waiting = false;
  overflow = false;
  stats = { predictions: 0, correct: 0, wrong: 0, rollbacks: 0, lastDepth: 0, maxDepth: 0, correction: 0 };
  ghost?: { state: GameState; expiresAt: number };
  lastRollback?: { from: number; to: number };
  constructor(public settings: LabSettings) {
    this.network = new FakeNetwork(settings);
    this.history.states.set(0, copyState(this.state));
  }
  get missingRemoteInputs() {
    return [...this.history.inputs.values()].filter(i => i.frame < this.state.frame && i.remote === undefined).length;
  }
  get speculativeDepth() {
    return Math.max(0, this.state.frame - (this.confirmedFrame + 1));
  }
  // One source/network tick. Delay mode may advance zero game frames while waiting.
  tick(local: Move) {
    if (this.overflow) return;
    if (this.generatedFrame - this.state.frame >= HISTORY_LIMIT) { this.overflow = true; return; }
    const frame = this.generatedFrame++;
    this.now = frame * DT_MS;
    this.history.inputs.set(frame, { frame, local, generatedAt: this.now });
    this.network.send(frame, remoteInput(frame, this.settings.pattern), this.now);
    let earliest = Infinity;
    for (const packet of this.network.receive(this.now)) {
      const input = this.history.inputs.get(packet.frame);
      if (!input) continue;
      input.remote = packet.move;
      input.arrivedAt = this.now;
      this.latestArrivalFrame = Math.max(this.latestArrivalFrame, packet.frame);
      if (input.initialPrediction !== undefined && !input.predictionChecked) {
        input.predictionChecked = true;
        input.mismatch = input.initialPrediction !== packet.move;
        if (input.mismatch) this.stats.wrong++; else this.stats.correct++;
      }
      if (input.usedRemote !== undefined && input.usedRemote !== packet.move) earliest = Math.min(earliest, packet.frame);
    }
    while (this.history.inputs.get(this.confirmedFrame + 1)?.remote !== undefined) this.confirmedFrame++;
    if (this.settings.mode === 'rollback' && earliest < this.state.frame) this.rollbackFrom(earliest);
    this.waiting = false;
    // At most one new game frame per tick: Delay retains observable input latency.
    const input = this.history.inputs.get(this.state.frame)!;
    if (this.settings.mode === 'delay' && input.remote === undefined) this.waiting = true;
    else {
      const resolved = input.remote ?? this.history.lastKnownBefore(input.frame);
      if (input.remote === undefined) { input.initialPrediction = resolved; this.stats.predictions++; }
      input.usedRemote = resolved;
      this.state = simulate(this.state, input.local, resolved);
      this.history.states.set(this.state.frame, copyState(this.state));
    }
    this.history.prune(Math.max(0, this.generatedFrame - HISTORY_LIMIT));
    if (this.ghost && this.now >= this.ghost.expiresAt) this.ghost = undefined;
  }
  rollbackFrom(frame: number) {
    const saved = this.history.states.get(frame);
    if (!saved) { this.overflow = true; return; }
    const before = copyState(this.state);
    const currentFrame = this.state.frame;
    let known = this.history.lastKnownBefore(frame);
    this.state = copyState(saved);
    for (let f = frame; f < currentFrame; f++) {
      const input = this.history.inputs.get(f)!;
      if (input.remote !== undefined) known = input.remote;
      input.usedRemote = input.remote ?? known;
      input.resimulated = true;
      if (f === frame) input.rollbackStart = true;
      this.state = simulate(this.state, input.local, input.usedRemote);
      this.history.states.set(f + 1, copyState(this.state));
    }
    const depth = currentFrame - frame;
    this.stats.rollbacks++;
    this.stats.lastDepth = depth;
    this.stats.maxDepth = Math.max(this.stats.maxDepth, depth);
    this.stats.correction = Math.abs(this.state.playerB.x - before.playerB.x);
    this.lastRollback = { from: frame, to: currentFrame - 1 };
    if (this.stats.correction) this.ghost = { state: before, expiresAt: this.now + 600 };
  }
}
