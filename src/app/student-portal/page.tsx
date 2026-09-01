"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppData, Exam, Student, UserSession } from "@/types";
import { 
  getLocalData, 
  getSession, 
  saveSession, 
  calculateDaysLeft, 
  formatTurkishDate 
} from "@/lib/storage";
import { checkAndSendExamAlarms } from "@/lib/notifications";
import { createGoogleCalendarUrl, downloadIcsFile } from "@/lib/calendar";
import { Navbar } from "@/components/Navbar";
import { ExamCard } from "@/components/ExamCard";
import { 
  Calendar, 
  Clock, 
  Target, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  BookOpen, 
  Download, 
  CalendarPlus, 
  Award,
  ChevronRight
} from "lucide-react";

export default function StudentPortalPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
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
      (s) => s.id === currentSession.studentId || s.username === currentSession.username
    );
    if (studentObj) {
      setCurrentStudent(studentObj);
    }

    // Check alarms
    checkAndSendExamAlarms(localData.exams);
  }, [router]);

  // Find student exams
  const studentExams = data?.exams.filter(
    (e) => e.studentId === currentStudent?.id || e.studentName.toLowerCase().includes(session?.name.toLowerCase() || "")
  ) || [];

  // Sort exams by date
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

  if (!session || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar session={session} onLogout={handleLogout} />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Welcome & Profile Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 p-6 sm:p-8 text-white shadow-xl">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Öğrenci Portalı</span>
            </div>
            
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hoş Geldin, {currentStudent?.name || session.name}! 👋
            </h1>
            
            <p className="mt-1 text-sm text-blue-100 max-w-xl">
              {currentStudent?.targetUniversity ? (
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

                {/* Quick 1-click alarm download for next exam */}
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

        {/* My Exams List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Sınav Takvimim ({studentExams.length})
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Öğretmeninizin sizin için planladığı sınavlar ve hedefler.
              </p>
            </div>
          </div>

          {studentExams.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
              <BookOpen className="mx-auto h-10 w-10 text-zinc-400" />
              <h3 className="mt-2 text-sm font-semibold text-zinc-900 dark:text-white">
                Henüz kayıtlı bir sınavınız yok
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Öğretmeniniz sınav takviminizi eklediğinde burada görünecektir.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {sortedExams.map((exam) => (
                <ExamCard key={exam.id} exam={exam} session={session} />
              ))}
            </div>
          )}
        </div>

        {/* Study Advice & Checklist */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Teacher Notes */}
          {currentStudent?.notes && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
              <h3 className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2 text-sm">
                📌 Öğretmeninizin Notları
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                {currentStudent.notes}
              </p>
            </div>
          )}

          {/* Tips for PWA */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
            <h3 className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2 text-sm">
              📲 Telefonunuza Ekleyin
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-blue-800 dark:text-blue-200">
              Bu sayfayı telefonunuzda açıp tarayıcı menüsünden <strong>"Ana Ekrana Ekle"</strong> diyerek uygulama gibi kullanabilirsiniz. Ayrıca bildirimleri açarak sınav hatırlatıcılarını anında alabilirsiniz.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
