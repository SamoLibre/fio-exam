"use client";

import React, { useState } from "react";
import { Exam, Student, UniversityApplication } from "@/types";
import { 
  calculateDaysLeft, 
  formatTurkishDate, 
  getAlarmBadge 
} from "@/lib/storage";
import { 
  createGoogleCalendarUrl, 
  downloadIcsFile,
  createUniGoogleCalendarUrl,
  downloadUniIcsFile
} from "@/lib/calendar";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Target, 
  CalendarPlus, 
  Download,
  X,
  Building2,
  GraduationCap,
  Sparkles,
  Edit3
} from "lucide-react";

export interface CalendarEventItem {
  id: string;
  type: "exam" | "university_deadline";
  date: string;
  title: string;
  studentName: string;
  studentId?: string;
  exam?: Exam;
  application?: UniversityApplication;
}

interface CalendarViewProps {
  exams: Exam[];
  students?: Student[];
  onSelectExam?: (exam: Exam) => void;
  isStudentPortal?: boolean;
}

const DAYS_OF_WEEK = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

export const CalendarView: React.FC<CalendarViewProps> = ({
  exams,
  students = [],
  onSelectExam,
  isStudentPortal = false,
}) => {
  // Combine Exams and University Application Deadlines
  const examEvents: CalendarEventItem[] = (exams || []).map((exam) => ({
    id: `exam-${exam.id}`,
    type: "exam",
    date: exam.examDate,
    title: exam.title,
    studentName: exam.studentName,
    studentId: exam.studentId,
    exam: exam,
  }));

  const uniEvents: CalendarEventItem[] = (students || []).flatMap((student) =>
    (student.applications || [])
      .filter((app) => !!app.deadline && app.deadline.trim() !== "")
      .map((app) => ({
        id: `app-${app.id}-${student.id}`,
        type: "university_deadline",
        date: app.deadline!.trim(),
        title: `${app.universityName} Deadline`,
        studentName: student.name,
        studentId: student.id,
        application: app,
      }))
  );

  const allEvents: CalendarEventItem[] = [...examEvents, ...uniEvents];

  const now = new Date();
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    // Find closest upcoming event (exam or university deadline)
    const upcoming = allEvents
      .filter((e) => calculateDaysLeft(e.date) >= 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (upcoming.length > 0) {
      const parts = upcoming[0].date.split("-");
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
      }
    }
    return new Date();
  });

  const [selectedDayData, setSelectedDayData] = useState<{
    date: string;
    events: CalendarEventItem[];
  } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Calculate calendar grid days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // In JS, Sunday is 0. We want Monday to be 0 (0: Mon, 1: Tue, ..., 6: Sun)
  let startDay = firstDayOfMonth.getDay() - 1;
  if (startDay === -1) startDay = 6; // Sunday

  const totalDays = lastDayOfMonth.getDate();

  // Prev month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevMonthDays = [];
  for (let i = startDay - 1; i >= 0; i--) {
    prevMonthDays.push({
      day: prevMonthLastDay - i,
      month: month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false,
    });
  }

  // Current month days
  const currentMonthDays = [];
  for (let i = 1; i <= totalDays; i++) {
    currentMonthDays.push({
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true,
    });
  }

  // Next month padding
  const totalCells = prevMonthDays.length + currentMonthDays.length;
  const remainingCells = (7 - (totalCells % 7)) % 7;
  const nextMonthDays = [];
  for (let i = 1; i <= remainingCells; i++) {
    nextMonthDays.push({
      day: i,
      month: month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false,
    });
  }

  const allCalendarDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  // Helper to format YYYY-MM-DD
  const formatDayKey = (y: number, m: number, d: number) => {
    const mm = m + 1 < 10 ? `0${m + 1}` : `${m + 1}`;
    const dd = d < 10 ? `0${d}` : `${d}`;
    return `${y}-${mm}-${dd}`;
  };

  const getExamColor = (type: string) => {
    switch (type) {
      case "IELTS":
        return "bg-rose-500 text-white border-rose-600";
      case "SAT":
        return "bg-blue-600 text-white border-blue-700";
      case "AP":
        return "bg-purple-600 text-white border-purple-700";
      case "TOEFL":
        return "bg-emerald-600 text-white border-emerald-700";
      case "DUOLINGO":
        return "bg-amber-500 text-white border-amber-600";
      default:
        return "bg-zinc-700 text-white border-zinc-800";
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "kabul":
        return { label: "Kabul Aldı 🎉", color: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800" };
      case "basvuruldu":
        return { label: "Başvuruldu 📬", color: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800" };
      case "beklemede":
        return { label: "Beklemede ⏳", color: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800" };
      case "red":
        return { label: "Red", color: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800" };
      default:
        return { label: "Hazırlanıyor 📝", color: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700" };
    }
  };

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Calendar Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
              <span>{MONTH_NAMES[month]} {year}</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isStudentPortal 
                ? "Sınav takviminiz ve üniversite başvuru deadline'larınız" 
                : "Tüm sınavlar, alarmlar ve üniversite başvuru deadline'ları"}
            </p>
          </div>
        </div>

        {/* Legend / Info Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
            <span>Sınavlar</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>🏛️ Üni Deadline</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={goToToday}
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            Bugün
          </button>
          <button
            onClick={prevMonth}
            className="rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            title="Önceki Ay"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextMonth}
            className="rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            title="Sonraki Ay"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-bold text-zinc-400 dark:text-zinc-500">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="mt-1 grid grid-cols-7 gap-1 sm:gap-1.5">
        {allCalendarDays.map((item, idx) => {
          const dayKey = formatDayKey(item.year, item.month, item.day);
          const dayEvents = allEvents.filter((e) => e.date === dayKey);
          const isToday =
            now.getDate() === item.day &&
            now.getMonth() === item.month &&
            now.getFullYear() === item.year;

          return (
            <div
              key={idx}
              onClick={() => {
                if (dayEvents.length > 0) {
                  setSelectedDayData({ date: dayKey, events: dayEvents });
                }
              }}
              className={`min-h-[75px] sm:min-h-[95px] rounded-xl sm:rounded-2xl border p-1.5 sm:p-2 transition-all flex flex-col justify-between ${
                dayEvents.length > 0
                  ? "cursor-pointer bg-blue-50/40 hover:bg-blue-50/80 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/40 shadow-xs"
                  : "bg-white hover:bg-zinc-50 border-zinc-100 dark:bg-zinc-900/60 dark:border-zinc-800/80"
              } ${!item.isCurrentMonth ? "opacity-35" : "opacity-100"} ${
                isToday ? "ring-2 ring-blue-500 font-bold" : ""
              }`}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg text-xs font-bold ${
                    isToday
                      ? "bg-blue-600 text-white"
                      : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {item.day}
                </span>

                {dayEvents.length > 0 && (
                  <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </div>

              {/* Event Badges on this Day */}
              <div className="mt-1 space-y-1 overflow-hidden">
                {dayEvents.map((event) => {
                  if (event.type === "university_deadline" && event.application) {
                    return (
                      <div
                        key={event.id}
                        className="truncate rounded-md px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold shadow-xs bg-amber-500 text-white border border-amber-600 hover:bg-amber-600 transition"
                        title={`🏛️ ${event.studentName}: ${event.application.universityName} Deadline`}
                      >
                        🏛️ {!isStudentPortal && `${event.studentName.split(" ")[0]}: `}
                        {event.application.universityName}
                      </div>
                    );
                  }

                  if (event.type === "exam" && event.exam) {
                    return (
                      <div
                        key={event.id}
                        className={`truncate rounded-md px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold shadow-xs ${getExamColor(
                          event.exam.type
                        )}`}
                        title={`${event.studentName} - ${event.title} (${event.exam.examTime || "09:00"})`}
                      >
                        {!isStudentPortal && `${event.studentName.split(" ")[0]}: `}
                        {event.title}
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Events Modal */}
      {selectedDayData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                <h3 className="font-extrabold text-zinc-900 dark:text-white">
                  {formatTurkishDate(selectedDayData.date)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDayData(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {selectedDayData.events.map((event) => {
                const daysLeft = calculateDaysLeft(event.date);
                const badge = getAlarmBadge(daysLeft);

                // 1. UNIVERSITY APPLICATION DEADLINE CARD
                if (event.type === "university_deadline" && event.application) {
                  const app = event.application;
                  const statusBadge = getStatusBadge(app.status);

                  return (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {!isStudentPortal && (
                            <div className="text-xs font-bold text-amber-700 dark:text-amber-400">
                              👤 {event.studentName}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-base font-extrabold text-zinc-900 dark:text-white mt-0.5">
                            <Building2 className="h-4 w-4 text-amber-600" />
                            <span>{app.universityName}</span>
                            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                              (Son Başvuru Tarihi)
                            </span>
                          </div>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                        {app.program && (
                          <div className="flex items-center gap-1.5 font-medium">
                            <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
                            <span>Bölüm: <strong>{app.program}</strong></span>
                          </div>
                        )}
                        {app.country && (
                          <div className="flex items-center gap-1.5 font-medium">
                            <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Ülke: <strong>{app.country}</strong></span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 font-medium sm:col-span-2">
                          <span>Durum:</span>
                          <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${statusBadge.color}`}>
                            {statusBadge.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
                        <a
                          href={createUniGoogleCalendarUrl(app, event.studentName)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition"
                        >
                          <CalendarPlus className="h-3.5 w-3.5" />
                          <span>Google Takvime Ekle</span>
                        </a>
                        <button
                          onClick={() => downloadUniIcsFile(app, event.studentName)}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Telefona Alarm İndir (.ics)</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                // 2. EXAM CARD
                if (event.type === "exam" && event.exam) {
                  const exam = event.exam;
                  return (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-800/60 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {!isStudentPortal && (
                            <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                              👤 {exam.studentName}
                            </div>
                          )}
                          <h4 className="text-base font-bold text-zinc-900 dark:text-white">
                            {exam.title} {exam.subType && `(${exam.subType})`}
                          </h4>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                        {exam.examTime && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-indigo-500" />
                            <span>Saat: <strong>{exam.examTime}</strong></span>
                          </div>
                        )}
                        {exam.targetScore && (
                          <div className="flex items-center gap-1.5">
                            <Target className="h-3.5 w-3.5 text-rose-500" />
                            <span>Hedef: <strong>{exam.targetScore}</strong></span>
                          </div>
                        )}
                        {exam.location && (
                          <div className="flex items-center gap-1.5 sm:col-span-2">
                            <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                            <span>{exam.location}</span>
                          </div>
                        )}
                      </div>

                      {exam.notes && (
                        <div className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                          <strong>Tavsiye/Not:</strong> {exam.notes}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60">
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={createGoogleCalendarUrl(exam)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                          >
                            <CalendarPlus className="h-3.5 w-3.5" />
                            <span>Google Takvime Ekle</span>
                          </a>
                          <button
                            onClick={() => downloadIcsFile(exam)}
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Telefona Alarm İndir (.ics)</span>
                          </button>
                        </div>

                        {onSelectExam && (
                          <button
                            onClick={() => {
                              setSelectedDayData(null);
                              onSelectExam(exam);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Düzenle</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
