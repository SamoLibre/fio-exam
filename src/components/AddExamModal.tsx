"use client";

import React, { useState, useEffect } from "react";
import { Exam, ExamType, Student } from "@/types";
import { X, Calendar, Clock, Target, MapPin, Bell, BookOpen, User, Plus } from "lucide-react";

interface AddExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (examData: Partial<Exam>) => void;
  students: Student[];
  initialExam?: Exam | null;
}

const EXAM_TYPES: ExamType[] = ["IELTS", "SAT", "AP", "TOEFL", "DUOLINGO", "GRE", "GMAT", "YÖS", "DİĞER"];

const DEFAULT_ALARM_OPTIONS = [
  { days: 60, label: "60 Gün Önce" },
  { days: 30, label: "30 Gün Önce" },
  { days: 14, label: "14 Gün Önce (2 Hafta)" },
  { days: 7, label: "7 Gün Önce (1 Hafta)" },
  { days: 3, label: "3 Gün Önce" },
  { days: 1, label: "1 Gün Önce (Yarın)" },
  { days: 0, label: "Sınav Günü" },
];

export const AddExamModal: React.FC<AddExamModalProps> = ({
  isOpen,
  onClose,
  onSave,
  students,
  initialExam,
}) => {
  const [studentId, setStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ExamType>("IELTS");
  const [subType, setSubType] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examTime, setExamTime] = useState("09:00");
  const [location, setLocation] = useState("");
  const [targetScore, setTargetScore] = useState("");
  const [notes, setNotes] = useState("");
  const [alarms, setAlarms] = useState<number[]>([30, 14, 7, 3, 1, 0]);

  useEffect(() => {
    if (initialExam) {
      setStudentId(initialExam.studentId);
      setTitle(initialExam.title);
      setType(initialExam.type);
      setSubType(initialExam.subType || "");
      setExamDate(initialExam.examDate);
      setExamTime(initialExam.examTime || "09:00");
      setLocation(initialExam.location || "");
      setTargetScore(initialExam.targetScore || "");
      setNotes(initialExam.notes || "");
      setAlarms(initialExam.alarms || [30, 14, 7, 3, 1, 0]);
    } else {
      setStudentId(students[0]?.id || "");
      setTitle("IELTS Academic");
      setType("IELTS");
      setSubType("");
      setExamDate("");
      setExamTime("09:00");
      setLocation("");
      setTargetScore("");
      setNotes("");
      setAlarms([30, 14, 7, 3, 1, 0]);
    }
  }, [initialExam, students, isOpen]);

  const handleTypeChange = (newType: ExamType) => {
    setType(newType);
    if (!initialExam) {
      if (newType === "IELTS") setTitle("IELTS Academic");
      else if (newType === "SAT") setTitle("Digital SAT");
      else if (newType === "AP") setTitle("AP Calculus BC");
      else if (newType === "TOEFL") setTitle("TOEFL iBT");
      else setTitle(`${newType} Sınavı`);
    }
  };

  const toggleAlarm = (days: number) => {
    if (alarms.includes(days)) {
      setAlarms(alarms.filter((d) => d !== days));
    } else {
      setAlarms([...alarms, days].sort((a, b) => b - a));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !title || !examDate) {
      alert("Lütfen öğrenci, sınav başlığı ve sınav tarihini doldurunuz.");
      return;
    }

    const selectedStudent = students.find((s) => s.id === studentId);

    onSave({
      id: initialExam?.id,
      studentId,
      studentName: selectedStudent?.name || "Öğrenci",
      title,
      type,
      subType,
      examDate,
      examTime,
      location,
      targetScore,
      notes,
      alarms,
      registrationStatus: initialExam?.registrationStatus || "registered",
      mockScores: initialExam?.mockScores || [],
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {initialExam ? "Sınavı Düzenle" : "Yeni Sınav / Alarm Ekle"}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Öğrenci seçin, tarih ve alarm bildirimlerini ayarlayın.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Öğrenci Seçimi */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Öğrenci Seçin *
            </label>
            <div className="mt-1 flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  required
                >
                  <option value="" disabled>Öğrenci Seçin</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.username})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sınav Türü Butonları */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Sınav Türü
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EXAM_TYPES.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => handleTypeChange(t)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    type === t
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Sınav Başlığı ve Alt Branş */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Sınav Başlığı *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: IELTS Academic"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Alt Branş / Detay
              </label>
              <input
                type="text"
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
                placeholder="Örn: Calculus BC, Academic"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>

          {/* Tarih ve Saat */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Sınav Tarihi *
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Sınav Saati
              </label>
              <input
                type="time"
                value={examTime}
                onChange={(e) => setExamTime(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>

          {/* Hedef Puan ve Sınav Yeri */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Hedef Puan
              </label>
              <input
                type="text"
                value={targetScore}
                onChange={(e) => setTargetScore(e.target.value)}
                placeholder="Örn: 7.5 veya 1500+"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Sınav Yeri / Adresi
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Örn: British Council Maslak"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>

          {/* Hatırlatıcı Alarmlar (Checkboxes) */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 dark:border-blue-950 dark:bg-blue-950/20">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300 mb-2">
              <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Otomatik Alarm & Bildirim Günleri</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {DEFAULT_ALARM_OPTIONS.map((opt) => (
                <label
                  key={opt.days}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-xs transition ${
                    alarms.includes(opt.days)
                      ? "border-blue-500 bg-blue-100/70 font-semibold text-blue-900 dark:bg-blue-900/50 dark:text-blue-200"
                      : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={alarms.includes(opt.days)}
                    onChange={() => toggleAlarm(opt.days)}
                    className="h-3.5 w-3.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notlar */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Öğretmen Notları & Çalışma Tavsiyesi
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Öğrencinin dikkat etmesi gereken konular, kaynaklar veya hatırlatmalar..."
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              İptal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition"
            >
              {initialExam ? "Değişiklikleri Kaydet" : "Sınavı & Alarmı Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
