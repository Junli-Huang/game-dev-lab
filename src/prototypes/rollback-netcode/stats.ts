import { t } from '../../i18n';
import type { RollbackLab } from './rollback';
export function renderStats(root: HTMLElement, lab: RollbackLab, fps: number) {
  const s = lab.stats;
  const pairs = [
    [t('rollback.fps'), fps.toFixed(0)], [t('rollback.frame'), lab.state.frame],
    [t('rollback.generated'), lab.generatedFrame], [t('rollback.confirmed'), lab.confirmedFrame],
    [t('rollback.arrival'), lab.latestArrivalFrame], [t('rollback.speculative'), lab.speculativeDepth], [t('rollback.pending'), lab.missingRemoteInputs],
    [t('rollback.predictions'), s.predictions], [t('rollback.correct'), s.correct], [t('rollback.wrong'), s.wrong],
    [t('rollback.accuracy'), s.correct + s.wrong ? `${(100 * s.correct / (s.correct + s.wrong)).toFixed(1)}%` : '—'],
    [t('rollback.rollbacks'), s.rollbacks], [t('rollback.depth'), s.lastDepth], [t('rollback.maxDepth'), s.maxDepth],
    [t('rollback.correction'), `${s.correction} px`], [t('rollback.queue'), lab.network.queue.length], [t('rollback.dropped'), lab.network.dropped],
  ];
  root.innerHTML = pairs.map(([name, value]) => `<div><dt>${name}</dt><dd>${value}</dd></div>`).join('');
}

export function renderRollbackEvent(root: HTMLElement, lab: RollbackLab) {
  const event = lab.lastRollback;
  if (!event) { root.textContent = '—'; return; }
  const pairs = [
    [t('rollback.from'), event.from], [t('rollback.to'), event.to],
    [t('rollback.eventDepth'), lab.stats.lastDepth],
    [t('rollback.eventCorrection'), `${lab.stats.correction} px`],
  ];
  root.innerHTML = pairs.map(([name, value]) => `<div><dt>${name}</dt><dd>${value}</dd></div>`).join('');
}
