import { subscribeLanguageChange } from '../../i18n';
import { MATERIAL_IDS, MATERIALS, type MaterialId } from './materials';
import { PRESET_IDS, createPreset, type PresetId } from './presets';
import { paintBrush, paintLine, type UpdateMode, type LateralPolicy } from './world';
import { stepSimulation, SIMULATION_HZ } from './simulation';
import { msg, renderWorld, renderStats, renderDebug } from './renderer';
const text = (key: string) => `<span data-cm-text="${key}">${msg(key)}</span>`;
export function mountCellular(container: HTMLElement): () => void {
  container.innerHTML = `<main class="prototype-page shell cm-page">
    <a class="back-link" href="#/">${text('common.back')}</a><header class="prototype-heading"><p class="eyebrow">${text('cell.eyebrow')}</p><h1>${text('metadata.cellular.title')}</h1><p>${text('cell.intro')}</p></header>
    <section class="cm-box"><h2>${text('cell.material')}</h2><div class="cm-materials">${MATERIAL_IDS.map(id => `<button data-material="${id}" style="--material:${MATERIALS[id].color}">${text(`cell.${id}`)}</button>`).join('')}</div>
      <div class="cm-options"><label>${text('cell.brush')} <select id="cm-brush">${[1,2,4,8].map(size=>`<option ${size===4?'selected':''}>${size}</option>`).join('')}</select></label><label>${text('cell.seed')} <input id="cm-seed" type="number" min="0" max="4294967295" step="1" value="12345"></label><button id="cm-apply">${text('cell.applySeed')}</button></div>
      <div class="cm-presets"><span>${text('cell.presets')}</span>${PRESET_IDS.map(id=>`<button data-preset="${id}">${text(`cell.${id}`)}</button>`).join('')}</div>
    </section>
    <div class="cm-toolbar"><button id="cm-pause"></button><button id="cm-step">${text('cell.step')}</button><button id="cm-reset">${text('common.reset')}</button><label><input id="cm-debug" type="checkbox"> ${text('cell.debug')}</label></div>
    <p class="cm-hint">${text('cell.paintHelp')}</p><p id="cm-bug-warning" class="cm-warning" hidden>${text('cell.bugHelp')}</p>
    <section class="demo-panel"><canvas width="720" height="480" tabindex="0" aria-label="${msg('cell.arena')}"></canvas></section>
    <dl id="cm-stats" class="cm-stats"></dl><p class="cm-hint">${text('cell.fullScan')}</p>
    <section class="cm-box"><div class="cm-options"><label>${text('cell.mode')} <select id="cm-mode"><option value="correct">${msg('cell.correct')}</option><option value="bug">${msg('cell.bug')}</option></select></label><label>${text('cell.lateral')} <select id="cm-lateral"><option value="alternate">${msg('cell.alternate')}</option><option value="left">${msg('cell.leftFirst')}</option></select></label></div><p class="cm-hint">${text('cell.policyHelp')}</p></section>
    <section id="cm-debug-panel" class="cm-box" hidden><h2>${text('cell.selected')}</h2><p>${text('cell.debugHelp')}</p><p id="cm-scan"></p><div id="cm-inspector"></div><h3>${text('cell.trace')}</h3><p class="cm-hint">${text('cell.traceHelp')}</p><div id="cm-trace"></div></section>
    <section class="cm-box"><h2>${text('cell.experiment')}</h2><p>${text('cell.experimentHelp')}</p></section>
    <article class="explanation">${['rules','level','fire','order','determinism','limits'].map(id=>`<section><h2>${text(`cell.${id}Title`)}</h2><p>${text(`cell.${id}Help`)}</p></section>`).join('')}</article>
  </main>`;
  const q = <T extends HTMLElement>(id: string) => container.querySelector<T>(`#${id}`)!;
  const canvas = container.querySelector('canvas')!;
  let preset: PresetId = 'mixed', world = createPreset(preset, 12345), material: MaterialId = 'sand';
  let brush = 4, paused = false, debug = false, selected: number | undefined;
  let pointer: { id: number; position: [number, number] } | undefined;
  let previous = performance.now(), accumulator = 0, raf = 0;
  const draw = () => {
    renderWorld(canvas, world, selected, debug); renderStats(q('cm-stats'), world);
    if (debug) renderDebug(container, world, selected);
    q('cm-pause').textContent = msg(paused ? 'common.resume' : 'common.pause');
    q<HTMLButtonElement>('cm-step').disabled = !paused;
    q('cm-debug-panel').hidden = !debug; q('cm-bug-warning').hidden = world.mode !== 'bug';
  };
  const syncButtons = () => {
    for (const b of container.querySelectorAll<HTMLButtonElement>('[data-material]')) { const active = b.dataset.material === material; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); }
    for (const b of container.querySelectorAll<HTMLButtonElement>('[data-preset]')) { const active = b.dataset.preset === preset; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); }
  };
  const reset = () => {
    const { mode, lateral, seed } = world; world = createPreset(preset, seed); world.mode = mode; world.lateral = lateral;
    selected = undefined; pointer = undefined; accumulator = 0; previous = performance.now(); syncButtons(); draw();
  };
  q('cm-pause').onclick = () => { paused = !paused; accumulator = 0; previous = performance.now(); draw(); };
  q('cm-step').onclick = () => { if (paused) { stepSimulation(world); draw(); } };
  q('cm-reset').onclick = reset;
  q('cm-apply').onclick = () => {
    const input = q<HTMLInputElement>('cm-seed'); if (!input.value || !input.reportValidity()) return;
    world.seed = Number(input.value) >>> 0; reset();
  };
  q<HTMLSelectElement>('cm-brush').onchange = e => { brush = Number((e.target as HTMLSelectElement).value); };
  q<HTMLSelectElement>('cm-mode').onchange = e => { world.mode = (e.target as HTMLSelectElement).value as UpdateMode; draw(); };
  q<HTMLSelectElement>('cm-lateral').onchange = e => { world.lateral = (e.target as HTMLSelectElement).value as LateralPolicy; draw(); };
  q<HTMLInputElement>('cm-debug').onchange = e => { debug = (e.target as HTMLInputElement).checked; pointer = undefined; draw(); };
  container.querySelectorAll<HTMLButtonElement>('[data-material]').forEach(b => b.onclick = () => { material = b.dataset.material as MaterialId; syncButtons(); });
  container.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(b => b.onclick = () => { preset = b.dataset.preset as PresetId; reset(); });
  const position = (e: PointerEvent): [number, number] | undefined => {
    const rect = canvas.getBoundingClientRect(), x = Math.floor((e.clientX - rect.left) / rect.width * world.width), y = Math.floor((e.clientY - rect.top) / rect.height * world.height);
    return world.index(x,y) < 0 ? undefined : [x,y];
  };
  canvas.onpointerdown = e => {
    if (e.button !== 0 || pointer) return; const point = position(e); if (!point) return;
    e.preventDefault(); canvas.setPointerCapture(e.pointerId); pointer = { id: e.pointerId, position: point };
    if (debug) selected = world.index(...point); else paintBrush(world, ...point, material, brush); draw();
  };
  canvas.onpointermove = e => {
    if (!pointer || pointer.id !== e.pointerId) return; const point = position(e); if (!point) { pointer = undefined; return; }
    if (debug) selected = world.index(...point); else paintLine(world, pointer.position, point, material, brush);
    pointer.position = point; draw();
  };
  canvas.onpointerup = canvas.onpointercancel = canvas.onlostpointercapture = () => { pointer = undefined; };
  const suspend = () => { pointer = undefined; accumulator = 0; previous = performance.now(); };
  window.addEventListener('blur', suspend); document.addEventListener('visibilitychange', suspend);
  const translate = () => {
    container.querySelectorAll<HTMLElement>('[data-cm-text]').forEach(el => el.textContent = msg(el.dataset.cmText!));
    q<HTMLSelectElement>('cm-mode').options[0].textContent = msg('cell.correct'); q<HTMLSelectElement>('cm-mode').options[1].textContent = msg('cell.bug');
    q<HTMLSelectElement>('cm-lateral').options[0].textContent = msg('cell.alternate'); q<HTMLSelectElement>('cm-lateral').options[1].textContent = msg('cell.leftFirst');
    canvas.setAttribute('aria-label', msg('cell.arena')); draw();
  };
  const unsubscribe = subscribeLanguageChange(translate);
  const loop = (now: number) => {
    const elapsed = Math.min(250, now - previous); previous = now;
    if (!paused && !document.hidden) {
      accumulator += elapsed; let changed = false;
      while (accumulator >= 1000 / SIMULATION_HZ) {
        if (pointer && !debug) paintBrush(world, ...pointer.position, material, brush);
        stepSimulation(world); accumulator -= 1000 / SIMULATION_HZ; changed = true;
      }
      if (changed) draw();
    }
    raf = requestAnimationFrame(loop);
  };
  syncButtons(); draw(); raf = requestAnimationFrame(loop);
  return () => { cancelAnimationFrame(raf); unsubscribe(); window.removeEventListener('blur', suspend); document.removeEventListener('visibilitychange', suspend); };
}
