import { t, subscribeLanguageChange } from '../../i18n';
import type { MessageKey } from '../../i18n/en';
import { defaultSettings, RollbackLab, type Mode } from './rollback';
import { DT_MS, type Move } from './simulation';
import type { RemotePattern } from './remote-input-generator';
import { renderArena } from './renderer';
import { renderInspector, renderTimeline } from './timeline';
import { renderStats, renderRollbackEvent } from './stats';
const text = (key: MessageKey) => `<span data-rb-text="${key}">${t(key)}</span>`;
export function mountRollback(container: HTMLElement): () => void {
  container.innerHTML = `<main class="prototype-page shell rb-page">
    <a class="back-link" href="#/">${text('common.back')}</a>
    <header class="prototype-heading"><p class="eyebrow">${text('rollback.eyebrow')}</p><h1>${text('metadata.rollback.title')}</h1><p>${text('rollback.intro')}</p></header>
    <section class="rb-box" data-rb-aria="rollback.controls">
      <div class="rb-modes">${(['delay', 'prediction', 'rollback'] as const).map(mode => `<button data-mode="${mode}">${text(`rollback.${mode}`)}</button>`).join('')}</div>
      <p id="rb-mode-help"></p>
      <div class="rb-sliders">${(['latency', 'jitter', 'loss'] as const).map((key, i) => `<label>${text(`rollback.${key}`)} <output id="rb-${key}-value"></output><input id="rb-${key}" type="range" min="0" max="${[500, 200, 20][i]}" step="${i === 2 ? 1 : 10}" value="${i === 0 ? 150 : 0}"></label>`).join('')}</div>
      <p class="rb-loss-note">${text('rollback.lossHelp')}</p>
      <label class="rb-pattern">${text('rollback.pattern')} <select id="rb-pattern">${(['cycle', 'fast', 'left', 'idle', 'right'] as const).map(p => `<option value="${p}" data-rb-text="rollback.${p}">${t(`rollback.${p}`)}</option>`).join('')}</select></label>
    </section>
    <div class="rb-actions"><button id="rb-pause"></button><button id="rb-step" data-rb-title="rollback.stepHelp">${text('rollback.step')}</button><button id="rb-reset">${text('common.reset')}</button><span id="rb-status" role="status"></span></div>
    <dl id="rb-clocks" class="rb-clocks"></dl><p class="rb-muted">${text('rollback.clocksHelp')}</p><p class="rb-muted">${text('rollback.resetHelp')}</p>
    <section class="demo-panel"><canvas width="900" height="260" data-rb-aria="rollback.arena" tabindex="0"></canvas></section>
    <div class="rb-input"><p>${text('rollback.keyboard')}</p><button data-move="-1" data-rb-aria="rollback.left">A / ←</button><button data-move="1" data-rb-aria="rollback.right">D / →</button></div>
    <section class="rb-box"><h2>${text('rollback.stats')}</h2><dl id="rb-stats" class="rb-stats"></dl><p class="rb-muted">${text('rollback.metricsHelp')}</p><p class="rb-muted">${text('rollback.speculativeHelp')}</p><p>${text('rollback.history')}</p></section>
    <section class="rb-box"><h2>${text('rollback.timeline')}</h2><p>${text('rollback.legend')}</p><p class="rb-muted">${text('rollback.timelineHelp')}</p><h3>${text('rollback.lastEvent')}</h3><dl id="rb-event" class="rb-stats rb-inspector"></dl><p id="rb-replay"></p><div id="rb-timeline" class="rb-timeline"></div><h3>${text('rollback.select')}</h3><dl id="rb-inspector" class="rb-stats rb-inspector"></dl></section>
    <section class="rb-box"><h2>${text('rollback.experiments')}</h2><div class="rb-presets">${(['zero', 'delayPreset', 'predictPreset', 'rollbackPreset'] as const).map((key, i) => `<button data-preset="${i}">${text(`rollback.${key}`)}</button>`).join('')}</div><p>${text('rollback.experimentHelp')}</p></section>
    <article class="explanation">${(['determinism', 'why', 'histories', 'clocks', 'delivery', 'limits'] as const).map(key => `<section><h2>${text(`rollback.${key}`)}</h2><p>${text(`rollback.${key}Help`)}</p>${key === 'histories' ? '<pre><code>stateHistory[N] = state before frame N\nrestore stateHistory[N]\nfor f = N; f &lt; currentFrame; f++:\n  simulate(savedInput[f])\n  save stateHistory[f + 1]</code></pre>' : ''}</section>`).join('')}</article>
  </main>`;
  const q = <T extends HTMLElement>(selector: string) => container.querySelector<T>(selector)!;
  const settings = defaultSettings();
  let lab = new RollbackLab(settings);
  let paused = false, selected: number | undefined, accumulator = 0, last = performance.now();
  let fps = 0, sampleTime = 0, sampleFrames = 0, raf = 0, lastUI = -Infinity;
  const keys = new Set<string>();
  const pointers = new Map<number, Move>();
  const canvas = q<HTMLCanvasElement>('canvas');
  const pause = q<HTMLButtonElement>('#rb-pause');
  const step = q<HTMLButtonElement>('#rb-step');
  const syncControls = () => {
    for (const key of ['latency', 'jitter', 'loss'] as const) {
      q<HTMLInputElement>(`#rb-${key}`).value = String(settings[key]);
      q<HTMLOutputElement>(`#rb-${key}-value`).value = `${settings[key]} ${key === 'loss' ? '%' : 'ms'}`;
    }
    q<HTMLSelectElement>('#rb-pattern').value = settings.pattern;
    container.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b => {
      const active = b.dataset.mode === settings.mode;
      b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active));
    });
  };
  const draw = () => {
    pause.textContent = t(paused ? 'common.resume' : 'common.pause');
    step.disabled = !paused || lab.overflow;
    q('#rb-mode-help').textContent = t(`rollback.${settings.mode}Help`);
    q('#rb-status').textContent = t(lab.overflow ? 'rollback.overflow' : lab.waiting ? 'rollback.waiting' : paused ? 'rollback.paused' : 'rollback.running');
    if (selected !== undefined && !lab.history.inputs.has(selected)) selected = undefined;
    renderArena(canvas, lab);
    q('#rb-clocks').innerHTML = `<div><dt>${t('rollback.generated')}</dt><dd>${lab.generatedFrame}</dd></div><div><dt>${t('rollback.frame')}</dt><dd>${lab.state.frame}</dd></div>`;
    renderStats(q('#rb-stats'), lab, paused ? 0 : fps);
    renderRollbackEvent(q('#rb-event'), lab);
    renderTimeline(q('#rb-timeline'), lab, selected);
    renderInspector(q('#rb-inspector'), lab, selected);
    q('#rb-replay').textContent = `${t('rollback.lastReplay')}: ${lab.lastRollback ? `${lab.lastRollback.from} → ${lab.lastRollback.to}` : '—'}`;
  };
  const localInput = (): Move => {
    const left = keys.has('KeyA') || keys.has('ArrowLeft') || [...pointers.values()].includes(-1);
    const right = keys.has('KeyD') || keys.has('ArrowRight') || [...pointers.values()].includes(1);
    return (Number(right) - Number(left)) as Move;
  };
  const reset = () => {
    lab = new RollbackLab(settings); selected = undefined; keys.clear(); pointers.clear();
    accumulator = 0; fps = 0; sampleTime = 0; sampleFrames = 0; last = performance.now();
    syncControls(); draw();
  };
  pause.onclick = () => { paused = !paused; accumulator = 0; sampleTime = 0; sampleFrames = 0; last = performance.now(); draw(); };
  step.onclick = () => { if (paused) { lab.tick(localInput()); draw(); } };
  q('#rb-reset').onclick = reset;
  container.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b => b.onclick = () => { settings.mode = b.dataset.mode as Mode; reset(); });
  for (const key of ['latency', 'jitter', 'loss'] as const) q<HTMLInputElement>(`#rb-${key}`).oninput = event => {
    settings[key] = Number((event.target as HTMLInputElement).value); syncControls(); draw();
  };
  q<HTMLSelectElement>('#rb-pattern').onchange = event => { settings.pattern = (event.target as HTMLSelectElement).value as RemotePattern; };
  container.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(b => b.onclick = () => {
    const index = Number(b.dataset.preset);
    Object.assign(settings, { mode: (['rollback', 'delay', 'prediction', 'rollback'] as Mode[])[index], latency: index ? 200 : 0, jitter: 0, loss: 0, pattern: index ? 'fast' : 'cycle' });
    reset();
  });
  q('#rb-timeline').onclick = event => {
    const b = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-frame]');
    if (b) { selected = Number(b.dataset.frame); draw(); }
  };
  const isForm = (target: EventTarget | null) => target instanceof HTMLElement && !!target.closest('input, select, textarea, [contenteditable]');
  const keydown = (event: KeyboardEvent) => {
    if (isForm(event.target) || !['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight'].includes(event.code)) return;
    event.preventDefault(); keys.add(event.code);
  };
  const keyup = (event: KeyboardEvent) => { keys.delete(event.code); };
  const clearInput = () => { keys.clear(); pointers.clear(); accumulator = 0; last = performance.now(); };
  window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup); window.addEventListener('blur', clearInput);
  document.addEventListener('visibilitychange', clearInput);
  container.querySelectorAll<HTMLButtonElement>('[data-move]').forEach(b => {
    b.onpointerdown = e => { e.preventDefault(); b.setPointerCapture(e.pointerId); pointers.set(e.pointerId, Number(b.dataset.move) as Move); };
    b.onpointerup = b.onpointercancel = b.onlostpointercapture = e => { pointers.delete(e.pointerId); };
  });
  const translate = () => {
    container.querySelectorAll<HTMLElement>('[data-rb-text]').forEach(el => { el.textContent = t(el.dataset.rbText as MessageKey); });
    container.querySelectorAll<HTMLElement>('[data-rb-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.rbAria as MessageKey)));
    container.querySelectorAll<HTMLElement>('[data-rb-title]').forEach(el => el.title = t(el.dataset.rbTitle as MessageKey));
    draw();
  };
  const unsubscribe = subscribeLanguageChange(translate);
  const loop = (now: number) => {
    const elapsed = Math.min(250, now - last); last = now;
    if (!paused && !document.hidden) {
      accumulator += elapsed; sampleTime += elapsed;
      while (accumulator >= DT_MS) {
        const before = lab.state.frame; lab.tick(localInput()); sampleFrames += lab.state.frame - before; accumulator -= DT_MS;
      }
      if (sampleTime >= 500) { fps = sampleFrames * 1000 / sampleTime; sampleTime = 0; sampleFrames = 0; }
    }
    renderArena(canvas, lab);
    if (now - lastUI >= 80 && !paused) { draw(); lastUI = now; }
    raf = requestAnimationFrame(loop);
  };
  syncControls(); translate(); raf = requestAnimationFrame(loop);
  return () => {
    cancelAnimationFrame(raf); unsubscribe();
    window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup); window.removeEventListener('blur', clearInput);
    document.removeEventListener('visibilitychange', clearInput);
  };
}
