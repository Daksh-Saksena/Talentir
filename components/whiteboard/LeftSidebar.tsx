"use client";

import { MagicSettings } from "./types";

interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  settings: MagicSettings;
  setSettings: (settings: MagicSettings) => void;
}

export default function LeftSidebar({
  isOpen,
  onClose,
  settings,
  setSettings,
}: LeftSidebarProps) {
  const toggle = (field: keyof MagicSettings) => {
    setSettings({
      ...settings,
      [field]: !settings[field],
    });
  };

  return (
    <div
      className={`fixed left-0 top-0 z-50 flex h-full w-80 flex-col border-r border-zinc-800 bg-zinc-950/95 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 font-bold">
            ⚙️
          </span>
          <div>
            <h3 className="font-bold text-white text-base">Features & Control</h3>
            <p className="text-xs text-zinc-400">Whiteboard AI Settings</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Toggles List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Whiteboard AI Features
        </div>

        {/* OCR Toggle */}
        <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔤</span>
            <div>
              <div className="text-sm font-semibold text-white">Handwriting OCR</div>
              <div className="text-xs text-zinc-400">Recognize written text</div>
            </div>
          </div>
          <button
            onClick={() => toggle("ocr")}
            className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
              settings.ocr ? "bg-blue-600" : "bg-zinc-700"
            }`}
          >
            <div
              className={`h-5 w-5 rounded-full bg-white transition-transform ${
                settings.ocr ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Beautify Toggle */}
        <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">✨</span>
            <div>
              <div className="text-sm font-semibold text-white">Beautification</div>
              <div className="text-xs text-zinc-400">Convert handwriting to font</div>
            </div>
          </div>
          <button
            onClick={() => toggle("beautify")}
            className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
              settings.beautify ? "bg-blue-600" : "bg-zinc-700"
            }`}
          >
            <div
              className={`h-5 w-5 rounded-full bg-white transition-transform ${
                settings.beautify ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Equation Detection / Auto Graphing Toggle */}
        <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">📈</span>
            <div>
              <div className="text-sm font-semibold text-white">Equation Auto-Graphing</div>
              <div className="text-xs text-zinc-400">Plot math equations on board</div>
            </div>
          </div>
          <button
            onClick={() => toggle("equationDetection")}
            className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
              settings.equationDetection ? "bg-emerald-600" : "bg-zinc-700"
            }`}
          >
            <div
              className={`h-5 w-5 rounded-full bg-white transition-transform ${
                settings.equationDetection ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Shape Recognition Toggle */}
        <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">📐</span>
            <div>
              <div className="text-sm font-semibold text-white">Shape Recognition</div>
              <div className="text-xs text-zinc-400">Snap lines, circles, boxes</div>
            </div>
          </div>
          <button
            onClick={() => toggle("shapeDetection")}
            className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
              settings.shapeDetection ? "bg-purple-600" : "bg-zinc-700"
            }`}
          >
            <div
              className={`h-5 w-5 rounded-full bg-white transition-transform ${
                settings.shapeDetection ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Smart Suggestions Toggle */}
        <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">💡</span>
            <div>
              <div className="text-sm font-semibold text-white">Smart AI Suggestions</div>
              <div className="text-xs text-zinc-400">Contextual prompt hints</div>
            </div>
          </div>
          <button
            onClick={() => toggle("smartSuggestions")}
            className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
              settings.smartSuggestions ? "bg-amber-600" : "bg-zinc-700"
            }`}
          >
            <div
              className={`h-5 w-5 rounded-full bg-white transition-transform ${
                settings.smartSuggestions ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="border-t border-zinc-800 p-4 text-center text-xs text-zinc-500">
        Classroom Copilot • AI Whiteboard v2.0
      </div>
    </div>
  );
}
