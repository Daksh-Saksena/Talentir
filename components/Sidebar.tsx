"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const studentLinks = [
  { href: "/analytics", label: "Analytics", icon: "📈" },
];

const teacherLinks = [
  { href: "/face-setup", label: "Enrollment", icon: "📷" },
  { href: "/live-class", label: "IP Panel", icon: "📺" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
];

const adminLinks = [
  { href: "/face-setup", label: "Enrollment", icon: "📷" },
  { href: "/live-class", label: "IP Panel", icon: "📺" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const links = user?.role === "admin" ? adminLinks : user?.role === "teacher" ? teacherLinks : studentLinks;

  return (
    <aside className="hidden md:flex w-72 flex-col border-r border-slate-800 bg-slate-950 p-6">
      <Link href="/dashboard" className="mb-10 flex items-center gap-3 rounded-3xl border border-slate-800 bg-slate-900/80 px-4 py-4 text-white shadow-sm shadow-black/20 transition hover:border-indigo-500/30">
        <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-bold">
          C
        </div>
        <div>
          <p className="text-sm font-semibold">Classroom Copilot</p>
          <p className="text-xs text-slate-500">Core shortcuts</p>
        </div>
      </Link>

      <nav className="flex-1 flex flex-col justify-center gap-4">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex min-h-[90px] items-center gap-4 rounded-[28px] border px-5 text-base font-semibold transition shadow-sm shadow-black/20
                ${active
                  ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-100"
                  : "border-slate-800 bg-slate-900/70 text-slate-200 hover:border-indigo-500/20 hover:bg-slate-800/90"
                }`}
            >
              <span className="text-2xl">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 rounded-[32px] border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-400">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="font-medium text-white">{user?.name || "Guest"}</p>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{user?.role || "user"}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full rounded-2xl bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-red-500/10 hover:text-red-300 transition"
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}
