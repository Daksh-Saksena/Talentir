"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const studentLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/ai-tutor", label: "AI Tutor", icon: "🧑‍🏫" },
  { href: "/simulations", label: "Simulations", icon: "⚛️" },
  { href: "/assignments", label: "Assignments", icon: "📝" },
  { href: "/tests", label: "Practice Tests", icon: "🧪" },
  { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
  { href: "/feedback", label: "Feedback", icon: "💬" },
];

const teacherLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/ai-tutor", label: "AI Tutor", icon: "🧑‍🏫" },
  { href: "/simulations", label: "Simulations", icon: "⚛️" },
  { href: "/assignments", label: "Assignments", icon: "📝" },
  { href: "/tests", label: "Tests", icon: "🧪" },
  { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
  { href: "/feedback", label: "Feedback", icon: "💬" },
];

const adminLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/ai-tutor", label: "AI Tutor", icon: "🧑‍🏫" },
  { href: "/simulations", label: "Simulations", icon: "⚛️" },
  { href: "/assignments", label: "Assignments", icon: "📝" },
  { href: "/users", label: "Users", icon: "👥" },
  { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const links = user?.role === "admin" ? adminLinks : user?.role === "teacher" ? teacherLinks : studentLinks;

  return (
    <aside className="hidden md:flex w-56 flex-col border-r border-slate-800 bg-slate-950 p-4">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold">
          C
        </div>
        <span className="text-sm font-bold tracking-tight text-white">
          Classroom Copilot
        </span>
      </Link>

      {/* Nav links */}
      <nav className="flex-1 space-y-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all
                ${active
                  ? "bg-indigo-600/20 text-indigo-300 font-medium"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-slate-800 pt-4 mt-4">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{user?.role}</p>
          </div>
        </div>
        <div className="space-y-1 mt-3 pt-3 border-t border-slate-800">
          {(user?.role === "teacher" || user?.role === "admin") && (
            <Link
              href="/live-class"
              target="_blank"
              className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 transition"
            >
              <div className="flex items-center gap-3">
                <span>📺</span> IP Panel
              </div>
              <span className="text-[10px] uppercase tracking-widest opacity-50">Launch</span>
            </Link>
          )}
          {(user?.role === "teacher" || user?.role === "admin") && (
            <Link
              href="/face-setup"
              target="_blank"
              className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition mb-3"
            >
              <div className="flex items-center gap-3">
                <span>📷</span> Enrollment
              </div>
              <span className="text-[10px] uppercase tracking-widest opacity-50">Launch</span>
            </Link>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
