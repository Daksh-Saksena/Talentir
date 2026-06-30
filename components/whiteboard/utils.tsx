import { Stroke, Point } from "./types";

export function getPointerPosition(
  e: React.PointerEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement
): Point {
  const rect = canvas.getBoundingClientRect();

  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

export function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke
) {
  if (stroke.points.length === 0) return;

  ctx.beginPath();

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (stroke.tool) {
    case "eraser":
      ctx.strokeStyle = "#ffffff";
      ctx.fillStyle = "#ffffff";
      break;

    case "highlighter":
      ctx.strokeStyle = stroke.color;
      ctx.fillStyle = stroke.color;
      ctx.globalAlpha = 0.3;
      break;

    default:
      ctx.strokeStyle = stroke.color;
      ctx.fillStyle = stroke.color;
      ctx.globalAlpha = 1;
      break;
  }

  ctx.lineWidth = stroke.size;

  const first = stroke.points[0];

  ctx.arc(
    first.x,
    first.y,
    stroke.size / 2,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(first.x, first.y);

  for (const point of stroke.points.slice(1)) {
    ctx.lineTo(point.x, point.y);
  }

  ctx.stroke();

  ctx.globalAlpha = 1;
}

export function redrawCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  strokes: Stroke[]
) {
  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  for (const stroke of strokes) {
    drawStroke(ctx, stroke);
  }
}

export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
) {
  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );
}

export function exportPNG(
  canvas: HTMLCanvasElement
) {
  const link = document.createElement("a");

  link.download = `whiteboard-${Date.now()}.png`;

  link.href = canvas.toDataURL("image/png");

  link.click();
}

export function distance(
  p1: Point,
  p2: Point
) {
  return Math.sqrt(
    Math.pow(p2.x - p1.x, 2) +
      Math.pow(p2.y - p1.y, 2)
  );
}

export function midpoint(
  p1: Point,
  p2: Point
): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

export function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.max(min, Math.min(max, value));
}

export function hexToRGBA(
  hex: string,
  alpha: number
) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function isNearPoint(
  p1: Point,
  p2: Point,
  tolerance = 8
) {
  return distance(p1, p2) <= tolerance;
}

export function generateStrokeId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 10)}`;
}