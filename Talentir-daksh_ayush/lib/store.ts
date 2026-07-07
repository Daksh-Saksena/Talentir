"use client";

import type {
  ClassSummary, Assignment, PracticeTest, TestResult,
  LeaderboardEntry, FeedbackEntry, AppNotification, User,
} from "@/types/user";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SEED DATA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const seedUsers: User[] = [
  // Students
  { id: "u1", name: "Mayank", role: "student", pin: "1234" },
  { id: "u2", name: "Arjun Patel", role: "student", pin: "1111" },
  { id: "u3", name: "Priya Singh", role: "student", pin: "2222" },
  { id: "u4", name: "Ananya Sharma", role: "student", pin: "3333" },
  { id: "u5", name: "Rahul Verma", role: "student", pin: "4444" },
  
  // Teachers
  { id: "t1", name: "Prof. Sharma", role: "teacher", pin: "0000" },
  { id: "t2", name: "Dr. Gupta", role: "teacher", pin: "1010" },
  { id: "t3", name: "Prof. Iyer", role: "teacher", pin: "2020" },
  { id: "t4", name: "Ms. Reddy", role: "teacher", pin: "3030" },
  { id: "t5", name: "Dr. Bose", role: "teacher", pin: "4040" },

  // Admin
  { id: "a1", name: "Admin", role: "admin", pin: "8888" },
];

const seedSummaries: ClassSummary[] = [
  { id: "cs1", date: "2026-05-12", subject: "Physics", title: "Newton's Laws of Motion", summary: "Covered all three laws with JEE-level numericals. Focused on constraint relations, pseudo forces in non-inertial frames, and connected body problems.", teacher: "Prof. Sharma", topics: ["Newton's Laws", "Free Body Diagrams", "Pseudo Forces"] },
  { id: "cs2", date: "2026-05-11", subject: "Chemistry", title: "Organic Reactions — SN1 & SN2", summary: "Detailed comparison of SN1 vs SN2 mechanisms. Discussed substrate, nucleophile, solvent effects, and stereochemistry implications.", teacher: "Dr. Gupta", topics: ["SN1", "SN2", "Nucleophilic Substitution"] },
  { id: "cs3", date: "2026-05-11", subject: "Math", title: "Integration by Parts", summary: "Practiced ILATE rule with 12 problems. Covered reduction formulas and definite integral applications for area under curves.", teacher: "Prof. Iyer", topics: ["Integration", "ILATE", "Definite Integrals"] },
  { id: "cs4", date: "2026-05-10", subject: "Physics", title: "Work, Energy & Power", summary: "Work-energy theorem, conservative vs non-conservative forces. Solved 8 JEE Advanced problems on variable force work calculation.", teacher: "Prof. Sharma", topics: ["Work-Energy Theorem", "Conservative Forces", "Power"] },
  { id: "cs5", date: "2026-05-10", subject: "Chemistry", title: "Periodic Table Trends", summary: "Ionization energy, electron affinity, electronegativity trends. Anomalies in d-block and p-block elements discussed.", teacher: "Dr. Gupta", topics: ["Periodic Trends", "Ionization Energy", "Electronegativity"] },
  { id: "cs6", date: "2026-05-09", subject: "Math", title: "Matrices & Determinants", summary: "Properties of determinants, cofactor expansion, Cramer's rule. Solved matrix equation problems for JEE Main pattern.", teacher: "Prof. Iyer", topics: ["Matrices", "Determinants", "Cramer's Rule"] },
  { id: "cs7", date: "2026-05-09", subject: "Physics", title: "Rotational Mechanics", summary: "Moment of inertia, torque, angular momentum conservation. Rolling without slipping problems and combined translation-rotation.", teacher: "Prof. Sharma", topics: ["Moment of Inertia", "Torque", "Angular Momentum"] },
];

const seedAssignments: Assignment[] = [
  { id: "a1", title: "Newton's Laws Problem Set", subject: "Physics", description: "Solve 15 problems on constraint motion, pulleys, and inclined planes. Include free body diagrams for each.", dueDate: "2026-05-15", createdBy: "Prof. Sharma", createdAt: "2026-05-12", status: "pending" },
  { id: "a2", title: "Organic Chemistry Worksheet", subject: "Chemistry", description: "Complete the reaction mechanism worksheet — write full arrow-pushing mechanisms for all 10 reactions.", dueDate: "2026-05-14", createdBy: "Dr. Gupta", createdAt: "2026-05-11", status: "pending" },
  { id: "a3", title: "Integration Practice", subject: "Math", description: "Solve all 20 integration problems from Chapter 7. Show complete working using ILATE and substitution methods.", dueDate: "2026-05-16", createdBy: "Prof. Iyer", createdAt: "2026-05-11", status: "pending" },
  { id: "a4", title: "Periodic Table Quiz Prep", subject: "Chemistry", description: "Memorize ionization energies of first 30 elements. Prepare a comparison chart of Group 1 vs Group 17.", dueDate: "2026-05-13", createdBy: "Dr. Gupta", createdAt: "2026-05-10", status: "submitted" },
];

const seedTests: PracticeTest[] = [
  {
    id: "t1", title: "Physics — Mechanics Quick Test", subject: "Physics", difficulty: "medium", duration: 15,
    questions: [
      { id: "q1", question: "A block of mass 5 kg is placed on a frictionless surface. A force of 20 N is applied horizontally. What is the acceleration?", options: ["2 m/s²", "4 m/s²", "5 m/s²", "10 m/s²"], correctIndex: 1, explanation: "F = ma → a = F/m = 20/5 = 4 m/s²" },
      { id: "q2", question: "A ball is thrown vertically upward with velocity 20 m/s. Maximum height reached is (g = 10 m/s²):", options: ["10 m", "20 m", "30 m", "40 m"], correctIndex: 1, explanation: "v² = u² - 2gh → h = u²/2g = 400/20 = 20 m" },
      { id: "q3", question: "Two forces of 3N and 4N act at right angles. The resultant force is:", options: ["1 N", "5 N", "7 N", "12 N"], correctIndex: 1, explanation: "R = √(3² + 4²) = √25 = 5 N" },
      { id: "q4", question: "A car moving at 72 km/h is brought to rest in 5 seconds. The deceleration is:", options: ["4 m/s²", "14.4 m/s²", "2 m/s²", "10 m/s²"], correctIndex: 0, explanation: "72 km/h = 20 m/s. a = (0-20)/5 = -4 m/s²" },
      { id: "q5", question: "The work done by gravity on a 2 kg object falling 10 m is (g = 10 m/s²):", options: ["20 J", "100 J", "200 J", "50 J"], correctIndex: 2, explanation: "W = mgh = 2 × 10 × 10 = 200 J" },
    ],
  },
  {
    id: "t2", title: "Chemistry — Atomic Structure", subject: "Chemistry", difficulty: "easy", duration: 10,
    questions: [
      { id: "q6", question: "The number of electrons in Na⁺ ion is:", options: ["11", "10", "12", "23"], correctIndex: 1, explanation: "Na has 11 electrons. Na⁺ loses one → 10 electrons." },
      { id: "q7", question: "Which quantum number determines the shape of an orbital?", options: ["n", "l", "m", "s"], correctIndex: 1, explanation: "Azimuthal quantum number (l) determines orbital shape: s, p, d, f." },
      { id: "q8", question: "The maximum number of electrons in the 3rd shell is:", options: ["8", "18", "32", "2"], correctIndex: 1, explanation: "Max electrons = 2n² = 2(3)² = 18" },
      { id: "q9", question: "Hund's rule states that:", options: ["Electrons pair up first", "Electrons fill orbitals singly first", "Higher orbitals fill first", "None"], correctIndex: 1, explanation: "Hund's rule: electrons occupy degenerate orbitals singly before pairing." },
      { id: "q10", question: "Which element has the highest first ionization energy?", options: ["Li", "Na", "He", "Cs"], correctIndex: 2, explanation: "He (noble gas) has the highest IE due to stable filled 1s² configuration." },
    ],
  },
  {
    id: "t3", title: "Math — Calculus Basics", subject: "Math", difficulty: "medium", duration: 12,
    questions: [
      { id: "q11", question: "The derivative of x³ + 2x is:", options: ["3x² + 2", "x² + 2", "3x + 2", "3x²"], correctIndex: 0, explanation: "d/dx(x³) = 3x², d/dx(2x) = 2 → 3x² + 2" },
      { id: "q12", question: "∫ 2x dx = ?", options: ["x²", "x² + C", "2x² + C", "x + C"], correctIndex: 1, explanation: "∫ 2x dx = 2·(x²/2) + C = x² + C" },
      { id: "q13", question: "The value of lim(x→0) sin(x)/x is:", options: ["0", "1", "∞", "undefined"], correctIndex: 1, explanation: "This is a standard limit: lim(x→0) sin(x)/x = 1" },
      { id: "q14", question: "If f(x) = eˣ, then f'(x) = ?", options: ["xeˣ⁻¹", "eˣ", "eˣ⁺¹", "1"], correctIndex: 1, explanation: "The derivative of eˣ is eˣ itself." },
      { id: "q15", question: "∫₀¹ x² dx = ?", options: ["1/2", "1/3", "1", "2/3"], correctIndex: 1, explanation: "∫₀¹ x² dx = [x³/3]₀¹ = 1/3 - 0 = 1/3" },
    ],
  },
];

const seedLeaderboard: LeaderboardEntry[] = [
  { rank: 1, studentName: "Arjun Patel", score: 940, testsCompleted: 12, streak: 7 },
  { rank: 2, studentName: "Priya Singh", score: 885, testsCompleted: 11, streak: 5 },
  { rank: 3, studentName: "Rahul Verma", score: 820, testsCompleted: 10, streak: 4 },
  { rank: 4, studentName: "Ananya Sharma", score: 790, testsCompleted: 9, streak: 6 },
  { rank: 5, studentName: "Karan Mehta", score: 755, testsCompleted: 10, streak: 3 },
  { rank: 6, studentName: "Sneha Reddy", score: 710, testsCompleted: 8, streak: 2 },
  { rank: 7, studentName: "Vikram Joshi", score: 680, testsCompleted: 9, streak: 4 },
  { rank: 8, studentName: "Neha Agarwal", score: 650, testsCompleted: 7, streak: 1 },
];

const seedNotifications: AppNotification[] = [
  { id: "n1", title: "New Assignment", message: "Newton's Laws Problem Set has been assigned by Prof. Sharma", type: "assignment", createdAt: "2026-05-12T10:00:00", read: false },
  { id: "n2", title: "Test Available", message: "Physics Mechanics Quick Test is now available", type: "test", createdAt: "2026-05-12T09:00:00", read: false },
  { id: "n3", title: "Class Tomorrow", message: "Chemistry class on Chemical Bonding at 10 AM", type: "announcement", createdAt: "2026-05-11T18:00:00", read: true },
  { id: "n4", title: "Feedback Received", message: "Prof. Sharma left feedback on your assignment", type: "feedback", createdAt: "2026-05-11T15:00:00", read: true },
];

const seedFeedback: FeedbackEntry[] = [
  { id: "f1", from: "Arjun Patel", fromRole: "student", to: "Prof. Sharma", message: "Great explanation of pseudo forces today! The examples really helped.", rating: 5, createdAt: "2026-05-12T11:00:00" },
  { id: "f2", from: "Prof. Sharma", fromRole: "teacher", to: "Arjun Patel", message: "Excellent work on the problem set. Keep improving your FBD drawings.", rating: 4, createdAt: "2026-05-11T16:00:00" },
  { id: "f3", from: "Priya Singh", fromRole: "student", to: "Dr. Gupta", message: "Could you please cover more SN1 examples in the next class?", rating: 4, createdAt: "2026-05-11T12:00:00" },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  STORE HELPERS — localStorage backed
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function get<T>(key: string, seed: T): T {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(`cc-${key}`);
    return raw ? JSON.parse(raw) : seed;
  } catch { return seed; }
}

function set<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`cc-${key}`, JSON.stringify(data));
}

// ── Public API ────────────────────────────────

export function getClassSummaries(): ClassSummary[] {
  const stored = get("summaries", seedSummaries);
  // Also merge any auto-saved summaries from live class sessions
  try {
    const autoSaved = JSON.parse(localStorage.getItem('cc-summaries') || '[]') as ClassSummary[];
    const merged = [...stored];
    autoSaved.forEach((s: ClassSummary) => {
      if (!merged.find(m => m.id === s.id)) merged.unshift(s);
    });
    return merged;
  } catch { return stored; }
}

export function getAssignments(): Assignment[] { return get("assignments", seedAssignments); }
export function addAssignment(a: Assignment) {
  const list = getAssignments();
  list.unshift(a);
  set("assignments", list);
}
export function updateAssignment(id: string, updates: Partial<Assignment>) {
  const list = getAssignments().map((a) => (a.id === id ? { ...a, ...updates } : a));
  set("assignments", list);
}

export function getPracticeTests(): PracticeTest[] { return get("tests", seedTests); }

export function getTestResults(): TestResult[] { return get("testResults", []); }
export function addTestResult(r: TestResult) {
  const list = getTestResults();
  list.unshift(r);
  set("testResults", list);
}

export function getLeaderboard(): LeaderboardEntry[] { return get("leaderboard", seedLeaderboard); }
export function updateLeaderboard(name: string, addScore: number) {
  const lb = getLeaderboard();
  const existing = lb.find((e) => e.studentName === name);
  if (existing) {
    existing.score += addScore;
    existing.testsCompleted += 1;
    existing.streak += 1;
  } else {
    lb.push({ rank: 0, studentName: name, score: addScore, testsCompleted: 1, streak: 1 });
  }
  lb.sort((a, b) => b.score - a.score);
  lb.forEach((e, i) => (e.rank = i + 1));
  set("leaderboard", lb);
}

export function getNotifications(): AppNotification[] { return get("notifications", seedNotifications); }
export function addNotification(n: AppNotification) {
  const list = getNotifications();
  list.unshift(n);
  set("notifications", list);
}
export function markNotificationRead(id: string) {
  const list = getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
  set("notifications", list);
}
export function markAllRead() {
  const list = getNotifications().map((n) => ({ ...n, read: true }));
  set("notifications", list);
}

export function getFeedback(): FeedbackEntry[] { return get("feedback", seedFeedback); }
export function addFeedback(f: FeedbackEntry) {
  const list = getFeedback();
  list.unshift(f);
  set("feedback", list);
}

// ── User Management ──────────────────────────

export function getUsers(): User[] {
  const stored = get("users", [] as User[]);
  // Always ensure seed users exist (so default logins always work)
  const merged = [...seedUsers];
  stored.forEach(u => {
    if (!merged.find(m => m.id === u.id)) merged.push(u);
  });
  return merged;
}
export function addUser(u: User) {
  const list = getUsers();
  list.push(u);
  set("users", list);
}
export function deleteUser(id: string) {
  const list = getUsers().filter(u => u.id !== id);
  set("users", list);
}

// ── Deletion (Admin only) ────────────────────

export function deleteSummary(id: string) {
  const list = getClassSummaries().filter(s => s.id !== id);
  set("summaries", list);
}

export function deleteAssignment(id: string) {
  const list = getAssignments().filter(a => a.id !== id);
  set("assignments", list);
}

export function deleteTest(id: string) {
  const list = getPracticeTests().filter(t => t.id !== id);
  set("tests", list);
}

