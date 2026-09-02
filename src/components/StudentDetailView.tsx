"use client";

import React, { useState } from "react";
import { ChecklistItem, DEFAULT_CHECKLIST_ITEMS, Exam, Student, UniversityApplication, UserSession } from "@/types";
import { AddUniversityModal } from "./AddUniversityModal";
import { 
  Building2, 
  Calendar, 
  CheckSquare, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Target, 
  Edit3, 
  PlusCircle, 
  Award, 
  ArrowLeft,
  RotateCcw,
  TrendingUp
} from "lucide-react";

interface StudentDetailViewProps {
  student: Student;
  exams: Exam[];
  session: UserSession | null;
  onBack?: () => void;
  onAddExam?: () => void;
  onEditExam?: (exam: Exam) => void;
  onDeleteExam?: (examId: string) => void;
  onAddMock?: (examId: string) => void;
  onUpdateStudent: (updatedStudent: Student) => void;
}

export const StudentDetailView: React.FC<StudentDetailViewProps> = ({
  student,
  exams,
  session,
  onBack,
  onAddExam,
  onEditExam,
  onDeleteExam,
  onAddMock,
  onUpdateStudent,
}) => {
  const [isAddUniOpen, setIsAddUniOpen] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [newChecklistDate, setNewChecklistDate] = useState("");

  const isTeacher = session?.role === "admin";

  const studentExams = exams.filter((e) => e.studentId === student.id);
  const applications = student.applications || [];
  const checklist = student.checklist || [];

  // University Handlers
  const handleAddUniversity = (app: UniversityApplication) => {
    const updatedApps = [...applications, app];
    onUpdateStudent({ ...student, applications: updatedApps });
  };

  const handleDeleteUniversity = (appId: string) => {
    const updatedApps = applications.filter((a) => a.id !== appId);
    onUpdateStudent({ ...student, applications: updatedApps });
  };

  const handleUpdateUniStatus = (appId: string, status: UniversityApplication["status"]) => {
    const updatedApps = applications.map((a) => (a.id === appId ? { ...a, status } : a));
    onUpdateStudent({ ...student, applications: updatedApps });
  };

  // Checklist Handlers
  const handleToggleChecklist = (itemId: string) => {
    const updatedList = checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onUpdateStudent({ ...student, checklist: updatedList });
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;

    const newItem: ChecklistItem = {
      id: `chk-${Date.now()}`,
      title: newChecklistText.trim(),
      completed: false,
      dueDate: newChecklistDate || undefined,
    };

    onUpdateStudent({ ...student, checklist: [...checklist, newItem] });
    setNewChecklistText("");
    setNewChecklistDate("");
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    const updatedList = checklist.filter((item) => item.id !== itemId);
    onUpdateStudent({ ...student, checklist: updatedList });
  };

  const handleApplyDefaultChecklist = () => {
    if (checklist.length > 0 && !confirm("Mevcut checklist sıfırlanıp 14 maddelik standart şablon yüklenecektir. Devam edilsin mi?")) {
      return;
    }

    const defaultItems = DEFAULT_CHECKLIST_ITEMS.map((title, idx) => ({
      id: `chk-def-${idx}-${Date.now()}`,
      title,
      completed: false,
    }));

    onUpdateStudent({ ...student, checklist: defaultItems });
  };

  const getStatusBadge = (status: UniversityApplication["status"]) => {
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

  const completedCount = checklist.filter((c) => c.completed).length;

  return (
    <div className="space-y-6">
      {/* Student Profile Banner */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                title="Tüm Öğrencilere Dön"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr ${
                student.avatarColor || "from-blue-600 to-indigo-600"
              } text-2xl font-black text-white shadow-md`}
            >
              {student.name.substring(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white">
                  {student.name}
                </h2>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                  @{student.username}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                {student.targetUniversity ? (
                  <>🎯 Hedef: <strong className="text-zinc-700 dark:text-zinc-200">{student.targetUniversity}</strong> ({student.targetMajor || "Lisans"})</>
                ) : (
                  "Öğrenci Sınav ve Başvuru Takip Kartı"
                )}
              </p>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="rounded-2xl bg-zinc-50 px-3.5 py-2 text-center border border-zinc-100 dark:bg-zinc-800/60 dark:border-zinc-800">
              <div className="text-base font-black text-blue-600">{applications.length}</div>
              <div className="text-[10px] uppercase font-bold text-zinc-400">Üniversite</div>
            </div>
            <div className="rounded-2xl bg-zinc-50 px-3.5 py-2 text-center border border-zinc-100 dark:bg-zinc-800/60 dark:border-zinc-800">
              <div className="text-base font-black text-indigo-600">{studentExams.length}</div>
              <div className="text-[10px] uppercase font-bold text-zinc-400">Sınav</div>
            </div>
            <div className="rounded-2xl bg-zinc-50 px-3.5 py-2 text-center border border-zinc-100 dark:bg-zinc-800/60 dark:border-zinc-800">
              <div className="text-base font-black text-emerald-600">
                {checklist.length > 0 ? `${completedCount}/${checklist.length}` : "0"}
              </div>
              <div className="text-[10px] uppercase font-bold text-zinc-400">Checklist</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Main Sections Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ========================================================= */}
        {/* 1. BAŞVURDUĞU ÜNİVERSİTELER */}
        {/* ========================================================= */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white">
                    1. Başvurduğu Üniversiteler
                  </h3>
                  <span className="text-[11px] text-zinc-400">({applications.length} başvuru)</span>
                </div>
              </div>

              {isTeacher && (
                <button
                  onClick={() => setIsAddUniOpen(true)}
                  className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Ekle</span>
                </button>
              )}
            </div>

            {applications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-center text-xs text-zinc-400 dark:border-zinc-800">
                Henüz üniversite başvurusu eklenmemiş.
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => {
                  const badge = getStatusBadge(app.status);
                  return (
                    <div
                      key={app.id}
                      className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3.5 text-xs transition hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-800/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                            {app.universityName}
                          </h4>
                          {app.program && (
                            <div className="text-zinc-600 dark:text-zinc-300 mt-0.5 font-medium">
                              🎓 {app.program}
                            </div>
                          )}
                          {app.country && (
                            <div className="text-zinc-400 text-[11px] mt-0.5">
                              📍 {app.country}
                            </div>
                          )}
                        </div>

                        {isTeacher && (
                          <button
                            onClick={() => handleDeleteUniversity(app.id)}
                            className="text-zinc-400 hover:text-red-500 p-1"
                            title="Üniversiteyi Sil"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60">
                        {/* Status selector / badge */}
                        {isTeacher ? (
                          <select
                            value={app.status}
                            onChange={(e) => handleUpdateUniStatus(app.id, e.target.value as any)}
                            className="rounded-lg border border-zinc-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-zinc-700 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                          >
                            <option value="hazirlaniyor">Hazırlanıyor</option>
                            <option value="basvuruldu">Başvuruldu</option>
                            <option value="kabul">Kabul Aldı 🎉</option>
                            <option value="beklemede">Beklemede</option>
                            <option value="red">Red</option>
                          </select>
                        ) : (
                          <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${badge.color}`}>
                            {badge.label}
                          </span>
                        )}

                        {app.deadline && (
                          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                            ⏳ Deadline: {app.deadline}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. GİRECEĞİ SINAVLAR (Tarih ve Yer kaldırılmış sade görünüm) */}
        {/* ========================================================= */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white">
                    2. Gireceği Sınavlar
                  </h3>
                  <span className="text-[11px] text-zinc-400">({studentExams.length} kayıtlı sınav)</span>
                </div>
              </div>

              {isTeacher && onAddExam && (
                <button
                  onClick={onAddExam}
                  className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Sınav Ekle</span>
                </button>
              )}
            </div>

            {studentExams.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-center text-xs text-zinc-400 dark:border-zinc-800">
                Bu öğrenciye tanımlı sınav bulunmuyor.
              </div>
            ) : (
              <div className="space-y-3">
                {studentExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4 text-xs transition hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-800/50 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                          {exam.title}
                          {exam.subType && (
                            <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400 ml-1">
                              ({exam.subType})
                            </span>
                          )}
                        </h4>
                      </div>

                      <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getExamTypeColor(exam.type)}`}>
                        {exam.type}
                      </span>
                    </div>

                    {exam.targetScore && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                        <Target className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span>Hedef Puan: <strong className="text-zinc-900 dark:text-zinc-100">{exam.targetScore}</strong></span>
                      </div>
                    )}

                    {/* Deneme Sınavları */}
                    {exam.mockScores && exam.mockScores.length > 0 && (
                      <div className="rounded-xl bg-white p-2.5 border border-zinc-200/80 dark:bg-zinc-900/60 dark:border-zinc-700/60">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-blue-600" />
                            Deneme Skorları ({exam.mockScores.length})
                          </span>
                          <span className="text-blue-600 font-bold">
                            Son: {exam.mockScores[exam.mockScores.length - 1].score}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {exam.mockScores.map((mock, idx) => (
                            <span
                              key={mock.id || idx}
                              className="inline-flex items-center gap-1 rounded-md bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                            >
                              <Award className="h-2.5 w-2.5 text-amber-500" />
                              {mock.score}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Admin Actions */}
                    {isTeacher && (
                      <div className="flex items-center justify-end gap-1 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60">
                        {onAddMock && (
                          <button
                            onClick={() => onAddMock(exam.id)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                            title="Deneme Notu Ekle"
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span>Deneme Ekle</span>
                          </button>
                        )}
                        {onEditExam && (
                          <button
                            onClick={() => onEditExam(exam)}
                            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200/60 hover:text-indigo-600 dark:hover:bg-zinc-700"
                            title="Düzenle"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {onDeleteExam && (
                          <button
                            onClick={() => {
                              if (confirm(`"${exam.title}" sınav kaydını silmek istediğinize emin misiniz?`)) {
                                onDeleteExam(exam.id);
                              }
                            }}
                            className="rounded-lg p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                            title="Sil"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. CHECKLIST (KONTROL LİSTESİ - Standart Şablon Desteği) */}
        {/* ========================================================= */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <CheckSquare className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white">
                    3. Checklist
                  </h3>
                  <span className="text-[11px] text-zinc-400">
                    ({completedCount}/{checklist.length} tamamlandı)
                  </span>
                </div>
              </div>

              {isTeacher && (
                <button
                  type="button"
                  onClick={handleApplyDefaultChecklist}
                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300"
                  title="14 Maddelik Standart Checklist Şablonunu Yükle"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Şablonu Yükle</span>
                </button>
              )}
            </div>

            {/* Progress Bar */}
            {checklist.length > 0 && (
              <div className="mb-4">
                <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${(completedCount / checklist.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Checklist Items */}
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {checklist.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-center text-xs text-zinc-400 dark:border-zinc-800">
                  Henüz checklist maddesi eklenmedi. Üstteki "Şablonu Yükle" butonunu kullanabilirsiniz.
                </div>
              ) : (
                checklist.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start justify-between gap-2 rounded-xl border p-2.5 transition ${
                      item.completed
                        ? "border-emerald-200 bg-emerald-50/50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
                        : "border-zinc-200/80 bg-zinc-50/70 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-200"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleChecklist(item.id)}
                      className="flex items-start gap-2 text-left text-xs font-medium flex-1 pt-0.5"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className={item.completed ? "line-through opacity-70" : ""}>
                          {item.title}
                        </span>
                        {item.dueDate && (
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            📅 {item.dueDate}
                          </div>
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteChecklistItem(item.id)}
                      className="text-zinc-400 hover:text-red-500 p-1 shrink-0"
                      title="Maddeyi Sil"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Add Checklist Form */}
          <form onSubmit={handleAddChecklistItem} className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
            <input
              type="text"
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              placeholder="Yeni yapılacak madde ekle..."
              className="w-full rounded-xl border border-zinc-300 px-3 py-1.5 text-xs text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={newChecklistDate}
                onChange={(e) => setNewChecklistDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-2 py-1 text-xs text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Ekle</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Add University Modal */}
      <AddUniversityModal
        isOpen={isAddUniOpen}
        onClose={() => setIsAddUniOpen(false)}
        onSave={handleAddUniversity}
        studentName={student.name}
      />
    </div>
  );
};
