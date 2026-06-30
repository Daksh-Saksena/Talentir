"use client";

import { useEffect, useRef, useState } from "react";

import { Stroke, Tool } from "./types";

import {
  drawStroke,
  redrawCanvas,
  getPointerPosition,
  exportPNG,
} from "./utils";

export default function WhiteboardCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const strokes = useRef<Stroke[]>([]);
  const redoStack = useRef<Stroke[]>([]);
  const currentStroke = useRef<Stroke | null>(null);

  const [drawing, setDrawing] = useState(false);

  const [tool, setTool] =
    useState<Tool>("pen");

  const [colour, setColour] =
    useState("#000000");

  const [penSize, setPenSize] =
    useState(3);

  const redraw = () => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx =
      canvas.getContext("2d");

    if (!ctx) return;

    redrawCanvas(
      ctx,
      canvas,
      strokes.current
    );

    if (currentStroke.current) {
      drawStroke(
        ctx,
        currentStroke.current
      );
    }
  };

const resizeCanvas = () => {
  const canvas = canvasRef.current;

  if (!canvas) return;

  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  redraw();
};

useEffect(() => {
  resizeCanvas();

  window.addEventListener(
    "resize",
    resizeCanvas
  );

  return () => {
    window.removeEventListener(
      "resize",
      resizeCanvas
    );
  };
}, []);

  const startDrawing = (
    e: React.PointerEvent<HTMLCanvasElement>
  ) => {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const point =
      getPointerPosition(
        e,
        canvas
      );

    currentStroke.current = {
      tool,
      color:
        tool === "eraser"
          ? "#ffffff"
          : colour,
      size:
        tool === "eraser"
          ? 20
          : tool ===
            "highlighter"
          ? 12
          : penSize,
      points: [point],
    };

    setDrawing(true);

    redraw();
  };

  const draw = (
    e: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (!drawing) return;

    const canvas =
      canvasRef.current;

    if (
      !canvas ||
      !currentStroke.current
    )
      return;

    const point =
      getPointerPosition(
        e,
        canvas
      );

    currentStroke.current.points.push(
      point
    );

    redraw();
  };

  const stopDrawing = () => {
    if (
      !currentStroke.current
    )
      return;

    strokes.current.push(
      currentStroke.current
    );

    redoStack.current = [];

    currentStroke.current =
      null;

    setDrawing(false);

    redraw();
  };
  const undo = () => {
    if (strokes.current.length === 0) return;

    const stroke = strokes.current.pop();

    if (stroke) {
      redoStack.current.push(stroke);
    }

    redraw();
  };

  const redo = () => {
    if (redoStack.current.length === 0) return;

    const stroke = redoStack.current.pop();

    if (stroke) {
      strokes.current.push(stroke);
    }

    redraw();
  };

  const clear = () => {
    strokes.current = [];
    redoStack.current = [];
    currentStroke.current = null;

    redraw();
  };

  const save = () => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    exportPNG(canvas);
  };

  useEffect(() => {
    const onKeyDown = (
      e: KeyboardEvent
    ) => {
      if (
        e.ctrlKey &&
        e.key.toLowerCase() === "z"
      ) {
        e.preventDefault();
        undo();
      }

      if (
        e.ctrlKey &&
        e.key.toLowerCase() === "y"
      ) {
        e.preventDefault();
        redo();
      }

      if (
        e.ctrlKey &&
        e.shiftKey &&
        e.key.toLowerCase() === "e"
      ) {
        e.preventDefault();
        save();
      }

      switch (
        e.key.toLowerCase()
      ) {
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
          setColour("#000000");
          break;

        case "2":
          setColour("#2563eb");
          break;

        case "3":
          setColour("#ef4444");
          break;

        case "4":
          setColour("#16a34a");
          break;

        case "+":
        case "=":
          setPenSize((s) =>
            Math.min(30, s + 1)
          );
          break;

        case "-":
          setPenSize((s) =>
            Math.max(1, s - 1)
          );
          break;
      }
    };

    window.addEventListener(
      "keydown",
      onKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        onKeyDown
      );
    };
  }, []);

  return (
    <div className="relative h-full w-full bg-white overflow-hidden">

      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none cursor-crosshair"

        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(
            e.pointerId
          );

          startDrawing(e);
        }}

        onPointerMove={draw}

        onPointerUp={(e) => {
          stopDrawing();

          e.currentTarget.releasePointerCapture(
            e.pointerId
          );
        }}

        onPointerLeave={() => {
          if (drawing) {
            stopDrawing();
          }
        }}

        onPointerCancel={stopDrawing}
      />
      {/* Floating Controls (temporary until Toolbar is connected) */}
      <div className="absolute top-4 right-4 flex flex-wrap gap-2 rounded-xl bg-zinc-900/90 p-3 shadow-xl backdrop-blur">

        <button
          onClick={() => setTool("pen")}
          className={`rounded-lg px-3 py-2 text-sm font-medium text-white transition ${
            tool === "pen"
              ? "bg-blue-600"
              : "bg-zinc-700 hover:bg-zinc-600"
          }`}
        >
          ✏ Pen
        </button>

        <button
          onClick={() => setTool("eraser")}
          className={`rounded-lg px-3 py-2 text-sm font-medium text-white transition ${
            tool === "eraser"
              ? "bg-blue-600"
              : "bg-zinc-700 hover:bg-zinc-600"
          }`}
        >
          🧽 Eraser
        </button>

        <button
          onClick={() => setTool("highlighter")}
          className={`rounded-lg px-3 py-2 text-sm font-medium text-white transition ${
            tool === "highlighter"
              ? "bg-blue-600"
              : "bg-zinc-700 hover:bg-zinc-600"
          }`}
        >
          🖍 Highlighter
        </button>

        <button
          onClick={undo}
          className="rounded-lg bg-zinc-700 px-3 py-2 text-white hover:bg-zinc-600"
        >
          ↶
        </button>

        <button
          onClick={redo}
          className="rounded-lg bg-zinc-700 px-3 py-2 text-white hover:bg-zinc-600"
        >
          ↷
        </button>

        <button
          onClick={clear}
          className="rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-500"
        >
          Clear
        </button>

        <button
          onClick={save}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-500"
        >
          Export
        </button>
      </div>

      {/* Colour Picker */}

      <div className="absolute bottom-6 left-6 flex gap-2 rounded-xl bg-zinc-900/90 p-3 backdrop-blur shadow-xl">

        {[
          "#000000",
          "#2563eb",
          "#dc2626",
          "#16a34a",
          "#ca8a04",
          "#9333ea",
        ].map((c) => (
          <button
            key={c}
            onClick={() => setColour(c)}
            className={`h-8 w-8 rounded-full border-2 ${
              colour === c
                ? "border-white"
                : "border-transparent"
            }`}
            style={{
              backgroundColor: c,
            }}
          />
        ))}

      </div>

      {/* Pen Size */}

      <div className="absolute bottom-6 left-56 flex items-center gap-3 rounded-xl bg-zinc-900/90 px-4 py-3 text-white backdrop-blur shadow-xl">

        <span className="text-sm">
          Size
        </span>

        <input
          type="range"
          min={1}
          max={30}
          value={penSize}
          onChange={(e) =>
            setPenSize(
              Number(e.target.value)
            )
          }
        />

        <span className="w-8 text-center text-sm">
          {penSize}
        </span>

      </div>

      {/* Status */}

      <div className="absolute bottom-6 right-6 rounded-xl bg-zinc-900/90 px-4 py-3 text-sm text-white backdrop-blur shadow-xl">

        <div>
          Tool:
          <span className="ml-2 font-semibold capitalize">
            {tool}
          </span>
        </div>

        <div>
          Strokes:
          <span className="ml-2 font-semibold">
            {strokes.current.length}
          </span>
        </div>

      </div>
            {/* Shortcuts */}

      <div className="absolute top-4 left-4 rounded-xl bg-zinc-900/90 px-4 py-3 text-xs text-white backdrop-blur shadow-xl">

        <div className="font-semibold mb-2">
          Shortcuts
        </div>

        <div>P - Pen</div>
        <div>E - Eraser</div>
        <div>H - Highlighter</div>
        <div>Ctrl + Z - Undo</div>
        <div>Ctrl + Y - Redo</div>
        <div>Ctrl + Shift + E - Export</div>

      </div>

    </div>
  );
}