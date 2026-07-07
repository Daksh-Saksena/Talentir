"use client";

import { useParams, useRouter } from "next/navigation";
import simulations from "@/data/simulations";
import { useEffect, useState } from "react";
import type { Simulation } from "@/types/simulation";

export default function FullScreenSim() {
  const params = useParams();
  const router = useRouter();
  const [sim, setSim] = useState<Simulation | null>(null);

  useEffect(() => {
    const id = params.id as string;
    const found = simulations.find((s) => s.id === id);
    if (found) {
      setSim(found);
    }
  }, [params.id]);

  if (!sim) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-slate-100">
        <p className="text-xl font-medium">Simulation not found</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
        >
          Return to Browser
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 h-screen w-screen bg-black">
      {/* Small floating close button to return to home if needed */}
      <button
        onClick={() => router.push("/")}
        className="absolute right-4 top-4 z-50 rounded-full bg-slate-900/60 p-2 text-slate-400 backdrop-blur-md transition hover:bg-slate-800 hover:text-white"
        title="Exit Full Screen"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-6 w-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <iframe
        src={sim.url}
        title={sim.title}
        className="h-full w-full border-none"
        allow="fullscreen"
      />
    </div>
  );
}
