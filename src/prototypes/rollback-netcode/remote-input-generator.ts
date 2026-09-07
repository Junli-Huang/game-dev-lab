import type { Move } from './simulation';
export type RemotePattern = 'cycle' | 'fast' | 'left' | 'idle' | 'right';
export function remoteInput(frame: number, pattern: RemotePattern): Move {
  if (pattern === 'left') return -1;
  if (pattern === 'right') return 1;
  if (pattern === 'idle') return 0;
  const travel = pattern === 'fast' ? 30 : 120;
  const rest = pattern === 'fast' ? 15 : 30;
  const phase = frame % (2 * (travel + rest));
  return phase < travel ? 1 : phase < travel + rest ? 0 : phase < 2 * travel + rest ? -1 : 0;
}
