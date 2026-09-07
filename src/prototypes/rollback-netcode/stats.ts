import { t } from '../../i18n';
import type { RollbackLab } from './rollback';
export function renderStats(root: HTMLElement, lab: RollbackLab, fps: number) {
  const s = lab.stats;
  const pairs = [
    [t('rollback.fps'), fps.toFixed(0)], [t('rollback.frame'), lab.state.frame],
    [t('rollback.generated'), lab.generatedFrame - 1], [t('rollback.confirmed'), lab.confirmedFrame],
    [t('rollback.arrival'), lab.latestArrivalFrame], [t('rollback.pending'), lab.predictedFrames],
    [t('rollback.predictions'), s.predictions], [t('rollback.correct'), s.correct], [t('rollback.wrong'), s.wrong],
    [t('rollback.accuracy'), s.correct + s.wrong ? `${(100 * s.correct / (s.correct + s.wrong)).toFixed(1)}%` : '—'],
    [t('rollback.rollbacks'), s.rollbacks], [t('rollback.depth'), s.lastDepth], [t('rollback.maxDepth'), s.maxDepth],
    [t('rollback.correction'), `${s.correction} px`], [t('rollback.queue'), `${lab.network.queue.length} / ${lab.network.dropped}`],
  ];
  root.innerHTML = pairs.map(([name, value]) => `<div><dt>${name}</dt><dd>${value}</dd></div>`).join('');
}
