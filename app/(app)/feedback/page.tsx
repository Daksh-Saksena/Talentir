"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { getFeedback, addFeedback, getUsers } from "@/lib/store";
import type { FeedbackEntry, User } from "@/types/user";

export default function FeedbackPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<FeedbackEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);

  useEffect(() => { 
    setItems(getFeedback()); 
    setUsers(getUsers());
  }, []);

  // Filter possible recipients based on current user's role
  const possibleRecipients = users.filter(u => {
    if (user?.role === "student") return u.role === "teacher";
    if (user?.role === "teacher") return u.role === "student";
    if (user?.role === "admin") return u.role !== "admin"; // Admin can feedback anyone except other admins for now
    return false;
  });

  const handleSend = () => {
    if (!message.trim() || !to.trim() || !user) return;
    addFeedback({
      id: `f_${Date.now()}`,
      from: user.name,
      fromRole: user.role,
      to: to.trim(),
      message: message.trim(),
      rating,
      createdAt: new Date().toISOString(),
    });
    setItems(getFeedback());
    setMessage(""); setTo(""); setRating(5); setShowForm(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Feedback</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-500 transition">
          {showForm ? "Cancel" : "+ Send Feedback"}
        </button>
      </div>

      {/* Send form */}
      {showForm && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Recipient</label>
            <select 
              value={to} 
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
            >
              <option value="">Select a {user?.role === "student" ? "Teacher" : "Student"}...</option>
              {possibleRecipients.map(r => (
                <option key={r.id} value={r.name} className="bg-slate-900">{r.name} ({r.role})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your feedback..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/50" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Rating:</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)}
                className={`text-xl transition ${n <= rating ? "text-yellow-400" : "text-slate-700"}`}>
                ★
              </button>
            ))}
          </div>
          <button onClick={handleSend}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-xs font-bold text-white hover:shadow-lg hover:shadow-indigo-500/20 transition">
            Send Feedback
          </button>
        </div>
      )}

      {/* Feedback list */}
      <div className="space-y-3">
        {items.map((f) => (
          <div key={f.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 transition">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${f.fromRole === "teacher" ? "bg-purple-500/20 text-purple-300" : f.fromRole === "admin" ? "bg-red-500/20 text-red-300" : "bg-blue-500/20 text-blue-300"}`}>
                    {f.fromRole}
                  </span>
                  <span className="text-xs text-slate-400">
                    {f.from} → {f.to}
                  </span>
                </div>
                <p className="text-sm text-slate-200 mt-1">{f.message}</p>
                <div className="mt-2 flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={`text-sm ${i < f.rating ? "text-yellow-400" : "text-slate-700"}`}>★</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center py-8 text-sm text-slate-500">No feedback yet.</p>
        )}
      </div>
    </div>
  );
}
