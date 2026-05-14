"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { getAssignments, addAssignment, updateAssignment, addNotification, deleteAssignment } from "@/lib/store";
import type { Assignment } from "@/types/user";

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Physics");
  const [desc, setDesc] = useState("");
  const [due, setDue] = useState("");

  useEffect(() => { setAssignments(getAssignments()); }, []);

  const handleCreate = () => {
    if (!title || !desc || !due) return;
    const a: Assignment = {
      id: `a_${Date.now()}`, title, subject, description: desc,
      dueDate: due, createdBy: user?.name ?? "Teacher",
      createdAt: new Date().toISOString().split("T")[0], status: "pending",
    };
    addAssignment(a);
    addNotification({
      id: `n_${Date.now()}`, title: "New Assignment",
      message: `${title} assigned by ${user?.name}`,
      type: "assignment", createdAt: new Date().toISOString(), read: false,
    });
    setAssignments(getAssignments());
    setTitle(""); setDesc(""); setDue(""); setShowForm(false);
  };

  const handleSubmit = (id: string) => {
    updateAssignment(id, { status: "submitted" });
    setAssignments(getAssignments());
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this assignment?")) {
      deleteAssignment(id);
      setAssignments(getAssignments());
    }
  };

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-300",
    submitted: "bg-blue-500/20 text-blue-300",
    graded: "bg-green-500/20 text-green-300",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">Assignments</h2>
          {user?.role === "admin" && (
            <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
              Admin
            </span>
          )}
        </div>
        {user?.role === "teacher" && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-500 transition"
          >
            {showForm ? "Cancel" : "+ Create Assignment"}
          </button>
        )}
      </div>

      {/* Create form (teacher only) */}
      {showForm && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Assignment title"
            className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/50" />
          <div className="grid grid-cols-2 gap-4">
            <select value={subject} onChange={(e) => setSubject(e.target.value)}
              className="px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-white outline-none">
              <option>Physics</option><option>Chemistry</option><option>Math</option>
            </select>
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)}
              className="px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-white outline-none" />
          </div>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description & instructions" rows={3}
            className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/50" />
          <button onClick={handleCreate}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-xs font-bold text-white hover:shadow-lg hover:shadow-indigo-500/20 transition">
            Assign to Class
          </button>
        </div>
      )}

      {/* Assignment list */}
      <div className="space-y-3">
        {assignments.map((a) => (
          <div key={a.id} className="group relative rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 transition">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor[a.status]}`}>
                    {a.status}
                  </span>
                  <span className="text-[10px] text-slate-500">{a.subject}</span>
                </div>
                <h4 className="text-sm font-semibold text-white">{a.title}</h4>
                <p className="text-xs text-slate-400 mt-1">{a.description}</p>
                <p className="text-[10px] text-slate-600 mt-2">
                  By {a.createdBy} · Due {a.dueDate}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {user?.role === "student" && a.status === "pending" && (
                  <button onClick={() => handleSubmit(a.id)}
                    className="px-4 py-2 rounded-lg border border-emerald-500/30 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition shrink-0">
                    Submit ✓
                  </button>
                )}
                
                {user?.role === "admin" && (
                  <button 
                    onClick={() => handleDelete(a.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition"
                    title="Delete Assignment"
                  >
                    <span className="text-xs">🗑️</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {assignments.length === 0 && (
          <p className="text-center py-8 text-sm text-slate-500">No assignments found.</p>
        )}
      </div>
    </div>
  );
}
