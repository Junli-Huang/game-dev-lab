import { t } from '../../i18n';
import type { RollbackLab } from './rollback';
export function renderArena(canvas: HTMLCanvasElement, lab: RollbackLab) {
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 900, 260);
  ctx.fillStyle = '#0b1425'; ctx.fillRect(0, 0, 900, 260);
  ctx.strokeStyle = '#1d3047'; ctx.lineWidth = 1;
  for (let x = 0; x <= 900; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 260); ctx.stroke(); }
  for (const y of [85, 185]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(900, y); ctx.stroke(); }
  const actor = (x: number, y: number, color: string, name: string, labelY = y - 29) => {
    ctx.fillStyle = color; ctx.fillRect(x - 13, y - 13, 26, 26);
    ctx.font = '14px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(name, Math.max(65, Math.min(835, x)), labelY);
  };
  if (lab.ghost) {
    const x = lab.ghost.state.playerB.x;
    ctx.globalAlpha = .35;
    actor(x, 185, '#ffbe55', t('rollback.ghost'), 237);
    ctx.setLineDash([5, 4]); ctx.strokeStyle = '#ffbe55';
    ctx.beginPath(); ctx.moveTo(x, 211); ctx.lineTo(lab.state.playerB.x, 211); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;
  }
  actor(lab.state.playerA.x, 85, '#6ee7c7', t('rollback.local'));
  actor(lab.state.playerB.x, 185, '#7caeff', t('rollback.remote'));
}
