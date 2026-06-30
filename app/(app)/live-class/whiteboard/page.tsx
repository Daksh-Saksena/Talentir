"use client";

import Toolbar from "@/components/whiteboard/Toolbar";
import WhiteboardCanvas from "@/components/whiteboard/WhiteboardCanvas";
import MagicBar from "@/components/whiteboard/MagicBar";

export default function WhiteboardPage() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#171717]">
      {/* Left Toolbar */}
      <div className="absolute left-4 top-1/2 z-20 -translate-y-1/2">
        <Toolbar />
      </div>

      {/* Whiteboard */}
      <div className="h-full w-full">
        <WhiteboardCanvas />
      </div>

      {/* Magic Bar */}
      <div className="absolute right-4 top-1/2 z-20 -translate-y-1/2">
        <MagicBar />
      </div>
    </div>
  );
}