"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import {
  getPracticeTests,
  addPracticeTest,
  deleteTest,
  addTestResult,
  updateLeaderboard,
  addNotification,
} from "@/lib/store";
import type { PracticeTest, TestQuestion } from "@/types/user";

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

const diffColor: Record<string, string> = {
  easy:   "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  hard:   "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
};

const subjectColor: Record<string, string> = {
  Physics:   "from-sky-600 to-cyan-500",
  Chemistry: "from-emerald-600 to-teal-500",
  Math:      "from-violet-600 to-purple-500",
};

function DiffBadge({ d }: { d: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${diffColor[d] ?? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"}`}>
      {d}
    </span>
  );
}

// ─────────────────────────────────────────────
//  QUIZ RUNNER
// ─────────────────────────────────────────────

function QuizRunner({
  test,
  studentName,
  onDone,
}: {
  test: PracticeTest;
  studentName: string;
  onDone: () => void;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(test.questions.length).fill(null)
  );
  const [submitted, setSubmitted] = useState(false);

  const score = test.questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0
  );

  const handleSubmit = () => {
    addTestResult({
      testId: test.id,
      studentName,
      score,
      total: test.questions.length,
      completedAt: new Date().toISOString(),
    });
    updateLeaderboard(studentName, score * 20);
    setSubmitted(true);
  };

  const q = test.questions[currentQ];

  if (submitted) {
    const pct = Math.round((score / test.questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 dark:bg-gradient-to-br dark:from-emerald-900/30 dark:to-slate-900 p-8 text-center space-y-3">
          <span className="text-5xl">
            {pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "📖"}
          </span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Test Complete!</h2>
          <p className="text-5xl font-bold text-emerald-600 dark:text-emerald-400">{score}/{test.questions.length}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{pct}% accuracy · +{score * 20} XP earned!</p>
        </div>

        <div className="space-y-3">
          {test.questions.map((q, i) => (
            <div
              key={q.id}
              className={`rounded-xl border p-4 ${
                answers[i] === q.correctIndex
                  ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/5"
                  : "border-red-500/30 bg-red-500/5 dark:bg-red-500/5"
              }`}
            >
              <p className="text-sm font-medium text-slate-900 dark:text-white mb-3">{i + 1}. {q.question}</p>
              <div className="space-y-1.5">
                {q.options.map((opt, j) => (
                  <div
                    key={j}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      j === q.correctIndex
                        ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold"
                        : j === answers[i]
                        ? "bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {String.fromCharCode(65 + j)}. {opt}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 italic">💡 {q.explanation}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onDone}
          className="w-full py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
        >
          ← Back to Tests
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">{test.title}</h2>
          {test.isTeacherCreated && (
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">from {test.createdBy}</span>
          )}
        </div>
        <span className="text-xs text-slate-500">Q {currentQ + 1} / {test.questions.length}</span>
      </div>

      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
          style={{ width: `${((currentQ + 1) / test.questions.length) * 100}%` }}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm">
        <p className="text-base font-medium text-slate-900 dark:text-white mb-6">{q.question}</p>
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => {
                const copy = [...answers];
                copy[currentQ] = i;
                setAnswers(copy);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${
                answers[currentQ] === i
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-600/15 text-indigo-700 dark:text-indigo-200 font-semibold"
                  : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <span className="inline-flex w-6 h-6 rounded-full border border-current items-center justify-center text-[10px] font-bold mr-3">
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        {currentQ > 0 && (
          <button
            onClick={() => setCurrentQ(currentQ - 1)}
            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            ← Previous
          </button>
        )}
        {currentQ < test.questions.length - 1 ? (
          <button
            onClick={() => setCurrentQ(currentQ + 1)}
            className="flex-1 py-3 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-500 transition"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-bold text-white hover:opacity-90 hover:shadow-lg hover:shadow-emerald-500/20 transition"
          >
            Submit Test ✓
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  QUIZ BUILDER (used by teachers & students)
// ─────────────────────────────────────────────

function emptyQuestion(): TestQuestion {
  return {
    id: `q_${Date.now()}_${Math.random()}`,
    question: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    explanation: "",
  };
}

function QuizBuilder({ creatorName, isStudent, onPublished }: { creatorName: string; isStudent?: boolean; onPublished: () => void }) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Physics");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [duration, setDuration] = useState("15");
  const [questions, setQuestions] = useState<TestQuestion[]>([emptyQuestion()]);
  const [expanded, setExpanded] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);
  const removeQuestion = (idx: number) =>
    setQuestions((prev) => prev.filter((_, i) => i !== idx));

  const updateQ = (idx: number, patch: Partial<TestQuestion>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    );
  };

  const updateOption = (qIdx: number, optIdx: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const opts = [...q.options];
        opts[optIdx] = val;
        return { ...q, options: opts };
      })
    );
  };

  const generateAiQuiz = () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    setTimeout(() => {
      const topic = aiPrompt.trim();
      const generatedQuiz: PracticeTest = {
        id: `ai_gen_${Date.now()}`,
        title: `${topic} AI Practice Quiz`,
        subject: subject || "Physics",
        difficulty,
        duration: parseInt(duration) || 15,
        createdBy: "AI Tutor",
        isTeacherCreated: false,
        questions: [
          {
            id: `q_ai_1`,
            question: `What is the fundamental law governing ${topic}?`,
            options: [
              `Energy conservation and equilibrium in ${topic}`,
              `Constant velocity regardless of net external force`,
              `Inverse mass transformation ratio`,
              `Zero enthalpy shift at absolute threshold`
            ],
            correctIndex: 0,
            explanation: `The core governing dynamic of ${topic} relies on fundamental conservation laws.`
          },
          {
            id: `q_ai_2`,
            question: `Which fundamental physical parameter is analyzed in ${topic}?`,
            options: [
              `Gravitational constant G`,
              `System variable state parameter`,
              `Universal gas constant R`,
              `Planck's constant h`
            ],
            correctIndex: 1,
            explanation: `${topic} primary models measure changes across state variables.`
          },
          {
            id: `q_ai_3`,
            question: `When external input increases within ${topic}, what is observed?`,
            options: [
              `Decay rate becomes zero`,
              `Proportional response in system output`,
              `Immediate drop in total internal energy`,
              `Static momentum lock`
            ],
            correctIndex: 1,
            explanation: `Increased input triggers a proportional dynamic response.`
          },
          {
            id: `q_ai_4`,
            question: `What is a common practical application of ${topic}?`,
            options: [
              `Predicting system behavior and optimal efficiency`,
              `Calculating light refraction in vacuum only`,
              `Measuring atomic radius of inert gases`,
              `Synthesizing noble gas compounds`
            ],
            correctIndex: 0,
            explanation: `Application of ${topic} is key to optimizing system efficiency.`
          },
          {
            id: `q_ai_5`,
            question: `How does ideal condition modeling simplify ${topic}?`,
            options: [
              `By eliminating fundamental mass`,
              `By assuming minimal friction or boundary losses`,
              `By setting acceleration to infinity`,
              `By ignoring dimensional units`
            ],
            correctIndex: 1,
            explanation: `Idealized models ignore secondary losses to highlight main principles.`
          }
        ]
      };

      addPracticeTest(generatedQuiz);
      setIsAiGenerating(false);
      onPublished();
    }, 600);
  };

  const handlePublish = () => {
    if (!title.trim()) return alert("Please add a quiz title.");
    const validQ = questions.filter((q) => q.question.trim() && q.options.every((o) => o.trim()));
    if (validQ.length === 0) return alert("Please add at least one complete question.");

    setPublishing(true);
    const newTest: PracticeTest = {
      id: `quiz_${Date.now()}`,
      title: title.trim(),
      subject,
      difficulty,
      duration: parseInt(duration) || 15,
      questions: validQ.map((q) => ({ ...q, id: `q_${Date.now()}_${Math.random()}` })),
      createdBy: creatorName,
      isTeacherCreated: !isStudent,
    };
    addPracticeTest(newTest);

    if (!isStudent) {
      addNotification({
        id: `n_${Date.now()}`,
        title: "New Quiz Available",
        message: `${creatorName} posted a new practice quiz: "${title}"`,
        type: "test",
        createdAt: new Date().toISOString(),
        read: false,
      });
    }

    setTimeout(() => {
      setPublishing(false);
      setTitle("");
      setSubject("Physics");
      setDifficulty("medium");
      setDuration("15");
      setQuestions([emptyQuestion()]);
      setExpanded(false);
      onPublished();
    }, 600);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-purple-500/20 bg-white dark:bg-gradient-to-br dark:from-purple-900/20 dark:to-slate-900/60 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${isStudent ? "from-indigo-600 to-violet-600" : "from-purple-600 to-fuchsia-600"} flex items-center justify-center text-white shadow-md`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {isStudent ? "Generate Custom / AI Quiz" : "Quiz Builder"}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-purple-400">
              {isStudent ? "Create your own practice test or generate one with AI" : "Create a quiz and send it to students"}
            </p>
          </div>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-slate-200 dark:border-purple-500/15 p-5 space-y-5">
          {/* AI generator bar */}
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/20 space-y-3">
            <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
              <span>✨</span> Quick AI Quiz Generator
            </p>
            <div className="flex gap-2">
              <input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Topic (e.g., Quantum Physics, Organic Reactions, Calculus Integrals)..."
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 transition"
              />
              <button
                onClick={generateAiQuiz}
                disabled={isAiGenerating || !aiPrompt.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition shrink-0"
              >
                {isAiGenerating ? "Generating..." : "Generate Quiz ✨"}
              </button>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Quiz Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Physics Thermodynamics Practice"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-purple-500/50 transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500/50 transition"
              >
                <option>Physics</option><option>Chemistry</option><option>Math</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500/50 transition"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Duration (minutes)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min={1}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500/50 transition"
              />
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                Questions ({questions.length})
              </p>
              <button
                onClick={addQuestion}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                + Add Question
              </button>
            </div>

            {questions.map((q, qIdx) => (
              <div key={q.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-[10px] font-bold text-purple-700 dark:text-purple-300 flex-shrink-0 mt-0.5">
                    {qIdx + 1}
                  </div>
                  <input
                    value={q.question}
                    onChange={(e) => updateQ(qIdx, { question: e.target.value })}
                    placeholder="Enter question text"
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-purple-500/40 transition"
                  />
                  {questions.length > 1 && (
                    <button
                      onClick={() => removeQuestion(qIdx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition flex-shrink-0"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pl-9">
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <button
                        onClick={() => updateQ(qIdx, { correctIndex: optIdx })}
                        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition ${
                          q.correctIndex === optIdx
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-400 dark:border-slate-600"
                        }`}
                      >
                        {q.correctIndex === optIdx && "✓"}
                      </button>
                      <input
                        value={opt}
                        onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                        className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none transition"
                      />
                    </div>
                  ))}
                </div>

                <div className="pl-9">
                  <input
                    value={q.explanation}
                    onChange={(e) => updateQ(qIdx, { explanation: e.target.value })}
                    placeholder="Explanation (shown after answering)"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-lg text-xs text-slate-600 dark:text-slate-400 placeholder-slate-400 outline-none transition italic"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handlePublish}
            disabled={publishing}
            className={`w-full py-3 rounded-xl text-sm font-bold transition shadow-lg ${
              publishing
                ? "bg-emerald-600 text-white cursor-wait"
                : isStudent
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90"
                : "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:opacity-90"
            }`}
          >
            {publishing ? "✓ Saved Quiz!" : isStudent ? "Save & Publish Quiz →" : "Publish Quiz → Send to Students"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  TEST CARD
// ─────────────────────────────────────────────

function TestCard({
  test,
  onStart,
  onDelete,
  showDelete,
}: {
  test: PracticeTest;
  onStart: (t: PracticeTest) => void;
  onDelete?: (id: string) => void;
  showDelete?: boolean;
}) {
  const grad = subjectColor[test.subject] ?? "from-slate-600 to-slate-500";
  return (
    <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition group shadow-sm flex flex-col justify-between">
      <div>
        <div className={`h-1.5 bg-gradient-to-r ${grad}`} />
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <DiffBadge d={test.difficulty} />
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{test.subject}</span>
              {test.isTeacherCreated && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25">
                  Teacher Quiz
                </span>
              )}
            </div>
            {showDelete && onDelete && (
              <button
                onClick={() => onDelete(test.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition flex-shrink-0"
              >
                🗑️
              </button>
            )}
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{test.title}</h4>
            {test.createdBy && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">by {test.createdBy}</p>
            )}
          </div>

          <div className="flex items-center gap-3 text-[10px] font-medium text-slate-500 dark:text-slate-400">
            <span>{test.questions.length} questions</span>
            <span>·</span>
            <span>{test.duration} min</span>
          </div>
        </div>
      </div>

      <div className="p-5 pt-0">
        <button
          onClick={() => onStart(test)}
          className={`w-full py-2.5 rounded-xl bg-gradient-to-r ${grad} text-white text-xs font-bold hover:opacity-95 transition shadow-md`}
        >
          Start Test →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────

export default function TestsPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState<PracticeTest[]>([]);
  const [activeTest, setActiveTest] = useState<PracticeTest | null>(null);
  const [isGeneratingAiQuiz, setIsGeneratingAiQuiz] = useState(false);

  const refresh = () => setTests(getPracticeTests());
  useEffect(() => { refresh(); }, []);

  const isTeacher = user?.role === "teacher";
  const isStudent = user?.role === "student";

  const handleDelete = (id: string) => {
    if (confirm("Delete this quiz?")) {
      deleteTest(id);
      refresh();
    }
  };

  const teacherTests = tests.filter((t) => t.isTeacherCreated);
  const aiTests      = tests.filter((t) => !t.isTeacherCreated);
  const myPublished  = tests.filter((t) => t.createdBy === user?.name);

  if (activeTest) {
    return (
      <QuizRunner
        test={activeTest}
        studentName={user?.name ?? "Student"}
        onDone={() => setActiveTest(null)}
      />
    );
  }

  const handleGenerateAndStartAiQuiz = async (topic: string) => {
    if (!topic.trim()) return;
    setIsGeneratingAiQuiz(true);
    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      if (!res.ok) throw new Error("Failed to fetch AI quiz");
      const data = await res.json();

      const generatedQuiz: PracticeTest = {
        id: `ai_gen_${Date.now()}`,
        title: data.title || `${topic} AI Practice Quiz`,
        subject: data.subject || "Physics",
        difficulty: data.difficulty || "medium",
        duration: 15,
        createdBy: "AI Tutor",
        isTeacherCreated: false,
        questions: data.questions || [],
      };

      addPracticeTest(generatedQuiz);
      refresh();
      setActiveTest(generatedQuiz);
    } catch (err) {
      console.error(err);
      alert("Failed to generate AI quiz. Please try again.");
    } finally {
      setIsGeneratingAiQuiz(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Practice Tests</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Sharpen your skills with quizzes from teachers and AI</p>
      </div>

      {isStudent ? (
        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/30 p-6 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">Ask AI to Generate a Quiz For You</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Tell the AI any topic you want to practice (e.g. Thermodynamics, SN1 Reaction Mechanisms, Integration by Parts), and it will immediately generate and start a quiz for you!
          </p>
          <div className="flex gap-2 pt-1">
            <input
              id="student-ai-topic-input"
              placeholder="Enter topic to practice..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleGenerateAndStartAiQuiz((e.target as HTMLInputElement).value);
                }
              }}
              className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 transition shadow-sm"
            />
            <button
              onClick={() => {
                const el = document.getElementById("student-ai-topic-input") as HTMLInputElement;
                if (el) handleGenerateAndStartAiQuiz(el.value);
              }}
              disabled={isGeneratingAiQuiz}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shrink-0 shadow-md"
            >
              {isGeneratingAiQuiz ? "Generating Quiz... ✨" : "Generate & Start Quiz ✨"}
            </button>
          </div>
        </div>
      ) : (
        <QuizBuilder
          creatorName={user?.name ?? "User"}
          isStudent={false}
          onPublished={refresh}
        />
      )}

      {/* Teacher Created Section */}
      {teacherTests.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center text-white shadow-md">
              ✨
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">From Your Teachers</h3>
              <p className="text-[10px] text-purple-600 dark:text-purple-400">{teacherTests.length} quiz{teacherTests.length !== 1 ? "zes" : ""} assigned</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teacherTests.map((t) => (
              <TestCard
                key={t.id}
                test={t}
                onStart={setActiveTest}
                onDelete={handleDelete}
                showDelete={isTeacher || t.createdBy === user?.name}
              />
            ))}
          </div>
        </section>
      )}

      {/* AI / Practice Tests Section */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md">
            🤖
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI & Community Practice Tests</h3>
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400">{aiTests.length} tests available</p>
          </div>
        </div>
        {aiTests.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiTests.map((t) => (
              <TestCard
                key={t.id}
                test={t}
                onStart={setActiveTest}
                onDelete={handleDelete}
                showDelete={t.createdBy === user?.name}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
            <p className="text-sm text-slate-500">No practice tests available yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
