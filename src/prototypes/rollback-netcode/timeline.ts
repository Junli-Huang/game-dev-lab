import { t } from '../../i18n';
import type { FrameInput } from './history';
import type { RollbackLab } from './rollback';
export const arrow = (move?: number) => move === undefined ? '—' : move < 0 ? '←' : move > 0 ? '→' : '·';
export function renderTimeline(root: HTMLElement, lab: RollbackLab, selected?: number) {
  const frames = [...lab.history.inputs.values()].filter(i => i.usedRemote !== undefined).slice(-32);
  if (!frames.length) { root.innerHTML = `<p>${t('rollback.empty')}</p>`; return; }
  root.querySelector('p')?.remove();
  const retained = new Set(frames.map(i => i.frame));
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-frame]')) {
    if (!retained.has(Number(button.dataset.frame))) button.remove();
  }
  for (const i of frames) {
    const markers = [i.remote === undefined ? 'P' : 'C', i.mismatch ? 'M' : '', i.rollbackStart ? 'R' : '', i.resimulated ? '↻' : ''].filter(Boolean).join(' ');
    let button = root.querySelector<HTMLButtonElement>(`[data-frame="${i.frame}"]`);
    if (!button) {
      button = document.createElement('button'); button.dataset.frame = String(i.frame);
      button.innerHTML = `<b>${i.frame}</b><span></span><strong></strong>`;
      root.append(button);
    }
    // Retain nodes while live stats update, preserving keyboard focus and clicks.
    button.className = `rb-frame ${i.mismatch ? 'mismatch' : i.remote === undefined ? 'predicted' : 'confirmed'} ${i.rollbackStart ? 'replay-start' : ''}`;
    button.setAttribute('aria-pressed', String(selected === i.frame));
    button.setAttribute('aria-label', `${t('rollback.frameLabel')} ${i.frame}: ${markers}`);
    button.querySelector('span')!.textContent = markers;
    button.querySelector('strong')!.textContent = arrow(i.usedRemote);
  }
}
export function renderInspector(root: HTMLElement, lab: RollbackLab, selected?: number) {
  const i: FrameInput | undefined = lab.history.inputs.get(selected ?? lab.state.frame - 1);
  if (!i || i.usedRemote === undefined) { root.textContent = t('rollback.empty'); return; }
  const state = lab.history.states.get(i.frame);
  const pairs = [
    [t('rollback.frameLabel'), i.frame], [t('rollback.localInput'), arrow(i.local)],
    [t('rollback.original'), arrow(i.initialPrediction)], [t('rollback.actual'), arrow(i.remote)],
    [t('rollback.used'), arrow(i.usedRemote)], [t('rollback.sent'), i.generatedAt.toFixed(1)],
    [t('rollback.received'), i.arrivedAt?.toFixed(1) ?? '—'],
    [t('rollback.snapshot'), state ? `${state.playerA.x} / ${state.playerB.x}` : '—'],
  ];
  root.innerHTML = pairs.map(([name, value]) => `<div><dt>${name}</dt><dd>${value}</dd></div>`).join('');
}
