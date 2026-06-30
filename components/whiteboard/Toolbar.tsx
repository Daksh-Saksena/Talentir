"use client";

import { Tool } from "./types";

interface ToolbarProps {
  tool?: Tool;
  setTool?: (tool: Tool) => void;

  color?: string;
  setColor?: (color: string) => void;

  penSize?: number;
  setPenSize?: (size: number) => void;

  undo?: () => void;
  redo?: () => void;
  clear?: () => void;

  exportPNG?: () => void;
}

const COLORS = [
  "#000000",
  "#2563eb",
  "#ef4444",
  "#16a34a",
  "#eab308",
  "#9333ea",
  "#f97316",
];

export default function Toolbar({
  tool = "pen",
  setTool = () => {},

  color = "#000000",
  setColor = () => {},

  penSize = 3,
  setPenSize = () => {},

  undo = () => {},
  redo = () => {},
  clear = () => {},

  exportPNG = () => {},
}: ToolbarProps) {
  const toolButton = (
    icon: string,
    label: string,
    value: Tool
  ) => (
    <button
      title={label}
      onClick={() => setTool(value)}
      className={`w-12 h-12 rounded-xl transition-all duration-200 text-xl
      ${
        tool === value
          ? "bg-blue-600 text-white shadow-lg scale-105"
          : "bg-zinc-800 hover:bg-zinc-700 text-white"
      }`}
    >
      {icon}
    </button>
  );

  return (
    <div className="flex flex-col gap-4">

      {/* Toolbar */}
      <div className="w-20 rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-zinc-700 p-3 shadow-2xl">

        <div className="flex flex-col items-center gap-3">

          {toolButton("✏️", "Pen (P)", "pen")}

          {toolButton("🧽", "Eraser (E)", "eraser")}

          {toolButton("🖍️", "Highlighter", "highlighter")}

          {toolButton("📍", "Laser Pointer", "laser")}

          {toolButton("✋", "Pan", "pan")}

          <hr className="w-full border-zinc-700"/>

          <button
            onClick={undo}
            title="Undo (Ctrl+Z)"
            className="w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            ↩
          </button>

          <button
            onClick={redo}
            title="Redo (Ctrl+Y)"
            className="w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            ↪
          </button>

          <button
            onClick={clear}
            title="Clear"
            className="w-12 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white"
          >
            🗑
          </button>

          <button
            onClick={exportPNG}
            title="Export PNG"
            className="w-12 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            💾
          </button>

        </div>
      </div>

      {/* Colour Picker */}

      <div className="rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-zinc-700 p-3 shadow-2xl">

        <p className="text-xs text-zinc-300 mb-2 text-center">
          Colour
        </p>

        <div className="grid grid-cols-2 gap-2">

          {COLORS.map((c) => (

            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 ${
                color === c
                  ? "border-white scale-110"
                  : "border-zinc-700"
              }`}
              style={{
                background: c,
              }}
            />

          ))}

        </div>

      </div>

      {/* Pen Size */}

      <div className="rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-zinc-700 p-3 shadow-2xl">

        <p className="text-xs text-zinc-300 text-center mb-2">
          Size
        </p>

        <input
          type="range"
          min={1}
          max={30}
          value={penSize}
          onChange={(e) =>
            setPenSize(Number(e.target.value))
          }
          className="w-full rotate-90 h-24"
        />

        <div className="flex justify-center mt-2">

          <div
            className="rounded-full bg-white"
            style={{
              width: penSize,
              height: penSize,
            }}
          />

        </div>

      </div>

    </div>
  );
}