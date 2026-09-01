import { Exam } from "@/types";
import { calculateDaysLeft } from "./storage";

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    alert("Tarayıcınız bildirim desteği sunmuyor.");
    return false;
  }
  
  if (Notification.permission === "granted") {
    return true;
  }
  
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export function sendBrowserNotification(title: string, options?: NotificationOptions): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "granted") {
    try {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          (registration as any).showNotification(title, {
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            vibrate: [200, 100, 200],
            ...options,
          });
        });
      } else {
        new Notification(title, {
          icon: "/icons/icon-192.png",
          ...options,
        });
      }
    } catch (e) {
      console.error("Bildirim gönderilemedi:", e);
    }
  }
}

export function checkAndSendExamAlarms(exams: Exam[]): void {
  if (typeof window === "undefined" || Notification.permission !== "granted") return;

  exams.forEach((exam) => {
    const daysLeft = calculateDaysLeft(exam.examDate);
    
    // If today is an alarm day (e.g. 0, 1, 3, 7, 14, 30)
    if (exam.alarms && exam.alarms.includes(daysLeft)) {
      let message = "";
      if (daysLeft === 0) {
        message = `Bugün ${exam.studentName} için ${exam.title} sınav günü! Başarılar dileriz! 🎯`;
      } else if (daysLeft === 1) {
        message = `Yarın ${exam.studentName} için ${exam.title} sınavı var! Son kontrolleri yapın. ⏳`;
      } else {
        message = `${exam.studentName} için ${exam.title} sınavına ${daysLeft} gün kaldı. 🔔`;
      }

      sendBrowserNotification(`🚨 Sınav Hatırlatıcısı: ${exam.title}`, {
        body: message,
        tag: `exam-${exam.id}-${daysLeft}`,
      });
    }
  });
}
