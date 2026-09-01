"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppData, Exam, ExamType, MockScore, Student, UserSession } from "@/types";
import { 
  getLocalData, 
  saveLocalData, 
  getSession, 
  saveSession, 
  calculateDaysLeft 
} from "@/lib/storage";
import { checkAndSendExamAlarms, sendBrowserNotification } from "@/lib/notifications";
import { Navbar } from "@/components/Navbar";
import { ExamCard } from "@/components/ExamCard";
import { AddExamModal } from "@/components/AddExamModal";
import { AddStudentModal } from "@/components/AddStudentModal";
import { AddMockScoreModal } from "@/components/AddMockScoreModal";
import { 
  Plus, 
  UserPlus, 
  Users, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  BellRing, 
  BookOpen, 
  GraduationCap, 
  Phone, 
  Sparkles,
  Award,
  Clock
} from "lucide-react";

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [data, setData] = useState<AppData | null>(null);

  // Filters & State
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"exams" | "students">("exams");

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
        studentId: examData.studentId || "",
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
    sendBrowserNotification("🔔 Alarm Testi: Sınav Takip Sistemi", {
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

  // Filter exams
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

  // Sort upcoming first
  const sortedExams = [...filteredExams].sort(
    (a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime()
  );

  // Metrics
  const totalStudents = data.students.length;
  const upcomingExams = data.exams.filter((e) => calculateDaysLeft(e.examDate) >= 0).length;
  const urgentExams = data.exams.filter((e) => {
    const days = calculateDaysLeft(e.examDate);
    return days >= 0 && days <= 7;
  }).length;

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
              Öğrencilerin IELTS, SAT, AP ve TOEFL sınavlarını yönetin, tarihler ekleyin ve alarmları takip edin.
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

        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-zinc-500">Öğrenci Sayısı</span>
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-white">
              {totalStudents}
            </div>
            <div className="text-[11px] text-zinc-400">Takip edilen öğrenci</div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-zinc-500">Yaklaşan Sınavlar</span>
              <Calendar className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-white">
              {upcomingExams}
            </div>
            <div className="text-[11px] text-zinc-400">Planlanmış aktif sınav</div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-400">Acil Alarmlar</span>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-amber-600">
              {urgentExams}
            </div>
            <div className="text-[11px] text-amber-700/80 dark:text-amber-400">Son 7 gün içinde</div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-zinc-500">Toplam Kayıt</span>
              <BookOpen className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-zinc-900 dark:text-white">
              {data.exams.length}
            </div>
            <div className="text-[11px] text-zinc-400">Tüm sınavlar</div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab("exams")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
              activeTab === "exams"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Sınav Takvimi & Alarmlar ({data.exams.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("students")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
              activeTab === "students"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Öğrenci Listesi ({data.students.length})</span>
          </button>
        </div>

        {/* Tab 1: Exams View */}
        {activeTab === "exams" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl bg-white p-4 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              {/* Search */}
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

              {/* Student Filter */}
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

                {/* Exam Type Filter */}
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
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Yukarıdaki "Sınav / Alarm Ekle" butonuna tıklayarak yeni bir sınav oluşturabilirsiniz.
                </p>
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

        {/* Tab 2: Students View */}
        {activeTab === "students" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.students.map((student) => {
                const sExams = data.exams.filter((e) => e.studentId === student.id);
                return (
                  <div
                    key={student.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr ${student.avatarColor || "from-blue-500 to-indigo-500"} text-lg font-bold text-white shadow-sm`}>
                        {student.name.substring(0, 1)}
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-900 dark:text-white">
                          {student.name}
                        </h3>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                          <span>Kullanıcı: <strong>{student.username}</strong></span>
                          <span>•</span>
                          <span>Şifre: <strong>{student.password || "123"}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
                      {student.targetUniversity && (
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="h-4 w-4 text-blue-600 shrink-0" />
                          <span className="font-medium">{student.targetUniversity} ({student.targetMajor || "Lisans"})</span>
                        </div>
                      )}
                      {student.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>{student.phone}</span>
                        </div>
                      )}
                      {student.notes && (
                        <div className="rounded-lg bg-zinc-50 p-2 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          {student.notes}
                        </div>
                      )}
                    </div>

                    {/* Sınavlar Listesi */}
                    <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                      <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                        <span>Kayıtlı Sınavlar ({sExams.length})</span>
                      </div>
                      <div className="space-y-1.5">
                        {sExams.map((e) => (
                          <div
                            key={e.id}
                            className="flex items-center justify-between rounded-lg bg-zinc-50 px-2.5 py-1.5 text-xs dark:bg-zinc-800/60"
                          >
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                              {e.title}
                            </span>
                            <span className="text-[11px] text-blue-600 font-semibold">
                              {e.examDate}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
