"use client";

import React, { useState } from "react";
import { Exam, UserSession } from "@/types";
import { 
  calculateDaysLeft, 
  formatTurkishDate, 
  getAlarmBadge 
} from "@/lib/storage";
import { 
  createGoogleCalendarUrl, 
  downloadIcsFile 
} from "@/lib/calendar";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Target, 
  Bell, 
  CalendarPlus, 
  Download, 
  Trash2, 
  Edit3, 
  PlusCircle, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2,
  TrendingUp,
  Award
} from "lucide-react";

interface ExamCardProps {
  exam: Exam;
  session: UserSession | null;
  onEdit?: (exam: Exam) => void;
  onDelete?: (examId: string) => void;
  onAddMock?: (examId: string) => void;
}

export const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  session,
  onEdit,
  onDelete,
  onAddMock,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const daysLeft = calculateDaysLeft(exam.examDate);
  const badge = getAlarmBadge(daysLeft);
  const isTeacher = session?.role === "admin";

  const getExamTypeColor = (type: string) => {
    switch (type) {
      case "IELTS":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900";
      case "SAT":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900";
      case "AP":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900";
      case "TOEFL":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900";
      default:
        return "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-zinc-900 ${
      daysLeft <= 3 && daysLeft >= 0 
        ? "border-red-300 ring-2 ring-red-400/20 dark:border-red-800" 
        : daysLeft <= 7 && daysLeft >= 0
        ? "border-amber-300 dark:border-amber-800"
        : "border-zinc-200 dark:border-zinc-800"
    }`}>
      {/* Top Banner: Student & Badge */}
      <div className="flex items-start justify-between gap-2">
        <div>
          {isTeacher && (
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              👤 {exam.studentName}
            </div>
          )}
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            {exam.title}
            {exam.subType && (
              <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                ({exam.subType})
              </span>
            )}
          </h3>
        </div>

        <div className="flex flex-col items-end gap-1">
          {/* Days Left Alarm Badge */}
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold shadow-xs ${badge.color}`}>
            {badge.label}
          </span>
          <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${getExamTypeColor(exam.type)}`}>
            {exam.type}
          </span>
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-sm text-zinc-600 dark:text-zinc-300">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {formatTurkishDate(exam.examDate)}
          </span>
        </div>

        {exam.examTime && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Saat: <strong className="text-zinc-900 dark:text-zinc-100">{exam.examTime}</strong></span>
          </div>
        )}

        {exam.targetScore && (
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>Hedef Puan: <strong className="text-zinc-900 dark:text-zinc-100">{exam.targetScore}</strong></span>
          </div>
        )}

        {exam.location && (
          <div className="flex items-center gap-2 truncate">
            <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate" title={exam.location}>{exam.location}</span>
          </div>
        )}
      </div>

      {/* Teacher Notes if any */}
      {exam.notes && (
        <div className="mt-3 rounded-xl bg-amber-50/70 p-3 text-xs text-amber-900 border border-amber-200/60 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/40">
          <div className="font-semibold flex items-center gap-1 mb-0.5">
            📝 Öğretmen Notu / Tavsiye:
          </div>
          <p className="leading-relaxed">{exam.notes}</p>
        </div>
      )}

      {/* Mock Scores Summary */}
      {exam.mockScores && exam.mockScores.length > 0 && (
        <div className="mt-3 rounded-xl bg-zinc-50 p-3 border border-zinc-200/80 dark:bg-zinc-800/50 dark:border-zinc-800">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
              Deneme Sınavları ({exam.mockScores.length})
            </span>
            <span className="text-blue-600 font-bold">
              Son: {exam.mockScores[exam.mockScores.length - 1].score}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {exam.mockScores.map((mock, idx) => (
              <span
                key={mock.id || idx}
                className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 shadow-xs border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700"
                title={`${mock.date}: ${mock.note || ""}`}
              >
                <Award className="h-3 w-3 text-amber-500" />
                {mock.score}
                <span className="text-[9px] text-zinc-400">({mock.date.substring(5)})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Alarm Settings Tag */}
      {exam.alarms && exam.alarms.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
          <Bell className="h-3.5 w-3.5 text-indigo-500" />
          <span>Kurulu Alarmlar: {exam.alarms.map(d => d === 0 ? "Sınav günü" : `${d} gün önce`).join(", ")}</span>
        </div>
      )}

      {/* Action Buttons Section */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800/80">
        {/* Calendar Sync Buttons */}
        <div className="flex items-center gap-1.5">
          <a
            href={createGoogleCalendarUrl(exam)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300"
            title="Google Takvime Ekle (Alarmlı)"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            <span>Google Takvim</span>
          </a>

          <button
            onClick={() => downloadIcsFile(exam)}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            title="Telefona / Apple Takvime Alarm Olarak İndir (.ics)"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Telefona Alarm İndir (.ics)</span>
          </button>
        </div>

        {/* Teacher Admin Controls */}
        {isTeacher && (
          <div className="flex items-center gap-1">
            {onAddMock && (
              <button
                onClick={() => onAddMock(exam.id)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-blue-600 transition dark:text-zinc-400 dark:hover:bg-zinc-800"
                title="Deneme Sınav Notu Ekle"
              >
                <PlusCircle className="h-4 w-4" />
              </button>
            )}

            {onEdit && (
              <button
                onClick={() => onEdit(exam)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-indigo-600 transition dark:text-zinc-400 dark:hover:bg-zinc-800"
                title="Sınavı Düzenle"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}

            {onDelete && (
              <button
                onClick={() => {
                  if (confirm(`"${exam.title}" sınav kaydını silmek istediğinize emin misiniz?`)) {
                    onDelete(exam.id);
                  }
                }}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600 transition dark:text-zinc-400 dark:hover:bg-red-950/30"
                title="Sınavı Sil"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
