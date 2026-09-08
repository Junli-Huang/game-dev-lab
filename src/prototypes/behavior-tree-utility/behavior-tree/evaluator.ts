import type { WorldState } from '../world-state';
import type { ActionId } from '../actions';
import type { Node, NodeDebugState, BehaviorDecisionResult, EvaluatedStatus } from './nodes';
import { BT_TREE } from './tree';
export function evaluateBehavior(state: Readonly<WorldState>, root: Node = BT_TREE,
  actionStatus: (action: ActionId) => EvaluatedStatus = () => 'success'): BehaviorDecisionResult {
  const nodeStates: NodeDebugState[] = [];
  const byId = new Map<string, NodeDebugState>();
  const collect = (node: Node, depth: number) => {
    const debug: NodeDebugState = { node, depth, status: 'not-evaluated' };
    nodeStates.push(debug); byId.set(node.id, debug);
    if ('children' in node) node.children.forEach(child => collect(child, depth + 1));
  };
  collect(root, 0);
  let selectedAction: ActionId | undefined;
  let path: string[] = [], order = 0;
  const visit = (node: Node, ancestors: string[]): EvaluatedStatus => {
    const debug = byId.get(node.id)!;
    debug.order = ++order;
    const currentPath = [...ancestors, node.id];
    let result: EvaluatedStatus;
    if (node.type === 'condition') {
      const input = state[node.field];
      debug.condition = { input, threshold: node.threshold, operator: node.operator };
      const passed = node.operator === '<=' ? input <= node.threshold : node.operator === '>=' ? input >= node.threshold : input === node.threshold;
      result = passed ? 'success' : 'failure';
    } else if (node.type === 'action') {
      result = actionStatus(node.action);
      if (result !== 'failure') { selectedAction = node.action; path = currentPath; }
    } else {
      result = node.type === 'selector' ? 'failure' : 'success';
      for (const child of node.children) {
        const status = visit(child, currentPath);
        if (node.type === 'selector' ? status !== 'failure' : status !== 'success') { result = status; break; }
      }
    }
    debug.status = result;
    return result;
  };
  const status = visit(root, []);
  return { selectedAction, nodeStates, path, status };
}
