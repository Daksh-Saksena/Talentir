export interface StudentProfile {
  id?: string;
  name: string;
  grade?: string;
  seat?: string;
  descriptor?: number[] | null;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id?: string;
  studentId: string;
  timestamp: string;
  status: string;
  label?: string;
  confidence?: number;
}

export interface AttentionRecord {
  id?: string;
  studentId: string;
  timestamp: string;
  score: number;
  orientation: string;
  gaze: string;
  remark?: string;
}

export interface InteractionRecord {
  id?: string;
  studentId: string;
  timestamp: string;
  duration: number;
  speechLabel?: string;
  notes?: string;
}

export interface SeatingPlan {
  id?: string;
  name: string;
  createdAt?: string;
  layout: Array<{ seat: string; studentId: string }>;
}
