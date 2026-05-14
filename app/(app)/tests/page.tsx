"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { getPracticeTests, addTestResult, updateLeaderboard } from "@/lib/store";
import type { PracticeTest } from "@/types/user";

export default function TestsPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState<PracticeTest[]>([]);
  const [activeTest, setActiveTest] = useState<PracticeTest | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { setTests(getPracticeTests()); }, []);

  const startTest = (test: PracticeTest) => {
    setActiveTest(test);
    setCurrentQ(0);
    setAnswers(new Array(test.questions.length).fill(null));
    setSubmitted(false);
  };

  const selectAnswer = (idx: number) => {
    if (submitted) return;
    const copy = [...answers];
    copy[currentQ] = idx;
    setAnswers(copy);
  };

  const submitTest = () => {
    if (!activeTest || !user) return;
    const score = activeTest.questions.reduce(
      (acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0
    );
    addTestResult({
      testId: activeTest.id, studentName: user.name,
      score, total: activeTest.questions.length,
      completedAt: new Date().toISOString(),
    });
    updateLeaderboard(user.name, score * 20);
    setSubmitted(true);
  };

  const score = activeTest
    ? activeTest.questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0)
    : 0;

  const diffColor: Record<string, string> = {
    easy: "bg-green-500/20 text-green-300",
    medium: "bg-yellow-500/20 text-yellow-300",
    hard: "bg-red-500/20 text-red-300",
  };

  // ── Test list ──
  if (!activeTest) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-xl font-bold text-white">Practice Tests</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map((t) => (
            <div key={t.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 transition">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${diffColor[t.difficulty]}`}>{t.difficulty}</span>
                <span className="text-[10px] text-slate-500">{t.subject}</span>
              </div>
              <h4 className="text-sm font-semibold text-white">{t.title}</h4>
              <p className="text-xs text-slate-500 mt-1">{t.questions.length} questions · {t.duration} min</p>
              <button onClick={() => startTest(t)}
                className="mt-4 w-full py-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-xs font-bold text-indigo-300 hover:bg-indigo-600/30 transition">
                Start Test →
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const q = activeTest.questions[currentQ];

  // ── Results ──
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <span className="text-6xl">{score >= activeTest.questions.length * 0.8 ? "🎉" : score >= activeTest.questions.length * 0.5 ? "👍" : "📖"}</span>
          <h2 className="text-2xl font-bold text-white">Test Complete!</h2>
          <p className="text-4xl font-bold text-indigo-400">{score}/{activeTest.questions.length}</p>
          <p className="text-sm text-slate-400">+{score * 20} points added to leaderboard</p>
        </div>
        {/* Review */}
        <div className="space-y-4 mt-8">
          {activeTest.questions.map((q, i) => (
            <div key={q.id} className={`rounded-xl border p-4 ${answers[i] === q.correctIndex ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
              <p className="text-sm font-medium text-white mb-2">{i + 1}. {q.question}</p>
              <div className="space-y-1">
                {q.options.map((opt, j) => (
                  <div key={j} className={`px-3 py-1.5 rounded-lg text-xs ${j === q.correctIndex ? "bg-green-500/20 text-green-300 font-bold" : j === answers[i] ? "bg-red-500/20 text-red-300" : "text-slate-500"}`}>
                    {opt}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2 italic">💡 {q.explanation}</p>
            </div>
          ))}
        </div>
        <button onClick={() => setActiveTest(null)}
          className="w-full py-3 rounded-xl bg-slate-800 text-sm font-medium text-slate-300 hover:bg-slate-700 transition">
          ← Back to Tests
        </button>
      </div>
    );
  }

  // ── Active question ──
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">{activeTest.title}</h2>
        <span className="text-xs text-slate-500">Q {currentQ + 1}/{activeTest.questions.length}</span>
      </div>
      {/* Progress bar */}
      <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full bg-indigo-500 transition-all" style={{ width: `${((currentQ + 1) / activeTest.questions.length) * 100}%` }} />
      </div>
      {/* Question */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <p className="text-base font-medium text-white mb-6">{q.question}</p>
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => selectAnswer(i)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition
                ${answers[currentQ] === i
                  ? "border-indigo-500 bg-indigo-500/15 text-indigo-200"
                  : "border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800/50"
                }`}>
              <span className="inline-block w-6 h-6 rounded-full border border-current text-center text-xs leading-6 mr-3">
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          ))}
        </div>
      </div>
      {/* Navigation */}
      <div className="flex gap-3">
        {currentQ > 0 && (
          <button onClick={() => setCurrentQ(currentQ - 1)}
            className="flex-1 py-3 rounded-xl border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 transition">
            ← Previous
          </button>
        )}
        {currentQ < activeTest.questions.length - 1 ? (
          <button onClick={() => setCurrentQ(currentQ + 1)}
            className="flex-1 py-3 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-500 transition">
            Next →
          </button>
        ) : (
          <button onClick={submitTest}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-sm font-bold text-white hover:shadow-lg hover:shadow-emerald-500/20 transition">
            Submit Test ✓
          </button>
        )}
      </div>
    </div>
  );
}
