import type { PrototypeDefinition } from "../../app/types";
import "./style.css";
import { metadata } from "./metadata";
import { mountVerletRope } from "./prototype";
import type { DebugOptions } from "./renderer";
import type { RopeSettings } from "./simulation";

export const verletRope: PrototypeDefinition = {
  metadata,
  render(container) {
    container.innerHTML = `
      <main class="prototype-page shell">
        <a class="back-link" href="#/">← All prototypes</a>
        <header class="prototype-heading"><p class="eyebrow">Prototype 001 · ${metadata.category}</p><h1>${metadata.title}</h1><p>${metadata.description}<br>通过位置积分与距离约束，模拟自然摆动的绳子。</p></header>
        <section class="demo-panel rope-demo" aria-label="Interactive Verlet rope demo"><canvas width="900" height="560"></canvas><div id="rope-stats" class="demo-stats"></div><p class="demo-hint">Drag any round rope point, then release it.</p></section>
        <section class="controls rope-controls" aria-label="Simulation controls">
          <button id="pause">Pause</button><button id="reset" class="secondary">Reset Rope</button>
          <label>Gravity <output id="gravity-value">900</output><input id="gravity" type="range" min="0" max="1500" step="50" value="900"><small>Downward acceleration</small></label>
          <label>Points <output id="points-value">20</output><input id="points" type="range" min="5" max="50" value="20"><small>Rebuilds on release</small></label>
          <label>Segment <output id="segment-value">20</output><input id="segment" type="range" min="8" max="30" value="20"><small>Rest length in pixels</small></label>
          <label>Iterations <output id="iterations-value">5</output><input id="iterations" type="range" min="1" max="15" value="5"><small>Accuracy versus work</small></label>
        </section>
        <section class="debug-controls"><div><p class="eyebrow">Teaching Debug View</p><h2>See the hidden state</h2></div><label class="check"><input id="show-points" type="checkbox" checked> Show Points</label><label class="check"><input id="show-constraints" type="checkbox"> Show Constraints</label><label class="check"><input id="show-previous" type="checkbox"> Show Previous Position</label><label class="check"><input id="show-velocity" type="checkbox"> Show Velocity</label></section>
        <article class="explanation">
          <section><h2>What You Are Seeing</h2><p>This is not a chain of rigid bodies and joints. It is a list of points, each storing a current and previous position, plus fixed-distance rules between neighbors. The square point is static/pinned. A point held by the mouse temporarily becomes kinematic.</p></section>
          <section><h2>Core Idea</h2><p><code>position - previousPosition</code> is the displacement that encodes velocity in this fixed-step Verlet simulation. The rope itself emerges because the solver repeatedly forces every neighboring pair toward the same segment length.</p></section>
          <section><h2>Minimal Algorithm</h2><pre><code>const velocity = position - previousPosition;
previousPosition = position;
position += velocity + gravity * dt * dt;

const error = distance(a, b) - targetLength;
correctPositions(a, b, error);</code></pre></section>
          <section><h2>Implementation</h2><p>Real time is accumulated into fixed 1/120-second physics steps. Dynamic points are controlled by physics, the pinned point is static, and a dragged point is kinematic: input records a target while the simulation owns the actual write. Every solver pass treats that point as immovable, preventing the mouse and constraints from fighting.</p></section>
          <section><h2>Code Structure</h2><p><code>verlet-point.ts</code> stores state; <code>constraint.ts</code> corrects distances; <code>simulation.ts</code> coordinates integration and collision; <code>renderer.ts</code> reads state without changing it; <code>prototype.ts</code> handles interaction and lifecycle.</p></section>
          <section><h2>Parameters to Play With</h2><p>Compare Iterations 1 and 10 after pulling the middle sideways. The velocity arrows visualize <code>currentPosition - previousPosition</code>: fixed-step displacement rather than pixels per second. Increase the point count for smoother bending, or change segment length and reset.</p></section>
          <section><h2>Common Alternatives</h2><p>Rigid bodies with joints, spring–mass systems, general Position Based Dynamics and XPBD. Verlet plus distance constraints is useful, but it is not the only rope model.</p></section>
          <section><h2>Where Games Use This</h2><p>Ropes, chains, cables, hair, tentacles, cloth, spider webs and simple soft bodies all reuse variations of points connected by constraints.</p></section>
          <section><h2>Next Experiments</h2><p>Add throw-on-release by converting pointer motion into implicit Verlet velocity; then try multiple pins, cutting, circle collision, weights, wind, self-collision, cloth, or XPBD.</p></section>
        </article>
      </main>`;
    const settings: RopeSettings = { gravity: 900, pointCount: 20, segmentLength: 20, iterations: 5 };
    const debug: DebugOptions = { showPoints: true, showConstraints: false, showPrevious: false, showVelocity: false };
    const simulation = mountVerletRope(container.querySelector("canvas")!, settings, debug, container.querySelector("#rope-stats")!);
    const bindRange = (id: string, key: keyof RopeSettings, rebuild = false) => {
      const input = container.querySelector<HTMLInputElement>(`#${id}`)!;
      const output = container.querySelector<HTMLOutputElement>(`#${id}-value`)!;
      input.oninput = () => { settings[key] = Number(input.value); output.value = input.value; };
      if (rebuild) input.onchange = simulation.rebuild;
    };
    bindRange("gravity", "gravity"); bindRange("points", "pointCount", true); bindRange("segment", "segmentLength", true); bindRange("iterations", "iterations");
    const bindDebug = (id: string, key: keyof DebugOptions) => { container.querySelector<HTMLInputElement>(`#${id}`)!.onchange = (event) => { debug[key] = (event.target as HTMLInputElement).checked; }; };
    bindDebug("show-points", "showPoints"); bindDebug("show-constraints", "showConstraints"); bindDebug("show-previous", "showPrevious"); bindDebug("show-velocity", "showVelocity");
    const pause = container.querySelector<HTMLButtonElement>("#pause")!;
    pause.onclick = () => { simulation.togglePause(); pause.textContent = simulation.isPaused() ? "Resume" : "Pause"; };
    container.querySelector<HTMLButtonElement>("#reset")!.onclick = simulation.rebuild;
    return simulation.destroy;
  },
};
