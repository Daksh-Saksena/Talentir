"use client";

/**
 * TextbookVoiceListener
 * ──────────────────────
 * Browser Web Speech API — continuous recognition in Chrome/Edge.
 * Keyword-first local parser: no external API needed.
 *
 * Fires onCommand when it hears BOTH a grade AND a subject word,
 * or a trigger verb + at least one of grade/subject.
 *
 * Bug-fix: all callbacks stored in refs so SpeechRecognition's
 * event handlers always see the latest versions (no stale closures).
 */

import { useEffect, useRef, useState } from "react";

export interface VoiceCommand {
  type: "open_book";
  query: string;
  raw: string;
}

interface Props {
  onCommand: (cmd: VoiceCommand) => void;
  onTranscript?: (text: string) => void;
  active?: boolean;
}

// ── Grade keyword table ───────────────────────────────────────────────────────
const GRADE_MAP: [string, number][] = [
  // multi-word first (longest match wins)
  ["class twelve", 12], ["class eleven", 11], ["class ten", 10],
  ["class nine", 9],    ["class eight", 8],   ["class seven", 7],
  ["class six", 6],     ["class five", 5],    ["class four", 4],
  ["class three", 3],   ["class two", 2],     ["class one", 1],
  ["grade twelve", 12], ["grade eleven", 11], ["grade ten", 10],
  ["grade nine", 9],    ["grade eight", 8],   ["grade seven", 7],
  ["grade six", 6],     ["grade five", 5],    ["grade four", 4],
  ["grade three", 3],   ["grade two", 2],     ["grade one", 1],
  ["std twelve", 12],   ["std eleven", 11],   ["std ten", 10],
  ["standard 12", 12],  ["standard 11", 11],  ["standard 10", 10],
  ["standard 9", 9],    ["standard 8", 8],    ["standard 7", 7],
  ["standard 6", 6],    ["standard 5", 5],    ["standard 4", 4],
  // digit forms
  ["class 12", 12], ["class 11", 11], ["class 10", 10],
  ["class 9", 9],   ["class 8", 8],   ["class 7", 7],
  ["class 6", 6],   ["class 5", 5],   ["class 4", 4],
  ["class 3", 3],   ["class 2", 2],   ["class 1", 1],
  ["grade 12", 12], ["grade 11", 11], ["grade 10", 10],
  ["grade 9", 9],   ["grade 8", 8],   ["grade 7", 7],
  ["grade 6", 6],   ["grade 5", 5],   ["grade 4", 4],
  ["grade 3", 3],   ["grade 2", 2],   ["grade 1", 1],
  ["std 12", 12],   ["std 11", 11],   ["std 10", 10],
  ["std 9", 9],     ["std 8", 8],     ["std 7", 7],
  // ordinal words alone
  ["twelfth", 12], ["eleventh", 11], ["tenth", 10],
  ["ninth", 9],    ["eighth", 8],    ["seventh", 7],
  ["sixth", 6],    ["fifth", 5],     ["fourth", 4],
  ["third", 3],    ["second", 2],    ["first", 1],
];

// ── Subject keyword table ─────────────────────────────────────────────────────
const SUBJECT_MAP: [string, string][] = [
  ["social science", "Social Science"],
  ["social studies", "Social Science"],
  ["environmental science", "EVS"],
  ["business studies", "Business Studies"],
  ["physical education", "Physical Education"],
  ["political science", "Social Science"],
  ["physics", "Physics"],
  ["chemistry", "Chemistry"],
  ["mathematics", "Maths"],
  ["biology", "Biology"],
  ["science", "Science"],
  ["english", "English"],
  ["maths", "Maths"],
  ["math", "Maths"],
  ["hindi", "Hindi"],
  ["sanskrit", "Sanskrit"],
  ["history", "History"],
  ["geography", "Geography"],
  ["economics", "Economics"],
  ["accountancy", "Accounts"],
  ["accounts", "Accounts"],
  ["business", "Business Studies"],
  ["civics", "Social Science"],
  ["evs", "EVS"],
  ["bio", "Biology"],
  ["chem", "Chemistry"],
  ["phy", "Physics"],
  ["geo", "Geography"],
  ["eco", "Economics"],
  ["sst", "Social Science"],
  ["eng", "English"],
];

const TRIGGER_VERBS = [
  "pull up", "bring up", "give me", "open up",
  "open", "show", "load", "display", "get",
  "read", "study", "launch", "start",
];

// ── Parser ────────────────────────────────────────────────────────────────────
function parseCommand(raw: string): { grade: number | null; subject: string | null } {
  const t = raw.toLowerCase().trim();

  // Grade — try each phrase in order (longest first in the table)
  let grade: number | null = null;
  for (const [phrase, num] of GRADE_MAP) {
    if (t.includes(phrase)) { grade = num; break; }
  }
  // Bare digit fallback: "10 maths", "physics 12"
  if (grade === null) {
    const m = t.match(/\b(1[0-2]|[1-9])\b/);
    if (m) grade = parseInt(m[1], 10);
  }

  // Subject
  let subject: string | null = null;
  for (const [phrase, name] of SUBJECT_MAP) {
    if (t.includes(phrase)) { subject = name; break; }
  }

  return { grade, subject };
}

function hasTrigger(t: string): boolean {
  const lower = t.toLowerCase();
  return TRIGGER_VERBS.some((v) => lower.includes(v));
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TextbookVoiceListener({ onCommand, onTranscript, active = false }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [liveText, setLiveText] = useState("");          // interim text
  const [lastFired, setLastFired] = useState("");        // last matched command
  const [statusMsg, setStatusMsg] = useState("Voice off");
  const [statusType, setStatusType] = useState<"idle" | "on" | "error" | "bad-browser">("idle");

  // Always-current refs — SpeechRecognition event handlers read from these
  const onCommandRef = useRef(onCommand);
  const onTranscriptRef = useRef(onTranscript);
  const wantListeningRef = useRef(false);   // "should I be running?"
  const recRef = useRef<any>(null);

  // Keep refs current on every render
  useEffect(() => { onCommandRef.current = onCommand; }, [onCommand]);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  // ── Process a final transcript ───────────────────────────────────────────
  function processFinal(text: string) {
    setLastFired(text);
    const { grade, subject } = parseCommand(text);
    const trigger = hasTrigger(text);

    const shouldFire =
      (grade !== null && subject !== null) ||          // "class 10 physics" — no trigger needed
      (trigger && grade !== null) ||                   // "open class 9"
      (trigger && subject !== null);                   // "pull up physics"

    if (shouldFire) {
      const query = [grade ? `class ${grade}` : "", subject ?? ""].filter(Boolean).join(" ");
      onCommandRef.current({ type: "open_book", query, raw: text });
      setLiveText("");
    } else {
      onTranscriptRef.current?.(text);
    }
  }

  // ── Build & start a fresh SpeechRecognition instance ─────────────────────
  function startRecognition() {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setStatusType("bad-browser");
      setStatusMsg("Needs Chrome or Edge");
      return;
    }

    // Tear down any existing instance first
    if (recRef.current) {
      try { recRef.current.abort(); } catch (_) {}
      recRef.current = null;
    }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-IN";
    rec.maxAlternatives = 3; // get more alternatives for better accuracy

    rec.onstart = () => {
      setIsListening(true);
      setStatusType("on");
      setStatusMsg("Listening…");
    };

    rec.onresult = (e: any) => {
      // Collect all results from this event — take the latest one
      const resultList: SpeechRecognitionResultList = e.results;
      const last = resultList[resultList.length - 1];

      // Pick best alternative (highest confidence)
      let bestText = last[0].transcript;
      let bestConf = last[0].confidence ?? 0;
      for (let i = 1; i < last.length; i++) {
        if ((last[i].confidence ?? 0) > bestConf) {
          bestConf = last[i].confidence;
          bestText = last[i].transcript;
        }
      }

      setLiveText(bestText);

      if (last.isFinal) {
        setLiveText("");
        processFinal(bestText);
      }
    };

    rec.onerror = (e: any) => {
      if (e.error === "not-allowed" || e.error === "permission-denied") {
        setStatusType("error");
        setStatusMsg("Mic permission denied");
        wantListeningRef.current = false;
        setIsListening(false);
        return;
      }
      // "no-speech", "audio-capture", "network" — all recoverable; onend will restart
    };

    rec.onend = () => {
      setIsListening(false);
      // Auto-restart only if we still want to be listening
      if (wantListeningRef.current) {
        setStatusMsg("Restarting…");
        setTimeout(() => {
          if (wantListeningRef.current) startRecognition();
        }, 300);
      } else {
        setStatusType("idle");
        setStatusMsg("Voice off");
      }
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch (err: any) {
      // InvalidStateError — already started; ignore
      if (!err.message?.includes("already started")) {
        setStatusType("error");
        setStatusMsg("Could not start mic");
      }
    }
  }

  function stopRecognition() {
    wantListeningRef.current = false;
    try { recRef.current?.stop(); } catch (_) {}
    recRef.current = null;
    setIsListening(false);
    setStatusType("idle");
    setStatusMsg("Voice off");
    setLiveText("");
  }

  function toggle() {
    if (wantListeningRef.current) {
      stopRecognition();
    } else {
      wantListeningRef.current = true;
      startRecognition();
    }
  }

  // Respond to external `active` prop
  useEffect(() => {
    if (active && !wantListeningRef.current) {
      wantListeningRef.current = true;
      startRecognition();
    }
    if (!active && wantListeningRef.current) {
      stopRecognition();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Cleanup on unmount
  useEffect(() => () => {
    wantListeningRef.current = false;
    try { recRef.current?.abort(); } catch (_) {}
  }, []);

  // ── UI ────────────────────────────────────────────────────────────────────
  const dotClass =
    statusType === "on" ? "bg-green-500 animate-pulse"
    : statusType === "error" ? "bg-red-500"
    : statusType === "bad-browser" ? "bg-amber-500"
    : "bg-slate-600";

  return (
    <div className="flex items-center gap-3">
      {/* Mic button */}
      <button
        onClick={toggle}
        disabled={statusType === "bad-browser"}
        title={isListening ? "Stop voice commands" : "Start voice commands"}
        className={`relative flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-2xl border transition-all
          ${statusType === "on"
            ? "border-green-500/40 bg-green-500/10 text-green-400"
            : statusType === "error"
            ? "border-red-500/40 bg-red-500/10 text-red-400"
            : "border-slate-700 bg-slate-800 text-slate-400 hover:border-indigo-500/40 hover:text-indigo-300"
          }`}
      >
        {isListening && (
          <span className="absolute inset-0 rounded-2xl border border-green-500/40 animate-ping opacity-25 pointer-events-none" />
        )}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
        </svg>
      </button>

      {/* Status */}
      <div className="flex flex-col gap-0.5 min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass}`} />
          <span className="text-[11px] font-medium text-slate-400 truncate">{statusMsg}</span>
        </div>

        {/* Live interim transcript */}
        {liveText && (
          <p className="text-[10px] text-slate-500 truncate italic">"{liveText}"</p>
        )}

        {/* Last successfully fired command */}
        {!liveText && lastFired && (
          <p className="text-[10px] text-green-400/70 truncate">✓ {lastFired}</p>
        )}

        {/* Helper hint when off */}
        {statusType === "idle" && !liveText && !lastFired && (
          <p className="text-[10px] text-slate-600 truncate">Say "open class 10 science"</p>
        )}
      </div>
    </div>
  );
}
