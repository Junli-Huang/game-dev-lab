import type { PrototypeDefinition } from "../../app/types";
import "./style.css";
import { metadata } from "./metadata";
import { mountVerletRope } from "./prototype";
import type { DebugOptions } from "./renderer";
import type { RopeSettings } from "./simulation";

const iterationChoices = [1, 2, 4, 8, 16, 32];

export const verletRope: PrototypeDefinition = {
  metadata,
  render(container) {
    container.innerHTML = `
      <main class="prototype-page shell">
        <a class="back-link" href="#/">← All prototypes</a>
        <header class="prototype-heading"><p class="eyebrow">Prototype 001 · ${metadata.category} · V0.2.1</p><h1>${metadata.title}</h1><p>${metadata.description}<br>Use a rope to separate position prediction from position-based constraint correction.</p></header>
        <section class="demo-panel rope-demo" aria-label="Interactive position-based rope demo"><canvas width="900" height="560"></canvas><div id="prediction-badge" class="prediction-badge" hidden><strong>Predicted Positions</strong><span>Constraints NOT solved yet</span></div><div id="rope-stats" class="demo-stats"></div><p class="demo-hint">Drag a round particle sideways, then compare solver iterations.</p></section>

        <section class="controls rope-controls" aria-label="Simulation controls">
          <button id="pause">Pause</button><button id="step" class="secondary" disabled>Frame Step</button><button id="solver-step" class="secondary" disabled>Solver Step</button><button id="reset" class="secondary">Reset Rope</button>
          <label>Gravity <output id="gravity-value">900</output><input id="gravity" type="range" min="0" max="2400" step="100" value="900"><small>Downward acceleration</small></label>
          <label>Points <output id="points-value">20</output><input id="points" type="range" min="5" max="50" value="20"><small>Rebuilds on release</small></label>
          <label>Segment <output id="segment-value">20</output><input id="segment" type="range" min="8" max="30" value="20"><small>Rest length in pixels</small></label>
        </section>

        <section class="solver-panel" aria-label="Constraint solver experiment">
          <div class="solver-heading"><div><p class="eyebrow">PBD Constraint Experiment</p><h2>Constraint Iterations</h2></div><p>Repeat the same positional correction within one physics step. More passes usually reduce remaining distance error; they are not a material stiffness value.</p></div>
          <div id="iteration-buttons" class="segmented-control iteration-segments" role="group" aria-label="Constraint iterations">
            ${iterationChoices.map((value) => `<button type="button" data-iterations="${value}">${value}</button>`).join("")}
          </div>
          <div class="preset-row" role="group" aria-label="Experiment presets">
            <button type="button" class="secondary" data-preset="loose">Loose Solver</button>
            <button type="button" class="secondary" data-preset="normal">Normal Rope</button>
            <button type="button" class="secondary" data-preset="tight">Tight Solver</button>
            <button type="button" class="secondary" data-preset="heavy">Heavy Gravity</button>
          </div>
          <div class="convergence-panel"><div><strong>Error Convergence</strong><small>Average error in the current physics step</small></div><div id="solver-history" class="solver-history"></div></div>
        </section>

        <section class="debug-controls"><div><p class="eyebrow">Teaching Debug View</p><h2>See the hidden state</h2></div><label class="check"><input id="show-points" type="checkbox" checked> Show Particles</label><label class="check"><input id="show-constraints" type="checkbox"> Show Constraints</label><label class="check"><input id="show-previous" type="checkbox"> Show Previous Position</label><label class="check"><input id="show-velocity" type="checkbox"> Show Velocity</label><label class="check"><input id="show-error" type="checkbox"> Show Constraint Error</label><p class="debug-note"><strong>○ Previous:</strong> shown at 5× scale for readability at 120 Hz. <strong>→ Velocity:</strong> enlarged fixed-step displacement, capped at 50px. <strong>Δ Error:</strong> remaining absolute difference between current and rest length. Debug overlays never modify simulation state.</p></section>

        <article class="explanation">
          <section class="pipeline-card"><h2>Simulation Pipeline</h2><div class="pipeline"><span>Verlet Integration<br><small>predict positions</small></span><b>↓</b><span>PBD Constraints<br><small>correct positions</small></span><b>↓</b><span>Repeat N Passes<br><small>reduce error</small></span><b>↓</b><span>Render<br><small>read-only</small></span></div></section>
          <section><h2>What Each Part Solves</h2><p>Verlet predicts where particles move from their fixed-step displacement and acceleration. The PBD-style solver then directly corrects predicted positions that violate distance, pin, kinematic-drag, or collision constraints. They are cooperating stages, not competing rope algorithms.</p></section>
          <section><h2>Verlet Integration</h2><pre><code>motion = position - previousPosition
previousPosition = position
position += motion + acceleration * dt²</code></pre><p><code>position - previousPosition</code> is the displacement that encodes velocity in this fixed-step simulation.</p></section>
          <section><h2>Position-Based Dynamics</h2><pre><code>predict positions
apply constraints
correct positions
repeat</code></pre><p>PBD does not first require an exact constraint force. It directly moves positions toward a legal configuration.</p></section>
          <section><h2>Distance Constraint</h2><p>For neighbors A and B, the solver compares their current distance with rest length L. Two dynamic particles share the correction; a particle paired with a pinned or dragged point takes the whole correction.</p><pre><code>error = distance(A, B) - L
correctPositions(A, B, error)</code></pre></section>
          <section><h2>Why Iterations Matter</h2><p>Correcting one segment can disturb its neighbor. Repeating the pass lets errors propagate through the chain and converge. In classic PBD, iteration count affects how completely constraints are satisfied, which can look like a change in stiffness: <code>Iterations ↑ → Error ↓</code>.</p></section>
          <section><h2>Run the Experiment</h2><p>Choose Loose Solver, pull the middle particle sideways, and watch Avg/Max Error. Pause and use Frame Step to inspect one complete 1/120-second simulation step. Then switch to Tight Solver and compare the measured error rather than judging only by feel.</p></section>
          <section><h2>Solver Step</h2><p>Pause, then click Solver Step. The first click runs only Verlet prediction and shows the unsolved positions. Every later click applies exactly one complete constraint pass. The history records real error after Prediction, Pass 1, Pass 2, and so on—without forcing the values to decrease.</p></section>
          <section><h2>Code Structure</h2><p><code>verlet-point.ts</code> stores particle state; <code>constraint.ts</code> applies distance correction; <code>simulation.ts</code> owns integration, constraint passes, collision and error measurement; <code>renderer.ts</code> draws read-only debug overlays; <code>prototype.ts</code> owns input and the fixed loop.</p></section>
          <section><h2>Next Experiments</h2><p>V0.3 can add a bending constraint for hair, tails, tentacles and vines. V0.4 can compare classic PBD with XPBD, focusing on compliance and why classic PBD behavior depends on iterations and timestep.</p></section>
        </article>
      </main>`;

    const settings: RopeSettings = { gravity: 900, pointCount: 20, segmentLength: 20, iterations: 8 };
    const debug: DebugOptions = { showPoints: true, showConstraints: false, showPrevious: false, showVelocity: false, showConstraintError: false };
    const simulation = mountVerletRope(
      container.querySelector("canvas")!,
      settings,
      debug,
      container.querySelector("#rope-stats")!,
      container.querySelector("#prediction-badge")!,
      container.querySelector("#solver-history")!,
    );

    const bindRange = (id: string, key: keyof RopeSettings, rebuild = false) => {
      const input = container.querySelector<HTMLInputElement>(`#${id}`)!;
      const output = container.querySelector<HTMLOutputElement>(`#${id}-value`)!;
      input.oninput = () => {
        settings[key] = Number(input.value);
        output.value = input.value;
        simulation.resetPartialStep();
      };
      if (rebuild) input.onchange = simulation.rebuild;
    };
    bindRange("gravity", "gravity");
    bindRange("points", "pointCount", true);
    bindRange("segment", "segmentLength", true);

    const iterationButtons = [...container.querySelectorAll<HTMLButtonElement>("[data-iterations]")];
    const selectIterations = (iterations: number) => {
      settings.iterations = iterations;
      iterationButtons.forEach((button) => button.classList.toggle("active", Number(button.dataset.iterations) === iterations));
      simulation.resetPartialStep();
    };
    iterationButtons.forEach((button) => { button.onclick = () => selectIterations(Number(button.dataset.iterations)); });
    selectIterations(settings.iterations);

    const gravityInput = container.querySelector<HTMLInputElement>("#gravity")!;
    const gravityOutput = container.querySelector<HTMLOutputElement>("#gravity-value")!;
    const applyPreset = (iterations: number, gravity: number) => {
      selectIterations(iterations);
      settings.gravity = gravity;
      gravityInput.value = String(gravity);
      gravityOutput.value = String(gravity);
      simulation.rebuild();
    };
    const presets: Record<string, [number, number]> = { loose: [1, 900], normal: [8, 900], tight: [32, 900], heavy: [4, 2400] };
    container.querySelectorAll<HTMLButtonElement>("[data-preset]").forEach((button) => {
      button.onclick = () => applyPreset(...presets[button.dataset.preset!]);
    });

    const bindDebug = (id: string, key: keyof DebugOptions) => {
      container.querySelector<HTMLInputElement>(`#${id}`)!.onchange = (event) => { debug[key] = (event.target as HTMLInputElement).checked; };
    };
    bindDebug("show-points", "showPoints");
    bindDebug("show-constraints", "showConstraints");
    bindDebug("show-previous", "showPrevious");
    bindDebug("show-velocity", "showVelocity");
    bindDebug("show-error", "showConstraintError");

    const pause = container.querySelector<HTMLButtonElement>("#pause")!;
    const step = container.querySelector<HTMLButtonElement>("#step")!;
    const solverStep = container.querySelector<HTMLButtonElement>("#solver-step")!;
    pause.onclick = () => {
      simulation.togglePause();
      const paused = simulation.isPaused();
      pause.textContent = paused ? "Resume" : "Pause";
      step.disabled = !paused;
      solverStep.disabled = !paused;
    };
    step.onclick = () => simulation.stepFrame();
    solverStep.onclick = () => simulation.stepSolver();
    container.querySelector<HTMLButtonElement>("#reset")!.onclick = simulation.rebuild;
    return simulation.destroy;
  },
};
