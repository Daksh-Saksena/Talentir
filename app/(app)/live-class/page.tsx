"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import Toolbar from "@/components/whiteboard/Toolbar";
import WhiteboardCanvas, { WhiteboardCanvasHandle } from "@/components/whiteboard/WhiteboardCanvas";
import MagicBar from "@/components/whiteboard/MagicBar";
import LeftSidebar from "@/components/whiteboard/LeftSidebar";
import GraphPlotter from "@/components/whiteboard/GraphPlotter";
import type { MagicSettings, Tool } from "@/components/whiteboard/types";
import { TextbookView } from "@/app/(app)/textbook/page";
import Pusher from "pusher-js";

// PhET simulation map — 60+ simulations covering physics, chemistry, biology, math
const SIMS: Record<string, string> = {
  // Physics — Mechanics
  'forces': 'forces-and-motion-basics', 'friction': 'friction', 'projectile-motion': 'projectile-motion',
  'gravity': 'gravity-force-lab', 'energy': 'energy-skate-park-basics', 'pendulum': 'pendulum-lab',
  'spring': 'masses-and-springs', 'rotation': 'torque', 'vector': 'vector-addition',
  'motion': 'forces-and-motion-basics', 'collision': 'collision-lab', 'ramp': 'the-ramp',
  'linear-momentum': 'collision-lab', 'free-body-diagram': 'forces-and-motion-basics',
  'centripetal': 'gravity-force-lab-basics', 'fluid': 'under-pressure',
  'pressure': 'under-pressure', 'buoyancy': 'under-pressure',
  // Physics — Waves & Light
  'waves': 'waves-intro', 'light': 'bending-light', 'refraction': 'bending-light',
  'lens': 'geometric-optics', 'optics': 'geometric-optics', 'sound': 'sound-waves',
  'wave-interference': 'wave-interference', 'diffraction': 'wave-interference',
  'resonance': 'resonance', 'fourier': 'fourier-making-waves',
  // Physics — Electricity & Magnetism
  'circuit': 'circuit-construction-kit-dc', 'ohm': 'ohms-law', 'resistor': 'ohms-law',
  'capacitor': 'capacitor-lab-basics', 'coulomb': 'coulombs-law', 'faraday': 'faradays-law',
  'magnetism': 'magnets-and-electromagnets', 'electromagnet': 'magnets-and-electromagnets',
  'electric-field': 'charges-and-fields', 'static': 'balloons-and-static-electricity',
  'induction': 'faradays-law', 'generator': 'generator',
  // Physics — Modern & Nuclear
  'photoelectric': 'photoelectric-effect', 'quantum': 'quantum-wave-interference',
  'nuclear': 'nuclear-fission', 'radioactive': 'radioactive-dating-game',
  'atom': 'build-an-atom', 'isotope': 'isotopes-and-atomic-mass',
  'rutherford': 'rutherford-scattering', 'laser': 'lasers',
  // Chemistry
  'molecule': 'molecule-shapes', 'ph': 'ph-scale', 'balancing': 'balancing-chemical-equations',
  'reactant': 'reactants-products-and-leftovers', 'concentration': 'concentration',
  'molarity': 'molarity', 'acid-base': 'acid-base-solutions',
  'gas': 'gas-properties', 'diffusion': 'diffusion', 'states-of-matter': 'states-of-matter',
  'chemical-bond': 'molecule-polarity', 'polarity': 'molecule-polarity',
  'density': 'density', 'dissolution': 'sugar-and-salt-solutions',
  'titration': 'acid-base-solutions',
  // Biology
  'natural-selection': 'natural-selection', 'evolution': 'natural-selection',
  'gene': 'gene-expression-essentials', 'dna': 'gene-expression-essentials',
  'membrane': 'membrane-channels', 'neuron': 'neuron',
  // Math
  'graphing': 'graphing-quadratics', 'trig': 'trig-tour', 'area': 'area-model-algebra',
  'slope': 'graphing-slope-intercept', 'fraction': 'fractions-intro',
  'proportion': 'proportion-playground', 'statistics': 'plinko-probability',
  'probability': 'plinko-probability', 'function': 'function-builder',
  'calculus': 'calculus-grapher', 'derivative': 'calculus-grapher',
  'parabola': 'graphing-quadratics', 'linear-equation': 'graphing-slope-intercept',
  // Earth & Space
  'greenhouse': 'greenhouse-effect', 'blackbody': 'blackbody-spectrum',
  'solar': 'my-solar-system', 'orbit': 'my-solar-system', 'kepler': 'keplers-laws',
  'gravity-space': 'gravity-force-lab-basics', 'plate-tectonics': 'plate-tectonics',
};

import { VISUAL_STYLES, CONCEPT_VISUAL_TAXONOMY, CONCEPT_MAPS, ConceptNode } from "./accounting-graph";
import { lessonRAG } from "./lesson-rag";
import { searchLocalLibrary, recordShownImage, resetImageHistory } from "./local-image-library";


// Accounting formula library — used by the formula card renderer
const ACCOUNTING_FORMULAS: Record<string, { label: string; formula: string; note: string }> = {
  'accounting equation': { label: 'Accounting Equation', formula: 'Assets = Liabilities + Capital', note: 'The foundation of double-entry bookkeeping' },
  'slm depreciation': { label: 'Straight Line Method (SLM)', formula: 'Depreciation = (Cost \u2212 Scrap Value) \u00f7 Useful Life', note: 'Equal charge every year on original cost' },
  'wdv depreciation': { label: 'Written Down Value (WDV)', formula: 'Depreciation = Book Value \u00d7 Rate %', note: 'Charge declines each year as book value reduces' },
  'gross profit': { label: 'Gross Profit', formula: 'GP = Net Sales \u2212 Cost of Goods Sold', note: 'COGS = Opening Stock + Purchases \u2212 Closing Stock' },
  'net profit': { label: 'Net Profit', formula: 'NP = Gross Profit \u2212 Operating Expenses', note: 'Operating expenses: wages, rent, admin costs' },
  'working capital': { label: 'Working Capital', formula: 'WC = Current Assets \u2212 Current Liabilities', note: 'Measures short-term financial health' },
  'current ratio': { label: 'Current Ratio', formula: 'Current Ratio = Current Assets \u00f7 Current Liabilities', note: 'Ideal ratio is 2:1' },
  'cost of goods sold': { label: 'Cost of Goods Sold (COGS)', formula: 'COGS = Opening Stock + Net Purchases \u2212 Closing Stock', note: 'Used in the Trading Account' },
  'rate of depreciation': { label: 'Rate of Depreciation', formula: 'Rate = (Annual Depreciation \u00f7 Original Cost) \u00d7 100', note: 'Expressed as a percentage per annum' },
  'trade discount': { label: 'Trade Discount', formula: 'Net Price = List Price \u2212 Trade Discount', note: 'Not recorded in books; deducted before journalising' },
  'capital': { label: 'Capital Formula', formula: 'Capital = Assets \u2212 Liabilities', note: "Owner's equity or proprietor's fund" },
};

function formatInline(str: string) {
  const parts = str.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={i} className="italic text-indigo-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={i} className="bg-white/10 px-1 py-0.5 rounded text-[10px] font-mono text-cyan-300">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function parseFormattedText(text: string) {
  if (!text) return null;

  // Clean LaTeX TeX math syntax into readable math
  let cleaned = text
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1 / $2)")
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
    .replace(/\\cdot|\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\pm/g, "±")
    .replace(/\\leq/g, "≤")
    .replace(/\\geq/g, "≥")
    .replace(/\\neq/g, "≠")
    .replace(/\\approx/g, "≈")
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\theta/g, "θ")
    .replace(/\\pi/g, "π")
    .replace(/\\sigma/g, "σ")
    .replace(/\\delta/g, "δ")
    .replace(/\\lambda/g, "λ")
    .replace(/\\\(/g, "")
    .replace(/\\\)/g, "")
    .replace(/\\\[/g, "")
    .replace(/\\\]/g, "")
    .replace(/\$\$/g, "")
    .replace(/\$/g, "");

  const lines = cleaned.split("\n");

  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={lineIdx} className="h-1" />;

    if (/^#{1,4}\s+/.test(trimmed)) {
      const headerText = trimmed.replace(/^#{1,4}\s+/, "");
      return (
        <h4 key={lineIdx} className="text-[12px] font-bold text-indigo-300 mt-2 mb-1 tracking-wide">
          {formatInline(headerText)}
        </h4>
      );
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      const bulletText = trimmed.replace(/^[-*•]\s+/, "");
      return (
        <div key={lineIdx} className="flex gap-2 items-start my-0.5 text-[11px] text-white/90 leading-relaxed">
          <span className="text-indigo-400 font-bold mt-0.5 shrink-0">•</span>
          <div>{formatInline(bulletText)}</div>
        </div>
      );
    }

    return (
      <p key={lineIdx} className="text-[11px] text-white/85 leading-relaxed my-0.5">
        {formatInline(trimmed)}
      </p>
    );
  });
}

function sanitizeEquationForPlot(raw: string): string | null {
  if (!raw) return null;
  // Strip leading list numbers, prefixes, quotes, and punctuation
  let cleaned = raw.replace(/^(PLOT:|\d+[\.\)]|[a-z][\.\)]|[-*•]|["'`])\s*/gi, "").replace(/["'`]$/, "").trim();

  // Reject prose, English sentences, or multiple comma-separated statements (e.g., "When y = 1, x = -1")
  if (/\b(when|where|then|if|is|the|for|and|or|equals|value|point|solution|case|note)\b/i.test(cleaned)) {
    return null;
  }
  if (cleaned.includes(",")) return null;

  // Must contain valid math symbols or variables
  if (!/[x0-9^+\-*/()]/i.test(cleaned)) return null;

  // Convert f(x) = to y =
  cleaned = cleaned.replace(/^f\(x\)\s*=\s*/i, "y = ");

  // If there's no '=', prepend y =
  if (!cleaned.includes("=")) {
    cleaned = `y = ${cleaned}`;
  }

  return cleaned;
}

interface Student {
  name: string; status: "present" | "absent" | "pending";
}

export default function LiveClassPage() {
  const { user } = useAuth();
  const [apiKey] = useState(process.env.NEXT_PUBLIC_OPENAI_API_KEY || "");
  const [deepgramKey] = useState(process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || "");
  const serperKey = process.env.NEXT_PUBLIC_SERPER_API_KEY || "";

  const [activeMedia, _setActiveMedia] = useState<{ type: "sim" | "image" | "video" | "formula", key: string, caption: string, url?: string } | null>(null);
  const activeMediaRef = useRef<{ type: string, key: string } | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const recentStylesRef = useRef<string[]>([]);          // last 5 visual types this lesson
  const isFetchingVisualRef = useRef(false);
  const isProcessingSpeechRef = useRef(false);
  const manualModeRef = useRef(false);
  const imagePaceRef = useRef(10000); 

  // ── Teaching Block Engine ──────────────────────────────────────────────────
  const teachingBlockRef = useRef<{
    name: string;          // e.g. "Depreciation"
    stage: number;         // 1-indexed depth within this block
    history: string[];     // visual types shown so far in this block
    startTime: number;
  } | null>(null);
  const lessonVisualHistoryRef = useRef<string[]>([]);  // last 15 visual types this lesson

  const setActiveMedia = (media: { type: "sim" | "image" | "video" | "formula", key: string, caption: string, url?: string } | null) => {
    _setActiveMedia(media);
    activeMediaRef.current = media ? { type: media.type, key: media.key } : null;
    if (media) {
      lastUpdateTimeRef.current = Date.now();
    }
  };
  const [thinking, setThinking] = useState("Standby");
  const [isListening, setIsListening] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [attendanceIndex, setAttendanceIndex] = useState(-1);
  const [mood, setMood] = useState("default");

  // NEW DASHBOARD STATES
  const [topic, setTopic] = useState("Ready to Start");
  const [summary, setSummary] = useState("Listening for lecture points...");
  const summaryRef = useRef(summary);
  const [todos, setTodos] = useState<string[]>([]);
  const todosRef = useRef<string[]>([]);
  todosRef.current = todos;
  const [liveTranscript, setLiveTranscript] = useState<string[]>([]);
  const [conceptMap, setConceptMap] = useState<ConceptNode[] | null>(null);
  const [blockStage, setBlockStage] = useState<{ name: string; stage: number; total: number } | null>(null);
  // ── Lesson RAG status ─────────────────────────────────────────────────────
  const [ragStatus, setRagStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  // QUIZ, Q&A, ADHD
  const [quiz, setQuiz] = useState<{ q: string, options: string[], answer: number } | null>(null);
  const [calmMode, setCalmMode] = useState(false);

  // WHITEBOARD & TEXTBOOK STATE
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showTextbook, setShowTextbook] = useState(false);
  const whiteboardRef = useRef<WhiteboardCanvasHandle>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#000000");
  const [penSize, setPenSize] = useState(3);
  const [detectedEquations, setDetectedEquations] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleEquationDetected = (eq: string) => {
    setDetectedEquations((prev) => {
      if (prev.includes(eq)) return prev;
      return [eq, ...prev.slice(0, 4)];
    });
  };
  const [suggestions] = useState([
    "📈 Plot Graph for Equation",
    "Extract all key equations",
    "Summarise the last few minutes",
    "Generate 3 quiz questions",
    "List important concepts taught so far",
    "Explain this concept simply",
  ]);
  const [assistTool, setAssistTool] = useState("none");
  const [magicOpen, setMagicOpen] = useState(false);
  const [magicInput, setMagicInput] = useState("");
  const [magicResponse, setMagicResponse] = useState<string | null>(null);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicSettings, setMagicSettings] = useState<MagicSettings>({
    ocr: true,
    beautify: true,
    smartSuggestions: true,
    equationDetection: true,
    chemistryDetection: true,
    shapeDetection: true,
  });

  const runMagicAI = async (prompt: string) => {
    if (!apiKey || !prompt.trim()) return;
    setMagicLoading(true);
    setMagicResponse(null);
    try {
      const context = transcriptBuffer.current.join(" ");
      const boardImageDataUrl = whiteboardRef.current?.getCanvasDataURL?.();

      const userMessageContent: any[] = [
        {
          type: "text",
          text: `Lesson speech context: "${context || "No audio transcript recorded yet"}"\n\nTeacher Question / Task: ${prompt}`,
        },
      ];

      if (boardImageDataUrl) {
        console.log("%c[Magic AI Request] Sending whiteboard snapshot image to OpenAI Vision API! Size:", "color: #10b981; font-weight: bold;", `${Math.round(boardImageDataUrl.length / 1024)} KB`);
        userMessageContent.push({
          type: "image_url",
          image_url: {
            url: boardImageDataUrl,
            detail: "high",
          },
        });
      } else {
        console.warn("[Magic AI Request] No whiteboard image available, sending text context only.");
      }

      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an expert AI teaching assistant looking directly at the teacher's live whiteboard drawing/writing and speech transcript. Analyze any diagrams, equations, notes, or shapes drawn on the board in combination with the question. Keep answers clear, well-structured, concise, and helpful. FORMATTING RULES: Do NOT output raw LaTeX slash commands like \\frac, \\text, \\begin. Use clean plain Unicode math characters like x², √x, a ÷ b, θ, π, ±. GRAPHING RULE: If an equation is found or if asked to plot a graph, include the exact equation line at the end of your text as 'PLOT: <equation>' (e.g., PLOT: y = x^2 - 4 or PLOT: y = 2x + 3 or PLOT: y = sin(x)). Max 180 words.",
            },
            { role: "user", content: userMessageContent },
          ],
          max_tokens: 400,
        }),
      });
      const d = await r.json();
      const responseText = d.choices?.[0]?.message?.content || "No response received from AI.";

      const plotMatch = responseText.match(/PLOT:\s*([^\n\r]+)/i);
      let targetEq: string | null = null;

      if (plotMatch && plotMatch[1]) {
        targetEq = sanitizeEquationForPlot(plotMatch[1]);
      }

      if (!targetEq && (prompt.toLowerCase().includes("graph") || prompt.toLowerCase().includes("plot") || prompt.toLowerCase().includes("equation"))) {
        const candidateMatches = responseText.match(/\b(y\s*=\s*[x0-9^+\-*/().\s]+|f\(x\)\s*=\s*[x0-9^+\-*/().\s]+)\b/gi);
        if (candidateMatches) {
          for (const cand of candidateMatches) {
            const sanitized = sanitizeEquationForPlot(cand);
            if (sanitized) {
              targetEq = sanitized;
              break;
            }
          }
        }
      }

      if (targetEq) {
        console.log("%c[Magic AI Graph] Valid equation recognized and sent to GraphPlotter:", "color: #10b981; font-weight: bold;", targetEq);
        handleEquationDetected(targetEq);
      }

      const cleanResponse = responseText.replace(/PLOT:\s*[^\n\r]+/gi, "").trim();
      setMagicResponse(cleanResponse || responseText);
    } catch (e) {
      setMagicResponse("Error calling AI vision model. Check your API key.");
    }
    setMagicLoading(false);
  };

  // ATTENTION & PARTICIPATION
  const [attention, setAttention] = useState(0);
  const [facesDetected, setFacesDetected] = useState(0);
  const [participation, setParticipation] = useState<Record<string, number>>({});
  const [engagement, setEngagement] = useState({ interest: 70, confusion: 10, boredom: 5 });
  const [showEngagement, setShowEngagement] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const debugCanvasRef = useRef<HTMLCanvasElement>(null);
  const faceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const studentStatsRef = useRef<Record<string, { attentionSum: number, attentionCount: number, speakingCount: number, confusionSum: number, boredomSum: number, firstSeen: number, lastSeen: number }>>({});
  const sessionStartRef = useRef<number>(0);

  const attendanceIndexRef = useRef(-1);

  // Ref to hold the latest classroom state to prevent stale closures in BroadcastChannel listeners
  const latestStateRef = useRef({
    activeMedia,
    summary,
    todos,
    showWhiteboard,
    showTextbook,
    topic,
    isListening,
    calmMode,
    showAttendance,
    attendanceIndex
  });

  useEffect(() => {
    latestStateRef.current = {
      activeMedia,
      summary,
      todos,
      showWhiteboard,
      showTextbook,
      topic,
      isListening,
      calmMode,
      showAttendance,
      attendanceIndex
    };
  });

  const lastProcessedRef = useRef("");
  const isSpeakingRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const nativeRecognitionRef = useRef<any>(null);

  const [students, setStudents] = useState<Student[]>([
    { name: "Aarav", status: "pending" }, { name: "Aditi", status: "pending" },
    { name: "Vihaan", status: "pending" }, { name: "Diya", status: "pending" },
    { name: "Sai", status: "pending" }, { name: "Anaya", status: "pending" },
    { name: "Arjun", status: "pending" }, { name: "Zoya", status: "pending" },
    { name: "Ishaan", status: "pending" }, { name: "Kavya", status: "pending" }
  ]);

  const transcriptBuffer = useRef<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("preview") === "true") return;

      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        nativeRecognitionRef.current = new SR();
        nativeRecognitionRef.current.continuous = true;
        nativeRecognitionRef.current.interimResults = true;
        nativeRecognitionRef.current.onresult = (e: any) => {
          let t = "";
          for (let i = e.resultIndex; i < e.results.length; ++i) t += e.results[i][0].transcript;
          if (e.results[e.results.length - 1].isFinal) processTranscript(t.toLowerCase());
        };
        nativeRecognitionRef.current.onend = () => { if (isListening && !socketRef.current) nativeRecognitionRef.current.start(); };
      }
    }
  }, [isListening]);

  const startDeepgram = async () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("preview") === "true") return;
    }
    if (!deepgramKey) { nativeRecognitionRef.current?.start(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const socket = new WebSocket('wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true', ['token', deepgramKey]);
      socketRef.current = socket;
      socket.onopen = () => { console.log("%c[Deepgram] Live", "color: #10b981;"); mediaRecorderRef.current?.start(250); };
      socket.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        const transcript = data.channel.alternatives[0].transcript;
        if (transcript && data.is_final) processTranscript(transcript.toLowerCase());
      };
      socket.onerror = () => { nativeRecognitionRef.current?.start(); };
      mediaRecorderRef.current.ondataavailable = (event) => { if (event.data.size > 0 && socket.readyState === 1) socket.send(event.data); };
    } catch (e) { nativeRecognitionRef.current?.start(); }
  };

  const stopEngines = () => {
    socketRef.current?.close(); socketRef.current = null;
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
    nativeRecognitionRef.current?.stop();
  };

  // Cross-origin window.postMessage state synchronization — receives commands from the controller
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      const { type, data } = event.data || {};
      if (type === "sync_state" && data) {
        // Apply state to this instance (preview iframe)
        if (data.activeMedia !== undefined) setActiveMedia(data.activeMedia);
        if (data.summary !== undefined) setSummary(data.summary);
        if (data.todos !== undefined) setTodos(data.todos);
        if (data.showWhiteboard !== undefined) setShowWhiteboard(data.showWhiteboard);
        if (data.showTextbook !== undefined) setShowTextbook(data.showTextbook);
        if (data.topic !== undefined) setTopic(data.topic);
        if (data.isListening !== undefined) setIsListening(data.isListening);
        if (data.calmMode !== undefined) setCalmMode(data.calmMode);
        if (data.showAttendance !== undefined) setShowAttendance(data.showAttendance);
        if (data.attendanceIndex !== undefined) setAttendanceIndex(data.attendanceIndex);
        // Also forward to the MAIN live-class tab via BroadcastChannel (same origin)
        // so the actual class display updates when the controller pushes a change
        try {
          const fwd = new BroadcastChannel("lc-state-v2");
          fwd.postMessage({ type: "sync_state", data });
          fwd.close();
        } catch (_) { }
      }
    };
    window.addEventListener("message", handleWindowMessage);

    // [PUSHER] Subscribe to global state updates for cross-device remote control (e.g. phone/laptop -> school PC)
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    let pusherInstance: Pusher | null = null;
    if (pusherKey) {
      pusherInstance = new Pusher(pusherKey, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2",
      });
      const pusherChannel = pusherInstance.subscribe("classroom-sync");
      pusherChannel.bind("state-update", (data: any) => {
        console.log("%c[Pusher] Received remote control state update:", "color:#ec4899", data);
        if (data.activeMedia !== undefined) setActiveMedia(data.activeMedia);
        if (data.summary !== undefined) setSummary(data.summary);
        if (data.todos !== undefined) setTodos(data.todos);
        if (data.showWhiteboard !== undefined) setShowWhiteboard(data.showWhiteboard);
        if (data.showTextbook !== undefined) setShowTextbook(data.showTextbook);
        if (data.topic !== undefined) setTopic(data.topic);
        if (data.isListening !== undefined) setIsListening(data.isListening);
        if (data.calmMode !== undefined) setCalmMode(data.calmMode);
        if (data.showAttendance !== undefined) setShowAttendance(data.showAttendance);
        if (data.attendanceIndex !== undefined) setAttendanceIndex(data.attendanceIndex);
        if (data.manualMode !== undefined) manualModeRef.current = data.manualMode;
        if (data.imagePace !== undefined) imagePaceRef.current = data.imagePace * 1000;
        
        // Also relay via BroadcastChannel so other local tabs update too
        try {
          const fwd = new BroadcastChannel("lc-state-v2");
          fwd.postMessage({ type: "sync_state", data });
          fwd.close();
        } catch (_) { }
      });
    }

    return () => {
      window.removeEventListener("message", handleWindowMessage);
      if (pusherInstance) {
        pusherInstance.unsubscribe("classroom-sync");
        pusherInstance.disconnect();
      }
    };
  }, []);


  // 1. PREVIEW IFRAME: Listen for lc_state_broadcast messages from the main tab once on mount and relay them to parent controller
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const isPreview = params.get("preview") === "true";
    if (!isPreview) return;

    const STATE_CHANNEL = "lc-state-v2";
    const channel = new BroadcastChannel(STATE_CHANNEL);
    console.log("%c[Preview iframe] Listening on BroadcastChannel lc-state-v2", "color:#06b6d4");

    const handleMessage = (event: MessageEvent) => {
      const { type, data } = event.data || {};
      if (type === "lc_state_broadcast" && data) {
        console.log("%c[Preview iframe] Got lc_state_broadcast, relaying to parent controller", "color:#06b6d4", data.topic);
        // Apply state locally so the iframe renders correctly
        if (data.activeMedia !== undefined) setActiveMedia(data.activeMedia);
        if (data.summary !== undefined) {
          setSummary(data.summary);
          summaryRef.current = data.summary;
        }
        if (data.todos !== undefined) setTodos(data.todos);
        if (data.showWhiteboard !== undefined) setShowWhiteboard(data.showWhiteboard);
        if (data.showTextbook !== undefined) setShowTextbook(data.showTextbook);
        if (data.topic !== undefined) setTopic(data.topic);
        if (data.isListening !== undefined) setIsListening(data.isListening);
        if (data.calmMode !== undefined) setCalmMode(data.calmMode);
        if (data.showAttendance !== undefined) setShowAttendance(data.showAttendance);
        if (data.attendanceIndex !== undefined) setAttendanceIndex(data.attendanceIndex);

        // Relay to parent controller window
        try {
          window.parent.postMessage({ type: "classroom_state_update", data }, "*");
        } catch (_) { }
      }
    };

    channel.addEventListener("message", handleMessage);
    // Request state from the main tab immediately on mount
    channel.postMessage({ type: "lc_request_state" });
    console.log("%c[Preview iframe] Sent lc_request_state", "color:#06b6d4");

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
    };
  }, []);

  // 2. MAIN LIVE-CLASS TAB: Listen for requests (from iframe) and sync state commands (from controller via iframe) on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const isPreview = params.get("preview") === "true";
    if (isPreview) return;

    const STATE_CHANNEL = "lc-state-v2";
    const channel = new BroadcastChannel(STATE_CHANNEL);
    console.log("%c[Main live-class] BroadcastChannel lc-state-v2 ready", "color:#10b981");

    const handleRequest = (event: MessageEvent) => {
      if (event.data?.type === "lc_request_state") {
        console.log("%c[Main live-class] Got lc_request_state — sending current state", "color:#10b981", latestStateRef.current.topic);
        channel.postMessage({
          type: "lc_state_broadcast",
          data: latestStateRef.current
        });
      }

      // Also handle sync_state FROM the controller (via iframe) if override mode is active
      if (event.data?.type === "sync_state" && event.data?.data) {
        console.log("%c[Main live-class] Received sync_state from controller override", "color:#10b981", event.data.data);
        const d = event.data.data;
        if (d.activeMedia !== undefined) setActiveMedia(d.activeMedia);
        if (d.summary !== undefined) {
          setSummary(d.summary);
          summaryRef.current = d.summary;
        }
        if (d.todos !== undefined) setTodos(d.todos);
        if (d.showWhiteboard !== undefined) setShowWhiteboard(d.showWhiteboard);
        if (d.showTextbook !== undefined) setShowTextbook(d.showTextbook);
        if (d.topic !== undefined) setTopic(d.topic);
        if (d.isListening !== undefined) setIsListening(d.isListening);
        if (d.calmMode !== undefined) setCalmMode(d.calmMode);
        if (d.showAttendance !== undefined) setShowAttendance(d.showAttendance);
        if (d.attendanceIndex !== undefined) setAttendanceIndex(d.attendanceIndex);
        if (d.manualMode !== undefined) manualModeRef.current = d.manualMode;
        if (d.imagePace !== undefined) imagePaceRef.current = d.imagePace * 1000;
      }
    };

    channel.addEventListener("message", handleRequest);
    return () => {
      channel.removeEventListener("message", handleRequest);
      channel.close();
    };
  }, []);

  // 3. MAIN LIVE-CLASS TAB: Broadcast state updates to the preview iframe whenever local state changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const isPreview = params.get("preview") === "true";
    if (isPreview) return;

    const STATE_CHANNEL = "lc-state-v2";
    const channel = new BroadcastChannel(STATE_CHANNEL);
    console.log("%c[Main live-class] Broadcasting state update:", "color:#10b981", topic);

    channel.postMessage({
      type: "lc_state_broadcast",
      data: {
        activeMedia,
        summary,
        todos,
        showWhiteboard,
        showTextbook,
        topic,
        isListening,
        calmMode,
        showAttendance,
        attendanceIndex
      }
    });

    channel.close();
  }, [activeMedia, summary, todos, showWhiteboard, showTextbook, topic, isListening, calmMode, showAttendance, attendanceIndex]);


  const processTranscript = (cleaned: string) => {
    console.log("%c[Speech Heard]:", "color: #a855f7; font-weight: bold;", cleaned);
    setLiveTranscript(prev => {
      const updated = [...prev, cleaned];
      if (updated.length > 5) updated.shift();
      return updated;
    });
    const currentIndex = attendanceIndexRef.current;
    if (cleaned.includes("space") || cleaned.includes("star") || cleaned.includes("galaxy")) setMood("space");
    else if (cleaned.includes("ocean") || cleaned.includes("water") || cleaned.includes("sea")) setMood("ocean");
    else if (cleaned.includes("forest") || cleaned.includes("nature") || cleaned.includes("plant")) setMood("forest");
    else if (cleaned.includes("volcano") || cleaned.includes("fire") || cleaned.includes("lava")) setMood("volcano");

    if (currentIndex >= 0 && currentIndex < students.length && !isSpeakingRef.current) {
      const hasPresent = cleaned.includes("present") || cleaned.includes("yes") || cleaned.includes("here") || cleaned.includes("yeah") || cleaned.includes("okay");
      const hasAbsent = cleaned.includes("absent") || cleaned.includes("no") || cleaned.includes("skip");
      if (cleaned === lastProcessedRef.current) return;
      if (hasAbsent) {
        lastProcessedRef.current = cleaned;
        setStudents(prev => prev.map((s, i) => i === currentIndex ? { ...s, status: 'absent' } : s));
        setAttendanceIndex(currentIndex + 1);
        return;
      } else if (hasPresent) {
        lastProcessedRef.current = cleaned;
        setStudents(prev => prev.map((s, i) => i === currentIndex ? { ...s, status: 'present' } : s));
        setAttendanceIndex(currentIndex + 1);
        return;
      }
    }
    if (cleaned.includes("generate quiz") || cleaned.includes("start quiz") || cleaned.includes("make a quiz")) {
      generateQuiz(); return;
    }
    if (cleaned.includes("calm mode") || cleaned.includes("calming") || cleaned.includes("focus mode") || cleaned.includes("breathe")) {
      setCalmMode(prev => !prev); return;
    }

    // Track participation from speech
    if (currentIndex === -1) {
      // Heuristic: if we're in a normal (non-attendance) mode, attribute speech to "Teacher" or detect student name mentions
      const speaker = attendanceIndex >= 0 ? students[attendanceIndex]?.name : 'Teacher';
      if (speaker) setParticipation(prev => ({ ...prev, [speaker]: (prev[speaker] || 0) + 1 }));
      handleHeardSpeech(cleaned);
    }
  };

  const speak = (text: string, onEnd?: () => void) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      isSpeakingRef.current = true;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85; utterance.pitch = 1.0; utterance.lang = "en-IN";
      utterance.onend = () => { isSpeakingRef.current = false; if (onEnd) onEnd(); };
      utterance.onerror = () => { isSpeakingRef.current = false; };
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    attendanceIndexRef.current = attendanceIndex;
    if (attendanceIndex >= 0 && attendanceIndex < students.length) {
      setShowAttendance(true);
      speak(students[attendanceIndex].name);
    } else if (attendanceIndex >= students.length && attendanceIndex !== -1) {
      speak("Attendance complete");
      setAttendanceIndex(-1);
      attendanceIndexRef.current = -1;
      setTimeout(() => setShowAttendance(false), 4000);
    }
  }, [attendanceIndex, students.length]);

  useEffect(() => {
    if (isListening && attendanceIndex === -1) {
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { manualSync(); return 30; }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCountdown(30);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isListening, attendanceIndex]);

  // Auto-start class session & listening engines on page load/mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("preview") === "true") return;
    }
    if (apiKey) {
      sessionStartRef.current = Date.now();
      studentStatsRef.current = {};
      resetImageHistory();
      setIsListening(true);
      startDeepgram();
      setLiveTranscript([]);
      setRagStatus('loading');
      lessonRAG.init(apiKey, (msg) => console.log('[LessonRAG]', msg))
        .then(() => setRagStatus(lessonRAG.isReady ? 'ready' : 'error'))
        .catch(() => setRagStatus('error'));
    }
  }, [apiKey]);

  const toggleSession = () => {
    if (isListening) {
      // Auto-save class summary on stop
      if (topic !== "Ready to Start") {
        const saved = JSON.parse(localStorage.getItem('cc-summaries') || '[]');
        saved.unshift({ id: `cs_${Date.now()}`, date: new Date().toISOString().split('T')[0], subject: 'General', title: topic, summary, teacher: 'Teacher', topics: todos.slice(0, 3) });
        localStorage.setItem('cc-summaries', JSON.stringify(saved));
      }
      // Save per-student session analytics
      const sessionData = {
        id: `sess_${Date.now()}`,
        date: new Date().toISOString(),
        duration: Math.round((Date.now() - sessionStartRef.current) / 1000),
        topic,
        students: Object.entries(studentStatsRef.current).map(([name, s]) => ({
          name,
          avgAttention: s.attentionCount > 0 ? Math.round((s.attentionSum / s.attentionCount) * 100) : 0,
          avgConfusion: s.attentionCount > 0 ? Math.round((s.confusionSum / s.attentionCount) * 100) : 0,
          avgBoredom: s.attentionCount > 0 ? Math.round((s.boredomSum / s.attentionCount) * 100) : 0,
          speakingCount: s.speakingCount,
          timeInClass: Math.round((s.lastSeen - s.firstSeen) / 1000),
          detections: s.attentionCount,
        })),
        classAvgAttention: attention,
        engagement,
      };
      const sessions = JSON.parse(localStorage.getItem('cc-session-stats') || '[]');
      sessions.unshift(sessionData);
      localStorage.setItem('cc-session-stats', JSON.stringify(sessions));
      console.log('%c[Talantir] Session analytics saved', 'color: #6366f1;', sessionData);
      // Reset
      studentStatsRef.current = {};
      setIsListening(false); stopEngines(); if (document.fullscreenElement) document.exitFullscreen();
      setLiveTranscript([]);
    } else {
      if (!apiKey) return;
      const elem = document.documentElement as any;
      if (elem.requestFullscreen) elem.requestFullscreen();
      sessionStartRef.current = Date.now();
      studentStatsRef.current = {};
      resetImageHistory();
      setIsListening(true); startDeepgram();
      setLiveTranscript([]);
      // ── Initialize Lesson RAG in the background ──────────────────────────────
      setRagStatus('loading');
      lessonRAG.init(apiKey, (msg) => console.log('[LessonRAG]', msg))
        .then(() => setRagStatus(lessonRAG.isReady ? 'ready' : 'error'))
        .catch(() => setRagStatus('error'));
    }
  };

  const generateQuiz = async () => {
    const context = transcriptBuffer.current.join(' ');
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: `Based on: "${context}". Generate 1 MCQ quiz question. Reply JSON: {"q":"question","options":["A","B","C","D"],"answer":0}` }], response_format: { type: 'json_object' } })
      });
      const d = await r.json();
      const q = JSON.parse(d.choices[0].message.content);
      setQuiz(q);
      speak(q.q);
    } catch (e) { }
  };

  const manualSync = () => handleHeardSpeech("MANUAL_SYNC_TRIGGER");

  const handleHeardSpeech = async (text: string) => {
    const isTrigger = text === "MANUAL_SYNC_TRIGGER";
    if (!isTrigger) {
      transcriptBuffer.current.push(text);
      if (transcriptBuffer.current.length > 8) transcriptBuffer.current.shift();
      setCountdown(30);
    }

    const context = transcriptBuffer.current.join(" ");
    if (!context.trim()) {
      if (isTrigger) setActiveMedia(null);
      setThinking("Active");
      return;
    }

    // ── MANUAL MODE OVERRIDE ────────────────────────────────────────────────
    if (manualModeRef.current && !isTrigger) {
      console.log("[Manual Override] Suppressing auto-generation of AI content, keeping transcript context.");
      setThinking("Manual Override Active");
      return; // Keeps transcriptBuffer context, but doesn't call OpenAI
    }

    // ── CONCURRENCY & UNSTOPPABLE PACING HARD LOCK ──────────────────────────────
    // 1. Prevent concurrent speech pipelines (race condition fix)
    if (isProcessingSpeechRef.current || isFetchingVisualRef.current) {
      console.log("[Hard Lock] Pipeline already running — buffering transcript only.");
      return;
    }

    // 2. Absolutely prevent ANY visual or block switching if the current visual
    // has been displayed for less than the configured pacing time (unless manually triggered).
    const timeSinceLastUpdate = Date.now() - lastUpdateTimeRef.current;
    if (!isTrigger && activeMediaRef.current && timeSinceLastUpdate < imagePaceRef.current) {
      console.log(`%c[Hard Lock] Visual locked for pacing minimum. (${Math.round(timeSinceLastUpdate / 1000)}s / ${Math.round(imagePaceRef.current / 1000)}s elapsed)`, 'color: #f59e0b; font-weight: bold;');
      setThinking("Active");
      return;
    }

    isProcessingSpeechRef.current = true;
    setThinking("AI Thinking...");
    try {
      // ── STAGE A: Teaching Block Detection ──────────────────────────────────
      // Retrieve RAG context in parallel while we do block detection
      const ragQuery = `${teachingBlockRef.current?.name || ''} ${context}`.slice(0, 1000);
      const [ragChunks] = await Promise.all([
        lessonRAG.retrieve(ragQuery, apiKey, 4),
      ]);
      const ragContext = lessonRAG.formatContext(ragChunks);

      // Cheap, fast call: are we still in the same teaching block?
      const currentBlock = teachingBlockRef.current;
      let sameBlock = false;
      let resolvedBlockName = currentBlock?.name || "";

      if (currentBlock && !isTrigger) {
        const blockCheckPrompt = `Current teaching block: "${currentBlock.name}". New transcript: "${context}". Is the teacher still explaining "${currentBlock.name}" or has the topic clearly shifted to something different? Reply ONLY valid JSON: {"same_block": true or false, "new_block_name": "if different, what is the new topic, else empty string"}`;
        const blockCheckRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
          body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: blockCheckPrompt }], response_format: { type: "json_object" }, max_tokens: 60 })
        });
        const blockCheckData = await blockCheckRes.json();
        const blockCheck = JSON.parse(blockCheckData.choices[0].message.content);
        sameBlock = !!blockCheck.same_block;
        if (!sameBlock && blockCheck.new_block_name) {
          resolvedBlockName = blockCheck.new_block_name;
        }
      }

      // ── Calculate if we should advance stage or skip AI visual plan ─────────
      const timeSinceLastUpdate = Date.now() - lastUpdateTimeRef.current;
      const timeOnScreenSecs = Math.round(timeSinceLastUpdate / 1000);
      const minDisplayMs = imagePaceRef.current; // configurable pacing
      const shouldAdvance = !sameBlock || !activeMediaRef.current || timeSinceLastUpdate >= minDisplayMs || isTrigger;

      if (!shouldAdvance && !isFetchingVisualRef.current) {
        setThinking("Active");
        return;
      }

      // ── STAGE B: Visual Plan Generation ────────────────────────────────────
      const recentStylesStr = recentStylesRef.current.length > 0 ? recentStylesRef.current.join(", ") : "None yet";
      const availableStyles = VISUAL_STYLES.join(", ");
      const accountingFormulasRef = Object.entries(ACCOUNTING_FORMULAS)
        .map(([k, v]) => `"${k}" -> formula "${v.formula}" (${v.label})`).join('\n       ');

      // Build taxonomy hint if we know the block
      const blockNameLower = (resolvedBlockName || context).toLowerCase();
      const taxonomyMatch = Object.entries(CONCEPT_VISUAL_TAXONOMY).find(([key]) => blockNameLower.includes(key));
      const taxonomyHint = taxonomyMatch
        ? `Visual Taxonomy for "${taxonomyMatch[0]}": ${JSON.stringify(taxonomyMatch[1])}`
        : "";

      const blockStageHint = currentBlock && sameBlock
        ? `We are at visual stage ${currentBlock.stage + 1} for this block. Show something DEEPER than previous stage.`
        : `This is a NEW teaching block: "${resolvedBlockName || 'unknown'}". Start at stage 1.`;

      const conceptMapKeys = Object.keys(CONCEPT_MAPS).join(", ");

      const timeOnScreenHint = activeMediaRef.current
        ? `The current visual has been on screen for ${timeOnScreenSecs} seconds.`
        : "No visual is currently displayed.";

      const prompt = `You are an expert visual teaching assistant in a CBSE Grade 11 Accountancy classroom.
      Board: CBSE | Grade: 11 | Subject: Accountancy | Chapter: ${lessonRAG.meta?.chapter || 'Journal'}
      If the transcript is ambiguous, assume references belong to this chapter.
      Do NOT jump to concepts outside this chapter unless the teacher explicitly changes subjects.

      PIPELINE: Teaching Block Detection -> Visual Stage -> Visual Plan
      TEACHING BLOCK: "${resolvedBlockName || 'detecting...'}"
      ${blockStageHint}
      ${taxonomyHint}

      ${ragContext ? `TEXTBOOK CONTEXT (most relevant excerpts from today's chapter):
${ragContext}

Use the above textbook excerpts to:
1. Identify precisely where in the chapter the teacher is.
2. Select visuals that complement the exact sub-topic being explained.
3. Stay anchored to this chapter — do not hallucinate concepts not in the excerpts.` : ''}

      TRANSCRIPT: "${context}"
      Current Cumulative Summary: ${summaryRef.current || "None"}
      Current Todo List: ${JSON.stringify(todosRef.current)}.

      YOUR TASK: Design a full Visual Plan (not a single search query). Think like an experienced teacher:
      "What scene would help a Grade 11 student understand this in 5 seconds?"

      VISUAL DIVERSITY ENGINE:
      Available Styles: [${availableStyles}]
      Recently Used: [${recentStylesStr}]
      RULE: NEVER repeat a recently used style. Rotate deliberately.

      ${timeOnScreenHint}
      VISUAL TYPE RULES:
      - "type" must be one of: "image" | "formula" | "none" | "keep_current".
      - "keep_current": Use this if the current visual is STILL highly relevant and you would just suggest another very similar image. Do NOT swap just to swap! We want visuals to stay on screen for 15-30 seconds to avoid chaotic rapid switching.
      - Only output a new "image" if the teaching stage has significantly changed, the current image no longer matches, or it has been over 30 seconds.
      - "formula": Use when the teacher states an accounting equation.
      - "none": Use ONLY for pure greetings.

      CRITICAL RULE FOR NUMERICAL EXAMPLES & PROBLEMS:
      - When the teacher is dictating a specific example, working out a calculation, or discussing a scenario with numbers/names (e.g., "Let's take an example of a business with 50,000 capital and 10,000 drawings...", "Suppose Mr. X buys goods for 20,000..."):
      - NEVER search for an image of a problem, question, worksheet, ledger, or numerical calculation on Google Images! Google Images will return someone else's random worksheet or textbook question with different numbers and names, which will confuse the students!
      - Instead, when a numerical example or calculation is being discussed:
        1. If a relevant formula/concept is already on screen, return "keep_current".
        2. Or switch to "formula" (using one of the ACCOUNTING FORMULA KEYS like "accounting_equation", "capital", "golden_rules") so students see the clean underlying rule while the teacher calculates the numbers!
        3. Or if you must show an image, search ONLY for a clean, generic conceptual illustration (e.g., "owner investing cash into business illustration") or a blank structure (e.g., "blank T-account format diagram"). NEVER search for solved problems, numerical examples, questions, or worksheets!

      CONCEPT MAP: Available block names: [${conceptMapKeys}]
      If block_name matches one, return covered_subtopics (array of string labels that were mentioned).

      TEACHING INTENT EXAMPLES (follow this reasoning pattern):
      1. Teacher: "Furniture purchased for cash" -> intent: "Asset swap: one asset up, one down. Total unchanged."
         primary: { type: "Process flow", query: "cash paid for office furniture exchange transaction diagram" }
         alternatives: [
           { type: "Before vs After comparison", query: "before after balance sheet cash furniture asset swap" },
           { type: "Illustration", query: "businessman buying furniture office illustration" },
           { type: "T-account visualization", query: "furniture account debit cash account credit T-account" }
         ]

      2. Teacher: "Owner invests capital" -> intent: "Cash and Capital both increase. Equation stays balanced."
         primary: { type: "Illustration", query: "owner handing money to business illustration" }
         alternatives: [
           { type: "Before vs After comparison", query: "capital investment before after accounting equation" },
           { type: "Infographic", query: "owner equity capital accounting infographic" },
           { type: "Real-world photograph", query: "entrepreneur investing startup funding" }
         ]

      3. Teacher: "Let us talk about depreciation, why do assets lose value" -> intent: "Assets physically deteriorate."
         primary: { type: "Real-world photograph", query: "old worn out machinery factory equipment" }
         alternatives: [
           { type: "Illustration", query: "asset wear and tear decreasing value illustration" },
           { type: "Timeline", query: "asset value decreasing over years timeline" },
           { type: "Infographic", query: "causes of depreciation wear obsolescence infographic" }
         ]

      ACCOUNTING FORMULA KEYS:
       ${accountingFormulasRef}

      TODO LIST / HOMEWORK RULES:
      - NEVER invent, infer, or hallucinate general study tasks, notes, or practice suggestions!
      - ONLY add an item if the teacher EXPLICITLY assigns homework or tasks to students in the TRANSCRIPT (e.g., "do question 5 for homework", "solve illustration 3 at home").
      - If no new homework was explicitly assigned in this transcript chunk, return the exact existing Current Todo List unchanged!

      IMPORTANT — "teaching_intent" RULES (strict):
      - This field is a running, cumulative SUMMARY of the class for students.
      - Build upon the Current Cumulative Summary by appending new factual information from the transcript. Make it more comprehensive from the start of the class. Do NOT just replace it with a single sentence!
      - Do NOT mention students, audience, or learning objectives.
      - Keep it factual, concise, curriculum-focused.

      Reply ONLY valid JSON:
      {
        "block_name": "the current teaching block name",
        "teaching_intent": "1-2 sentence factual summary of the concept being taught",
        "homework": ["string"],
        "type": "image"|"formula"|"none"|"keep_current",
        "primary_visual": { "type": "style string", "query": "search query" },
        "alternatives": [
          { "type": "style string", "query": "search query" },
          { "type": "style string", "query": "search query" },
          { "type": "style string", "query": "search query" }
        ],
        "covered_subtopics": ["label strings from concept map that were mentioned"],
        "caption": "student-friendly explanation"
      }`;

      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" } })
      });
      const d = await r.json();
      const dec = JSON.parse(d.choices[0].message.content);

      // ── Update Teaching Block State ─────────────────────────────────────────
      const newBlockName = dec.block_name || resolvedBlockName || "Unknown";
      if (!currentBlock || !sameBlock) {
        // New block started
        teachingBlockRef.current = { name: newBlockName, stage: 1, history: [], startTime: Date.now() };
        // Load concept map if available
        const mapKey = Object.keys(CONCEPT_MAPS).find(k => newBlockName.toLowerCase().includes(k));
        setConceptMap(mapKey ? JSON.parse(JSON.stringify(CONCEPT_MAPS[mapKey])) : null);
      } else {
        // Advance stage within same block
        teachingBlockRef.current = {
          ...currentBlock,
          stage: currentBlock.stage + 1,
        };
      }

      // Update covered subtopics in concept map
      if (dec.covered_subtopics && Array.isArray(dec.covered_subtopics) && dec.covered_subtopics.length > 0) {
        setConceptMap(prev => {
          if (!prev) return prev;
          const markCovered = (nodes: ConceptNode[]): ConceptNode[] =>
            nodes.map(n => ({
              ...n,
              covered: n.covered || dec.covered_subtopics.some((s: string) => n.label.toLowerCase().includes(s.toLowerCase())),
              children: n.children ? markCovered(n.children) : undefined,
            }));
          return markCovered(prev);
        });
      }

      // Update block stage UI
      const taxEntry = taxonomyMatch?.[1];
      setBlockStage(teachingBlockRef.current ? {
        name: teachingBlockRef.current.name,
        stage: teachingBlockRef.current.stage,
        total: taxEntry ? taxEntry.length : 8,
      } : null);

      // Update topic and teaching intent
      if (dec.topic && dec.topic !== topic) setTopic(dec.topic);
      if (dec.teaching_intent && dec.teaching_intent !== summary) {
        setSummary(dec.teaching_intent);
        summaryRef.current = dec.teaching_intent;
      }

      if (dec.homework && Array.isArray(dec.homework)) {
        const hasCancellation = context.toLowerCase().match(/cancel|remove|clear|scratch|delete|forget|no need to/);
        if (dec.homework.length === 0 && todosRef.current.length > 0 && !hasCancellation) {
          // Keep existing todos
        } else {
          setTodos(dec.homework);
        }
      }

      // ── Parallel Multi-Search & Pool Selection ──────────────────────────────
      if (dec.type === "keep_current") {
        console.log("[Visual Plan] AI decided to keep current visual.");
      } else if (dec.type !== "none" && !isFetchingVisualRef.current) {
        isFetchingVisualRef.current = true;
        try {
          if (dec.type === "formula") {
            if (!isTrigger && activeMediaRef.current && Date.now() - lastUpdateTimeRef.current < 10000) {
              console.log("[Hard Lock] Aborting formula apply — another visual was applied less than 10s ago.");
              return;
            }
            const formulaKey = dec.primary_visual?.query || "";
            activeMediaRef.current = { type: "formula", key: formulaKey };
            lastUpdateTimeRef.current = Date.now();
            setIsRefreshing(true);
            setTimeout(() => {
              setActiveMedia({ type: "formula", key: formulaKey, caption: dec.caption });
              setIsRefreshing(false);
            }, 600);
          } else if (dec.type === "image") {
            // ── Priority 1: Search local image library ───────────────────────
            const primaryQuery = dec.primary_visual?.query || "";
            const combinedQuery = `${primaryQuery} ${dec.teaching_intent || ""}`.trim();
            const currentFilename = activeMediaRef.current?.key?.startsWith("/pics/")
              ? activeMediaRef.current.key.replace("/pics/", "")
              : null;

            const localResult = searchLocalLibrary(combinedQuery, currentFilename);

            let finalUrl: string;
            let isLocalImage = false;

            if (localResult && localResult.score >= 0.25) {
              console.log("%c[Local Library] Hit! score=", "color:#22c55e", localResult.score.toFixed(3), localResult.image.filename, "query:", combinedQuery);
              finalUrl = localResult.image.url;
              isLocalImage = true;
            } else {
              // ── Priority 2: Fall back to Google Images ───────────────────
              console.log("%c[Local Library] No match (score=", "color:#f59e0b", localResult?.score?.toFixed(3) ?? "0", "), falling back to Google.");
              const altQueries: string[] = (dec.alternatives || []).map((a: { type: string; query: string }) => a.query).filter(Boolean);
              const allQueries = [primaryQuery, ...altQueries].filter(Boolean).slice(0, 4);

              const searchResults = await Promise.allSettled(
                allQueries.map(q => fetchGoogleImages(q, false))
              );

              const pool: string[] = searchResults
                .filter((r): r is PromiseFulfilledResult<string | null> => r.status === "fulfilled" && r.value !== null)
                .map(r => r.value as string)
                .filter(Boolean);

              if (pool.length === 0) {
                console.log("[Visual Plan] All searches returned no results, keeping current visual.");
                return;
              }

              const currentUrl = activeMediaRef.current?.key || "";
              const freshPool = pool.filter(url => url !== currentUrl);
              finalUrl = freshPool.length > 0
                ? freshPool[Math.floor(Math.random() * freshPool.length)]
                : pool[0];
            }

            // Preload image before switching (local images load instantly, skip timeout penalty)
            const isLoaded = await new Promise<boolean>(resolve => {
              const img = new Image();
              img.src = finalUrl;
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
              setTimeout(() => resolve(false), isLocalImage ? 3000 : 6000);
            });

            if (!isLoaded) {
              console.log("[Visual Plan] Chosen image failed preload, aborting.");
              return;
            }

            // Record style for diversity enforcement
            const chosenStyle = dec.primary_visual?.type || "";
            if (chosenStyle) {
              recentStylesRef.current.push(chosenStyle);
              if (recentStylesRef.current.length > 10) recentStylesRef.current.shift();
              lessonVisualHistoryRef.current.push(chosenStyle);
              if (lessonVisualHistoryRef.current.length > 20) lessonVisualHistoryRef.current.shift();
            }

            // Record in local library history (for diversity / rotation)
            if (isLocalImage && localResult) {
              recordShownImage(localResult.image.filename);
            }

            if (!isTrigger && activeMediaRef.current && Date.now() - lastUpdateTimeRef.current < 10000) {
              console.log("[Hard Lock] Aborting image apply — another visual was applied less than 10s ago.");
              return;
            }
            activeMediaRef.current = { type: "image", key: finalUrl };
            lastUpdateTimeRef.current = Date.now();
            setIsRefreshing(true);
            setTimeout(() => {
              setActiveMedia({ type: "image", key: finalUrl, caption: dec.caption, url: finalUrl });
              setIsRefreshing(false);
            }, 600);
          }
        } finally {
          isFetchingVisualRef.current = false;
        }
      } else if (isTrigger) {
        setActiveMedia(null);
      }

      setThinking("Active");
    } catch (e: any) {
      console.error("AI Error:", e);
      setThinking("Error");
    } finally {
      isProcessingSpeechRef.current = false;
    }
  };

  // Fetch from Google Images via Serper.dev API — picks a RANDOM image from top results for variety
  const fetchGoogleImages = async (query: string, gifOnly: boolean) => {
    try {
      if (!serperKey) return null;
      // Actively filter out worksheets, exam questions, homework sheets, and numbered problems to prevent conflicting numbers on screen
      const cleanQuery = `${query} -worksheet -homework -question -exam -"problem 1" -"problem 2" -"example 1" -"example 2" -"Q1" -"Q2"`;
      const q = gifOnly ? `${cleanQuery} filetype:gif` : cleanQuery;
      const res = await fetch("https://google.serper.dev/images", {
        method: "POST",
        headers: {
          "X-API-KEY": serperKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          q,
          safe: "active"
        })
      });
      const data = await res.json();
      if (data.images && data.images.length > 0) {
        // Pick randomly from top 10 to ensure variety on repeated searches
        const pick = data.images[Math.floor(Math.random() * Math.min(data.images.length, 10))];
        console.log(`%c[Google Images] Found "${query}" (gif: ${gifOnly}):`, 'color: #3b82f6; font-weight: bold;', pick.imageUrl);
        return pick.imageUrl || null;
      }
      return null;
    } catch (e) {
      console.error("[Google Images Error]", e);
      return null;
    }
  };

  // Fallback: Wikipedia thumbnail (free, no key needed)
  const fetchWikiMedia = async (query: string) => {
    try {
      const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&prop=pageimages&pithumbsize=1200`);
      const data = await res.json();
      if (!data.query?.pages) return null;
      const pages = data.query.pages;
      return pages[Object.keys(pages)[0]].thumbnail?.source || null;
    } catch (e) { return null; }
  };

  const moodMap: Record<string, string> = {
    space: "#7c3aed", ocean: "#0ea5e9", forest: "#22c55e", volcano: "#ef4444", default: "#ffffff"
  };

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black flex flex-col font-sans overflow-hidden text-white select-none">

      <style jsx>{`
        @keyframes twinkle { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 1; transform: scale(1.2); } }
        .star-field {
          background-image: radial-gradient(2px 2px at 20px 30px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 40px 70px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 50px 160px, #fff, rgba(0,0,0,0));
          background-size: 200px 200px; animation: twinkle 4s infinite ease-in-out;
        }
        .noise-layer {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        @keyframes calm-breathe { 0%, 100% { transform: scale(1); opacity: 0.15; filter: blur(40px); } 50% { transform: scale(1.4); opacity: 0.4; filter: blur(20px); } }
        .calm-bg { backdrop-filter: blur(20px) saturate(50%); transition: all 2s ease-in-out; }
      `}</style>

      {/* CLEAN DARK BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[#0a0a0c]">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none noise-layer" />
      </div>

      {/* ADHD CALMING OVERLAY */}
      {calmMode && (
        <div className="absolute inset-0 z-[5] pointer-events-none flex items-center justify-center bg-black/20 animate-fade-in">
          <div className="w-[500px] h-[500px] rounded-full bg-indigo-500/40 shadow-[0_0_100px_rgba(99,102,241,0.2)]" style={{ animation: 'calm-breathe 8s infinite ease-in-out' }} />
          <div className="absolute w-[300px] h-[300px] rounded-full bg-cyan-400/30 shadow-[0_0_80px_rgba(34,211,238,0.2)]" style={{ animation: 'calm-breathe 6s infinite ease-in-out 1s' }} />
          <div className="absolute flex flex-col items-center gap-4">
            <p className="text-[12px] uppercase tracking-[1em] text-white/40 font-black animate-pulse">Deep Breath</p>
            <div className="w-1 h-12 bg-gradient-to-b from-white/0 via-white/20 to-white/0" />
          </div>
        </div>
      )}

      {/* RIGHT SUMMARY + TODO PANEL */}
      {!showTextbook && (
        <div className={`absolute right-6 ${showWhiteboard ? "top-20 -translate-y-0 z-50 scale-95 origin-top-right" : "top-20 -translate-y-0 z-30"} w-72 pointer-events-none flex flex-col gap-4 transition-all duration-700 ease-out`}>
          {/* Summary */}
          <div className="p-6 bg-zinc-950/90 backdrop-blur-3xl border border-white/15 rounded-[32px] shadow-2xl animate-fade-in flex flex-col gap-3 pointer-events-auto">
            <div className="flex items-center gap-3">
              <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.4em] font-black text-white/50">Summary</span>
            </div>
            <p className="text-xs leading-relaxed text-white/90 font-medium tracking-wide">{summary}</p>
          </div>

          {/* ToDo List (below Summary on the right) */}
          {!showWhiteboard && (
            <div className="p-6 bg-zinc-950/90 backdrop-blur-3xl border border-white/15 rounded-[32px] shadow-2xl animate-fade-up flex flex-col gap-4 pointer-events-auto">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.4em] font-black text-white/50">ToDo List</span>
                <span className="text-[8px] font-mono text-white/30">{todos.length} Active</span>
              </div>
              <div className="flex flex-col gap-2.5 max-h-40 overflow-y-auto scrollbar-thin">
                {todos.length > 0 ? todos.slice(-4).map((todo, i) => (
                  <div key={i} className="flex gap-3 items-start animate-fade-in">
                    <div className="w-1.5 h-1.5 rounded-full border border-indigo-500/50 mt-1.5 shrink-0" />
                    <p className="text-xs text-white/80 font-medium leading-relaxed">{todo}</p>
                  </div>
                )) : (
                  <p className="text-[10px] text-white/20 italic">No tasks mentioned yet...</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attendance Overlay */}
      <div className={`absolute top-0 inset-x-0 h-auto min-h-[160px] z-50 flex items-center justify-center transition-all duration-1000 ${showAttendance ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}>
        <div className="bg-white/5 backdrop-blur-3xl border-b border-white/10 w-full p-10 flex flex-col items-center justify-center gap-10">
          <div className="flex flex-wrap gap-4 justify-center max-w-5xl">
            {students.map((s, i) => (
              <div key={i} className={`px-5 py-2.5 rounded-2xl border transition-all duration-500 flex items-center gap-3 ${i === attendanceIndex ? 'bg-white text-black scale-110 shadow-[0_0_40px_rgba(255,255,255,0.4)] z-10' :
                s.status === 'present' ? 'bg-green-500/20 border-green-500/30 text-green-400' :
                  s.status === 'absent' ? 'bg-red-500/20 border-red-500/30 text-red-400' :
                    'bg-white/5 border-white/5 text-white/10'
                }`}>
                <span className="text-[10px] font-black tracking-widest uppercase">{s.name}</span>
              </div>
            ))}
          </div>
          {attendanceIndex >= 0 && attendanceIndex < students.length && (
            <div className="flex flex-col items-center gap-2 animate-fade-up">
              <p className="text-[10px] uppercase tracking-[0.6em] text-white/20 font-black">Awaiting Response</p>
              <h3 className="text-4xl font-black tracking-[0.2em] text-white uppercase">
                {students[attendanceIndex].name}
              </h3>
            </div>
          )}
        </div>
      </div>

      {/* QUIZ OVERLAY */}
      {quiz && (
        <div className="absolute inset-x-0 bottom-20 z-50 flex justify-center animate-fade-up">
          <div className="w-[600px] p-8 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] uppercase tracking-[0.4em] font-black text-indigo-400">Live Quiz</span>
              <button onClick={() => setQuiz(null)} className="text-white/30 hover:text-white text-xs">✕</button>
            </div>
            <p className="text-sm font-bold text-white mb-6 leading-relaxed">{quiz.q}</p>
            <div className="grid grid-cols-2 gap-3">
              {quiz.options.map((opt, i) => (
                <button key={i} onClick={() => { speak(i === quiz.answer ? 'Correct!' : 'Incorrect. The answer is ' + quiz.options[quiz.answer]); setTimeout(() => setQuiz(null), 3000); }}
                  className="px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-xs text-white/80 hover:bg-indigo-500/20 hover:border-indigo-500/30 transition text-left">
                  <span className="text-indigo-400 font-bold mr-2">{String.fromCharCode(65 + i)}</span>{opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}





      {/* IN-PLACE DRAWING BOARD OVERLAY */}
      {showWhiteboard && (
        <div className="absolute inset-4 z-[100] rounded-[40px] overflow-hidden bg-[#171717] border border-white/15 shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col animate-fade-in text-white">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-zinc-950/95 backdrop-blur z-30">
            {/* Left: all drawing tools in one row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Drawing Tools */}
              {([
                { value: 'pen', icon: '✏️', label: 'Pen' },
                { value: 'eraser', icon: '🧽', label: 'Eraser' },
                { value: 'highlighter', icon: '🖍️', label: 'Highlight' },
                { value: 'laser', icon: '📍', label: 'Laser' },
                { value: 'pan', icon: '✋', label: 'Pan' },
              ] as { value: Tool; icon: string; label: string }[]).map(t => (
                <button key={t.value} title={t.label} onClick={() => setTool(t.value)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all ${
                    tool === t.value ? 'bg-indigo-600 text-white shadow-md scale-105' : 'bg-white/5 hover:bg-white/10 text-white/80'
                  }`}>{t.icon}</button>
              ))}
              <div className="w-px h-6 bg-white/10 mx-1" />
              {/* Shape Tools */}
              {([
                { value: 'line', icon: '╱' },
                { value: 'rectangle', icon: '▭' },
                { value: 'circle', icon: '◯' },
                { value: 'arrow', icon: '↗' },
              ] as { value: Tool; icon: string }[]).map(t => (
                <button key={t.value} title={t.value} onClick={() => setTool(t.value)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                    tool === t.value ? 'bg-indigo-600 text-white shadow-md scale-105' : 'bg-white/5 hover:bg-white/10 text-zinc-200'
                  }`}>{t.icon}</button>
              ))}
              <div className="w-px h-6 bg-white/10 mx-1" />
              {/* Colors */}
              {['#000000','#2563eb','#ef4444','#16a34a','#eab308','#ffffff'].map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    color === c ? 'border-white scale-110 shadow-md' : 'border-white/20'
                  }`} style={{ background: c }} />
              ))}
              <div className="w-px h-6 bg-white/10 mx-1" />
              {/* Size */}
              <input type="range" min={1} max={20} value={penSize} onChange={e => setPenSize(Number(e.target.value))}
                className="w-20 h-1 accent-indigo-500" />
              <span className="text-[10px] text-white/40 font-mono w-6">{penSize}px</span>
              <div className="w-px h-6 bg-white/10 mx-1" />
              {/* Actions */}
              <button onClick={() => whiteboardRef.current?.undo()} title="Undo" className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-sm">↩</button>
              <button onClick={() => whiteboardRef.current?.redo()} title="Redo" className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-sm">↪</button>
              <button onClick={() => whiteboardRef.current?.clear()} title="Clear" className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm">🗑</button>
              <button onClick={() => whiteboardRef.current?.exportPNG()} title="Export" className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-sm">💾</button>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <button
                onClick={() => setMagicOpen(v => !v)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition border cursor-pointer ${
                  magicOpen ? 'bg-blue-600 border-blue-500 text-white' : 'bg-blue-600/20 border-blue-500/30 text-blue-200 hover:bg-blue-600/30'
                }`}
              >
                ✨ Magic AI
              </button>
            </div>
            {/* Right: Close button — always visible */}
            <button
              onClick={() => setShowWhiteboard(false)}
              className="ml-4 shrink-0 rounded-full bg-red-500/20 px-4 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/30 border border-red-500/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              ✕ Close
            </button>
          </div>

          {/* Canvas Area — no more separate left toolbar div */}
          <div className="flex-1 relative overflow-hidden">
            {/* Main Canvas */}
            <div className="w-full h-full">
              {sidebarOpen && (
                <div
                  className="fixed inset-0 z-40 bg-black/40"
                  onClick={() => setSidebarOpen(false)}
                />
              )}
              <LeftSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                settings={magicSettings}
                setSettings={setMagicSettings}
              />
              <WhiteboardCanvas
                ref={whiteboardRef}
                tool={tool}
                setTool={setTool}
                color={color}
                setColor={setColor}
                penSize={penSize}
                setPenSize={setPenSize}
                assistTool={assistTool}
                setAssistTool={setAssistTool}
                magicSettings={magicSettings}
                onEquationDetected={handleEquationDetected}
              />
            </div>

            {/* Graph Panels (bottom-right, above canvas) */}
            {magicSettings.equationDetection && detectedEquations.length > 0 && (
              <div className="absolute bottom-6 right-6 z-30 flex flex-col-reverse gap-3 items-end max-h-[85vh] overflow-y-auto">
                {detectedEquations.map((eq) => (
                  <GraphPlotter
                    key={eq}
                    equation={eq}
                    onClose={() => setDetectedEquations((prev) => prev.filter((e) => e !== eq))}
                  />
                ))}
              </div>
            )}

            {/* Magic AI Compact Panel — opens below Magic AI button */}
            {magicOpen && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 w-[440px] max-w-[95vw] rounded-2xl bg-zinc-950/98 border border-white/15 shadow-2xl backdrop-blur-2xl overflow-hidden pointer-events-auto animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <span className="text-xs font-black uppercase tracking-widest text-blue-400">✨ Magic AI</span>
                  <button onClick={() => setMagicOpen(false)} className="text-white/40 hover:text-white text-xs px-2 py-1 rounded transition cursor-pointer">✕</button>
                </div>
                <div className="p-4 space-y-3">
                  {/* Quick Suggestion Chips */}
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map(s => (
                      <button key={s} onClick={() => { setMagicInput(s); runMagicAI(s); }}
                        className="rounded-full bg-white/5 hover:bg-indigo-600/30 border border-white/10 hover:border-indigo-500/40 px-3 py-1 text-[10px] text-white/70 hover:text-white transition cursor-pointer">
                        {s}
                      </button>
                    ))}
                  </div>
                  {/* Custom Input */}
                  <div className="flex gap-2">
                    <input
                      value={magicInput}
                      onChange={e => setMagicInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && runMagicAI(magicInput)}
                      placeholder="Ask AI about the lesson..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-indigo-500/50 transition"
                    />
                    <button onClick={() => runMagicAI(magicInput)}
                      disabled={magicLoading || !magicInput.trim()}
                      className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 px-4 py-2 text-xs font-bold text-white transition cursor-pointer">
                      {magicLoading ? '...' : '→'}
                    </button>
                  </div>
                  {/* Toggle Settings */}
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">
                    {([
                      { key: 'beautify', label: '✍️ Beautify' },
                      { key: 'shapeDetection', label: '⬡ Shapes' },
                      { key: 'equationDetection', label: '∑ Equations' },
                    ] as { key: keyof MagicSettings; label: string }[]).map(item => (
                      <button key={item.key}
                        onClick={() => setMagicSettings(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                        className={`rounded-full px-3 py-1 text-[10px] border transition cursor-pointer ${
                          magicSettings[item.key] ? 'bg-indigo-600/30 border-indigo-500/40 text-indigo-300' : 'bg-white/5 border-white/10 text-white/40'
                        }`}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                  {/* AI Response */}
                  {magicLoading && (
                    <div className="flex items-center gap-2 py-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{animationDelay:'0ms'}} />
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{animationDelay:'150ms'}} />
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{animationDelay:'300ms'}} />
                      <span className="text-[10px] text-white/40">Thinking...</span>
                    </div>
                  )}
                  {magicResponse && !magicLoading && (
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3 max-h-56 overflow-y-auto space-y-1">
                      {parseFormattedText(magicResponse)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* IN-PLACE TEXTBOOK & PDF VIEWER OVERLAY */}
      {showTextbook && (
        <div className="absolute inset-4 z-[100] rounded-[40px] overflow-hidden bg-[#0a0a0c] border border-white/15 shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col animate-fade-in text-white">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-white/10 bg-zinc-950/90 backdrop-blur z-30">
            <div className="flex items-center gap-4">
              <span className="text-sm font-black uppercase tracking-[0.3em] text-indigo-400">NCERT Textbook & Voice Viewer</span>
              <span className="text-xs text-zinc-400 font-medium hidden md:inline">Voice-enabled PDF highlighting & AI assistant</span>
            </div>
            <button
              onClick={() => setShowTextbook(false)}
              className="rounded-full bg-red-500/20 px-5 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/30 border border-red-500/30 transition flex items-center gap-2 shadow-lg cursor-pointer pointer-events-auto"
            >
              ✕ Close Textbook
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 relative overflow-hidden bg-slate-950">
            <TextbookView isEmbedded={true} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 relative z-10 flex items-center justify-center p-4">
        <div className={`w-full h-full transition-all duration-700 ${isRefreshing ? "opacity-0 scale-95 blur-2xl" : "opacity-100 scale-100 blur-0"}`}>
          {activeMedia ? (
            <div className="w-full h-full relative group flex items-center justify-center overflow-hidden">
              {activeMedia.type === "sim" && (<iframe src={`https://phet.colorado.edu/sims/html/${activeMedia.key}/latest/${activeMedia.key}_en.html`} className="w-full h-full border-none rounded-xl" allowFullScreen />)}
              {activeMedia.type === "image" && activeMedia.url?.endsWith('.mp4') && (
                <video key={activeMedia.url} src={activeMedia.url} autoPlay loop muted playsInline
                  className="w-full h-full max-w-[100%] max-h-[100%] object-contain rounded-xl shadow-2xl animate-fade-in" />
              )}
              {activeMedia.type === "image" && !activeMedia.url?.endsWith('.mp4') && (
                <img src={activeMedia.url} key={activeMedia.url} className="w-full h-full max-w-[100%] max-h-[100%] object-contain rounded-xl shadow-2xl animate-fade-in" alt="" />
              )}
              {activeMedia.type === "formula" && (() => {
                const fKey = (activeMedia.key || "").toLowerCase().trim();
                const fData = ACCOUNTING_FORMULAS[fKey];
                const label = fData?.label || "Formula";
                const formulaStr = fData?.formula || activeMedia.key || "";
                const note = fData?.note || activeMedia.caption || "";
                // Split formula string into parts around operators for colour-coding
                const parts = formulaStr.split(/(\s*[=÷−+×→]\s*)/);
                return (
                  <div className="flex flex-col items-center justify-center gap-8 animate-fade-up px-16 w-full">
                    {/* Label chip */}
                    <div className="px-8 py-2.5 bg-indigo-500/10 border border-indigo-400/20 rounded-full">
                      <span className="text-[11px] uppercase tracking-[0.5em] font-black text-indigo-400">{label}</span>
                    </div>
                    {/* Formula card */}
                    <div className="w-full max-w-4xl p-14 bg-white/[0.04] backdrop-blur-3xl border border-white/10 rounded-[48px] shadow-[0_0_100px_rgba(99,102,241,0.12)] flex flex-col items-center gap-7">
                      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center">
                        {parts.map((part, i) => {
                          const trimmed = part.trim();
                          if (!trimmed) return null;
                          const isOp = /^[=÷−+×→]$/.test(trimmed);
                          return (
                            <span key={i} className={isOp
                              ? "text-5xl text-indigo-400/90 font-thin mx-1"
                              : i === 0
                                ? "text-[2.8rem] font-bold text-white leading-tight"
                                : "text-[2.8rem] font-semibold text-emerald-300/90 leading-tight"
                            }>{trimmed}</span>
                          );
                        })}
                      </div>
                      {note && (
                        <p className="text-sm text-white/35 tracking-wide text-center max-w-xl leading-relaxed mt-1">{note}</p>
                      )}
                    </div>
                    {/* Ambient glow */}
                    <div className="absolute inset-0 pointer-events-none rounded-full" style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(99,102,241,0.07) 0%, transparent 65%)" }} />
                  </div>
                );
              })()}
              {/* Caption */}
              {activeMedia.caption && (
                <div className="absolute bottom-6 inset-x-0 flex justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="px-6 py-2 bg-black/60 backdrop-blur-xl rounded-full border border-white/10">
                    <span className="text-[10px] text-white/60 tracking-widest">{activeMedia.caption}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (<div className="flex flex-col items-center gap-4 animate-fade-in opacity-10"> <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" /> </div>)}
        </div>
      </div>

      {/* Session Toggle, Whiteboard & Textbook Buttons */}
      {!showWhiteboard && !showTextbook && (
        <div className="absolute top-6 right-6 z-50 flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
        <button
          onClick={() => {
            const next = !showTextbook;
            setShowTextbook(next);
            if (next) setShowWhiteboard(false);
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border cursor-pointer ${showTextbook ? "bg-indigo-600 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-110" : "border-white/10 bg-white/10 text-white/70 hover:text-white hover:bg-white/20"}`}
          title="Toggle NCERT Textbook & PDF Viewer"
        >
          📚
        </button>
        <button
          onClick={() => {
            const next = !showWhiteboard;
            setShowWhiteboard(next);
            if (next) setShowTextbook(false);
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border cursor-pointer ${showWhiteboard ? "bg-indigo-600 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-110" : "border-white/10 bg-white/10 text-white/70 hover:text-white hover:bg-white/20"}`}
          title="Toggle Drawing Board"
        >
          🎨
        </button>
        <button onClick={toggleSession} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border border-white/10 cursor-pointer ${isListening ? "bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse" : "bg-white/10 text-white/70 hover:text-white hover:bg-white/20"}`} title={isListening ? "Stop Session" : "Start Session"}>{isListening ? "⏹" : "▶"}</button>
      </div>
      )}
    </div>
  );
}
