"use client";

import { useAuth } from "@/lib/auth";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();

  const actions = [
    { href: "/face-setup", icon: "📷", label: "Enrollment" },
    { href: "/live-class", icon: "📺", label: "IP Panel" },
    { href: "/analytics", icon: "📈", label: "Analytics" },
  ];

  return (
    <div className="min-h-screen px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 rounded-[40px] border border-slate-800 bg-slate-950/70 p-10 shadow-2xl backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500 mb-4">Dashboard</p>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            {user?.name ? `Welcome back, ${user.name}` : "Welcome to Classroom Copilot"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
            This space is now trimmed to only the core actions you asked for: Enrollment, IP Panel, and Analytics.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex h-48 flex-col justify-between rounded-[32px] border border-slate-800 bg-slate-900/50 p-8 text-left transition hover:border-indigo-500/40 hover:bg-indigo-500/10"
            >
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/5 text-2xl text-white shadow-sm shadow-black/20 transition group-hover:bg-indigo-500/20">
                  {action.icon}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">{action.label}</h2>
                <p className="mt-3 text-sm text-slate-400">
                  {action.label === "Enrollment" && "Manage face profiles and enroll students for live attendance."}
                  {action.label === "IP Panel" && "Open the live classroom dashboard and start attendance monitoring."}
                  {action.label === "Analytics" && "Review class metrics, performance trends, and session reports."}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
