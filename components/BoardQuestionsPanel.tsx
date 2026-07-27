"use client";

/**
 * BoardQuestionsPanel
 * ────────────────────
 * Fetches CBSE board / sample paper questions via GPT-4o-mini.
 *
 * Auto-fetches as soon as a book is opened, using the subject as
 * the default topic. Re-fetches when currentSection changes.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { TextbookEntry } from "@/lib/textbook";

const OPENAI_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY ?? "";

export interface BoardQuestion {
  id: string;
  source: string;
  marks: number;
  question: string;
  answer?: string;
  type: "short" | "long" | "mcq" | "case";
  expanded: boolean;
}

interface Props {
  book: TextbookEntry | null;
  currentSection: string;
}

export default function BoardQuestionsPanel({ book, currentSection }: Props) {
  const [questions, setQuestions] = useState<BoardQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchKeyRef = useRef("");

  // ── Core fetch function ─────────────────────────────────────────────────
  const fetchQuestions = useCallback(async (overrideSection?: string) => {
    if (!book) return;
    if (!OPENAI_KEY) {
      setError("OpenAI API key not found in .env");
      return;
    }

    // Use provided section, or currentSection, or fall back to subject name
    const topic = (overrideSection ?? currentSection).trim() || book.subject;
    const cacheKey = `${book.grade}-${book.subject}-${topic}`;
    if (cacheKey === lastFetchKeyRef.current) return;
    lastFetchKeyRef.current = cacheKey;

    setLoading(true);
    setError(null);
    setQuestions([]);

    const isBoardClass = book.hasBoardPapers;
    const sourceLabel = isBoardClass
      ? `CBSE Board Exam questions (years 2019–2024) for Class ${book.grade} ${book.subject}`
      : `CBSE sample paper questions for Class ${book.grade} ${book.subject}`;

    const prompt = `You are an expert CBSE NCERT teacher preparing Indian school students.

Generate 6 varied exam-style questions from ${sourceLabel} on the topic: "${topic}".

Return ONLY a raw JSON array — no markdown fences, no commentary:
[
  {
    "source": "CBSE Board 2023",
    "marks": 3,
    "question": "Full question text here...",
    "answer": "Concise model answer (2–5 lines)...",
    "type": "short"
  }
]

Rules:
- type must be one of: "short" (1–3 marks), "long" (4–5 marks), "mcq" (1 mark), "case" (4–5 marks)
- Include at least 1 MCQ and 1 long answer question
- For MCQ: embed 4 options labeled (A) (B) (C) (D) inside the question field, and put the correct option + explanation in answer
- For Class 10/12: use real board year sources like "CBSE Board 2022", "CBSE Board 2023"
- For other classes: use "CBSE Sample Paper 2024" or "NCERT Exercise"
- Keep answers factual and concise`;

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You output only raw valid JSON arrays. No markdown. No explanation. No code fences.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.6,
          max_tokens: 2000,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI ${res.status}: ${errText.slice(0, 120)}`);
      }

      const data = await res.json();
      let raw: string = data.choices?.[0]?.message?.content ?? "";

      // Strip any accidental markdown fences
      raw = raw.trim()
               .replace(/^```(?:json)?[\r\n]*/i, "")
               .replace(/[\r\n]*```$/i, "")
               .trim();

      // Find the JSON array even if there's extra text
      const start = raw.indexOf("[");
      const end = raw.lastIndexOf("]");
      if (start === -1 || end === -1) throw new Error("No JSON array found in response");
      raw = raw.slice(start, end + 1);

      const parsed: Omit<BoardQuestion, "id" | "expanded">[] = JSON.parse(raw);

      setQuestions(
        parsed.map((q, i) => ({
          ...q,
          // Sanitize fields that GPT occasionally omits or mis-types
          source:   typeof q.source === "string" && q.source.trim() ? q.source.trim() : "CBSE",
          marks:    Number(q.marks) || 2,
          question: typeof q.question === "string" ? q.question : String(q.question ?? ""),
          answer:   typeof q.answer  === "string" ? q.answer  : undefined,
          type:     (["short","long","mcq","case"] as const).includes(q.type as any)
                      ? q.type
                      : "short",
          id: `q-${Date.now()}-${i}`,
          expanded: false,
        }))
      );
    } catch (e: any) {
      setError(e.message ?? "Failed to load questions");
      lastFetchKeyRef.current = ""; // allow retry
    } finally {
      setLoading(false);
    }
  }, [book, currentSection]);

  // ── Auto-fetch when book changes ────────────────────────────────────────
  useEffect(() => {
    if (!book) {
      setQuestions([]);
      setError(null);
      lastFetchKeyRef.current = "";
      return;
    }
    // Small delay so the book header renders first
    const t = setTimeout(() => fetchQuestions(), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?.pdfUrl]); // re-run when a different book is opened

  // ── Re-fetch when section changes ───────────────────────────────────────
  useEffect(() => {
    if (!book || !currentSection.trim()) return;
    const t = setTimeout(() => fetchQuestions(), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSection]);

  const toggle = (id: string) =>
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, expanded: !q.expanded } : q))
    );

  const marksColor = (m: number) =>
    m <= 1
      ? "bg-blue-500/20 text-blue-300 border-blue-500/20"
      : m <= 3
      ? "bg-amber-500/20 text-amber-300 border-amber-500/20"
      : "bg-rose-500/20 text-rose-300 border-rose-500/20";

  const typeLabel: Record<BoardQuestion["type"], string> = {
    short: "SA", long: "LA", mcq: "MCQ", case: "CBQ",
  };

  const displayTopic = currentSection.trim() || (book?.subject ?? "");

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white leading-tight">
              {book?.hasBoardPapers ? "📋 Board Questions" : "📝 Practice Questions"}
            </h3>
            {book && (
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {book.subject} · Class {book.grade}
                {displayTopic && displayTopic !== book.subject ? ` · ${displayTopic}` : ""}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              lastFetchKeyRef.current = "";
              fetchQuestions();
            }}
            disabled={loading || !book}
            title="Refresh questions"
            className="flex-shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition disabled:opacity-30"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            >
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">

        {/* No book open */}
        {!book && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-12 text-center">
            <span className="text-3xl">📋</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Open a textbook to see<br />board & practice questions
            </p>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-3 pt-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 animate-pulse">
                <div className="flex gap-2 mb-3">
                  <div className="h-4 w-20 bg-slate-700 rounded-full" />
                  <div className="h-4 w-8 bg-slate-700 rounded-full" />
                </div>
                <div className="h-3 bg-slate-700 rounded w-full mb-2" />
                <div className="h-3 bg-slate-700 rounded w-4/5 mb-1" />
                <div className="h-3 bg-slate-700 rounded w-3/5" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-xs text-red-400 font-semibold mb-1">Failed to load</p>
            <p className="text-[11px] text-red-400/70">{error}</p>
            <button
              onClick={() => { lastFetchKeyRef.current = ""; fetchQuestions(); }}
              className="mt-2 text-[11px] text-red-400 underline hover:text-red-300"
            >
              Try again
            </button>
          </div>
        )}

        {/* Questions */}
        {!loading && questions.map((q) => {
          // Defensive: GPT sometimes returns unexpected/missing type values
          const safeType = (["short","long","mcq","case"].includes(q.type) ? q.type : "short") as BoardQuestion["type"];
          const typeBadge = typeLabel[safeType] ?? safeType.toUpperCase();

          return (
          <div
            key={q.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden transition hover:border-slate-700"
          >
            <div className="p-3.5">
              {/* Badges */}
              <div className="flex gap-1.5 flex-wrap mb-2.5">
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700 uppercase tracking-wide">
                  {q.source ?? "CBSE"}
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${marksColor(q.marks)}`}>
                  {q.marks}M
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {typeBadge}
                </span>
              </div>

              {/* Question */}
              <p className="text-[12.5px] text-slate-200 leading-relaxed whitespace-pre-line">{q.question}</p>
            </div>

            {/* Show/hide answer */}
            {q.answer && (
              <>
                <button
                  onClick={() => toggle(q.id)}
                  className="w-full px-3.5 py-2 text-[11px] font-semibold text-slate-500
                             hover:text-indigo-400 hover:bg-indigo-500/5
                             border-t border-slate-800 flex items-center gap-1.5 transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-3 h-3 transition-transform ${q.expanded ? "rotate-180" : ""}`}
                  >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z" clipRule="evenodd"/>
                  </svg>
                  {q.expanded ? "Hide answer" : "Show answer"}
                </button>
                {q.expanded && (
                  <div className="px-3.5 pb-3.5 pt-2.5 bg-indigo-950/40 border-t border-indigo-500/10">
                    <p className="text-[11.5px] text-indigo-200/80 leading-relaxed whitespace-pre-line">{q.answer}</p>
                  </div>
                )}
              </>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}
