import type { PrototypeDefinition } from "../../app/types";
import { metadata } from "./metadata";
import { mountBouncingBall } from "./prototype";

export const bouncingBall: PrototypeDefinition = {
  metadata,
  render(container) {
    container.innerHTML = `
      <main class="prototype-page shell">
        <a class="back-link" href="#/">← All prototypes</a>
        <header class="prototype-heading"><p class="eyebrow">${metadata.category} · Interactive Prototype</p><h1>${metadata.title}</h1><p>${metadata.description}</p></header>
        <section class="demo-panel" aria-label="Bouncing ball demo"><canvas width="900" height="460"></canvas></section>
        <section class="controls" aria-label="Simulation controls">
          <button id="pause">Pause</button><button id="reset" class="secondary">Reset</button>
          <label>Gravity <output id="gravity-value">720</output><input id="gravity" type="range" min="100" max="1500" step="20" value="720"></label>
          <label class="check"><input id="velocity" type="checkbox" checked> Show velocity vector</label>
        </section>
        <article class="explanation">
          <section><h2>What You Are Seeing</h2><p>A ball gains downward velocity every frame. When it crosses the ground, it is moved back to the surface and its vertical velocity is reflected with some energy removed.</p></section>
          <section><h2>Core Idea</h2><p>Gravity changes velocity; velocity changes position. Collision response constrains the position and redirects motion.</p></section>
          <section><h2>Minimal Algorithm</h2><pre><code>velocity.y += gravity * deltaTime;
position += velocity * deltaTime;

if (ball.bottom > ground) {
  ball.bottom = ground;
  velocity.y *= -restitution;
}</code></pre></section>
          <section><h2>Implementation</h2><p>The demo uses semi-implicit Euler integration and caps large frame deltas. A restitution value of 0.78 makes each bounce lose energy.</p></section>
          <section><h2>Code Structure</h2><p><code>index.ts</code> builds the teaching page. <code>prototype.ts</code> owns the simulation lifecycle. <code>metadata.ts</code> makes the demo discoverable.</p></section>
          <section><h2>Parameters to Play With</h2><p>Increase gravity and watch the velocity arrow grow faster. Turn the vector off to compare the clean game view with its debug view.</p></section>
          <section><h2>Common Alternatives</h2><p>Fixed-timestep simulation is more deterministic. Verlet integration is often convenient for constraints, while physics engines handle complex shapes and contact manifolds.</p></section>
          <section><h2>Where Games Use This</h2><p>Platformers, projectiles, particles and physics-driven props all build on this loop.</p></section>
          <section><h2>Next Experiments</h2><p>Add air drag, variable restitution, a fixed timestep, or several balls colliding with one another.</p></section>
        </article>
      </main>`;
    const canvas = container.querySelector("canvas")!;
    const gravity = container.querySelector<HTMLInputElement>("#gravity")!;
    const velocity = container.querySelector<HTMLInputElement>("#velocity")!;
    const pause = container.querySelector<HTMLButtonElement>("#pause")!;
    const simulation = mountBouncingBall(canvas, gravity, velocity);
    pause.onclick = () => { simulation.togglePause(); pause.textContent = simulation.isPaused() ? "Resume" : "Pause"; };
    container.querySelector<HTMLButtonElement>("#reset")!.onclick = simulation.reset;
    gravity.oninput = () => { container.querySelector("#gravity-value")!.textContent = gravity.value; };
    return simulation.destroy;
  },
};
