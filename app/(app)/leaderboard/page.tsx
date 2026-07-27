"use client";

import { useState, useEffect } from "react";
import { getLeaderboard } from "@/lib/store";
import type { LeaderboardEntry } from "@/types/user";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    setEntries(getLeaderboard());
  }, []);

  // Top 3 for podium
  const topThree = entries.slice(0, 3);
  const remaining = entries.slice(3);

  // Podium order: 2nd, 1st, 3rd
  const podiumOrder = [
    topThree[1], // 2nd
    topThree[0], // 1st
    topThree[2], // 3rd
  ].filter(Boolean);

  const podiumConfig = [
    { rank: 2, height: "h-32", color: "from-slate-400 to-slate-500", glow: "shadow-slate-500/10", border: "border-slate-500/20" },
    { rank: 1, height: "h-40", color: "from-amber-400 to-amber-500", glow: "shadow-amber-500/20", border: "border-amber-500/20" },
    { rank: 3, height: "h-24", color: "from-amber-700 to-amber-800", glow: "shadow-amber-800/10", border: "border-amber-800/20" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          <p className="text-sm text-slate-400 mt-1">Celebrate top performers and check your ranking.</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
            Active Season
          </span>
        </div>
      </div>

      {/* Podium for Top 3 */}
      {topThree.length > 0 && (
        <div className="flex justify-center items-end gap-3 sm:gap-6 pt-6 pb-2 border-b border-slate-800/40">
          {podiumOrder.map((entry) => {
            const index = topThree.indexOf(entry);
            const cfg = podiumConfig[index] ?? podiumConfig[2];
            return (
              <div key={entry.studentName} className="flex flex-col items-center flex-1 max-w-[160px] animate-slide-up">
                {/* Avatar */}
                <div className="relative mb-3 group">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${cfg.color} p-0.5 shadow-xl ${cfg.glow}`}>
                    <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center font-bold text-white text-base sm:text-lg">
                      {entry.studentName.charAt(0)}
                    </div>
                  </div>
                  <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br ${cfg.color} flex items-center justify-center text-xs font-black text-slate-950 shadow-md`}>
                    {cfg.rank}
                  </div>
                </div>
                {/* Details */}
                <p className="text-xs sm:text-sm font-bold text-white truncate w-full text-center">{entry.studentName}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{entry.score} pts</p>

                {/* Pedestal */}
                <div className={`w-full mt-4 rounded-t-xl bg-gradient-to-b ${cfg.color} opacity-90 p-px shadow-inner`}>
                  <div className="bg-slate-950/90 rounded-t-xl w-full h-full flex flex-col items-center justify-center py-4 px-2" style={{ minHeight: cfg.rank === 1 ? "100px" : cfg.rank === 2 ? "80px" : "60px" }}>
                    <span className="text-white text-xs font-bold">{entry.streak} 🔥</span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider mt-1">{entry.testsCompleted} tests</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Remaining list */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800/60 bg-slate-950/40">
              <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 w-16">Rank</th>
              <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Student</th>
              <th className="text-center px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Tests</th>
              <th className="text-center px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Streak</th>
              <th className="text-right px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {remaining.map((entry) => (
              <tr key={entry.studentName} className="hover:bg-slate-800/10 transition">
                <td className="px-6 py-4 font-bold text-slate-400">#{entry.rank}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                      {entry.studentName.charAt(0)}
                    </div>
                    <span className="font-semibold text-slate-200">{entry.studentName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center text-slate-400">{entry.testsCompleted}</td>
                <td className="px-6 py-4 text-center text-amber-500 font-medium">{entry.streak} 🔥</td>
                <td className="px-6 py-4 text-right font-bold text-indigo-400">{entry.score} pts</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
