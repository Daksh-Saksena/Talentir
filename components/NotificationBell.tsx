"use client";

import { useState, useEffect, useRef } from "react";
import { getNotifications, markAllRead } from "@/lib/store";
import type { AppNotification } from "@/types/user";

const typeIcon: Record<string, string> = {
  assignment: "📝",
  test: "🧪",
  announcement: "📢",
  feedback: "💬",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(getNotifications());
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unread = items.filter((n) => !n.read).length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-slate-800 transition"
      >
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => { markAllRead(); setItems(getNotifications()); }}
                className="text-[10px] text-indigo-400 hover:text-indigo-300"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-800">
            {items.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-500">No notifications</p>
            )}
            {items.map((n) => (
              <div key={n.id} className={`px-4 py-3 ${n.read ? "opacity-50" : ""}`}>
                <div className="flex items-start gap-2">
                  <span className="text-base mt-0.5">{typeIcon[n.type] ?? "📌"}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-200">{n.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{n.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
