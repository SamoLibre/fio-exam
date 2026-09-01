"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLocalData, getSession, saveSession } from "@/lib/storage";
import { UserSession } from "@/types";
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
  const [roleTab, setRoleTab] = useState<"teacher" | "student">("teacher");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const existingSession = getSession();
    if (existingSession) {
      if (existingSession.role === "admin") {
        router.push("/dashboard");
      } else {
        router.push("/student-portal");
      }
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const localData = getLocalData();

    // Teacher check
    if (roleTab === "teacher") {
      if (
        (username.toLowerCase() === "ogretmen" ||
          username.toLowerCase() === "admin" ||
          username.toLowerCase() === "hoca" ||
          username.toLowerCase() === "ogretmen1") &&
        (password === "123456" || password === "123" || password === "admin" || password === "")
      ) {
        const session: UserSession = {
          id: "admin-1",
          name: "Öğretmen (Admin)",
          username: "ogretmen",
          role: "admin",
        };
        saveSession(session);
        router.push("/dashboard");
        return;
      } else {
        setError("Öğretmen kullanıcı adı veya şifre hatalı. (Örnek: ogretmen / 123456)");
        setLoading(false);
        return;
      }
    }

    // Student check
    const student = localData.students.find(
      (s) => s.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (student) {
      if (!student.password || student.password === password || password === "123" || password === "123456" || password === "") {
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
      }
    }

    setError("Öğrenci bulunamadı veya şifre yanlış. (Örn: mira, bedirhan, burak / 123)");
    setLoading(false);
  };

  const handleQuickLogin = (uname: string, pwd: string, role: "teacher" | "student") => {
    setRoleTab(role);
    setUsername(uname);
    setPassword(pwd);
    
    // Immediate direct login for demo
    const localData = getLocalData();
    if (role === "teacher") {
      const session: UserSession = {
        id: "admin-1",
        name: "Öğretmen (Admin)",
        username: uname,
        role: "admin",
      };
      saveSession(session);
      router.push("/dashboard");
    } else {
      const student = localData.students.find((s) => s.username.toLowerCase() === uname.toLowerCase());
      if (student) {
        const session: UserSession = {
          id: student.id,
          name: student.name,
          username: student.username,
          role: "student",
          studentId: student.id,
        };
        saveSession(session);
        router.push("/student-portal");
      }
    }
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
            OE Sınav Takip
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            IELTS • SAT • AP • TOEFL Sınav ve Alarm Sistemi
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/90 p-6 sm:p-8 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90">
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => {
                setRoleTab("teacher");
                setError("");
                setUsername("ogretmen");
                setPassword("123456");
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

            <button
              type="button"
              onClick={() => {
                setRoleTab("student");
                setError("");
                setUsername("mira");
                setPassword("123");
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
                  placeholder={roleTab === "teacher" ? "ogretmen" : "mira, bedirhan, burak..."}
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
                  placeholder="••••••"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50"
            >
              <span>{roleTab === "teacher" ? "Öğretmen Paneline Gir" : "Öğrenci Portalı'na Gir"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <div className="text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
              ⚡ Tek Tıkla Hızlı Test Girişleri
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("ogretmen", "123456", "teacher")}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/60 p-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Öğretmen (Admin)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("mira", "123", "student")}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-pink-200 bg-pink-50/60 p-2 text-xs font-bold text-pink-700 transition hover:bg-pink-100 dark:border-pink-900/50 dark:bg-pink-950/40 dark:text-pink-300"
              >
                <User className="h-3.5 w-3.5" />
                <span>Mira (IELTS)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("bedirhan", "123", "student")}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/60 p-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300"
              >
                <User className="h-3.5 w-3.5" />
                <span>Bedirhan (SAT)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("burak", "123", "student")}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                <User className="h-3.5 w-3.5" />
                <span>Burak (TOEFL)</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <Smartphone className="h-3.5 w-3.5 text-blue-600" />
            PWA Mobil Uyumlu
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <BellRing className="h-3.5 w-3.5 text-amber-500" />
            Otomatik Sınav Alarmları
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
            Deneme Takibi
          </span>
        </div>
      </div>
    </div>
  );
}
