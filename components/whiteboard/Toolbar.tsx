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
  assistTool?: string;
  setAssistTool?: (tool: string) => void;
  zoomIn?: () => void;
  zoomOut?: () => void;
  resetView?: () => void;
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
  assistTool = "none",
  setAssistTool = () => {},
  zoomIn = () => {},
  zoomOut = () => {},
  resetView = () => {},
}: ToolbarProps) {
  const toolButton = (
    icon: string,
    label: string,
    value: Tool
  ) => (
    <button
      title={label}
      onClick={() => setTool(value)}
      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 text-lg
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
    <div className="flex flex-col gap-4 p-2">

      {/* Toolbar */}
      <div className="rounded-2xl border border-zinc-700 bg-zinc-900/90 p-3 shadow-2xl backdrop-blur-xl w-[104px]">
        <div className="grid grid-cols-2 gap-2 place-items-center">

          {toolButton("✏️", "Pen (P)", "pen")}
          {toolButton("🧽", "Eraser (E)", "eraser")}
          {toolButton("🖍️", "Highlighter", "highlighter")}
          {toolButton("📍", "Laser Pointer", "laser")}
          
          <div className="col-span-2 w-full flex justify-center">
            {toolButton("✋", "Pan", "pan")}
          </div>

          <div className="col-span-2 w-full border-t border-zinc-700 my-1"/>

          {(["line", "rectangle", "circle", "arrow"] as Tool[]).map((shape) => (
            <button
              key={shape}
              title={shape}
              onClick={() => setTool(shape)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                tool === shape ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              }`}
            >
              {shape === "line" ? "╱" : shape === "rectangle" ? "▭" : shape === "circle" ? "◯" : "↗"}
            </button>
          ))}

          <div className="col-span-2 w-full border-t border-zinc-700 my-1"/>

          <button
            onClick={undo}
            title="Undo (Ctrl+Z)"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            ↩
          </button>
          <button
            onClick={redo}
            title="Redo (Ctrl+Y)"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            ↪
          </button>
          <button
            onClick={clear}
            title="Clear"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-600 hover:bg-red-700 text-white"
          >
            🗑
          </button>
          <button
            onClick={exportPNG}
            title="Export PNG"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            💾
          </button>
          <button
            onClick={zoomIn}
            title="Zoom In"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            +
          </button>
          <button
            onClick={zoomOut}
            title="Zoom Out"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            −
          </button>
          <div className="col-span-2 w-full flex justify-center">
            <button
              onClick={resetView}
              title="Reset View"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white"
            >
              ⌂
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-700 bg-zinc-900/90 p-3 shadow-2xl backdrop-blur-xl w-[104px]">
        <p className="mb-2 text-center text-xs text-zinc-300">Math</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "ruler", label: "📏" },
            { key: "compass", label: "🧭" },
            { key: "scale", label: "📐" },
            { key: "protractor", label: "∠" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setAssistTool(item.key)}
              className={`rounded-xl px-2 py-2 text-sm transition ${
                assistTool === item.key ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Colour Picker */}
      <div className="rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-zinc-700 p-3 shadow-2xl w-[104px]">
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
      <div className="rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-zinc-700 p-3 shadow-2xl w-[104px]">
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