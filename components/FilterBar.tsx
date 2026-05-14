"use client";

import type { Subject, Difficulty, Grade, FilterState } from "@/types/simulation";

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  resultCount: number;
}

const SUBJECTS: Subject[] = ["Physics", "Chemistry", "Biology", "Math"];
const GRADES: Grade[] = ["K-2", "3-5", "6-8", "9-12", "College"];
const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];

// Toggle an item in an array (add if missing, remove if present)
function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

const subjectEmoji: Record<string, string> = {
  Physics: "⚡",
  Chemistry: "🧪",
  Biology: "🧬",
  Math: "📐",
};

const difficultyColor: Record<string, string> = {
  beginner: "border-green-500/50 text-green-300 data-[active=true]:bg-green-500/20",
  intermediate: "border-yellow-500/50 text-yellow-300 data-[active=true]:bg-yellow-500/20",
  advanced: "border-red-500/50 text-red-300 data-[active=true]:bg-red-500/20",
};

export default function FilterBar({ filters, onChange, resultCount }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      {/* Subject pills */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500 mr-1">Subject</span>
        {SUBJECTS.map((subj) => {
          const active = filters.subjects.includes(subj);
          return (
            <button
              key={subj}
              data-active={active}
              onClick={() =>
                onChange({ ...filters, subjects: toggle(filters.subjects, subj) })
              }
              className={`rounded-full border px-3 py-1 text-xs font-medium transition
                ${active
                  ? "border-indigo-500/60 bg-indigo-500/20 text-indigo-200"
                  : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                }`}
            >
              {subjectEmoji[subj]} {subj}
            </button>
          );
        })}
      </div>

      {/* Grade pills */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500 mr-1">Grade</span>
        {GRADES.map((grade) => {
          const active = filters.grades.includes(grade);
          return (
            <button
              key={grade}
              onClick={() =>
                onChange({ ...filters, grades: toggle(filters.grades, grade) })
              }
              className={`rounded-full border px-3 py-1 text-xs font-medium transition
                ${active
                  ? "border-indigo-500/60 bg-indigo-500/20 text-indigo-200"
                  : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                }`}
            >
              {grade}
            </button>
          );
        })}
      </div>

      {/* Difficulty pills */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500 mr-1">Level</span>
        {DIFFICULTIES.map((diff) => {
          const active = filters.difficulties.includes(diff);
          return (
            <button
              key={diff}
              data-active={active}
              onClick={() =>
                onChange({ ...filters, difficulties: toggle(filters.difficulties, diff) })
              }
              className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition
                ${active
                  ? difficultyColor[diff]
                  : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                }`}
            >
              {diff}
            </button>
          );
        })}
      </div>

      {/* Result count */}
      <span className="ml-auto text-xs text-slate-500">
        {resultCount} simulation{resultCount !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
