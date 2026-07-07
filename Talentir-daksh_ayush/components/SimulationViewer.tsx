"use client";

import type { Simulation } from "@/types/simulation";
import { generateLearningContent } from "@/lib/learning";
import { useMemo } from "react";

interface SimulationViewerProps {
  simulation: Simulation;
}

// Subject → accent colour for the badge
const subjectColor: Record<string, string> = {
  Physics: "bg-blue-500/20 text-blue-300",
  Chemistry: "bg-emerald-500/20 text-emerald-300",
  Biology: "bg-amber-500/20 text-amber-300",
  Math: "bg-violet-500/20 text-violet-300",
};

const difficultyColor: Record<string, string> = {
  beginner: "bg-green-500/20 text-green-300",
  intermediate: "bg-yellow-500/20 text-yellow-300",
  advanced: "bg-red-500/20 text-red-300",
};

export default function SimulationViewer({ simulation }: SimulationViewerProps) {
  const learning = useMemo(
    () => generateLearningContent(simulation),
    [simulation]
  );

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* ── iframe ──────────────────────────── */}
      <div className="flex-1 overflow-hidden rounded-2xl border border-slate-700/60 shadow-xl shadow-black/30">
        <iframe
          key={simulation.id}
          src={simulation.url}
          title={simulation.title}
          width="100%"
          height="560"
          className="block bg-black"
          allow="fullscreen"
        />
      </div>

      {/* ── Learning panel ──────────────────── */}
      <aside className="w-full lg:w-80 flex-shrink-0 space-y-5 overflow-y-auto max-h-[calc(100vh-8rem)]">
        <div>
          <h2 className="text-2xl font-bold text-white">{simulation.title}</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${subjectColor[simulation.subject] ?? "bg-slate-700 text-slate-300"}`}>
              {simulation.subject}
            </span>
            <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold capitalize ${difficultyColor[simulation.difficulty] ?? "bg-slate-700 text-slate-300"}`}>
              {simulation.difficulty}
            </span>
            <span className="inline-block rounded-full bg-slate-700/50 px-3 py-0.5 text-xs font-semibold text-slate-400">
              {simulation.grades.join(", ")}
            </span>
          </div>
        </div>

        {/* Concept summary */}
        <p className="text-sm leading-relaxed text-slate-400">
          {learning.conceptSummary}
        </p>

        {/* What to observe */}
        <div className="rounded-xl bg-slate-800/50 p-4 border border-slate-700/40">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            👀 What to Observe
          </h3>
          <ul className="list-disc pl-4 space-y-1 text-sm text-slate-300">
            {learning.observations.map((obs, i) => (
              <li key={i}>{obs}</li>
            ))}
          </ul>
        </div>

        {/* Suggested experiments */}
        <div className="rounded-xl bg-slate-800/50 p-4 border border-slate-700/40">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            🧪 Try These Experiments
          </h3>
          <ul className="list-disc pl-4 space-y-1 text-sm text-slate-300">
            {learning.experiments.map((exp, i) => (
              <li key={i}>{exp}</li>
            ))}
          </ul>
        </div>

        {/* Learning goals */}
        <div className="rounded-xl bg-indigo-500/10 p-4 border border-indigo-500/20">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">
            🎯 Learning Goals
          </h3>
          <ul className="list-disc pl-4 space-y-1 text-sm text-indigo-200/80">
            {learning.learningGoals.map((goal, i) => (
              <li key={i}>{goal}</li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
