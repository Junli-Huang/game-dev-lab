import type { ActionId } from '../actions';
import type { WorldKey } from '../world-state';
export type NodeStatus = 'success' | 'failure' | 'running' | 'not-evaluated';
export type EvaluatedStatus = Exclude<NodeStatus, 'not-evaluated'>;
export type Node =
  | { id: string; type: 'selector' | 'sequence'; children: readonly Node[] }
  | { id: string; type: 'condition'; field: WorldKey; operator: '<=' | '>=' | '=='; threshold: number }
  | { id: string; type: 'action'; action: ActionId };
export interface NodeDebugState {
  node: Node; depth: number; status: NodeStatus; order?: number;
  condition?: { input: number; threshold: number; operator: '<=' | '>=' | '==' };
}
export interface BehaviorDecisionResult {
  selectedAction?: ActionId;
  nodeStates: NodeDebugState[];
  path: string[];
  status: EvaluatedStatus;
}
