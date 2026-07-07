// ──────────────────────────────────────────────
// User & platform types
// ──────────────────────────────────────────────

export type Role = "student" | "teacher" | "admin";

export interface User {
  id: string;
  name: string;
  role: Role;
  pin: string; // 4-digit PIN
}

export interface ClassSummary {
  id: string;
  date: string;
  subject: string;
  title: string;
  summary: string;
  teacher: string;
  topics: string[];
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  createdBy: string;
  createdAt: string;
  status: "pending" | "submitted" | "graded";
  grade?: number;
}

export interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface PracticeTest {
  id: string;
  title: string;
  subject: string;
  difficulty: "easy" | "medium" | "hard";
  questions: TestQuestion[];
  duration: number; // minutes
}

export interface TestResult {
  testId: string;
  studentName: string;
  score: number;
  total: number;
  completedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  studentName: string;
  score: number;
  testsCompleted: number;
  streak: number;
}

export interface FeedbackEntry {
  id: string;
  from: string;
  fromRole: Role;
  to: string;
  message: string;
  rating: number;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "assignment" | "test" | "announcement" | "feedback";
  createdAt: string;
  read: boolean;
}
