import type { PrototypeDefinition } from "../../app/types";
import { compatibilityRules } from "./constraints";
import { metadata } from "./metadata";
import { mountConstraintGeneration } from "./prototype";
import type { GenerationDebugOptions } from "./renderer";
import { directions, tiles, tileTypes } from "./tiles";
import "./style.css";

export const constraintGeneration: PrototypeDefinition = {
  metadata,
  render(container) {
    container.innerHTML = `
      <main class="prototype-page shell constraint-generation-page">
        <a class="back-link" href="#/">← All prototypes</a>
        <header class="prototype-heading"><p class="eyebrow">Prototype 005 · Procedural Generation · V0.1</p><h1>Constraint Generation Lab</h1><p>WFC Core: Collapse + Propagation.<br>A Cell is not empty before generation — it contains several still-valid possibilities.</p></header>
        <section class="demo-panel generation-demo" aria-label="Interactive constraint generation demo"><canvas width="820" height="560"></canvas><div id="generation-stats" class="demo-stats"></div><div id="generation-phase" class="generation-phase ready"></div></section>
        <section class="controls generation-controls"><button id="collapse-step">Collapse Step</button><button id="propagation-step">Propagation Step</button><button id="auto-run" class="secondary">Auto Run</button><button id="restart" class="secondary">Restart</button><label class="seed-control">Seed <input id="seed" type="number" min="1" step="1" value="1337"></label><button id="random-seed" class="secondary compact">Random Seed</button></section>
        <section class="generation-dashboard">
          <div class="generation-panel"><div class="tool-heading"><div><p class="eyebrow">Propagation Queue</p><h2>Cells waiting to spread change</h2></div><span>FIFO · next first</span></div><div id="queue-list" class="queue-list"></div></div>
          <div class="generation-panel debug-panel"><div><p class="eyebrow">Debug View</p><h2>Remaining possibilities</h2></div><label><input id="show-entropy" type="checkbox" checked> Show Entropy</label><label><input id="show-candidates" type="checkbox"> Show Candidates</label><div class="cell-legend"><span class="current">Current</span><span class="changed">Changed</span><span class="queued">Queued</span></div></div>
        </section>
        <section class="compatibility-panel">
          <div><p class="eyebrow">Tile Compatibility</p><h2>Directional local rules</h2><p>The first rule set is symmetric for clarity, but the data explicitly stores Up, Right, Down and Left compatibility.</p></div>
          <div class="compatibility-table" role="table"><div class="rule-row header" role="row"><span>Tile</span>${directions.map((direction) => `<span>${direction.id}</span>`).join("")}</div>${tileTypes.map((tile) => `<div class="rule-row" role="row"><strong style="--tile:${tiles[tile].accent}">${tiles[tile].label}</strong>${directions.map((direction) => `<span>${compatibilityRules[tile][direction.id].map((allowed) => tiles[allowed].shortLabel).join(" · ")}</span>`).join("")}</div>`).join("")}</div>
        </section>
        <section class="recommended-generation"><div><p class="eyebrow">Recommended Experiment</p><h2>Watch one decision travel</h2></div><ol><li><strong>Restart, then Collapse Step:</strong> one minimum-entropy Cell changes from N candidates to one Tile.</li><li><strong>Propagation Step repeatedly:</strong> watch candidates disappear and the FIFO queue grow or drain.</li><li><strong>Restart, then Auto Run:</strong> watch decisions and propagation alternate until the Grid is determined.</li></ol></section>
        <article class="explanation">
          <section><h2>Candidate Sets</h2><pre><code>Cell = { Water, Sand, Grass, Forest } → Entropy = 4</code></pre><p>An uncollapsed Cell is not empty. Its candidate set describes every Tile that is still legal at that position.</p></section>
          <section><h2>Collapse</h2><pre><code>{ Grass, Sand, Forest } → { Sand }</code></pre><p>Collapse is not a physical collapse. It commits one Cell to one currently valid state.</p></section>
          <section><h2>Minimum Entropy</h2><p>V0.1 defines entropy as the number of remaining candidates, not Shannon entropy. Fewer candidates means a Cell is more constrained, so the algorithm resolves a random Cell among those with the lowest entropy first. This heuristic reduces uncertainty; it does not guarantee success.</p></section>
          <section><h2>Constraint Propagation</h2><pre><code>A changes → B loses candidates → B enters the queue → C must re-check</code></pre><p>Every changed candidate set can affect its neighbors. Propagation continues until the queue is empty, allowing local compatibility rules to produce global structure.</p></section>
          <section><h2>WFC Core Pipeline</h2><pre><code>Initialize → Minimum Entropy → Collapse → Propagate until empty → Repeat</code></pre><p>Collapse makes a local decision. Propagation is what carries that decision through the Grid.</p></section>
          <section><h2>Pure Random vs Constraints</h2><p><strong>Pure random placement</strong> chooses every Cell independently and may put Water beside Forest. <strong>Constraint generation</strong> removes incompatible neighbors after every decision: Water permits only Water or Sand beside it.</p></section>
          <section><h2>Contradiction</h2><p>If propagation removes every candidate from a Cell, its entropy becomes zero and the run has failed. Constraint propagation does not guarantee that every random decision succeeds. V0.1 stops and exposes the contradiction instead of backtracking.</p></section>
          <section><h2>Code Structure</h2><pre><code>tiles → definitions&#10;constraints → compatibility&#10;simulation → collapse + FIFO propagation&#10;renderer → read-only state&#10;prototype → auto loop + lifecycle</code></pre></section>
          <section><h2>Related Ideas</h2><p>This queue-based domain revision is related to Constraint Satisfaction and Arc Consistency. V0.1 keeps the implementation concrete rather than introducing a general CSP framework.</p></section>
          <section><h2>Scope and Next Experiments</h2><p>V0.1 excludes backtracking, weighted frequency, Shannon entropy, biomes, overlapping WFC, pattern learning, large maps, 3D and rule editors. Those concepts belong to later focused versions.</p></section>
        </article>
      </main>`;

    const debug: GenerationDebugOptions = { showEntropy: true, showCandidates: false };
    const mounted = mountConstraintGeneration(container.querySelector("canvas")!, debug, container.querySelector("#generation-stats")!, container.querySelector("#queue-list")!, container.querySelector("#generation-phase")!);
    const collapseButton = container.querySelector<HTMLButtonElement>("#collapse-step")!;
    const propagationButton = container.querySelector<HTMLButtonElement>("#propagation-step")!;
    const autoButton = container.querySelector<HTMLButtonElement>("#auto-run")!;
    const seedInput = container.querySelector<HTMLInputElement>("#seed")!;

    const syncButtons = () => {
      const terminal = mounted.simulation.phase === "complete" || mounted.simulation.phase === "contradiction";
      collapseButton.disabled = terminal || mounted.simulation.propagationQueue.length > 0 || mounted.isAutoRunning();
      propagationButton.disabled = terminal || mounted.simulation.propagationQueue.length === 0 || mounted.isAutoRunning();
      autoButton.disabled = terminal;
      autoButton.textContent = mounted.isAutoRunning() ? "Pause Auto" : "Auto Run";
    };
    const restart = (seed = Number(seedInput.value)) => {
      mounted.stopAuto();
      mounted.simulation.restart(seed);
      seedInput.value = String(mounted.simulation.seed);
      syncButtons();
    };
    collapseButton.onclick = () => { mounted.collapseStep(); syncButtons(); };
    propagationButton.onclick = () => { mounted.propagationStep(); syncButtons(); };
    autoButton.onclick = () => { mounted.toggleAuto(); syncButtons(); };
    container.querySelector<HTMLButtonElement>("#restart")!.onclick = () => restart();
    container.querySelector<HTMLButtonElement>("#random-seed")!.onclick = () => { seedInput.value = String(Math.floor(Math.random() * 999999) + 1); restart(); };
    seedInput.onchange = () => restart();
    container.querySelector<HTMLInputElement>("#show-entropy")!.onchange = (event) => { debug.showEntropy = (event.target as HTMLInputElement).checked; };
    container.querySelector<HTMLInputElement>("#show-candidates")!.onchange = (event) => { debug.showCandidates = (event.target as HTMLInputElement).checked; };
    const buttonSyncId = window.setInterval(syncButtons, 100);
    syncButtons();
    return () => { window.clearInterval(buttonSyncId); mounted.destroy(); };
  },
};
