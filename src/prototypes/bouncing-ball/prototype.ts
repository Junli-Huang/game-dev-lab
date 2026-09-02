interface Ball { x: number; y: number; vx: number; vy: number; radius: number }

export function mountBouncingBall(canvas: HTMLCanvasElement, gravityInput: HTMLInputElement, velocityToggle: HTMLInputElement) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is not supported by this browser.");

  let ball: Ball;
  let paused = false;
  let animationId = 0;
  let previousTime = performance.now();

  const reset = () => {
    ball = { x: canvas.width * 0.28, y: 72, vx: 145, vy: 0, radius: 18 };
    previousTime = performance.now();
  };

  const drawArrow = () => {
    const scale = 0.16;
    const endX = ball.x + ball.vx * scale;
    const endY = ball.y + ball.vy * scale;
    const angle = Math.atan2(endY - ball.y, endX - ball.x);
    context.strokeStyle = "#ffbe55";
    context.fillStyle = "#ffbe55";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(ball.x, ball.y);
    context.lineTo(endX, endY);
    context.stroke();
    context.beginPath();
    context.moveTo(endX, endY);
    context.lineTo(endX - 10 * Math.cos(angle - Math.PI / 6), endY - 10 * Math.sin(angle - Math.PI / 6));
    context.lineTo(endX - 10 * Math.cos(angle + Math.PI / 6), endY - 10 * Math.sin(angle + Math.PI / 6));
    context.closePath();
    context.fill();
  };

  const update = (dt: number) => {
    const gravity = Number(gravityInput.value);
    ball.vy += gravity * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    const ground = canvas.height - 34;
    if (ball.y + ball.radius > ground) {
      ball.y = ground - ball.radius;
      // Restitution keeps part of the incoming energy. Values below 1 make each bounce lower.
      ball.vy = -Math.abs(ball.vy) * 0.78;
    }
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
      ball.x = Math.max(ball.radius, Math.min(canvas.width - ball.radius, ball.x));
      ball.vx *= -1;
    }
  };

  const draw = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#172b4f");
    gradient.addColorStop(1, "#101b34");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#273d62";
    context.fillRect(0, canvas.height - 34, canvas.width, 34);
    context.fillStyle = "#6ee7c7";
    context.shadowColor = "#6ee7c7";
    context.shadowBlur = 18;
    context.beginPath();
    context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
    if (velocityToggle.checked) drawArrow();
  };

  const frame = (time: number) => {
    const dt = Math.min((time - previousTime) / 1000, 1 / 30);
    previousTime = time;
    if (!paused) update(dt);
    draw();
    animationId = requestAnimationFrame(frame);
  };

  reset();
  animationId = requestAnimationFrame(frame);
  return {
    reset,
    togglePause: () => (paused = !paused),
    isPaused: () => paused,
    destroy: () => cancelAnimationFrame(animationId),
  };
}
