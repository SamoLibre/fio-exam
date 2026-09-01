"use client";

import React, { useEffect, useState } from "react";
import { UserSession } from "@/types";
import { 
  GraduationCap, 
  LogOut, 
  Bell, 
  BellRing, 
  Download, 
  User, 
  ShieldCheck,
  Smartphone
} from "lucide-react";
import { requestNotificationPermission, sendBrowserNotification } from "@/lib/notifications";

interface NavbarProps {
  session: UserSession | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ session, onLogout }) => {
  const [hasNotifPermission, setHasNotifPermission] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setHasNotifPermission(Notification.permission === "granted");
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setHasNotifPermission(granted);
    if (granted) {
      sendBrowserNotification("✅ Bildirimler Aktif!", {
        body: "Sınav yaklaştığında telefonunuza ve tarayıcınıza otomatik bildirim gidecektir.",
      });
    }
  };

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      alert("Uygulamayı telefonunuza yüklemek için tarayıcı menüsünden (üç nokta) 'Ana Ekrana Ekle' seçeneğini kullanabilirsiniz.");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90 shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                OE Sınav Takip
              </span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                PWA
              </span>
            </div>
            <p className="hidden text-xs text-zinc-500 sm:block dark:text-zinc-400">
              IELTS • SAT • AP • TOEFL
            </p>
          </div>
        </div>

        {/* Action buttons & User profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* PWA Install Button */}
          <button
            onClick={handleInstallPwa}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300"
            title="Telefona veya Masaüstüne Yükle"
          >
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Uygulamayı İndir</span>
          </button>

          {/* Notification permission button */}
          <button
            onClick={handleEnableNotifications}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              hasNotifPermission
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400"
                : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400"
            }`}
            title={hasNotifPermission ? "Bildirimler Açık (Test Et)" : "Bildirimleri Etkinleştir"}
          >
            {hasNotifPermission ? (
              <>
                <BellRing className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Bildirimler Aktif</span>
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 animate-bounce text-amber-600 dark:text-amber-400" />
                <span>Bildirimi Aç</span>
              </>
            )}
          </button>

          {/* User badge */}
          {session && (
            <div className="flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-1.5 dark:bg-zinc-900">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                {session.role === "admin" ? (
                  <ShieldCheck className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {session.name}
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize">
                  {session.role === "admin" ? "Öğretmen (Yönetici)" : "Öğrenci"}
                </div>
              </div>
            </div>
          )}

          {/* Logout button */}
          <button
            onClick={onLogout}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-red-50 hover:text-red-600 transition dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            title="Çıkış Yap"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
