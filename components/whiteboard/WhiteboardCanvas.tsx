"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { createWorker, PSM } from "tesseract.js";

import { Point, Stroke, Tool, MagicSettings } from "./types";
import { drawStroke, redrawCanvas, getPointerPosition, exportPNG } from "./utils";

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
function drawStrokeForOCR(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.points.length === 0) return;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#000000";
  ctx.fillStyle = "#000000";
  ctx.globalAlpha = 1;
  ctx.lineWidth = Math.max(3, stroke.size * 1.5); // Thicker for better OCR

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
    // Pen/freehand - use smooth interpolation for handwriting
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
    
    if (gray < 200) { // Dark pixels (content)
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
    x: Math.max(0, minX - 16),
    y: Math.max(0, minY - 16),
    width: maxX - minX + 32,
    height: maxY - minY + 32,
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

const WhiteboardCanvas = forwardRef<WhiteboardCanvasHandle, WhiteboardCanvasProps>(function WhiteboardCanvas(
  { tool, color, penSize, setTool, setColor, setPenSize, assistTool = "none", setAssistTool, magicSettings },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const redoStack = useRef<Stroke[]>([]);
  const currentStroke = useRef<Stroke | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const magicOverlayRef = useRef<{
    text: string;
    beautifiedText: string;
    bbox: { x: number; y: number; width: number; height: number };
  } | null>(null);
  const workerRef = useRef<any>(null);
  const processingRef = useRef(false);
  const pendingMagicRef = useRef(false);
  const magicUpdateTimeout = useRef<number | null>(null);
  const offsetRef = useRef(offset);
  const zoomRef = useRef(zoom);
  const panStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

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

    if (magicOverlayRef.current?.beautifiedText) {
      const overlay = magicOverlayRef.current;
      ctx.save();
      ctx.font = "bold 32px Arial, sans-serif";
      ctx.fillStyle = "rgba(17, 24, 39, 0.95)";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#111827";
      wrapText(ctx, overlay.beautifiedText, overlay.bbox.x, overlay.bbox.y, overlay.bbox.width, 40);
      ctx.restore();
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

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (workerRef.current?.terminate) {
        workerRef.current.terminate();
      }
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

  const initWorker = useCallback(async () => {
    if (workerRef.current) {
      return workerRef.current;
    }

    const worker: any = await createWorker("eng");
    await worker.load();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");
    await worker.setParameters({
      tessedit_char_whitelist:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?:-/()[]{}@#$%&*+=_'\"",
      preserve_interword_spaces: "1",
      tesseract_create_hocr: "0",
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    });

    workerRef.current = worker;
    return workerRef.current;
  }, []);

  const processMagic = useCallback(
    async function processMagicFn() {
      if (!magicSettings?.ocr && !magicSettings?.beautify) {
        magicOverlayRef.current = null;
        setIsProcessing(false);
        redraw();
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
        magicOverlayRef.current = null;
        setIsProcessing(false);
        redraw();
        processingRef.current = false;
        return;
      }

      const bbox = getStrokeBoundingBox(ocrStrokes);
      if (bbox.width === 0 || bbox.height === 0) {
        console.warn("[OCR] Invalid bounding box");
        magicOverlayRef.current = null;
        setIsProcessing(false);
        redraw();
        processingRef.current = false;
        return;
      }

      try {
        const worker = await initWorker();

        const renderScale = 5;
        const strokeCanvas = document.createElement("canvas");
        strokeCanvas.width = Math.max(100, canvas.width * renderScale);
        strokeCanvas.height = Math.max(100, canvas.height * renderScale);
        const strokeCtx = strokeCanvas.getContext("2d");
        if (!strokeCtx) {
          console.error("[OCR] Failed to get canvas context");
          throw new Error("OCR canvas context unavailable");
        }

        strokeCtx.fillStyle = "#ffffff";
        strokeCtx.fillRect(0, 0, strokeCanvas.width, strokeCanvas.height);

        strokeCtx.save();
        strokeCtx.scale(renderScale, renderScale);
        for (const stroke of ocrStrokes) {
          drawStrokeForOCR(strokeCtx, stroke);
        }
        strokeCtx.restore();

        const imageData = strokeCtx.getImageData(0, 0, strokeCanvas.width, strokeCanvas.height);
        const cropRect = findContentBBox(imageData);
        const processCanvas = document.createElement("canvas");
        processCanvas.width = cropRect.w;
        processCanvas.height = cropRect.h;
        const processCtx = processCanvas.getContext("2d");
        if (!processCtx) {
          console.error("[OCR] Failed to get process canvas context");
          throw new Error("Process canvas context unavailable");
        }

        processCtx.fillStyle = "#ffffff";
        processCtx.fillRect(0, 0, processCanvas.width, processCanvas.height);
        processCtx.drawImage(
          strokeCanvas,
          cropRect.x,
          cropRect.y,
          cropRect.w,
          cropRect.h,
          0,
          0,
          cropRect.w,
          cropRect.h
        );

        const processedImageData = processCtx.getImageData(0, 0, processCanvas.width, processCanvas.height);
        const data = processedImageData.data;
        const threshold = 140;
        for (let i = 0; i < data.length; i += 4) {
          const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const pixel = gray < threshold ? 0 : 255;
          data[i] = pixel;
          data[i + 1] = pixel;
          data[i + 2] = pixel;
          data[i + 3] = 255;
        }
        processCtx.putImageData(processedImageData, 0, 0);

        console.log("[OCR] Sending to Tesseract", { canvasSize: `${processCanvas.width}x${processCanvas.height}` });
        const { data: ocrData } = await worker.recognize(processCanvas);

        let normalizedText = ocrData?.text?.trim() || "";
        console.log("[OCR Result] Raw", { text: normalizedText, length: normalizedText.length });

        normalizedText = normalizedText.replace(/\s+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim();

        let beautifiedText = normalizedText;
        if (magicSettings?.beautify) {
          beautifiedText = formatBeautifiedText(normalizedText);
        }

        console.log("[OCR Final]", { raw: normalizedText, beautified: beautifiedText });

        if (normalizedText && normalizedText.length > 0) {
          strokes.current = strokes.current.filter((stroke) => {
            if (stroke.tool !== "pen") return true;
            const strokeBBox = getStrokeBoundingBox([stroke]);
            return !rectanglesIntersect(strokeBBox, bbox);
          });

          magicOverlayRef.current = {
            text: normalizedText,
            beautifiedText: beautifiedText || normalizedText,
            bbox,
          };
          console.log("[OCR Success] Text ready for display");
        } else {
          console.warn("[OCR] No text recognized");
          magicOverlayRef.current = null;
        }

        setIsProcessing(false);
        redraw();
      } catch (error) {
        console.error("[OCR Error]", error);
        magicOverlayRef.current = null;
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

  const scheduleMagicUpdate = useCallback(() => {
    if (magicUpdateTimeout.current) {
      window.clearTimeout(magicUpdateTimeout.current);
    }
    // More aggressive OCR triggering - every 150ms while drawing
    magicUpdateTimeout.current = window.setTimeout(() => {
      if (magicSettings?.ocr || magicSettings?.beautify) {
        console.log("[OCR] Triggering", { ocr: magicSettings?.ocr, beautify: magicSettings?.beautify });
        processMagic();
      }
      magicUpdateTimeout.current = null;
    }, 150);
  }, [processMagic, magicSettings?.ocr, magicSettings?.beautify]);

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

    const canvas = canvasRef.current;
    if (!canvas) return;

    const point = screenToWorld(e.clientX, e.clientY);
    currentStroke.current = {
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
    scheduleMagicUpdate();
  };

  const stopDrawing = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
      return;
    }

    if (!currentStroke.current) return;

    strokes.current.push(currentStroke.current);
    redoStack.current = [];
    currentStroke.current = null;
    setDrawing(false);
    redraw();

    console.log("[Drawing Stopped] Triggering OCR", { hasSettings: !!magicSettings, ocr: magicSettings?.ocr, beautify: magicSettings?.beautify });
    
    if (magicSettings?.ocr || magicSettings?.beautify) {
      console.log("[OCR] Starting immediately from stopDrawing");
      processMagic();
    } else {
      console.warn("[OCR] Magic settings disabled!");
    }
  }, [isPanning, magicSettings?.beautify, magicSettings?.ocr, processMagic, redraw, magicSettings]);

  useEffect(() => {
    processMagic();
  }, [magicSettings?.ocr, magicSettings?.beautify, processMagic]);

  const undo = useCallback(() => {
    if (strokes.current.length === 0) return;

    const stroke = strokes.current.pop();
    if (stroke) redoStack.current.push(stroke);

    redraw();
  }, [redraw]);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;

    const stroke = redoStack.current.pop();
    if (stroke) strokes.current.push(stroke);

    redraw();
  }, [redraw]);

  const clear = useCallback(() => {
    strokes.current = [];
    redoStack.current = [];
    currentStroke.current = null;
    magicOverlayRef.current = null;
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