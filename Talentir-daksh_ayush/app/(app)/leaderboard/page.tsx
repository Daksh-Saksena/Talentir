"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { getLeaderboard } from "@/lib/store";
import type { LeaderboardEntry } from "@/types/user";

const medals = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [lb, setLb] = useState<LeaderboardEntry[]>([]);

  useEffect(() => { setLb(getLeaderboard()); }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-white">Leaderboard</h2>

      {/* Top 3 podium */}
      <div className="grid grid-cols-3 gap-4 mb-2">
        {lb.slice(0, 3).map((entry, i) => (
          <div
            key={entry.studentName}
            className={`rounded-2xl border p-5 text-center transition
              ${i === 0
                ? "border-yellow-500/30 bg-yellow-500/5 shadow-lg shadow-yellow-500/5"
                : i === 1
                  ? "border-slate-400/30 bg-slate-400/5"
                  : "border-amber-700/30 bg-amber-700/5"
              }`}
          >
            <span className="text-4xl block mb-2">{medals[i]}</span>
            <p className="text-sm font-bold text-white">{entry.studentName}</p>
            <p className="text-2xl font-bold text-indigo-400 mt-1">{entry.score}</p>
            <p className="text-[10px] text-slate-500 mt-1">{entry.testsCompleted} tests · 🔥 {entry.streak} day streak</p>
          </div>
        ))}
      </div>

      {/* Full table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/50">
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Rank</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Student</th>
              <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Score</th>
              <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Tests</th>
              <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Streak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {lb.map((entry) => {
              const isMe = entry.studentName === user?.name;
              return (
                <tr key={entry.studentName} className={`${isMe ? "bg-indigo-500/10" : "hover:bg-slate-900/30"} transition`}>
                  <td className="px-4 py-3 font-bold text-slate-300">
                    {entry.rank <= 3 ? medals[entry.rank - 1] : `#${entry.rank}`}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-white">{entry.studentName}</span>
                    {isMe && <span className="ml-2 text-[10px] text-indigo-400 font-bold">(You)</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-indigo-400">{entry.score}</td>
                  <td className="px-4 py-3 text-right text-slate-400">{entry.testsCompleted}</td>
                  <td className="px-4 py-3 text-right text-slate-400">🔥 {entry.streak}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
