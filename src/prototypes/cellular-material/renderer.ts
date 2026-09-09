import { t } from '../../i18n';
import type { MessageKey } from '../../i18n/en';
import { MATERIALS, MATERIAL_IDS, DIRECTIONS, FIRE_RULES } from './materials';
import type { World } from './world';
import { leftFirst } from './movement';
export const msg = (key: string) => t(key as MessageKey);
export function renderWorld(canvas: HTMLCanvasElement, world: World, selected: number | undefined, debug: boolean) {
  const ctx = canvas.getContext('2d')!, scale = canvas.width / world.width;
  ctx.fillStyle = MATERIALS.air.color; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < world.cells.length; i++) {
    const cell = world.cells[i]; if (cell.material === 'air') continue;
    ctx.fillStyle = cell.material === 'fire' && cell.life < 15 ? '#b84127' : MATERIALS[cell.material].color;
    ctx.fillRect(i % world.width * scale, Math.floor(i / world.width) * scale, scale, scale);
  }
  if (debug && selected !== undefined) {
    const x = selected % world.width, y = Math.floor(selected / world.width);
    ctx.lineWidth = 1; ctx.strokeStyle = '#7cb9fa';
    for (const [dx, dy] of Object.values(DIRECTIONS)) if (world.index(x + dx, y + dy) >= 0) ctx.strokeRect((x + dx) * scale + .5, (y + dy) * scale + .5, scale - 1, scale - 1);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x * scale, y * scale, scale, scale);
  }
}
export function renderDebug(root: HTMLElement, world: World, selected?: number) {
  const q = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!;
  const scan = (tick: number) => `${msg(world.mode === 'correct' ? 'cell.bottomUp' : 'cell.topDown')} · ${msg(leftFirst(world, tick) ? 'cell.leftRight' : 'cell.rightLeft')}`;
  q('cm-scan').textContent = `${msg('cell.scan')}: ${world.lastScan ? `${msg(world.lastScan.bottomUp ? 'cell.bottomUp' : 'cell.topDown')} · ${msg(world.lastScan.forward ? 'cell.leftRight' : 'cell.rightLeft')}` : '—'} · ${msg('cell.nextScan')}: ${scan(world.tick + 1)}`;
  if (selected === undefined) { q('cm-inspector').textContent = msg('cell.pick'); q('cm-trace').textContent = msg('cell.noTrace'); return; }
  const x = selected % world.width, y = Math.floor(selected / world.width), cell = world.cells[selected];
  q('cm-inspector').innerHTML = `<p><b>(${x}, ${y}) · ${msg(`cell.${cell.material}`)}</b> · ${msg('cell.updated')}: ${cell.updatedAt < 0 ? '—' : cell.updatedAt}${cell.material === 'fire' ? ` · ${msg('cell.life')}: ${cell.life}` : ''}</p><h3>${msg('cell.neighbors')}</h3><div class="cm-neighbors">${Object.entries(DIRECTIONS).map(([name, [dx, dy]]) => {
    const i = world.index(x + dx, y + dy); return `<span>${msg(`cell.${name}`)}: ${msg(i < 0 ? 'cell.boundary' : `cell.${world.cells[i].material}`)}</span>`;
  }).join('')}</div>`;
  const trace = world.traces[selected];
  if (!trace) { q('cm-trace').textContent = msg('cell.noTrace'); return; }
  const coords = (i: number) => `(${i % world.width}, ${Math.floor(i / world.width)})`;
  q('cm-trace').innerHTML = `<p><b>${msg(`cell.${trace.material}`)} · Tick ${trace.tick}</b> · ${coords(trace.from)} → ${coords(trace.to)}</p><ol>${trace.checks.map(c => `<li>${msg(`cell.${c.direction}`)}: ${msg(`cell.${c.result}`)}${c.roll === undefined ? '' : ` · ${msg('cell.roll')}: ${c.roll.toFixed(6)} / ${msg('cell.threshold')}: ${FIRE_RULES.ignitionProbability}`}</li>`).join('')}</ol>${trace.waterSearch ? `<ul>${(['left', 'right'] as const).map(direction => { const distance = trace.waterSearch![direction === 'left' ? 'leftDropDistance' : 'rightDropDistance']; return `<li>${msg(`cell.search${direction === 'left' ? 'Left' : 'Right'}`)}: ${distance === undefined ? msg('cell.noDrop') : `${msg('cell.dropDistance')} ${distance}`}</li>`; }).join('')}</ul>` : ''}<p><b>${msg('cell.chosen')}: ${msg(`cell.${trace.chosen}`)}</b>${trace.life === undefined ? '' : ` · ${msg('cell.life')}: ${trace.life}`}</p>`;
}
export function renderStats(root: HTMLElement, world: World) {
  const counts = Object.fromEntries(MATERIAL_IDS.map(id => [id, 0]));
  for (const cell of world.cells) counts[cell.material]++;
  const stats = [['tick', world.tick], ['nonAir', world.cells.length - counts.air], ['moved', world.stats.movedCells], ['reacted', world.stats.reactedCells], ...MATERIAL_IDS.filter(id => id !== 'air').map(id => [id, counts[id]])];
  root.innerHTML = stats.map(([key, value]) => `<div data-stat="${key}"><dt>${msg(`cell.${key}`)}</dt><dd>${value}</dd></div>`).join('');
}
