"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LifeBuoy,
  PlusCircle,
  LayoutDashboard,
  Ticket,
  BarChart3,
  Shield,
  Send,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { NotificationCenter } from "./NotificationCenter";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: {
    name: string;
    displayName: string;
  };
  department?: {
    name: string;
  };
  itTeam?: {
    name: string;
  };
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Do not render navbar on login/register pages
  const isAuthPage = pathname === "/login" || pathname === "/register";
  if (isAuthPage) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link href={user ? "/dashboard" : "/login"} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 group-hover:bg-indigo-700 transition-colors">
                <LifeBuoy className="w-5 h-5 transition-transform group-hover:rotate-12" />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900">
                ITbantu
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            {!isAuthPage && user && (
              <nav className="hidden md:flex items-center gap-1.5">
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors ${
                    pathname === "/dashboard"
                      ? "text-indigo-800 bg-indigo-100/90 font-bold border border-indigo-300"
                      : "text-slate-800 hover:text-indigo-700 hover:bg-slate-100 font-semibold"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                <Link
                  href="/tickets"
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors ${
                    pathname.startsWith("/tickets") && pathname !== "/tickets/create"
                      ? "text-indigo-800 bg-indigo-100/90 font-bold border border-indigo-300"
                      : "text-slate-800 hover:text-indigo-700 hover:bg-slate-100 font-semibold"
                  }`}
                >
                  <Ticket className="w-4 h-4" />
                  Tiket
                </Link>

                <Link
                  href="/tickets/create"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-colors ${
                    pathname === "/tickets/create"
                      ? "text-indigo-800 bg-indigo-100/90 font-bold border border-indigo-300"
                      : "text-slate-800 hover:text-indigo-700 hover:bg-slate-100 font-semibold"
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-indigo-700" />
                  Buat Tiket
                </Link>

                {(user.role.name === "IT_STAFF" ||
                  user.role.name === "IT_SUPERVISOR" ||
                  user.role.name === "ADMIN") && (
                  <Link
                    href="/reports"
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors ${
                      pathname === "/reports"
                        ? "text-indigo-800 bg-indigo-100/90 font-bold border border-indigo-300"
                        : "text-slate-800 hover:text-indigo-700 hover:bg-slate-100 font-semibold"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Laporan SLA
                  </Link>
                )}

                {user.role.name === "ADMIN" && (
                  <Link
                    href="/admin"
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors ${
                      pathname.startsWith("/admin")
                        ? "text-indigo-800 bg-indigo-100/90 font-bold border border-indigo-300"
                        : "text-slate-800 hover:text-indigo-700 hover:bg-slate-100 font-semibold"
                    }`}
                  >
                    <Shield className="w-4 h-4 text-indigo-700" />
                    Admin Panel
                  </Link>
                )}
              </nav>
            )}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {!loading && user && (
              <>
                {/* Telegram Settings Link */}
                <Link
                  href="/settings/telegram"
                  className={`p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors hidden sm:flex items-center justify-center ${
                    pathname === "/settings/telegram" ? "text-indigo-600 bg-indigo-50/70" : ""
                  }`}
                  title="Pengaturan Telegram"
                >
                  <Send className="w-4 h-4" />
                </Link>

                {/* Notification Bell */}
                <NotificationCenter />

                {/* User Menu Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase border border-indigo-200">
                      {user.name.substring(0, 2)}
                    </div>
                    <div className="hidden lg:flex flex-col">
                      <span className="text-xs font-semibold text-slate-800 leading-tight">
                        {user.name}
                      </span>
                      <span className="text-[10px] text-slate-500 leading-tight">
                        {user.role.displayName}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
                  </button>

                  {userMenuOpen && (
                    <div
                      onClick={() => setUserMenuOpen(false)}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    >
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-800">{user.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        <span className="mt-1.5 inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {user.role.displayName}
                        </span>
                      </div>

                      <Link
                        href="/settings/telegram"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Send className="w-4 h-4 text-slate-400" />
                        Notifikasi Telegram
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Keluar (Logout)
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {!loading && !user && !isAuthPage && (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                >
                  Daftar
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            {!isAuthPage && user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && user && (
          <div className="md:hidden py-3 border-t border-slate-200 space-y-1">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-600" />
              Dashboard
            </Link>
            <Link
              href="/tickets"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              <Ticket className="w-4 h-4 text-indigo-600" />
              Daftar Tiket
            </Link>
            <Link
              href="/tickets/create"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              <PlusCircle className="w-4 h-4 text-indigo-600" />
              Buat Tiket Baru
            </Link>
            {(user.role.name === "IT_STAFF" ||
              user.role.name === "IT_SUPERVISOR" ||
              user.role.name === "ADMIN") && (
              <Link
                href="/reports"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Laporan SLA
              </Link>
            )}
            {user.role.name === "ADMIN" && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <Shield className="w-4 h-4 text-indigo-600" />
                Admin Panel
              </Link>
            )}
            <Link
              href="/settings/telegram"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              <Send className="w-4 h-4 text-indigo-600" />
              Pengaturan Telegram
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

