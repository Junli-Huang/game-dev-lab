import type { PrototypeDefinition } from "../../app/types";
import { metadata } from "./metadata";
import { mountSdfPlayground } from "./prototype";
import { defaultSdfState, type ApplicationMode, type SdfOperation, type SdfView } from "./state";
import "./style.css";

export const sdfPlayground: PrototypeDefinition = {
  metadata,
  render(container) {
    container.innerHTML = `
      <main class="prototype-page shell">
        <a class="back-link" href="#/">← All prototypes</a>
        <header class="prototype-heading"><p class="eyebrow">Prototype 003 · Rendering</p><h1>SDF Playground</h1><p>Every pixel asks: “How far am I from the nearest shape boundary?” Drag the Circle and Box to explore.</p></header>
        <section class="demo-panel sdf-demo"><canvas width="900" height="560"></canvas><div id="sdf-status" class="sdf-status"></div><div id="sdf-probe" class="sdf-probe"></div><div id="sdf-error" class="sdf-error" hidden></div></section>
        <section class="controls sdf-controls">
          <label>Circle Radius <output id="radius-value">0.28</output><input id="radius" type="range" min="0.08" max="0.55" step="0.01" value="0.28"></label>
          <label>Box Half Width <output id="box-width-value">0.25</output><input id="box-width" type="range" min="0.06" max="0.50" step="0.01" value="0.25"></label>
          <label>Box Half Height <output id="box-height-value">0.18</output><input id="box-height" type="range" min="0.06" max="0.45" step="0.01" value="0.18"></label>
          <label>Outline Width <output id="outline-value">0.015</output><input id="outline" type="range" min="0" max="0.08" step="0.005" value="0.015"></label>
          <label>Glow Width <output id="glow-value">0.12</output><input id="glow" type="range" min="0.01" max="0.35" step="0.01" value="0.12"></label>
          <label>Edge Softness <output id="softness-value">0.008</output><input id="softness" type="range" min="0.001" max="0.04" step="0.001" value="0.008"></label>
          <label>Smooth Union Blend <output id="smoothness-value">0.12</output><input id="smoothness" type="range" min="0.01" max="0.40" step="0.01" value="0.12"></label>
        </section>
        <section class="sdf-application-panel">
          <div class="flow-tool-heading"><p class="eyebrow">Application</p><span>What the same distance function means in a game</span></div>
          <div id="application" class="segmented-control sdf-application">
            <button data-value="playground" aria-pressed="false" title="Playground — Explore primitives, booleans and raw distance">Playground</button>
            <button data-value="ui-outline" class="active" aria-pressed="true" title="UI Outline — One distance creates fill, outline, glow and soft edges">UI Outline</button>
            <button data-value="spell-area" aria-pressed="false" title="Spell Area — Drag the Player and query range, sign and falloff">Spell Area</button>
            <button data-value="metaball" aria-pressed="false" title="Metaball — Compare hard Union with Smooth Union">Metaball</button>
            <button data-value="collision" aria-pressed="false" title="Collision Probe — Drag the Player to inspect surface distance and penetration">Collision Probe</button>
          </div>
        </section>
        <section class="sdf-tool-panels">
          <div class="sdf-tool-group"><p class="eyebrow">Operation</p><div id="operation" class="segmented-control sdf-operation">
            <button data-value="circle" aria-pressed="false" title="Circle — Evaluate only sdCircle">Circle</button>
            <button data-value="box" aria-pressed="false" title="Box — Evaluate only sdBox">Box</button>
            <button data-value="union" class="active" aria-pressed="true" title="Union — min(circle, box)">Union</button>
            <button data-value="intersection" aria-pressed="false" title="Intersection — max(circle, box)">Intersection</button>
            <button data-value="subtract" aria-pressed="false" title="Subtract — Circle minus Box">Subtract</button>
            <button data-value="smooth-union" aria-pressed="false" title="Smooth Union — Smooth minimum blend">Smooth Union</button>
          </div></div>
          <div class="sdf-tool-group"><p class="eyebrow">Debug View</p><div id="sdf-view" class="segmented-control sdf-view">
            <button data-value="normal" class="active" aria-pressed="true" title="Normal — Fill, outline, glow and soft edge">Normal</button>
            <button data-value="distance" aria-pressed="false" title="Distance — Signed distance colors and bands">Distance</button>
            <button data-value="sign" aria-pressed="false" title="Sign — Negative inside, positive outside">Sign</button>
            <button data-value="contour" aria-pressed="false" title="Contour — Equal-distance lines">Contour</button>
          </div></div>
        </section>
        <article class="explanation">
          <section><h2>What You Are Seeing</h2><p>SDF is a function <code>f(position) → signed distance</code>. The Application changes what that distance means; Debug View reveals the same underlying field as Normal, Distance, Sign or Contour.</p></section>
          <section><h2>Why Games Care</h2><p>One spatial distance can serve Rendering, VFX, UI and Gameplay Queries. The GPU uses it for pixels; the CPU uses the same math to test a Player against a spell or collision shape.</p></section>
          <section><h2>One Distance Function</h2><p><code>d &lt; 0</code> → Inside. <code>abs(d) &lt; width</code> → Outline. <code>exp(-abs(d)·k)</code> → Glow. <code>smoothstep</code> → Soft Edge. <code>d(player)</code> → Trigger/Collision. <code>smoothMin(a,b)</code> → Metaball fusion.</p></section>
          <section><h2>Core Idea</h2><p>The shape is not drawn as geometry. Each pixel evaluates Circle and Box distance, combines those values, then converts the result into fill, outline, glow, sign colors or equal-distance contours.</p></section>
          <section><h2>Minimal Algorithm</h2><pre><code>float dCircle = sdCircle(p - circlePos, radius);
float dBox = sdBox(p - boxPos, boxSize);
float distance = min(dCircle, dBox);
float fill = distance < 0.0 ? 1.0 : 0.0;</code></pre></section>
          <section><h2>Circle Intuition</h2><pre><code>float sdCircle(vec2 p, float radius) {
  return length(p) - radius;
}</code></pre><p><code>length(p)</code> measures center distance. Subtracting radius shifts the zero point onto the circle boundary.</p></section>
          <section><h2>Box Intuition</h2><pre><code>vec2 q = abs(p) - halfSize;
return length(max(q, 0.0))
     + min(max(q.x, q.y), 0.0);</code></pre><p><code>abs</code> uses symmetry; the first term measures outside edges/corners and the second produces negative distance inside.</p></section>
          <section><h2>Boolean Operations</h2><p><code>min(a,b)</code> is Union, <code>max(a,b)</code> is Intersection, and <code>max(a,-b)</code> cuts Box from Circle. Smooth Union replaces the hard minimum with a blend.</p></section>
          <section><h2>Effects From Distance</h2><p>Outline tests <code>abs(distance)</code>. Glow maps distance to exponential falloff. Soft Edge uses <code>smoothstep</code> near zero—an analytic transition, not a blurred image.</p></section>
          <section><h2>Implementation</h2><p>Canvas pixels are converted to centered coordinates with aspect correction. WebGL2 evaluates the actual SDF. The CPU duplicates the same formulas only for the interactive Probe; it never renders the shapes.</p></section>
          <section><h2>Analytic vs Texture SDF</h2><p>This is an analytic SDF: formulas evaluate distance live. Font rendering often uses a texture SDF, where precomputed distances are sampled from an image.</p></section>
          <section><h2>Common Alternatives</h2><p>Traditional geometry, Canvas/vector paths, texture masks and alpha textures draw shapes differently. MSDF preserves sharp text corners using multiple channels.</p></section>
          <section><h2>Where Games Use This</h2><p><strong>UI/Text:</strong> outlines, glow and scalable edges. <strong>VFX:</strong> spell circles, energy fields, slime and masks. <strong>Gameplay:</strong> triggers, damage falloff and collision queries. <strong>Rendering:</strong> soft shadows, procedural geometry and ray marching. This Prototype validates only foundational 2D uses.</p></section>
          <section><h2>Next Experiments</h2><p>Rounded Box, Capsule, transforms, repetition, shells, smooth subtraction, soft shadows, metaballs, Text SDF/MSDF and 3D SDF Ray Marching.</p></section>
        </article>
      </main>`;
    const state = defaultSdfState();
    const mounted = mountSdfPlayground(container.querySelector("canvas")!, state, container.querySelector("#sdf-status")!, container.querySelector("#sdf-probe")!, container.querySelector("#sdf-error")!);
    const bindRange = (id: string, key: keyof Pick<typeof state, "circleRadius" | "boxHalfWidth" | "boxHalfHeight" | "outlineWidth" | "glowWidth" | "edgeSoftness" | "smoothness">) => {
      const input = container.querySelector<HTMLInputElement>(`#${id}`)!;
      input.oninput = () => { state[key] = Number(input.value); container.querySelector<HTMLOutputElement>(`#${id}-value`)!.value = input.value; };
    };
    bindRange("radius", "circleRadius"); bindRange("box-width", "boxHalfWidth"); bindRange("box-height", "boxHalfHeight");
    bindRange("outline", "outlineWidth"); bindRange("glow", "glowWidth"); bindRange("softness", "edgeSoftness"); bindRange("smoothness", "smoothness");
    const bindSegments = <T extends string>(id: string, change: (value: T) => void) => {
      const control = container.querySelector<HTMLElement>(`#${id}`)!;
      control.onclick = (event) => {
        const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
        if (!button?.dataset.value) return;
        control.querySelectorAll("button").forEach((item) => { const active = item === button; item.classList.toggle("active", active); item.setAttribute("aria-pressed", String(active)); });
        change(button.dataset.value as T);
      };
    };
    bindSegments<SdfOperation>("operation", (value) => { state.operation = value; });
    bindSegments<SdfView>("sdf-view", (value) => { state.view = value; });
    bindSegments<ApplicationMode>("application", (value) => {
      state.application = value;
      if (value === "metaball" && state.operation !== "smooth-union") {
        state.operation = "union";
        const control = container.querySelector<HTMLElement>("#operation")!;
        control.querySelectorAll("button").forEach((button) => {
          const active = button.dataset.value === "union";
          button.classList.toggle("active", active);
          button.setAttribute("aria-pressed", String(active));
        });
      }
    });
    return mounted.destroy;
  },
};
