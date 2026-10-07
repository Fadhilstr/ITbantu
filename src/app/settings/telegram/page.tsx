"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Shield,
  KeyRound,
  Unlink,
  Bell,
  BellOff,
  Copy,
  Check,
} from "lucide-react";

export default function TelegramSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isLinked, setIsLinked] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [botUsername, setBotUsername] = useState("ITbantuBot");
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Direct manual linking form state (for quick testing/pairing)
  const [directChatId, setDirectChatId] = useState("");
  const [directUsername, setDirectUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/telegram");
      if (res.ok) {
        const data = await res.json();
        setIsLinked(data.isLinked);
        setTelegramUsername(data.telegramUsername);
        setIsNotificationsEnabled(data.isNotificationsEnabled);
        setBotUsername(data.botUsername || "ITbantuBot");
        if (data.verificationCode) {
          setVerificationCode(data.verificationCode);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleGenerateCode = async () => {
    setSubmitting(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "GENERATE_CODE" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat kode.");

      setVerificationCode(data.code);
      setStatusMsg({ type: "success", text: "Kode verifikasi 6 digit berhasil dibuat." });
    } catch (err: unknown) {
      setStatusMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Terjadi kesalahan.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDirectLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directChatId.trim()) return;

    setSubmitting(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LINK_DIRECT",
          telegramChatId: directChatId,
          telegramUsername: directUsername,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menautkan akun.");

      setStatusMsg({ type: "success", text: "Akun Telegram berhasil ditautkan!" });
      setDirectChatId("");
      setDirectUsername("");
      await fetchStatus();
    } catch (err: unknown) {
      setStatusMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal menautkan akun.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm("Apakah Anda yakin ingin memutuskan tautan akun Telegram ini?")) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UNLINK" }),
      });
      if (res.ok) {
        setIsLinked(false);
        setTelegramUsername(null);
        setVerificationCode(null);
        setStatusMsg({ type: "success", text: "Tautan akun Telegram telah diputuskan." });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleNotifications = async () => {
    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_NOTIFICATIONS" }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsNotificationsEnabled(data.isNotificationsEnabled);
        setStatusMsg({ type: "success", text: data.message });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyCode = () => {
    if (verificationCode) {
      navigator.clipboard.writeText(`/link ${verificationCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
        <p className="text-xs">Memeriksa status Telegram...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Send className="w-6 h-6 text-sky-500" />
          Integrasi & Notifikasi Telegram
        </h1>
        <p className="text-xs text-slate-500">
          Tautkan akun Telegram Anda untuk menerima notifikasi tiket, penugasan, komentar baru, dan konfirmasi penyelesaian secara instan.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
            statusMsg.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Linked Status Card */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                isLinked ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
              }`}
            >
              <Send className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">Status Akun Telegram</h3>
                {isLinked ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    Terhubung
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    Belum Terhubung
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isLinked
                  ? `Terhubung dengan @${telegramUsername || "pengguna"}`
                  : "Akun belum dikaitkan dengan bot Telegram"}
              </p>
            </div>
          </div>

          {isLinked && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleNotifications}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isNotificationsEnabled
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {isNotificationsEnabled ? (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    Notifikasi Aktif
                  </>
                ) : (
                  <>
                    <BellOff className="w-3.5 h-3.5" />
                    Notifikasi Nonaktif
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleUnlink}
                disabled={submitting}
                className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium flex items-center gap-1 transition-colors"
                title="Putuskan tautan"
              >
                <Unlink className="w-3.5 h-3.5" />
                Putuskan
              </button>
            </div>
          )}
        </div>

        {/* Telegram Bot Details */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
          <p className="font-semibold text-slate-800">Nama Bot Resmi:</p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-indigo-600 font-bold">@{botUsername}</span>
            <a
              href={`https://t.me/${botUsername}`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-indigo-600 hover:underline inline-flex items-center gap-1"
            >
              Buka Telegram Web <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Linking Method Tabs (if not linked) */}
      {!isLinked && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Method 1: Verification Code */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-800">
                Metode 1: Kode Verifikasi 6 Digit
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Buat kode verifikasi acak, lalu kirimkan perintah <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">/link [kode]</code> ke bot Telegram @{botUsername}.
              </p>

              {verificationCode ? (
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-center space-y-2">
                  <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">
                    KODE VERIFIKASI ANDA:
                  </span>
                  <p className="font-mono text-3xl font-bold tracking-widest text-indigo-900">
                    {verificationCode}
                  </p>
                  <p className="text-[10px] text-slate-500">Berlaku selama 15 menit</p>

                  <button
                    type="button"
                    onClick={copyCode}
                    className="w-full mt-2 py-2 px-3 bg-white border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-700 hover:bg-indigo-50 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Tersalin! (/link {verificationCode})
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Salin Perintah Telegram
                      </>
                    )}
                  </button>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={handleGenerateCode}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
            >
              {verificationCode ? "Buat Ulang Kode" : "Generate Kode Verifikasi"}
            </button>
          </div>

          {/* Method 2: Direct Chat ID Pairing */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">
              Metode 2: Input Langsung Chat ID
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Jika Anda sudah mengetahui Telegram Chat ID Anda (dari @userinfobot atau ID grup teknisi), masukkan di sini untuk penautan instan.
            </p>

            <form onSubmit={handleDirectLink} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  Telegram Chat ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={directChatId}
                  onChange={(e) => setDirectChatId(e.target.value)}
                  placeholder="Contoh: 123456789"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  Username Telegram (Opsional)
                </label>
                <input
                  type="text"
                  value={directUsername}
                  onChange={(e) => setDirectUsername(e.target.value)}
                  placeholder="fadhil_dev"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !directChatId.trim()}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {submitting ? "Menautkan..." : "Tautkan Chat ID"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Security Notice Card */}
      <div className="p-5 rounded-2xl bg-slate-100/70 border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <Shield className="w-4 h-4 text-indigo-600" />
          Keamanan & Privasi Kredensial Telegram
        </div>
        <p className="text-[11px] leading-relaxed">
          Token bot Telegram disimpan secara eksklusif pada konfigurasi server (tidak pernah keluar ke source code atau browser). Notifikasi diproses melalui antrean asinkron yang toleran terhadap kegagalan jaringan Telegram Bot API.
        </p>
      </div>
    </div>
  );
}

