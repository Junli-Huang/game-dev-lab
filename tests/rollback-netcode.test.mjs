import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
// Compile the DOM-free core using the project's existing TypeScript dependency.
const dir = mkdtempSync(join(tmpdir(), 'rollback-test-'));
after(() => rmSync(dir, { recursive: true, force: true }));
for (const name of ['simulation', 'fake-network', 'history', 'remote-input-generator', 'rollback']) {
  const source = readFileSync(new URL(`../src/prototypes/rollback-netcode/${name}.ts`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  writeFileSync(join(dir, `${name}.mjs`), outputText.replace(/from ['"](.\/[^'"]+)['"]/g, 'from "$1.mjs"'));
}
const { RollbackLab, defaultSettings } = await import(pathToFileURL(join(dir, 'rollback.mjs')));
const { simulate, initialState, HISTORY_LIMIT } = await import(pathToFileURL(join(dir, 'simulation.mjs')));
const { remoteInput } = await import(pathToFileURL(join(dir, 'remote-input-generator.mjs')));
const create = (s = {}) => new RollbackLab({ ...defaultSettings(), ...s });
const run = (lab, count, local = () => 0) => { for (let n = 0; n < count; n++) lab.tick(local(n)); };

test('A: zero latency confirms before simulation; deterministic oracle matches', () => {
  const lab = create({ latency: 0 }); let expected = initialState();
  for (let f = 0; f < 1500; f++) {
    const local = f % 3 - 1;
    expected = simulate(expected, local, remoteInput(f, 'cycle')); lab.tick(local);
    assert.deepEqual(lab.state, expected);
  }
  assert.equal(lab.stats.predictions, 0); assert.equal(lab.stats.rollbacks, 0);
  assert.equal(lab.confirmedFrame, 1499);
});
test('B: Delay buffers local input, network still advances, and does not predict', () => {
  const lab = create({ mode: 'delay', latency: 200 });
  run(lab, 12, () => 1); assert.equal(lab.state.frame, 0); assert.equal(lab.waiting, true);
  lab.tick(0); assert.equal(lab.state.frame, 1); assert.equal(lab.state.playerA.x, 232);
  assert.equal(lab.history.inputs.get(0).local, 1);
  assert.equal(lab.stats.predictions, 0);
});
test('C: Prediction records mismatch but leaves past states unchanged', () => {
  const lab = create({ mode: 'prediction', latency: 200, pattern: 'fast' });
  run(lab, 12); const old = structuredClone(lab.history.states.get(1));
  run(lab, 100);
  assert.ok(lab.stats.wrong > 0); assert.equal(lab.stats.rollbacks, 0);
  assert.deepEqual(lab.history.states.get(1), old);
});
test('D: Rollback restores pre-frame snapshot, replays, and shows a correction', () => {
  const lab = create({ latency: 200 }); run(lab, 13);
  assert.equal(lab.stats.lastDepth, 12); assert.equal(lab.stats.correction, 24);
  assert.equal(lab.state.playerB.x, 506); assert.ok(lab.ghost);
  assert.equal(lab.history.inputs.get(0).rollbackStart, true);
  assert.equal(lab.history.inputs.get(11).resimulated, true);
  assert.equal(lab.network.queue.length, 12); // Replay sent no new packets.
  assert.equal(lab.generatedFrame, 13);
});
test('Out-of-order arrivals never use a future input to predict the past', () => {
  const lab = create({ latency: 100, jitter: 200, pattern: 'fast' });
  run(lab, 1500, n => n % 3 - 1);
  const start = Math.min(...lab.history.states.keys());
  let expected = structuredClone(lab.history.states.get(start));
  let known = lab.history.remoteBeforeWindow;
  for (let f = start; f < lab.state.frame; f++) {
    const i = lab.history.inputs.get(f); known = i.remote ?? known;
    expected = simulate(expected, i.local, known);
  }
  assert.deepEqual(lab.state, expected);
  assert.ok(lab.stats.rollbacks > 0);
});
test('After all delayed inputs arrive, replay matches an independent full-history oracle', () => {
  const lab = create({ latency: 200, jitter: 180, pattern: 'fast' });
  let expected = initialState();
  for (let f = 0; f < 240; f++) {
    expected = simulate(expected, f % 3 - 1, remoteInput(f, 'fast')); lab.tick(f % 3 - 1);
  }
  // Continue with idle inputs until all old packets arrive. Unknown tail inputs are idle too.
  lab.settings.pattern = 'idle';
  for (let f = 240; f < 300; f++) { expected = simulate(expected, 0, 0); lab.tick(0); }
  assert.deepEqual(lab.state, expected);
});
test('Loss and long runs keep histories bounded; Delay exposes overflow instead of skipping input', () => {
  for (const mode of ['prediction', 'rollback']) {
    const lab = create({ mode, latency: 500, jitter: 200, loss: 20 }); run(lab, 4000);
    assert.ok(lab.history.inputs.size <= HISTORY_LIMIT);
    assert.ok(lab.history.states.size <= HISTORY_LIMIT + 1);
    assert.ok(lab.network.queue.length <= 43); assert.equal(lab.overflow, false);
    assert.ok(lab.network.dropped > 0); assert.ok(lab.confirmedFrame < lab.latestArrivalFrame);
  }
  const delay = create({ mode: 'delay', loss: 20 }); run(delay, 1200);
  assert.equal(delay.overflow, true); assert.ok(delay.history.inputs.size <= HISTORY_LIMIT);
  const state = structuredClone(delay.state); delay.tick(1); assert.deepEqual(delay.state, state);
});
test('New experiment resets all state and seeded network while retaining selected settings', () => {
  const old = create({ latency: 200, jitter: 40, pattern: 'fast' }); run(old, 100);
  const reset = new RollbackLab(old.settings);
  assert.deepEqual(reset.state, initialState()); assert.equal(reset.network.queue.length, 0);
  assert.equal(reset.history.inputs.size, 0); assert.equal(reset.history.states.size, 1);
  assert.equal(reset.ghost, undefined); assert.equal(reset.stats.rollbacks, 0);
  assert.equal(reset.settings.latency, 200);
  run(reset, 100); assert.deepEqual(reset.state, old.state); assert.deepEqual(reset.stats, old.stats);
});
