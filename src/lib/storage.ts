import { AppData, DEFAULT_CHECKLIST_ITEMS, Exam, Student, UserSession } from "@/types";
import { initialData } from "./initialData";

const STORAGE_KEY = "fio_exam_data_v3";
const SESSION_KEY = "fio_exam_session_v3";

let globalMemoryData: AppData = { ...initialData };

export function getLocalData(): AppData {
  if (typeof window === "undefined") {
    return globalMemoryData;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Check if old v1 or v2 exists and migrate, or use initialData
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      return initialData;
    }
    const parsed: AppData = JSON.parse(raw);

    // Migration helper: ensure every student has applications and checklist
    if (parsed.students && Array.isArray(parsed.students)) {
      let needsSave = false;
      parsed.students = parsed.students.map((student) => {
        const initialMatch = initialData.students.find((s) => s.id === student.id);
        
        let apps = student.applications;
        if (!apps || apps.length === 0) {
          apps = initialMatch?.applications || [];
          needsSave = true;
        }

        let chk = student.checklist;
        if (!chk || chk.length === 0) {
          chk = initialMatch?.checklist || DEFAULT_CHECKLIST_ITEMS.map((title, idx) => ({
            id: `chk-mig-${idx}-${Date.now()}`,
            title,
            completed: false,
          }));
          needsSave = true;
        }

        return {
          ...student,
          applications: apps,
          checklist: chk,
        };
      });

      if (needsSave) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    }

    return parsed;
  } catch {
    return initialData;
  }
}

export function saveLocalData(data: AppData): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Local storage save error:", e);
    }
  }
  globalMemoryData = data;
}

export function getSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      // Check legacy session
      const legacy = localStorage.getItem("fio_exam_session_v1") || localStorage.getItem("oe_exam_tracker_session_v1");
      if (legacy) {
        localStorage.setItem(SESSION_KEY, legacy);
        return JSON.parse(legacy);
      }
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(session: UserSession | null): void {
  if (typeof window === "undefined") return;
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
  } else {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

export function calculateDaysLeft(dateStr: string): number {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatTurkishDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      weekday: "long",
    });
  } catch {
    return dateStr;
  }
}

export function getAlarmBadge(daysLeft: number): {
  color: string;
  label: string;
  isUrgent: boolean;
} {
  if (daysLeft < 0) {
    return { color: "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400", label: "Sınav Geçti", isUrgent: false };
  }
  if (daysLeft === 0) {
    return { color: "bg-red-500 text-white animate-pulse font-bold", label: "BUGÜN! 🚨", isUrgent: true };
  }
  if (daysLeft === 1) {
    return { color: "bg-red-500 text-white font-bold", label: "Yarın! ⚠️", isUrgent: true };
  }
  if (daysLeft <= 3) {
    return { color: "bg-orange-500 text-white font-bold", label: `${daysLeft} Gün Kaldı! ⏳`, isUrgent: true };
  }
  if (daysLeft <= 7) {
    return { color: "bg-amber-500 text-white font-medium", label: `${daysLeft} Gün Kaldı 🔔`, isUrgent: true };
  }
  if (daysLeft <= 30) {
    return { color: "bg-blue-500 text-white font-medium", label: `${daysLeft} Gün Kaldı 📅`, isUrgent: false };
  }
  return { color: "bg-emerald-500 text-white font-medium", label: `${daysLeft} Gün Var ✨`, isUrgent: false };
}
