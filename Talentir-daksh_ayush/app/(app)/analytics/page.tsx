"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { getTestResults, getLeaderboard, getAssignments, getClassSummaries, getFeedback } from "@/lib/store";

interface SessionStudent { name: string; avgAttention: number; avgConfusion: number; avgBoredom: number; speakingCount: number; timeInClass: number; detections: number; }
interface Session { id: string; date: string; duration: number; topic: string; students: SessionStudent[]; classAvgAttention: number; engagement: { interest: number; confusion: number; boredom: number }; }

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"overview" | "students" | "sessions" | "ai">("overview");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const results = getTestResults();
  const leaderboard = getLeaderboard();
  const assignments = getAssignments();
  const summaries = getClassSummaries();
  const feedback = getFeedback();

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('cc-session-stats') || '[]');
    setSessions(data);
    if (data.length > 0) setSelectedSession(data[0]);
  }, []);

  const totalStudents = leaderboard.length;
  const avgScore = totalStudents > 0 ? Math.round(leaderboard.reduce((a, b) => a + b.score, 0) / totalStudents) : 0;
  const submittedCount = assignments.filter(a => a.status === "submitted" || a.status === "graded").length;
  const pendingCount = assignments.filter(a => a.status === "pending").length;
  const topPerformers = leaderboard.slice(0, 3);
  const needSupport = leaderboard.filter(s => s.score < avgScore * 0.7);
  const highEngagement = leaderboard.filter(s => s.streak >= 4);
  const lowEngagement = leaderboard.filter(s => s.streak <= 1);

  // Aggregate per-student stats across all sessions
  const allStudentStats: Record<string, { totalAttn: number; totalConf: number; totalBored: number; totalSpeak: number; sessions: number; totalTime: number }> = {};
  sessions.forEach(s => s.students.forEach(st => {
    if (!allStudentStats[st.name]) allStudentStats[st.name] = { totalAttn: 0, totalConf: 0, totalBored: 0, totalSpeak: 0, sessions: 0, totalTime: 0 };
    const x = allStudentStats[st.name];
    x.totalAttn += st.avgAttention; x.totalConf += st.avgConfusion; x.totalBored += st.avgBoredom;
    x.totalSpeak += st.speakingCount; x.sessions += 1; x.totalTime += st.timeInClass;
  }));

  const fmtDur = (s: number) => s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s%60}s`;
  const attnColor = (v: number) => v >= 70 ? 'text-emerald-400' : v >= 40 ? 'text-yellow-400' : 'text-red-400';
  const attnBg = (v: number) => v >= 70 ? 'bg-emerald-500' : v >= 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Analytics & Insights</h2>
          <p className="text-xs text-slate-500 mt-1">AI-powered classroom intelligence</p>
        </div>
        <div className="flex gap-2">
          {(["overview", "students", "sessions", "ai"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition ${tab === t ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
              {t === "sessions" ? `sessions (${sessions.length})` : t}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon="👥" label="Students" value={String(totalStudents)} color="indigo" />
            <StatCard icon="📊" label="Avg Score" value={String(avgScore)} color="emerald" />
            <StatCard icon="✅" label="Submitted" value={String(submittedCount)} color="blue" />
            <StatCard icon="⏳" label="Pending" value={String(pendingCount)} color="amber" />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-sm font-bold text-white mb-4">📈 Score Distribution</h3>
              <div className="space-y-3">
                {leaderboard.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-28 truncate">{s.studentName}</span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all" style={{ width: `${(s.score / (leaderboard[0]?.score || 1)) * 100}%` }} />
                    </div>
                    <span className="text-xs font-mono text-indigo-400 w-12 text-right">{s.score}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-sm font-bold text-white mb-4">🔥 Engagement Streaks</h3>
              <div className="space-y-3">
                {leaderboard.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{s.studentName}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">{Array.from({ length: 7 }, (_, d) => (<div key={d} className={`w-3 h-3 rounded-sm ${d < s.streak ? "bg-emerald-500" : "bg-slate-800"}`} />))}</div>
                      <span className="text-[10px] font-mono text-emerald-400">{s.streak}d</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h3 className="text-sm font-bold text-white mb-4">📚 Recent Classes</h3>
            <div className="space-y-2">
              {summaries.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                  <div><p className="text-xs font-medium text-white">{s.title}</p><p className="text-[10px] text-slate-500">{s.subject} · {s.date}</p></div>
                  <div className="flex gap-1">{s.topics.slice(0, 2).map(t => <span key={t} className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400">{t}</span>)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "students" && (
        <div className="space-y-4">
          {Object.keys(allStudentStats).length > 0 ? (
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/30">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50">
                    <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Student</th>
                    <th className="text-center px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Avg Attention</th>
                    <th className="text-center px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Confusion</th>
                    <th className="text-center px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Speaking</th>
                    <th className="text-center px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Sessions</th>
                    <th className="text-center px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Time</th>
                    <th className="text-center px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {Object.entries(allStudentStats).sort((a,b) => (b[1].totalAttn/b[1].sessions) - (a[1].totalAttn/a[1].sessions)).map(([name, s]) => {
                    const avgA = Math.round(s.totalAttn / s.sessions);
                    const avgC = Math.round(s.totalConf / s.sessions);
                    const status = avgA >= 70 ? "engaged" : avgA >= 40 ? "moderate" : "at-risk";
                    return (
                      <tr key={name} className="hover:bg-slate-800/20 transition">
                        <td className="px-6 py-4 text-white font-medium">{name}</td>
                        <td className="px-4 py-4 text-center">
                          <div className="inline-flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${attnBg(avgA)}`} style={{ width: `${avgA}%` }} />
                            </div>
                            <span className={`text-xs font-mono ${attnColor(avgA)}`}>{avgA}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center text-xs text-yellow-400">{avgC}%</td>
                        <td className="px-4 py-4 text-center text-xs text-cyan-400">{s.totalSpeak}</td>
                        <td className="px-4 py-4 text-center text-xs text-slate-400">{s.sessions}</td>
                        <td className="px-4 py-4 text-center text-xs text-slate-400">{fmtDur(s.totalTime)}</td>
                        <td className="px-4 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            status === "engaged" ? "bg-emerald-500/20 text-emerald-400" :
                            status === "at-risk" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"
                          }`}>{status.replace("-", " ")}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-600">
              <p className="text-4xl mb-4">📷</p>
              <p className="text-sm">No face tracking data yet. Run a live class with enrolled faces to see per-student analytics.</p>
            </div>
          )}
        </div>
      )}

      {tab === "sessions" && (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-16 text-slate-600">
              <p className="text-4xl mb-4">📊</p>
              <p className="text-sm">No sessions recorded yet. Stop a live class to save session analytics.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {/* Session list */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">Sessions</span>
                {sessions.map(s => (
                  <button key={s.id} onClick={() => setSelectedSession(s)}
                    className={`w-full text-left p-4 rounded-xl border transition ${selectedSession?.id === s.id ? 'border-indigo-500/30 bg-indigo-500/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}>
                    <p className="text-xs font-medium text-white truncate">{s.topic || 'Untitled Session'}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{new Date(s.date).toLocaleDateString()} · {fmtDur(s.duration)} · {s.students.length} students</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden"><div className={`h-full rounded-full ${attnBg(s.classAvgAttention)}`} style={{ width: `${s.classAvgAttention}%` }} /></div>
                      <span className={`text-[10px] font-mono ${attnColor(s.classAvgAttention)}`}>{s.classAvgAttention}%</span>
                    </div>
                  </button>
                ))}
              </div>
              {/* Session detail */}
              {selectedSession && (
                <div className="md:col-span-2 space-y-4">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-white">{selectedSession.topic || 'Untitled'}</h3>
                        <p className="text-[10px] text-slate-500">{new Date(selectedSession.date).toLocaleString()} · Duration: {fmtDur(selectedSession.duration)}</p>
                      </div>
                      <div className="flex gap-3">
                        {[{l:'Interest',v:selectedSession.engagement.interest,c:'#6366f1'},{l:'Confusion',v:selectedSession.engagement.confusion,c:'#f59e0b'},{l:'Boredom',v:selectedSession.engagement.boredom,c:'#ef4444'}].map(e=>(
                          <div key={e.l} className="text-center">
                            <p className="text-lg font-bold" style={{color:e.c}}>{e.v}%</p>
                            <p className="text-[8px] text-slate-500 uppercase">{e.l}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Per-student in this session */}
                    <div className="space-y-2">
                      {selectedSession.students.sort((a,b) => b.avgAttention - a.avgAttention).map(st => (
                        <div key={st.name} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-800/50">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">{st.name.charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-white truncate">{st.name}</span>
                              <span className={`text-xs font-mono ${attnColor(st.avgAttention)}`}>{st.avgAttention}% attn</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${attnBg(st.avgAttention)}`} style={{ width: `${st.avgAttention}%` }} />
                              </div>
                              <span className="text-[9px] text-cyan-400">🗣️ {st.speakingCount}</span>
                              <span className="text-[9px] text-yellow-400">😕 {st.avgConfusion}%</span>
                              <span className="text-[9px] text-slate-500">{fmtDur(st.timeInClass)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "ai" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm">🧠</div>
              <h3 className="text-sm font-bold text-white">AI Recommendations</h3>
            </div>
            <div className="space-y-4">
              {/* Face-tracking based recommendations */}
              {Object.entries(allStudentStats).filter(([,s]) => (s.totalAttn/s.sessions) < 40).length > 0 && (
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                  <p className="text-[10px] uppercase tracking-widest text-red-400 font-bold mb-2">🎯 Low Attention Detected</p>
                  <p className="text-xs text-slate-300">
                    {Object.entries(allStudentStats).filter(([,s]) => (s.totalAttn/s.sessions) < 40).map(([n]) => n).join(", ")} — averaging below 40% attention across sessions. Consider seating changes or engaging them with direct questions.
                  </p>
                </div>
              )}
              {Object.entries(allStudentStats).filter(([,s]) => s.totalSpeak === 0).length > 0 && (
                <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                  <p className="text-[10px] uppercase tracking-widest text-yellow-400 font-bold mb-2">🤐 Silent Students</p>
                  <p className="text-xs text-slate-300">
                    {Object.entries(allStudentStats).filter(([,s]) => s.totalSpeak === 0).map(([n]) => n).join(", ")} — never detected speaking. Try encouraging participation with targeted questions.
                  </p>
                </div>
              )}
              {needSupport.length > 0 && (
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                  <p className="text-[10px] uppercase tracking-widest text-red-400 font-bold mb-2">⚠️ Needs Additional Support</p>
                  <p className="text-xs text-slate-300">{needSupport.map(s => s.studentName).join(", ")} — scoring below 70% of class average.</p>
                </div>
              )}
              {topPerformers.length > 0 && (
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-2">🌟 Top Performers</p>
                  <p className="text-xs text-slate-300">{topPerformers.map(s => s.studentName).join(", ")} — consistently topping the leaderboard.</p>
                </div>
              )}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-sm font-bold text-white mb-4">💬 Recent Feedback</h3>
              <div className="space-y-3">
                {feedback.slice(0, 5).map(f => (
                  <div key={f.id} className="flex items-start gap-3 py-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 ${f.fromRole === "teacher" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"}`}>{f.from.charAt(0)}</div>
                    <div><p className="text-xs text-slate-300 line-clamp-2">{f.message}</p><p className="text-[10px] text-slate-600 mt-1">{f.from} → {f.to}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
              <h3 className="text-sm font-bold text-white mb-4">🎯 Quick Stats</h3>
              <div className="space-y-4">
                {[['Total Classes', summaries.length], ['Tests Completed', results.length], ['Feedback Given', feedback.length], ['Face Sessions', sessions.length]].map(([l,v]) => (
                  <div key={String(l)} className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{l}</span>
                    <span className="text-sm font-bold text-white">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    indigo: "from-indigo-500/20 to-indigo-600/5 border-indigo-500/20",
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
    amber: "from-amber-500/20 to-amber-600/5 border-amber-500/20",
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/20",
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br p-4 ${colors[color]}`}>
      <span className="text-2xl">{icon}</span>
      <p className="text-2xl font-bold text-white mt-2">{value}</p>
      <p className="text-[10px] text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}
