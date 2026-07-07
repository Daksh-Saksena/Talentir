"use client";

import { useState, useEffect, useRef } from "react";
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

// CBSE Grade 11 Accountancy — curated topic → ideal image search key mapping
const ACCOUNTING_VISUALS: Record<string, string> = {
  // Ch 1 — Introduction to Accounting
  'accounting introduction':      'accounting introduction infographic business',
  'users of accounting':          'users of accounting information stakeholders chart',
  'qualitative characteristics':  'qualitative characteristics accounting information diagram',
  'accounting objectives':        'objectives of accounting infographic',
  // Ch 2 — Basic Accounting Terms
  'business entity':              'business entity concept accounting diagram',
  'assets liabilities capital':   'assets liabilities capital accounting equation chart',
  'debtors creditors':            'debtors creditors accounts receivable payable diagram',
  'revenue expenses':             'revenue expenses profit loss accounting infographic',
  'trade discount cash discount': 'trade discount cash discount difference table',
  'voucher source document':      'accounting voucher source document types infographic',
  'goods stock inventory':        'goods stock inventory accounting diagram',
  // Ch 3 — Theory Base of Accounting
  'accounting concepts':          'fundamental accounting concepts conventions chart',
  'going concern':                'going concern concept accounting diagram',
  'accrual basis':                'accrual basis cash basis accounting comparison',
  'matching concept':             'matching concept revenue expenses accounting',
  'dual aspect':                  'dual aspect concept double entry system diagram',
  'money measurement':            'money measurement concept accounting limitation',
  'conservatism':                 'conservatism concept prudence accounting',
  'consistency':                  'consistency principle accounting standards',
  'accounting standards':         'accounting standards GAAP India infographic',
  'gst':                          'GST goods services tax India chart explanation',
  // Ch 4 — Accounting Equation
  'accounting equation':          'accounting equation assets liabilities capital diagram',
  // Ch 5 — Journal
  'journal':                      'accounting journal entry format ledger book',
  'journal entry':                'accounting journal entry debit credit format',
  'debit credit rules':           'debit credit rules accounting golden rules chart',
  'golden rules':                 'golden rules of accounting debit credit chart',
  'double entry':                 'double entry bookkeeping system diagram',
  // Ch 6 — Ledger
  'ledger':                       'ledger account T account format accounting',
  'ledger posting':               'ledger posting from journal to ledger diagram',
  'balancing ledger':             'balancing ledger accounts closing balance',
  // Ch 7 — Special Purpose Books
  'cash book':                    'cash book format single column double column accounting',
  'petty cash book':              'petty cash book format imprest system accounting',
  'purchase book':                'purchases book format accounting daybook',
  'sales book':                   'sales book format accounting daybook',
  'purchase return book':         'purchase returns book format accounting',
  'sales return book':            'sales returns book format accounting',
  'special purpose books':        'special purpose subsidiary books accounting diagram',
  // Ch 8 — Bank Reconciliation Statement
  'bank reconciliation':          'bank reconciliation statement format BRS',
  'brs':                          'bank reconciliation statement passbook cashbook difference',
  'passbook':                     'bank passbook account statement format',
  'bank statement':               'bank statement reconciliation accounting format',
  'unpresented cheque':           'bank reconciliation outstanding cheque passbook diagram',
  // Ch 9 — Trial Balance
  'trial balance':                'trial balance format debit credit accountancy',
  'errors trial balance':         'errors in trial balance classification accounting',
  'suspense account':             'suspense account rectification errors accounting',
  // Ch 10 — Rectification of Errors
  'rectification errors':         'rectification of errors accounting journal entry',
  'errors of omission':           'errors of omission commission accounting types',
  'compensating errors':          'compensating errors accounting explanation',
  // Ch 11 — Depreciation
  'depreciation':                 'depreciation concept fixed asset accounting diagram',
  'straight line method':         'straight line method depreciation graph chart',
  'slm depreciation':             'straight line depreciation SLM formula chart accountancy',
  'written down value':           'written down value WDV depreciation declining chart',
  'wdv depreciation':             'WDV written down value depreciation method comparison',
  'depreciation methods':         'SLM WDV depreciation methods comparison chart',
  'causes of depreciation':       'causes of depreciation wear tear obsolescence diagram',
  // Ch 12 — Provisions and Reserves
  'provisions':                   'provisions reserves accounting difference diagram',
  'reserves':                     'reserves types revenue capital accounting chart',
  'provision bad debts':          'provision for bad debts doubtful debts accounting',
  'general reserve':              'general reserve capital reserve specific reserve diagram',
  // Ch 13 — Bills of Exchange
  'bill of exchange':             'bill of exchange format drawer drawee payee accounting',
  'promissory note':              'promissory note format accounting negotiable instrument',
  // Ch 14 — Financial Statements
  'trading account':              'trading account format gross profit accounting',
  'profit loss account':          'profit and loss account format net profit accounting',
  'balance sheet':                'balance sheet format assets liabilities T account',
  'financial statements':         'financial statements income statement balance sheet diagram',
  'gross profit':                 'gross profit calculation formula accounting',
  'net profit':                   'net profit calculation operating expenses accounting',
  'working capital':              'working capital current assets liabilities accounting',
  'adjustments':                  'adjustments in final accounts prepaid accrued accounting',
  'prepaid expenses':             'prepaid expenses outstanding accrued accounting adjustment',
  'accrued income':               'accrued income unearned revenue accounting adjustment',
  'closing stock':                'closing stock trading account adjustment accounting',
};

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
      if (isTrigger) {
        setActiveMedia(null);
      }
      setThinking("Active");
      return;
    }

    setThinking("AI Thinking...");
    try {
      const simKeys = Object.keys(SIMS).join(', ');
      // Build accountancy visuals reference string for prompt injection
      const accountingVisualsRef = Object.entries(ACCOUNTING_VISUALS)
        .map(([k, v]) => `"${k}" -> search "${v}"`).join('\n       ');
      const accountingFormulasRef = Object.entries(ACCOUNTING_FORMULAS)
        .map(([k, v]) => `"${k}" -> formula "${v.formula}" (${v.label})`).join('\n       ');

      const prompt = `Transcript: "${context}". Current Todo List: ${JSON.stringify(todosRef.current)}.

      You are an expert visual teaching assistant in a CBSE Grade 11 Accountancy classroom in India.
      The class is already several months into the syllabus. DO NOT show generic introductory chapter cover images unless the teacher is explicitly revising fundamentals.
      Your job is to act as a dynamic teaching aid that tightly follows the teacher's current explanation at the sentence or paragraph level, focusing on subtopics and specific examples.

      VISUAL TYPE RULES:
      - "type" must be one of: "sim" | "gif" | "image" | "formula" | "none".
      - Use "none" ONLY for: pure greetings, roll call, classroom management ("sit down", "quiet", "hello class", "let us begin", "open your books").
      - Use "sim" ONLY if the topic EXACTLY matches a PhET simulation key: [${simKeys}].
      - Use "formula" when the teacher explains an accounting equation or formula. Set "key" to the EXACT formula key listed below.
      - Use "image" for accountancy concepts, formats, diagrams, charts, flowcharts, transaction illustrations, T-accounts, and balance sheet layouts.

      IMAGE SEARCH STRATEGY:
      - Track subtopics and specific examples closely (e.g. "furniture purchase", "bank loan", "inventory valuation", "drawings", "depreciation", "journal entry", "balance sheet").
      - Prioritize educational diagrams, infographics, textbook figures, transaction illustrations, T-account visuals, and labeled educational graphics over generic photos.
      - When the teacher explains a specific transaction or concept, generate a highly targeted search key.
      - Examples of good keys: "furniture purchase journal entry diagram", "bank loan accounting treatment chart", "T-account format example", "balance sheet asset side illustration".
      - NEVER use a single generic word like "journal", "ledger", "balance" — always append "accounting diagram", "format", "transaction illustration", etc.

      ACCOUNTANCY IMAGE SEARCH MAP (Use as a base reference, but you CAN and SHOULD invent highly specific search terms for subtopics/examples not covered here):
       ${accountingVisualsRef}

      ACCOUNTING FORMULA KEYS (when type is "formula", set "key" to EXACTLY one of these):
       ${accountingFormulasRef}
      If the formula is not in the list, write it out as a clear string like "GP = Net Sales - COGS".

      TODO LIST RULES:
      - You are given the "Current Todo List" of tasks already assigned this class.
      - If the teacher adds to an existing task (e.g. previously "Do ex 6.2 Q1-2" and now adds "Q3"), MERGE them into one item.
      - Do not delete items unless the teacher explicitly cancels them. Return the COMPLETE updated list in "homework".
      - Extract tasks ONLY if the teacher explicitly assigns them as NEW future requirements.
      - CRITICAL: Do NOT extract past homework checks (e.g. "I hope you finished...", "last class we did...", "catch up on..."). Only extract newly assigned tasks.
      - Prefix a task with "(HW) " ONLY if the teacher explicitly calls it homework or HW.

      EXAMPLES:
      1. Transcript: "For example, if we purchase furniture for 50,000 cash, what happens? Furniture comes in, cash goes out."
         Output: {"topic":"Furniture Purchase Transaction","summary":"Explaining the accounting treatment of purchasing an asset for cash.","homework":[],"type":"image","key":"furniture purchase journal entry diagram accountancy","caption":"Furniture A/c Dr. to Cash A/c"}

      2. Transcript: "Today we will learn about the accounting equation. Assets equals liabilities plus capital. This is the backbone of all accounting."
         Output: {"topic":"Accounting Equation","summary":"Introducing the fundamental accounting equation.","homework":[],"type":"formula","key":"accounting equation","caption":"Assets = Liabilities + Capital — the foundation of double-entry bookkeeping"}

      3. Transcript: "Let us look at a T-account for cash. We record all receipts on the debit side and payments on the credit side."
         Output: {"topic":"Cash T-Account","summary":"Explaining how to record transactions in a Cash T-account.","homework":[],"type":"image","key":"cash T-account format example illustration","caption":"Cash Account in T-format showing debit (receipts) and credit (payments)"}

      4. Transcript: "Good morning class. Open your books to chapter five. Let us begin."
         Output: {"topic":"Intro","summary":"Starting the class.","homework":[],"type":"none","key":"","caption":""}

      Reply ONLY valid JSON: {"topic":"string","summary":"string","homework":["string"],"type":"sim"|"gif"|"image"|"formula"|"none","key":"string","caption":"why this visual helps"}`;
      
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" } })
      });
      const d = await r.json();
      const dec = JSON.parse(d.choices[0].message.content);
      
      if (dec.topic) setTopic(dec.topic);
      if (dec.summary) setSummary(dec.summary);
      if (dec.homework && Array.isArray(dec.homework)) {
        const hasCancellation = context.toLowerCase().match(/cancel|remove|clear|scratch|delete|forget|no need to/);
        if (dec.homework.length === 0 && todosRef.current.length > 0 && !hasCancellation) {
          // Keep existing todos to protect against LLM forgetfulness
        } else {
          setTodos(dec.homework);
        }
      }

      if (dec.type !== "none") {
          const isDifferentVisual = 
            !activeMediaRef.current || 
            activeMediaRef.current.key.toLowerCase().trim() !== dec.key.toLowerCase().trim() || 
            activeMediaRef.current.type !== dec.type;
          
          const timeSinceLastUpdate = Date.now() - lastUpdateTimeRef.current;
          const minGap = isDifferentVisual ? 10000 : 20000;
          const isFirstMedia = !activeMediaRef.current;
          
          if (isFirstMedia || timeSinceLastUpdate >= minGap || isTrigger) {
              let finalUrl: string | null = null;
              if (dec.type === "sim") {
                if (!SIMS[dec.key]) return;
              } else if (dec.type === "formula") {
                // Formulas are text, ready instantly
              } else {
                if (dec.type === "gif") finalUrl = await fetchGoogleImages(dec.key, true);
                if (!finalUrl && (dec.type === "image" || dec.type === "gif")) finalUrl = await fetchGoogleImages(dec.key, false);
                // Fallback to Wikipedia if Google Search returns nothing
                if (!finalUrl && dec.type !== "sim" && dec.type !== "formula") finalUrl = await fetchWikiMedia(dec.key);
                
                // If we couldn't find any visual, keep the current visual on screen and do not switch
                if (!finalUrl) return;

                // Pre-load the image in the background so it's fully ready before switching
                try {
                  await new Promise((resolve) => {
                    const img = new Image();
                    img.src = finalUrl!;
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);
                    setTimeout(() => resolve(false), 5000); // 5s timeout max
                  });
                } catch (e) {
                  console.log("Preload failed, switching anyway");
                }
              }

              // Now we have the next visual ready! Trigger a quick transition
              setIsRefreshing(true);
              setTimeout(() => {
                if (dec.type === "sim") setActiveMedia({ type: "sim", key: SIMS[dec.key], caption: dec.caption });
                else if (dec.type === "formula") setActiveMedia({ type: "formula", key: dec.key, caption: dec.caption });
                else if (finalUrl) setActiveMedia({ type: "image", key: dec.key, caption: dec.caption, url: finalUrl });
                setIsRefreshing(false);
              }, 150);
          }
      } else if (isTrigger) setActiveMedia(null);
      setThinking("Active");
    } catch (e: any) { setThinking("Error"); }
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

      {/* TOP TOPIC BANNER */}
      <div className="absolute top-8 inset-x-0 z-50 flex justify-center pointer-events-none">
         <div className="px-10 py-3 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl animate-fade-in">
            <span className="text-[10px] uppercase tracking-[0.6em] text-white/30 font-black mr-4">Topic:</span>
            <span className="text-sm font-bold tracking-widest text-indigo-400 uppercase drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">{topic}</span>
         </div>
      </div>

      {/* LEFT SUMMARY PANEL */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 w-72 z-50 pointer-events-none flex flex-col gap-4">
         <div className="p-8 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-2xl animate-fade-in flex flex-col gap-4">
            <div className="flex items-center gap-3">
               <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
               <span className="text-[10px] uppercase tracking-[0.4em] font-black text-white/40">Live Summary</span>
            </div>
            <p className="text-sm leading-relaxed text-white/80 font-medium tracking-wide">
               {summary}
            </p>
         </div>
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
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative z-10 flex items-center justify-center px-24">
        <div className={`w-full h-full transition-all duration-300 ${isRefreshing ? "opacity-0 scale-95 blur-2xl" : "opacity-100 scale-100 blur-0"}`}>
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

      {/* Session Toggle */}
      <div className="absolute top-6 right-6 z-30 opacity-10 hover:opacity-100 transition-opacity">
         <button onClick={toggleSession} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border border-white/5 ${isListening ? "bg-white/10 text-white" : "bg-white/5 text-white/40"}`}>{isListening ? "⏹" : "▶"}</button>
      </div>
    </div>
  );
}
