"use client";

import type { Simulation } from "@/types/simulation";

interface SimulationCardProps {
  simulation: Simulation;
  isActive: boolean;
  onClick: () => void;
}

// Subject → colour mapping for the badge
const subjectColor: Record<string, string> = {
  Physics: "bg-blue-500/20 text-blue-300",
  Chemistry: "bg-emerald-500/20 text-emerald-300",
  Biology: "bg-amber-500/20 text-amber-300",
  Math: "bg-violet-500/20 text-violet-300",
};

const difficultyDot: Record<string, string> = {
  beginner: "bg-green-400",
  intermediate: "bg-yellow-400",
  advanced: "bg-red-400",
};

export default function SimulationCard({
  simulation,
  isActive,
  onClick,
}: SimulationCardProps) {
  return (
    <button
      id={`sim-card-${simulation.id}`}
      onClick={onClick}
      className={`group flex items-center gap-3 w-full rounded-xl p-2.5 text-left transition-all duration-150
        ${
          isActive
            ? "bg-indigo-600/20 border border-indigo-500/50 shadow-lg shadow-indigo-500/10"
            : "hover:bg-slate-800/70 border border-transparent hover:scale-[1.01]"
        }`}
    >
      {/* Thumbnail */}
      <div className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-800">
        {simulation.imageUrl ? (
          <img
            src={simulation.imageUrl}
            alt={simulation.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg text-slate-600">
            ⚛
          </div>
        )}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-100">
          {simulation.title}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold
              ${subjectColor[simulation.subject] ?? "bg-slate-700 text-slate-300"}`}
          >
            {simulation.subject}
          </span>
          {/* Difficulty dot */}
          <span
            className={`h-1.5 w-1.5 rounded-full ${difficultyDot[simulation.difficulty] ?? "bg-slate-500"}`}
            title={simulation.difficulty}
          />
          <span className="text-[10px] text-slate-500">
            {simulation.grades[0]}
          </span>
        </div>
      </div>
    </button>
  );
}
