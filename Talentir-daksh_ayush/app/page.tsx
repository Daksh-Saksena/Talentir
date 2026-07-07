"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getUsers } from "@/lib/store";
import type { Role } from "@/types/user";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role | null>(null);
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!name.trim()) { setError("Please enter your name"); return; }
    if (!role) { setError("Please select your role"); return; }
    if (pin.length !== 4) { setError("Please enter a 4-digit PIN"); return; }

    const users = getUsers();
    const found = users.find(u => 
      u.name.toLowerCase() === name.trim().toLowerCase() && 
      u.role === role && 
      u.pin === pin
    );

    if (found) {
      login(found);
      router.push("/dashboard");
    } else {
      setError("Invalid name, role, or PIN. Try Mayank/1234 or Admin/8888");
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background:
          "radial-gradient(ellipse at 30% 40%, rgba(99,102,241,0.08), transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(168,85,247,0.06), transparent 50%), #0a0a0a",
      }}
    >
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo */}
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-700/50 bg-slate-900/50 text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Classroom Copilot
          </div>
          <h1 className="text-4xl font-light tracking-tight text-white">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Secure login required
          </p>
        </div>

        {/* Role selection */}
        <div className="grid grid-cols-3 gap-3">
          <RoleButton 
            active={role === "student"} 
            onClick={() => { setRole("student"); setError(""); }} 
            icon="🎓" label="Student" desc="Learn" 
          />
          <RoleButton 
            active={role === "teacher"} 
            onClick={() => { setRole("teacher"); setError(""); }} 
            icon="👨‍🏫" label="Teacher" desc="Manage" 
          />
          <RoleButton 
            active={role === "admin"} 
            onClick={() => { setRole("admin"); setError(""); }} 
            icon="🛠️" label="Admin" desc="Control" 
          />
        </div>

        <div className="space-y-3">
          {/* Name input */}
          <input
            type="text"
            placeholder="Username"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            className="w-full px-5 py-4 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
          />

          {/* PIN input */}
          <input
            type="password"
            maxLength={4}
            placeholder="4-digit PIN"
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full px-5 py-4 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-center tracking-[1em] outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
          />
        </div>

        {/* Error */}
        {error && <p className="text-sm text-red-400 animate-shake">{error}</p>}

        {/* Login button */}
        <button
          onClick={handleLogin}
          className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs text-white transition
            bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0"
        >
          Verify &amp; Enter
        </button>

        <p className="text-[10px] text-slate-600 uppercase tracking-widest">
          Hint: Mayank (1234) | Prof. Sharma (0000) | Admin (8888)
        </p>
      </div>
    </main>
  );
}

function RoleButton({ active, onClick, icon, label, desc }: { active: boolean; onClick: () => void; icon: string; label: string; desc: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-4 text-center transition-all
        ${active
          ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
          : "border-slate-700 bg-slate-900/40 hover:border-slate-600"
        }`}
    >
      <span className="text-2xl block mb-2">{icon}</span>
      <span className="text-xs font-semibold text-white block">{label}</span>
      <p className="text-[8px] text-slate-500 mt-1 uppercase tracking-tighter">{desc}</p>
    </button>
  );
}