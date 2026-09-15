// ============================================================
// Planify — Type Definitions
// ============================================================

// --- Database Row Types ---

export interface Profile {
  id: string;
  name: string;
  email: string;
  timezone: string;
  email_notifications: boolean;
  theme: "system" | "light" | "dark";
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  due_time: string | null;
  completed: boolean;
  rollback_daily: boolean;
  recurring_task_id: string | null;
  task_date: string; // YYYY-MM-DD
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringTask {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  due_time: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  profile_id: string;
  title: string;
  content: string;
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  profile_id: string;
  file_name: string;
  file_url: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: string;
  profile_id: string;
  notification_type: "morning_email" | "completion_email";
  notification_date: string; // YYYY-MM-DD
  sent_at: string;
}

// --- Form/Input Types ---

export interface CreateProfileInput {
  name: string;
  email: string;
  timezone: string;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  timezone?: string;
  email_notifications?: boolean;
  theme?: "system" | "light" | "dark";
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  due_time?: string;
  rollback_daily: boolean;
  task_date: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  priority?: "low" | "medium" | "high";
  due_time?: string | null;
  completed?: boolean;
  rollback_daily?: boolean;
}

export interface CreateNoteInput {
  title: string;
  content?: string;
  tags?: string[];
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
  is_pinned?: boolean;
}

// --- API Response Types ---

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  remaining: number;
  percentage: number;
}

export interface ProductivityStats {
  today: TaskStats;
  weeklyRate: number;
  monthlyRate: number;
  streak: number;
  totalCompleted: number;
  activeRecurring: number;
}

// --- UI Types ---

export type TaskFilter = "all" | "active" | "completed";
export type TaskSort = "sort_order" | "priority" | "due_time";
export type NoteSort = "recent" | "alphabetical";
export type DocumentSort = "recent" | "name" | "size";
