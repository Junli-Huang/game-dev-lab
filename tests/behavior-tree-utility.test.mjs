import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const dir = mkdtempSync(join(tmpdir(), 'decision-lab-test-'));
after(() => rmSync(dir, { recursive: true, force: true }));
for (const name of ['world-state', 'actions', 'presets', 'behavior-tree/nodes', 'behavior-tree/tree', 'behavior-tree/evaluator', 'utility-ai/considerations', 'utility-ai/scoring']) {
  const source = readFileSync(new URL(`../src/prototypes/behavior-tree-utility/${name}.ts`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  const path = join(dir, `${name}.mjs`); mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, outputText.replace(/from ['"]([.][^'"]+)['"]/g, 'from "$1.mjs"'));
}
const load = name => import(pathToFileURL(join(dir, `${name}.mjs`)));
const { evaluateBehavior } = await load('behavior-tree/evaluator');
const { evaluateUtility } = await load('utility-ai/scoring');
const { PRESETS } = await load('presets');
const { ACTION_IDS } = await load('actions');
const { BT_RULES } = await load('behavior-tree/tree');

test('BT healthy combat selects Attack; low health selects Run Away', () => {
  assert.equal(evaluateBehavior(PRESETS.healthy).selectedAction, 'attack');
  assert.equal(evaluateBehavior(PRESETS.critical).selectedAction, 'run');
});
test('BT short-circuit preserves Not Evaluated, distinct from failed conditions', () => {
  const result = evaluateBehavior(PRESETS.healthy);
  const nodes = Object.fromEntries(result.nodeStates.map(d => [d.node.id, d]));
  for (const id of ['hungerBranch', 'highHunger', 'eat', 'fatigueBranch', 'highFatigue', 'sleep', 'explore']) {
    assert.equal(nodes[id].status, 'not-evaluated'); assert.equal(nodes[id].order, undefined);
  }
  assert.equal(nodes.lowHealth.status, 'failure'); assert.equal(nodes.run.status, 'not-evaluated');
  assert.equal(nodes.emptyAmmo.status, 'failure'); assert.equal(nodes.reload.status, 'not-evaluated');
  assert.deepEqual(result.path, ['root', 'combat', 'combatChoice', 'attack']);
  const visited = result.nodeStates.filter(d => d.order).map(d => d.order);
  assert.deepEqual(visited, Array.from({ length: visited.length }, (_, i) => i + 1));
});
test('BT uses configured inclusive thresholds and handles reload and fallback', () => {
  const near = { ...PRESETS.healthy, enemyDistance: BT_RULES.enemyNearDistance };
  assert.equal(evaluateBehavior({ ...near, health: BT_RULES.lowHealth }).selectedAction, 'run');
  assert.equal(evaluateBehavior({ ...near, health: BT_RULES.lowHealth + 1, ammo: 0 }).selectedAction, 'reload');
  assert.equal(evaluateBehavior({ ...near, enemyDistance: 9, hunger: BT_RULES.highHunger }).selectedAction, 'eat');
  assert.equal(evaluateBehavior({ ...near, enemyDistance: 9, fatigue: BT_RULES.highFatigue }).selectedAction, 'sleep');
  assert.equal(evaluateBehavior({ ...near, enemyDistance: 9 }).selectedAction, 'explore');
});
test('Selector/Sequence propagate Running and do not visit later children', () => {
  const result = evaluateBehavior(PRESETS.critical, undefined, () => 'running');
  assert.equal(result.status, 'running'); assert.equal(result.selectedAction, 'run');
  for (const id of ['root', 'combat', 'combatChoice', 'runBranch', 'run']) assert.equal(result.nodeStates.find(d => d.node.id === id).status, 'running');
  assert.equal(result.nodeStates.find(d => d.node.id === 'reloadBranch').status, 'not-evaluated');
});
test('Selector all-failure and Sequence all-success follow their node semantics', () => {
  const condition = (id, threshold) => ({ id, type: 'condition', field: 'health', operator: '>=', threshold });
  const children = [condition('first', 95), condition('second', 99)];
  assert.equal(evaluateBehavior(PRESETS.healthy, { id: 'root', type: 'selector', children }).status, 'failure');
  const success = evaluateBehavior(PRESETS.healthy, { id: 'root', type: 'sequence', children: [condition('first', 10), condition('second', 20)] });
  assert.equal(success.status, 'success'); assert.ok(success.nodeStates.every(d => d.status === 'success'));
});
test('Utility evaluates all actions, chooses the actual maximum, and preserves definition order', () => {
  for (const state of Object.values(PRESETS)) {
    const result = evaluateUtility(state);
    assert.deepEqual(result.actions.map(a => a.action), ACTION_IDS);
    const max = Math.max(...result.actions.map(a => a.finalScore));
    assert.equal(result.actions.find(a => a.action === result.selectedAction).finalScore, max);
    for (const action of result.actions) {
      assert.equal(action.finalScore, action.considerations.reduce((p, c) => p * c.score, action.baseScore));
      assert.ok(action.finalScore >= 0 && action.finalScore <= 1);
    }
  }
});
test('Utility exact tie uses stable action order; display rounding never affects selection', () => {
  const tie = { health: 50, hunger: 0, ammo: 10, fatigue: 0, enemyDistance: 0 };
  const result = evaluateUtility(tie);
  assert.equal(result.actions[0].finalScore, result.actions[1].finalScore);
  assert.equal(result.selectedAction, 'attack');
  const close = evaluateUtility({ ...tie, health: 49.999 });
  assert.equal(close.actions[0].finalScore.toFixed(2), close.actions[1].finalScore.toFixed(2));
  assert.equal(close.selectedAction, 'run');
});
test('Utility binary ammo gate and input mappings expose correct raw data', () => {
  const result = evaluateUtility({ ...PRESETS.healthy, ammo: 0 });
  const attack = result.actions.find(a => a.action === 'attack');
  assert.equal(attack.finalScore, 0);
  assert.deepEqual(attack.considerations.map(c => c.input), [4, 90, 0]);
  assert.equal(attack.considerations[0].score, 1 - 4 / 30);
});
test('Every named preset matches its teaching outcome, including stable divergence', () => {
  const expected = { healthy: ['attack', 'attack'], critical: ['run', 'run'], hungry: ['attack', 'eat'], peaceful: ['eat', 'eat'], exhausted: ['sleep', 'sleep'], different: ['attack', 'eat'] };
  for (const [id, state] of Object.entries(PRESETS)) assert.deepEqual([evaluateBehavior(state).selectedAction, evaluateUtility(state).selectedAction], expected[id]);
});
test('Decision-only evaluation does not mutate the shared input or retain old node status', () => {
  const state = Object.freeze({ ...PRESETS.different }), before = { ...state };
  const first = evaluateBehavior(state); evaluateUtility(state);
  assert.deepEqual(state, before);
  evaluateBehavior(PRESETS.peaceful);
  assert.deepEqual(evaluateBehavior(state), first);
});
