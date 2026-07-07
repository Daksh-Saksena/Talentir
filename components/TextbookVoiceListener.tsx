"use client";

/**
 * TextbookVoiceListener
 * ─────────────────────────────────────────────────────────────────────────────
 * Voice recognition for the textbook page.
 *
 * Strategy (mirrors Talentir-daksh_ayush/live-class):
 *   1. Try Deepgram nova-2 WebSocket with smart_format=true  (best accuracy)
 *   2. Fall back to browser SpeechRecognition (webkitSpeechRecognition)
 *
 * Fires onCommand when grade + subject are both recognised.
 * Fires onTranscript for any other speech (used for section inference).
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { parseVoiceCommand } from "@/lib/textbook";

export interface VoiceCommand {
  type: "open_book";
  query: string;
  raw: string;
  chapter?: number | null;
}

interface Props {
  onCommand: (cmd: VoiceCommand) => void;
  onTranscript?: (text: string) => void;
  active?: boolean;
}

const DEEPGRAM_KEY = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY ?? "";

export default function TextbookVoiceListener({ onCommand, onTranscript, active = false }: Props) {
  const [isListening, setIsListening]   = useState(false);
  const [liveText,    setLiveText]       = useState("");
  const [lastFired,   setLastFired]      = useState("");
  const [statusMsg,   setStatusMsg]      = useState("Voice off");
  const [statusType,  setStatusType]     = useState<"idle" | "on" | "error">("idle");
  const [words,       setWords]          = useState<string[]>([]);

  const onCommandRef    = useRef(onCommand);
  const onTranscriptRef = useRef(onTranscript);
  const wantRef         = useRef(false);         // do we want to be listening?
  const mediaRecRef     = useRef<MediaRecorder | null>(null);
  const socketRef       = useRef<WebSocket | null>(null);
  const nativeRef       = useRef<any>(null);
  const lastRestartRef  = useRef(0);
  const MIN_GAP = 4000;                          // min ms between restarts

  useEffect(() => { onCommandRef.current = onCommand; }, [onCommand]);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  // ── Process a final transcript ─────────────────────────────────────────
  const processFinal = useCallback((text: string) => {
    if (!text.trim()) return;
    setLastFired(text);
    const { grade, subject, chapter } = parseVoiceCommand(text);
    if (grade !== null && subject !== null) {
      const query = `class ${grade} ${subject}`;
      onCommandRef.current({ type: "open_book", query, raw: text, chapter });
      setLiveText("");
      setWords([]);
    } else {
      onTranscriptRef.current?.(text);
    }
  }, []);

  // ── Word chip display ──────────────────────────────────────────────────
  const pushWords = (text: string) => {
    setWords((prev) => [...prev, ...text.split(/\s+/).filter(Boolean)].slice(-20));
  };

  // ── Stop all engines ───────────────────────────────────────────────────
  const stopAll = useCallback(() => {
    wantRef.current = false;
    // Deepgram
    try { socketRef.current?.close(); } catch (_) {}
    socketRef.current = null;
    try { mediaRecRef.current?.stop(); } catch (_) {}
    try { mediaRecRef.current?.stream?.getTracks().forEach((t) => t.stop()); } catch (_) {}
    mediaRecRef.current = null;
    // Native
    try { nativeRef.current?.stop(); } catch (_) {}
    nativeRef.current = null;
    setIsListening(false);
    setStatusType("idle");
    setStatusMsg("Voice off");
    setLiveText("");
    setWords([]);
  }, []);

  // ── Native SpeechRecognition fallback ─────────────────────────────────
  const startNative = useCallback(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setStatusType("error");
      setStatusMsg("Needs Chrome/Edge");
      return;
    }
    try { nativeRef.current?.abort(); } catch (_) {}
    nativeRef.current = null;

    const rec = new SR();
    rec.continuous      = true;
    rec.interimResults  = true;
    rec.lang            = "en-IN";
    rec.maxAlternatives = 3;

    rec.onstart  = () => { setIsListening(true); setStatusType("on"); setStatusMsg("Listening…"); };
    rec.onresult = (e: any) => {
      const last = e.results[e.results.length - 1];
      let best = last[0].transcript, bestConf = last[0].confidence ?? 0;
      for (let i = 1; i < last.length; i++) {
        if ((last[i].confidence ?? 0) > bestConf) { best = last[i].transcript; bestConf = last[i].confidence; }
      }
      setLiveText(best);
      pushWords(best);
      if (last.isFinal) { processFinal(best); }
    };
    rec.onerror = (e: any) => {
      if (e.error === "not-allowed" || e.error === "permission-denied") {
        setStatusType("error"); setStatusMsg("Mic denied"); wantRef.current = false;
      }
    };
    rec.onend = () => {
      setIsListening(false);
      if (!wantRef.current) { setStatusType("idle"); setStatusMsg("Voice off"); return; }
      const now = Date.now();
      const wait = Math.max(0, MIN_GAP - (now - lastRestartRef.current));
      setStatusMsg(wait > 0 ? `Restarting in ${Math.ceil(wait / 1000)}s…` : "Restarting…");
      setTimeout(() => { if (wantRef.current) { lastRestartRef.current = Date.now(); startNative(); } }, wait + 200);
    };

    nativeRef.current = rec;
    try { rec.start(); } catch (e: any) { if (!e?.message?.includes("already started")) { setStatusType("error"); setStatusMsg("Mic unavailable"); } }
  }, [processFinal]);

  // ── Deepgram nova-2 ────────────────────────────────────────────────────
  const startDeepgram = useCallback(() => {
    if (!DEEPGRAM_KEY) { startNative(); return; }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRec = new MediaRecorder(stream, { mimeType: "audio/webm" });
        mediaRecRef.current = mediaRec;

        // nova-2 with smart_format mirrors what daksh_ayush live-class uses
        const ws = new WebSocket(
          "wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true&language=en-IN",
          ["token", DEEPGRAM_KEY]
        );
        socketRef.current = ws;

        ws.onopen = () => {
          setIsListening(true);
          setStatusType("on");
          setStatusMsg("Listening…");
          mediaRec.start(250);
        };

        ws.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            const transcript: string = data?.channel?.alternatives?.[0]?.transcript ?? "";
            if (!transcript) return;
            setLiveText(transcript);
            pushWords(transcript);
            if (data.is_final) processFinal(transcript);
          } catch (_) {}
        };

        ws.onerror = () => {
          // Deepgram failed — fall back to native
          try { ws.close(); } catch (_) {}
          try { stream.getTracks().forEach((t) => t.stop()); } catch (_) {}
          if (wantRef.current) startNative();
        };

        ws.onclose = () => {
          setIsListening(false);
          try { mediaRec.stop(); } catch (_) {}
          try { stream.getTracks().forEach((t) => t.stop()); } catch (_) {}
          if (!wantRef.current) { setStatusType("idle"); setStatusMsg("Voice off"); return; }
          const now = Date.now();
          const wait = Math.max(0, MIN_GAP - (now - lastRestartRef.current));
          setStatusMsg(wait > 0 ? `Restarting in ${Math.ceil(wait / 1000)}s…` : "Restarting…");
          setTimeout(() => {
            if (wantRef.current) { lastRestartRef.current = Date.now(); startDeepgram(); }
          }, wait + 200);
        };

        mediaRec.ondataavailable = (e) => {
          if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) ws.send(e.data);
        };
      })
      .catch(() => {
        // Mic permission denied or unavailable
        if (wantRef.current) startNative();
      });
  }, [processFinal, startNative]);

  // ── Toggle ─────────────────────────────────────────────────────────────
  const toggle = useCallback(() => {
    if (wantRef.current) { stopAll(); return; }
    wantRef.current = true;
    lastRestartRef.current = 0;
    startDeepgram();
  }, [stopAll, startDeepgram]);

  // ── Respond to external `active` prop ─────────────────────────────────
  useEffect(() => {
    if (active && !wantRef.current) { wantRef.current = true; lastRestartRef.current = 0; startDeepgram(); }
    if (!active && wantRef.current) { stopAll(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────
  useEffect(() => () => { wantRef.current = false; stopAll(); }, [stopAll]);

  // ── UI ─────────────────────────────────────────────────────────────────
  const dotClass =
    statusType === "on"    ? "bg-green-400 animate-pulse" :
    statusType === "error" ? "bg-red-500"                  : "bg-slate-600";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        {/* Mic button */}
        <button
          onClick={toggle}
          title={isListening ? "Stop voice" : "Start voice"}
          className={`relative flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-2xl border transition-all ${
            statusType === "on"
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
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass}`} />
            <span className="text-[11px] font-medium text-slate-400 truncate">{statusMsg}</span>
          </div>
          {liveText && <p className="text-[10px] text-slate-500 truncate italic">"{liveText}"</p>}
          {!liveText && lastFired && <p className="text-[10px] text-green-400/70 truncate">✓ {lastFired}</p>}
          {statusType === "idle" && !liveText && !lastFired && (
            <p className="text-[10px] text-slate-600 truncate">Say "open class 10 science"</p>
          )}
        </div>
      </div>

      {/* Recognized words */}
      {words.length > 0 && (
        <div className="flex flex-wrap gap-1 px-1">
          {words.map((word, i) => {
            const lw = word.toLowerCase();
            const isGrade   = /^(class|grade|\d+|twelfth|eleventh|tenth|ninth|eighth|seventh|sixth|fifth|fourth|third|second|first)$/.test(lw);
            const isSubject = ["physics","chemistry","maths","math","mathematics","biology","science","english","hindi","sanskrit","history","geography","economics","accountancy","accounts","business","evs","sst","bio","chem","geo"].includes(lw);
            const isChapter = /^(chapter|ch|\d+)$/.test(lw);
            return (
              <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                isGrade   ? "bg-indigo-500/20 text-indigo-300"  :
                isSubject ? "bg-emerald-500/20 text-emerald-300":
                isChapter ? "bg-amber-500/20 text-amber-300"    : "bg-slate-800 text-slate-500"
              }`}>
                {word}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
