import type { RopeSimulation } from "./simulation";

export interface DebugOptions { showPoints: boolean; showConstraints: boolean; showPrevious: boolean; showVelocity: boolean }

const previousVisualizationScale = 5;
const velocityVisualizationScale = 5;
const maxVelocityArrowLength = 50;

export function renderRope(context: CanvasRenderingContext2D, simulation: RopeSimulation, debug: DebugOptions) {
  const { canvas } = context;
  context.clearRect(0, 0, canvas.width, canvas.height);
  const background = context.createLinearGradient(0, 0, 0, canvas.height);
  background.addColorStop(0, "#172b4f"); background.addColorStop(1, "#0e1930");
  context.fillStyle = background; context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#273d62"; context.fillRect(0, simulation.groundY, canvas.width, canvas.height - simulation.groundY);

  context.lineWidth = debug.showConstraints ? 3 : 6;
  context.strokeStyle = debug.showConstraints ? "#ffbe55" : "#6ee7c7";
  context.beginPath();
  simulation.constraints.forEach((constraint) => {
    context.moveTo(constraint.pointA.position.x, constraint.pointA.position.y);
    context.lineTo(constraint.pointB.position.x, constraint.pointB.position.y);
  });
  context.stroke();

  // Debug overlays are drawn in semantic layers. This keeps the hollow
  // previous marker, solid current point and direction arrow distinguishable
  // when every view is enabled at once.
  if (debug.showPrevious) {
    drawPreviousPositionConnectors(context, simulation);
    drawPreviousPositionMarkers(context, simulation);
  }

  if (debug.showPoints) {
    drawCurrentPoints(context, simulation);
  } else {
    drawPinnedPoints(context, simulation);
  }

  if (debug.showVelocity) {
    simulation.points.forEach((point) => {
      if (point.isPinned) return;
      drawVelocity(
        context,
        point.position.x,
        point.position.y,
        point.position.x - point.previousPosition.x,
        point.position.y - point.previousPosition.y,
      );
    });
  }

  if (debug.showConstraints) {
    drawConstraintLabels(context, simulation);
  }
}

function visualPreviousPosition(point: RopeSimulation["points"][number]) {
  const deltaX = point.position.x - point.previousPosition.x;
  const deltaY = point.position.y - point.previousPosition.y;
  return {
    x: point.position.x - deltaX * previousVisualizationScale,
    y: point.position.y - deltaY * previousVisualizationScale,
  };
}

function drawPreviousPositionConnectors(context: CanvasRenderingContext2D, simulation: RopeSimulation) {
  simulation.points.forEach((point) => {
    if (point.isPinned) return;
    const previous = visualPreviousPosition(point);
    context.strokeStyle = "#c18cff";
    context.lineWidth = 1.5;
    context.setLineDash([4, 4]);
    context.beginPath();
      context.moveTo(previous.x, previous.y);
      context.lineTo(point.position.x, point.position.y); context.stroke();
    context.setLineDash([]);
  });
}

function drawPreviousPositionMarkers(context: CanvasRenderingContext2D, simulation: RopeSimulation) {
  simulation.points.forEach((point) => {
    if (point.isPinned) return;
    const previous = visualPreviousPosition(point);
    context.strokeStyle = "#c18cff";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(previous.x, previous.y, 4.5, 0, Math.PI * 2);
    context.stroke();
  });
}

function drawCurrentPoints(context: CanvasRenderingContext2D, simulation: RopeSimulation) {
  simulation.points.forEach((point) => {
      context.fillStyle = point.isPinned ? "#ffbe55" : "#eaf1ff";
      if (point.isPinned) context.fillRect(point.position.x - 6, point.position.y - 6, 12, 12);
      else { context.beginPath(); context.arc(point.position.x, point.position.y, 4, 0, Math.PI * 2); context.fill(); }
  });
}

function drawPinnedPoints(context: CanvasRenderingContext2D, simulation: RopeSimulation) {
  simulation.points.forEach((point) => {
    if (!point.isPinned) return;
    context.fillStyle = "#ffbe55";
    context.fillRect(point.position.x - 6, point.position.y - 6, 12, 12);
  });
}

function drawConstraintLabels(context: CanvasRenderingContext2D, simulation: RopeSimulation) {
  simulation.points.forEach((point, index) => {
    if (index > 0 && index % 3 === 0) {
      const a = simulation.points[index - 1];
      const length = Math.hypot(point.position.x - a.position.x, point.position.y - a.position.y);
      context.fillStyle = "#d8e2f2"; context.font = "10px system-ui"; context.fillText(`${index}: ${length.toFixed(1)}`, point.position.x + 7, point.position.y);
    }
  });
}

function drawVelocity(context: CanvasRenderingContext2D, x: number, y: number, velocityX: number, velocityY: number) {
  const magnitude = Math.hypot(velocityX, velocityY);
  if (magnitude < 0.1) return;
  const scale = Math.min(maxVelocityArrowLength / magnitude, velocityVisualizationScale);
  const endX = x + velocityX * scale; const endY = y + velocityY * scale;
  const angle = Math.atan2(endY - y, endX - x);
  context.strokeStyle = "#ff718a"; context.fillStyle = "#ff718a"; context.lineWidth = 2;
  context.beginPath(); context.moveTo(x, y); context.lineTo(endX, endY); context.stroke();
  context.beginPath(); context.moveTo(endX, endY);
  context.lineTo(endX - 7 * Math.cos(angle - Math.PI / 6), endY - 7 * Math.sin(angle - Math.PI / 6));
  context.lineTo(endX - 7 * Math.cos(angle + Math.PI / 6), endY - 7 * Math.sin(angle + Math.PI / 6)); context.fill();
}
