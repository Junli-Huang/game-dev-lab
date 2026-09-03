import type { Vector2 } from "./agent";
import { renderCrowdSteering, type SteeringDebugOptions } from "./renderer";
import { CrowdSteeringSimulation, type SteeringSettings } from "./simulation";
import { magnitude } from "./steering";
import { t } from "../../i18n";

export function mountCrowdSteering(
  canvas: HTMLCanvasElement,
  settings: SteeringSettings,
  debug: SteeringDebugOptions,
  stats: HTMLElement,
  inspector: HTMLElement,
  onAgentCount: (count: number) => void,
) {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D is not supported by this browser.");
  }
  const simulation = new CrowdSteeringSimulation(canvas.width, canvas.height, settings);
  const fixedDeltaTime = 1 / 60;
  let paused = false;
  let accumulator = 0;
  let animationId = 0;
  let previousTime = performance.now();
  let fpsTime = previousTime;
  let frames = 0;
  let fps = 60;

  const pointerPosition = (event: PointerEvent): Vector2 => {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * canvas.width / bounds.width,
      y: (event.clientY - bounds.top) * canvas.height / bounds.height,
    };
  };

  canvas.onpointerdown = (event) => {
    const pointer = pointerPosition(event);
    const agent = simulation.agentAt(pointer);
    if (agent) {
      simulation.selectedAgentId = agent.id;
    } else {
      simulation.setTarget(pointer);
    }
  };
  canvas.onpointermove = (event) => {
    simulation.hoveredAgentId = simulation.agentAt(pointerPosition(event))?.id;
  };
  canvas.onpointerleave = () => {
    simulation.hoveredAgentId = undefined;
  };

  const frame = (time: number) => {
    const frameTime = Math.min((time - previousTime) / 1000, 0.1);
    previousTime = time;
    if (!paused) {
      accumulator += frameTime;
      while (accumulator >= fixedDeltaTime) {
        simulation.step(fixedDeltaTime);
        accumulator -= fixedDeltaTime;
      }
    } else {
      accumulator = 0;
    }

    renderCrowdSteering(context, simulation, debug);
    frames += 1;
    if (time - fpsTime >= 500) {
      fps = Math.round(frames * 1000 / (time - fpsTime));
      frames = 0;
      fpsTime = time;
    }
    const averageNeighbors = simulation.agents.reduce(
      (sum, agent) => sum + agent.debug.neighborCount,
      0,
    ) / Math.max(simulation.agents.length, 1);
    stats.textContent = `FPS ${fps} · Fixed 60 Hz · ${t("common.agents")} ${simulation.agents.length} · ${t("stats.separation")} ${settings.separationEnabled ? "ON" : "OFF"} · ${t("stats.avgNeighbors")} ${averageNeighbors.toFixed(1)}`;
    renderInspector(inspector, simulation);
    animationId = requestAnimationFrame(frame);
  };

  animationId = requestAnimationFrame(frame);
  return {
    simulation,
    reset: () => {
      simulation.reset();
      onAgentCount(simulation.agents.length);
    },
    togglePause: () => {
      paused = !paused;
      return paused;
    },
    isPaused: () => paused,
    destroy: () => {
      cancelAnimationFrame(animationId);
      canvas.onpointerdown = null;
      canvas.onpointermove = null;
      canvas.onpointerleave = null;
    },
  };
}

function renderInspector(inspector: HTMLElement, simulation: CrowdSteeringSimulation) {
  const agent = simulation.selectedAgent();
  if (!agent) {
    inspector.innerHTML = `<p>${t("crowd.selectAgent")}</p>`;
    return;
  }
  inspector.innerHTML = `
    <div><span>Agent</span><strong>#${agent.id}</strong></div>
    <div><span>Position</span><strong>${agent.position.x.toFixed(1)}, ${agent.position.y.toFixed(1)}</strong></div>
    <div><span>Velocity</span><strong>${magnitude(agent.velocity).toFixed(1)}</strong></div>
    <div><span>Neighbors</span><strong>${agent.debug.neighborCount}</strong></div>
    <div><span>Seek</span><strong>${magnitude(agent.debug.seek).toFixed(1)}</strong></div>
    <div><span>Separation</span><strong>${magnitude(agent.debug.separation).toFixed(1)}</strong></div>
    <div><span>Final Steering</span><strong>${magnitude(agent.debug.finalSteering).toFixed(1)}</strong></div>`;
}
