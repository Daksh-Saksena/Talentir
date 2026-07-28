"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

// ── SVG icon set (no emojis) ──────────────────────
const Icon = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  aiTutor: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
      <path d="M4 11a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7z" />
      <circle cx="9" cy="14" r="1" fill="currentColor" />
      <circle cx="15" cy="14" r="1" fill="currentColor" />
      <path d="M10 17h4" />
    </svg>
  ),
  simulations: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  ),
  assignments: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  ),
  textbook: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  tests: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
    </svg>
  ),
  feedback: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
  whiteboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  enroll: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
    </svg>
  ),
  panel: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="2" y="2" width="20" height="20" rx="2" /><line x1="2" y1="9" x2="22" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
  leaderboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
};

// ── Role colour palettes ──────────────────────────
const roleMeta = {
  student: {
    accent: "from-indigo-500 to-violet-600",
    label: "Student",
    tag: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/20",
    active: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-200 font-semibold",
    glow: "shadow-indigo-500/20",
  },
  teacher: {
    accent: "from-purple-500 to-fuchsia-600",
    label: "Teacher",
    tag: "bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/20",
    active: "bg-purple-500/15 text-purple-600 dark:text-purple-200 font-semibold",
    glow: "shadow-purple-500/20",
  },
  admin: {
    accent: "from-rose-500 to-orange-500",
    label: "Admin",
    tag: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/20",
    active: "bg-rose-500/15 text-rose-600 dark:text-rose-200 font-semibold",
    glow: "shadow-rose-500/20",
  },
};

// ── Nav link definitions (no emojis) ─────────────
const studentLinks = [
  { href: "/dashboard",    label: "Dashboard",    icon: Icon.dashboard },
  { href: "/ai-tutor",     label: "AI Tutor",     icon: Icon.aiTutor },
  { href: "/simulations",  label: "Simulations",  icon: Icon.simulations },
  { href: "/assignments",  label: "Assignments",  icon: Icon.assignments },
  { href: "/textbook",     label: "Textbooks",    icon: Icon.textbook },
  { href: "/tests",        label: "Practice Tests", icon: Icon.tests },
  { href: "/leaderboard",  label: "Leaderboard",  icon: Icon.leaderboard },
  { href: "/feedback",     label: "Feedback",     icon: Icon.feedback },
];

const teacherLinks = [
  { href: "/dashboard",          label: "Dashboard",    icon: Icon.dashboard },
  { href: "/simulations",        label: "Simulations",  icon: Icon.simulations },
  { href: "/assignments",        label: "Assignments",  icon: Icon.assignments },
  { href: "/textbook",           label: "Textbooks",    icon: Icon.textbook },
  { href: "/tests",              label: "Tests",        icon: Icon.tests },
  { href: "/live-class/whiteboard", label: "Whiteboard", icon: Icon.whiteboard },
  { href: "/analytics",          label: "Analytics",   icon: Icon.analytics },
  { href: "/feedback",           label: "Feedback",     icon: Icon.feedback },
];

const adminLinks = [
  { href: "/dashboard",          label: "Dashboard",    icon: Icon.dashboard },
  { href: "/simulations",        label: "Simulations",  icon: Icon.simulations },
  { href: "/assignments",        label: "Assignments",  icon: Icon.assignments },
  { href: "/textbook",           label: "Textbooks",    icon: Icon.textbook },
  { href: "/live-class/whiteboard", label: "Whiteboard", icon: Icon.whiteboard },
  { href: "/analytics",          label: "Analytics",   icon: Icon.analytics },
  { href: "/users",              label: "Users",        icon: Icon.users },
  { href: "/face-setup",         label: "Enrollment",   icon: Icon.enroll },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const links = user?.role === "admin" ? adminLinks : user?.role === "teacher" ? teacherLinks : studentLinks;
  const meta = roleMeta[user?.role ?? "student"];

  return (
    <aside className="hidden md:flex w-56 flex-col border-r border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-950 relative overflow-hidden shrink-0">
      {/* Role accent strip at top */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${meta.accent}`} />

      <div className="flex flex-col h-full p-4 pt-5">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 mb-7 group">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${meta.accent} flex items-center justify-center text-white font-black text-sm shadow-lg ${meta.glow} group-hover:scale-105 transition-transform`}>
            T
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-none">Talentir</p>
            <p className="text-[10px] text-slate-500 tracking-widest uppercase mt-0.5">{meta.label}</p>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="flex-1 space-y-0.5">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150
                  ${active
                    ? `${meta.active}`
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
              >
                <span className={`flex-shrink-0 ${active ? "opacity-100" : "opacity-60"}`}>{link.icon}</span>
                <span className="truncate">{link.label}</span>
                {active && <span className={`ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-b ${meta.accent}`} />}
              </Link>
            );
          })}
        </nav>

        {/* Admin special actions */}
        {user?.role === "admin" && (
          <div className="mb-3 space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 px-3 mb-1">Tools</p>
            <Link
              href={process.env.NEXT_PUBLIC_IP_PANEL_URL || "/live-class"}
              target="_blank"
              className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-xs text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/8 border border-cyan-200 dark:border-cyan-500/15 hover:bg-cyan-100 dark:hover:bg-cyan-500/15 transition group"
            >
              <div className="flex items-center gap-2.5">
                {Icon.panel}
                <span>IP Panel</span>
              </div>
              <span className="opacity-60 text-[9px] uppercase tracking-widest transition">↗</span>
            </Link>
          </div>
        )}

        {/* User card + logout */}
        <div className="border-t border-slate-200 dark:border-slate-800/60 pt-3">
          <div className="flex items-center gap-2.5 px-2 mb-3">
            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${meta.accent} flex items-center justify-center text-xs font-bold text-white shadow-md flex-shrink-0`}>
              {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate leading-tight">{user?.name}</p>
              <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${meta.tag} mt-0.5`}>
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-slate-500 hover:bg-red-50 dark:hover:bg-red-500/8 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
          >
            {Icon.logout}
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
