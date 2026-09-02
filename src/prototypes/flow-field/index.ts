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
        <section class="demo-panel flow-demo"><canvas width="900" height="600"></canvas><div id="flow-stats" class="demo-stats"></div></section>
        <section class="controls flow-controls">
          <button id="pause">Pause</button><button id="reset" class="secondary">Reset</button>
          <label>Agents <output id="agents-value">100</output><input id="agents" type="range" min="10" max="500" step="10" value="100"></label>
          <label>Speed <output id="speed-value">70</output><input id="speed" type="range" min="20" max="150" step="5" value="70"></label>
          <label>Interaction Mode<select id="interaction"><option value="target">Set Target</option><option value="obstacle">Paint Obstacle</option><option value="erase">Erase Obstacle</option><option value="spawn">Spawn 20 Agents</option></select></label>
          <label>View Mode<select id="view"><option value="normal">Normal</option><option value="cost">Cost Field</option><option value="integration">Integration Field</option><option value="direction">Direction Field</option></select></label>
          <label class="check"><input id="show-agents" type="checkbox" checked> Show Agents</label>
        </section>
        <div class="flow-legend"><span style="--legend:#6ee7c7">Agents</span><span style="--legend:#ffbe55">Shared target</span><span style="--legend:#29344a">Obstacle</span><span style="--legend:#7cd7ff">Direction</span></div>
        <article class="explanation">
          <section><h2>What You Are Seeing</h2><p>Instead of Agent 1 → A*, Agent 2 → A*, and so on, the target builds one shared field. Every agent then asks only: “Which direction does my current cell point?”</p></section>
          <section><h2>Core Idea</h2><p><strong>Cost</strong> says what a cell costs to enter. <strong>Integration</strong> says the total cost from that cell to the target. <strong>Direction</strong> points to the neighbor with the lowest integration value.</p></section>
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
          <section><h2>Implementation</h2><p>The 36×24 grid uses eight neighbors. Straight movement costs 1 and diagonal movement costs √2; corner cutting through walls is forbidden. Map edits rebuild the whole field instantly. Agents move on a fixed 60 Hz simulation step and rendering is read-only.</p></section>
          <section><h2>Code Structure</h2><p><code>grid.ts</code> owns coordinates and neighbors; <code>flow-field.ts</code> builds integration and direction; <code>simulation.ts</code> moves agents and rebuilds fields; <code>renderer.ts</code> displays normal and debug views.</p></section>
          <section><h2>Parameters to Play With</h2><p>Set a new target and watch every agent turn. Paint a wall across the current route, inspect Integration costs, then switch to Direction arrows. Raise the count to 500 to see one field remain shared.</p></section>
          <section><h2>When It Fits</h2><p>Flow fields are strong when many units share a goal. If every unit has a completely different target, repeatedly rebuilding separate full-map fields may cost more than individual path searches.</p></section>
          <section><h2>Common Alternatives</h2><p>A* finds a focused single path; Dijkstra explores by cost; NavMesh handles continuous walkable space; hierarchical A* reduces large-map search; steering handles local movement rather than global routing.</p></section>
          <section><h2>Where Games Use This</h2><p>RTS armies, tower-defense enemies, zombie hordes, large crowds and mass enemy AI.</p></section>
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
    container.querySelector<HTMLSelectElement>("#interaction")!.onchange = (event) => { state.mode = (event.target as HTMLSelectElement).value as InteractionMode; };
    container.querySelector<HTMLSelectElement>("#view")!.onchange = (event) => { state.view = (event.target as HTMLSelectElement).value as FieldView; };
    container.querySelector<HTMLInputElement>("#show-agents")!.onchange = (event) => { state.showAgents = (event.target as HTMLInputElement).checked; };
    const pause = container.querySelector<HTMLButtonElement>("#pause")!;
    pause.onclick = () => { mounted.togglePause(); pause.textContent = mounted.isPaused() ? "Resume" : "Pause"; };
    container.querySelector<HTMLButtonElement>("#reset")!.onclick = mounted.reset;
    return mounted.destroy;
  },
};
