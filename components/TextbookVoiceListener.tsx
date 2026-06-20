"use client";

/**
 * TextbookVoiceListener
 * ──────────────────────
 * Uses Deepgram's real-time WebSocket API for accurate speech recognition.
 * Falls back to browser SpeechRecognition if Deepgram is unavailable.
 *
 * Shows recognized words in real-time, and fires onCommand when it detects
 * a grade + subject (and optionally a chapter number).
 *
 * Supports commands like:
 *   "open physics class 12 chapter 1" → opens Chapter 1 of Class 12 Physics
 *   "class 10 science" → opens Class 10 Science (Chapter 1)
 *   "show class 9 maths chapter 5" → opens Chapter 5 of Class 9 Maths
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

const DEEPGRAM_API_KEY = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY ?? "";

// ── Component ─────────────────────────────────────────────────────────────────
export default function TextbookVoiceListener({ onCommand, onTranscript, active = false }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [liveText, setLiveText] = useState("");          // interim text shown to user
  const [lastFired, setLastFired] = useState("");        // last matched command
  const [statusMsg, setStatusMsg] = useState("Voice off");
  const [statusType, setStatusType] = useState<"idle" | "on" | "error" | "bad-browser">("idle");
  const [recognizedWords, setRecognizedWords] = useState<string[]>([]); // rolling window of words

  // Refs
  const onCommandRef = useRef(onCommand);
  const onTranscriptRef = useRef(onTranscript);
  const wantListeningRef = useRef(false);
  const wsRef = useRef<WebSocket | null>(null);
  const recRef = useRef<any>(null); // browser SpeechRecognition fallback
  const lastRestartTimeRef = useRef(0);
  const MIN_RESTART_INTERVAL = 5000;
  const accumulatedTextRef = useRef("");

  // Keep refs current
  useEffect(() => { onCommandRef.current = onCommand; }, [onCommand]);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  // ── Process a final transcript ───────────────────────────────────────────
  const processFinal = useCallback((text: string) => {
    setLastFired(text);
    const parsed = parseVoiceCommand(text);
    const { grade, subject, chapter } = parsed;

    const shouldFire = grade !== null && subject !== null;

    if (shouldFire) {
      const query = [grade ? `class ${grade}` : "", subject ?? ""].filter(Boolean).join(" ");
      onCommandRef.current({
        type: "open_book",
        query,
        raw: text,
        chapter,
      });
      setLiveText("");
      setRecognizedWords([]);
    } else {
      onTranscriptRef.current?.(text);
    }
  }, []);

  // ── Start Deepgram WebSocket ─────────────────────────────────────────────
  function startDeepgram() {
    if (!DEEPGRAM_API_KEY) {
      // Fall back to browser SpeechRecognition
      startBrowserRecognition();
      return;
    }

    try {
      const ws = new WebSocket(
        `wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&language=en-IN&interim_results=true&endpointing=200&utterance_end_ms=1000`
      );

      ws.onopen = () => {
        setIsListening(true);
        setStatusType("on");
        setStatusMsg("Listening…");
        accumulatedTextRef.current = "";

        // Start recording from microphone
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then((stream) => {
            const mediaRecorder = new MediaRecorder(stream, {
              mimeType: "audio/webm;codecs=opus",
            });
            mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
                ws.send(event.data);
              }
            };
            mediaRecorder.start(250); // send chunks every 250ms

            // Store refs for cleanup
            (ws as any)._mediaRecorder = mediaRecorder;
            (ws as any)._stream = stream;
          })
          .catch((err) => {
            console.error("[voice] mic error:", err);
            setStatusType("error");
            setStatusMsg("Mic access denied");
            ws.close();
          });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "Results" && data.channel?.alternatives?.[0]) {
            const transcript = data.channel.alternatives[0].transcript;
            const isFinal = data.is_final;

            if (transcript) {
              setLiveText(transcript);

              // Update rolling word window
              const words = transcript.split(/\s+/).filter(Boolean);
              setRecognizedWords((prev) => {
                const combined = [...prev, ...words];
                // Keep last 20 words
                return combined.slice(-20);
              });

              if (isFinal) {
                accumulatedTextRef.current += " " + transcript;
                processFinal(accumulatedTextRef.current.trim());
                accumulatedTextRef.current = "";
              }
            }
          }
        } catch (e) {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        // Fall back to browser recognition
        startBrowserRecognition();
      };

      ws.onclose = () => {
        setIsListening(false);
        // Clean up media resources
        try { (ws as any)._mediaRecorder?.stop(); } catch (_) {}
        try { (ws as any)._stream?.getTracks().forEach((t: MediaStreamTrack) => t.stop()); } catch (_) {}

        if (wantListeningRef.current) {
          const now = Date.now();
          const timeSinceLastRestart = now - lastRestartTimeRef.current;
          if (timeSinceLastRestart < MIN_RESTART_INTERVAL) {
            const waitTime = MIN_RESTART_INTERVAL - timeSinceLastRestart;
            setStatusMsg(`Waiting ${Math.ceil(waitTime / 1000)}s…`);
            setTimeout(() => {
              if (wantListeningRef.current) {
                lastRestartTimeRef.current = Date.now();
                startDeepgram();
              }
            }, waitTime);
          } else {
            setStatusMsg("Restarting…");
            lastRestartTimeRef.current = now;
            setTimeout(() => {
              if (wantListeningRef.current) startDeepgram();
            }, 300);
          }
        } else {
          setStatusType("idle");
          setStatusMsg("Voice off");
        }
      };

      wsRef.current = ws;
    } catch (err) {
      // Fall back to browser recognition
      startBrowserRecognition();
    }
  }

  // ── Browser SpeechRecognition fallback ───────────────────────────────────
  function startBrowserRecognition() {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setStatusType("bad-browser");
      setStatusMsg("Needs Chrome or Edge");
      return;
    }

    if (recRef.current) {
      try { recRef.current.abort(); } catch (_) {}
      recRef.current = null;
    }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-IN";
    rec.maxAlternatives = 3;

    rec.onstart = () => {
      setIsListening(true);
      setStatusType("on");
      setStatusMsg("Listening…");
      accumulatedTextRef.current = "";
    };

    rec.onresult = (e: any) => {
      const resultList: SpeechRecognitionResultList = e.results;
      const last = resultList[resultList.length - 1];
      let bestText = last[0].transcript;
      let bestConf = last[0].confidence ?? 0;
      for (let i = 1; i < last.length; i++) {
        if ((last[i].confidence ?? 0) > bestConf) {
          bestConf = last[i].confidence;
          bestText = last[i].transcript;
        }
      }

      setLiveText(bestText);

      // Update rolling word window
      const words = bestText.split(/\s+/).filter(Boolean);
      setRecognizedWords((prev) => {
        const combined = [...prev, ...words];
        return combined.slice(-20);
      });

      if (last.isFinal) {
        accumulatedTextRef.current += " " + bestText;
        processFinal(accumulatedTextRef.current.trim());
        accumulatedTextRef.current = "";
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
    };

    rec.onend = () => {
      setIsListening(false);
      if (wantListeningRef.current) {
        const now = Date.now();
        const timeSinceLastRestart = now - lastRestartTimeRef.current;
        if (timeSinceLastRestart < MIN_RESTART_INTERVAL) {
          const waitTime = MIN_RESTART_INTERVAL - timeSinceLastRestart;
          setStatusMsg(`Waiting ${Math.ceil(waitTime / 1000)}s…`);
          setTimeout(() => {
            if (wantListeningRef.current) {
              lastRestartTimeRef.current = Date.now();
              startBrowserRecognition();
            }
          }, waitTime);
        } else {
          setStatusMsg("Restarting…");
          lastRestartTimeRef.current = now;
          setTimeout(() => {
            if (wantListeningRef.current) startBrowserRecognition();
          }, 300);
        }
      } else {
        setStatusType("idle");
        setStatusMsg("Voice off");
      }
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch (err: any) {
      if (!err.message?.includes("already started")) {
        setStatusType("error");
        setStatusMsg("Could not start mic");
      }
    }
  }

  function stopRecognition() {
    wantListeningRef.current = false;
    // Close Deepgram WebSocket
    if (wsRef.current) {
      try {
        (wsRef.current as any)._mediaRecorder?.stop();
        (wsRef.current as any)._stream?.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        wsRef.current.close();
      } catch (_) {}
      wsRef.current = null;
    }
    // Stop browser recognition
    try { recRef.current?.stop(); } catch (_) {}
    recRef.current = null;
    setIsListening(false);
    setStatusType("idle");
    setStatusMsg("Voice off");
    setLiveText("");
    setRecognizedWords([]);
    accumulatedTextRef.current = "";
  }

  function toggle() {
    if (wantListeningRef.current) {
      stopRecognition();
    } else {
      wantListeningRef.current = true;
      lastRestartTimeRef.current = 0;
      startDeepgram(); // tries Deepgram first, falls back to browser
    }
  }

  // Respond to external `active` prop
  useEffect(() => {
    if (active && !wantListeningRef.current) {
      wantListeningRef.current = true;
      lastRestartTimeRef.current = 0;
      startDeepgram();
    }
    if (!active && wantListeningRef.current) {
      stopRecognition();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Cleanup on unmount
  useEffect(() => () => {
    wantListeningRef.current = false;
    if (wsRef.current) {
      try {
        (wsRef.current as any)._mediaRecorder?.stop();
        (wsRef.current as any)._stream?.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        wsRef.current.close();
      } catch (_) {}
    }
    try { recRef.current?.abort(); } catch (_) {}
  }, []);

  // ── UI ────────────────────────────────────────────────────────────────────
  const dotClass =
    statusType === "on" ? "bg-green-500 animate-pulse"
    : statusType === "error" ? "bg-red-500"
    : statusType === "bad-browser" ? "bg-amber-500"
    : "bg-slate-600";

  return (
    <div className="flex flex-col gap-2">
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

      {/* Recognized words display */}
      {recognizedWords.length > 0 && (
        <div className="flex flex-wrap gap-1 px-1">
          {recognizedWords.map((word, i) => {
            const lower = word.toLowerCase();
            const isGrade = /^(class|grade|std|twelfth|eleventh|tenth|ninth|eighth|seventh|sixth|fifth|fourth|third|second|first)$/.test(lower) || /^(1[0-2]|[1-9])$/.test(lower);
            const isSubject = ["physics","chemistry","maths","math","mathematics","biology","science","english","hindi","sanskrit","history","geography","economics","accountancy","accounts","business","evs","sst","bio","chem","geo","eco"].includes(lower);
            const isChapter = /^chapter$|^ch$/.test(lower) || /^\d+$/.test(lower);
            return (
              <span
                key={i}
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                  isGrade
                    ? "bg-indigo-500/20 text-indigo-300"
                    : isSubject
                    ? "bg-emerald-500/20 text-emerald-300"
                    : isChapter
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {word}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}