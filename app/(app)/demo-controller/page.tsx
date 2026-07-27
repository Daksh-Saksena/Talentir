"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";

interface PresetItem {
  name: string;
  type: "image" | "formula" | "sim" | "none";
  key: string;
  caption: string;
  url?: string;
  summary: string;
  todos: string[];
  topic: string;
}

const PRESETS: PresetItem[] = [
  {
    name: "1. Welcome & Greeting",
    type: "none",
    key: "welcome",
    caption: "Welcome to Accountancy Class!",
    summary: "Welcome! Today we will cover the basics of Double-Entry Bookkeeping and the Accounting Equation.",
    todos: ["Understand Assets, Liabilities & Equity", "Master the Accounting Equation"],
    topic: "Introduction to Accounting"
  },
  {
    name: "2. The Accounting Equation",
    type: "formula",
    key: "accounting_equation",
    caption: "Assets = Liabilities + Capital",
    summary: "The accounting equation states that a company's total assets are equal to the sum of its liabilities and its shareholders' equity.",
    todos: ["Observe how transactions affect the equation balance", "Practice equation problems"],
    topic: "Accounting Equation"
  },
  {
    name: "3. Double Entry & Golden Rules",
    type: "formula",
    key: "golden_rules",
    caption: "Debit the Receiver, Credit the Giver",
    summary: "The Golden Rules of Accounting categorize accounts into Real, Personal, and Nominal, defining debit and credit rules for each.",
    todos: ["Memorize the 3 Golden Rules", "Identify account types for transactions"],
    topic: "Golden Rules of Accountancy"
  },
  {
    name: "4. Asset Purchase Example (Image)",
    type: "image",
    key: "asset_purchase",
    caption: "Business Asset Ledger & Balance Sheet Impact",
    url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&auto=format&fit=crop",
    summary: "Purchasing furniture with cash is an asset exchange transaction. Cash decreases, and Furniture increases, keeping total assets unchanged.",
    todos: ["Calculate the net effect of furniture purchase", "Post transaction to T-accounts"],
    topic: "Journalizing Transactions"
  },
  {
    name: "5. T-Account Ledger Structure",
    type: "formula",
    key: "ledger",
    caption: "Debit (Dr.) Left vs Credit (Cr.) Right",
    summary: "A ledger account is structured as a T-chart with Debits recorded on the left and Credits recorded on the right.",
    todos: ["Draw a blank T-account ledger", "Practice posting transaction entries"],
    topic: "Ledger Accounts"
  },
  {
    name: "6. Sim: Friction & Forces (PhET)",
    type: "sim",
    key: "friction",
    caption: "PhET Interactive Sim: Observing friction and forces",
    summary: "Let's use this interactive simulation to visualize opposing forces. Friction acts opposite to the direction of motion, similar to how depreciation balances asset appreciation.",
    todos: ["Experiment with force levels", "Observe friction coefficient"],
    topic: "Applied Physical Analogy"
  }
];

export default function DemoControllerPage() {
  useAuth();

  // Controlled states
  const [topic, setTopic] = useState("Ready to Start");
  const [summary, setSummary] = useState("Listening for lecture points...");
  const [todos, setTodos] = useState<string[]>([]);
  const [activeMedia, setActiveMedia] = useState<{type: "sim" | "image" | "video" | "formula", key: string, caption: string, url?: string} | null>(null);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showTextbook, setShowTextbook] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [calmMode, setCalmMode] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [attendanceIndex, setAttendanceIndex] = useState(-1);

  // Controller UI states

  // Function to automatically search for an image based on a query and push it as active media
  const autoSearchDefaultImage = async (query: string) => {
    if (!query) return;
    try {
      const res = await fetch(`https://google.serper.dev/images`, {
        method: "POST",
        headers: {
          "X-API-KEY": process.env.NEXT_PUBLIC_SERPER_API_KEY || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: `${query} accounting illustration`,
          safe: "active",
        }),
      });
      const data = await res.json();
      if (data.images && data.images.length > 0) {
        const url = data.images[0].imageUrl;
        sync({
          activeMedia: {
            type: "image",
            key: "auto_image_" + Date.now(),
            caption: `Auto‑search result for ${query}`,
            url,
          },
        });
      }
    } catch (e) {
      console.error("Auto image search failed", e);
    }
  };

  const [customImageUrl, setCustomImageUrl] = useState("");

  const [customImageCaption, setCustomImageCaption] = useState("");
  const [newTodoText, setNewTodoText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const channelRef = useRef<BroadcastChannel | null>(null);

  // Ref to hold the latest controller state to prevent stale closure bugs in the BroadcastChannel message handler
  const latestStateRef = useRef({
    topic,
    summary,
    todos,
    activeMedia,
    showWhiteboard,
    showTextbook,
    isListening,
    calmMode,
    showAttendance,
    attendanceIndex
  });

  useEffect(() => {
    latestStateRef.current = {
      topic,
      summary,
      todos,
      activeMedia,
      showWhiteboard,
      showTextbook,
      isListening,
      calmMode,
      showAttendance,
      attendanceIndex
    };
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const channel = new BroadcastChannel("live-class-demo-sync");
      channelRef.current = channel;

      const handleMessage = (event: MessageEvent) => {
        const { type, data } = event.data;
        if (type === "current_state" || type === "sync_state") {
          if (data.topic !== undefined) setTopic(data.topic);
          if (data.summary !== undefined) setSummary(data.summary);
          if (data.todos !== undefined) setTodos(data.todos);
          if (data.activeMedia !== undefined) setActiveMedia(data.activeMedia);
          if (data.showWhiteboard !== undefined) setShowWhiteboard(data.showWhiteboard);
          if (data.showTextbook !== undefined) setShowTextbook(data.showTextbook);
          if (data.isListening !== undefined) setIsListening(data.isListening);
          if (data.calmMode !== undefined) setCalmMode(data.calmMode);
          if (data.showAttendance !== undefined) setShowAttendance(data.showAttendance);
          if (data.attendanceIndex !== undefined) setAttendanceIndex(data.attendanceIndex);
        } else if (type === "request_state") {
          // Respond to the newly mounted class view with the current controller state
          channel.postMessage({
            type: "sync_state",
            data: latestStateRef.current
          });
        }
      };

      channel.addEventListener("message", handleMessage);
      channel.postMessage({ type: "request_state" });

      return () => {
        channel.removeEventListener("message", handleMessage);
        channel.close();
      };
    }
  }, []);

  const sync = (changes: any) => {
    // Optimistically update controller state
    if (changes.topic !== undefined) setTopic(changes.topic);
    if (changes.summary !== undefined) setSummary(changes.summary);
    if (changes.todos !== undefined) setTodos(changes.todos);
    if (changes.activeMedia !== undefined) setActiveMedia(changes.activeMedia);
    if (changes.showWhiteboard !== undefined) setShowWhiteboard(changes.showWhiteboard);
    if (changes.showTextbook !== undefined) setShowTextbook(changes.showTextbook);
    if (changes.isListening !== undefined) setIsListening(changes.isListening);
    if (changes.calmMode !== undefined) setCalmMode(changes.calmMode);
    if (changes.showAttendance !== undefined) setShowAttendance(changes.showAttendance);
    if (changes.attendanceIndex !== undefined) setAttendanceIndex(changes.attendanceIndex);

    // Broadcast to the live class page/iframe
    channelRef.current?.postMessage({
      type: "sync_state",
      data: changes
    });
  };

  const loadPreset = (p: PresetItem) => {
    sync({
      topic: p.topic,
      summary: p.summary,
      todos: p.todos,
      activeMedia: p.type === "none" ? null : {
        type: p.type,
        key: p.key,
        caption: p.caption,
        url: p.url
      },
      showWhiteboard: false,
      showTextbook: false
    });
  };

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return;
    const updated = [...todos, newTodoText.trim()];
    sync({ todos: updated });
    setNewTodoText("");
  };

  const handleRemoveTodo = (index: number) => {
    const updated = todos.filter((_, i) => i !== index);
    sync({ todos: updated });
  };

  const handlePushCustomImage = () => {
    if (!customImageUrl.trim()) return;
    sync({
      activeMedia: {
        type: "image",
        key: "custom_image_" + Date.now(),
        caption: customImageCaption.trim() || "Custom Image Visual",
        url: customImageUrl.trim()
      }
    });
  };

  const handleTriggerGoogleSearch = async () => {
    if (!searchQuery.trim()) return;
    // Set status to searching
    sync({ summary: `Searching visuals for: "${searchQuery}"...` });
    try {
      // Trigger search query using custom query
      const res = await fetch(`https://google.serper.dev/images`, {
        method: "POST",
        headers: {
          "X-API-KEY": process.env.NEXT_PUBLIC_SERPER_API_KEY || "",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          q: `${searchQuery} -worksheet -homework -question -exam`,
          safe: "active"
        })
      });
      const data = await res.json();
      if (data.images && data.images.length > 0) {
        const url = data.images[0].imageUrl;
        sync({
          activeMedia: {
            type: "image",
            key: "search_image_" + Date.now(),
            caption: `Search Result: ${searchQuery}`,
            url
          },
          summary: `Successfully retrieved visual matching: "${searchQuery}".`
        });
      } else {
        sync({ summary: `No visual matching "${searchQuery}" was found.` });
      }
    } catch (e) {
      sync({ summary: `Error searching visual: ${e instanceof Error ? e.message : 'Unknown error'}` });
    }
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-white overflow-hidden font-sans">
      {/* LEFT PANEL: 70% scaled classroom preview */}
      <div className="w-[70%] h-full flex flex-col border-r border-zinc-800 bg-[#020204]">
        {/* Preview header */}
        <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Classroom Live Preview (70% Scale)</h2>
          </div>
          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700">PORT 8000 Proxy View</span>
        </div>

        {/* Scaled Iframe Wrapper */}
        <div className="flex-1 relative overflow-hidden bg-black p-4 flex items-center justify-center">
          <div 
            className="w-full h-full border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative bg-black"
            style={{ position: 'relative' }}
          >
            {/* The scaled iframe inside */}
            <iframe 
              src="/live-class" 
              className="absolute border-none bg-black"
              style={{
                width: "142.85%", // 100 / 0.7
                height: "142.85%", // 100 / 0.7
                transform: "scale(0.7)",
                transformOrigin: "top left",
                pointerEvents: "auto"
              }}
            />
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: 30% width controller panel */}
      <aside className="w-[30%] h-full bg-zinc-950 border-l border-zinc-800 flex flex-col overflow-y-auto shrink-0">
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/40 shrink-0">
          <h1 className="text-sm font-black uppercase tracking-[0.3em] text-indigo-400">IP Demo Controller</h1>
          <p className="text-[11px] text-zinc-400 mt-1">Take control of Accountancy Class presentations manually</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Presets */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-500">📖 Accountancy Demo Presets</h3>
            <div className="grid grid-cols-1 gap-1.5">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => loadPreset(p)}
                  className="w-full text-left px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold hover:bg-zinc-800/60 transition truncate cursor-pointer"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Toggles */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">⚡ Overlays & Features</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => sync({ showWhiteboard: !showWhiteboard, showTextbook: false })}
                className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  showWhiteboard 
                    ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                🎨 {showWhiteboard ? "Close Board" : "Open Board"}
              </button>
              <button
                onClick={() => sync({ showTextbook: !showTextbook, showWhiteboard: false })}
                className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  showTextbook 
                    ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                📚 {showTextbook ? "Close Textbook" : "Open Textbook"}
              </button>
              <button
                onClick={() => sync({ isListening: !isListening })}
                className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  isListening 
                    ? "bg-red-500/20 border-red-500/50 text-red-400 animate-pulse" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                🎙️ {isListening ? "Listening ON" : "Listening OFF"}
              </button>
              <button
                onClick={() => sync({ calmMode: !calmMode })}
                className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  calmMode 
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                ✨ {calmMode ? "Calm Mode ON" : "Calm Mode OFF"}
              </button>
            </div>
          </div>

          {/* Attendance Check Roster */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">👥 Attendance Roster</h3>
            <div className="flex gap-2">
              <button
                onClick={() => sync({ showAttendance: true, attendanceIndex: 0 })}
                className="flex-1 py-1.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl text-xs font-bold hover:bg-green-500/25 transition cursor-pointer"
              >
                ▶ Trigger Attendance Loop
              </button>
              <button
                onClick={() => sync({ showAttendance: false, attendanceIndex: -1 })}
                className="py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Topic & Summary Input */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">📝 Lecture Override</h3>
            
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-black">Active Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => sync({ topic: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-black">Class Summary</label>
              <textarea
                value={summary}
                onChange={(e) => sync({ summary: e.target.value })}
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* ToDo List Builder */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">✅ ToDo List Builder</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
                placeholder="Add new task..."
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700"
              />
              <button
                onClick={handleAddTodo}
                className="bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                + Add
              </button>
            </div>
            <div className="space-y-1.5">
              {todos.map((todo, idx) => (
                <div key={idx} className="flex justify-between items-center px-3 py-1.5 bg-zinc-900/60 rounded-lg border border-zinc-850">
                  <span className="text-xs text-zinc-300 truncate max-w-[200px]">{todo}</span>
                  <button
                    onClick={() => handleRemoveTodo(idx)}
                    className="text-red-500 hover:text-red-400 text-xs px-1 hover:bg-zinc-800 rounded cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {todos.length === 0 && (
                <p className="text-[10px] text-zinc-650 italic">No tasks listed.</p>
              )}
            </div>
          </div>

          {/* Media Custom Push */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">🖼️ Custom Visual Push</h3>

            {/* Type selector */}
            <div className="grid grid-cols-4 gap-1 bg-zinc-900 p-1 rounded-xl">
              {["none", "image", "formula", "sim"].map((t) => (
                <button
                  key={t}
                  onClick={() => sync({
                    activeMedia: t === "none" ? null : {
                      type: t as any,
                      key: t === "sim" ? "forces" : t === "formula" ? "accounting_equation" : "custom",
                      caption: `Custom ${t}`,
                      url: t === "image" ? customImageUrl : undefined
                    }
                  })}
                  className={`py-1 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${
                    (t === "none" && !activeMedia) || (activeMedia?.type === t)
                      ? "bg-zinc-800 text-white shadow"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Image custom inputs */}
            {(activeMedia?.type === "image" || !activeMedia) && (
              <div className="space-y-2 border-t border-zinc-850 pt-2.5">
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 uppercase font-black">Image Search Query</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder='e.g., "T-account ledger format"'
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700"
                    />
                    <button
                      onClick={handleTriggerGoogleSearch}
                      className="bg-zinc-800 hover:bg-zinc-750 px-3 py-1.5 rounded-xl text-xs font-bold border border-zinc-700 transition cursor-pointer"
                    >
                      Search
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 uppercase font-black">Direct Image URL</label>
                  <input
                    type="text"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-500 uppercase font-black">Image Caption</label>
                  <input
                    type="text"
                    value={customImageCaption}
                    onChange={(e) => setCustomImageCaption(e.target.value)}
                    placeholder="e.g. Balance Sheet Illustration"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <button
                  onClick={handlePushCustomImage}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  Push Custom Image
                </button>
              </div>
            )}

            {/* Formula Selector */}
            {activeMedia?.type === "formula" && (
              <div className="space-y-1.5 border-t border-zinc-850 pt-2.5">
                <label className="text-[9px] text-zinc-500 uppercase font-black">Active Accounting Formula</label>
                <select
                  value={activeMedia.key}
                  onChange={(e) => sync({
                    activeMedia: {
                      type: "formula",
                      key: e.target.value,
                      caption: e.target.options[e.target.selectedIndex].text
                    }
                  })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-700"
                >
                  <option value="accounting_equation">Accounting Equation</option>
                  <option value="golden_rules">Golden Rules of Accountancy</option>
                  <option value="capital">Capital Formula</option>
                  <option value="drawings">Drawings Treatment</option>
                  <option value="depreciation">Depreciation Treatment</option>
                  <option value="balance_sheet">Balance Sheet Structure</option>
                  <option value="ledger">Ledger (T-Account) Format</option>
                </select>
              </div>
            )}

            {/* Simulation Selector */}
            {activeMedia?.type === "sim" && (
              <div className="space-y-1.5 border-t border-zinc-850 pt-2.5">
                <label className="text-[9px] text-zinc-500 uppercase font-black">Active PhET Simulation</label>
                <select
                  value={activeMedia.key}
                  onChange={(e) => sync({
                    activeMedia: {
                      type: "sim",
                      key: e.target.value,
                      caption: e.target.options[e.target.selectedIndex].text
                    }
                  })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-700"
                >
                  <option value="forces">Forces and Motion Basics</option>
                  <option value="friction">Friction (Heat & Force)</option>
                  <option value="projectile-motion">Projectile Motion</option>
                  <option value="energy">Energy Skate Park Basics</option>
                  <option value="gravity">Gravity Force Lab</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
