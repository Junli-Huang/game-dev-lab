import type { Move } from './simulation';
export interface NetworkSettings { latency: number; jitter: number; loss: number }
export interface Packet { frame: number; move: Move; sentAt: number; arrivalAt: number }
export class FakeNetwork {
  queue: Packet[] = [];
  dropped = 0;
  private seed = 20260907;
  constructor(public settings: NetworkSettings) {}
  private random() {
    this.seed = (Math.imul(1664525, this.seed) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  send(frame: number, move: Move, now: number) {
    const lost = this.random() * 100 < this.settings.loss;
    const delay = Math.max(0, this.settings.latency + (this.random() * 2 - 1) * this.settings.jitter);
    if (lost) { this.dropped++; return; }
    this.queue.push({ frame, move, sentAt: now, arrivalAt: now + delay });
  }
  receive(now: number): Packet[] {
    const ready = this.queue.filter(p => p.arrivalAt <= now + 1e-7);
    this.queue = this.queue.filter(p => p.arrivalAt > now + 1e-7);
    return ready.sort((a, b) => a.arrivalAt - b.arrivalAt || a.frame - b.frame);
  }
}
