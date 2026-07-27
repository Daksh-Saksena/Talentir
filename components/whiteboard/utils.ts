import { Stroke, Point } from "./types";

function drawArrow(ctx: CanvasRenderingContext2D, start: Point, end: Point) {
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const headLength = 12;

  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLength * Math.cos(angle - Math.PI / 6),
    end.y - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    end.x - headLength * Math.cos(angle + Math.PI / 6),
    end.y - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

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

// Ensure Caveat is loaded before we paint — call once on mount
export async function preloadHandwritingFont(): Promise<void> {
  if (typeof document === "undefined") return;
  try {
    await Promise.all([
      document.fonts.load("400 40px Caveat"),
      document.fonts.load("600 40px Caveat"),
      document.fonts.load("700 40px Caveat"),
    ]);
  } catch {
    // Font failed to load — canvas will fall back gracefully
  }
}

/** Apple-Notes style: redraw recognized text using Caveat handwriting font.
 *  Same color, same bounding box, same visual weight as the original strokes. */
export function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  bbox: { x: number; y: number; width: number; height: number },
  color: string = "#111827"
) {
  if (!text || !bbox || bbox.width <= 0 || bbox.height <= 0) return;

  ctx.save();
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";

  // Slightly larger multiplier so Caveat fills the bbox comfortably
  const fontSize = Math.max(14, Math.round(bbox.height * 0.88));
  // Use Caveat (handwriting font); fall back to cursive if not loaded yet
  ctx.font = `600 ${fontSize}px 'Caveat', cursive`;

  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;

  const centerX = bbox.x + bbox.width / 2;
  const centerY = bbox.y + bbox.height / 2;

  ctx.translate(centerX, centerY);

  // Scale horizontally so the text fits the bounding box width naturally
  if (textWidth > 0) {
    const scaleX = Math.min(1.5, Math.max(0.55, bbox.width / textWidth));
    ctx.scale(scaleX, 1);
  }

  ctx.textAlign = "center";
  ctx.fillText(text, 0, 0);
  ctx.restore();
}


export function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke
) {
  if (stroke.tool === "text") {
    if (!stroke.text || !stroke.bbox) return;
    drawFittedText(ctx, stroke.text, stroke.bbox, stroke.color || "#111827");
    return;
  }

  if (stroke.points.length === 0) return;

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
  const last = stroke.points[stroke.points.length - 1];

  if (stroke.tool === "line") {
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  } else if (stroke.tool === "rectangle") {
    const x = Math.min(first.x, last.x);
    const y = Math.min(first.y, last.y);
    const width = Math.abs(last.x - first.x);
    const height = Math.abs(last.y - first.y);
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.stroke();
  } else if (stroke.tool === "circle") {
    const radius = distance(first, last);
    ctx.beginPath();
    ctx.arc(first.x, first.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  } else if (stroke.tool === "arrow") {
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    drawArrow(ctx, first, last);
  } else {
    ctx.beginPath();
    ctx.arc(first.x, first.y, stroke.size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(first.x, first.y);

    for (const point of stroke.points.slice(1)) {
      ctx.lineTo(point.x, point.y);
    }

    ctx.stroke();
  }

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