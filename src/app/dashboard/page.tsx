"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppData, Exam, MockScore, Student, UserSession } from "@/types";
import { 
  getLocalData, 
  saveLocalData, 
  getSession, 
  saveSession, 
  calculateDaysLeft 
} from "@/lib/storage";
import { checkAndSendExamAlarms, sendBrowserNotification } from "@/lib/notifications";
import { Navbar } from "@/components/Navbar";
import { CalendarView } from "@/components/CalendarView";
import { StudentDetailView } from "@/components/StudentDetailView";
import { ExamCard } from "@/components/ExamCard";
import { AddExamModal } from "@/components/AddExamModal";
import { AddStudentModal } from "@/components/AddStudentModal";
import { AddMockScoreModal } from "@/components/AddMockScoreModal";
import { 
  Plus, 
  UserPlus, 
  Users, 
  Calendar as CalendarIcon, 
  AlertTriangle, 
  Search, 
  BellRing, 
  BookOpen, 
  GraduationCap, 
  CheckSquare,
  Building2,
  Sparkles,
  LayoutGrid
} from "lucide-react";

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [data, setData] = useState<AppData | null>(null);

  // Active view mode: "calendar" | "student_detail" | "all_exams"
  const [activeTab, setActiveTab] = useState<"calendar" | "student_detail" | "all_exams">("calendar");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Filters for all_exams tab
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

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

    // Run alarm checker
    checkAndSendExamAlarms(localData.exams);
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
    setActiveTab("student_detail");
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

  // Filter exams for all_exams tab
  const filteredExams = data.exams.filter((exam) => {
    if (selectedStudentFilter !== "all" && exam.studentId !== selectedStudentFilter) {
      return false;
    }
    if (selectedTypeFilter !== "all" && exam.type !== selectedTypeFilter) {
      return false;
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return (
        exam.title.toLowerCase().includes(q) ||
        exam.studentName.toLowerCase().includes(q) ||
        (exam.notes && exam.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const sortedExams = [...filteredExams].sort(
    (a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime()
  );

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
              Sınav takvimi, öğrenci üniversite başvuruları, sınavlar ve kontrol listeleri.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
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
              <span>Yeni Öğrenci</span>
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

        {/* Quick Student Selector Bar */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-blue-600" />
              Öğrenci Seçimi (3'lü Detay Görünümü İçin)
            </span>
            <span className="text-xs text-zinc-400">
              {data.students.length} Kayıtlı Öğrenci
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {data.students.map((student) => {
              const isSelected = selectedStudent?.id === student.id && activeTab === "student_detail";
              const sExams = data.exams.filter((e) => e.studentId === student.id);
              const sApps = student.applications || [];

              return (
                <button
                  key={student.id}
                  onClick={() => {
                    setSelectedStudentId(student.id);
                    setActiveTab("student_detail");
                  }}
                  className={`flex items-center gap-2.5 rounded-2xl border px-3.5 py-2 transition shrink-0 ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/80 shadow-xs dark:border-blue-500 dark:bg-blue-950/50"
                      : "border-zinc-200 bg-zinc-50/60 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/40"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr ${
                      student.avatarColor || "from-blue-600 to-indigo-600"
                    } text-xs font-bold text-white shadow-xs`}
                  >
                    {student.name.substring(0, 1)}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-zinc-900 dark:text-white">
                      {student.name}
                    </div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      {sApps.length} Başvuru • {sExams.length} Sınav
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
              activeTab === "calendar"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            <span>1. Sınav Takvimi (Aylık Görünüm)</span>
          </button>

          {selectedStudent && (
            <button
              onClick={() => setActiveTab("student_detail")}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
                activeTab === "student_detail"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>2. {selectedStudent.name} (Üniversiteler • Sınavlar • Checklist)</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("all_exams")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
              activeTab === "all_exams"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            <span>3. Tüm Sınav Listesi ({data.exams.length})</span>
          </button>
        </div>

        {/* TAB 1: CALENDAR VIEW */}
        {activeTab === "calendar" && (
          <div className="space-y-6">
            <CalendarView
              exams={data.exams}
              students={data.students}
              onSelectExam={(e) => {
                setEditingExam(e);
                setIsAddExamOpen(true);
              }}
            />
          </div>
        )}

        {/* TAB 2: STUDENT DETAIL VIEW (3 SADE BİLGİ: 1- Üniversiteler, 2- Sınavlar, 3- Checklist) */}
        {activeTab === "student_detail" && selectedStudent && (
          <StudentDetailView
            student={selectedStudent}
            exams={data.exams}
            session={session}
            onBack={() => setActiveTab("calendar")}
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

        {/* TAB 3: ALL EXAMS LIST */}
        {activeTab === "all_exams" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl bg-white p-4 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Öğrenci adı veya sınav ara..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 py-2 text-xs sm:text-sm text-zinc-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedStudentFilter}
                  onChange={(e) => setSelectedStudentFilter(e.target.value)}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  <option value="all">Tüm Öğrenciler ({data.students.length})</option>
                  {data.students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  <option value="all">Tüm Sınav Türleri</option>
                  <option value="IELTS">IELTS</option>
                  <option value="SAT">SAT</option>
                  <option value="AP">AP</option>
                  <option value="TOEFL">TOEFL</option>
                  <option value="DUOLINGO">Duolingo</option>
                  <option value="DİĞER">Diğer</option>
                </select>
              </div>
            </div>

            {/* Exam Cards Grid */}
            {sortedExams.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
                <BookOpen className="mx-auto h-12 w-12 text-zinc-400" />
                <h3 className="mt-3 text-base font-semibold text-zinc-900 dark:text-white">
                  Kriterlere uygun sınav bulunamadı
                </h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sortedExams.map((exam) => (
                  <ExamCard
                    key={exam.id}
                    exam={exam}
                    session={session}
                    onEdit={(e) => {
                      setEditingExam(e);
                      setIsAddExamOpen(true);
                    }}
                    onDelete={handleDeleteExam}
                    onAddMock={(examId) => {
                      setSelectedExamForMock({ id: examId, title: exam.title });
                      setIsAddMockOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
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
