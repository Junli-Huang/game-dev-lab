import type { PrototypeDefinition } from "../../app/types";
import { metadata } from "./metadata";
import { mountFlowField, type InteractionMode } from "./prototype";
import type { FieldView } from "./renderer";
import "./style.css";

export const flowField: PrototypeDefinition = {
  metadata,
  render(container) {
    container.innerHTML = `
      <main class="prototype-page shell">
        <a class="back-link" href="#/">← All prototypes</a>
        <header class="prototype-heading"><p class="eyebrow">Prototype 002 · AI</p><h1>Flow Field Pathfinding</h1><p>Build one shared navigation field, then let hundreds of agents query their local direction.</p></header>
        <section class="demo-panel flow-demo"><canvas width="900" height="600"></canvas><div id="flow-stats" class="demo-stats"></div><p class="flow-hint">Click to set the target, or move it with WASD / Arrow Keys. Choose Spawn Agents, then hold and drag to paint agents into the field.</p></section>
        <section class="controls flow-controls">
          <button id="pause">Pause</button><button id="reset" class="secondary">Reset</button>
          <label>Agents <output id="agents-value">100</output><input id="agents" type="range" min="10" max="500" step="10" value="100"></label>
          <label>Speed <output id="speed-value">70</output><input id="speed" type="range" min="20" max="150" step="5" value="70"></label>
          <label class="check"><input id="show-agents" type="checkbox" checked> Show Agents</label>
        </section>
        <section class="flow-tool-panels" aria-label="Flow Field tools">
          <div class="flow-tool-group">
            <div class="flow-tool-heading"><p class="eyebrow">Interaction</p><span>What the pointer changes</span></div>
            <div id="interaction" class="segmented-control interaction-segments">
              <button data-value="target" class="active" aria-pressed="true" title="Target — Click a walkable cell to set the shared target">Target</button>
              <button data-value="obstacle" aria-pressed="false" title="Obstacle — Paint unwalkable cells">Obstacle</button>
              <button data-value="erase" aria-pressed="false" title="Erase — Remove obstacles while preserving underlying terrain cost">Erase</button>
              <button data-value="mud" aria-pressed="false" title="Mud — Paint movement cost 4">Mud</button>
              <button data-value="terrain" aria-pressed="false" title="Normal — Restore movement cost 1">Normal</button>
              <button data-value="spawn" aria-pressed="false" title="Spawn — Hold and drag to create agents at 30 per second">Spawn</button>
            </div>
          </div>
          <div class="flow-tool-group">
            <div class="flow-tool-heading"><p class="eyebrow">Debug View</p><span>How field data is displayed</span></div>
            <div id="view" class="segmented-control view-segments">
              <button data-value="normal" class="active" aria-pressed="true" title="Normal — Map, target, terrain and agents">Normal</button>
              <button data-value="cost" aria-pressed="false" title="Cost — Cost to enter each cell: 1, 4, or ∞">Cost</button>
              <button data-value="integration" aria-pressed="false" title="Integration — Accumulated traversal cost to the target">Integration</button>
              <button data-value="direction" aria-pressed="false" title="Direction — Local direction selected for each cell">Direction</button>
            </div>
          </div>
        </section>
        <div class="flow-legend"><span style="--legend:#6ee7c7">Agents</span><span style="--legend:#ffbe55">Shared target</span><span style="--legend:#60452f">Mud · Cost 4</span><span style="--legend:#29344a">Obstacle</span><span style="--legend:#7cd7ff">Direction</span></div>
        <article class="explanation">
          <section><h2>What You Are Seeing</h2><p>Instead of Agent 1 → A*, Agent 2 → A*, and so on, the target builds one shared field. Every agent then asks only: “Which direction does my current cell point?”</p></section>
          <section><h2>Core Idea</h2><p><strong>movementCost is the cost of entering a cell.</strong> Integration accumulates that traversal cost, and Direction chooses the neighboring step with the lowest edge cost plus remaining integration cost. A short route through 5 Mud cells costs 5×4 = 20, while 8 Normal cells cost 8×1 = 8—so the longer route wins.</p></section>
          <section><h2>Minimal Algorithm</h2><pre><code>integration[target] = 0;
while (frontier.length) {
  const current = popLowest(frontier);
  for (const neighbor of neighbors(current)) {
    relax(current, neighbor);
  }
}

cell.direction = directionTo(
  neighborWithLowestIntegration(cell)
);

agent.position +=
  field.cellAt(agent.position).direction * speed * dt;</code></pre></section>
          <section><h2>Implementation</h2><p>Normal cells cost 1 to enter and Mud costs 4. The 36×24 grid uses eight neighbors: straight travel multiplies cost by 1 and diagonal travel by √2. Map or terrain edits rebuild the shared field instantly.</p></section>
          <section><h2>Code Structure</h2><p><code>grid.ts</code> owns coordinates and neighbors; <code>flow-field.ts</code> builds integration and direction; <code>simulation.ts</code> moves agents and rebuilds fields; <code>renderer.ts</code> displays normal and debug views.</p></section>
          <section><h2>Parameters to Play With</h2><p>Paint Mud across a route and watch the whole crowd choose a longer but cheaper path; erase it to restore the direct route. Cost shows 1, 4, and ∞, while Integration exposes the accumulated result.</p></section>
          <section><h2>Cost Is Not Speed</h2><p>Mud affects pathfinding preference only. Agents do not read terrain and do not move slower on Mud—the penalty is already precomputed into the shared Flow Field.</p></section>
          <section><h2>When It Fits</h2><p>Flow fields are strong when many units share a goal. If every unit has a completely different target, repeatedly rebuilding separate full-map fields may cost more than individual path searches.</p></section>
          <section><h2>Common Alternatives</h2><p>A* finds a focused single path; Dijkstra explores by cost; NavMesh handles continuous walkable space; hierarchical A* reduces large-map search; steering handles local movement rather than global routing.</p></section>
          <section><h2>Where Games Use This</h2><p>RTS armies, tower-defense enemies, zombie hordes, large crowds and mass enemy AI.</p></section>
          <section><h2>Known Limitation</h2><p>V0.1 agents follow cell directions without local collision, steering or avoidance. They may overlap and can behave poorly near cell boundaries; those are deliberately separate crowd-movement problems.</p></section>
          <section><h2>Next Experiments</h2><p>Terrain weights, dynamic obstacles, multiple targets, separation, local avoidance, field blending, hierarchical fields and incremental rebuilds.</p></section>
        </article>
      </main>`;
    const settings = { agentCount: 100, agentSpeed: 70 };
    const state: { mode: InteractionMode; view: FieldView; showAgents: boolean } = { mode: "target", view: "normal", showAgents: true };
    const agents = container.querySelector<HTMLInputElement>("#agents")!;
    const agentsValue = container.querySelector<HTMLOutputElement>("#agents-value")!;
    const mounted = mountFlowField(container.querySelector("canvas")!, settings, state, container.querySelector("#flow-stats")!, (count) => { agents.value = String(count); agentsValue.value = String(count); });
    agents.oninput = () => { agentsValue.value = agents.value; mounted.simulation.setAgentCount(Number(agents.value)); };
    const speed = container.querySelector<HTMLInputElement>("#speed")!;
    speed.oninput = () => { settings.agentSpeed = Number(speed.value); container.querySelector<HTMLOutputElement>("#speed-value")!.value = speed.value; };
    const bindSegments = <T extends string>(id: string, onChange: (value: T) => void) => {
      const control = container.querySelector<HTMLElement>(`#${id}`)!;
      control.onclick = (event) => {
        const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
        if (!button?.dataset.value) return;
        control.querySelectorAll("button").forEach((item) => {
          const selected = item === button;
          item.classList.toggle("active", selected);
          item.setAttribute("aria-pressed", String(selected));
        });
        onChange(button.dataset.value as T);
      };
    };
    bindSegments<InteractionMode>("interaction", (value) => { state.mode = value; });
    bindSegments<FieldView>("view", (value) => { state.view = value; });
    container.querySelector<HTMLInputElement>("#show-agents")!.onchange = (event) => { state.showAgents = (event.target as HTMLInputElement).checked; };
    const pause = container.querySelector<HTMLButtonElement>("#pause")!;
    pause.onclick = () => { mounted.togglePause(); pause.textContent = mounted.isPaused() ? "Resume" : "Pause"; };
    container.querySelector<HTMLButtonElement>("#reset")!.onclick = mounted.reset;
    return mounted.destroy;
  },
};
