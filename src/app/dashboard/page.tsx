"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppData, Exam, MockScore, Student, UserSession } from "@/types";
import { 
  getLocalData, 
  saveLocalData, 
  getSession, 
  saveSession 
} from "@/lib/storage";
import { checkAndSendExamAlarms, sendBrowserNotification } from "@/lib/notifications";
import { Navbar } from "@/components/Navbar";
import { CalendarView } from "@/components/CalendarView";
import { StudentDetailView } from "@/components/StudentDetailView";
import { AddExamModal } from "@/components/AddExamModal";
import { AddStudentModal } from "@/components/AddStudentModal";
import { AddMockScoreModal } from "@/components/AddMockScoreModal";
import { 
  Plus, 
  UserPlus, 
  Users, 
  BellRing, 
  GraduationCap
} from "lucide-react";

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Modals
  const [isAddExamOpen, setIsAddExamOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddMockOpen, setIsAddMockOpen] = useState(false);
  const [selectedExamForMock, setSelectedExamForMock] = useState<{ id: string; title: string } | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  useEffect(() => {
    const currentSession = getSession();
    if (!currentSession || currentSession.role !== "admin") {
      router.push("/");
      return;
    }
    setSession(currentSession);

    const localData = getLocalData();
    setData(localData);
    if (localData.students.length > 0) {
      setSelectedStudentId(localData.students[0].id);
    }

    // Sync latest data from persistent cloud DB
    fetch("/api/data", { cache: "no-store" })
      .then((res) => res.json())
      .then((cloudData: AppData) => {
        if (cloudData && Array.isArray(cloudData.students)) {
          setData(cloudData);
          saveLocalData(cloudData);
          if (cloudData.students.length > 0) {
            setSelectedStudentId((prev) => prev || cloudData.students[0].id);
          }
          checkAndSendExamAlarms(cloudData.exams || []);
        }
      })
      .catch(() => {});

    checkAndSendExamAlarms(localData.exams || []);
  }, [router]);

  const handleLogout = () => {
    saveSession(null);
    router.push("/");
  };

  const handleSaveExam = (examData: Partial<Exam>) => {
    if (!data) return;

    let updatedExams: Exam[];
    if (examData.id) {
      // Edit
      updatedExams = data.exams.map((e) =>
        e.id === examData.id ? ({ ...e, ...examData, updatedAt: new Date().toISOString() } as Exam) : e
      );
    } else {
      // Add new
      const newExam: Exam = {
        id: `exam-${Date.now()}`,
        studentId: examData.studentId || selectedStudentId || data.students[0]?.id || "",
        studentName: examData.studentName || "Öğrenci",
        title: examData.title || "Sınav",
        type: examData.type || "IELTS",
        subType: examData.subType || "",
        examDate: examData.examDate || "",
        examTime: examData.examTime || "09:00",
        location: examData.location || "",
        targetScore: examData.targetScore || "",
        currentScore: examData.currentScore || "",
        registrationStatus: examData.registrationStatus || "registered",
        notes: examData.notes || "",
        alarms: examData.alarms || [30, 14, 7, 3, 1, 0],
        mockScores: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedExams = [newExam, ...data.exams];
    }

    const newData: AppData = { ...data, exams: updatedExams };
    setData(newData);
    saveLocalData(newData);
    setEditingExam(null);
  };

  const handleDeleteExam = (examId: string) => {
    if (!data) return;
    const updatedExams = data.exams.filter((e) => e.id !== examId);
    const newData: AppData = { ...data, exams: updatedExams };
    setData(newData);
    saveLocalData(newData);
  };

  const handleSaveStudent = (newStudent: Student) => {
    if (!data) return;
    const updatedStudents = [...data.students, newStudent];
    const newData: AppData = { ...data, students: updatedStudents };
    setData(newData);
    saveLocalData(newData);
    setSelectedStudentId(newStudent.id);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    if (!data) return;
    const updatedStudents = data.students.map((s) =>
      s.id === updatedStudent.id ? updatedStudent : s
    );
    const newData: AppData = { ...data, students: updatedStudents };
    setData(newData);
    saveLocalData(newData);
  };

  const handleAddMockScore = (mock: MockScore) => {
    if (!data || !selectedExamForMock) return;

    const updatedExams = data.exams.map((exam) => {
      if (exam.id === selectedExamForMock.id) {
        const mockScores = exam.mockScores ? [...exam.mockScores, mock] : [mock];
        return { ...exam, mockScores, updatedAt: new Date().toISOString() };
      }
      return exam;
    });

    const newData: AppData = { ...data, exams: updatedExams };
    setData(newData);
    saveLocalData(newData);
    setSelectedExamForMock(null);
  };

  const handleTestAlarms = () => {
    sendBrowserNotification("🔔 Alarm Testi: FIO Exam", {
      body: "Tüm sınavların yaklaşma alarmları aktif! Öğrenci sınav tarihlerine göre otomatik bildirim gönderilecektir.",
    });
  };

  if (!session || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const selectedStudent = data.students.find((s) => s.id === selectedStudentId) || data.students[0];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar session={session} onLogout={handleLogout} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Öğretmen Yönetim Paneli 🎓
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              Hoş geldiniz, {session.name}. Sınav takvimi ve öğrenci takibi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (data.students.length === 0) {
                  alert("Lütfen önce bir öğrenci ekleyiniz.");
                  setIsAddStudentOpen(true);
                  return;
                }
                setEditingExam(null);
                setIsAddExamOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Sınav / Alarm Ekle</span>
            </button>

            <button
              onClick={() => setIsAddStudentOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              <UserPlus className="h-4 w-4 text-blue-600" />
              <span>Yeni Öğrenci Ekle</span>
            </button>

            <button
              onClick={handleTestAlarms}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
              title="Tüm alarmları test et"
            >
              <BellRing className="h-4 w-4 text-amber-600" />
              <span className="hidden sm:inline">Alarm Testi</span>
            </button>
          </div>
        </div>

        {/* 1. Sınav Takvimi (Aylık İnteraktif Görünüm) */}
        <div>
          <CalendarView
            exams={data.exams}
            students={data.students}
            onSelectExam={(e) => {
              setEditingExam(e);
              setIsAddExamOpen(true);
            }}
          />
        </div>

        {/* Öğrenci Seçici & Detay Görünümü */}
        {data.students.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 mb-4">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Henüz Kayıtlı Öğrenci Bulunmuyor
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
              Takip etmek istediğiniz öğrencileri ekleyerek sınav, üniversite başvurusu ve 14 maddelik standart checklist takibine hemen başlayabilirsiniz.
            </p>
            <button
              onClick={() => setIsAddStudentOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition"
            >
              <UserPlus className="h-5 w-5" />
              <span>İlk Öğrenciyi Ekle</span>
            </button>
          </div>
        ) : (
          <>
            {/* Öğrenci Seçici Butonları */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-blue-600" />
                  Öğrenci Seçin (Aşağıda Bilgileri Görüntülenir)
                </span>
                <span className="text-xs text-zinc-400">
                  {data.students.length} Kayıtlı Öğrenci
                </span>
              </div>

              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {data.students.map((student) => {
                  const isSelected = selectedStudent?.id === student.id;
                  const sExams = data.exams.filter((e) => e.studentId === student.id);
                  const sApps = student.applications || [];

                  return (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudentId(student.id)}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 transition shrink-0 ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/90 shadow-sm ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/60"
                          : "border-zinc-200 bg-zinc-50/60 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/40"
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr ${
                          student.avatarColor || "from-blue-600 to-indigo-600"
                        } text-sm font-bold text-white shadow-xs`}
                      >
                        {student.name.substring(0, 1)}
                      </div>
                      <div className="text-left">
                        <div className={`text-sm font-bold ${isSelected ? "text-blue-950 dark:text-white" : "text-zinc-900 dark:text-white"}`}>
                          {student.name}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {sApps.length} Başvuru • {sExams.length} Sınav
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Seçili Öğrencinin Sadeleştirilmiş 3'lü Görünümü: 1- Üniversiteler, 2- Sınavlar, 3- Checklist */}
            {selectedStudent && (
              <StudentDetailView
                student={selectedStudent}
                exams={data.exams}
                session={session}
                onAddExam={() => {
                  setEditingExam(null);
                  setIsAddExamOpen(true);
                }}
                onEditExam={(e) => {
                  setEditingExam(e);
                  setIsAddExamOpen(true);
                }}
                onDeleteExam={handleDeleteExam}
                onAddMock={(examId) => {
                  const ex = data.exams.find((e) => e.id === examId);
                  setSelectedExamForMock({ id: examId, title: ex?.title || "Sınav" });
                  setIsAddMockOpen(true);
                }}
                onUpdateStudent={handleUpdateStudent}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <AddExamModal
        isOpen={isAddExamOpen}
        onClose={() => {
          setIsAddExamOpen(false);
          setEditingExam(null);
        }}
        onSave={handleSaveExam}
        students={data.students}
        initialExam={editingExam}
      />

      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        onSave={handleSaveStudent}
      />

      <AddMockScoreModal
        isOpen={isAddMockOpen}
        onClose={() => {
          setIsAddMockOpen(false);
          setSelectedExamForMock(null);
        }}
        onSave={handleAddMockScore}
        examTitle={selectedExamForMock?.title || "Sınav"}
      />
    </div>
  );
}
