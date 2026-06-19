"use client";

/**
 * Textbook Reader Page — /textbook
 * ────────────────────────────────
 * Features:
 *  1. Voice command "pull up <book>" → opens the NCERT PDF
 *  2. PDF rendered in a sandboxed iframe (NCERT direct + Google Docs fallback)
 *  3. Auto-scroll proxy: voice transcript + scroll events used to infer
 *     current chapter/section → sent to BoardQuestionsPanel
 *  4. Important sections underlined via AI annotation panel
 *  5. Board / sample questions side panel
 */

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

// ── Fetch important sections from GPT ────────────────────────────────────────
async function fetchImportantSections(book: TextbookEntry): Promise<ImportantSection[]> {
  const isBoardClass = book.hasBoardPapers;
  const prompt = `List the 8 most important sections/chapters of the NCERT ${book.subject} textbook for Class ${book.grade} (${book.title}).
For each, give: title, 1-sentence reason why it's important for ${isBoardClass ? "board exams" : "school exams"}, and 3–5 keyword search terms.

Return ONLY a JSON array (no markdown):
[{"title":"...","reason":"...","keywords":["...","..."]}]`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Output only valid JSON arrays, no markdown fences." },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 900,
      }),
    });
    const data = await res.json();
    const raw = data.choices[0].message.content.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    const parsed: Omit<ImportantSection, "id">[] = JSON.parse(raw);
    return parsed.map((s, i) => ({ ...s, id: `sec-${i}` }));
  } catch {
    return [];
  }
}

// ── Infer current section from voice transcript ───────────────────────────────
async function inferSection(transcript: string, book: TextbookEntry): Promise<string> {
  if (!transcript.trim() || !book) return "";
  const prompt = `The student said: "${transcript}". 
They are reading "${book.title}" (Class ${book.grade} ${book.subject}).
What chapter or section are they likely reading about? Reply with ONLY the section/chapter name (4 words max). 
If unclear, reply with the most relevant topic from this book.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 30,
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
  const { user } = useAuth();

  const [activeBook, setActiveBook] = useState<TextbookEntry | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [pdfLoadError, setPdfLoadError] = useState(false);
  const [currentSection, setCurrentSection] = useState("");
  const [importantSections, setImportantSections] = useState<ImportantSection[]>([]);
  const [loadingAnnotations, setLoadingAnnotations] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TextbookEntry[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const sectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Notification helper ────────────────────────────────────────────────────
  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // ── Open a textbook ────────────────────────────────────────────────────────
  const openBook = useCallback(async (book: TextbookEntry) => {
    setActiveBook(book);
    setPdfLoadError(false);
    setCurrentSection("");
    setImportantSections([]);
    // Route through our own API proxy — avoids NCERT's X-Frame-Options block
    const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(book.pdfUrl)}`;
    setPdfUrl(proxyUrl);
    notify(`📖 Opening: ${book.title}`);

    // Load important sections in background
    setLoadingAnnotations(true);
    const sections = await fetchImportantSections(book);
    setImportantSections(sections);
    setLoadingAnnotations(false);
  }, []);

  // ── Handle voice command ───────────────────────────────────────────────────
  const handleVoiceCommand = useCallback(
    (cmd: VoiceCommand) => {
      if (cmd.type === "open_book") {
        const book = findTextbook(cmd.query);
        if (book) {
          openBook(book);
        } else {
          notify(`❓ Couldn't find a book matching "${cmd.query}". Try being more specific.`);
        }
      }
    },
    [openBook]
  );

  // ── Handle voice transcript for section inference ──────────────────────────
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

  // ── Search textbooks ───────────────────────────────────────────────────────
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
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

  // Cleanup
  useEffect(() => () => {
    if (sectionTimerRef.current) clearTimeout(sectionTimerRef.current);
  }, []);

  const gradeGroups = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden gap-0 relative">
      {/* ── Toast notification ── */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white text-sm font-semibold px-6 py-3 rounded-2xl shadow-2xl border border-indigo-400/30 animate-fade-in">
          {notification}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          LEFT PANEL — Library browser + Annotations
      ════════════════════════════════════════════════════════════════════ */}
      <aside className="w-72 shrink-0 flex flex-col border-r border-slate-800 bg-slate-950 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📚</span>
            <h2 className="text-sm font-bold text-white">NCERT Textbooks</h2>
          </div>

          {/* Voice listener widget */}
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
            {voiceActive ? "🎙️ Voice Commands Active" : "🎙️ Enable Voice Commands"}
          </button>

          {/* Search */}
          <div className="relative">
            <input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setShowSearch(true)}
              onBlur={() => setTimeout(() => setShowSearch(false), 200)}
              placeholder='Search e.g. "Class 10 Physics"'
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
            {showSearch && searchResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
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

        {/* Grade browser */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
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

        {/* Important Sections */}
        {activeBook && (
          <div className="border-t border-slate-800 p-4 shrink-0 max-h-56 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">⭐ Key Sections</span>
              {loadingAnnotations && <span className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />}
            </div>
            {importantSections.length === 0 && !loadingAnnotations && (
              <p className="text-xs text-slate-600">No annotations yet</p>
            )}
            <ul className="space-y-2">
              {importantSections.map((sec) => (
                <li key={sec.id}>
                  <button
                    onClick={() => setCurrentSection(sec.title)}
                    className={`w-full text-left group rounded-xl p-2 border transition ${
                      currentSection === sec.title
                        ? "border-amber-500/30 bg-amber-500/10"
                        : "border-transparent hover:border-slate-700 hover:bg-slate-800/50"
                    }`}
                  >
                    {/* Underline styling mimics textbook highlight */}
                    <span
                      className={`block text-xs font-semibold leading-snug ${
                        currentSection === sec.title ? "text-amber-300" : "text-slate-300"
                      } underline decoration-amber-400/50 decoration-wavy underline-offset-2`}
                    >
                      {sec.title}
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      {sec.reason}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      {/* ════════════════════════════════════════════════════════════════════
          CENTRE — PDF Viewer
      ════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950 relative min-w-0">
        {/* Book header */}
        {activeBook && (
          <div className="shrink-0 px-4 py-2 border-b border-slate-800 flex items-center gap-3 bg-slate-900/60">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
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
              <span className="shrink-0 max-w-[140px] truncate px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 text-[10px] font-bold border border-indigo-500/20">
                📍 {currentSection}
              </span>
            )}
            <a
              href={activeBook.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-xs text-slate-500 hover:text-white transition px-2 py-1 rounded-lg hover:bg-slate-800"
              title="Open PDF directly"
            >
              ↗ Direct PDF
            </a>
          </div>
        )}

        {/* PDF Frame or placeholder */}
        {!activeBook ? (
          <EmptyState onVoice={() => setVoiceActive(true)} />
        ) : pdfLoadError ? (
          <PDFError book={activeBook} onRetry={() => {
            setPdfLoadError(false);
            setPdfUrl(`/api/pdf-proxy?url=${encodeURIComponent(activeBook.pdfUrl)}&t=${Date.now()}`);
          }} />
        ) : (
          <iframe
            key={pdfUrl}
            src={pdfUrl}
            className="flex-1 w-full border-0 h-full"
            title={activeBook.title}
            onError={() => setPdfLoadError(true)}
            allow="fullscreen"
          />
        )}
      </main>

      {/* ════════════════════════════════════════════════════════════════════
          RIGHT PANEL — Board Questions
      ════════════════════════════════════════════════════════════════════ */}
      <aside className="w-80 shrink-0 border-l border-slate-800 bg-slate-950 overflow-hidden">
        <BoardQuestionsPanel book={activeBook} currentSection={currentSection} />
      </aside>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GradeAccordion({
  grade,
  books,
  activeBook,
  onOpen,
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
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="ml-2 mt-1 space-y-0.5">
          {books.map((b) => {
            const isActive = activeBook?.pdfUrl === b.pdfUrl;
            return (
              <button
                key={b.pdfUrl}
                onClick={() => onOpen(b)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center gap-2 ${
                  isActive
                    ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-60" />
                <span className="truncate">{b.subject}</span>
                {b.hasBoardPapers && (
                  <span className="ml-auto shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
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

function EmptyState({ onVoice }: { onVoice: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="w-24 h-24 rounded-[32px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-5xl">
        📖
      </div>
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Open a Textbook</h3>
        <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
          Browse the library on the left, search by class/subject, or use voice commands.
        </p>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-left max-w-sm w-full">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Try saying:</p>
        {[
          '"Pull up Class 10 Science"',
          '"Open Class 12 Physics"',
          '"Show me Class 9 Maths"',
          '"Bring up Class 6 English"',
        ].map((ex) => (
          <p key={ex} className="text-sm text-slate-300 mb-1.5 flex items-center gap-2">
            <span className="text-indigo-400">🎙️</span> {ex}
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

function PDFError({ book, onRetry }: { book: TextbookEntry; onRetry: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-4xl">⚠️</div>
      <h3 className="text-base font-bold text-white">PDF couldn't be embedded</h3>
      <p className="text-sm text-slate-400 max-w-xs">
        The NCERT server may be blocking embedding. You can still open it directly.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={onRetry}
          className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition"
        >
          ↻ Retry
        </button>
        <a
          href={book.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition"
        >
          ↗ Open PDF Directly
        </a>
      </div>
    </div>
  );
}
