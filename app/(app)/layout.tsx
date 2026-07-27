"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";
import { useEffect } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isStandalone = pathname === "/live-class" || pathname === "/face-setup";

  useEffect(() => {
    if (!loading && !user && !isStandalone) router.push("/");
  }, [loading, user, router, isStandalone]);

  if (isStandalone) {
    return <div className="h-screen overflow-hidden bg-slate-950">{children}</div>;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-slate-800 shrink-0">
          <h2 className="text-sm font-medium text-slate-400">
            Welcome, <span className="text-white font-semibold">{user.name}</span>
          </h2>
          <NotificationBell />
        </header>
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
