"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import TextbookVoiceListener, { type VoiceCommand } from "@/components/TextbookVoiceListener";
import BoardQuestionsPanel from "@/components/BoardQuestionsPanel";
import { findTextbook, TEXTBOOKS, type TextbookEntry } from "@/lib/textbook";

const OPENAI_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY ?? "";

interface ImportantSection {
  id: string;
  title: string;
  reason: string;
  keywords: string[];
}

// PDF rendering has 3 stages tried in order:
//   1. proxy  — /api/pdf-proxy (server fetches → our origin → no X-Frame-Options issue)
//   2. object — <object> pointing direct to NCERT (browsers sometimes allow even if iframe blocked)
//   3. failed — show "open in new tab" button
type PdfStage = "proxy" | "object" | "failed";

// ── GPT helpers ───────────────────────────────────────────────────────────────
async function fetchImportantSections(book: TextbookEntry): Promise<ImportantSection[]> {
  if (!OPENAI_KEY) return [];
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Output only valid JSON arrays, no markdown fences." },
          {
            role: "user",
            content: `List the 8 most important sections/chapters of the NCERT ${book.subject} textbook for Class ${book.grade}.
For each give: title, 1-sentence reason it is important for ${book.hasBoardPapers ? "board exams" : "school exams"}, and 3–5 keyword search terms.
Return ONLY a JSON array: [{"title":"...","reason":"...","keywords":["..."]}]`,
          },
        ],
        temperature: 0.5,
        max_tokens: 900,
      }),
    });
    const data = await res.json();
    const raw = data.choices[0].message.content
      .trim()
      .replace(/^```(?:json)?[\r\n]*/i, "")
      .replace(/[\r\n]*```$/i, "")
      .trim();
    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    const parsed: Omit<ImportantSection, "id">[] = JSON.parse(raw.slice(start, end + 1));
    return parsed.map((s, i) => ({ ...s, id: `sec-${i}` }));
  } catch {
    return [];
  }
}

async function inferSection(transcript: string, book: TextbookEntry): Promise<string> {
  if (!transcript.trim() || !OPENAI_KEY) return "";
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `The student just said: "${transcript}". They are reading "${book.title}" (Class ${book.grade} ${book.subject}). What chapter or section are they likely on? Reply with ONLY the chapter/section name, 4 words max.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 20,
      }),
    });
    const data = await res.json();
    return data.choices[0].message.content.trim().replace(/["""]/g, "");
  } catch {
    return "";
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TextbookPage() {
  useAuth(); // ensure auth context is consumed

  const [activeBook, setActiveBook] = useState<TextbookEntry | null>(null);
  const [pdfStage, setPdfStage] = useState<PdfStage>("proxy");
  const [currentSection, setCurrentSection] = useState("");
  const [importantSections, setImportantSections] = useState<ImportantSection[]>([]);
  const [loadingAnnotations, setLoadingAnnotations] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TextbookEntry[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const sectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // ── Open a textbook ──────────────────────────────────────────────────────
  const openBook = useCallback(async (book: TextbookEntry) => {
    setActiveBook(book);
    setPdfStage("proxy");
    setCurrentSection("");
    setImportantSections([]);
    notify(`📖 Opening: ${book.title}`);

    setLoadingAnnotations(true);
    const sections = await fetchImportantSections(book);
    setImportantSections(sections);
    setLoadingAnnotations(false);
  }, []);

  // ── Voice command handler ────────────────────────────────────────────────
  const handleVoiceCommand = useCallback(
    (cmd: VoiceCommand) => {
      if (cmd.type === "open_book") {
        const book = findTextbook(cmd.query);
        if (book) {
          openBook(book);
        } else {
          notify(`❓ No match for "${cmd.query}". Try "Class 10 Science" or "Class 12 Physics".`);
        }
      }
    },
    [openBook]
  );

  // ── Voice transcript → section inference ────────────────────────────────
  const handleTranscript = useCallback(
    (text: string) => {
      if (!activeBook) return;
      if (sectionTimerRef.current) clearTimeout(sectionTimerRef.current);
      sectionTimerRef.current = setTimeout(async () => {
        const sec = await inferSection(text, activeBook);
        if (sec) setCurrentSection(sec);
      }, 1500);
    },
    [activeBook]
  );

  // ── Search ───────────────────────────────────────────────────────────────
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const ql = q.toLowerCase();
    setSearchResults(
      TEXTBOOKS.filter(
        (b) =>
          b.title.toLowerCase().includes(ql) ||
          b.subject.toLowerCase().includes(ql) ||
          String(b.grade).includes(ql) ||
          b.aliases.some((a) => a.includes(ql))
      ).slice(0, 12)
    );
  };

  useEffect(() => () => {
    if (sectionTimerRef.current) clearTimeout(sectionTimerRef.current);
  }, []);

  const gradeGroups = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  // Build the right URL for the current stage
  const proxyUrl = activeBook
    ? `/api/pdf-proxy?url=${encodeURIComponent(activeBook.pdfUrl)}`
    : "";

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden relative">
      {/* Toast */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white text-sm font-semibold px-6 py-3 rounded-2xl shadow-2xl border border-indigo-400/30 animate-fade-in pointer-events-none">
          {notification}
        </div>
      )}

      {/* ══ LEFT — Library ══ */}
      <aside className="w-72 shrink-0 flex flex-col border-r border-slate-800 bg-slate-950 overflow-hidden">
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📚</span>
            <h2 className="text-sm font-bold text-white">NCERT Textbooks</h2>
          </div>

          <TextbookVoiceListener
            onCommand={handleVoiceCommand}
            onTranscript={handleTranscript}
            active={voiceActive}
          />

          <button
            onClick={() => setVoiceActive((v) => !v)}
            className={`w-full py-2 rounded-2xl text-xs font-semibold transition border ${
              voiceActive
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
            }`}
          >
            {voiceActive ? "🎙️ Voice Active — click to stop" : "🎙️ Enable Voice Commands"}
          </button>

          {/* Search box */}
          <div className="relative">
            <input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setShowSearch(true)}
              onBlur={() => setTimeout(() => setShowSearch(false), 150)}
              placeholder='Search: "Class 10 Physics"'
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
            {showSearch && searchResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 z-30 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl max-h-52 overflow-y-auto">
                {searchResults.map((b) => (
                  <button
                    key={b.pdfUrl}
                    onMouseDown={() => openBook(b)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-indigo-500/10 hover:text-white transition flex items-center gap-2"
                  >
                    <span className="text-indigo-400 font-bold shrink-0">Cls {b.grade}</span>
                    <span className="truncate">{b.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Grade accordion */}
        <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {gradeGroups.map((grade) => {
            const books = TEXTBOOKS.filter((b) => b.grade === grade);
            if (!books.length) return null;
            return (
              <GradeAccordion
                key={grade}
                grade={grade}
                books={books}
                activeBook={activeBook}
                onOpen={openBook}
              />
            );
          })}
        </div>

        {/* Key Sections */}
        {activeBook && (
          <div className="border-t border-slate-800 p-3 shrink-0 max-h-60 overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide">⭐ Key Sections</span>
              {loadingAnnotations && (
                <span className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            {importantSections.length === 0 && !loadingAnnotations && (
              <p className="text-[11px] text-slate-600">Loading…</p>
            )}
            <ul className="space-y-1">
              {importantSections.map((sec) => {
                const active = currentSection === sec.title;
                return (
                  <li key={sec.id}>
                    <button
                      onClick={() => setCurrentSection(sec.title)}
                      className={`w-full text-left rounded-xl px-2 py-1.5 border transition ${
                        active
                          ? "border-amber-500/30 bg-amber-500/10"
                          : "border-transparent hover:border-slate-700 hover:bg-slate-800/60"
                      }`}
                    >
                      <span
                        className={`block text-[11px] font-semibold leading-snug underline decoration-wavy underline-offset-2 ${
                          active ? "text-amber-300 decoration-amber-400/60" : "text-slate-300 decoration-slate-600"
                        }`}
                      >
                        {sec.title}
                      </span>
                      <span className="block text-[10px] text-slate-500 mt-0.5 leading-snug">{sec.reason}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </aside>

      {/* ══ CENTRE — PDF viewer ══ */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950 min-w-0">
        {/* Book header bar */}
        {activeBook && (
          <div className="shrink-0 px-4 py-2 border-b border-slate-800 bg-slate-900/60 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
                Class {activeBook.grade} · {activeBook.subject}
              </p>
              <h2 className="text-sm font-semibold text-white truncate">{activeBook.title}</h2>
            </div>
            {activeBook.hasBoardPapers && (
              <span className="shrink-0 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 text-[10px] font-bold border border-rose-500/20">
                BOARD EXAM
              </span>
            )}
            {currentSection && (
              <span className="shrink-0 max-w-[160px] truncate px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 text-[10px] font-bold border border-indigo-500/20">
                📍 {currentSection}
              </span>
            )}
            {/* Stage indicator */}
            {pdfStage === "object" && (
              <span className="shrink-0 text-[10px] text-amber-400 border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 rounded-full">
                fallback mode
              </span>
            )}
            <a
              href={activeBook.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-xs text-slate-500 hover:text-white transition px-2 py-1 rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700"
            >
              ↗ Open directly
            </a>
          </div>
        )}

        {/* PDF content area */}
        {!activeBook ? (
          <EmptyState onVoice={() => setVoiceActive(true)} />
        ) : pdfStage === "proxy" ? (
          <iframe
            key={`proxy-${activeBook.pdfUrl}`}
            src={proxyUrl}
            className="flex-1 w-full border-0"
            style={{ height: "100%" }}
            title={activeBook.title}
            allow="fullscreen"
            onError={() => {
              console.warn("[textbook] proxy iframe failed, trying <object>");
              setPdfStage("object");
            }}
          />
        ) : pdfStage === "object" ? (
          <object
            key={`object-${activeBook.pdfUrl}`}
            data={activeBook.pdfUrl}
            type="application/pdf"
            className="flex-1 w-full"
            style={{ height: "100%" }}
            onError={() => {
              console.warn("[textbook] <object> also failed");
              setPdfStage("failed");
            }}
          >
            {/* Fallback if object tag not supported */}
            <PDFFailed book={activeBook} onRetry={() => setPdfStage("proxy")} />
          </object>
        ) : (
          <PDFFailed book={activeBook} onRetry={() => setPdfStage("proxy")} />
        )}
      </main>

      {/* ══ RIGHT — Board Questions ══ */}
      <aside className="w-80 shrink-0 border-l border-slate-800 bg-slate-950 overflow-hidden">
        <BoardQuestionsPanel book={activeBook} currentSection={currentSection} />
      </aside>
    </div>
  );
}

// ── Grade accordion ───────────────────────────────────────────────────────────
function GradeAccordion({
  grade, books, activeBook, onOpen,
}: {
  grade: number;
  books: TextbookEntry[];
  activeBook: TextbookEntry | null;
  onOpen: (b: TextbookEntry) => void;
}) {
  const [open, setOpen] = useState(activeBook?.grade === grade);

  useEffect(() => {
    if (activeBook?.grade === grade) setOpen(true);
  }, [activeBook, grade]);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
          open ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300"
        }`}
      >
        <span>Class {grade}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="ml-2 mt-0.5 space-y-0.5">
          {books.map((b) => {
            const isActive = activeBook?.pdfUrl === b.pdfUrl;
            return (
              <button
                key={b.pdfUrl}
                onClick={() => onOpen(b)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center gap-2 ${
                  isActive
                    ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-50" />
                <span className="truncate flex-1">{b.subject}</span>
                {b.hasBoardPapers && (
                  <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Board
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onVoice }: { onVoice: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="w-24 h-24 rounded-[32px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-5xl">
        📖
      </div>
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Open a Textbook</h3>
        <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
          Pick a class from the left sidebar, use the search bar, or try voice commands.
        </p>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-left max-w-sm w-full space-y-2">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Voice examples:</p>
        {["Pull up Class 10 Science", "Open Class 12 Physics", "Show Class 9 Maths", "Load Class 6 English"].map((ex) => (
          <p key={ex} className="text-sm text-slate-300 flex items-center gap-2">
            <span className="text-indigo-400 text-base">🎙</span>
            <span>"{ex}"</span>
          </p>
        ))}
      </div>
      <button
        onClick={onVoice}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-2xl transition shadow-lg shadow-indigo-500/20"
      >
        🎙️ Enable Voice Commands
      </button>
    </div>
  );
}

// ── PDF failed state ──────────────────────────────────────────────────────────
function PDFFailed({ book, onRetry }: { book: TextbookEntry; onRetry: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-5xl">📄</div>
      <h3 className="text-base font-bold text-white">Couldn't display the PDF inline</h3>
      <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
        NCERT's server is blocking the embed. The PDF is available — open it directly in a new tab
        where you can read it with full browser controls.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={onRetry}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-semibold rounded-xl transition"
        >
          ↻ Retry
        </button>
        <a
          href={book.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition shadow-md shadow-indigo-500/20"
        >
          ↗ Open PDF in New Tab
        </a>
      </div>
      <p className="text-[11px] text-slate-600 max-w-xs">
        Tip: Board questions and key sections on the right still work regardless of whether the PDF loads inline.
      </p>
    </div>
  );
}
