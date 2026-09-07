export type Move = -1 | 0 | 1;
export interface GameState { frame: number; playerA: { x: number }; playerB: { x: number } }
export const HZ = 60;
export const DT_MS = 1000 / HZ;
export const HISTORY_LIMIT = 300;
export const ARENA_WIDTH = 900;
export const initialState = (): GameState => ({ frame: 0, playerA: { x: 230 }, playerB: { x: 480 } });
export const copyState = (s: GameState): GameState => ({ frame: s.frame, playerA: { ...s.playerA }, playerB: { ...s.playerB } });
// Integer logical pixels; state.frame is the NEXT frame to simulate.
export function simulate(state: GameState, local: Move, remote: Move): GameState {
  const move = (x: number, input: Move) => Math.max(20, Math.min(ARENA_WIDTH - 20, x + input * 2));
  return { frame: state.frame + 1, playerA: { x: move(state.playerA.x, local) }, playerB: { x: move(state.playerB.x, remote) } };
}
