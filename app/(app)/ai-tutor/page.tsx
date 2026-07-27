"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import simulations from "@/data/simulations";
import type { Simulation } from "@/types/simulation";
import Script from "next/script";


interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  action?: {
    type: "sim" | "test" | "whiteboard" | "calculator" | "mindmap";
    id: string;
    label: string;
    icon: string;
    params?: Record<string, string | number>;
  };
}

const suggestedPrompts = [
  { label: "⚛️ Newton's 2nd Law", prompt: "Explain Newton's second law with a simulation." },
  { label: "🧪 SN1 vs SN2 Mind Map", prompt: "Show me a mind map of organic chemistry reactions." },
  { label: "📊 Graph y = sin(x)", prompt: "Open the graphing calculator and plot y = sin(x)." },
  { label: "🔋 Ohm's Law Control", prompt: "Open Ohm's Law simulation and increase the voltage." },
];

// Interactive Mind Map definitions
interface MindMapNode {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  details: string;
}

interface MindMapLink {
  source: string;
  target: string;
}

const mindMaps: Record<string, { nodes: MindMapNode[]; links: MindMapLink[] }> = {
  physics: {
    nodes: [
      { id: "1", label: "Classical Mechanics", x: 250, y: 180, color: "#6366f1", details: "Study of forces and motion of macroscopic objects." },
      { id: "2", label: "Newton's Laws", x: 100, y: 100, color: "#3b82f6", details: "Three laws forming the foundation of dynamics." },
      { id: "3", label: "Forces", x: 400, y: 100, color: "#ec4899", details: "Vector quantities causing acceleration (Gravity, Friction)." },
      { id: "4", label: "Energy", x: 250, y: 320, color: "#10b981", details: "Conservation principles (Kinetic & Potential energy)." },
      { id: "5", label: "F = ma", x: 60, y: 220, color: "#3b82f6", details: "Force equals mass times acceleration." },
    ],
    links: [
      { source: "1", target: "2" },
      { source: "1", target: "3" },
      { source: "1", target: "4" },
      { source: "2", target: "5" },
    ],
  },
  chemistry: {
    nodes: [
      { id: "1", label: "Organic Reactions", x: 250, y: 180, color: "#10b981", details: "Chemical reactions involving carbon-based compounds." },
      { id: "2", label: "Nucleophilic Substitution", x: 100, y: 100, color: "#3b82f6", details: "A nucleophile replaces a leaving group." },
      { id: "3", label: "Elimination", x: 400, y: 100, color: "#f59e0b", details: "Removal of substituents to form double/triple bonds." },
      { id: "4", label: "SN1 Mechanism", x: 60, y: 220, color: "#6366f1", details: "Two-step reaction via carbocation intermediate." },
      { id: "5", label: "SN2 Mechanism", x: 160, y: 250, color: "#ec4899", details: "One-step concerted reaction with backside attack." },
    ],
    links: [
      { source: "1", target: "2" },
      { source: "1", target: "3" },
      { source: "2", target: "4" },
      { source: "2", target: "5" },
    ],
  },
  math: {
    nodes: [
      { id: "1", label: "Calculus", x: 250, y: 180, color: "#f59e0b", details: "Mathematical study of continuous change." },
      { id: "2", label: "Differential", x: 100, y: 100, color: "#3b82f6", details: "Relates to rates of change, derivatives, slopes." },
      { id: "3", label: "Integral", x: 400, y: 100, color: "#10b981", details: "Relates to accumulation, area under curves." },
      { id: "4", label: "ILATE Rule", x: 420, y: 240, color: "#ec4899", details: "Order of priority for Integration by Parts." },
    ],
    links: [
      { source: "1", target: "2" },
      { source: "1", target: "3" },
      { source: "3", target: "4" },
    ],
  },
};

export default function AITutorPage() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";

  // Sidebar canvas states
  const [paneOpen, setPaneOpen] = useState(false);
  const [activePane, setActivePane] = useState<"sim" | "test" | "whiteboard" | "calculator" | "mindmap" | null>(null);
  const [activeSim, setActiveSim] = useState<Simulation | null>(null);
  const [activeMapTopic, setActiveMapTopic] = useState<string>("physics");

  // Desmos state and references
  const [desmosLoaded, setDesmosLoaded] = useState(false);
  const [calculatorEquation, setCalculatorEquation] = useState<string | null>(null);
  const calculatorContainerRef = useRef<HTMLDivElement>(null);
  const calculatorRef = useRef<any>(null);

  useEffect(() => {
    if (activePane === "calculator" && desmosLoaded && calculatorContainerRef.current) {
      if (!calculatorRef.current) {
        calculatorContainerRef.current.innerHTML = "";
        calculatorRef.current = (window as any).Desmos.GraphingCalculator(calculatorContainerRef.current, {
          keypad: true,
          expressions: true,
          settingsMenu: true,
        });
      }
      if (calculatorEquation && calculatorRef.current) {
        calculatorRef.current.setExpression({
          id: 'ai-expression',
          latex: calculatorEquation
        });
      }
    }
  }, [activePane, desmosLoaded, calculatorEquation]);

  // Simulated Simulation controls
  const [simParams, setSimParams] = useState<Record<string, number>>({
    voltage: 4.5,
    resistance: 500,
    mass: 1.0,
    friction: 0.2,
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m1",
      role: "assistant",
      text: `Hello ${user?.name || "there"}! I'm your AI Academic Assistant. I can explain complex science and math concepts, solve equations, or spin up interactive simulations on the side for you. Ask me anything!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinking]);

  const launchSimulation = (simId: string, params?: Record<string, string | number>) => {
    const sim = simulations.find((s) => s.id === simId);
    if (sim) {
      setActiveSim(sim);
      setActivePane("sim");
      setPaneOpen(true);
      if (params) {
        const numParams: Record<string, number> = {};
        for (const [k, v] of Object.entries(params)) {
          const parsed = typeof v === "number" ? v : parseFloat(v);
          if (!isNaN(parsed)) {
            numParams[k] = parsed;
          }
        }
        setSimParams((prev) => ({ ...prev, ...numParams }));
      }
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || thinking) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: "user",
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setThinking(true);

    try {
      // Gather simulations metadata for context
      const simplifiedSims = simulations.map(s => ({
        id: s.id,
        title: s.title,
        subject: s.subject,
        tags: s.tags
      }));

      // API Key check from env
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || "";

      const systemPrompt = `You are a highly intelligent, encouraging, and clear AI Academic Tutor.
You explain concepts step-by-step and have the capability to launch learning tools/simulations in a side canvas on the user's screen.
If the student's question is about a concept that can be visualized with one of our registered simulations, select that simulation and provide a detailed explanation.

Registered Simulations (only load matching id):
${JSON.stringify(simplifiedSims)}

Other Interactive Canvas Tools:
- Desmos Graphing Calculator: type="calculator", id="desmos", label="Open Graphing Calculator", icon="📊" (use this if they ask for plotting, graphing, mathematical functions like sin/cos curves, quadratic equations, etc. You MUST provide the LaTeX math expression/equation to plot in params.equation, e.g. {"equation": "y = \\\\sin(x)"} or {"equation": "y = x^2"})
- Concept Mind Maps: type="mindmap", id="physics" | "chemistry" | "math", label="View Mind Map", icon="🧠"
- Practice tests/evaluation: type="test", id="tests", label="View Practice Tests", icon="✍️"
${!isStudent ? '- Whiteboard: type="whiteboard", id="wb", label="View Whiteboard", icon="🎨"' : ''}

You MUST return a JSON object with:
{
  "replyText": "A detailed, encouraging response explaining the concept.",
  "action": {
    "type": "sim" | "test" | "calculator" | "mindmap" | "whiteboard",
    "id": "the matched simulation id or tool id",
    "label": "Action button text",
    "icon": "badge emoji",
    "params": { ... } // optional parameters, e.g. for Ohm's Law: {"voltage": 9.0}, for Desmos Calculator: {"equation": "y = \\\\sin(x)"}
  } // (omit action property if no match is relevant)
}`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query }
          ]
        })
      });

      if (!response.ok) {
        throw new Error("API call failed");
      }

      const data = await response.json();
      const resJson = JSON.parse(data.choices[0].message.content);

      const replyText = resJson.replyText;
      const action = resJson.action;

      if (action) {
        if (action.type === "sim") {
          launchSimulation(action.id, action.params);
        } else if (action.type === "test") {
          setActivePane("test");
          setPaneOpen(true);
        } else if (action.type === "whiteboard" && !isStudent) {
          setActivePane("whiteboard");
          setPaneOpen(true);
        } else if (action.type === "mindmap") {
          setActiveMapTopic(action.id);
          setActivePane("mindmap");
          setPaneOpen(true);
        } else if (action.type === "calculator") {
          const eq = String(action.params?.equation || action.params?.expression || "y=\\sin(x)");
          setCalculatorEquation(eq);
          setActivePane("calculator");
          setPaneOpen(true);
        }
      }

      const aiMsg: Message = {
        id: `a_${Date.now()}`,
        role: "assistant",
        text: replyText,
        action
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      // Hardcoded fallback logic in case of API Key issue
      let replyText = "";
      let action: Message["action"] | undefined = undefined;
      const lower = query.toLowerCase();

      if (lower.includes("graph") || lower.includes("plot") || lower.includes("calculator") || lower.includes("desmos")) {
        replyText = "I have opened the Desmos Graphing Calculator with the function plotted for you. You can examine its properties or modify it directly on the screen.";
        let eq = "y=\\sin(x)";
        if (lower.includes("cos")) {
          eq = "y=\\cos(x)";
        } else if (lower.includes("tan")) {
          eq = "y=\\tan(x)";
        } else if (lower.includes("x^2") || lower.includes("quadratic")) {
          eq = "y=x^2";
        }
        action = { 
          type: "calculator", 
          id: "desmos", 
          label: "Open Graphing Calculator", 
          icon: "📊",
          params: { equation: eq }
        };
        setCalculatorEquation(eq);
        setActivePane("calculator");
        setPaneOpen(true);
      } else if (lower.includes("sin") || lower.includes("sine") || lower.includes("cos") || lower.includes("tan") || lower.includes("trig")) {
        replyText = "The sine function sin(x) represents the periodic y-coordinate on a unit circle. It starts at 0, increases to 1 at 90 degrees, falls to 0 at 180, drops to -1 at 270, and returns to 0 at 360 degrees. Let's open the Trig Tour simulation so you can visualize this periodic wave!";
        const trigSim = simulations.find(s => s.id === "trig-tour");
        if (trigSim) {
          setActiveSim(trigSim);
          setActivePane("sim");
          setPaneOpen(true);
          action = { type: "sim", id: trigSim.id, label: "View Trig Tour Simulation", icon: "⚛️" };
        }
      } else if (lower.includes("snell") || lower.includes("refraction") || lower.includes("bend")) {
        replyText = "Snell's Law states that the ratio of the sines of the angles of incidence and refraction is equivalent to the ratio of indices of refraction: n1*sin(θ1) = n2*sin(θ2). It governs how light bends when crossing mediums! I've loaded the Bending Light lab on the side.";
        const bendSim = simulations.find(s => s.id === "bending-light");
        if (bendSim) {
          setActiveSim(bendSim);
          setActivePane("sim");
          setPaneOpen(true);
          action = { type: "sim", id: bendSim.id, label: "Explore Bending Light", icon: "⚛️" };
        }
      } else if (lower.includes("gravity") || lower.includes("orbit")) {
        replyText = "Gravity is an attractive force: F = G*(m1*m2)/r². More mass means more pull, while distance reduces it. I've launched the Gravity orbits sandbox on the side canvas!";
        const gravSim = simulations.find(s => s.id === "gravity-and-orbits");
        if (gravSim) {
          setActiveSim(gravSim);
          setActivePane("sim");
          setPaneOpen(true);
          action = { type: "sim", id: gravSim.id, label: "Explore Gravity Lab", icon: "⚛️" };
        }
      } else {
        replyText = `That's a very interesting concept regarding "${query}". Let's discuss! We can also launch interactive simulations like "forces and motion" or a "mind map" to help us visualize.`;
      }

      const aiMsg: Message = {
        id: `a_${Date.now()}`,
        role: "assistant",
        text: replyText,
        action
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setThinking(false);
    }
  };

  // State for active node details clicked on mindmap
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<string | null>(null);

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-6 relative overflow-hidden animate-fade-in -mt-2">
      {/* ── LEFT PANE: Dynamic Side Canvas (55% width) ── */}
      {paneOpen && (
        <div className="flex-[6_6_0%] rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-950/40 overflow-hidden flex flex-col shadow-sm transition-all duration-300 animate-slide-up">
          {/* Canvas header */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between">
            <div>
              {activePane === "sim" && activeSim && (
                <>
                  <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">{activeSim.subject} Simulation</span>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white leading-none mt-0.5">{activeSim.title}</h3>
                </>
              )}
              {activePane === "test" && (
                <h3 className="text-xs font-bold text-slate-800 dark:text-white">Practice Lab Evaluation</h3>
              )}
              {activePane === "whiteboard" && (
                <h3 className="text-xs font-bold text-slate-800 dark:text-white">Concept Sketchboard</h3>
              )}
              {activePane === "calculator" && (
                <h3 className="text-xs font-bold text-slate-800 dark:text-white">Desmos Graphing Calculator</h3>
              )}
              {activePane === "mindmap" && (
                <h3 className="text-xs font-bold text-slate-800 dark:text-white">Interactive Mind Map: {activeMapTopic.toUpperCase()}</h3>
              )}
            </div>
            <button
              onClick={() => {
                setPaneOpen(false);
                setActivePane(null);
                setActiveSim(null);
              }}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
              title="Close side workspace"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Canvas content viewports */}
          <div className="flex-1 bg-slate-50 dark:bg-black relative overflow-hidden flex flex-col">
            {activePane === "sim" && activeSim && (
              <div className="w-full h-full flex flex-col">
                <iframe
                  src={activeSim.url}
                  title={activeSim.title}
                  width="100%"
                  className="flex-1 border-0 bg-black"
                  allow="fullscreen"
                />
                {/* AI Interactive Simulation Controls Panel Overlay */}
                <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">AI Control Panel</span>
                  </div>
                  {activeSim.id === "ohms-law" && (
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Voltage:</span>
                        <input 
                          type="range" min="1.5" max="9.0" step="1.5" 
                          value={simParams.voltage} 
                          onChange={(e) => setSimParams({ ...simParams, voltage: parseFloat(e.target.value) })}
                          className="w-20"
                        />
                        <span className="font-bold text-slate-900 dark:text-white">{simParams.voltage}V</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Resistance:</span>
                        <input 
                          type="range" min="100" max="1000" step="100" 
                          value={simParams.resistance} 
                          onChange={(e) => setSimParams({ ...simParams, resistance: parseInt(e.target.value) })}
                          className="w-20"
                        />
                        <span className="font-bold text-slate-900 dark:text-white">{simParams.resistance}Ω</span>
                      </div>
                    </div>
                  )}
                  {activeSim.id === "forces-and-motion-basics" && (
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Applied Force:</span>
                        <input 
                          type="range" min="50" max="500" step="50" 
                          value={simParams.mass * 200} 
                          className="w-24"
                          disabled
                        />
                        <span className="font-bold text-slate-900 dark:text-white">{simParams.mass * 200} N</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div 
              style={{ display: activePane === "calculator" ? "block" : "none" }}
              className="w-full h-full bg-white text-black"
              ref={calculatorContainerRef}
              id="desmos-calculator-container"
            />

            {activePane === "test" && (
              <iframe
                src="/tests"
                title="Practice Tests"
                width="100%"
                height="100%"
                className="w-full h-full border-0 bg-slate-50 dark:bg-slate-950"
              />
            )}

            {activePane === "whiteboard" && !isStudent && (
              <iframe
                src="/live-class/whiteboard"
                title="Whiteboard"
                width="100%"
                height="100%"
                className="w-full h-full border-0 bg-slate-50 dark:bg-slate-950"
              />
            )}

            {/* Mind Map Interactive SVG */}
            {activePane === "mindmap" && mindMaps[activeMapTopic] && (
              <div className="w-full h-full p-4 flex flex-col justify-between">
                <div className="relative flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner">
                  <svg className="w-full h-full">
                    {/* Render Links */}
                    {mindMaps[activeMapTopic].links.map((link, index) => {
                      const srcNode = mindMaps[activeMapTopic].nodes.find(n => n.id === link.source);
                      const tgtNode = mindMaps[activeMapTopic].nodes.find(n => n.id === link.target);
                      if (!srcNode || !tgtNode) return null;
                      return (
                        <line
                          key={index}
                          x1={srcNode.x}
                          y1={srcNode.y}
                          x2={tgtNode.x}
                          y2={tgtNode.y}
                          stroke="#cbd5e1"
                          strokeWidth="2.5"
                          className="dark:stroke-slate-800"
                        />
                      );
                    })}

                    {/* Render Nodes */}
                    {mindMaps[activeMapTopic].nodes.map((node) => (
                      <g 
                        key={node.id} 
                        transform={`translate(${node.x},${node.y})`}
                        className="cursor-pointer group"
                        onClick={() => setSelectedNodeDetails(node.details)}
                      >
                        <circle
                          r="32"
                          fill={node.color}
                          className="opacity-20 group-hover:opacity-30 transition"
                        />
                        <circle
                          r="8"
                          fill={node.color}
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        <text
                          y="42"
                          textAnchor="middle"
                          className="text-[11px] font-bold fill-slate-700 dark:fill-slate-300"
                        >
                          {node.label}
                        </text>
                      </g>
                    ))}
                  </svg>

                  {/* SVG overlay guidance */}
                  <div className="absolute top-2 left-2 text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">
                    Click nodes to inspect details
                  </div>
                </div>

                {/* Node details log */}
                <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="font-bold text-slate-500 dark:text-slate-400 block mb-1">NODE EXPLANATION:</span>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                    {selectedNodeDetails || "Select any mind map concept bubble above to view immediate learning logs."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── RIGHT/MAIN PANE: AI Chat Window ── */}
      <div className={`flex flex-col h-full min-w-0 transition-all duration-300 ${paneOpen ? "flex-[4_4_0%]" : "max-w-3xl mx-auto flex-1"}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60 pb-3.5 shrink-0">
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white">AI Learning Assistant</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Ask anything, or request to load any simulation.
            </p>
          </div>
          <button
            onClick={() => {
              setMessages([{ id: `m_${Date.now()}`, role: "assistant", text: "How can I assist your study session next?" }]);
              setPaneOpen(false);
              setActivePane(null);
            }}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition"
          >
            Clear Chat
          </button>
        </div>

        {/* Suggestion prompt chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 shrink-0 scrollbar-none">
          {suggestedPrompts.map((sp) => (
            <button
              key={sp.label}
              onClick={() => handleSend(sp.prompt)}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60 hover:border-indigo-500/40 text-[10px] text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 shadow-sm transition shrink-0"
            >
              {sp.label}
            </button>
          ))}
        </div>

        {/* Messaging area */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-950/40 p-4 space-y-3.5 shadow-sm">
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm">
                  AI
                </div>
              )}
              <div className="max-w-[85%] space-y-1.5">
                <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/10"
                    : "bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-800/60 rounded-bl-none"
                }`}>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>

                {/* Gemini-like canvas launch buttons */}
                {m.action && (
                  <button
                    onClick={() => {
                      if (m.action?.type === "sim") {
                        launchSimulation(m.action.id, m.action.params);
                      } else if (m.action?.type === "test") {
                        setActivePane("test");
                        setPaneOpen(true);
                      } else if (m.action?.type === "whiteboard") {
                        setActivePane("whiteboard");
                        setPaneOpen(true);
                      } else if (m.action?.type === "mindmap") {
                        setActiveMapTopic(m.action.id);
                        setActivePane("mindmap");
                        setPaneOpen(true);
                      } else if (m.action?.type === "calculator") {
                        const eq = String(m.action.params?.equation || m.action.params?.expression || "y=\\sin(x)");
                        setCalculatorEquation(eq);
                        setActivePane("calculator");
                        setPaneOpen(true);
                      }
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/25 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 text-[10px] font-semibold transition animate-fade-in"
                  >
                    <span>{m.action.icon}</span>
                    <span>{m.action.label}</span>
                    <span className="text-[9px] opacity-60">⚡ Open Side Canvas</span>
                  </button>
                )}
              </div>
              {m.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-white text-[10px] font-bold shrink-0">
                  {user?.name?.charAt(0) || "U"}
                </div>
              )}
            </div>
          ))}

          {thinking && (
            <div className="flex gap-2.5 items-center">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 animate-pulse">
                AI
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/60 px-3 py-2 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                <span>Writing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="pt-3 flex gap-2 shrink-0">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask AI tutor anything..."
            className="flex-1 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500/50 shadow-sm transition"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || thinking}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs transition shadow-lg shadow-indigo-500/20 flex items-center gap-1.5 shrink-0"
          >
            <span>Send</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
      <Script
        src="https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6"
        onLoad={() => setDesmosLoaded(true)}
      />
    </div>
  );
}
