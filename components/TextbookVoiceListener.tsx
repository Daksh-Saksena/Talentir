"use client";

/**
 * TextbookVoiceListener
 * ─────────────────────────────────────────────────────────────────────────────
 * Mirrored exactly from Talentir-daksh_ayush live-class voice implementation.
 *
 * ARCHITECTURE (same as working live-class page):
 *   - useEffect sets up native SpeechRecognition with isListening dependency
 *   - startDeepgram() is a plain async function (no useCallback)
 *   - MediaRecorder mimeType: 'audio/webm'  (not codecs=opus)
 *   - Deepgram: model=nova-2, smart_format=true, no language restriction
 *   - Native fallback: continuous=true, onend restarts if still listening
 *   - processTranscript is a plain function ref to avoid stale closures
 *
 * WINDOW MODE:
 *   Hearing a trigger word ("open", "show", "pull up", "load", "get", "find")
 *   opens a 30-second collection window. Every transcript chunk is accumulated.
 *   Once grade+subject are both found (or 30s expire) → fire onCommand.
 *
 * AUTOCORRECT:
 *   Common ASR mis-hearings corrected before parsing.
 */

import { useState, useEffect, useRef } from "react";
import { parseVoiceCommand } from "@/lib/textbook";

export interface VoiceCommand {
  type: "open_book";
  query: string;
  raw: string;
  chapter?: number | null;
}

interface Props {
  onCommand:     (cmd: VoiceCommand) => void;
  onTranscript?: (text: string)      => void;
  active?:       boolean;
}

const DEEPGRAM_KEY = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || "";
const WINDOW_MS    = 30_000;

// ── Autocorrect map — word-level replacements ─────────────────────────────────
const FIX: Record<string, string> = {
  glass: "class", close: "class", claus: "class", clause: "class",
  clas: "class", klass: "class", kloss: "class", gloss: "class",
  great: "grade", grey: "grade", grayed: "grade",
  fizics: "physics", physic: "physics", fisics: "physics", fizzics: "physics",
  maths: "maths", math: "maths", mathematics: "maths", mathematical: "maths",
  bio: "biology", chem: "chemistry", chemist: "chemistry",
  geo: "geography", geog: "geography", eco: "economics", econ: "economics",
  account: "accounts", accountancy: "accounts",
  sst: "social science",
  chap: "chapter", chptr: "chapter",
  won: "one", to: "two", too: "two", fore: "four", sex: "six",
  ate: "eight", nein: "nine",
};

function fix(text: string): string {
  return text.replace(/\b\w+\b/g, (w) => FIX[w.toLowerCase()] ?? w);
}

const TRIGGERS = ["open", "show", "pull up", "load", "get", "find", "read"];
function hasTrigger(t: string) {
  return TRIGGERS.some((tr) =>
    tr.includes(" ") ? t.includes(tr) : new RegExp(`\\b${tr}\\b`).test(t)
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TextbookVoiceListener({ onCommand, onTranscript, active = false }: Props) {
  const [isListening,    setIsListening]    = useState(false);
  const [liveText,       setLiveText]       = useState("");
  const [lastFired,      setLastFired]      = useState("");
  const [collecting,     setCollecting]     = useState(false);
  const [countdown,      setCountdown]      = useState<number>(30);
  const [collectedWords, setCollectedWords] = useState<string[]>([]);

  // Keep latest callbacks in refs so plain functions can see them without going stale
  const onCommandRef    = useRef(onCommand);
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => { onCommandRef.current = onCommand; },    [onCommand]);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  const mediaRecorderRef      = useRef<MediaRecorder | null>(null);
  const socketRef             = useRef<WebSocket | null>(null);
  const nativeRecognitionRef  = useRef<any>(null);

  // Window accumulation — plain refs, no state re-render on every word
  const collectingRef   = useRef(false);
  const bucketRef       = useRef("");
  const windowTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const earlyResolveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Window management ─────────────────────────────────────────────────────
  function clearWindow() {
    if (windowTimerRef.current)  clearTimeout(windowTimerRef.current);
    if (countdownIntRef.current) clearInterval(countdownIntRef.current);
    if (earlyResolveRef.current) clearTimeout(earlyResolveRef.current);
    windowTimerRef.current  = null;
    countdownIntRef.current = null;
    earlyResolveRef.current = null;
    collectingRef.current   = false;
    bucketRef.current       = "";
    setCollecting(false);
    setCollectedWords([]);
    setCountdown(30);
  }

  function resolveWindow() {
    const text = bucketRef.current.trim();
    clearWindow();
    if (!text) return;
    const { grade, subject, chapter } = parseVoiceCommand(text);
    if (grade !== null && subject !== null) {
      const query = `class ${grade} ${subject}`;
      setLastFired(`${query}${chapter ? ` ch${chapter}` : ""}`);
      setLiveText("");
      onCommandRef.current({ type: "open_book", query, raw: text, chapter });
    } else {
      onTranscriptRef.current?.(text);
    }
  }

  function startWindow() {
    // Reset any existing window
    if (windowTimerRef.current)  clearTimeout(windowTimerRef.current);
    if (countdownIntRef.current) clearInterval(countdownIntRef.current);
    collectingRef.current = true;
    bucketRef.current     = "";
    setCollecting(true);
    setCollectedWords([]);
    setCountdown(30);

    let rem = 30;
    countdownIntRef.current = setInterval(() => {
      rem--;
      setCountdown(rem);
      if (rem <= 0) {
        if (countdownIntRef.current) clearInterval(countdownIntRef.current);
      }
    }, 1000);

    windowTimerRef.current = setTimeout(resolveWindow, WINDOW_MS);
  }

  // ── Main transcript processor ─────────────────────────────────────────────
  function processTranscript(raw: string) {
    if (!raw.trim()) return;
    const corrected = fix(raw).toLowerCase();
    console.log("%c[Voice]:", "color:#a855f7;font-weight:bold;", corrected);
    setLiveText(corrected);

    if (hasTrigger(corrected)) {
      startWindow();
      // Strip the trigger word and put the rest into the bucket
      let rest = corrected;
      TRIGGERS.forEach((tr) => {
        rest = rest.replace(new RegExp(tr.includes(" ") ? tr : `\\b${tr}\\b`, "gi"), "").trim();
      });
      if (rest) {
        bucketRef.current = rest;
        setCollectedWords(rest.split(/\s+/).filter(Boolean));
        // Debounced early-resolve — wait 2s after last speech so chapter can arrive
        const { grade, subject } = parseVoiceCommand(bucketRef.current);
        if (grade !== null && subject !== null) {
          if (earlyResolveRef.current) clearTimeout(earlyResolveRef.current);
          earlyResolveRef.current = setTimeout(resolveWindow, 2000);
        }
      }
      return;
    }

    if (collectingRef.current) {
      bucketRef.current = (bucketRef.current + " " + corrected).trim();
      setCollectedWords(bucketRef.current.split(/\s+/).filter(Boolean));
      const { grade, subject } = parseVoiceCommand(bucketRef.current);
      if (grade !== null && subject !== null) setTimeout(resolveWindow, 500);
    } else {
      onTranscriptRef.current?.(corrected);
    }
  }

  // ── Native SpeechRecognition setup (mirrors daksh_ayush useEffect) ───────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous     = true;
    rec.interimResults = true;
    rec.lang           = "en-IN";

    rec.onresult = (e: any) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        t += e.results[i][0].transcript;
      }
      setLiveText(fix(t).toLowerCase());
      if (e.results[e.results.length - 1].isFinal) {
        processTranscript(t);
      }
    };

    // Auto-restart when native ends (only if no Deepgram socket active)
    rec.onend = () => {
      if (isListening && !socketRef.current) {
        try { rec.start(); } catch (_) {}
      }
    };

    rec.onerror = (e: any) => {
      console.warn("[native SR error]", e.error);
    };

    nativeRecognitionRef.current = rec;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  // ── Deepgram (plain async fn, same as daksh_ayush) ───────────────────────
  async function startDeepgram() {
    if (!DEEPGRAM_KEY) {
      try { nativeRecognitionRef.current?.start(); } catch (_) {}
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" });

      const socket = new WebSocket(
        "wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true",
        ["token", DEEPGRAM_KEY]
      );
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("%c[Deepgram] Connected", "color:#10b981;");
        mediaRecorderRef.current?.start(250);
      };

      socket.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          const transcript: string = data?.channel?.alternatives?.[0]?.transcript ?? "";
          if (transcript) {
            setLiveText(fix(transcript).toLowerCase());
            if (data.is_final) processTranscript(transcript);
          }
        } catch (_) {}
      };

      socket.onerror = (e) => {
        console.warn("[Deepgram error]", e);
        // Fall through to native
        try { nativeRecognitionRef.current?.start(); } catch (_) {}
      };

      socket.onclose = () => {
        socketRef.current = null;
        console.log("%c[Deepgram] Closed", "color:#f59e0b;");
      };

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
          socket.send(event.data);
        }
      };
    } catch (e) {
      console.warn("[Deepgram] getUserMedia failed", e);
      try { nativeRecognitionRef.current?.start(); } catch (_) {}
    }
  }

  function stopEngines() {
    socketRef.current?.close();
    socketRef.current = null;
    try {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
    } catch (_) {}
    mediaRecorderRef.current = null;
    try { nativeRecognitionRef.current?.stop(); } catch (_) {}
    clearWindow();
    setLiveText("");
  }

  // ── Toggle ────────────────────────────────────────────────────────────────
  function toggle() {
    if (isListening) {
      setIsListening(false);
      stopEngines();
    } else {
      setIsListening(true);
      startDeepgram();
    }
  }

  // ── External active prop ──────────────────────────────────────────────────
  useEffect(() => {
    if (active && !isListening) { setIsListening(true); startDeepgram(); }
    if (!active && isListening) { setIsListening(false); stopEngines(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => { setIsListening(false); stopEngines(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── UI ────────────────────────────────────────────────────────────────────
  const subjectSet = new Set(["physics","chemistry","maths","biology","science","english","hindi","sanskrit","history","geography","economics","accounts","business studies","evs","social science"]);
  const gradeSet   = new Set(["class","grade","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve"]);

  const dotColor   = collecting ? "bg-amber-400 animate-pulse" : isListening ? "bg-green-400 animate-pulse" : "bg-slate-600";
  const btnBorder  = collecting ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                   : isListening ? "border-green-500/40 bg-green-500/10 text-green-400"
                   :               "border-slate-700 bg-slate-800 text-slate-400 hover:border-indigo-500/40 hover:text-indigo-300";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        {/* Mic button */}
        <button
          onClick={toggle}
          title={isListening ? "Stop listening" : "Start — then say 'open class 10 science'"}
          className={`relative flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-2xl border transition-all ${btnBorder}`}
        >
          {isListening && (
            <span className="absolute inset-0 rounded-2xl border border-current animate-ping opacity-20 pointer-events-none" />
          )}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
          </svg>
        </button>

        {/* Status */}
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
            <span className="text-[11px] font-medium text-slate-400 truncate">
              {collecting ? `Collecting… ${countdown}s` : isListening ? "Listening…" : "Voice off"}
            </span>
          </div>
          {liveText && !collecting && (
            <p className="text-[10px] text-slate-500 truncate italic">"{liveText}"</p>
          )}
          {!liveText && lastFired && !collecting && (
            <p className="text-[10px] text-green-400/70 truncate">✓ {lastFired}</p>
          )}
          {!isListening && !lastFired && (
            <p className="text-[10px] text-slate-600 truncate">Say "open class 10 science"</p>
          )}
          {isListening && !collecting && (
            <p className="text-[10px] text-slate-600 truncate">Say "open" to search</p>
          )}
        </div>
      </div>

      {/* Collection window */}
      {collecting && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">
              🎙 Collecting — {countdown}s
            </span>
            <button
              onClick={resolveWindow}
              className="text-[9px] text-amber-300 hover:text-white border border-amber-500/30 px-2 py-0.5 rounded-full transition"
            >
              Open now ↵
            </button>
          </div>
          {liveText && (
            <p className="text-[10px] text-amber-300/70 italic truncate">"{liveText}"</p>
          )}
          {collectedWords.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {collectedWords.map((word, i) => {
                const lw = word.toLowerCase();
                const isSubj = subjectSet.has(lw);
                const isGr   = gradeSet.has(lw) || /^\d+$/.test(lw);
                const isCh   = lw === "chapter" || lw === "ch";
                return (
                  <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                    isSubj ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/30" :
                    isGr   ? "bg-indigo-500/25 text-indigo-300 border border-indigo-500/30"   :
                    isCh   ? "bg-amber-500/25 text-amber-300 border border-amber-500/30"      :
                             "bg-slate-700/80 text-slate-400"
                  }`}>
                    {word}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-slate-600">Say class, subject, chapter…</p>
          )}
        </div>
      )}
    </div>
  );
}
