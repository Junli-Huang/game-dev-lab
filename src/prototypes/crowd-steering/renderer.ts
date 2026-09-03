import type { SteeringAgent, Vector2 } from "./agent";
import type { CrowdSteeringSimulation } from "./simulation";
import { magnitude } from "./steering";

export interface SteeringDebugOptions {
  showAgents: boolean;
  showVelocity: boolean;
  showSeek: boolean;
  showSeparation: boolean;
  showNeighborRadius: boolean;
  showFinalSteering: boolean;
}

export function renderCrowdSteering(
  context: CanvasRenderingContext2D,
  simulation: CrowdSteeringSimulation,
  debug: SteeringDebugOptions,
) {
  drawBackground(context);
  drawTarget(context, simulation.target);

  const focusedAgent = simulation.agents.find(
    (agent) => agent.id === (simulation.hoveredAgentId ?? simulation.selectedAgentId),
  );
  if (debug.showNeighborRadius && focusedAgent) {
    drawNeighborhood(context, simulation, focusedAgent);
  }

  if (debug.showVelocity) {
    drawAgentVectors(context, simulation, "velocity", "#7cd7ff", 0.22);
  }
  if (debug.showSeek) {
    drawAgentVectors(context, simulation, "seek", "#6ee7c7", 0.16);
  }
  if (debug.showSeparation) {
    drawAgentVectors(context, simulation, "separation", "#ff8ea1", 0.16);
  }
  if (debug.showFinalSteering) {
    drawAgentVectors(context, simulation, "finalSteering", "#ffcf76", 0.16);
  }

  if (debug.showAgents) {
    simulation.agents.forEach((agent) => drawAgent(context, simulation, agent));
  }
}

function drawBackground(context: CanvasRenderingContext2D) {
  const { canvas } = context;
  const gradient = context.createRadialGradient(
    canvas.width * 0.65,
    canvas.height * 0.35,
    20,
    canvas.width * 0.5,
    canvas.height * 0.5,
    canvas.width * 0.75,
  );
  gradient.addColorStop(0, "#1b3551");
  gradient.addColorStop(1, "#0c172b");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "#223956";
  context.lineWidth = 1;
  for (let x = 30; x < canvas.width; x += 30) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }
  for (let y = 30; y < canvas.height; y += 30) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.stroke();
  }
}

function drawTarget(context: CanvasRenderingContext2D, target: Vector2) {
  context.strokeStyle = "#ffbe55";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(target.x, target.y, 14, 0, Math.PI * 2);
  context.stroke();
  context.beginPath();
  context.moveTo(target.x - 20, target.y);
  context.lineTo(target.x + 20, target.y);
  context.moveTo(target.x, target.y - 20);
  context.lineTo(target.x, target.y + 20);
  context.stroke();
}

function drawNeighborhood(
  context: CanvasRenderingContext2D,
  simulation: CrowdSteeringSimulation,
  focusedAgent: SteeringAgent,
) {
  context.fillStyle = "#6ee7c70c";
  context.strokeStyle = "#6ee7c788";
  context.lineWidth = 1.5;
  context.beginPath();
  context.arc(
    focusedAgent.position.x,
    focusedAgent.position.y,
    simulation.settings.neighborRadius,
    0,
    Math.PI * 2,
  );
  context.fill();
  context.stroke();

  simulation.agents.forEach((agent) => {
    if (agent.id === focusedAgent.id) {
      return;
    }
    const distance = Math.hypot(
      agent.position.x - focusedAgent.position.x,
      agent.position.y - focusedAgent.position.y,
    );
    if (distance >= simulation.settings.neighborRadius) {
      return;
    }
    context.strokeStyle = "#ff8ea166";
    context.beginPath();
    context.moveTo(focusedAgent.position.x, focusedAgent.position.y);
    context.lineTo(agent.position.x, agent.position.y);
    context.stroke();
    context.strokeStyle = "#ff8ea1";
    context.beginPath();
    context.arc(agent.position.x, agent.position.y, agent.radius + 3, 0, Math.PI * 2);
    context.stroke();
  });
}

type VectorKey = "velocity" | "seek" | "separation" | "finalSteering";

function drawAgentVectors(
  context: CanvasRenderingContext2D,
  simulation: CrowdSteeringSimulation,
  key: VectorKey,
  color: string,
  scale: number,
) {
  simulation.agents.forEach((agent) => {
    const vector = key === "velocity" ? agent.velocity : agent.debug[key];
    drawArrow(context, agent.position, vector, color, scale);
  });
}

function drawArrow(
  context: CanvasRenderingContext2D,
  origin: Vector2,
  vector: Vector2,
  color: string,
  scale: number,
) {
  const vectorMagnitude = magnitude(vector);
  if (vectorMagnitude < 0.5) {
    return;
  }
  const visualLength = Math.min(vectorMagnitude * scale, 34);
  const directionX = vector.x / vectorMagnitude;
  const directionY = vector.y / vectorMagnitude;
  const endX = origin.x + directionX * visualLength;
  const endY = origin.y + directionY * visualLength;
  const perpendicularX = -directionY;
  const perpendicularY = directionX;

  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(origin.x, origin.y);
  context.lineTo(endX, endY);
  context.stroke();
  context.beginPath();
  context.moveTo(endX, endY);
  context.lineTo(endX - directionX * 6 + perpendicularX * 3, endY - directionY * 6 + perpendicularY * 3);
  context.lineTo(endX - directionX * 6 - perpendicularX * 3, endY - directionY * 6 - perpendicularY * 3);
  context.fill();
}

function drawAgent(
  context: CanvasRenderingContext2D,
  simulation: CrowdSteeringSimulation,
  agent: SteeringAgent,
) {
  const selected = agent.id === simulation.selectedAgentId;
  const hovered = agent.id === simulation.hoveredAgentId;
  if (selected || hovered) {
    context.strokeStyle = selected ? "#ffcf76" : "#ffffff99";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(agent.position.x, agent.position.y, agent.radius + 4, 0, Math.PI * 2);
    context.stroke();
  }
  context.fillStyle = selected ? "#ffcf76" : "#eaf1ff";
  context.beginPath();
  context.arc(agent.position.x, agent.position.y, agent.radius, 0, Math.PI * 2);
  context.fill();
}
