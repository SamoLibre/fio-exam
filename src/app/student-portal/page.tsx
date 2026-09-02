"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppData, Exam, Student, UserSession } from "@/types";
import { 
  getLocalData, 
  saveLocalData, 
  getSession, 
  saveSession, 
  calculateDaysLeft, 
  formatTurkishDate 
} from "@/lib/storage";
import { checkAndSendExamAlarms } from "@/lib/notifications";
import { createGoogleCalendarUrl, downloadIcsFile } from "@/lib/calendar";
import { Navbar } from "@/components/Navbar";
import { CalendarView } from "@/components/CalendarView";
import { StudentDetailView } from "@/components/StudentDetailView";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Target, 
  Sparkles, 
  Download, 
  CalendarPlus, 
  GraduationCap
} from "lucide-react";

export default function StudentPortalPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<"detail" | "calendar">("detail");

  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const currentSession = getSession();
    if (!currentSession) {
      router.push("/");
      return;
    }
    setSession(currentSession);

    const localData = getLocalData();
    setData(localData);

    const studentObj = localData.students.find(
      (s) => s.id === currentSession.studentId || s.username.toLowerCase() === currentSession.username.toLowerCase()
    );
    if (studentObj) {
      setCurrentStudent(studentObj);
    }

    // Fetch latest cloud data
    fetch("/api/data", { cache: "no-store" })
      .then((res) => res.json())
      .then((cloudData: AppData) => {
        if (cloudData && Array.isArray(cloudData.students)) {
          setData(cloudData);
          saveLocalData(cloudData);
          const updatedStudent = cloudData.students.find(
            (s) => s.id === currentSession.studentId || s.username.toLowerCase() === currentSession.username.toLowerCase()
          );
          if (updatedStudent) {
            setCurrentStudent(updatedStudent);
          }
          checkAndSendExamAlarms(cloudData.exams || []);
        }
      })
      .catch(() => {});

    checkAndSendExamAlarms(localData.exams || []);
  }, [router]);

  // Find student exams
  const studentExams = data?.exams.filter(
    (e) => e.studentId === currentStudent?.id || (session?.username && e.studentName.toLowerCase().includes(session.username.toLowerCase()))
  ) || [];

  const sortedExams = [...studentExams].sort(
    (a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime()
  );

  const nextExam = sortedExams.find((e) => calculateDaysLeft(e.examDate) >= 0) || sortedExams[0];

  // Live countdown timer for the next exam
  useEffect(() => {
    if (!nextExam) return;

    const interval = setInterval(() => {
      const target = new Date(`${nextExam.examDate}T${nextExam.examTime || "09:00"}:00`).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextExam]);

  const handleLogout = () => {
    saveSession(null);
    router.push("/");
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    if (!data) return;
    const updatedStudents = data.students.map((s) =>
      s.id === updatedStudent.id ? updatedStudent : s
    );
    const newData: AppData = { ...data, students: updatedStudents };
    setData(newData);
    saveLocalData(newData);
    setCurrentStudent(updatedStudent);
  };

  if (!session || !data || !currentStudent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar session={session} onLogout={handleLogout} />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Welcome & Next Exam Countdown */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 p-6 sm:p-8 text-white shadow-xl">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Öğrenci Portalı</span>
            </div>
            
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hoş Geldin, {currentStudent.name}! 👋
            </h1>
            
            <p className="mt-1 text-sm text-blue-100 max-w-xl">
              {currentStudent.targetUniversity ? (
                <>Hedef: <strong>{currentStudent.targetUniversity}</strong> ({currentStudent.targetMajor || "Lisans"})</>
              ) : (
                "Sınavların ve hazırlık sürecin öğretmeniniz tarafından takip ediliyor."
              )}
            </p>

            {/* Next Exam Live Countdown */}
            {nextExam && (
              <div className="mt-6 rounded-2xl bg-white/10 p-4 sm:p-5 backdrop-blur-md border border-white/15">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wider font-semibold text-blue-200">
                      En Yakın Sınavın
                    </div>
                    <div className="text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                      {nextExam.title}
                      <span className="text-xs font-normal text-blue-200">({formatTurkishDate(nextExam.examDate)})</span>
                    </div>
                  </div>

                  {/* Countdown Blocks */}
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center rounded-xl bg-black/25 px-3 py-2 min-w-[54px]">
                      <span className="text-xl font-black">{timeLeft.days}</span>
                      <span className="text-[10px] text-blue-200">GÜN</span>
                    </div>
                    <div className="text-lg font-bold">:</div>
                    <div className="flex flex-col items-center rounded-xl bg-black/25 px-3 py-2 min-w-[54px]">
                      <span className="text-xl font-black">{timeLeft.hours}</span>
                      <span className="text-[10px] text-blue-200">SAAT</span>
                    </div>
                    <div className="text-lg font-bold">:</div>
                    <div className="flex flex-col items-center rounded-xl bg-black/25 px-3 py-2 min-w-[54px]">
                      <span className="text-xl font-black">{timeLeft.minutes}</span>
                      <span className="text-[10px] text-blue-200">DAKİKA</span>
                    </div>
                    <div className="text-lg font-bold">:</div>
                    <div className="flex flex-col items-center rounded-xl bg-black/25 px-3 py-2 min-w-[54px]">
                      <span className="text-xl font-black text-amber-300">{timeLeft.seconds}</span>
                      <span className="text-[10px] text-blue-200">SANİYE</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-white/10">
                  <a
                    href={createGoogleCalendarUrl(nextExam)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50 transition"
                  >
                    <CalendarPlus className="h-4 w-4" />
                    <span>Google Takvime Ekle</span>
                  </a>
                  <button
                    onClick={() => downloadIcsFile(nextExam)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-md hover:bg-white/30 transition"
                  >
                    <Download className="h-4 w-4" />
                    <span>Telefona Alarm İndir (.ics)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab("detail")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
              activeTab === "detail"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Başvurularım • Sınavlarım • Checklist</span>
          </button>

          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
              activeTab === "calendar"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            <span>Sınav Takvimim (Aylık)</span>
          </button>
        </div>

        {/* TAB 1: 3-SECTION DETAIL VIEW */}
        {activeTab === "detail" && (
          <StudentDetailView
            student={currentStudent}
            exams={studentExams}
            session={session}
            onUpdateStudent={handleUpdateStudent}
          />
        )}

        {/* TAB 2: CALENDAR VIEW */}
        {activeTab === "calendar" && (
          <CalendarView
            exams={studentExams}
            isStudentPortal={true}
          />
        )}
      </main>
    </div>
  );
}
