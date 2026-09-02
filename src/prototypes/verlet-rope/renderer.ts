import type { RopeSimulation } from "./simulation";

export interface DebugOptions { showPoints: boolean; showConstraints: boolean; showPrevious: boolean; showVelocity: boolean }

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

  simulation.points.forEach((point, index) => {
    if (debug.showPrevious && !point.isPinned) {
      context.strokeStyle = "#8495b0"; context.lineWidth = 1; context.beginPath();
      context.moveTo(point.previousPosition.x, point.previousPosition.y);
      context.lineTo(point.position.x, point.position.y); context.stroke();
      context.fillStyle = "#8495b0"; context.beginPath(); context.arc(point.previousPosition.x, point.previousPosition.y, 2.5, 0, Math.PI * 2); context.fill();
    }
    if (debug.showVelocity && !point.isPinned) drawVelocity(context, point.position.x, point.position.y, point.position.x - point.previousPosition.x, point.position.y - point.previousPosition.y);
    if (debug.showPoints || point.isPinned) {
      context.fillStyle = point.isPinned ? "#ffbe55" : "#eaf1ff";
      if (point.isPinned) context.fillRect(point.position.x - 6, point.position.y - 6, 12, 12);
      else { context.beginPath(); context.arc(point.position.x, point.position.y, 4, 0, Math.PI * 2); context.fill(); }
    }
    if (debug.showConstraints && index > 0 && index % 3 === 0) {
      const a = simulation.points[index - 1];
      const length = Math.hypot(point.position.x - a.position.x, point.position.y - a.position.y);
      context.fillStyle = "#d8e2f2"; context.font = "10px system-ui"; context.fillText(`${index}: ${length.toFixed(1)}`, point.position.x + 7, point.position.y);
    }
  });
}

function drawVelocity(context: CanvasRenderingContext2D, x: number, y: number, velocityX: number, velocityY: number) {
  const magnitude = Math.hypot(velocityX, velocityY);
  if (magnitude < 0.1) return;
  const scale = Math.min(26 / magnitude, 3);
  const endX = x + velocityX * scale; const endY = y + velocityY * scale;
  const angle = Math.atan2(endY - y, endX - x);
  context.strokeStyle = "#ff718a"; context.fillStyle = "#ff718a"; context.lineWidth = 1.5;
  context.beginPath(); context.moveTo(x, y); context.lineTo(endX, endY); context.stroke();
  context.beginPath(); context.moveTo(endX, endY);
  context.lineTo(endX - 5 * Math.cos(angle - Math.PI / 6), endY - 5 * Math.sin(angle - Math.PI / 6));
  context.lineTo(endX - 5 * Math.cos(angle + Math.PI / 6), endY - 5 * Math.sin(angle + Math.PI / 6)); context.fill();
}
