"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { createWorker } from "tesseract.js";
import { Point, Stroke, Tool, MagicSettings } from "./types";
import { COMMON_WORDS, isExactDictionaryWord, isRealWord, normalizeCandidateWord } from "./wordDictionary";
import { drawStroke, redrawCanvas, getPointerPosition, exportPNG, generateStrokeId, drawFittedText, preloadHandwritingFont } from "./utils";

export interface WhiteboardCanvasHandle {
  undo: () => void;
  redo: () => void;
  clear: () => void;
  exportPNG: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
}

interface WhiteboardCanvasProps {
  tool: Tool;
  setTool: (tool: Tool) => void;
  color: string;
  setColor: (color: string) => void;
  penSize: number;
  setPenSize: (size: number) => void;
  assistTool?: string;
  setAssistTool?: (tool: string) => void;
  magicSettings?: MagicSettings;
  onEquationDetected?: (equation: string) => void;
}

const clampZoom = (value: number) => Math.max(0.5, Math.min(3, value));

function formatBeautifiedText(text: string) {
  if (!text || !text.trim()) return "";

  // Step 1: Remove extra special characters but keep useful ones
  const cleaned = text
    .replace(/[^A-Za-z0-9\s.,!?:;\-()[\]"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "";

  // Step 2: Fix spacing around punctuation
  const normalized = cleaned
    .replace(/\s+([.,!?;:])/g, "$1") // Remove space before punctuation
    .replace(/([.,!?;:])\s*([A-Za-z])/g, "$1 $2") // Add space after punctuation if followed by letter
    .replace(/\(\s+/g, "(") // Remove space after opening bracket
    .replace(/\s+\)/g, ")") // Remove space before closing bracket
    .replace(/\[\s+/g, "[") // Remove space after opening square bracket
    .replace(/\s+\]/g, "]") // Remove space before closing square bracket
    .replace(/\s+/g, " ")
    .trim();

  // Step 3: Capitalize properly - first letter of sentence and after punctuation
  const sentences = normalized.split(/(?<=[.!?])\s+/);
  const capitalizedSentences = sentences.map((sentence) => {
    const trimmed = sentence.trim();
    if (!trimmed) return "";
    const first = trimmed.charAt(0).toUpperCase();
    const rest = trimmed.slice(1).toLowerCase();

    // Capitalize after numbers or common abbreviations
    const words = (first + rest).split(/\s+/);
    return words
      .map((word, idx) => {
        if (idx === 0) return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        // Keep acronyms uppercase
        if (word.length <= 2 && word === word.toUpperCase()) return word;
        return word.toLowerCase();
      })
      .join(" ");
  });

  return capitalizedSentences.filter((s) => s.trim()).join(". ").trim();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  for (let n = 0; n < words.length; n++) {
    const testLine = line + (line ? " " : "") + words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

function calculateTextFontSize(bboxHeight: number) {
  return Math.max(18, Math.min(72, Math.round(bboxHeight * 0.96)));
}

function findDictionaryCorrection(word: string) {
  const normalized = normalizeCandidateWord(word);
  if (!normalized) return null;
  if (isExactDictionaryWord(normalized)) return normalized;

  const variants = new Set<string>();
  if (normalized.endsWith("s")) {
    variants.add(normalized.slice(0, -1));
  }
  if (normalized.endsWith("es")) {
    variants.add(normalized.slice(0, -2));
  }
  if (normalized.endsWith("ed")) {
    variants.add(normalized.slice(0, -2));
  }
  if (normalized.endsWith("ing")) {
    variants.add(normalized.slice(0, -3));
  }

  const substitutions: Record<string, string[]> = {
    0: ["o"],
    1: ["i", "l"],
    2: ["z"],
    4: ["a"],
    5: ["s"],
    6: ["g"],
    7: ["t"],
    8: ["b"],
    l: ["i"],
    q: ["g"],
    m: ["n"],
    u: ["v"],
  };

  for (let i = 0; i < normalized.length; i += 1) {
    const replaceChars = substitutions[normalized[i] as keyof typeof substitutions];
    if (!replaceChars) continue;
    for (const replacement of replaceChars) {
      variants.add(normalized.slice(0, i) + replacement + normalized.slice(i + 1));
    }
  }

  for (const candidate of variants) {
    if (candidate && isExactDictionaryWord(candidate)) {
      return candidate;
    }
  }

  return null;
}

function correctOCRWord(word: string) {
  const normalized = normalizeCandidateWord(word);
  if (!normalized) return "";
  if (isExactDictionaryWord(normalized)) return normalized;
  const correction = findDictionaryCorrection(normalized);
  return correction ?? normalized;
}

function isValidWordCandidate(word: string) {
  const normalized = normalizeCandidateWord(word);
  if (!normalized) return false;
  if (isExactDictionaryWord(normalized)) return true;
  if (/^\d+$/.test(normalized)) return true;

  if (normalized.length <= 3) {
    return isExactDictionaryWord(normalized) || Boolean(findDictionaryCorrection(normalized));
  }

  if (/^[a-z]+$/.test(normalized)) {
    const vowelCount = (normalized.match(/[aeiouy]/g) || []).length;
    if (vowelCount < 1) return false;
    return isRealWord(normalized) || Boolean(findDictionaryCorrection(normalized));
  }

  return false;
}

function allWordsAreValid(text: string) {
  return text
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .every((token) => isValidWordCandidate(token));
}

// Smooth stroke using Catmull-Rom spline interpolation for better handwriting recognition
function smoothStroke(points: Point[]): Point[] {
  if (points.length < 4) return points;
  
  const smoothed: Point[] = [];
  const tension = 0.5;
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    
    for (let t = 0; t < 1; t += 0.2) {
      const t2 = t * t;
      const t3 = t2 * t;
      
      const q = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
      );
      
      const r = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
      );
      
      smoothed.push({ x: q, y: r });
    }
  }
  smoothed.push(points[points.length - 1]);
  return smoothed;
}

// Draw smooth handwriting strokes for OCR with better quality
interface OverlaySegment {
  text: string;
  beautifiedText: string;
  bbox: { x: number; y: number; width: number; height: number };
  fontSize?: number;
  color?: string;
}

function expandBBox(
  bbox: { x: number; y: number; width: number; height: number },
  padding: number
) {
  return {
    x: Math.max(0, bbox.x - padding),
    y: Math.max(0, bbox.y - padding),
    width: bbox.width + padding * 2,
    height: bbox.height + padding * 2,
  };
}

function drawStrokeForOCR(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.points.length === 0) return;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#000000";
  ctx.fillStyle = "#000000";
  ctx.globalAlpha = 1;
  ctx.lineWidth = Math.max(3, stroke.size * 1.5);

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
    const radius = Math.sqrt(
      Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2)
    );
    ctx.beginPath();
    ctx.arc(first.x, first.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  } else if (stroke.tool === "arrow") {
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    const angle = Math.atan2(last.y - first.y, last.x - first.x);
    const headLength = 12;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(
      last.x - headLength * Math.cos(angle - Math.PI / 6),
      last.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      last.x - headLength * Math.cos(angle + Math.PI / 6),
      last.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  } else {
    const smoothedPoints = smoothStroke(stroke.points);
    ctx.beginPath();
    ctx.moveTo(smoothedPoints[0].x, smoothedPoints[0].y);
    for (const point of smoothedPoints.slice(1)) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

// Find content bounding box to focus OCR on actual writing
function findContentBBox(imageData: ImageData): { x: number; y: number; w: number; h: number } {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let hasContent = false;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = (r + g + b) / 3;
    
    if (gray < 235) { // Dark pixels or anti-aliased stroke content
      const idx = i / 4;
      const y = Math.floor(idx / width);
      const x = idx % width;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      hasContent = true;
    }
  }
  
  return hasContent 
    ? { x: Math.max(0, minX - 20), y: Math.max(0, minY - 20), w: maxX - minX + 40, h: maxY - minY + 40 }
    : { x: 0, y: 0, w: width, h: height };
}

function splitStrokeClusterByWordGap(cluster: Stroke[]) {
  if (cluster.length <= 1) return [cluster];

  const items = cluster.map((stroke) => ({
    stroke,
    bbox: getStrokeBoundingBox([stroke]),
  }));

  items.sort((a, b) => a.bbox.x - b.bbox.x);
  const gaps: number[] = [];
  for (let i = 1; i < items.length; i += 1) {
    const prev = items[i - 1].bbox;
    const current = items[i].bbox;
    const gap = Math.max(0, current.x - (prev.x + prev.width));
    gaps.push(gap);
  }

  const clusterBBox = getStrokeBoundingBox(cluster);
  const medianGap = gaps.length ? gaps.slice().sort((a, b) => a - b)[Math.floor(gaps.length / 2)] : 0;
  const gapThreshold = Math.max(30, Math.min(140, medianGap * 1.6, clusterBBox.height * 1.1));

  const wordClusters: Stroke[][] = [];
  let currentGroup: Stroke[] = [items[0].stroke];

  for (let i = 1; i < items.length; i += 1) {
    const prev = items[i - 1].bbox;
    const current = items[i].bbox;
    const gap = Math.max(0, current.x - (prev.x + prev.width));
    if (gap > gapThreshold) {
      wordClusters.push(currentGroup);
      currentGroup = [items[i].stroke];
    } else {
      currentGroup.push(items[i].stroke);
    }
  }

  if (currentGroup.length) {
    wordClusters.push(currentGroup);
  }

  return wordClusters.length ? wordClusters : [cluster];
}

function groupStrokesIntoClusters(strokes: Stroke[]) {
  const clusters: Stroke[][] = [];

  for (const stroke of strokes) {
    const strokeBBox = getStrokeBoundingBox([stroke]);
    let placed = false;

    for (const cluster of clusters) {
      const clusterBBox = getStrokeBoundingBox(cluster);
      const intersectionPadding = 18;
      if (rectanglesIntersect(expandBBox(clusterBBox, intersectionPadding), expandBBox(strokeBBox, intersectionPadding))) {
        cluster.push(stroke);
        placed = true;
        break;
      }
    }

    if (!placed) {
      clusters.push([stroke]);
    }
  }

  return clusters;
}

function getStrokeBoundingBox(strokes: Stroke[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const stroke of strokes) {
    for (const point of stroke.points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
  }

  if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  return {
    x: Math.max(0, minX - 4),
    y: Math.max(0, minY - 4),
    width: Math.max(12, maxX - minX + 8),
    height: Math.max(12, maxY - minY + 8),
  };
}

function rectanglesIntersect(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

type HistoryAction =
  | { type: "add"; stroke: Stroke }
  | { type: "remove"; strokes: Stroke[] }
  | { type: "replace"; removed: Stroke[]; added: Stroke[] };

interface PendingMagicReplacement {
  removedStrokeIds: string[];
  overlaySegments: OverlaySegment[];
}

function distancePointToSegment(point: Point, a: Point, b: Point) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - a.x, point.y - a.y);
  }

  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy)));
  const projection = { x: a.x + t * dx, y: a.y + t * dy };
  return Math.hypot(point.x - projection.x, point.y - projection.y);
}

function pointIntersectsStroke(point: Point, stroke: Stroke, tolerance: number) {
  if (stroke.tool === "text" && stroke.bbox) {
    return (
      point.x >= stroke.bbox.x - tolerance &&
      point.x <= stroke.bbox.x + stroke.bbox.width + tolerance &&
      point.y >= stroke.bbox.y - tolerance &&
      point.y <= stroke.bbox.y + stroke.bbox.height + tolerance
    );
  }

  if (stroke.points.length === 0) {
    return false;
  }

  for (let i = 0; i < stroke.points.length; i++) {
    const current = stroke.points[i];
    if (Math.hypot(point.x - current.x, point.y - current.y) <= tolerance) {
      return true;
    }

    if (i + 1 < stroke.points.length) {
      const next = stroke.points[i + 1];
      if (distancePointToSegment(point, current, next) <= tolerance) {
        return true;
      }
    }
  }

  return false;
}

const WhiteboardCanvas = forwardRef<WhiteboardCanvasHandle, WhiteboardCanvasProps>(function WhiteboardCanvas(
  { tool, color, penSize, setTool, setColor, setPenSize, assistTool = "none", setAssistTool, magicSettings, onEquationDetected },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const redoStack = useRef<Stroke[]>([]);
  const currentStroke = useRef<Stroke | null>(null);
  const [drawing, setDrawing] = useState(false);
  const drawingRef = useRef(false);
  const [isPanning, setIsPanning] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const magicOverlayRef = useRef<OverlaySegment[]>([]);
  const workerRef = useRef<any>(null);
  const processingRef = useRef(false);
  const pendingMagicRef = useRef(false);
  const magicIdleTimeout = useRef<number | null>(null);
  const magicCommitTimeout = useRef<number | null>(null);
  const pendingMagicReplacementRef = useRef<PendingMagicReplacement | null>(null);
  const historyRef = useRef<HistoryAction[]>([]);
  const redoHistoryRef = useRef<HistoryAction[]>([]);
  const offsetRef = useRef(offset);
  const zoomRef = useRef(zoom);
  const panStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    drawingRef.current = drawing;
  }, [drawing]);

  // Preload Caveat handwriting font so canvas renders it immediately on first OCR
  useEffect(() => {
    preloadHandwritingFont();
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offsetRef.current.x, offsetRef.current.y);
    ctx.scale(zoomRef.current, zoomRef.current);

    redrawCanvas(ctx, canvas, strokes.current);
    if (currentStroke.current) {
      drawStroke(ctx, currentStroke.current);
    }

    if (magicOverlayRef.current.length > 0) {
      for (const overlay of magicOverlayRef.current) {
        drawFittedText(ctx, overlay.beautifiedText, overlay.bbox, overlay.color || color || "#111827");
      }
    }

    if (assistTool !== "none") {
      ctx.save();
      ctx.strokeStyle = "rgba(37, 99, 235, 0.65)";
      ctx.lineWidth = 1.5 / zoomRef.current;
      ctx.setLineDash([6, 4]);
      switch (assistTool) {
        case "ruler": {
          ctx.beginPath();
          ctx.moveTo(-2000, 0);
          ctx.lineTo(2000, 0);
          ctx.moveTo(0, -2000);
          ctx.lineTo(0, 2000);
          ctx.stroke();
          break;
        }
        case "compass": {
          ctx.beginPath();
          ctx.arc(0, 0, 120, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-140, 0);
          ctx.lineTo(140, 0);
          ctx.moveTo(0, -140);
          ctx.lineTo(0, 140);
          ctx.stroke();
          break;
        }
        case "protractor": {
          ctx.beginPath();
          ctx.arc(0, 0, 140, 0, Math.PI);
          ctx.stroke();
          break;
        }
        case "scale": {
          ctx.beginPath();
          ctx.moveTo(-140, 0);
          ctx.lineTo(140, 0);
          ctx.stroke();
          for (let i = -14; i <= 14; i += 2) {
            const x = i * 10;
            ctx.beginPath();
            ctx.moveTo(x, -6);
            ctx.lineTo(x, 6);
            ctx.stroke();
          }
          break;
        }
        default:
          break;
      }
      ctx.restore();
    }

    ctx.restore();
  }, [assistTool]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    redraw();
  }, [redraw]);

  const initWorker = useCallback(async () => {
    if (workerRef.current) return workerRef.current;
    try {
      const worker = await createWorker("eng");
      workerRef.current = worker;
      return worker;
    } catch (err) {
      console.error("[Tesseract Init Error]", err);
      return null;
    }
  }, []);

  async function performVisionOCR(processCanvas: HTMLCanvasElement): Promise<string | null> {
    try {
      const dataUrl = processCanvas.toDataURL("image/png");
      const response = await fetch("/api/vision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: dataUrl }),
      });

      if (!response.ok) {
        console.warn(`[Vision OCR] HTTP Error: ${response.status}`);
        return null;
      }

      const result = await response.json();
      if (result && typeof result.text === "string" && result.text.trim()) {
        return result.text.trim();
      }
      return null;
    } catch (err) {
      console.warn("[Vision OCR] Exception:", err);
      return null;
    }
  }

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [resizeCanvas]);

  const screenToWorld = useCallback((screenX: number, screenY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: (screenX - rect.left - offsetRef.current.x) / zoomRef.current,
      y: (screenY - rect.top - offsetRef.current.y) / zoomRef.current,
    };
  }, []);

  const zoomAtPoint = useCallback((factor: number, screenX: number, screenY: number) => {
    const nextZoom = clampZoom(zoomRef.current * factor);
    const worldPoint = screenToWorld(screenX, screenY);
    const nextOffsetX = screenX - worldPoint.x * nextZoom;
    const nextOffsetY = screenY - worldPoint.y * nextZoom;

    zoomRef.current = nextZoom;
    offsetRef.current = { x: nextOffsetX, y: nextOffsetY };
    setZoom(nextZoom);
    setOffset(offsetRef.current);
    redraw();
  }, [redraw, screenToWorld]);

  // Get strokes that should be OCR'd
  const getOCRStrokes = useCallback(() => {
    const penStrokes = strokes.current.filter((stroke) => stroke.tool === "pen");
    if (currentStroke.current?.tool === "pen") {
      return [...penStrokes, currentStroke.current];
    }
    return penStrokes;
  }, []);

  const commitMagicText = useCallback((overlaySegments: OverlaySegment[], removedStrokeIds: string[]) => {
    const removedStrokes = strokes.current.filter((stroke) => removedStrokeIds.includes(stroke.id));
    const textStrokes: Stroke[] = overlaySegments.map((segment) => ({
      id: generateStrokeId(),
      tool: "text",
      color: segment.color || "#111827",
      size: 1,
      points: [],
      text: segment.beautifiedText,
      bbox: segment.bbox,
      fontSize: segment.fontSize,
    }));

    strokes.current = strokes.current.filter((stroke) => !removedStrokeIds.includes(stroke.id));
    strokes.current.push(...textStrokes);
    historyRef.current.push({ type: "replace", removed: removedStrokes, added: textStrokes });
    redoHistoryRef.current = [];
    magicOverlayRef.current = [];
    pendingMagicReplacementRef.current = null;
    if (magicCommitTimeout.current) {
      window.clearTimeout(magicCommitTimeout.current);
      magicCommitTimeout.current = null;
    }
    redraw();
  }, [redraw]);

  const scheduleMagicCommit = useCallback(() => {
    if (magicCommitTimeout.current) {
      window.clearTimeout(magicCommitTimeout.current);
    }

    magicCommitTimeout.current = window.setTimeout(() => {
      const pending = pendingMagicReplacementRef.current;
      if (pending && !processingRef.current) {
        commitMagicText(pending.overlaySegments, pending.removedStrokeIds);
      }
    }, 700);
  }, [commitMagicText]);

  const clearPendingMagicReplacement = useCallback(() => {
    if (magicCommitTimeout.current) {
      window.clearTimeout(magicCommitTimeout.current);
      magicCommitTimeout.current = null;
    }
    pendingMagicReplacementRef.current = null;
    magicOverlayRef.current = [];
  }, []);

  const processMagic = useCallback(
    async function processMagicFn() {
      if (!magicSettings?.ocr && !magicSettings?.beautify) {
        magicOverlayRef.current = [];
        setIsProcessing(false);
        redraw();
        return;
      }

      if (drawingRef.current) {
        setIsProcessing(false);
        processingRef.current = false;
        return;
      }

      if (processingRef.current) {
        pendingMagicRef.current = true;
        return;
      }

      processingRef.current = true;
      setIsProcessing(true);
      const canvas = canvasRef.current;
      if (!canvas) {
        processingRef.current = false;
        setIsProcessing(false);
        return;
      }

      const ocrStrokes = getOCRStrokes();
      console.log("[OCR Processing] Started", { strokeCount: ocrStrokes.length, canvasSize: `${canvas.width}x${canvas.height}` });
      
      if (ocrStrokes.length === 0) {
        console.log("[OCR] No strokes found");
        // Preserve existing overlay if text was already replaced
        if (magicOverlayRef.current.length > 0) {
          setIsProcessing(false);
          redraw();
          processingRef.current = false;
          return;
        }

        magicOverlayRef.current = [];
        setIsProcessing(false);
        redraw();
        processingRef.current = false;
        return;
      }

      const clusters = groupStrokesIntoClusters(ocrStrokes);
      if (clusters.length === 0) {
        console.log("[OCR] No clusters found");
        if (magicOverlayRef.current.length > 0) {
          setIsProcessing(false);
          redraw();
          processingRef.current = false;
          return;
        }

        magicOverlayRef.current = [];
        setIsProcessing(false);
        redraw();
        processingRef.current = false;
        return;
      }

      try {
        const overlaySegments: OverlaySegment[] = [];
        const recognizedStrokeIds = new Set<string>();

        for (const cluster of clusters) {
          const wordClusters = splitStrokeClusterByWordGap(cluster);
          for (const subCluster of wordClusters) {
            const clusterBBox = getStrokeBoundingBox(subCluster);
            if (clusterBBox.width === 0 || clusterBBox.height === 0) {
              continue;
            }

            const beforeOverlayCount = overlaySegments.length;
            const padding = 20;
            const renderScale = 2;
            const strokeCanvas = document.createElement("canvas");
            strokeCanvas.width = Math.ceil((clusterBBox.width + padding * 2) * renderScale);
            strokeCanvas.height = Math.ceil((clusterBBox.height + padding * 2) * renderScale);
            const strokeCtx = strokeCanvas.getContext("2d");
            if (!strokeCtx) {
              console.error("[OCR] Failed to get canvas context");
              continue;
            }

            strokeCtx.fillStyle = "#ffffff";
            strokeCtx.fillRect(0, 0, strokeCanvas.width, strokeCanvas.height);

            strokeCtx.save();
            strokeCtx.scale(renderScale, renderScale);
            strokeCtx.translate(-clusterBBox.x + padding, -clusterBBox.y + padding);
            for (const stroke of subCluster) {
              drawStrokeForOCR(strokeCtx, stroke);
            }
            strokeCtx.restore();

            let recognizedText = "";

            // Primary: OpenAI Vision API for extreme handwriting recognition accuracy
            const visionResult = await performVisionOCR(strokeCanvas);
            if (visionResult) {
              recognizedText = visionResult;
              console.log("[OCR] Vision AI recognized text:", visionResult);
            } else {
              // Fallback: Local Tesseract worker
              const worker = await initWorker();
              if (worker) {
                const rawResult = await worker.recognize(strokeCanvas);
                const ocrData = rawResult?.data ?? rawResult;
                if (typeof ocrData === "string") {
                  recognizedText = ocrData.trim();
                } else if (typeof ocrData?.text === "string") {
                  recognizedText = ocrData.text.trim();
                }
              }
            }

            const normalizedText = recognizedText.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
            if (!normalizedText) {
              continue;
            }

            const cleanedText = magicSettings?.beautify
              ? formatBeautifiedText(normalizedText)
              : normalizedText;

            const finalFormatted = cleanedText || normalizedText;
            if (!finalFormatted) continue;


            if (magicSettings?.equationDetection) {
              const cleanEq = normalizedText.replace(/\s+/g, "").toLowerCase();
              const isEquation =
                /[0-9]x|[0-9]y|x[0-9]|[a-z]=|=[0-9a-z]|sin|cos|tan|sqrt|\^2|²|³|\bx\b.*=|\by\b.*=/.test(
                  cleanEq
                ) && /=/.test(cleanEq);
              if (isEquation) {
                console.log("[Equation Detected — skipping beautify]", normalizedText);
                onEquationDetected?.(normalizedText);
                // Skip overlaying text — keep handwriting intact for equations
                continue;
              }
            }

            const strokeColor = subCluster[0]?.color || color || "#111827";

            overlaySegments.push({
              text: normalizedText,
              beautifiedText: finalFormatted,
              fontSize: Math.max(14, Math.round(clusterBBox.height * 0.92)),
              color: strokeColor,
              bbox: {
                x: clusterBBox.x,
                y: clusterBBox.y,
                width: clusterBBox.width,
                height: clusterBBox.height,
              },
            });


            if (overlaySegments.length > beforeOverlayCount) {
              for (const stroke of subCluster) {
                recognizedStrokeIds.add(stroke.id);
              }
            }
          }
        }

        const clustersToRemove = Array.from(recognizedStrokeIds);

        if (overlaySegments.length > 0) {
          commitMagicText(overlaySegments, clustersToRemove);
          console.log("[OCR Success] Replaced handwriting with beautified text", { count: overlaySegments.length });
        } else {
          console.warn("[OCR] No text recognized in any cluster");
        }

        setIsProcessing(false);
        redraw();
      } catch (error) {
        console.error("[OCR Error]", error);
        if (!magicOverlayRef.current.length) {
          magicOverlayRef.current = [];
        }
        setIsProcessing(false);
        redraw();
      } finally {
        processingRef.current = false;
        setIsProcessing(false);

        if (pendingMagicRef.current) {
          pendingMagicRef.current = false;
          if (magicSettings?.ocr || magicSettings?.beautify) {
            processMagicFn();
          }
        }
      }
    },
    [getOCRStrokes, initWorker, magicSettings?.beautify, magicSettings?.ocr, redraw]
  );

  const clearIdleMagicTimeout = useCallback(() => {
    if (magicIdleTimeout.current) {
      window.clearTimeout(magicIdleTimeout.current);
      magicIdleTimeout.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearIdleMagicTimeout();
      if (magicCommitTimeout.current) {
        window.clearTimeout(magicCommitTimeout.current);
      }
    };
  }, [clearIdleMagicTimeout]);

  const scheduleMagicAfterIdle = useCallback(
    (delay = 3000) => {
      clearIdleMagicTimeout();
      magicIdleTimeout.current = window.setTimeout(() => {
        magicIdleTimeout.current = null;
        if (magicSettings?.ocr || magicSettings?.beautify) {
          console.log("[OCR] Idle timeout reached, processing OCR");
          processMagic();
        }
      }, delay);
    },
    [clearIdleMagicTimeout, magicSettings?.ocr, magicSettings?.beautify, processMagic]
  );

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button === 2) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        offsetX: offsetRef.current.x,
        offsetY: offsetRef.current.y,
      };
      return;
    }

    if (tool === "pan" || tool === "laser") {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        offsetX: offsetRef.current.x,
        offsetY: offsetRef.current.y,
      };
      return;
    }

    clearIdleMagicTimeout();
    clearPendingMagicReplacement();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const point = screenToWorld(e.clientX, e.clientY);
    currentStroke.current = {
      id: generateStrokeId(),
      tool,
      color: tool === "eraser" ? "#ffffff" : color,
      size: tool === "eraser" ? 20 : tool === "highlighter" ? 12 : penSize,
      points: [point],
    };

    setDrawing(true);
    redraw();
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanning && panStartRef.current) {
      const deltaX = e.clientX - panStartRef.current.x;
      const deltaY = e.clientY - panStartRef.current.y;
      offsetRef.current = {
        x: panStartRef.current.offsetX + deltaX,
        y: panStartRef.current.offsetY + deltaY,
      };
      setOffset(offsetRef.current);
      redraw();
      return;
    }

    if (!drawing || tool === "pan" || tool === "laser") return;

    const point = screenToWorld(e.clientX, e.clientY);
    if (!currentStroke.current) return;

    currentStroke.current.points.push(point);
    redraw();
  };

  const stopDrawing = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
      return;
    }

    if (!currentStroke.current) return;

    const stroke = currentStroke.current;
    if (stroke.tool === "eraser") {
      const removed: Stroke[] = [];
      strokes.current = strokes.current.filter((existing) => {
        if (existing.id === stroke.id) return false;
        const erased = stroke.points.some((point) => pointIntersectsStroke(point, existing, 14));
        if (erased) {
          removed.push(existing);
          return false;
        }
        return true;
      });

      if (removed.length > 0) {
        historyRef.current.push({ type: "remove", strokes: removed });
        redoHistoryRef.current = [];
      }
    } else {
      strokes.current.push(stroke);
      historyRef.current.push({ type: "add", stroke });
      redoHistoryRef.current = [];
    }

    currentStroke.current = null;
    setDrawing(false);
    redraw();

    console.log("[Drawing Stopped] Triggering OCR", { hasSettings: !!magicSettings, ocr: magicSettings?.ocr, beautify: magicSettings?.beautify });
    
    if (magicSettings?.ocr || magicSettings?.beautify) {
      console.log("[OCR] Scheduling idle beautify after stopDrawing");
      scheduleMagicAfterIdle(800);
    } else {
      console.warn("[OCR] Magic settings disabled!");
    }
  }, [isPanning, magicSettings?.beautify, magicSettings?.ocr, processMagic, redraw, magicSettings]);

  useEffect(() => {
    processMagic();
  }, [magicSettings?.ocr, magicSettings?.beautify, processMagic]);

  const undo = useCallback(() => {
    const action = historyRef.current.pop();
    if (!action) return;

    if (action.type === "add") {
      strokes.current = strokes.current.filter((stroke) => stroke.id !== action.stroke.id);
    } else if (action.type === "remove") {
      strokes.current.push(...action.strokes);
    } else if (action.type === "replace") {
      strokes.current = strokes.current.filter((stroke) => !action.added.some((added) => added.id === stroke.id));
      strokes.current.push(...action.removed);
    }

    redoHistoryRef.current.push(action);
    redraw();
  }, [redraw]);

  const redo = useCallback(() => {
    const action = redoHistoryRef.current.pop();
    if (!action) return;

    if (action.type === "add") {
      strokes.current.push(action.stroke);
    } else if (action.type === "remove") {
      strokes.current = strokes.current.filter((stroke) => !action.strokes.some((removed) => removed.id === stroke.id));
    } else if (action.type === "replace") {
      strokes.current = strokes.current.filter((stroke) => !action.removed.some((removed) => removed.id === stroke.id));
      strokes.current.push(...action.added);
    }

    historyRef.current.push(action);
    redraw();
  }, [redraw]);

  const clear = useCallback(() => {
    strokes.current = [];
    redoStack.current = [];
    currentStroke.current = null;
    magicOverlayRef.current = [];
    setDrawing(false);
    setIsPanning(false);
    redraw();
  }, [redraw]);

  const exportCanvasPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    exportPNG(canvas);
  }, []);

  const zoomIn = useCallback(() => {
    zoomAtPoint(1.1, window.innerWidth / 2, window.innerHeight / 2);
  }, [zoomAtPoint]);

  const zoomOut = useCallback(() => {
    zoomAtPoint(0.9, window.innerWidth / 2, window.innerHeight / 2);
  }, [zoomAtPoint]);

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.08 : 0.92;
      zoomAtPoint(factor, event.clientX, event.clientY);
    },
    [zoomAtPoint]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const resetView = useCallback(() => {
    zoomRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    redraw();
  }, [redraw]);

  useImperativeHandle(
    ref,
    () => ({
      undo,
      redo,
      clear,
      exportPNG: exportCanvasPNG,
      zoomIn,
      zoomOut,
      resetView,
    }),
    [undo, redo, clear, exportCanvasPNG, zoomIn, zoomOut, resetView]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
        return;
      }

      if (e.ctrlKey && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }

      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        exportCanvasPNG();
        return;
      }

      switch (e.key.toLowerCase()) {
        case "p":
          setTool("pen");
          break;
        case "e":
          setTool("eraser");
          break;
        case "h":
          setTool("highlighter");
          break;
        case "1":
          setColor("#000000");
          break;
        case "2":
          setColor("#2563eb");
          break;
        case "3":
          setColor("#ef4444");
          break;
        case "4":
          setColor("#16a34a");
          break;
        case "0":
          resetView();
          break;
        case "+":
        case "=":
          zoomIn();
          break;
        case "-":
          zoomOut();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo, exportCanvasPNG, resetView, setTool, setColor, zoomIn, zoomOut]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_rgba(245,245,245,1))]">
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full touch-none ${tool === "pan" ? "cursor-grab" : "cursor-crosshair"}`}
        style={{ touchAction: "none" }}
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          startDrawing(e);
        }}
        onPointerMove={draw}
        onPointerUp={(e) => {
          stopDrawing();
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        onPointerLeave={() => {
          if (drawing || isPanning) {
            stopDrawing();
          }
        }}
        onPointerCancel={stopDrawing}
      />

      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-zinc-900/90 px-4 py-2 text-sm text-zinc-100 shadow-lg backdrop-blur">
        <span className="font-medium">
          {tool === "pen"
            ? "Pen"
            : tool === "eraser"
              ? "Eraser"
              : tool === "highlighter"
                ? "Highlighter"
                : tool === "pan"
                  ? "Pan"
                  : tool === "line"
                    ? "Line"
                    : tool === "rectangle"
                      ? "Rectangle"
                      : tool === "circle"
                        ? "Circle"
                        : tool === "arrow"
                          ? "Arrow"
                          : "Laser"}
        </span>
        <span className="text-zinc-400">•</span>
        <span>{color}</span>
        <span className="text-zinc-400">•</span>
        <span>{penSize}px</span>
        <span className="text-zinc-400">•</span>
        <span>{zoom.toFixed(2)}×</span>
      </div>

      <div className="absolute bottom-4 right-4 z-10 rounded-full bg-zinc-900/70 px-3 py-2 text-xs text-zinc-300 shadow-lg backdrop-blur">
        {assistTool === "none" ? "No helper" : `${assistTool} helper active`}
      </div>
    </div>
  );
});

WhiteboardCanvas.displayName = "WhiteboardCanvas";

export default WhiteboardCanvas;