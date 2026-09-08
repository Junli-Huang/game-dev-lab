import { t } from '../../i18n';
import type { MessageKey } from '../../i18n/en';
import type { ActionId } from './actions';
import type { Node, BehaviorDecisionResult, NodeStatus } from './behavior-tree/nodes';
import type { UtilityDecisionResult, UtilityActionResult } from './utility-ai/scoring';
export const msg = (key: string) => t(key as MessageKey);
export const actionLabel = (id?: ActionId) => id ? msg(`ai.action.${id}`) : '—';
const nodeLabel = (node: Node) => node.type === 'action' ? actionLabel(node.action) : msg(`ai.node.${node.id}`);
const symbol: Record<NodeStatus, string> = { success: '✓', failure: '✕', running: '▶', 'not-evaluated': '·' };
const score = (value: number) => value.toFixed(2);
const product = (item: UtilityActionResult) => `${score(item.baseScore)} × ${item.considerations.map(c => score(c.score)).join(' × ')} ≈ ${score(item.finalScore)}`;
export function renderDecisions(root: HTMLElement, bt: BehaviorDecisionResult, utility: UtilityDecisionResult) {
  const q = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!;
  const same = bt.selectedAction === utility.selectedAction;
  q('ai-outcome').textContent = `${msg(same ? 'ai.agree' : 'ai.diverge')}: ${actionLabel(bt.selectedAction)} / ${actionLabel(utility.selectedAction)}`;
  q('ai-outcome').classList.toggle('different', !same);
  q('ai-bt-choice').textContent = actionLabel(bt.selectedAction);
  q('ai-utility-choice').textContent = actionLabel(utility.selectedAction);
  q('ai-tree').innerHTML = bt.nodeStates.map(({ node, depth, status, order, condition }) => {
    const selected = node.type === 'action' && node.action === bt.selectedAction && status !== 'not-evaluated';
    const comparison = node.type === 'condition' ? `${msg(`ai.${node.field}`)} ${condition ? `(${condition.input}) ` : ''}${node.operator} ${node.threshold}` : '';
    return `<li class="ai-node ${status} ${selected ? 'selected' : ''}" data-node="${node.id}" data-status="${status}" style="--depth:${depth}">
      <span class="ai-order">${order ?? '·'}</span><span class="ai-node-copy"><strong>${nodeLabel(node)}${selected ? ' ←' : ''}</strong><small>${comparison || msg(`ai.type.${node.type}`)}</small></span>
      <span class="ai-node-status">${symbol[status]} ${msg(`ai.status.${status}`)}</span></li>`;
  }).join('');
  const nodes = new Map(bt.nodeStates.map(d => [d.node.id, d.node]));
  q('ai-path').textContent = bt.path.map(id => nodeLabel(nodes.get(id)!)).join(' → ');
  const list = q('ai-scores');
  const initialized = list.childElementCount > 0;
  const expanded = new Set([...list.querySelectorAll<HTMLDetailsElement>('details[open]')].map(d => d.dataset.action));
  // Sort a copy: original action definition order remains the tie-break policy.
  list.innerHTML = [...utility.actions].sort((a, b) => b.finalScore - a.finalScore).map(item => {
    const selected = item.action === utility.selectedAction;
    return `<details data-action="${item.action}" class="ai-score ${selected ? 'selected' : ''}" ${expanded.has(item.action) || (!initialized && selected) ? 'open' : ''}>
      <summary><span><strong>${actionLabel(item.action)}</strong>${selected ? `<small> ← ${msg('ai.selected')}</small>` : ''}</span><b>${score(item.finalScore)}</b><span class="ai-score-track" aria-hidden="true"><i style="width:${item.finalScore * 100}%"></i></span></summary>
      <div class="ai-factors"><p>${msg('ai.base')}: <b>${score(item.baseScore)}</b></p>
      <table><thead><tr><th>${msg('ai.consideration')}</th><th>${msg('ai.input')}</th><th>${msg('ai.mapping')}</th></tr></thead><tbody>${item.considerations.map(c => `<tr><th>${msg(`ai.cons.${c.id}`)}</th><td>${c.input}</td><td><code>${c.formula}</code><br><b>${score(c.score)}</b></td></tr>`).join('')}</tbody></table>
      <p>${msg('ai.final')}: <code>${product(item)}</code></p></div></details>`;
  }).join('');
  const tests = bt.nodeStates.filter(d => d.condition);
  q('ai-bt-reason').innerHTML = `<p>${msg('ai.btReason')}</p><ol>${tests.map(d => `<li>${nodeLabel(d.node)}: <code>${d.condition!.input} ${d.condition!.operator} ${d.condition!.threshold}</code> — ${symbol[d.status]} ${msg(`ai.status.${d.status}`)}</li>`).join('')}</ol><p>${msg('ai.skipped')}: ${bt.nodeStates.filter(d => d.status === 'not-evaluated').length}</p>`;
  const winner = utility.actions.find(a => a.action === utility.selectedAction)!;
  q('ai-utility-reason').innerHTML = `<p>${msg('ai.utilityReason')}</p><p><strong>${actionLabel(winner.action)}</strong></p><ul>${winner.considerations.map(c => `<li>${msg(`ai.cons.${c.id}`)}: ${score(c.score)}</li>`).join('')}</ul><code>${product(winner)}</code>`;
}
