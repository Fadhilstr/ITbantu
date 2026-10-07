"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LifeBuoy,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Shield,
  User,
  Users,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal masuk. Periksa kembali email dan kata sandi.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat masuk.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-7 bg-white p-8 sm:p-10 rounded-3xl border-2 border-slate-200 shadow-2xl shadow-slate-900/10">
        {/* Brand Icon & Heading */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-indigo-600 text-white items-center justify-center shadow-lg shadow-indigo-600/30">
            <LifeBuoy className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            Masuk ke ITbantu
          </h2>
          <p className="text-sm font-medium text-slate-700 max-w-xs mx-auto">
            Gunakan akun perusahaan Anda untuk mengakses tiket layanan IT
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border-2 border-rose-300 text-rose-950 rounded-xl text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 block uppercase tracking-wider">
              Email Perusahaan
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@itbantu.local"
                className="w-full pl-10 pr-3.5 py-3 bg-white border-2 border-slate-300 rounded-xl text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 block uppercase tracking-wider">
              Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-3 bg-white border-2 border-slate-300 rounded-xl text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? "Memverifikasi Akun..." : "Masuk Sekarang"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Role Switcher */}
        <div className="pt-4 border-t-2 border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Pilih Akun Demo (1-Klik)
            </span>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              Auto-Fill
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickDemo("fadhil@itbantu.local")}
              className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                email === "fadhil@itbantu.local"
                  ? "border-emerald-600 bg-emerald-50/80 text-emerald-950 shadow-xs"
                  : "border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-white text-slate-900"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-950">Fadhil</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 block">
                Karyawan (User)
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("andi@itbantu.local")}
              className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                email === "andi@itbantu.local"
                  ? "border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-xs"
                  : "border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-white text-slate-900"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-950">Andi Pratama</span>
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
              </div>
              <span className="text-[11px] font-semibold text-indigo-700 block">
                IT Staff
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("supervisor@itbantu.local")}
              className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                email === "supervisor@itbantu.local"
                  ? "border-amber-600 bg-amber-50/80 text-amber-950 shadow-xs"
                  : "border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-white text-slate-900"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-950">Bambang</span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <span className="text-[11px] font-semibold text-amber-700 block">
                IT Supervisor
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("admin@itbantu.local")}
              className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                email === "admin@itbantu.local"
                  ? "border-purple-600 bg-purple-50/80 text-purple-950 shadow-xs"
                  : "border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-white text-slate-900"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-950">Administrator</span>
                <span className="w-2 h-2 rounded-full bg-purple-500" />
              </div>
              <span className="text-[11px] font-semibold text-purple-700 block">
                Super Admin
              </span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs font-medium text-slate-700 pt-1">
          Belum punya akun karyawan?{" "}
          <Link href="/register" className="text-indigo-600 font-bold hover:text-indigo-800 hover:underline">
            Daftar Mandiri
          </Link>
        </p>
      </div>
    </div>
  );
}
