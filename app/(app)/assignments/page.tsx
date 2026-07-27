"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/lib/auth";
import {
  getAssignments,
  addAssignment,
  updateAssignment,
  addNotification,
  deleteAssignment,
  getSubmissions,
  addSubmission,
  gradeSubmission,
  getUsers,
} from "@/lib/store";
import type { Assignment, StudentSubmission } from "@/types/user";
import * as XLSX from "xlsx";

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:   "bg-amber-500/20 text-amber-300 border-amber-500/30",
    submitted: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    graded:    "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${map[status] ?? "bg-slate-700 text-slate-300"}`}>
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────
//  EXCEL EXPORT
// ─────────────────────────────────────────────

function exportSubmissionsToExcel(assignment: Assignment, submissions: StudentSubmission[]) {
  const rows = submissions.map((s) => ({
    "Student Name":     s.studentName,
    "File Submitted":   s.fileName,
    "Comments":         s.comments ?? "",
    "Submitted At":     new Date(s.submittedAt).toLocaleString(),
    "Grade":            s.grade ?? "Not graded",
    "Feedback":         s.feedback ?? "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws["!cols"] = [
    { wch: 20 }, { wch: 30 }, { wch: 40 }, { wch: 22 }, { wch: 12 }, { wch: 40 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Submissions");
  XLSX.writeFile(wb, `${assignment.title.replace(/\s+/g, "_")}_grades.xlsx`);
}

// ─────────────────────────────────────────────
//  GRADING PANEL (teacher only)
// ─────────────────────────────────────────────

function GradingPanel({
  assignment,
  onClose,
}: {
  assignment: Assignment;
  onClose: () => void;
}) {
  const students = getUsers().filter((u) => u.role === "student");
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const subs = getSubmissions().filter((s) => s.assignmentId === assignment.id);
    setSubmissions(subs);
    const g: Record<string, string> = {};
    const f: Record<string, string> = {};
    subs.forEach((s) => {
      if (s.grade)    g[s.id] = s.grade;
      if (s.feedback) f[s.id] = s.feedback;
    });
    setGrades(g);
    setFeedbacks(f);
  }, [assignment.id]);

  const handleSave = (subId: string) => {
    gradeSubmission(subId, grades[subId] ?? "", feedbacks[subId] ?? "");
    setSaved((prev) => ({ ...prev, [subId]: true }));
    setTimeout(() => setSaved((prev) => ({ ...prev, [subId]: false })), 2000);
  };

  const pendingStudents = students.filter(
    (s) => !submissions.find((sub) => sub.studentName === s.name)
  );

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-950 border border-purple-500/20 rounded-2xl shadow-2xl shadow-purple-500/10 mt-10 mb-10 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-900/60 to-fuchsia-900/40 border-b border-purple-500/20 p-5">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_70%)]" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Submission Review</p>
              <h2 className="text-lg font-bold text-white">{assignment.title}</h2>
              <p className="text-xs text-purple-300 mt-0.5">{assignment.subject} · Due {assignment.dueDate}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => exportSubmissionsToExcel(assignment, submissions)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-600/30 transition"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                </svg>
                Export Excel
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="relative flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-300"><span className="text-white font-bold">{submissions.length}</span> submitted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-slate-300"><span className="text-white font-bold">{pendingStudents.length}</span> pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-xs text-slate-300"><span className="text-white font-bold">{submissions.filter(s => s.grade).length}</span> graded</span>
            </div>
          </div>
        </div>

        {/* Submissions list */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {submissions.length === 0 && (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-slate-500">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" />
                </svg>
              </div>
              <p className="text-sm text-slate-500">No submissions yet.</p>
            </div>
          )}

          {submissions.map((sub) => (
            <div key={sub.id} className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 space-y-3">
              {/* Student info */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {sub.studentName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{sub.studentName}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Submitted {new Date(sub.submittedAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {sub.grade && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Graded
                    </span>
                  )}
                </div>
              </div>

              {/* File + comments */}
              <div className="bg-slate-800/60 rounded-lg p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-red-400">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">{sub.fileName}</p>
                  {sub.comments && <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">&ldquo;{sub.comments}&rdquo;</p>}
                </div>
              </div>

              {/* Grading inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Grade</label>
                  <input
                    value={grades[sub.id] ?? ""}
                    onChange={(e) => setGrades((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                    placeholder="e.g. A+, 85/100, 9/10"
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Feedback</label>
                  <input
                    value={feedbacks[sub.id] ?? ""}
                    onChange={(e) => setFeedbacks((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                    placeholder="Written feedback for student"
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition"
                  />
                </div>
              </div>

              <button
                onClick={() => handleSave(sub.id)}
                className={`w-full py-2 rounded-lg text-xs font-bold transition ${
                  saved[sub.id]
                    ? "bg-emerald-600 text-white"
                    : "bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30"
                }`}
              >
                {saved[sub.id] ? "✓ Saved!" : "Save Grade & Feedback"}
              </button>
            </div>
          ))}

          {/* Pending students */}
          {pendingStudents.length > 0 && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-3">Not Submitted ({pendingStudents.length})</p>
              <div className="flex flex-wrap gap-2">
                {pendingStudents.map((s) => (
                  <div key={s.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700">
                    <div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-[9px] font-bold text-slate-300">
                      {s.name.charAt(0)}
                    </div>
                    <span className="text-[10px] text-slate-400">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}

// ─────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [gradingAssignment, setGradingAssignment] = useState<Assignment | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Physics");
  const [desc, setDesc] = useState("");
  const [due, setDue] = useState("");

  useEffect(() => {
    setAssignments(getAssignments());
    setSubmissions(getSubmissions());
  }, []);

  const refresh = () => {
    setAssignments(getAssignments());
    setSubmissions(getSubmissions());
  };

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

  const [submitModalAssignment, setSubmitModalAssignment] = useState<Assignment | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submissionComments, setSubmissionComments] = useState("");

  const handleOpenSubmitModal = (a: Assignment) => {
    setSubmitModalAssignment(a);
    setSelectedFile(null);
    setSubmissionComments("");
  };

  const handleConfirmSubmit = () => {
    if (!submitModalAssignment || !user || !selectedFile) return;

    addSubmission({
      id: `sub_${Date.now()}`,
      assignmentId: submitModalAssignment.id,
      studentName: user.name,
      fileName: selectedFile.name,
      comments: submissionComments,
      submittedAt: new Date().toISOString(),
    });

    updateAssignment(submitModalAssignment.id, { status: "submitted" });
    refresh();
    setSubmitModalAssignment(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this assignment?")) {
      deleteAssignment(id);
      setAssignments(getAssignments());
    }
  };

  // Count submissions per assignment
  const subCountFor = (id: string) => submissions.filter((s) => s.assignmentId === id).length;
  const gradedCountFor = (id: string) => submissions.filter((s) => s.assignmentId === id && s.grade).length;

  // Student: find their own submission
  const mySubmission = (id: string) =>
    submissions.find((s) => s.assignmentId === id && s.studentName === user?.name);

  const isTeacher = user?.role === "teacher";
  const isStudent = user?.role === "student";
  const isAdmin   = user?.role === "admin";

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Assignments</h2>
          {isAdmin && (
            <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
              Admin
            </span>
          )}
        </div>
        {isTeacher && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-bold text-white hover:opacity-90 transition shadow-lg shadow-purple-500/20"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {showForm ? "Cancel" : "Create Assignment"}
          </button>
        )}
      </div>

      {/* Create form (teacher only) */}
      {showForm && (
        <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-900/30 to-slate-900/60 p-6 space-y-4 shadow-xl shadow-purple-500/5">
          <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">New Assignment</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Assignment title"
            className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition"
          />
          <div className="grid grid-cols-2 gap-4">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-white outline-none focus:border-purple-500/50 transition"
            >
              <option>Physics</option><option>Chemistry</option><option>Math</option>
            </select>
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-white outline-none focus:border-purple-500/50 transition"
            />
          </div>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Description & instructions"
            rows={3}
            className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition resize-none"
          />
          <button
            onClick={handleCreate}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs font-bold text-white hover:shadow-lg hover:shadow-purple-500/20 transition"
          >
            Assign to Class →
          </button>
        </div>
      )}

      {/* Assignment list */}
      <div className="space-y-3">
        {assignments.map((a) => {
          const submissionCount = subCountFor(a.id);
          const gradedCount = gradedCountFor(a.id);
          const mySubmit = mySubmission(a.id);

          return (
            <div
              key={a.id}
              className="group relative rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700/60 transition shadow-sm overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-purple-500/10 border border-purple-500/20 text-purple-500 dark:text-purple-300">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 w-5 h-5">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" />
                      </svg>
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <StatusBadge status={a.status} />
                        <span className="text-[10px] text-slate-500">{a.subject}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{a.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{a.description}</p>
                      <p className="text-[10px] text-slate-500 mt-2">By {a.createdBy} · Due {a.dueDate}</p>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Teacher: submission count + grade button */}
                    {isTeacher && (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{submissionCount}</p>
                          <p className="text-[10px] text-slate-500">submissions</p>
                          {gradedCount > 0 && (
                            <p className="text-[10px] text-emerald-500">{gradedCount} graded</p>
                          )}
                        </div>
                        <button
                          onClick={() => setGradingAssignment(a)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600/15 border border-purple-500/25 text-purple-300 text-xs font-bold hover:bg-purple-600/25 transition"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Review & Grade
                        </button>
                      </div>
                    )}

                    {/* Student: submit or show grade */}
                    {isStudent && a.status === "pending" && !mySubmit && (
                      <button
                        onClick={() => handleOpenSubmitModal(a)}
                        className="px-4 py-2 rounded-lg border border-emerald-500/30 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 transition"
                      >
                        Submit ✓
                      </button>
                    )}
                    {isStudent && mySubmit && (
                      <div className="text-right">
                        {mySubmit.grade ? (
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-emerald-400">{mySubmit.grade}</p>
                            <p className="text-[10px] text-slate-500">Your grade</p>
                          </div>
                        ) : (
                          <span className="text-[10px] text-sky-400 font-semibold">Submitted — awaiting grade</span>
                        )}
                      </div>
                    )}

                    {/* Admin: delete */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition"
                        title="Delete Assignment"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Student: feedback strip */}
                {isStudent && mySubmit?.feedback && (
                  <div className="mt-3 px-3 py-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Teacher Feedback</p>
                    <p className="text-xs text-slate-300">{mySubmit.feedback}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {assignments.length === 0 && (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-slate-500">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" />
              </svg>
            </div>
            <p className="text-sm text-slate-500">No assignments yet.</p>
          </div>
        )}
      </div>

      {/* Grading Panel modal */}
      {gradingAssignment && (
        <GradingPanel
          assignment={gradingAssignment}
          onClose={() => { setGradingAssignment(null); refresh(); }}
        />
      )}

      {/* Student Submit Modal */}
      {submitModalAssignment && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-950 border border-emerald-500/20 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Submit Assignment</p>
                <h3 className="text-base font-bold text-white">{submitModalAssignment.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{submitModalAssignment.subject} · Due {submitModalAssignment.dueDate}</p>
              </div>
              <button
                onClick={() => setSubmitModalAssignment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Attach File <span className="text-red-400">*</span>
              </label>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/20 file:text-emerald-300 hover:file:bg-emerald-500/30 transition border border-slate-800 rounded-xl p-2 bg-slate-900/50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Comments (Optional)
              </label>
              <textarea
                value={submissionComments}
                onChange={(e) => setSubmissionComments(e.target.value)}
                placeholder="Add any notes for your teacher..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500/40 transition resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSubmitModalAssignment(null)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={!selectedFile}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold text-white transition shadow-lg shadow-emerald-500/20"
              >
                Confirm Submission ✓
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
