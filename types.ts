
export interface Student {
  id: string;
  name: string;
  grade: string;
  classes: string[];
  attendance: AttendanceRecord[];
  behaviors: BehaviorRecord[];
  grades: GradeRecord[];
  parentPhone?: string;
  avatar?: string;
  spentCoins?: number; 
  groupId?: string | null; // معرف الفريق (ديناميكي)
}

export interface Group {
  id: string;
  name: string;
  color: string; // Tailwind color
}

export interface AttendanceRecord {
  date: string;
  status: AttendanceStatus;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'truant';

export interface BehaviorRecord {
  id: string;
  date: string;
  type: BehaviorType;
  description: string;
  points: number;
  semester?: '1' | '2';
}

export type BehaviorType = 'positive' | 'negative';

export interface GradeRecord {
  id: string;
  subject: string;
  category: string; // "short_test_1", "project", etc.
  score: number;
  maxScore: number;
  date: string;
  semester?: '1' | '2';
}

export interface ScheduleDay {
  dayName: string;
  periods: string[]; // Array of class names or subjects for 8 periods
}

export interface PeriodTime {
  periodNumber: number;
  startTime: string; // "07:30"
  endTime: string;   // "08:10"
}

export interface AssessmentTool {
  id: string;
  name: string;
  maxScore: number;
}

// --- Electron Bridge Type Definition ---
declare global {
  interface Window {
    electron?: {
      openExternal: (url: string) => Promise<void>;
    };
  }
}
