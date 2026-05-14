"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";

const SIMS: Record<string, string> = {
  'forces':'forces-and-motion-basics','friction':'friction','projectile':'projectile-motion',
  'gravity':'gravity-force-lab','energy':'energy-skate-park-basics','waves':'waves-intro',
  'density':'density','pendulum':'pendulum-lab','circuit':'circuit-construction-kit-dc',
  'lens':'geometric-optics','atom':'build-an-atom','isotope':'isotopes-and-atomic-mass',
  'molecule':'molecule-shapes','ph':'ph-scale','balancing':'balancing-chemical-equations',
  'reactant':'reactants-products-and-leftovers','concentration':'concentration',
  'graphing':'graphing-quadratics','trig':'trig-tour','area':'area-model-algebra',
  'vector':'vector-addition','ohm':'ohms-law','coulomb':'coulombs-law',
  'faraday':'faradays-law','capacitor':'capacitor-lab-basics',
  'diffusion':'diffusion','gas':'gas-properties','motion':'forces-and-motion-basics',
  'rotation':'torque','slope':'graphing-slope-intercept','spring':'masses-and-springs',
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export default function AiTutorPage() {
  const { user } = useAuth();
  
  // Directly use keys from .env.local
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || "";
  const didKey = process.env.NEXT_PUBLIC_DID_API_KEY || "";
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [activeMedia, setActiveMedia] = useState<{ type: "sim"; key: string; caption: string } | null>(null);
  const [isMicActive, setIsMicActive] = useState(false);
  const [showResource, setShowResource] = useState(false);
  const [statusText, setStatusText] = useState("System Offline");
  const [didStatus, setDidStatus] = useState("Awaiting Neural Link");
  const [isInitializing, setIsInitializing] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const messagesRef = useRef<Message[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const streamIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Load Lucide icons
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/lucide@latest";
    script.onload = () => {
      if ((window as any).lucide) {
        (window as any).lucide.createIcons();
      }
    };
    document.body.appendChild(script);

    const timer = setTimeout(() => {
      setIsInitializing(false);
      // Re-trigger lucide after loader hides
      if ((window as any).lucide) (window as any).lucide.createIcons();
    }, 1500);
    return () => {
      clearTimeout(timer);
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  // Update icons when messages change or UI state changes
  useEffect(() => {
    if ((window as any).lucide && !isInitializing) {
      (window as any).lucide.createIcons();
    }
  });

  useEffect(() => {
    messagesRef.current = messages;
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-IN";

        recognitionRef.current.onstart = () => setIsMicActive(true);
        recognitionRef.current.onresult = (e: any) => {
          if (e.results[0].isFinal) {
            handleSend(e.results[0][0].transcript);
          }
        };
        recognitionRef.current.onend = () => setIsMicActive(false);
        recognitionRef.current.onerror = () => setIsMicActive(false);
      }
    }
  }, [apiKey]);

  const initDIDStream = async () => {
    if (!didKey || didKey === "your_d_id_api_key_here") {
      setDidStatus("Biometric verification failed (Key missing)");
      return;
    }
    
    setDidStatus("Connecting...");
    try {
      const authHeader = `Basic ${didKey.includes(":") ? btoa(didKey) : didKey}`;
      // Using D-ID's official public test bucket image to avoid 400 Bad Request on fetch
      const safeImageUrl = "https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg";
      
      const res = await fetch("https://api.d-id.com/talks/streams", {
        method: "POST",
        headers: { "Authorization": authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ source_url: safeImageUrl })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("D-ID Stream Creation Error:", errorText);
        throw new Error("Failed to create stream");
      }
      const { id: streamId, session_id: sessionId, offer } = await JSON.parse(await res.text());
      
      streamIdRef.current = streamId;
      sessionIdRef.current = sessionId;

      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      peerConnectionRef.current = pc;

      pc.onicecandidate = async (event) => {
        if (event.candidate && streamId && sessionId) {
          try {
            await fetch(`https://api.d-id.com/talks/streams/${streamId}/ice`, {
              method: "POST",
              headers: { "Authorization": authHeader, "Content-Type": "application/json" },
              body: JSON.stringify({
                candidate: event.candidate.candidate,
                sdpMid: event.candidate.sdpMid,
                sdpMLineIndex: event.candidate.sdpMLineIndex,
                session_id: sessionId
              })
            });
          } catch(e) {}
        }
      };

      pc.ontrack = (event) => {
        if (videoRef.current && event.track.kind === 'video') {
          videoRef.current.srcObject = event.streams[0];
          setDidStatus("Active");
          setStatusText("System Online");
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await fetch(`https://api.d-id.com/talks/streams/${streamId}/sdp`, {
        method: "POST",
        headers: { "Authorization": authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answer, session_id: sessionId })
      });
    } catch (e) {
      setDidStatus("Connection Failed");
    }
  };

  const makeAvatarSpeak = async (text: string) => {
    if (!streamIdRef.current || !sessionIdRef.current || !didKey || didKey === "your_d_id_api_key_here") {
      // Fallback
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text.replace(/\*\*/g, "").substring(0, 500));
        u.lang = "en-US"; u.rate = 1.05;
        window.speechSynthesis.speak(u);
      }
      return;
    }

    try {
      const authHeader = `Basic ${didKey.includes(":") ? btoa(didKey) : didKey}`;
      await fetch(`https://api.d-id.com/talks/streams/${streamIdRef.current}`, {
        method: "POST",
        headers: { "Authorization": authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          script: {
            type: "text",
            input: text.replace(/\*\*/g, "").substring(0, 1000),
            provider: { type: "microsoft", voice_id: "en-US-JennyNeural" }
          },
          session_id: sessionIdRef.current
        })
      });
    } catch (e) {}
  };

  useEffect(() => {
    return () => {
      if (streamIdRef.current && sessionIdRef.current) {
        const authHeader = `Basic ${didKey.includes(":") ? btoa(didKey) : didKey}`;
        fetch(`https://api.d-id.com/talks/streams/${streamIdRef.current}`, {
          method: "DELETE",
          headers: { "Authorization": authHeader, "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionIdRef.current })
        }).catch(()=>{});
      }
      peerConnectionRef.current?.close();
    };
  }, []);

  const handleStart = () => {
    setStatusText("Initializing...");
    initDIDStream();
    
    const welcome = `Welcome ${user?.name || "Student"}! I am your AI Tutor. Let's begin the session.`;
    setMessages([{ role: "assistant", content: welcome }]);
    setTimeout(() => makeAvatarSpeak(welcome), 3000);
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isBusy) return;
    if (!apiKey) {
      setMessages(p => [...p, { role: "user", content: text }, { role: "system", content: "Missing OpenAI API Key in .env.local" }]);
      return;
    }
    
    const newMsgs: Message[] = [...messagesRef.current, { role: "user", content: text }];
    setMessages(newMsgs);
    setIsBusy(true);

    try {
      const sysPrompt = `You are a helpful AI JEE Tutor. Keep responses concise and use markdown formatting.`;
      const isOpenAI = apiKey.startsWith("sk-");
      let responseText = "";

      if (isOpenAI) {
        const r = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
          body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "system", content: sysPrompt }, ...newMsgs], temperature: 0.7 })
        });
        const d = await r.json();
        responseText = d.choices[0].message.content;
      } else {
        const contents = newMsgs.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: sysPrompt }] }, ...contents] })
        });
        const d = await r.json();
        responseText = d.candidates[0].content.parts[0].text;
      }
      
      setMessages(prev => [...prev, { role: "assistant", content: responseText }]);
      makeAvatarSpeak(responseText);
      analyzeContext(newMsgs.concat({ role: "assistant", content: responseText }));
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "system", content: `Error: ${e.message}` }]);
    } finally {
      setIsBusy(false);
    }
  };

  const analyzeContext = async (history: Message[]) => {
    const lastTxt = history.slice(-4).map(m => m.content).join("\n");
    const prompt = `Based on this JEE conversation, decide if a visual aid would help. CONVERSATION: ${lastTxt}. Reply ONLY with JSON: {"type":"sim","key":"ONE_OF: ${Object.keys(SIMS).join(',')}","caption":"short reason"} or {"type":"none"}`;
    try {
      const sysPrompt = "You are a JSON parser.";
      let rTxt = "";
      if (apiKey.startsWith("sk-")) {
        const r = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
          body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "system", content: sysPrompt }, { role: "user", content: prompt }] })
        });
        const d = await r.json();
        rTxt = d.choices[0].message.content;
      } else {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
        });
        const d = await r.json();
        rTxt = d.candidates[0].content.parts[0].text;
      }
      
      const match = rTxt.match(/\{[\s\S]*?\}/);
      if (match) {
        const dec = JSON.parse(match[0]);
        if (dec.type === "sim" && SIMS[dec.key]) {
          setActiveMedia({ type: "sim", key: SIMS[dec.key], caption: dec.caption });
        }
      }
    } catch (e) {}
  };

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (isMicActive) recognitionRef.current.stop();
    else recognitionRef.current.start();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden gap-4 text-white">
      <style jsx global>{`
        .glass-panel { background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05); }
        .scanline {
          width: 100%; height: 100px; z-index: 10; position: absolute; pointer-events: none;
          background: linear-gradient(0deg, rgba(0,0,0,0) 0%, rgba(6,182,212,0.15) 50%, rgba(0,0,0,0) 100%);
          animation: scanline 6s linear infinite;
        }
        @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(400px); } }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.3); border-radius: 4px; }
      `}</style>

      {/* Top Navigation */}
      <header className="flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                  <i data-lucide="brain-circuit" className="text-cyan-400 w-7 h-7"></i>
              </div>
              <div>
                  <h1 className="text-xl font-black tracking-tighter leading-none">NEURAL <span className="text-cyan-400">LABS</span></h1>
                  <p className="text-[10px] mono text-gray-500 uppercase mt-1 tracking-widest font-bold">Interactive Whiteboard Engine v6.0</p>
              </div>
          </div>
          
          <div className="flex gap-4 items-center">
              <div id="connection-status" className="glass-panel px-4 py-2 rounded-full flex items-center gap-3">
                  <div id="status-indicator" className={`w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] ${didStatus === 'Active' ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-red-500'}`}></div>
                  <span id="status-text" className="text-[10px] mono uppercase font-black text-gray-400 tracking-tighter">{statusText}</span>
              </div>
          </div>
      </header>

      <div className="flex-1 flex gap-6 min-h-0">
          {/* Left Sidebar: Tutor & Interaction */}
          <div className="w-80 flex flex-col gap-6 shrink-0">
              <div className="group relative rounded-3xl overflow-hidden glass-panel border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.05)] h-64">
                  <div className="scanline"></div>
                  
                  <video id="video-element" ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${didStatus === 'Active' ? 'block' : 'hidden'}`}></video>
                  
                  {didStatus !== 'Active' && (
                    <div id="video-placeholder" className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-slate-900 to-black">
                        <div className="w-20 h-20 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center mb-6 relative">
                            <i data-lucide="user" className="text-slate-500 w-10 h-10"></i>
                            <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping"></div>
                        </div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{didStatus}</h3>
                        <p className="text-[10px] text-slate-600 mono leading-relaxed uppercase">Biometric verification required</p>
                    </div>
                  )}
                  
                  <div className="absolute bottom-6 inset-x-6 flex gap-3 z-20">
                      <button id="mic-btn" onClick={toggleMic} className={`w-12 h-12 rounded-xl glass-panel flex items-center justify-center text-white hover:text-cyan-400 transition-all border border-white/5 hover:border-cyan-400/30 group/mic ${isMicActive ? 'bg-red-500/20 text-red-400 border-red-500/50' : ''}`}>
                          <i data-lucide="mic" className={`w-6 h-6 group-hover/mic:scale-110 transition-transform ${isMicActive ? 'animate-pulse' : ''}`}></i>
                      </button>
                      <button id="start-btn" onClick={handleStart} className="flex-1 h-12 bg-cyan-500 text-black font-black rounded-xl text-[11px] uppercase tracking-[0.15em] hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-[0.98]">
                          Initialize AI
                      </button>
                  </div>
              </div>

              {/* Resolution Log */}
              <div className="flex-1 glass-panel rounded-3xl p-5 flex flex-col overflow-hidden relative border border-white/5">
                  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                      <span className="text-[10px] font-black text-cyan-400 mono uppercase tracking-widest">Process Stream</span>
                      <i data-lucide="activity" className="w-3 h-3 text-cyan-400/50"></i>
                  </div>
                  <div id="chat-log" className="flex-1 overflow-y-auto space-y-4 text-[12px] pr-2 custom-scrollbar">
                      {messages.length === 0 && <div className="text-gray-500 italic opacity-50 text-[10px] mono uppercase">System ready. State: Idle</div>}
                      {messages.map((m, i) => (
                        <div key={i} className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <span className="text-[8px] uppercase tracking-widest text-slate-500 mono">{m.role === 'user' ? user?.name : 'System'}</span>
                          <div className={`p-3 rounded-2xl max-w-[90%] leading-relaxed ${m.role === 'user' ? 'bg-cyan-500/10 text-cyan-50 border border-cyan-500/20 rounded-tr-sm' : 'bg-white/5 text-slate-300 border border-white/5 rounded-tl-sm'}`}>
                            {m.content}
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                  </div>
                  
                  {isBusy && (
                    <div id="thinking" className="h-8 mt-4 flex items-center gap-3 bg-cyan-500/5 border border-cyan-500/10 rounded-lg px-3">
                        <div className="flex gap-1">
                            <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce"></span>
                            <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                        <span id="thinking-text" className="text-[9px] mono font-bold text-cyan-400 uppercase tracking-widest">Processing...</span>
                    </div>
                  )}
              </div>
          </div>

          {/* Main Content: Canvas Area */}
          <div className="flex-1 flex flex-col gap-6">
              <div className="flex items-center gap-3 shrink-0">
                  <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
                      <button onClick={() => setShowResource(false)} className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${!showResource ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'text-white/40 hover:text-white'}`}>Neural Whiteboard</button>
                      <button id="toggle-resource" onClick={() => setShowResource(true)} className={`px-6 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${showResource ? 'bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'text-white/40 hover:text-white'}`}>Resource Lab</button>
                  </div>
                  {!showResource && (
                    <div className="ml-auto flex gap-4">
                        <button id="clear-canvas" onClick={() => { const c = canvasRef.current; if (c) c.getContext('2d')?.clearRect(0,0,c.width,c.height); }} className="flex items-center gap-2 px-4 py-2 text-[10px] text-gray-500 hover:text-red-400 mono uppercase font-bold tracking-tighter transition-colors">
                            <i data-lucide="trash-2" className="w-3.5 h-3.5"></i>
                            Clear Board
                        </button>
                    </div>
                  )}
              </div>

              <div className="flex-1 canvas-container shadow-[0_0_50px_rgba(0,0,0,0.5)] relative bg-[#020617] rounded-3xl overflow-hidden glass-panel border border-cyan-500/20">
                  {!showResource ? (
                    <>
                      {isBusy && (
                        <div id="writing-status" className="writing-indicator mono flex items-center gap-3 absolute top-6 left-6 z-10 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                            <div className="relative w-2 h-2">
                                <span className="absolute inset-0 rounded-full bg-cyan-400 animate-ping"></span>
                                <span className="relative block w-2 h-2 rounded-full bg-cyan-400"></span>
                            </div>
                            <span className="tracking-[0.2em] text-[10px] text-cyan-400 font-bold">TEACHER IS WRITING...</span>
                        </div>
                      )}
                      <canvas id="whiteboard" ref={canvasRef} className="w-full h-full cursor-crosshair"
                        onMouseDown={(e) => {
                          const ctx = canvasRef.current?.getContext('2d');
                          if (!ctx) return;
                          ctx.beginPath();
                          ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                          canvasRef.current!.dataset.drawing = 'true';
                        }}
                        onMouseMove={(e) => {
                          if (canvasRef.current?.dataset.drawing !== 'true') return;
                          const ctx = canvasRef.current?.getContext('2d');
                          if (!ctx) return;
                          ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                          ctx.strokeStyle = '#22d3ee';
                          ctx.lineWidth = 3;
                          ctx.lineCap = 'round';
                          ctx.stroke();
                        }}
                        onMouseUp={() => { if (canvasRef.current) canvasRef.current.dataset.drawing = 'false'; }}
                        onMouseLeave={() => { if (canvasRef.current) canvasRef.current.dataset.drawing = 'false'; }}
                      ></canvas>
                    </>
                  ) : (
                    <div id="resource-content" className="w-full h-full flex flex-col">
                        <div id="resource-header" className="p-4 border-b border-purple-500/20 flex items-center gap-3 bg-purple-500/5">
                            <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                <i data-lucide="microscope" className="text-purple-400 w-5 h-5"></i>
                            </div>
                            <h3 id="resource-title" className="text-sm font-black uppercase tracking-widest text-purple-400">Knowledge Laboratory</h3>
                        </div>
                        <div className="flex-1 bg-black relative">
                            {activeMedia ? (
                                <iframe src={`https://phet.colorado.edu/sims/html/${activeMedia.key}/latest/${activeMedia.key}_en.html`} className="absolute inset-0 w-full h-full border-none" allowFullScreen></iframe>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-600 italic mono text-xs uppercase">No active simulation</div>
                            )}
                        </div>
                    </div>
                  )}
              </div>
          </div>
      </div>

      {/* UI Overlays */}
      {isInitializing && (
        <div id="loading-overlay" className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center transition-opacity duration-1000">
            <div className="relative w-32 h-32 mb-8">
                <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-full animate-pulse"></div>
                <div className="absolute inset-2 border border-cyan-400 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <i data-lucide="zap" className="text-cyan-400 w-10 h-10 fill-cyan-400/20"></i>
                </div>
            </div>
            <h2 className="text-sm font-black tracking-[0.5em] text-white uppercase mb-2">Mastery OS v6.0</h2>
            <p className="text-[10px] mono text-cyan-400/50 uppercase tracking-widest">Optimizing Interactive Engines...</p>
        </div>
      )}
    </div>
  );
}
