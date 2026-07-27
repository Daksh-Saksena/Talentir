"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import {
  getClassSummaries,
  getAssignments,
  getTestResults,
  deleteSummary,
  getUsers,
  getFeedback,
  getLeaderboard,
} from "@/lib/store";
import Link from "next/link";
import type { ClassSummary, Assignment, User, FeedbackEntry, LeaderboardEntry } from "@/types/user";

// ─────────────────────────────────────────────────────────────────────
//  SHARED HELPERS
// ─────────────────────────────────────────────────────────────────────

const subjectColors: Record<string, { pill: string; bar: string }> = {
  Physics:   { pill: "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/20",     bar: "from-sky-500 to-cyan-400" },
  Chemistry: { pill: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/20", bar: "from-emerald-500 to-teal-400" },
  Math:      { pill: "bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/20",  bar: "from-violet-500 to-purple-400" },
};
const defaultSubjectColor = { pill: "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600", bar: "from-slate-600 to-slate-500" };

function SubjectPill({ subject }: { subject: string }) {
  const c = subjectColors[subject] ?? defaultSubjectColor;
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.pill}`}>{subject}</span>;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ─────────────────────────────────────────────────────────────────────
//  MAIN ENTRY
// ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  if (user?.role === "teacher") return <TeacherDashboard />;
  if (user?.role === "admin")   return <AdminDashboard />;
  return <StudentDashboard />;
}

// ─────────────────────────────────────────────────────────────────────
//  STUDENT DASHBOARD  ─  "Study Hub"
//  Accent: Indigo / Violet
// ─────────────────────────────────────────────────────────────────────

function StudentDashboard() {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<ClassSummary[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Hi! I'm your AI tutor. Ask me anything — physics, chemistry, math — or say 'show me a simulation' and I'll open the right one for you!" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setSummaries(getClassSummaries()); }, []);

  const assignments = getAssignments();
  const results = getTestResults();
  const pending  = assignments.filter((a) => a.status === "pending");
  const submitted = assignments.filter((a) => a.status !== "pending");
  const pct = assignments.length ? Math.round((submitted.length / assignments.length) * 100) : 0;
  const leaderboard = getLeaderboard();
  const myRank = leaderboard.find((e) => e.studentName === user?.name);

  // Circumference for SVG progress ring
  const R = 36; const C = 2 * Math.PI * R;
  const dash = C - (pct / 100) * C;

  // Simulated AI chat handler
  const handleChat = () => {
    const txt = chatInput.trim();
    if (!txt) return;
    const newMsgs = [...chatMessages, { role: "user" as const, text: txt }];
    setChatMessages(newMsgs);
    setChatInput("");

    setTimeout(() => {
      let reply = "Great question! Let me think...";
      const lower = txt.toLowerCase();
      if (lower.includes("simulation") || lower.includes("simulate")) {
        reply = "Sure! Head to the Simulations tab to explore interactive physics and chemistry models. Try the pendulum or orbital mechanics sims!";
      } else if (lower.includes("newton") || lower.includes("force") || lower.includes("motion")) {
        reply = "Newton's Laws: 1st — an object stays at rest or in motion unless a net force acts. 2nd — F = ma. 3rd — every action has an equal & opposite reaction. Want me to suggest a simulation?";
      } else if (lower.includes("integral") || lower.includes("derivative") || lower.includes("calculus")) {
        reply = "For calculus, remember: the derivative measures instantaneous rate of change, while the integral sums up infinitely small pieces. ILATE rule helps pick what to differentiate in integration by parts!";
      } else if (lower.includes("sn1") || lower.includes("sn2") || lower.includes("organic")) {
        reply = "SN1 favours tertiary substrates with polar protic solvents (carbocation intermediate). SN2 favours primary substrates, proceeds via backside attack (inversion). Need more detail on stereochemistry?";
      } else if (lower.includes("assignment") || lower.includes("due")) {
        reply = `You have ${pending.length} pending assignment${pending.length !== 1 ? "s" : ""}. The next one due is "${pending[0]?.title ?? "none"}" — check the Assignments tab!`;
      } else if (lower.includes("rank") || lower.includes("leaderboard")) {
        reply = myRank
          ? `You're currently ranked #${myRank.rank} on the leaderboard with ${myRank.score} points. Keep taking practice tests to climb!`
          : "Take some practice tests first to appear on the leaderboard!";
      } else {
        reply = "I can help with Physics, Chemistry, Math, or your assignments. Ask me a concept, equation, or say 'open simulation' to explore an interactive lab!";
      }
      setChatMessages((prev) => [...prev, { role: "ai", text: reply }]);
    }, 600);
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* ── Hero greeting ── */}
      <div className="relative rounded-2xl overflow-hidden border border-indigo-500/20 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.25),transparent_60%)]" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest mb-1">{getGreeting()}</p>
            <h1 className="text-2xl font-bold text-white">{user?.name} <span className="text-indigo-200">👋</span></h1>
            <p className="text-sm text-indigo-100 mt-1">
              You have <span className="text-white font-bold">{pending.length}</span> pending assignment{pending.length !== 1 ? "s" : ""} — let&apos;s get ahead today.
            </p>
          </div>
          {/* Progress ring */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
                <circle cx="44" cy="44" r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
                <circle cx="44" cy="44" r={R} fill="none" stroke="url(#pgGrad)" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={C} strokeDashoffset={dash} style={{ transition: "stroke-dashoffset 1s ease" }} />
                <defs>
                  <linearGradient id="pgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a5b4fc" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-white">{pct}%</span>
                <span className="text-[9px] text-indigo-200 uppercase tracking-wider">done</span>
              </div>
            </div>
            <div className="text-xs text-indigo-200 leading-relaxed">
              <p><span className="text-white font-bold">{submitted.length}</span> submitted</p>
              <p><span className="text-amber-300 font-bold">{pending.length}</span> pending</p>
              {myRank && <p className="mt-1">Rank <span className="text-indigo-300 font-bold">#{myRank.rank}</span></p>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger">
            {[
              { label: "Pending", value: pending.length, accent: "from-amber-500 to-orange-500", bg: "bg-white dark:bg-amber-500/8 border-slate-200 dark:border-amber-500/15" },
              { label: "Tests Done", value: results.length, accent: "from-emerald-500 to-teal-500", bg: "bg-white dark:bg-emerald-500/8 border-slate-200 dark:border-emerald-500/15" },
              { label: "Streak", value: myRank?.streak ?? 0, accent: "from-rose-500 to-pink-500", bg: "bg-white dark:bg-rose-500/8 border-slate-200 dark:border-rose-500/15" },
              { label: "Rank", value: myRank ? `#${myRank.rank}` : "–", accent: "from-indigo-500 to-violet-500", bg: "bg-white dark:bg-indigo-500/8 border-slate-200 dark:border-indigo-500/15" },
            ].map((s) => (
              <div key={s.label} className={`animate-fade-in rounded-xl border p-4 shadow-sm ${s.bg}`}>
                <div className={`inline-block w-8 h-1 rounded-full bg-gradient-to-r ${s.accent} mb-3`} />
                <p className="text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Pending assignments */}
          {pending.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Upcoming Assignments</h2>
                <Link href="/assignments" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline transition">View all →</Link>
              </div>
              <div className="space-y-2">
                {pending.slice(0, 3).map((a) => {
                  const daysLeft = Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / 86400000);
                  const urgent = daysLeft <= 2;
                  return (
                    <div key={a.id} className="rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 p-4 hover:border-slate-300 dark:hover:border-slate-700/60 transition flex items-center justify-between gap-3 shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center text-sm ${urgent ? "bg-red-500/15 text-red-600 dark:text-red-400" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{a.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <SubjectPill subject={a.subject} />
                            <span className={`text-[10px] font-semibold ${urgent ? "text-red-600 dark:text-red-400" : "text-slate-500"}`}>
                              {daysLeft > 0 ? `${daysLeft}d left` : "Overdue"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link href="/assignments" className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-600/30 transition border border-indigo-200 dark:border-indigo-500/20">
                        View
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Class summaries */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Recent Classes</h2>
            </div>
            <div className="space-y-2">
              {summaries.slice(0, 4).map((s) => {
                const c = subjectColors[s.subject] ?? defaultSubjectColor;
                return (
                  <div key={s.id} className="rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 p-4 hover:border-slate-300 dark:hover:border-slate-700/60 transition shadow-sm group">
                    <div className="flex items-start gap-3">
                      <div className={`w-1 rounded-full bg-gradient-to-b ${c.bar} flex-shrink-0 self-stretch min-h-8`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <SubjectPill subject={s.subject} />
                          <span className="text-[10px] text-slate-500">{s.date}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.title}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{s.summary}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {s.topics.map((t) => (
                            <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400">{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {summaries.length === 0 && <p className="text-center py-8 text-sm text-slate-500">No class summaries yet.</p>}
            </div>
          </section>
        </div>

        {/* ── Right column: Quick actions + AI tutor ── */}
        <div className="space-y-5">
          {/* Quick actions */}
          <section>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-3">Quick Access</h2>
            <div className="space-y-2">
              {[
                { href: "/simulations", label: "Simulations", desc: "Interactive labs", gradient: "from-sky-600 to-cyan-500",
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg> },
                { href: "/tests", label: "Practice Tests", desc: "Sharpen your skills", gradient: "from-emerald-600 to-teal-500",
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg> },
                { href: "/leaderboard", label: "Leaderboard", desc: "See your ranking", gradient: "from-amber-500 to-orange-500",
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg> },
                { href: "/feedback", label: "Feedback", desc: "Messages from teachers", gradient: "from-purple-600 to-fuchsia-500",
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg> },
              ].map((item) => (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 p-3 hover:border-indigo-300 dark:hover:border-slate-700/60 transition shadow-sm group">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white flex-shrink-0 group-hover:scale-105 transition-transform shadow-md`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.desc}</p>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 ml-auto text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              ))}
            </div>
          </section>

          {/* AI Tutor chatbot */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">AI Tutor</h2>
              <div className="flex items-center gap-3">
                <Link href="/ai-tutor" className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline transition">
                  Full Page →
                </Link>
                <button onClick={() => setChatOpen(!chatOpen)}
                  className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition">
                  {chatOpen ? "Collapse" : "Open"}
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/20 bg-white dark:bg-gradient-to-b dark:from-indigo-950/40 dark:to-slate-950/60 shadow-sm overflow-hidden">
              {/* Chat messages */}
              <div className={`overflow-y-auto space-y-3 p-4 transition-all duration-300 ${chatOpen ? "max-h-72" : "max-h-32"}`}>
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                    {m.role === "ai" && (
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold mt-0.5">T</div>
                    )}
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                      m.role === "ai"
                        ? "bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200"
                        : "bg-indigo-600 text-white"
                    }`}>{m.text}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              {/* Input */}
              <div className="border-t border-slate-100 dark:border-indigo-500/10 p-3 flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChat()}
                  placeholder="Ask anything…"
                  className="flex-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500/50 transition"
                />
                <button onClick={handleChat}
                  className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition text-white flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  TEACHER DASHBOARD  ─  "Command Center"
//  Accent: Purple / Fuchsia
// ─────────────────────────────────────────────────────────────────────

function TeacherDashboard() {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<ClassSummary[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [masterView, setMasterView] = useState(false);
  const [activeTab, setActiveTab] = useState<"assignments" | "summaries">("assignments");
  const students = getUsers().filter((u) => u.role === "student");

  useEffect(() => {
    setSummaries(getClassSummaries());
    setAssignments(getAssignments());
  }, []);

  const totalSubmitted = assignments.filter((a) => a.status === "submitted" || a.status === "graded").length;

  const getSubmissionData = (assignmentId: string) => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment) return { submitted: [], pending: [] };
    const n = assignment.status === "submitted" ? 3 : assignment.status === "graded" ? students.length : 1;
    return {
      submitted: students.slice(0, n),
      pending: students.slice(n),
    };
  };

  const masterData = assignments.map((a) => {
    const data = getSubmissionData(a.id);
    return { assignment: a, ...data };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* ── Hero ── */}
      <div className="relative rounded-2xl overflow-hidden border border-purple-500/20 bg-gradient-to-br from-purple-900 via-purple-950 to-slate-950 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.25),transparent_60%)]" />
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold text-purple-300 uppercase tracking-widest mb-1">{getGreeting()}</p>
            <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
            <p className="text-sm text-purple-100 mt-1">
              <span className="text-white font-bold">{assignments.length}</span> assignments active &nbsp;·&nbsp;
              <span className="text-white font-bold">{totalSubmitted}</span> submissions received
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/live-class"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-purple-500/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
              </svg>
              Launch Live Class
            </Link>
            <Link href="/live-class/whiteboard"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-purple-300/30 text-white text-sm font-semibold hover:bg-white/10 transition">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              Whiteboard
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger">
        {[
          { label: "Students",       value: students.length,      accent: "from-purple-500 to-fuchsia-500", bg: "bg-white dark:bg-purple-500/8 border-slate-200 dark:border-purple-500/15" },
          { label: "Assignments",    value: assignments.length,   accent: "from-indigo-500 to-blue-500",   bg: "bg-white dark:bg-indigo-500/8 border-slate-200 dark:border-indigo-500/15" },
          { label: "Summaries",      value: summaries.length,     accent: "from-cyan-500 to-sky-500",      bg: "bg-white dark:bg-cyan-500/8 border-slate-200 dark:border-cyan-500/15" },
          { label: "Submissions",    value: totalSubmitted,       accent: "from-emerald-500 to-teal-500",  bg: "bg-white dark:bg-emerald-500/8 border-slate-200 dark:border-emerald-500/15" },
        ].map((s) => (
          <div key={s.label} className={`animate-fade-in rounded-xl border p-4 shadow-sm ${s.bg}`}>
            <div className={`inline-block w-8 h-1 rounded-full bg-gradient-to-r ${s.accent} mb-3`} />
            <p className="text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Main content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Assignments + Summaries tabs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab header */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60 rounded-xl p-1 shadow-sm">
              <button onClick={() => setActiveTab("assignments")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${activeTab === "assignments" ? "bg-purple-600 text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}>
                Assignments
              </button>
              <button onClick={() => setActiveTab("summaries")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${activeTab === "summaries" ? "bg-purple-600 text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}>
                Class Summaries
              </button>
            </div>
            <div className="flex gap-2">
              {activeTab === "assignments" && (
                <button onClick={() => { setMasterView(!masterView); setSelectedAssignment(null); }}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition border ${masterView ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" : "border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}>
                  Master View
                </button>
              )}
              <Link href="/assignments" className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition">
                Manage →
              </Link>
            </div>
          </div>

          {/* Assignments tab */}
          {activeTab === "assignments" && !masterView && (
            <div className="space-y-2">
              {assignments.map((a) => {
                const { submitted, pending } = getSubmissionData(a.id);
                const isSelected = selectedAssignment === a.id;
                return (
                  <div key={a.id} className="rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700/60 transition shadow-sm">
                    <div className="p-4 flex items-start justify-between gap-3 cursor-pointer" onClick={() => setSelectedAssignment(isSelected ? null : a.id)}>
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-500/20 flex items-center justify-center flex-shrink-0 text-purple-600 dark:text-purple-300">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{a.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <SubjectPill subject={a.subject} />
                            <span className="text-[10px] text-slate-500">Due {a.dueDate}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{submitted.length}/{students.length}</p>
                          <p className="text-[10px] text-slate-500">submitted</p>
                        </div>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? "rotate-180" : ""}`}>
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>
                    {/* Expanded submission view */}
                    {isSelected && (
                      <div className="border-t border-slate-100 dark:border-slate-800/60 p-4 bg-slate-50 dark:bg-slate-950/40">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Submitted ({submitted.length})</p>
                            <div className="space-y-1.5">
                              {submitted.length === 0 && <p className="text-xs text-slate-500">None yet</p>}
                              {submitted.map((s) => (
                                <div key={s.id} className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                                    {s.name.charAt(0)}
                                  </div>
                                  <span className="text-xs text-slate-700 dark:text-slate-300">{s.name}</span>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 ml-auto text-emerald-500 flex-shrink-0">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">Pending ({pending.length})</p>
                            <div className="space-y-1.5">
                              {pending.length === 0 && <p className="text-xs text-slate-500">All done!</p>}
                              {pending.map((s) => (
                                <div key={s.id} className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400 flex-shrink-0">
                                    {s.name.charAt(0)}
                                  </div>
                                  <span className="text-xs text-slate-500">{s.name}</span>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 ml-auto text-amber-500 flex-shrink-0">
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                  </svg>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Master view */}
          {activeTab === "assignments" && masterView && (
            <div className="rounded-2xl border border-slate-200 dark:border-amber-500/15 bg-white dark:bg-slate-950/60 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800/60 bg-amber-500/5">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-widest">Master Submission View — All Students × All Assignments</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/40">
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 sticky left-0 bg-slate-50 dark:bg-slate-950/60">Student</th>
                      {assignments.map((a) => (
                        <th key={a.id} className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center min-w-28">
                          <div className="truncate max-w-24">{a.title.split(" ").slice(0, 2).join(" ")}</div>
                          <div><SubjectPill subject={a.subject} /></div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                    {students.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition">
                        <td className="px-4 py-3 sticky left-0 bg-white dark:bg-slate-950/70">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                              {s.name.charAt(0)}
                            </div>
                            <span className="font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{s.name}</span>
                          </div>
                        </td>
                        {masterData.map((row) => {
                          const done = row.submitted.some((sub) => sub.id === s.id);
                          return (
                            <td key={row.assignment.id} className="px-3 py-3 text-center">
                              {done ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><polyline points="20 6 9 17 4 12" /></svg>
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Class summaries tab */}
          {activeTab === "summaries" && (
            <div className="space-y-2">
              {summaries.slice(0, 6).map((s) => {
                const c = subjectColors[s.subject] ?? defaultSubjectColor;
                return (
                  <div key={s.id} className="rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 p-4 hover:border-slate-300 dark:hover:border-slate-700/60 transition shadow-sm group">
                    <div className="flex items-start gap-3">
                      <div className={`w-1 rounded-full bg-gradient-to-b ${c.bar} flex-shrink-0 self-stretch min-h-8`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <SubjectPill subject={s.subject} />
                          <span className="text-[10px] text-slate-500">{s.date}</span>
                          <span className="text-[10px] text-slate-500">by {s.teacher}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.title}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{s.summary}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: student roster + quick actions */}
        <div className="space-y-5">
          <section>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { href: "/assignments", label: "Create Assignment", desc: "Assign new work", gradient: "from-purple-600 to-fuchsia-600" },
                { href: "/live-class",  label: "Start Live Class",  desc: "Launch IP panel",  gradient: "from-cyan-600 to-sky-500" },
                { href: "/live-class/whiteboard", label: "Open Whiteboard", desc: "Draw & annotate", gradient: "from-violet-600 to-purple-500" },
                { href: "/feedback",   label: "View Feedback",     desc: "Student messages",  gradient: "from-indigo-600 to-blue-500" },
              ].map((item) => (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 p-3 hover:border-purple-300 dark:hover:border-slate-700/60 transition shadow-sm group">
                  <div className={`w-2 h-8 rounded-full bg-gradient-to-b ${item.gradient} flex-shrink-0`} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.desc}</p>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 ml-auto text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              ))}
            </div>
          </section>

          {/* Student roster */}
          <section>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-3">Class Roster</h2>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/30 shadow-sm overflow-hidden">
              {students.map((s, i) => {
                const submitted = masterData.filter((row) => row.submitted.some((sub) => sub.id === s.id)).length;
                return (
                  <div key={s.id} className={`flex items-center gap-3 px-4 py-3 ${i !== students.length - 1 ? "border-b border-slate-100 dark:border-slate-800/40" : ""} hover:bg-slate-50 dark:hover:bg-slate-800/20 transition`}>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{s.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{submitted}/{assignments.length}</p>
                      <p className="text-[9px] text-slate-500">submitted</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  ADMIN DASHBOARD  ─  "Control Panel"
//  Accent: Rose / Amber
// ─────────────────────────────────────────────────────────────────────

function AdminDashboard() {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<ClassSummary[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "summaries" | "feedback">("users");

  useEffect(() => {
    setSummaries(getClassSummaries());
    setUsers(getUsers());
    setFeedback(getFeedback());
  }, []);

  const assignments = getAssignments();
  const students = users.filter((u) => u.role === "student");
  const teachers = users.filter((u) => u.role === "teacher");
  const admins   = users.filter((u) => u.role === "admin");

  const handleDeleteSummary = (id: string) => {
    if (confirm("Delete this class summary?")) {
      deleteSummary(id);
      setSummaries(getClassSummaries());
    }
  };

  const roleConfig: Record<string, string> = {
    student: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/20",
    teacher: "bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/20",
    admin:   "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/20",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* ── Hero ── */}
      <div className="relative rounded-2xl overflow-hidden border border-rose-500/20 bg-gradient-to-br from-rose-900 via-rose-950 to-slate-950 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(244,63,94,0.20),transparent_60%)]" />
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-semibold text-rose-300 uppercase tracking-widest">Admin Panel</p>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-200 text-[10px] font-bold border border-rose-400/30 uppercase tracking-widest">Full Access</span>
            </div>
            <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
            <p className="text-sm text-rose-100 mt-1">
              <span className="text-white font-bold">{users.length}</span> users &nbsp;·&nbsp;
              <span className="text-white font-bold">{assignments.length}</span> assignments &nbsp;·&nbsp;
              <span className="text-white font-bold">{summaries.length}</span> class summaries
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link href="/users"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-600 text-white text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-rose-500/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
              Manage Users
            </Link>
            <Link
              href={process.env.NEXT_PUBLIC_IP_PANEL_URL || "http://localhost:8000/live-class"}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cyan-300/30 text-white text-sm font-semibold hover:bg-white/10 transition">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect x="2" y="2" width="20" height="20" rx="2" /><line x1="2" y1="9" x2="22" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
              </svg>
              IP Panel ↗
            </Link>
            <Link href="/face-setup" target="_blank"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-300/30 text-white text-sm font-semibold hover:bg-white/10 transition">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
              </svg>
              Enrollment
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger">
        {[
          { label: "Students", value: students.length, accent: "from-indigo-500 to-violet-500", bg: "bg-white dark:bg-indigo-500/8 border-slate-200 dark:border-indigo-500/15" },
          { label: "Teachers", value: teachers.length, accent: "from-purple-500 to-fuchsia-500", bg: "bg-white dark:bg-purple-500/8 border-slate-200 dark:border-purple-500/15" },
          { label: "Assignments", value: assignments.length, accent: "from-amber-500 to-orange-500", bg: "bg-white dark:bg-amber-500/8 border-slate-200 dark:border-amber-500/15" },
          { label: "Feedback Items", value: feedback.length, accent: "from-rose-500 to-pink-500", bg: "bg-white dark:bg-rose-500/8 border-slate-200 dark:border-rose-500/15" },
        ].map((s) => (
          <div key={s.label} className={`animate-fade-in rounded-xl border p-4 shadow-sm ${s.bg}`}>
            <div className={`inline-block w-8 h-1 rounded-full bg-gradient-to-r ${s.accent} mb-3`} />
            <p className="text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Role breakdown bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 p-4 shadow-sm">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">User Breakdown</p>
        <div className="flex rounded-lg overflow-hidden h-3 bg-slate-100 dark:bg-slate-800">
          <div className="bg-gradient-to-r from-indigo-500 to-violet-500 transition-all" style={{ width: `${(students.length / users.length) * 100}%` }} title={`${students.length} Students`} />
          <div className="bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all" style={{ width: `${(teachers.length / users.length) * 100}%` }} title={`${teachers.length} Teachers`} />
          <div className="bg-gradient-to-r from-rose-500 to-orange-500 transition-all" style={{ width: `${(admins.length / users.length) * 100}%` }} title={`${admins.length} Admins`} />
        </div>
        <div className="flex gap-5 mt-2">
          {[
            { label: "Students", count: students.length, dot: "bg-indigo-500" },
            { label: "Teachers", count: teachers.length, dot: "bg-purple-500" },
            { label: "Admins",   count: admins.length,   dot: "bg-rose-500" },
          ].map((r) => (
            <div key={r.label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${r.dot}`} />
              <span className="text-[10px] text-slate-600 dark:text-slate-400">{r.label} <strong className="text-slate-900 dark:text-white">{r.count}</strong></span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60 rounded-xl p-1 w-fit mb-4 shadow-sm">
          {(["users", "summaries", "feedback"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition capitalize ${activeTab === tab ? "bg-rose-600 text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Users tab */}
        {activeTab === "users" && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-950/40 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-900 dark:text-white">All Users ({users.length})</p>
              <Link href="/users" className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:underline transition">Manage →</Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0
                    ${u.role === "admin" ? "bg-gradient-to-br from-rose-500 to-orange-500" : u.role === "teacher" ? "bg-gradient-to-br from-purple-500 to-fuchsia-500" : "bg-gradient-to-br from-indigo-500 to-violet-500"}`}>
                    {u.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{u.name}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${roleConfig[u.role]}`}>{u.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summaries tab */}
        {activeTab === "summaries" && (
          <div className="space-y-2">
            {summaries.slice(0, 8).map((s) => {
              const c = subjectColors[s.subject] ?? defaultSubjectColor;
              return (
                <div key={s.id} className="group rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 p-4 hover:border-slate-300 dark:hover:border-slate-700/60 transition shadow-sm flex items-start gap-3">
                  <div className={`w-1 rounded-full bg-gradient-to-b ${c.bar} flex-shrink-0 self-stretch min-h-8`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <SubjectPill subject={s.subject} />
                      <span className="text-[10px] text-slate-500">{s.date}</span>
                      <span className="text-[10px] text-slate-500">by {s.teacher}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.title}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{s.summary}</p>
                  </div>
                  <button onClick={() => handleDeleteSummary(s.id)}
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white transition">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Feedback tab */}
        {activeTab === "feedback" && (
          <div className="space-y-2">
            {feedback.map((f) => (
              <div key={f.id} className="rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 p-4 hover:border-slate-300 dark:hover:border-slate-700/60 transition shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0
                      ${f.fromRole === "teacher" ? "bg-gradient-to-br from-purple-500 to-fuchsia-500" : f.fromRole === "admin" ? "bg-gradient-to-br from-rose-500 to-orange-500" : "bg-gradient-to-br from-indigo-500 to-violet-500"}`}>
                      {f.from.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 ${roleConfig[f.fromRole]}`}>{f.fromRole}</span>
                        <span className="text-xs text-slate-600 dark:text-slate-400">{f.from} → {f.to}</span>
                      </div>
                      <p className="text-sm text-slate-800 dark:text-slate-200 mt-1">{f.message}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <svg key={i} viewBox="0 0 24 24" fill={i < f.rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} className={`w-3 h-3 ${i < f.rating ? "text-amber-400" : "text-slate-300 dark:text-slate-700"}`}>
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {feedback.length === 0 && <p className="text-center py-8 text-sm text-slate-500">No feedback yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
