export type ExamType = 
  | 'IELTS' 
  | 'SAT' 
  | 'AP' 
  | 'TOEFL' 
  | 'DUOLINGO' 
  | 'GRE' 
  | 'GMAT' 
  | 'YÖS' 
  | 'DİĞER';

export type RegistrationStatus = 'registered' | 'planned' | 'completed' | 'cancelled';

export interface MockScore {
  id: string;
  date: string;
  score: string;
  note?: string;
}

export interface Exam {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  type: ExamType;
  subType?: string; // e.g. "Calculus BC" or "Academic"
  examDate: string; // ISO string YYYY-MM-DD
  examTime?: string; // HH:mm
  location?: string;
  targetScore?: string;
  currentScore?: string;
  registrationStatus: RegistrationStatus;
  notes?: string;
  alarms: number[]; // days before exam: [30, 14, 7, 3, 1, 0]
  mockScores?: MockScore[];
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  name: string;
  username: string;
  password?: string;
  avatarColor?: string;
  targetUniversity?: string;
  targetMajor?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

export interface UserSession {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'student';
  studentId?: string;
}

export interface AppData {
  students: Student[];
  exams: Exam[];
}
