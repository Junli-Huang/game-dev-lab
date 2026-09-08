import { subscribeLanguageChange } from '../../i18n';
import { WORLD_RANGES, type WorldKey } from './world-state';
import { PRESETS, defaultState, type PresetId } from './presets';
import { evaluateBehavior } from './behavior-tree/evaluator';
import { evaluateUtility } from './utility-ai/scoring';
import { msg, renderDecisions } from './renderer';
const text = (key: string) => `<span data-ai-text="${key}">${msg(key)}</span>`;
export function mountDecisionLab(container: HTMLElement): () => void {
  container.innerHTML = `<main class="prototype-page shell ai-page">
    <a class="back-link" href="#/">${text('common.back')}</a>
    <header class="prototype-heading"><p class="eyebrow">${text('ai.eyebrow')}</p><h1>${text('metadata.decision.title')}</h1><p>${text('ai.intro')}</p></header>
    <section class="ai-box"><h2>${text('ai.world')}</h2><p>${text('ai.static')}</p>
      <div class="ai-controls">${(Object.keys(WORLD_RANGES) as WorldKey[]).map(key => `<label>${text(`ai.${key}`)} <output id="ai-${key}-value"></output><input id="ai-${key}" data-field="${key}" type="range" min="0" max="${WORLD_RANGES[key]}" step="1" aria-describedby="ai-${key}-help"><small id="ai-${key}-help">${text(`ai.${key}Help`)}</small></label>`).join('')}</div>
      <h3>${text('ai.presets')}</h3><div class="ai-presets">${(Object.keys(PRESETS) as PresetId[]).map(id => `<button data-preset="${id}" ${id === 'different' ? 'class="ai-divergence"' : ''}>${text(`ai.preset.${id}`)}</button>`).join('')}<button id="ai-reset">${text('common.reset')}</button></div>
      <p>${text('ai.presetHelp')}</p>
    </section>
    <p id="ai-outcome" class="ai-outcome" role="status"></p>
    <div class="ai-comparison">
      <section class="ai-box"><p class="eyebrow">${text('ai.btTag')}</p><h2>${text('ai.bt')}</h2><div class="ai-choice">${text('ai.selected')}<strong id="ai-bt-choice"></strong></div><p class="ai-hint">${text('ai.treeHelp')}</p><ol id="ai-tree" class="ai-tree"></ol><h3>${text('ai.path')}</h3><p id="ai-path" class="ai-path"></p></section>
      <section class="ai-box"><p class="eyebrow">${text('ai.utilityTag')}</p><h2>${text('ai.utility')}</h2><div class="ai-choice">${text('ai.selected')}<strong id="ai-utility-choice"></strong></div><p class="ai-hint">${text('ai.utilityHelp')}</p><div id="ai-scores"></div><p class="ai-hint">${text('ai.tieOrder')}</p></section>
    </div>
    <section class="ai-box"><h2>${text('ai.why')}</h2><div class="ai-reasons"><div><h3>${text('ai.bt')}</h3><div id="ai-bt-reason"></div></div><div><h3>${text('ai.utility')}</h3><div id="ai-utility-reason"></div></div></div><p>${text('ai.compareHelp')}</p></section>
    <article class="explanation">${['selector','model','limits','hybrid'].map(key => `<section><h2>${text(`ai.${key}Title`)}</h2><p>${text(`ai.${key}Help`)}</p></section>`).join('')}</article>
  </main>`;
  let state = defaultState();
  let bt = evaluateBehavior(state), utility = evaluateUtility(state);
  const render = () => {
    container.querySelectorAll<HTMLInputElement>('[data-field]').forEach(input => {
      const key = input.dataset.field as WorldKey;
      input.value = String(state[key]);
      container.querySelector<HTMLOutputElement>(`#ai-${key}-value`)!.value = String(state[key]);
    });
    container.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(button => {
      const preset = PRESETS[button.dataset.preset as PresetId];
      const active = (Object.keys(WORLD_RANGES) as WorldKey[]).every(key => preset[key] === state[key]);
      button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
    });
    renderDecisions(container, bt, utility);
  };
  const evaluate = () => { bt = evaluateBehavior(state); utility = evaluateUtility(state); render(); };
  container.querySelectorAll<HTMLInputElement>('[data-field]').forEach(input => input.oninput = () => {
    state = { ...state, [input.dataset.field as WorldKey]: Number(input.value) }; evaluate();
  });
  container.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(button => button.onclick = () => {
    state = { ...PRESETS[button.dataset.preset as PresetId] }; evaluate();
  });
  container.querySelector<HTMLButtonElement>('#ai-reset')!.onclick = () => { state = defaultState(); evaluate(); };
  const translate = () => {
    container.querySelectorAll<HTMLElement>('[data-ai-text]').forEach(el => { el.textContent = msg(el.dataset.aiText!); });
    render(); // Language changes only render cached results; no AI/state reset.
  };
  const unsubscribe = subscribeLanguageChange(translate);
  render();
  return () => unsubscribe();
}
