"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

// PhET simulation map — 60+ simulations covering physics, chemistry, biology, math
const SIMS: Record<string, string> = {
  // Physics — Mechanics
  'forces':'forces-and-motion-basics','friction':'friction','projectile-motion':'projectile-motion',
  'gravity':'gravity-force-lab','energy':'energy-skate-park-basics','pendulum':'pendulum-lab',
  'spring':'masses-and-springs','rotation':'torque','vector':'vector-addition',
  'motion':'forces-and-motion-basics','collision':'collision-lab','ramp':'the-ramp',
  'linear-momentum':'collision-lab','free-body-diagram':'forces-and-motion-basics',
  'centripetal':'gravity-force-lab-basics','fluid':'under-pressure',
  'pressure':'under-pressure','buoyancy':'under-pressure',
  // Physics — Waves & Light
  'waves':'waves-intro','light':'bending-light','refraction':'bending-light',
  'lens':'geometric-optics','optics':'geometric-optics','sound':'sound-waves',
  'wave-interference':'wave-interference','diffraction':'wave-interference',
  'resonance':'resonance','fourier':'fourier-making-waves',
  // Physics — Electricity & Magnetism
  'circuit':'circuit-construction-kit-dc','ohm':'ohms-law','resistor':'ohms-law',
  'capacitor':'capacitor-lab-basics','coulomb':'coulombs-law','faraday':'faradays-law',
  'magnetism':'magnets-and-electromagnets','electromagnet':'magnets-and-electromagnets',
  'electric-field':'charges-and-fields','static':'balloons-and-static-electricity',
  'induction':'faradays-law','generator':'generator',
  // Physics — Modern & Nuclear
  'photoelectric':'photoelectric-effect','quantum':'quantum-wave-interference',
  'nuclear':'nuclear-fission','radioactive':'radioactive-dating-game',
  'atom':'build-an-atom','isotope':'isotopes-and-atomic-mass',
  'rutherford':'rutherford-scattering','laser':'lasers',
  // Chemistry
  'molecule':'molecule-shapes','ph':'ph-scale','balancing':'balancing-chemical-equations',
  'reactant':'reactants-products-and-leftovers','concentration':'concentration',
  'molarity':'molarity','acid-base':'acid-base-solutions',
  'gas':'gas-properties','diffusion':'diffusion','states-of-matter':'states-of-matter',
  'chemical-bond':'molecule-polarity','polarity':'molecule-polarity',
  'density':'density','dissolution':'sugar-and-salt-solutions',
  'titration':'acid-base-solutions',
  // Biology
  'natural-selection':'natural-selection','evolution':'natural-selection',
  'gene':'gene-expression-essentials','dna':'gene-expression-essentials',
  'membrane':'membrane-channels','neuron':'neuron',
  // Math
  'graphing':'graphing-quadratics','trig':'trig-tour','area':'area-model-algebra',
  'slope':'graphing-slope-intercept','fraction':'fractions-intro',
  'proportion':'proportion-playground','statistics':'plinko-probability',
  'probability':'plinko-probability','function':'function-builder',
  'calculus':'calculus-grapher','derivative':'calculus-grapher',
  'parabola':'graphing-quadratics','linear-equation':'graphing-slope-intercept',
  // Earth & Space
  'greenhouse':'greenhouse-effect','blackbody':'blackbody-spectrum',
  'solar':'my-solar-system','orbit':'my-solar-system','kepler':'keplers-laws',
  'gravity-space':'gravity-force-lab-basics','plate-tectonics':'plate-tectonics',
};

import { VISUAL_STYLES, CONCEPT_VISUAL_TAXONOMY, CONCEPT_MAPS, ConceptNode } from "./accounting-graph";
import { lessonRAG } from "./lesson-rag";


// Accounting formula library — used by the formula card renderer
const ACCOUNTING_FORMULAS: Record<string, { label: string; formula: string; note: string }> = {
  'accounting equation':  { label: 'Accounting Equation',        formula: 'Assets = Liabilities + Capital',                         note: 'The foundation of double-entry bookkeeping' },
  'slm depreciation':     { label: 'Straight Line Method (SLM)', formula: 'Depreciation = (Cost \u2212 Scrap Value) \u00f7 Useful Life',      note: 'Equal charge every year on original cost' },
  'wdv depreciation':     { label: 'Written Down Value (WDV)',    formula: 'Depreciation = Book Value \u00d7 Rate %',                       note: 'Charge declines each year as book value reduces' },
  'gross profit':         { label: 'Gross Profit',               formula: 'GP = Net Sales \u2212 Cost of Goods Sold',                     note: 'COGS = Opening Stock + Purchases \u2212 Closing Stock' },
  'net profit':           { label: 'Net Profit',                 formula: 'NP = Gross Profit \u2212 Operating Expenses',                 note: 'Operating expenses: wages, rent, admin costs' },
  'working capital':      { label: 'Working Capital',            formula: 'WC = Current Assets \u2212 Current Liabilities',              note: 'Measures short-term financial health' },
  'current ratio':        { label: 'Current Ratio',              formula: 'Current Ratio = Current Assets \u00f7 Current Liabilities',   note: 'Ideal ratio is 2:1' },
  'cost of goods sold':   { label: 'Cost of Goods Sold (COGS)',  formula: 'COGS = Opening Stock + Net Purchases \u2212 Closing Stock',  note: 'Used in the Trading Account' },
  'rate of depreciation': { label: 'Rate of Depreciation',       formula: 'Rate = (Annual Depreciation \u00f7 Original Cost) \u00d7 100',    note: 'Expressed as a percentage per annum' },
  'trade discount':       { label: 'Trade Discount',             formula: 'Net Price = List Price \u2212 Trade Discount',                note: 'Not recorded in books; deducted before journalising' },
  'capital':              { label: 'Capital Formula',            formula: 'Capital = Assets \u2212 Liabilities',                        note: "Owner's equity or proprietor's fund" },
};

interface Student {
  name: string; status: "present" | "absent" | "pending";
}

export default function LiveClassPage() {
  const { user } = useAuth();
  const [apiKey] = useState(process.env.NEXT_PUBLIC_OPENAI_API_KEY || "");
  const [deepgramKey] = useState(process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || "");
  const serperKey = process.env.NEXT_PUBLIC_SERPER_API_KEY || "";
  
  const [activeMedia, _setActiveMedia] = useState<{type: "sim" | "image" | "video" | "formula", key: string, caption: string, url?: string} | null>(null);
  const activeMediaRef = useRef<{type: string, key: string} | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const recentStylesRef = useRef<string[]>([]);          // last 5 visual types this lesson
  const isFetchingVisualRef = useRef(false);
  const isProcessingSpeechRef = useRef(false);
  // ── Teaching Block Engine ──────────────────────────────────────────────────
  const teachingBlockRef = useRef<{
    name: string;          // e.g. "Depreciation"
    stage: number;         // 1-indexed depth within this block
    history: string[];     // visual types shown so far in this block
    startTime: number;
  } | null>(null);
  const lessonVisualHistoryRef = useRef<string[]>([]);  // last 15 visual types this lesson

  const setActiveMedia = (media: {type: "sim" | "image" | "video" | "formula", key: string, caption: string, url?: string} | null) => {
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
  const [todos, setTodos] = useState<string[]>([]);
  const todosRef = useRef<string[]>([]);
  todosRef.current = todos;
  const [liveTranscript, setLiveTranscript] = useState<string[]>([]);
  const [conceptMap, setConceptMap] = useState<ConceptNode[] | null>(null);
  const [blockStage, setBlockStage] = useState<{ name: string; stage: number; total: number } | null>(null);
  // ── Lesson RAG status ─────────────────────────────────────────────────────
  const [ragStatus, setRagStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  
  // QUIZ, Q&A, ADHD
  const [quiz, setQuiz] = useState<{q: string, options: string[], answer: number} | null>(null);
  const [calmMode, setCalmMode] = useState(false);
  
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
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        nativeRecognitionRef.current = new SR();
        nativeRecognitionRef.current.continuous = true;
        nativeRecognitionRef.current.interimResults = true;
        nativeRecognitionRef.current.onresult = (e: any) => {
          let t = "";
          for (let i = e.resultIndex; i < e.results.length; ++i) t += e.results[i][0].transcript;
          if (e.results[e.results.length-1].isFinal) processTranscript(t.toLowerCase());
        };
        nativeRecognitionRef.current.onend = () => { if (isListening && !socketRef.current) nativeRecognitionRef.current.start(); };
      }
    }
  }, [isListening]);

  const startDeepgram = async () => {
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
    } catch(e) { nativeRecognitionRef.current?.start(); }
  };

  const stopEngines = () => {
    socketRef.current?.close(); socketRef.current = null;
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
    nativeRecognitionRef.current?.stop();
  };

  // FACE RECOGNITION + EXPRESSION + MOUTH DETECTION ENGINE
  useEffect(() => {
    if (!isListening) {
      if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }
    const startCamera = async () => {
      try {
        let faceapi = (window as any).faceapi;
        if (!faceapi) {
          // Prevent duplicate script loading
          if (!document.querySelector('script[src*="face-api"]')) {
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
            s.onload = () => startCamera();
            document.head.appendChild(s);
          } else {
            setTimeout(() => startCamera(), 500);
          }
          return;
        }
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        console.log('%c[Talantir] All face models loaded', 'color: #10b981;');

        // Build face matcher from enrolled profiles
        const savedProfiles = JSON.parse(localStorage.getItem('cc-face-profiles') || '[]');
        let faceMatcher: any = null;
        if (savedProfiles.length > 0) {
          const labeledDescriptors = savedProfiles.map((p: any) =>
            new faceapi.LabeledFaceDescriptors(p.name, [new Float32Array(p.descriptor)])
          );
          faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.55);
          console.log(`%c[Talantir] Face matcher ready with ${savedProfiles.length} profiles`, 'color: #6366f1;');
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // autoPlay on the element handles playback
        }

        faceIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.paused) return;
          try {
            faceapi = (window as any).faceapi;
            const detections = await faceapi
              .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.35 }))
              .withFaceLandmarks()
              .withFaceExpressions()
              .withFaceDescriptors();
            const count = detections.length;
            setFacesDetected(count);
            if (count === 0) { setAttention(0); return; }

            let totalAttention = 0, totalInterest = 0, totalConfusion = 0, totalBoredom = 0;
            const speakersThisFrame: string[] = [];

            // Clear debug canvas before drawing new frame
            const dbgCanvas = debugCanvasRef.current;
            if (dbgCanvas && videoRef.current) {
              dbgCanvas.width = videoRef.current.videoWidth || 320;
              dbgCanvas.height = videoRef.current.videoHeight || 240;
              const dbgCtx = dbgCanvas.getContext('2d');
              if (dbgCtx) dbgCtx.clearRect(0, 0, dbgCanvas.width, dbgCanvas.height);
            }

            detections.forEach((d: any) => {
              const exp = d.expressions;
              // Expression-based attention
              const attentive = (exp.neutral || 0) * 0.8 + (exp.happy || 0) * 0.9 + (exp.surprised || 0) * 0.3;
              const confused = (exp.surprised || 0) * 0.6 + (exp.fearful || 0) * 0.8;
              const bored = (exp.sad || 0) * 0.9 + (exp.disgusted || 0) * 0.7 + (exp.angry || 0) * 0.5;
              totalAttention += Math.min(1, attentive);
              totalInterest += Math.min(1, attentive);
              totalConfusion += Math.min(1, confused);
              totalBoredom += Math.min(1, bored);

              // Identify the person
              let personName = 'Unknown';
              if (faceMatcher) {
                const match = faceMatcher.findBestMatch(d.descriptor);
                if (match.label !== 'unknown') personName = match.label;
              }

              // Track per-student stats
              if (personName !== 'Unknown') {
                const now = Date.now();
                if (!studentStatsRef.current[personName]) {
                  studentStatsRef.current[personName] = { attentionSum: 0, attentionCount: 0, speakingCount: 0, confusionSum: 0, boredomSum: 0, firstSeen: now, lastSeen: now };
                }
                const s = studentStatsRef.current[personName];
                s.attentionSum += Math.min(1, attentive);
                s.confusionSum += Math.min(1, confused);
                s.boredomSum += Math.min(1, bored);
                s.attentionCount += 1;
                s.lastSeen = now;
              }

              // Mouth Aspect Ratio (MAR) to detect speaking
              let isTalking = false;
              const landmarks = d.landmarks.positions;
              if (landmarks.length >= 68) {
                const upperLip = landmarks[62];
                const lowerLip = landmarks[66];
                const leftMouth = landmarks[60];
                const rightMouth = landmarks[64];
                const mouthHeight = Math.abs(upperLip.y - lowerLip.y);
                const mouthWidth = Math.abs(rightMouth.x - leftMouth.x);
                const mar = mouthWidth > 0 ? mouthHeight / mouthWidth : 0;
                if (mar > 0.25) {
                  isTalking = true;
                  if (personName !== 'Unknown') {
                    speakersThisFrame.push(personName);
                    if (studentStatsRef.current[personName]) {
                      studentStatsRef.current[personName].speakingCount += 1;
                    }
                  }
                }
              }

              // Draw debug box on canvas overlay
              const canvas = debugCanvasRef.current;
              if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  const box = d.detection.box;
                  const attnPct = Math.round(Math.min(1, attentive) * 100);
                  const boxColor = isTalking ? '#22d3ee' : (attnPct > 60 ? '#10b981' : attnPct > 30 ? '#f59e0b' : '#ef4444');
                  // Box
                  ctx.strokeStyle = boxColor;
                  ctx.lineWidth = 2;
                  ctx.strokeRect(box.x, box.y, box.width, box.height);
                  // Label background
                  const label = `${personName} ${attnPct}% ${isTalking ? '🗣️' : ''}`;
                  ctx.font = '10px monospace';
                  const textW = ctx.measureText(label).width + 8;
                  ctx.fillStyle = 'rgba(0,0,0,0.7)';
                  ctx.fillRect(box.x, box.y - 16, textW, 16);
                  // Label text
                  ctx.fillStyle = boxColor;
                  ctx.fillText(label, box.x + 4, box.y - 4);
                }
              }
            });

            // Update attention & engagement
            setAttention(Math.round((totalAttention / count) * 100));
            setEngagement({
              interest: Math.round((totalInterest / count) * 100),
              confusion: Math.round((totalConfusion / count) * 100),
              boredom: Math.round((totalBoredom / count) * 100),
            });

            // Update participation for detected speakers
            if (speakersThisFrame.length > 0) {
              setParticipation(prev => {
                const updated = { ...prev };
                speakersThisFrame.forEach(name => { updated[name] = (updated[name] || 0) + 1; });
                return updated;
              });
            }
          } catch(e) {}
        }, 2500);
      } catch(e) { console.log('[Attention] Camera unavailable:', e); }
    };
    startCamera();
    return () => { if (faceIntervalRef.current) clearInterval(faceIntervalRef.current); };
  }, [isListening]);

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

  const toggleSession = () => {
    if (isListening) {
      // Auto-save class summary on stop
      if (topic !== "Ready to Start") {
        const saved = JSON.parse(localStorage.getItem('cc-summaries') || '[]');
        saved.unshift({ id: `cs_${Date.now()}`, date: new Date().toISOString().split('T')[0], subject: 'General', title: topic, summary, teacher: 'Teacher', topics: todos.slice(0,3) });
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
    } catch(e) {}
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

    // ── CONCURRENCY & UNSTOPPABLE 10-SECOND HARD LOCK ───────────────────────
    // 1. Prevent concurrent speech pipelines (race condition fix)
    if (isProcessingSpeechRef.current || isFetchingVisualRef.current) {
      console.log("[Hard Lock] Pipeline already running — buffering transcript only.");
      return;
    }

    // 2. Absolutely prevent ANY visual or block switching if the current visual
    // has been displayed for less than 10 seconds (unless manually triggered).
    const timeSinceLastUpdate = Date.now() - lastUpdateTimeRef.current;
    if (!isTrigger && activeMediaRef.current && timeSinceLastUpdate < 10000) {
      console.log(`%c[Hard Lock] Visual locked for 10s minimum. (${Math.round(timeSinceLastUpdate/1000)}s / 10s elapsed)`, 'color: #f59e0b; font-weight: bold;');
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
      const minDisplayMs = 15000; // 15s minimum per visual
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

      Reply ONLY valid JSON:
      {
        "block_name": "the current teaching block name",
        "teaching_intent": "what student should understand in one sentence",
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
      if (newBlockName) setTopic(newBlockName);
      if (dec.teaching_intent) setSummary(dec.teaching_intent);

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
            // Collect all queries: primary + alternatives
            const primaryQuery = dec.primary_visual?.query || "";
            const altQueries: string[] = (dec.alternatives || []).map((a: { type: string; query: string }) => a.query).filter(Boolean);
            const allQueries = [primaryQuery, ...altQueries].filter(Boolean).slice(0, 4);

            // Fire all searches in parallel
            const searchResults = await Promise.allSettled(
              allQueries.map(q => fetchGoogleImages(q, false))
            );

            // Pool all successful results
            const pool: string[] = searchResults
              .filter((r): r is PromiseFulfilledResult<string | null> => r.status === "fulfilled" && r.value !== null)
              .map(r => r.value as string)
              .filter(Boolean);

            if (pool.length === 0) {
              console.log("[Visual Plan] All searches returned no results, keeping current visual.");
              return;
            }

            // Pick a candidate from the pool (prefer variety — avoid same URL as current)
            const currentUrl = activeMediaRef.current?.key || "";
            const freshPool = pool.filter(url => url !== currentUrl);
            const finalUrl = freshPool.length > 0
              ? freshPool[Math.floor(Math.random() * freshPool.length)]
              : pool[0];

            // Preload image before switching
            const isLoaded = await new Promise<boolean>(resolve => {
              const img = new Image();
              img.src = finalUrl;
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
              setTimeout(() => resolve(false), 5000);
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
      const q = gifOnly ? `${query} filetype:gif` : query;
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

      {/* LAYERED CINEMATIC BACKGROUND */}
      <div className={`absolute inset-0 z-0 pointer-events-none overflow-hidden transition-all duration-[4000ms] ease-in-out ${calmMode ? 'calm-bg' : ''}`} style={{ "--mood-color": moodMap[mood] } as any}>
         <div className="absolute inset-0 bg-black" />
         <div className="absolute -inset-[100%] opacity-40 animate-[spin_60s_linear_infinite]" style={{ background: `radial-gradient(circle at 50% 50%, var(--mood-color) 0%, transparent 60%)` }} />
         <div className="absolute inset-0 backdrop-blur-[120px]" />
         <div className={`absolute inset-0 transition-opacity duration-[3000ms] ${mood === 'space' ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 star-field opacity-80" />
            <div className="absolute inset-0 star-field opacity-40 rotate-90 scale-125" />
         </div>
         <div className="absolute inset-0 opacity-[0.04] pointer-events-none noise-layer" />
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

      {/* TOP TOPIC BANNER — shows block name + stage progress */}
      <div className="absolute top-8 inset-x-0 z-50 flex justify-center pointer-events-none">
         <div className="flex flex-col items-center gap-2">
           <div className="px-10 py-3 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl animate-fade-in flex items-center gap-4">
             <span className="text-[10px] uppercase tracking-[0.6em] text-white/30 font-black">Teaching Block:</span>
             <span className="text-sm font-bold tracking-widest text-indigo-400 uppercase drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">{topic}</span>
             {blockStage && (
               <span className="text-[9px] font-mono text-emerald-400/70 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                 Stage {blockStage.stage}/{blockStage.total}
               </span>
             )}
           </div>
           {/* Stage progress bar */}
           {blockStage && (
             <div className="w-48 h-0.5 bg-white/5 rounded-full overflow-hidden">
               <div
                 className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-1000"
                 style={{ width: `${Math.min(100, (blockStage.stage / blockStage.total) * 100)}%` }}
               />
             </div>
           )}
         </div>
      </div>

      {/* LEFT SUMMARY + CONCEPT MAP PANEL */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 w-72 z-50 pointer-events-none flex flex-col gap-4">
         {/* Teaching Intent */}
         <div className="p-6 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[32px] shadow-2xl animate-fade-in flex flex-col gap-3">
            <div className="flex items-center gap-3">
               <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
               <span className="text-[10px] uppercase tracking-[0.4em] font-black text-white/40">Teaching Intent</span>
            </div>
            <p className="text-xs leading-relaxed text-white/70 font-medium tracking-wide">{summary}</p>
         </div>

         {/* Concept Map */}
         {conceptMap && conceptMap.length > 0 && (
           <div className="p-5 bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[32px] shadow-2xl animate-fade-in">
             <div className="flex items-center gap-2 mb-4">
               <span className="text-[9px] uppercase tracking-[0.4em] font-black text-white/30">Concept Map</span>
               <div className="flex-1 h-px bg-white/5" />
             </div>
             <div className="flex flex-col gap-1.5">
               {conceptMap.map((node, i) => (
                 <div key={i}>
                   <div className="flex items-center gap-2">
                     <span className={`text-[10px] ${node.covered ? 'text-emerald-400' : 'text-white/20'}`}>
                       {node.covered ? '✓' : '○'}
                     </span>
                     <span className={`text-[11px] font-medium ${node.covered ? 'text-white/80' : 'text-white/25'}`}>
                       {node.label}
                     </span>
                   </div>
                   {node.children && node.children.map((child, j) => (
                     <div key={j} className="flex items-center gap-2 ml-4 mt-1">
                       <span className={`text-[9px] ${child.covered ? 'text-emerald-400/70' : 'text-white/10'}`}>
                         {child.covered ? '✓' : '·'}
                       </span>
                       <span className={`text-[10px] ${child.covered ? 'text-white/60' : 'text-white/15'}`}>
                         {child.label}
                       </span>
                     </div>
                   ))}
                 </div>
               ))}
             </div>
           </div>
         )}
      </div>

      {/* BOTTOM RIGHT TODO PANEL */}
      <div className="absolute right-6 bottom-6 w-72 z-50 pointer-events-none">
         <div className="p-8 bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[40px] shadow-2xl animate-fade-up flex flex-col gap-6">
            <div className="flex items-center justify-between">
               <span className="text-[10px] uppercase tracking-[0.4em] font-black text-white/30">ToDo lists</span>
               <span className="text-[8px] font-mono text-white/20">{todos.length} Active</span>
            </div>
            <div className="flex flex-col gap-3">
               {todos.length > 0 ? todos.slice(-3).map((todo, i) => (
                  <div key={i} className="flex gap-4 items-start animate-fade-in">
                     <div className="w-1.5 h-1.5 rounded-full border border-indigo-500/50 mt-1.5 shrink-0" />
                     <p className="text-xs text-white/60 font-medium leading-relaxed">{todo}</p>
                  </div>
               )) : (
                  <p className="text-[10px] text-white/10 italic">No tasks mentioned yet...</p>
               )}
            </div>
         </div>
      </div>

      {/* Attendance Overlay */}
      <div className={`absolute top-0 inset-x-0 h-auto min-h-[160px] z-50 flex items-center justify-center transition-all duration-1000 ${showAttendance ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}>
         <div className="bg-white/5 backdrop-blur-3xl border-b border-white/10 w-full p-10 flex flex-col items-center justify-center gap-10">
            <div className="flex flex-wrap gap-4 justify-center max-w-5xl">
                {students.map((s, i) => (
                  <div key={i} className={`px-5 py-2.5 rounded-2xl border transition-all duration-500 flex items-center gap-3 ${
                    i === attendanceIndex ? 'bg-white text-black scale-110 shadow-[0_0_40px_rgba(255,255,255,0.4)] z-10' :
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
                        <span className="text-indigo-400 font-bold mr-2">{String.fromCharCode(65+i)}</span>{opt}
                     </button>
                  ))}
               </div>
            </div>
         </div>
      )}



      {/* ATTENTION & ENGAGEMENT PANEL — Top Right */}
      {isListening && (
        <div className="absolute top-20 right-6 z-40 flex flex-col gap-3 items-end">
          {/* Camera PiP with Debug Overlay */}
          <div className="relative w-52 h-40 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/50">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80" />
            <canvas ref={debugCanvasRef} className="absolute inset-0 w-full h-full" />
            <div className="absolute bottom-1.5 left-2 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[8px] font-mono text-white/60">{facesDetected} faces</span>
            </div>
          </div>

          {/* Attention Ring */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none" />
              <circle cx="32" cy="32" r="28" stroke={attention > 60 ? '#10b981' : attention > 30 ? '#f59e0b' : '#ef4444'} strokeWidth="2" fill="none" strokeDasharray="176" strokeDashoffset={176 * (1 - attention / 100)} className="transition-all duration-1000" />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-sm font-bold text-white">{attention}%</span>
              <span className="text-[7px] uppercase tracking-widest text-white/30">Attn</span>
            </div>
          </div>

          {/* Engagement Toggle */}
          <button onClick={() => setShowEngagement(!showEngagement)} className="px-3 py-1.5 rounded-xl border border-white/5 bg-white/5 text-[9px] text-white/40 uppercase tracking-widest hover:bg-white/10 transition">
            {showEngagement ? '✕ Hide' : '📊 Engagement'}
          </button>

          {/* Engagement Bars */}
          {showEngagement && (
            <div className="w-48 p-4 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl space-y-2.5 animate-fade-in">
              <span className="text-[8px] uppercase tracking-[0.4em] font-black text-white/30 block mb-2">Engagement</span>
              {[{label: 'Interest', val: engagement.interest, color: '#6366f1'}, {label: 'Confusion', val: engagement.confusion, color: '#f59e0b'}, {label: 'Boredom', val: engagement.boredom, color: '#ef4444'}].map(e => (
                <div key={e.label} className="flex items-center gap-2">
                  <span className="text-[9px] text-white/40 w-16">{e.label}</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${e.val}%`, backgroundColor: e.color }} />
                  </div>
                  <span className="text-[8px] font-mono text-white/30 w-8 text-right">{e.val}%</span>
                </div>
              ))}
              {/* Top Participants */}
              <div className="mt-3 pt-3 border-t border-white/5">
                <span className="text-[8px] uppercase tracking-[0.4em] font-black text-white/30 block mb-2">Speakers</span>
                {Object.entries(participation).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name, count]) => (
                  <div key={name} className="flex justify-between items-center py-0.5">
                    <span className="text-[9px] text-white/50">{name}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-500/60" style={{ width: `${Math.min(100, count * 10)}%` }} />
                      </div>
                      <span className="text-[8px] font-mono text-white/30">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM LEFT LIVE TRANSCRIPT PANEL */}
      {isListening && (
         <div className="absolute left-6 bottom-20 w-72 z-50 pointer-events-none">
            <div className="p-6 bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[30px] shadow-2xl animate-fade-in flex flex-col gap-3">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.4em] font-black text-white/30">Live Transcript</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
               </div>
               <div className="max-h-24 overflow-y-auto scrollbar-thin text-xs text-white/70 space-y-1.5 pointer-events-auto leading-relaxed">
                  {liveTranscript.length > 0 ? liveTranscript.map((line, idx) => (
                     <p key={idx} className="border-l-2 border-indigo-500/30 pl-2 animate-fade-in">{line}</p>
                  )) : (
                     <p className="text-[10px] text-white/20 italic">Awaiting speech...</p>
                  )}
               </div>
            </div>
         </div>
      )}

      {/* Mic/Sync Status Corner */}
      <div className="absolute bottom-6 left-6 z-30 flex items-center gap-6">
         <div className="relative w-8 h-8 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
               <circle cx="16" cy="16" r="14" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" fill="none" />
               <circle cx="16" cy="16" r="14" stroke="white" strokeWidth="1.5" fill="none" strokeDasharray="88" strokeDashoffset={88 * (1 - countdown/30)} className="transition-all duration-1000 ease-linear opacity-20" />
            </svg>
            <span className="absolute text-[8px] font-mono font-bold opacity-40">{countdown}</span>
         </div>
         <div className={`w-2 h-2 rounded-full transition-all duration-500 ${isListening && !isSpeakingRef.current ? "bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" : "bg-white/10"}`} />
         {/* Lesson RAG status indicator */}
         {ragStatus !== 'idle' && (
           <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[8px] font-mono uppercase tracking-wider transition-all duration-500 ${
             ragStatus === 'ready'   ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
             ragStatus === 'loading' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' :
                                       'border-red-500/20 bg-red-500/10 text-red-400/60'
           }`}>
             <div className={`w-1 h-1 rounded-full ${
               ragStatus === 'ready'   ? 'bg-emerald-400' :
               ragStatus === 'loading' ? 'bg-amber-400 animate-pulse' :
                                         'bg-red-400/60'
             }`} />
             {ragStatus === 'ready' ? 'Lesson RAG ✓' : ragStatus === 'loading' ? 'Indexing...' : 'RAG offline'}
           </div>
         )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative z-10 flex items-center justify-center px-24">
        <div className={`w-full h-full transition-all duration-700 ${isRefreshing ? "opacity-0 scale-95 blur-2xl" : "opacity-100 scale-100 blur-0"}`}>
           {activeMedia ? (
            <div className="w-full h-full relative group flex items-center justify-center overflow-hidden">
               {activeMedia.type === "sim" && ( <iframe src={`https://phet.colorado.edu/sims/html/${activeMedia.key}/latest/${activeMedia.key}_en.html`} className="w-full h-full border-none" allowFullScreen /> )}
               {activeMedia.type === "image" && activeMedia.url?.endsWith('.mp4') && (
                 <video key={activeMedia.url} src={activeMedia.url} autoPlay loop muted playsInline
                   className="max-w-[95%] max-h-[95%] object-contain rounded-[60px] shadow-2xl animate-fade-in" />
               )}
               {activeMedia.type === "image" && !activeMedia.url?.endsWith('.mp4') && (
                 <img src={activeMedia.url} key={activeMedia.url} className="max-w-[95%] max-h-[95%] object-contain rounded-[60px] shadow-2xl animate-fade-in" alt="" />
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
          ) : ( <div className="flex flex-col items-center gap-4 animate-fade-in opacity-10"> <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" /> </div> )}
        </div>
      </div>

      {/* Session Toggle & Whiteboard Link */}
      <div className="absolute top-6 right-6 z-30 flex items-center gap-3 opacity-10 hover:opacity-100 transition-opacity">
         <Link href="/live-class/whiteboard" target="_blank" className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border border-white/5 bg-white/5 text-white/40 hover:text-white hover:bg-white/10" title="Open Interactive Whiteboard">🎨</Link>
         <button onClick={toggleSession} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border border-white/5 ${isListening ? "bg-white/10 text-white" : "bg-white/5 text-white/40"}`}>{isListening ? "⏹" : "▶"}</button>
      </div>
    </div>
  );
}
