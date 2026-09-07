import { Exam, UniversityApplication, ChecklistItem } from "@/types";

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
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:Yarın Sınavın Var! ${exam.title}`,
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-P3D",
    "ACTION:DISPLAY",
    `DESCRIPTION:3 Gün Kaldı: ${exam.title}`,
    "END:VALARM",
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

export function createUniGoogleCalendarUrl(app: UniversityApplication, studentName: string): string {
  if (!app.deadline) return "";
  const [year, month, day] = app.deadline.split("-");
  const startIso = `${year}${month}${day}T090000`;
  const endIso = `${year}${month}${day}T120000`;

  const title = encodeURIComponent(`🏛️ ${app.universityName} Başvuru Deadline - ${studentName}`);
  const details = encodeURIComponent(
    `Öğrenci: ${studentName}\nÜniversite: ${app.universityName}\nProgram: ${app.program || "-"}\nÜlke: ${app.country || "-"}\nDurum: ${app.status}`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}`;
}

export function downloadUniIcsFile(app: UniversityApplication, studentName: string): void {
  if (!app.deadline) return;
  const [year, month, day] = app.deadline.split("-");
  const startIso = `${year}${month}${day}T090000`;
  const endIso = `${year}${month}${day}T120000`;

  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const uid = `uni-deadline-${app.id}-${Date.now()}@fio-exam.app`;

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
    `SUMMARY:🏛️ ${app.universityName} Başvuru Deadline - ${studentName}`,
    `DESCRIPTION:Öğrenci: ${studentName}\\nÜniversite: ${app.universityName}\\nProgram: ${app.program || "-"}\\nÜlke: ${app.country || "-"}\\nDurum: ${app.status}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-P7D",
    "ACTION:DISPLAY",
    `DESCRIPTION:1 Hafta Kaldı: ${app.universityName} Başvuru Deadline`,
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:Yarın Son Gün: ${app.universityName} Başvuru Deadline`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${studentName.replace(/\s+/g, "_")}_${app.universityName.replace(/\s+/g, "_")}_Deadline.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function createChecklistGoogleCalendarUrl(item: ChecklistItem, studentName: string): string {
  if (!item.dueDate) return "";
  const [year, month, day] = item.dueDate.split("-");
  const startIso = `${year}${month}${day}T090000`;
  const endIso = `${year}${month}${day}T100000`;

  const title = encodeURIComponent(`✅ ${item.title} - ${studentName}`);
  const details = encodeURIComponent(
    `Öğrenci: ${studentName}\nGörev / Belge: ${item.title}\nDurum: ${item.completed ? "Tamamlandı" : "Beklemede"}`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}`;
}

export function downloadChecklistIcsFile(item: ChecklistItem, studentName: string): void {
  if (!item.dueDate) return;
  const [year, month, day] = item.dueDate.split("-");
  const startIso = `${year}${month}${day}T090000`;
  const endIso = `${year}${month}${day}T100000`;

  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const uid = `chk-${item.id}-${Date.now()}@fio-exam.app`;

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
    `SUMMARY:✅ ${item.title} - ${studentName}`,
    `DESCRIPTION:Öğrenci: ${studentName}\\nGörev: ${item.title}\\nDurum: ${item.completed ? "Tamamlandı" : "Beklemede"}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:Yarın Son Gün: ${item.title}`,
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-P3D",
    "ACTION:DISPLAY",
    `DESCRIPTION:3 Gün Kaldı: ${item.title}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${studentName.replace(/\s+/g, "_")}_${item.title.replace(/[^a-zA-Z0-9]/g, "_")}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
