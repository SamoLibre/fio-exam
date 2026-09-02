"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLocalData, getSession, saveLocalData, saveSession } from "@/lib/storage";
import { AppData, Student, UserSession } from "@/types";
import { 
  GraduationCap, 
  ShieldCheck, 
  User, 
  ArrowRight, 
  BellRing, 
  Smartphone,
  BookOpen
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [roleTab, setRoleTab] = useState<"teacher" | "student">("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check existing active session
    const existingSession = getSession();
    if (existingSession) {
      if (existingSession.role === "admin") {
        router.push("/dashboard");
        return;
      } else {
        router.push("/student-portal");
        return;
      }
    }

    // Sync latest data from server
    fetch("/api/data")
      .then((res) => res.json())
      .then((serverData: AppData) => {
        if (serverData && Array.isArray(serverData.students)) {
          const local = getLocalData();
          // If server has students, merge with local
          if (serverData.students.length > 0 || (local.students.length === 0 && serverData.students.length > 0)) {
            saveLocalData(serverData);
          }
        }
      })
      .catch(() => {});
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Check if Teacher Login (Elif)
    if (
      (cleanUsername === "elif" || cleanUsername === "ogretmen" || cleanUsername === "admin") &&
      (cleanPassword === "elif2026" || cleanPassword === "elif123" || cleanPassword === "123456")
    ) {
      const session: UserSession = {
        id: "admin-elif",
        name: "Elif Öğretmen",
        username: "elif",
        role: "admin",
      };
      saveSession(session);
      router.push("/dashboard");
      return;
    }

    // 2. Refresh data from server to catch students created on other devices
    let localData = getLocalData();
    try {
      const res = await fetch("/api/data");
      if (res.ok) {
        const serverData: AppData = await res.json();
        if (serverData && Array.isArray(serverData.students)) {
          // Merge server students with local students
          const studentMap = new Map<string, Student>();
          serverData.students.forEach((s) => studentMap.set(s.username.toLowerCase(), s));
          localData.students.forEach((s) => studentMap.set(s.username.toLowerCase(), s));
          
          localData = {
            ...localData,
            students: Array.from(studentMap.values()),
            exams: serverData.exams && serverData.exams.length > 0 ? serverData.exams : localData.exams,
          };
          saveLocalData(localData);
        }
      }
    } catch {}

    // 3. Check Student Login
    const student = localData.students.find(
      (s) => s.username.toLowerCase() === cleanUsername
    );

    if (student) {
      if (!student.password || student.password === cleanPassword) {
        const session: UserSession = {
          id: student.id,
          name: student.name,
          username: student.username,
          role: "student",
          studentId: student.id,
        };
        saveSession(session);
        router.push("/student-portal");
        return;
      } else {
        setError(`"${student.name}" için girilen şifre yanlış.`);
        setLoading(false);
        return;
      }
    }

    // Not found
    if (roleTab === "teacher" || cleanUsername === "elif") {
      setError("Öğretmen kullanıcı adı veya şifre hatalı. (Öğretmen: elif / elif2026)");
    } else {
      setError(`"${username}" kullanıcı adlı öğrenci bulunamadı. Lütfen öğretmeninizin sizi sisteme eklediğinden ve kullanıcı adınızı doğru yazdığınızdan emin olun.`);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 via-zinc-50 to-white px-4 py-8 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            FIO Exam
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Sınav Takip, Üniversite Başvuru & Alarm Sistemi
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/90 p-6 sm:p-8 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90">
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => {
                setRoleTab("student");
                setError("");
              }}
              className={"flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition " + (
                roleTab === "student"
                  ? "bg-white text-blue-600 shadow-xs dark:bg-zinc-900 dark:text-blue-400"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
              )}
            >
              <User className="h-4 w-4" />
              <span>Öğrenci Girişi</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRoleTab("teacher");
                setError("");
              }}
              className={"flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition " + (
                roleTab === "teacher"
                  ? "bg-white text-blue-600 shadow-xs dark:bg-zinc-900 dark:text-blue-400"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
              )}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Öğretmen Girişi</span>
            </button>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                {roleTab === "teacher" ? "Öğretmen Kullanıcı Adı" : "Öğrenci Kullanıcı Adı"}
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={roleTab === "teacher" ? "elif" : "Örn: melike"}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Şifre
              </label>
              <div className="relative mt-1">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50"
            >
              <span>{loading ? "Giriş Yapılıyor..." : (roleTab === "teacher" ? "Öğretmen Paneline Gir" : "Öğrenci Portalı'na Gir")}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <Smartphone className="h-3.5 w-3.5 text-blue-600" />
            PWA Mobil Uyumlu
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <BellRing className="h-3.5 w-3.5 text-amber-500" />
            Sınav Alarmları
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
            Üniversite & Checklist
          </span>
        </div>
      </div>
    </div>
  );
}
