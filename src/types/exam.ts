export type SubjectId =
  | 'verbal_expr'
  | 'verbal_comp'
  | 'creative_math'
  | 'data_interp';

export interface SubjectMeta {
  id: SubjectId;
  order: number;
  name: string;
  questionCount: number;
  timeLimitSeconds: number;
  description: string;
  tips: string;
}

export interface TableData {
  title?: string;
  unit?: string;
  headers: string[];
  rows: (string | number)[][];
  note?: string;
}

export interface ChartSeries {
  name: string;
  values: number[];
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie';
  title: string;
  unit?: string;
  labels: string[];
  series: ChartSeries[];
  note?: string;
}

export interface Question {
  id: string;
  subject: SubjectId;
  number: number; // 1-based within subject (1..30 or 1..20)
  subType: string; // e.g., '유의어', '내용일치', '거속시', '증감률'
  prompt: string; // Main question stem
  passage?: string; // Reading passage or boxed context
  bogi?: string[]; // Optional <보기> items e.g. ['ㄱ. ...', 'ㄴ. ...', 'ㄷ. ...']
  table?: TableData;
  chart?: ChartData;
  options: [string, string, string, string, string]; // 5지선다
  answer: 0 | 1 | 2 | 3 | 4; // 0-indexed (0 = ①, 4 = ⑤)
  explanation: string;
}

export interface MockExam {
  id: number; // 1..5
  title: string;
  subtitle: string;
  questions: Question[]; // 100 questions total (30 + 20 + 30 + 20)
}

export type ExamMode = 'practice' | 'real';
export type ViewMode = 'single' | 'multi';

export interface ExamConfig {
  mockId: number;
  mode: ExamMode;
  viewMode: ViewMode;
  selectedSubjects: SubjectId[]; // In real mode, always all 4 in order
  allowBackInRealSingle: boolean; // False = strict SKCT rule (no going back in single-question mode)
  autoClearScratchOnNext: boolean; // Real SKCT clears notepad/drawing on next question
  customTimeMultiplier: number; // 1 = real time, 0 = unlimited (practice only)
}

export interface SubjectResult {
  subject: SubjectId;
  total: number;
  answered: number;
  correct: number;
  wrong: number;
  unanswered: number;
  timeSpentSeconds: number;
  timeLimitSeconds: number;
}

export interface ExamAttemptRecord {
  id: string;
  mockId: number;
  mockTitle: string;
  mode: ExamMode;
  viewMode: ViewMode;
  completedAt: string;
  answers: Record<string, number | null>; // question.id -> 0..4 or null
  bookmarks: Record<string, boolean>;
  subjectResults: SubjectResult[];
  totalCorrect: number;
  totalWrong: number;
  totalUnanswered: number;
  totalQuestions: number;
  estimatedNetScore: number; // raw correct - wrong * 0.25 (penalty simulation)
  totalTimeSpentSeconds: number;
}
