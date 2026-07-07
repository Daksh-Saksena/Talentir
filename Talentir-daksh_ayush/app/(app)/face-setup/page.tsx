"use client";

import { useState, useEffect, useRef } from "react";

interface FaceProfile {
  name: string;
  role: "student" | "teacher";
  descriptor: number[];
  enrolledAt: string;
}

export default function FaceSetupPage() {
  const [profiles, setProfiles] = useState<FaceProfile[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [status, setStatus] = useState("Loading camera & AI models...");
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [capturedDescriptor, setCapturedDescriptor] = useState<number[] | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load saved profiles
  useEffect(() => {
    const saved = localStorage.getItem("cc-face-profiles");
    if (saved) setProfiles(JSON.parse(saved));
  }, []);

  // Initialize camera + face-api models
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        let faceapi = (window as any).faceapi;
        if (!faceapi) {
          setStatus("Loading face-api.js...");
          if (!document.querySelector('script[src*="face-api"]')) {
            await new Promise<void>((resolve) => {
              const s = document.createElement("script");
              s.src = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
              s.onload = () => resolve();
              document.head.appendChild(s);
            });
          } else {
            // Wait for existing script to finish loading
            await new Promise<void>((resolve) => {
              const check = () => (window as any).faceapi ? resolve() : setTimeout(check, 200);
              check();
            });
          }
          faceapi = (window as any).faceapi;
        }
        if (cancelled) return;
        setStatus("Loading AI models...");
        const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        if (cancelled) return;

        setStatus("Starting camera...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // autoPlay attribute on the video element handles playback
        }
        setStatus("Ready — Stand in front of the camera and click Capture");
        setIsReady(true);
      } catch (e: any) {
        if (!cancelled) setStatus(`Error: ${e.message}`);
      }
    };
    init();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const captureFace = async () => {
    if (!videoRef.current || !isReady) return;
    setIsCapturing(true);
    setStatus("Scanning face...");
    try {
      const faceapi = (window as any).faceapi;
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setStatus("⚠️ No face detected — please look directly at the camera and try again");
        setIsCapturing(false);
        return;
      }

      // Draw preview
      const canvas = canvasRef.current!;
      canvas.width = 160;
      canvas.height = 160;
      const ctx = canvas.getContext("2d")!;
      const box = detection.detection.box;
      const padding = 40;
      ctx.drawImage(
        videoRef.current,
        Math.max(0, box.x - padding),
        Math.max(0, box.y - padding),
        box.width + padding * 2,
        box.height + padding * 2,
        0, 0, 160, 160
      );
      setCapturedPreview(canvas.toDataURL("image/jpeg", 0.8));
      setCapturedDescriptor(Array.from(detection.descriptor));
      setStatus("✅ Face captured! Enter the name and click Save.");
    } catch (e) {
      setStatus("⚠️ Capture failed — try again");
    }
    setIsCapturing(false);
  };

  const saveProfile = () => {
    if (!capturedDescriptor || !name.trim()) return;
    const newProfile: FaceProfile = {
      name: name.trim(),
      role,
      descriptor: capturedDescriptor,
      enrolledAt: new Date().toISOString(),
    };
    const updated = [...profiles, newProfile];
    setProfiles(updated);
    localStorage.setItem("cc-face-profiles", JSON.stringify(updated));
    setName("");
    setCapturedPreview(null);
    setCapturedDescriptor(null);
    setStatus(`✅ ${newProfile.name} enrolled as ${newProfile.role}! Next person, step up.`);
  };

  const deleteProfile = (index: number) => {
    const updated = profiles.filter((_, i) => i !== index);
    setProfiles(updated);
    localStorage.setItem("cc-face-profiles", JSON.stringify(updated));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Face Enrollment Setup</h2>
        <p className="text-xs text-slate-500 mt-1">
          Each student & teacher scans their face so Talantir can recognize them during class
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Camera & Capture */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-400">
              Live Camera
            </span>
            <div className={`flex items-center gap-2 ${isReady ? "text-emerald-400" : "text-yellow-400"}`}>
              <div className={`w-2 h-2 rounded-full ${isReady ? "bg-emerald-500 animate-pulse" : "bg-yellow-500"}`} />
              <span className="text-[10px] font-mono">{isReady ? "READY" : "LOADING"}</span>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {isCapturing && (
              <div className="absolute inset-0 bg-white/20 animate-pulse flex items-center justify-center">
                <span className="text-white font-bold text-lg">Scanning...</span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 text-center min-h-[2rem]">{status}</p>

          <button
            onClick={captureFace}
            disabled={!isReady || isCapturing}
            className="w-full py-3 bg-indigo-600 rounded-xl text-white font-bold hover:bg-indigo-500 disabled:opacity-40 transition shadow-lg shadow-indigo-600/20"
          >
            📸 Capture Face
          </button>

          {/* Save form — appears after capture */}
          {capturedPreview && (
            <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-3 animate-fade-up">
              <div className="flex items-center gap-4">
                <img src={capturedPreview} className="w-16 h-16 rounded-full border-2 border-indigo-500 object-cover" alt="" />
                <div className="flex-1 space-y-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRole("student")}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                        role === "student"
                          ? "bg-blue-500/20 border border-blue-500/30 text-blue-400"
                          : "bg-slate-800 border border-slate-700 text-slate-500"
                      }`}
                    >
                      🎒 Student
                    </button>
                    <button
                      onClick={() => setRole("teacher")}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                        role === "teacher"
                          ? "bg-purple-500/20 border border-purple-500/30 text-purple-400"
                          : "bg-slate-800 border border-slate-700 text-slate-500"
                      }`}
                    >
                      🧑‍🏫 Teacher
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={saveProfile}
                disabled={!name.trim()}
                className="w-full py-2.5 bg-emerald-600 rounded-xl text-white font-bold hover:bg-emerald-500 disabled:opacity-40 transition"
              >
                ✅ Save & Enroll
              </button>
            </div>
          )}
        </div>

        {/* Enrolled Profiles */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">
              Enrolled Faces
            </span>
            <span className="text-xs font-mono text-slate-500">{profiles.length} registered</span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {profiles.length === 0 ? (
              <p className="text-sm text-slate-600 text-center py-10">
                No faces enrolled yet. Start scanning!
              </p>
            ) : (
              profiles.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        p.role === "teacher"
                          ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{p.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {p.role === "teacher" ? "🧑‍🏫 Teacher" : "🎒 Student"} ·{" "}
                        {new Date(p.enrolledAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteProfile(i)}
                    className="text-xs text-slate-600 hover:text-red-400 transition px-2 py-1"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {profiles.length > 0 && (
            <div className="pt-3 border-t border-slate-800">
              <div className="flex gap-2">
                <div className="flex-1 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center">
                  <p className="text-lg font-bold text-blue-400">
                    {profiles.filter((p) => p.role === "student").length}
                  </p>
                  <p className="text-[10px] text-slate-500">Students</p>
                </div>
                <div className="flex-1 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-center">
                  <p className="text-lg font-bold text-purple-400">
                    {profiles.filter((p) => p.role === "teacher").length}
                  </p>
                  <p className="text-[10px] text-slate-500">Teachers</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
