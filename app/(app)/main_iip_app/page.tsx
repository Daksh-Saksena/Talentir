"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AttendanceRecord, InteractionRecord, SeatingPlan, StudentProfile } from "@/types/desktop";

const DETECTION_INTERVAL_MS = 800;
const ATTENDANCE_WINDOW_MS = 30_000;

function buildDescriptor(face: any, width: number, height: number): number[] {
  const box = face.boundingBox;
  if (!box) return [0, 0, 0, 0];
  return [box.x / width, box.y / height, box.width / width, box.height / height];
}

function distance(a: number[], b: number[]) {
  if (!a || !b || a.length !== b.length) return Infinity;
  return Math.sqrt(a.reduce((sum, value, index) => sum + Math.pow(value - b[index], 2), 0));
}

function getOrientation(face: any, width: number): string {
  const box = face.boundingBox;
  if (!box) return "unknown";
  const centerX = box.x + box.width / 2;
  const offset = (centerX - width / 2) / width;
  if (offset > 0.15) return "right";
  if (offset < -0.15) return "left";
  return "center";
}

function getGaze(face: any, height: number): string {
  const box = face.boundingBox;
  if (!box) return "unknown";
  const centerY = box.y + box.height / 2;
  const offsetY = (centerY - height / 2) / height;
  if (offsetY > 0.12) return "down";
  return "forward";
}

function computeScore(orientation: string, gaze: string) {
  let score = 100;
  if (orientation !== "center") score -= 20;
  if (gaze !== "forward") score -= 30;
  return Math.max(0, Math.min(100, score));
}

export default function MainIipAppPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("Initializing desktop intelligence...");
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [attentionMetrics, setAttentionMetrics] = useState<Array<{ studentId: string; score: number; samples: number }>>([]);
  const [interactions, setInteractions] = useState<InteractionRecord[]>([]);
  const [currentDetections, setCurrentDetections] = useState<string[]>([]);
  const [modelReady, setModelReady] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [latestDescriptor, setLatestDescriptor] = useState<number[] | null>(null);
  const [enrollName, setEnrollName] = useState("");
  const [enrollGrade, setEnrollGrade] = useState("Grade 10");
  const [commandOutput, setCommandOutput] = useState<string>("");
  const [seatingPlans, setSeatingPlans] = useState<SeatingPlan[]>([]);
  const lastAttendanceRef = useRef<Record<string, number>>({});
  const detectorRef = useRef<any>(null);

  const electronEnabled = typeof window !== "undefined" && Boolean((window as any).electronAPI);

  const loadDesktopData = async () => {
    if (!electronEnabled) return;
    const [studentsList, attendance, attention, interaction, plans] = await Promise.all([
      (window as any).electronAPI!.getStudents(),
      (window as any).electronAPI!.getAttendanceHistory(),
      (window as any).electronAPI!.getAttentionMetrics(),
      (window as any).electronAPI!.getInteractions(),
      (window as any).electronAPI!.getSeatingPlans(),
    ]);
    setStudents(studentsList);
    setAttendanceHistory(attendance);
    setAttentionMetrics(attention);
    setInteractions(interaction);
    setSeatingPlans(plans);
  };

  useEffect(() => {
    loadDesktopData();
  }, [electronEnabled]);

  useEffect(() => {
    if (!electronEnabled) {
      setStatus("Desktop features are available only in Electron mode.");
    }
  }, [electronEnabled]);

  const initializeCamera = async () => {
    if (!videoRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("Camera access is unavailable in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: true });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setStatus("Camera stream active. Loading attention model...");
      await loadFaceModel();
    } catch (error) {
      setStatus("Camera initialization failed. Check device permissions.");
      console.error(error);
    }
  };

  const loadFaceModel = async () => {
    if (!(window as any).FaceDetector) {
      setStatus("FaceDetector is not supported in this environment.");
      return;
    }

    try {
      detectorRef.current = new (window as any).FaceDetector({ maxDetectedFaces: 6 });
      setModelReady(true);
      setStatus("FaceDetector ready. Start a session to capture attendance.");
    } catch (error) {
      console.error(error);
      setStatus("FaceDetector initialization failed.");
    }
  };

  const recordRecognition = async (studentId: string, label: string, confidence: number) => {
    if (!electronEnabled) return;
    const now = Date.now();
    const last = lastAttendanceRef.current[studentId] || 0;
    if (now - last < ATTENDANCE_WINDOW_MS) return;
    lastAttendanceRef.current[studentId] = now;
    const timestamp = new Date().toISOString();
    await (window as any).electronAPI!.recordAttendance({
      studentId,
      timestamp,
      status: "present",
      label,
      confidence,
    });
    setAttendanceHistory((prev) => [{ id: `${studentId}-${timestamp}`, studentId, timestamp, status: "present", label, confidence }, ...prev].slice(0, 40));
  };

  const processFrame = async () => {
    if (!modelReady || !videoRef.current || !canvasRef.current || !detectorRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const faces = await detectorRef.current.detect(video);
      const detections: string[] = [];

      for (const face of faces) {
        const descriptor = buildDescriptor(face, canvas.width, canvas.height);
        setLatestDescriptor(descriptor);
        const orientation = getOrientation(face, canvas.width);
        const gaze = getGaze(face, canvas.height);
        const score = computeScore(orientation, gaze);

        const known = students.reduce<{ student: StudentProfile | null; dist: number }>((best, student) => {
          if (!student.descriptor) return best;
          const dist = distance(descriptor, student.descriptor);
          return dist < best.dist ? { student, dist } : best;
        }, { student: null, dist: Infinity });

        const match = known.student && known.dist < 0.42 ? known.student : null;
        const label = match ? match.name : "Unknown";
        const confidence = match ? 1 - known.dist : 0;

        if (match) {
          await recordRecognition(match.id as string, label, confidence);
          await (window as any).electronAPI!.recordAttention({
            studentId: match.id as string,
            timestamp: new Date().toISOString(),
            score,
            orientation,
            gaze,
            remark: "live inference",
          });
        }

        detections.push(`${label} · ${orientation} · ${gaze} · ${Math.round(score)}%`);

        if (face.boundingBox) {
          const box = face.boundingBox;
          ctx.strokeStyle = match ? "#22c55e" : "#fb7185";
          ctx.lineWidth = 3;
          ctx.strokeRect(box.xMin, box.yMin, box.xMax - box.xMin, box.yMax - box.yMin);
          ctx.fillStyle = "rgba(0,0,0,0.45)";
          ctx.fillRect(box.xMin, box.yMin - 26, Math.max(140, box.xMax - box.xMin), 22);
          ctx.fillStyle = "#f8fafc";
          ctx.fillText(label, box.xMin + 8, box.yMin - 10);
        }
      }

      setCurrentDetections(detections);
      if (electronEnabled) {
        setAttentionMetrics(await (window as any).electronAPI!.getAttentionMetrics());
        setInteractions(await (window as any).electronAPI!.getInteractions());
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (sessionStarted && modelReady) {
      interval = setInterval(() => {
        void processFrame();
      }, DETECTION_INTERVAL_MS);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionStarted, modelReady, students]);

  const handleStart = async () => {
    await initializeCamera();
    setSessionStarted(true);
    setStatus("Live attendance session started.");
  };

  const handleStop = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setSessionStarted(false);
    setStatus("Live session stopped.");
  };

  const handleEnroll = async () => {
    if (!enrollName.trim() || !latestDescriptor || !electronEnabled) {
      setStatus("Provide a name and start video to capture enrollment.");
      return;
    }
    await (window as any).electronAPI!.saveStudentProfile({
      name: enrollName.trim(),
      grade: enrollGrade,
      descriptor: latestDescriptor,
    });
    setEnrollName("");
    setStatus(`Enrolled ${enrollName.trim()} successfully.`);
    await loadDesktopData();
  };

  const handleRunCommand = async (command: string) => {
    if (!command.trim()) return;
    setCommandOutput("Processing command...");
    const key = electronEnabled ? await (window as any).electronAPI!.getEnv("NEXT_PUBLIC_OPENAI_API_KEY") : null;
    if (!key) {
      setCommandOutput("OpenAI key missing; cannot execute commands.");
      return;
    }
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a classroom analytics assistant. Answer commands concisely and do not claim facts." },
            { role: "user", content: command },
          ],
          max_tokens: 250,
        }),
      });
      const data = await response.json();
      setCommandOutput(data?.choices?.[0]?.message?.content || "No response returned.");
    } catch (error) {
      console.error(error);
      setCommandOutput("Failed to execute voice command.");
    }
  };

  const attentionSummary = useMemo(() => {
    const present = currentDetections.length;
    const average = attentionMetrics.length
      ? Math.round(attentionMetrics.reduce((sum, item) => sum + item.score, 0) / attentionMetrics.length)
      : 0;
    return { present, average };
  }, [currentDetections, attentionMetrics]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-slate-900/40">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Main IIP App</p>
                <h1 className="text-3xl font-semibold text-white">Attention & Attendance Dashboard</h1>
              </div>
              <span className="rounded-full bg-indigo-500/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-indigo-300">
                {electronEnabled ? "Electron mode" : "Browser preview"}
              </span>
            </div>
            <p className="text-sm leading-7 text-slate-400">Capture camera-based attendance, ongoing face analytics, and persistent classroom metrics in a desktop container.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Session status</p>
                <p className="mt-2 text-lg font-semibold text-white">{status}</p>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Recognitions</p>
                <p className="mt-2 text-lg font-semibold text-white">{currentDetections.length} faces</p>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Attention</p>
                <p className="mt-2 text-lg font-semibold text-white">{attentionSummary.average}%</p>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                <div className="relative aspect-video overflow-hidden rounded-3xl bg-black/30">
                  <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
                  <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={handleStart} className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500">Start session</button>
                  <button onClick={handleStop} className="rounded-2xl bg-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-600">Stop</button>
                  <button onClick={() => void loadDesktopData()} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500">Refresh data</button>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                <h2 className="text-lg font-semibold text-white">Live detection</h2>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  {currentDetections.length ? currentDetections.map((detail, index) => (
                    <div key={index} className="rounded-2xl border border-slate-800 bg-slate-950 p-3">{detail}</div>
                  )) : <p className="text-slate-500">No active detections yet. Start the session to see results.</p>}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-slate-900/40">
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-white">Enrollment & Intelligence</h2>
              <p className="mt-2 text-sm text-slate-400">Persist student identities and capture embeddings from the live camera stream.</p>
            </div>
            <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-4">
              <label className="block text-sm text-slate-400">Student name</label>
              <input value={enrollName} onChange={(e) => setEnrollName(e.target.value)} placeholder="Student name" className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500" />
              <label className="block text-sm text-slate-400">Class / grade</label>
              <input value={enrollGrade} onChange={(e) => setEnrollGrade(e.target.value)} className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500" />
              <button onClick={handleEnroll} className="w-full rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-500">Enroll face and save identity</button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                <h3 className="text-sm uppercase tracking-[0.25em] text-slate-500">Stored students</h3>
                <div className="mt-3 space-y-3 text-sm text-slate-300 max-h-72 overflow-y-auto">
                  {students.length ? students.map((student) => (
                    <div key={student.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-white">{student.name}</p>
                        <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{student.grade || "Grade"}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Updated {student.updatedAt ? new Date(student.updatedAt).toLocaleString() : "-"}</p>
                    </div>
                  )) : <p className="text-slate-500">No enrolled students yet.</p>}
                </div>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                <h3 className="text-sm uppercase tracking-[0.25em] text-slate-500">Command center</h3>
                <p className="mt-3 text-sm text-slate-400">Use a natural language assistant for attendance, attention, and seating commands.</p>
                <button onClick={() => void handleRunCommand("show attention report")} className="mt-4 w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500">Run sample command</button>
                <div className="mt-4 rounded-3xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">
                  <p className="font-medium text-white">Assistant output</p>
                  <p className="mt-2 text-slate-400">{commandOutput || "Ask the assistant by using the OpenAI key."}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-slate-900/40">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Historic analytics</h2>
              <p className="mt-2 text-sm text-slate-400">Attendance, attention, and interaction history from the local desktop database.</p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Attendance</p>
                <p className="mt-3 text-3xl font-semibold text-white">{attendanceHistory.length}</p>
                <p className="mt-2 text-sm text-slate-400">records saved locally.</p>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Interactions</p>
                <p className="mt-3 text-3xl font-semibold text-white">{interactions.length}</p>
                <p className="mt-2 text-sm text-slate-400">voice and speaking logs stored.</p>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="text-sm uppercase tracking-[0.25em] text-slate-500">Top attention scores</h3>
              <div className="mt-3 space-y-3 text-sm text-slate-300">
                {attentionMetrics.length ? attentionMetrics.slice(0, 5).map((entry) => (
                  <div key={entry.studentId} className="rounded-2xl border border-slate-800 bg-slate-950 p-3 flex items-center justify-between">
                    <span>{students.find((s) => s.id === entry.studentId)?.name || entry.studentId}</span>
                    <span>{Math.round(entry.score)}%</span>
                  </div>
                )) : <p className="text-slate-500">No attention metrics available yet.</p>}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-slate-900/40">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Seating optimization</h2>
              <p className="mt-2 text-sm text-slate-400">Create a seating arrangement based on recent metrics.</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 space-y-3">
              <button
                onClick={async () => {
                  const plan = {
                    name: `Auto plan ${new Date().toISOString()}`,
                    layout: students.map((student, index) => ({ seat: `Seat ${index + 1}`, studentId: student.id || "unknown" })),
                  };
                  if (electronEnabled) {
                    await (window as any).electronAPI!.saveSeatingPlan(plan);
                    setSeatingPlans((prev) => [plan, ...prev]);
                  }
                }}
                className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Generate quick seating plan
              </button>
              <div className="text-sm text-slate-300">
                {seatingPlans.length ? seatingPlans.slice(0, 3).map((plan) => (
                  <div key={plan.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                    <p className="font-medium text-white">{plan.name}</p>
                    <p className="mt-1 text-slate-400">{plan.layout.length} seats</p>
                  </div>
                )) : <p className="text-slate-500">No seating plans created yet.</p>}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
              <h3 className="text-sm uppercase tracking-[0.25em] text-slate-500">Recent attendance</h3>
              <div className="mt-3 grid gap-3">
                {attendanceHistory.slice(0, 4).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">
                    <div className="flex items-center justify-between">
                      <span>{students.find((s) => s.id === item.studentId)?.name || item.studentId}</span>
                      <span className="text-slate-500">{item.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
