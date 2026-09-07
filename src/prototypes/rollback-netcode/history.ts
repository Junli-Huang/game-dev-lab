import type { GameState, Move } from './simulation';
export interface FrameInput {
  frame: number;
  local: Move;
  remote?: Move;
  usedRemote?: Move;
  initialPrediction?: Move;
  predictionChecked?: boolean;
  mismatch?: boolean;
  rollbackStart?: boolean;
  resimulated?: boolean;
  generatedAt: number;
  arrivedAt?: number;
}
export class History {
  inputs = new Map<number, FrameInput>();
  // stateHistory[N] is the state BEFORE simulating frame N.
  states = new Map<number, GameState>();
  remoteBeforeWindow: Move = 0;
  prune(before: number) {
    for (const [frame, input] of this.inputs) if (frame < before) {
      if (input.remote !== undefined) this.remoteBeforeWindow = input.remote;
      this.inputs.delete(frame);
    }
    for (const frame of this.states.keys()) if (frame < before) this.states.delete(frame);
  }
  lastKnownBefore(frame: number): Move {
    let value = this.remoteBeforeWindow;
    for (const [f, input] of this.inputs) {
      if (f >= frame) break;
      if (input.remote !== undefined) value = input.remote;
    }
    return value;
  }
}
