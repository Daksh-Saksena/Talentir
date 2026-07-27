"use client";

import { MagicSettings } from "./types";

interface MagicBarProps {
  settings?: MagicSettings;
  setSettings?: (settings: MagicSettings) => void;

  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

const defaultSettings: MagicSettings = {
  ocr: true,
  beautify: true,
  smartSuggestions: true,
  equationDetection: true,
  chemistryDetection: true,
  shapeDetection: true,
};

export default function MagicBar({
  settings = defaultSettings,
  setSettings = () => {},
  suggestions = [],
  onSuggestionClick = () => {},
}: MagicBarProps) {
  const toggle = (key: keyof MagicSettings) => {
    setSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const Toggle = ({
    label,
    field,
  }: {
    label: string;
    field: keyof MagicSettings;
  }) => (
    <button
      onClick={() => toggle(field)}
      className={`flex items-center justify-between rounded-xl px-3 py-2 transition
      ${
        settings[field]
          ? "bg-blue-600 text-white"
          : "bg-zinc-800 text-zinc-300"
      }`}
    >
      <span>{label}</span>

      <span className="text-lg">
        {settings[field] ? "✓" : ""}
      </span>
    </button>
  );

  return (
    <div className="w-80 rounded-3xl bg-zinc-900/90 backdrop-blur-xl border border-zinc-700 shadow-2xl overflow-hidden">

      {/* Header */}

      <div className="border-b border-zinc-700 p-4">

        <h2 className="text-xl font-bold text-white">
          🪄 Magic Bar
        </h2>

        <p className="text-sm text-zinc-400 mt-1">
          AI tools and smart whiteboard features
        </p>

      </div>

      {/* Live Features */}

      <div className="p-4">

        <h3 className="font-semibold text-white mb-3">
          Live Features
        </h3>

        <div className="space-y-2">

          <Toggle
            label="OCR"
            field="ocr"
          />

          <Toggle
            label="Handwriting Beautification"
            field="beautify"
          />

          <Toggle
            label="Equation Detection"
            field="equationDetection"
          />

          <Toggle
            label="Chemistry Detection"
            field="chemistryDetection"
          />

          <Toggle
            label="Shape Detection"
            field="shapeDetection"
          />

          <Toggle
            label="Smart Suggestions"
            field="smartSuggestions"
          />

        </div>

      </div>

      {/* Suggestions */}

      <div className="border-t border-zinc-700 p-4">

        <h3 className="font-semibold text-white mb-3">
          Suggestions
        </h3>

        {suggestions.length === 0 ? (
          <div className="rounded-xl bg-zinc-800 p-4 text-center text-sm text-zinc-400">
            Nothing detected yet.
          </div>
        ) : (
          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onSuggestionClick(suggestion)}
                className="w-full rounded-xl bg-zinc-800 hover:bg-zinc-700 px-4 py-3 text-left text-white transition"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

      </div>

      {/* Future Tools */}

      <div className="border-t border-zinc-700 p-4">

        <h3 className="font-semibold text-white mb-3">
          Tools
        </h3>

        <div className="grid grid-cols-2 gap-2">

          <button className="rounded-xl bg-zinc-800 p-3 hover:bg-zinc-700">
            📈 Graph
          </button>

          <button className="rounded-xl bg-zinc-800 p-3 hover:bg-zinc-700">
            ➗ Solve
          </button>

          <button className="rounded-xl bg-zinc-800 p-3 hover:bg-zinc-700">
            📷 Diagram
          </button>

          <button className="rounded-xl bg-zinc-800 p-3 hover:bg-zinc-700">
            📝 Notes
          </button>

          <button className="rounded-xl bg-zinc-800 p-3 hover:bg-zinc-700">
            🌍 Translate
          </button>

          <button className="rounded-xl bg-zinc-800 p-3 hover:bg-zinc-700">
            🧠 Quiz
          </button>

        </div>

      </div>

    </div>
  );
}