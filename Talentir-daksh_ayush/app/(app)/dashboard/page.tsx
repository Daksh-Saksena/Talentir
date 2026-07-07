"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { getClassSummaries, getAssignments, getLeaderboard, getTestResults, deleteSummary } from "@/lib/store";
import Link from "next/link";
import type { ClassSummary } from "@/types/user";

export default function DashboardPage() {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<ClassSummary[]>([]);
  
  useEffect(() => {
    setSummaries(getClassSummaries());
  }, []);

  const assignments = getAssignments();
  const leaderboard = getLeaderboard();
  const results = getTestResults();

  const pending = assignments.filter((a) => a.status === "pending").length;
  const myRank = leaderboard.find((e) => e.studentName === user?.name)?.rank ?? "—";

  const subjectColor: Record<string, string> = {
    Physics: "from-blue-500 to-cyan-500",
    Chemistry: "from-emerald-500 to-teal-500",
    Math: "from-violet-500 to-purple-500",
  };

  const handleDeleteSummary = (id: string) => {
    if (confirm("Are you sure you want to delete this class summary?")) {
      deleteSummary(id);
      setSummaries(getClassSummaries());
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="📝" label="Pending" value={String(pending)} color="indigo" />
        <StatCard icon="🧪" label="Tests Taken" value={String(results.length)} color="emerald" />
        <StatCard icon="🏆" label="Your Rank" value={String(myRank)} color="amber" />
        <StatCard icon="📚" label="Subjects" value="3" color="violet" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickLink href="/simulations" icon="⚛️" label="Simulations" />
        <QuickLink href="/assignments" icon="📝" label="Assignments" />
        <QuickLink href="/tests" icon="🧪" label="Practice Tests" />
        <QuickLink href="/leaderboard" icon="🏆" label="Leaderboard" />
      </div>

      {/* Class Summaries */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Classes</h3>
          {user?.role === "admin" && (
            <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
              Admin Mode Enabled
            </span>
          )}
        </div>
        <div className="space-y-3">
          {summaries.slice(0, 10).map((s) => (
            <div
              key={s.id}
              className="group relative rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-block w-2 h-2 rounded-full bg-gradient-to-r ${subjectColor[s.subject] ?? "from-slate-500 to-slate-400"}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {s.subject}
                    </span>
                    <span className="text-[10px] text-slate-600">{s.date}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">{s.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{s.summary}</p>
                </div>
                
                {user?.role === "admin" && (
                  <button 
                    onClick={() => handleDeleteSummary(s.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition"
                    title="Delete Summary"
                  >
                    <span className="text-xs">🗑️</span>
                  </button>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.topics.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {summaries.length === 0 && (
            <p className="text-center py-8 text-sm text-slate-500">No class summaries available.</p>
          )}
        </div>
      </section>

      {/* Upcoming assignments */}
      {user?.role === "student" && pending > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-white mb-4">Upcoming Assignments</h3>
          <div className="space-y-2">
            {assignments.filter((a) => a.status === "pending").map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <div>
                  <p className="text-sm font-medium text-white">{a.title}</p>
                  <p className="text-xs text-slate-500">{a.subject} · Due {a.dueDate}</p>
                </div>
                <Link href="/assignments" className="text-xs text-indigo-400 hover:text-indigo-300">
                  View →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    indigo: "from-indigo-500/20 to-indigo-600/5 border-indigo-500/20",
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
    amber: "from-amber-500/20 to-amber-600/5 border-amber-500/20",
    violet: "from-violet-500/20 to-violet-600/5 border-violet-500/20",
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br p-4 ${colors[color]}`}>
      <span className="text-2xl">{icon}</span>
      <p className="text-2xl font-bold text-white mt-2">{value}</p>
      <p className="text-[10px] text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-sm text-slate-300 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition"
    >
      <span className="text-lg">{icon}</span>
      {label}
    </Link>
  );
}
