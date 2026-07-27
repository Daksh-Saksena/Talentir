"use client";

import { useRef, useState } from "react";

import Toolbar from "@/components/whiteboard/Toolbar";
import WhiteboardCanvas, {
  WhiteboardCanvasHandle,
} from "@/components/whiteboard/WhiteboardCanvas";
import MagicBar from "@/components/whiteboard/MagicBar";
import { MagicSettings, Tool } from "@/components/whiteboard/types";

const starterSuggestions = [
  "Turn this into a neat study summary",
  "Extract the key equations",
  "Convert this into a labeled diagram",
  "Highlight the important concepts",
];

const defaultMagicSettings: MagicSettings = {
  ocr: true,
  beautify: true,
  smartSuggestions: true,
  equationDetection: true,
  chemistryDetection: true,
  shapeDetection: true,
};

export default function WhiteboardPage() {
  const canvasRef = useRef<WhiteboardCanvasHandle>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#000000");
  const [penSize, setPenSize] = useState(3);
  const [magicSettings, setMagicSettings] = useState<MagicSettings>(
    defaultMagicSettings
  );
  const [suggestions, setSuggestions] = useState(starterSuggestions);
  const [assistTool, setAssistTool] = useState("none");
  const [magicOpen, setMagicOpen] = useState(false);

  const handleUndo = () => canvasRef.current?.undo();
  const handleRedo = () => canvasRef.current?.redo();
  const handleClear = () => canvasRef.current?.clear();
  const handleExport = () => canvasRef.current?.exportPNG();

  const handleSuggestionClick = (suggestion: string) => {
    setSuggestions((current) => [suggestion, ...current.filter((item) => item !== suggestion)]);
  };

  const toolLabel =
    tool === "eraser"
      ? "Eraser"
      : tool === "highlighter"
        ? "Highlighter"
        : tool === "pan"
          ? "Pan"
          : tool === "laser"
            ? "Laser"
            : "Pen";

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#171717]">
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-white/10 bg-zinc-950/70 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMagicOpen((value) => !value)}
            className="rounded-full bg-blue-600/20 px-3 py-1 text-sm font-semibold text-blue-200 transition hover:bg-blue-600/30"
          >
            ✨ Magic
          </button>
          <div className="text-sm text-zinc-300">Draw on the board to start</div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-zinc-900/80 px-3 py-1.5 text-sm text-zinc-100">
          <span className="font-medium">{toolLabel}</span>
          <span className="text-zinc-500">•</span>
          <span>{color}</span>
          <span className="text-zinc-500">•</span>
          <span>{penSize}px</span>
        </div>
      </div>

      <div className="group absolute left-0 top-0 z-20 flex h-full w-24 items-start pt-16">
        <div className="pointer-events-none -translate-x-4 opacity-0 transition-all duration-300 group-hover:pointer-events-auto group-hover:translate-x-0 group-hover:opacity-100">
          <div className="pointer-events-auto max-h-[calc(100vh-5rem)] overflow-y-auto rounded-2xl">
            <Toolbar
              tool={tool}
              setTool={setTool}
              color={color}
              setColor={setColor}
              penSize={penSize}
              setPenSize={setPenSize}
              undo={handleUndo}
              redo={handleRedo}
              clear={handleClear}
              exportPNG={handleExport}
              assistTool={assistTool}
              setAssistTool={setAssistTool}
              zoomIn={() => canvasRef.current?.zoomIn()}
              zoomOut={() => canvasRef.current?.zoomOut()}
              resetView={() => canvasRef.current?.resetView()}
            />
          </div>
        </div>
      </div>

      <div className="h-full w-full pt-14">
        <WhiteboardCanvas
          ref={canvasRef}
          tool={tool}
          setTool={setTool}
          color={color}
          setColor={setColor}
          penSize={penSize}
          setPenSize={setPenSize}
          assistTool={assistTool}
          setAssistTool={setAssistTool}
          magicSettings={magicSettings}
        />
      </div>

      <div
        className="absolute right-0 top-0 z-20 flex h-full w-[24rem] max-w-[90vw] items-start justify-end pt-16 pr-3"
        style={{
          transform: magicOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s ease",
        }}
      >
        <div className="pointer-events-auto max-h-[calc(100vh-5rem)] overflow-y-auto rounded-3xl">
          <div className="mb-2 flex justify-end pr-4">
            <button
              onClick={() => setMagicOpen(false)}
              className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-200 hover:bg-zinc-700"
            >
              Close
            </button>
          </div>
          <MagicBar
            settings={magicSettings}
            setSettings={setMagicSettings}
            suggestions={suggestions}
            onSuggestionClick={handleSuggestionClick}
          />
        </div>
      </div>
    </div>
  );
}