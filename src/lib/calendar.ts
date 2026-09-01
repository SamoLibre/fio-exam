import { Exam } from "@/types";

export function createGoogleCalendarUrl(exam: Exam): string {
  const [year, month, day] = exam.examDate.split("-");
  const time = exam.examTime ? exam.examTime.replace(":", "") : "0900";
  const startIso = `${year}${month}${day}T${time}00`;
  
  // End 3 hours later
  const hour = parseInt(time.substring(0, 2), 10) + 3;
  const endHourStr = (hour < 10 ? `0${hour}` : `${hour}`).substring(0, 2);
  const endIso = `${year}${month}${day}T${endHourStr}${time.substring(2)}00`;

  const title = encodeURIComponent(`${exam.title} - ${exam.studentName} Sınavı`);
  const details = encodeURIComponent(
    `Öğrenci: ${exam.studentName}\nSınav: ${exam.title} (${exam.type})\nHedef Puan: ${exam.targetScore || "-"}\nLokasyon: ${exam.location || "-"}\nNotlar: ${exam.notes || "-"}`
  );
  const location = encodeURIComponent(exam.location || "");

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
}

export function downloadIcsFile(exam: Exam): void {
  const [year, month, day] = exam.examDate.split("-");
  const time = exam.examTime ? exam.examTime.replace(":", "") : "0900";
  const startIso = `${year}${month}${day}T${time}00`;

  const hour = parseInt(time.substring(0, 2), 10) + 3;
  const endHourStr = (hour < 10 ? `0${hour}` : `${hour}`).substring(0, 2);
  const endIso = `${year}${month}${day}T${endHourStr}${time.substring(2)}00`;

  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const uid = `exam-${exam.id}-${Date.now()}@fio-exam.app`;

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FIO Exam//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${startIso}`,
    `DTEND:${endIso}`,
    `SUMMARY:${exam.title} - ${exam.studentName}`,
    `DESCRIPTION:Öğrenci: ${exam.studentName}\\nSınav: ${exam.title}\\nHedef Puan: ${exam.targetScore || "-"}\\nNotlar: ${exam.notes || "-"}`,
    `LOCATION:${exam.location || "Sınav Merkezi"}`,
    "STATUS:CONFIRMED",
    // 1 Day before Alarm
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:Yarın Sınavın Var! ${exam.title}`,
    "END:VALARM",
    // 3 Days before Alarm
    "BEGIN:VALARM",
    "TRIGGER:-P3D",
    "ACTION:DISPLAY",
    `DESCRIPTION:3 Gün Kaldı: ${exam.title}`,
    "END:VALARM",
    // 1 Week before Alarm
    "BEGIN:VALARM",
    "TRIGGER:-P7D",
    "ACTION:DISPLAY",
    `DESCRIPTION:1 Hafta Kaldı: ${exam.title}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${exam.studentName.replace(/\s+/g, "_")}_${exam.type}_Sinav.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
