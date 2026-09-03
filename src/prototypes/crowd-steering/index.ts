import type { PrototypeDefinition } from "../../app/types";
import { metadata } from "./metadata";
import { mountCrowdSteering } from "./prototype";
import type { SteeringDebugOptions } from "./renderer";
import type { SteeringSettings } from "./simulation";
import "./style.css";
import { t } from "../../i18n";

const presets: Record<string, Partial<SteeringSettings>> = {
  "seek-only": { agentCount: 40, seekWeight: 1, separationWeight: 0, neighborRadius: 40, separationEnabled: false },
  balanced: { agentCount: 40, seekWeight: 1, separationWeight: 1.8, neighborRadius: 40, separationEnabled: true },
  strong: { agentCount: 40, seekWeight: 1, separationWeight: 4, neighborRadius: 40, separationEnabled: true },
  crowded: { agentCount: 120, seekWeight: 1, separationWeight: 1.8, neighborRadius: 28, separationEnabled: true },
};

export const crowdSteering: PrototypeDefinition = {
  metadata,
  render(container) {
    container.innerHTML = `
      <main class="prototype-page shell">
        <a class="back-link" href="#/">← All prototypes</a>
        <header class="prototype-heading"><p class="eyebrow">Prototype 004 · AI · V0.1.1</p><h1>Crowd Steering Lab</h1><p>Why do many units moving toward one target not collapse into a single point?<br>Combine target-seeking intent with local separation and inspect the result.</p></header>

        <section class="demo-panel steering-demo" aria-label="Interactive crowd steering demo">
          <canvas width="900" height="560"></canvas>
          <div id="steering-stats" class="demo-stats"></div>
          <p class="steering-hint">Click empty space to move the Target. Click an Agent to inspect it.</p>
        </section>

        <section class="controls steering-controls" aria-label="Crowd steering controls">
          <button id="pause">Pause</button><button id="reset" class="secondary">Reset</button>
          <label>Agents <output id="agent-count-value">40</output><input id="agent-count" type="range" min="10" max="150" step="5" value="40"></label>
          <label>Max Speed <output id="max-speed-value">90</output><input id="max-speed" type="range" min="20" max="200" step="5" value="90"></label>
          <label>Max Force <output id="max-force-value">220</output><input id="max-force" type="range" min="20" max="500" step="10" value="220"></label>
          <label>Seek Weight <output id="seek-weight-value">1</output><input id="seek-weight" type="range" min="0" max="3" step="0.1" value="1"></label>
          <label>Separation Weight <output id="separation-weight-value">1.8</output><input id="separation-weight" type="range" min="0" max="5" step="0.1" value="1.8"></label>
          <label>Neighbor Radius <output id="neighbor-radius-value">40</output><input id="neighbor-radius" type="range" min="10" max="100" step="2" value="40"></label>
        </section>

        <section class="steering-tools" aria-label="Experiment and debug tools">
          <div class="steering-tool-group">
            <div class="tool-heading"><div><p class="eyebrow">Core Comparison</p><h2>Separation</h2></div><span>Local steering before collision</span></div>
            <div id="separation-mode" class="segmented-control separation-segments">
              <button data-enabled="false" aria-pressed="false">OFF · Seek only</button>
              <button data-enabled="true" class="active" aria-pressed="true">ON · Seek + Separation</button>
            </div>
          </div>
          <div class="steering-tool-group">
            <div class="tool-heading"><div><p class="eyebrow">Teaching Presets</p><h2>Quick Experiments</h2></div><span>Illustrative, not physical materials</span></div>
            <div class="preset-grid">
              <button data-preset="seek-only">Seek Only</button><button data-preset="balanced" class="active">Balanced</button><button data-preset="strong">Strong Separation</button><button data-preset="crowded">Crowded</button>
            </div>
          </div>
        </section>

        <section class="steering-debug">
          <div><p class="eyebrow">Debug View</p><h2>Decompose the weighted steering</h2></div>
          <label><input id="show-agents" type="checkbox" checked> Show Agents</label>
          <label><input id="show-velocity" type="checkbox"> Show Velocity</label>
          <label><input id="show-seek" type="checkbox"> Show Seek</label>
          <label><input id="show-separation" type="checkbox"> Show Separation</label>
          <label><input id="show-neighbors" type="checkbox"> Show Neighbor Radius</label>
          <label><input id="show-final" type="checkbox"> Show Final Steering</label>
          <div class="vector-legend"><span style="--vector:#7cd7ff">Velocity</span><span style="--vector:#6ee7c7">Seek</span><span style="--vector:#ff8ea1">Separation</span><span style="--vector:#ffcf76">Final</span></div>
        </section>

        <section class="inspector-panel"><div><p class="eyebrow">Selected Agent</p><h2>Local Steering Inspector</h2><p>Enable Neighbor Radius, then hover or select an Agent to reveal which nearby units influence it.</p></div><div id="agent-inspector" class="agent-inspector"></div></section>

        <section class="recommended-steering">
          <div><p class="eyebrow">Recommended Experiment</p><h2>From stacking to local spacing</h2></div>
          <ol><li><strong>Seek Only:</strong> move the Target and watch Agents stack.</li><li><strong>Balanced:</strong> keep the same goal and observe local spacing.</li><li><strong>Strong Separation:</strong> see repulsion compete with target attraction.</li></ol><p>Select one Agent and enable Show Separation. Move the Target so neighbors crowd around it, then watch the vector grow as neighbors get closer.</p>
        </section>

        <article class="explanation">
          <section><h2>What You Are Seeing</h2><p>Every Agent has a position and velocity. Seek tries to align that velocity with the Target; Separation contributes a direction away from neighbors inside the local radius. The weighted, force-limited sum drives the next movement.</p></section>
          <section><h2>Seek</h2><pre><code>desiredVelocity =
  normalize(target - position) * maxSpeed

seek = desiredVelocity - currentVelocity</code></pre><p>Seek adjusts the current motion toward a desired velocity. It is more than directly adding a target direction to position. The small stop radius prevents endless target crossing; gradual Arrival behavior is not implemented in V0.1.</p></section>
          <section><h2>Separation</h2><pre><code>for each nearby neighbor:
  away += normalize(self - neighbor)
        * proximity

closer neighbor → stronger contribution</code></pre><p>Neighbor Radius defines who can influence this local decision. V0.1 checks every Agent pair directly.</p></section>
          <section><h2>Weighted Steering</h2><pre><code>final = seek * seekWeight
      + separation * separationWeight

final    = clamp(final, maxForce)
velocity = clamp(velocity + final * dt, maxSpeed)</code></pre><p>Weights express competing movement goals. Max Force limits how abruptly the current velocity can change.</p></section>
          <section><h2>Separation Is Not Collision</h2><p><strong>Separation</strong> changes motion before units overlap, based on nearby positions. <strong>Collision resolution</strong> reacts after penetration and restores a legal configuration. This Prototype implements the former, not Agent collision.</p></section>
          <section><h2>Pathfinding vs Steering</h2><p><strong>Pathfinding asks “Where should I go?”</strong> A*, NavMesh and Flow Fields provide a route or direction. <strong>Steering asks “How should I move right now?”</strong> A future game may Seek the next path waypoint while Separating from nearby units; V0.1 deliberately uses only one direct Target.</p></section>
          <section><h2>Simulation Pipeline</h2><pre><code>Input → Target
Fixed 60 Hz Simulation:
  Seek + Separation
  → Weighted Sum
  → Clamp Force / Speed
  → Move
Render → read-only state</code></pre></section>
          <section><h2>Current Neighbor Search</h2><p>The direct O(N²) search is intentional at 10–150 Agents: it keeps the Steering rule readable. Spatial Hash, Quadtree and BVH are valuable optimizations, but each deserves its own experiment.</p></section>
          <section><h2>Scope and Next Experiments</h2><p>V0.1 excludes Arrival, Cohesion, Alignment, Flocking, obstacles, RVO/ORCA, formations and Flow Field integration. Later versions may introduce those topics only when the experiment naturally expands.</p></section>
        </article>
      </main>`;

    const settings: SteeringSettings = {
      agentCount: 40,
      maxSpeed: 90,
      maxForce: 220,
      seekWeight: 1,
      separationWeight: 1.8,
      neighborRadius: 40,
      separationEnabled: true,
    };
    const debug: SteeringDebugOptions = {
      showAgents: true,
      showVelocity: false,
      showSeek: false,
      showSeparation: false,
      showNeighborRadius: false,
      showFinalSteering: false,
    };

    const agentCount = container.querySelector<HTMLInputElement>("#agent-count")!;
    const agentCountValue = container.querySelector<HTMLOutputElement>("#agent-count-value")!;
    const mounted = mountCrowdSteering(
      container.querySelector("canvas")!,
      settings,
      debug,
      container.querySelector("#steering-stats")!,
      container.querySelector("#agent-inspector")!,
      (count) => {
        agentCount.value = String(count);
        agentCountValue.value = String(count);
      },
    );

    const numericControls: Array<[string, keyof SteeringSettings]> = [
      ["max-speed", "maxSpeed"],
      ["max-force", "maxForce"],
      ["seek-weight", "seekWeight"],
      ["separation-weight", "separationWeight"],
      ["neighbor-radius", "neighborRadius"],
    ];
    numericControls.forEach(([id, key]) => {
      const input = container.querySelector<HTMLInputElement>(`#${id}`)!;
      const output = container.querySelector<HTMLOutputElement>(`#${id}-value`)!;
      input.oninput = () => {
        Object.assign(settings, { [key]: Number(input.value) });
        output.value = input.value;
      };
    });
    agentCount.oninput = () => {
      mounted.simulation.setAgentCount(Number(agentCount.value));
      agentCountValue.value = agentCount.value;
    };

    const separationButtons = [...container.querySelectorAll<HTMLButtonElement>("[data-enabled]")];
    const setSeparation = (enabled: boolean) => {
      settings.separationEnabled = enabled;
      separationButtons.forEach((button) => {
        const selected = (button.dataset.enabled === "true") === enabled;
        button.classList.toggle("active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
    };
    separationButtons.forEach((button) => {
      button.onclick = () => setSeparation(button.dataset.enabled === "true");
    });

    const syncControls = () => {
      numericControls.forEach(([id, key]) => {
        const input = container.querySelector<HTMLInputElement>(`#${id}`)!;
        const value = String(settings[key]);
        input.value = value;
        container.querySelector<HTMLOutputElement>(`#${id}-value`)!.value = value;
      });
      agentCount.value = String(settings.agentCount);
      agentCountValue.value = String(settings.agentCount);
      setSeparation(settings.separationEnabled);
    };
    container.querySelectorAll<HTMLButtonElement>("[data-preset]").forEach((button) => {
      button.onclick = () => {
        Object.assign(settings, presets[button.dataset.preset!]);
        syncControls();
        mounted.reset();
        container.querySelectorAll<HTMLButtonElement>("[data-preset]").forEach((item) => {
          item.classList.toggle("active", item === button);
        });
      };
    });

    const debugControls: Array<[string, keyof SteeringDebugOptions]> = [
      ["show-agents", "showAgents"],
      ["show-velocity", "showVelocity"],
      ["show-seek", "showSeek"],
      ["show-separation", "showSeparation"],
      ["show-neighbors", "showNeighborRadius"],
      ["show-final", "showFinalSteering"],
    ];
    debugControls.forEach(([id, key]) => {
      container.querySelector<HTMLInputElement>(`#${id}`)!.onchange = (event) => {
        debug[key] = (event.target as HTMLInputElement).checked;
      };
    });

    const pause = container.querySelector<HTMLButtonElement>("#pause")!;
    pause.onclick = () => {
      pause.textContent = mounted.togglePause() ? t("common.resume") : t("common.pause");
    };
    container.querySelector<HTMLButtonElement>("#reset")!.onclick = mounted.reset;
    return mounted.destroy;
  },
};
