import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

// ============================================================
// Planify — Utility Functions
// ============================================================

/** Merge Tailwind classes with conflict resolution */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Get dynamic greeting based on current hour */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

/** Format date as "Monday, September 14" */
export function formatDisplayDate(date: Date = new Date()): string {
  return format(date, "EEEE, MMMM d");
}

/** Format date as YYYY-MM-DD for database queries */
export function formatDateKey(date: Date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

export function formatTime(time: string | null): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export const formatDueTime = formatTime;

/** Format file size for display */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/** Get file type icon name based on MIME type */
export function getFileIcon(fileType: string): string {
  if (fileType.startsWith("image/")) return "image";
  if (fileType === "application/pdf") return "file-text";
  if (
    fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileType === "application/msword"
  )
    return "file-type";
  if (fileType === "text/plain") return "file";
  return "file";
}

/** Priority color mapping */
export function getPriorityColor(
  priority: "low" | "medium" | "high"
): { bg: string; text: string; dot: string } {
  switch (priority) {
    case "high":
      return {
        bg: "bg-destructive/10",
        text: "text-destructive",
        dot: "bg-destructive",
      };
    case "medium":
      return {
        bg: "bg-warning/10",
        text: "text-warning",
        dot: "bg-warning",
      };
    case "low":
      return {
        bg: "bg-success/10",
        text: "text-success",
        dot: "bg-success",
      };
  }
}

/** Curated motivational quotes */
const QUOTES = [
  "Small daily improvements lead to stunnning results.",
  "Your future is created by what you do today.",
  "The secret of getting ahead is getting started.",
  "Progress, not perfection.",
  "Stay focused and never give up.",
  "One task at a time, one day at a time.",
  "Discipline is the bridge between goals and achievement.",
  "Make each day your masterpiece.",
  "Success is the sum of small efforts, repeated.",
  "Don't watch the clock; do what it does — keep going.",
  "You don't have to be great to start, but you have to start to be great.",
  "Productivity is never an accident. It is the result of commitment.",
  "Every accomplishment starts with the decision to try.",
  "Focus on being productive instead of busy.",
  "The only way to do great work is to love what you do.",
];

/** Get a daily rotating motivational quote */
export function getDailyQuote(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000
  );
  return QUOTES[dayOfYear % QUOTES.length];
}

/** Detect user timezone, defaulting to Asia/Kolkata */
export function detectTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || "Asia/Kolkata";
  } catch {
    return "Asia/Kolkata";
  }
}

/** Debounce function */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
