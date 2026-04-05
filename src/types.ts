export type UserRole = 'admin' | 'student';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  approved: boolean;
}

export interface Reminder {
  id: string;
  date: string; // ISO date string
  title: string;
  description: string;
  createdBy: string;
}

export interface MockExam {
  id: string;
  title: string;
  date: string; // ISO date string
  pdfUrl: string;
  description: string;
}

export interface Submission {
  id: string;
  mockId: string;
  studentId: string;
  studentName: string;
  pdfUrl: string;
  status: 'pending' | 'checked';
  score?: number;
  feedback?: string;
  submittedAt: string; // ISO date-time string
}

export interface LeaderboardEntry {
  studentName: string;
  score: number;
}

export interface Leaderboard {
  id: string;
  mockId: string;
  rankings: LeaderboardEntry[];
}

export interface PasswordResetRequest {
  id: string;
  userId: string;
  userName: string;
  timestamp: string; // ISO date-time string
  status: 'pending' | 'approved' | 'denied';
}
