"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Ticket,
  BarChart3,
  ArrowRight,
  TrendingUp,
  Archive,
  RefreshCw,
  Zap,
} from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";

interface UserDashboardData {
  role: "USER";
  counts: {
    OPEN: number;
    ASSIGNED: number;
    IN_PROGRESS: number;
    PENDING: number;
    RESOLVED: number;
    CLOSED: number;
    REOPENED: number;
    TOTAL: number;
  };
  recentTickets: Array<{
    id: string;
    ticketNumber: string;
    type: string;
    subject: string;
    priority: string;
    status: string;
    createdAt: string;
    service?: { name: string; icon: string };
    category?: { name: string };
    assignedStaff?: { name: string };
  }>;
}

interface ItDashboardData {
  role: "IT_STAFF" | "IT_SUPERVISOR" | "ADMIN";
  totalCount: number;
  statusCounts: {
    OPEN: number;
    ASSIGNED: number;
    IN_PROGRESS: number;
    PENDING: number;
    RESOLVED: number;
    CLOSED: number;
    REOPENED: number;
  };
  priorityCounts: {
    LOW: number;
    NORMAL: number;
    HIGH: number;
    CRITICAL: number;
  };
  serviceStats: Array<{ name: string; count: number }>;
  departmentStats: Array<{ name: string; count: number }>;
  sla: {
    slaAtRiskCount: number;
    slaBreachedCount: number;
    complianceRate: number;
    avgResolutionHours: number;
    totalResolved: number;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<UserDashboardData | ItDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const stats = await res.json();
          setData(stats);
        }
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="h-24 bg-slate-200 rounded-2xl" />
          <div className="h-24 bg-slate-200 rounded-2xl" />
          <div className="h-24 bg-slate-200 rounded-2xl" />
          <div className="h-24 bg-slate-200 rounded-2xl" />
        </div>
        <div className="h-64 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  // 1. END USER DASHBOARD
  if (data?.role === "USER") {
    const { counts, recentTickets } = data;
    return (
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-linear-to-r from-indigo-900 to-slate-900 text-white shadow-lg border border-slate-800">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-indigo-400">
              Portal Karyawan
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              Dashboard Layanan IT
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Pantau status tiket Anda atau buat permohonan bantuan teknis, perbaikan hardware, maupun akses sistem.
            </p>
          </div>

          <Link
            href="/tickets/create"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold shadow-md shadow-indigo-500/25 transition-all self-start sm:self-auto active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            Buat Tiket Baru
          </Link>
        </div>

        {/* User Ticket Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <Link
            href="/tickets?status=OPEN"
            className="p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-blue-500 transition-all shadow-xs hover:shadow-md group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Open</span>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 group-hover:scale-125 transition-transform" />
            </div>
            <p className="text-3xl font-extrabold text-slate-950 mt-2">{counts.OPEN}</p>
            <p className="text-[11px] font-semibold text-slate-600 mt-1">Menunggu respon</p>
          </Link>

          <Link
            href="/tickets?status=ASSIGNED"
            className="p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-amber-500 transition-all shadow-xs hover:shadow-md group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Assigned</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 group-hover:scale-125 transition-transform" />
            </div>
            <p className="text-3xl font-extrabold text-slate-950 mt-2">{counts.ASSIGNED}</p>
            <p className="text-[11px] font-semibold text-slate-600 mt-1">Teknisi ditunjuk</p>
          </Link>

          <Link
            href="/tickets?status=IN_PROGRESS"
            className="p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-orange-500 transition-all shadow-xs hover:shadow-md group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">In Progress</span>
              <span className="w-2.5 h-2.5 rounded-full bg-orange-600 group-hover:scale-125 transition-transform" />
            </div>
            <p className="text-3xl font-extrabold text-slate-950 mt-2">{counts.IN_PROGRESS}</p>
            <p className="text-[11px] font-semibold text-slate-600 mt-1">Sedang ditangani</p>
          </Link>

          <Link
            href="/tickets?status=PENDING"
            className="p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-purple-500 transition-all shadow-xs hover:shadow-md group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Pending</span>
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 group-hover:scale-125 transition-transform" />
            </div>
            <p className="text-3xl font-extrabold text-slate-950 mt-2">{counts.PENDING}</p>
            <p className="text-[11px] font-semibold text-slate-600 mt-1">Menunggu info/part</p>
          </Link>

          <Link
            href="/tickets?status=RESOLVED"
            className="p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-500 transition-all shadow-xs hover:shadow-md group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Resolved</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 group-hover:scale-125 transition-transform" />
            </div>
            <p className="text-3xl font-extrabold text-slate-950 mt-2">{counts.RESOLVED}</p>
            <p className="text-[11px] font-bold text-emerald-700 mt-1">Perlu konfirmasi</p>
          </Link>

          <Link
            href="/tickets?status=CLOSED"
            className="p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-slate-500 transition-all shadow-xs hover:shadow-md group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Closed</span>
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500 group-hover:scale-125 transition-transform" />
            </div>
            <p className="text-3xl font-extrabold text-slate-950 mt-2">{counts.CLOSED}</p>
            <p className="text-[11px] font-semibold text-slate-600 mt-1">Selesai tuntas</p>
          </Link>
        </div>

        {/* Recent Tickets Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Tiket Terbaru Saya</h3>
              <p className="text-xs text-slate-500">Daftar permohonan dan insiden yang baru diajukan</p>
            </div>
            <Link
              href="/tickets"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Lihat Semua Tiket <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Ticket className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
              <p className="text-sm font-medium text-slate-600">Belum ada tiket yang diajukan.</p>
              <Link
                href="/tickets/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
              >
                <PlusCircle className="w-4 h-4" />
                Buat Tiket Pertama Anda
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentTickets.map((t) => (
                <Link
                  key={t.id}
                  href={`/tickets/${t.id}`}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        #{t.ticketNumber}
                      </span>
                      <StatusBadge status={t.status} size="sm" />
                      <PriorityBadge priority={t.priority} size="sm" />
                    </div>
                    <p className="font-semibold text-sm text-slate-900 truncate">{t.subject}</p>
                    <p className="text-xs text-slate-400">
                      {t.service?.name} • {t.category?.name} • Dibuat{" "}
                      {new Date(t.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    {t.assignedStaff ? (
                      <div className="text-xs">
                        <span className="text-[10px] text-slate-400 block">Ditangani oleh</span>
                        <span className="font-medium text-slate-700">{t.assignedStaff.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Belum di-assign</span>
                    )}
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. IT STAFF / SUPERVISOR / ADMIN DASHBOARD
  const itData = data as ItDashboardData;
  const { statusCounts, priorityCounts, sla, serviceStats, departmentStats } = itData;

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
            <BarChart3 className="w-3.5 h-3.5" />
            IT Service Desk Command Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            IT Service Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Total {itData.totalCount} tiket terdaftar di seluruh divisi sistem perusahaan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/tickets"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
          >
            Lihat Work Queue
          </Link>
          <Link
            href="/reports"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all active:scale-95"
          >
            Laporan SLA
          </Link>
        </div>
      </div>

      {/* SLA Health Cockpit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* SLA At Risk */}
        <div className="p-5 rounded-2xl bg-white border border-amber-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              SLA At Risk
            </span>
            <p className="text-3xl font-bold text-amber-800 mt-1">{sla.slaAtRiskCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Waktu tersisa &lt; 25%</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* SLA Breached */}
        <div className="p-5 rounded-2xl bg-white border border-rose-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
              SLA Breached
            </span>
            <p className="text-3xl font-bold text-rose-800 mt-1">{sla.slaBreachedCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Melewati batas waktu</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>

        {/* SLA Compliance */}
        <div className="p-5 rounded-2xl bg-white border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              SLA Compliance
            </span>
            <p className="text-3xl font-bold text-emerald-800 mt-1">{sla.complianceRate}%</p>
            <p className="text-xs text-slate-500 mt-0.5">Dari {sla.totalResolved} tiket selesai</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Avg Resolution Time */}
        <div className="p-5 rounded-2xl bg-white border border-indigo-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
              Rata-rata Resolusi
            </span>
            <p className="text-3xl font-bold text-indigo-800 mt-1">{sla.avgResolutionHours} Jam</p>
            <p className="text-xs text-slate-500 mt-0.5">Waktu penyelesaian</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Ticket Status Work Queue Counters */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800">Antrian Status Tiket (Active Work Queue)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/tickets?status=OPEN"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 shadow-2xs transition-all"
          >
            <span className="text-xs font-medium text-slate-500">Open</span>
            <p className="text-2xl font-bold text-blue-700 mt-1">{statusCounts.OPEN}</p>
            <span className="text-[10px] text-slate-400">Belum di-assign</span>
          </Link>

          <Link
            href="/tickets?status=ASSIGNED"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 shadow-2xs transition-all"
          >
            <span className="text-xs font-medium text-slate-500">Assigned</span>
            <p className="text-2xl font-bold text-amber-700 mt-1">{statusCounts.ASSIGNED}</p>
            <span className="text-[10px] text-slate-400">Siap dikerjakan</span>
          </Link>

          <Link
            href="/tickets?status=IN_PROGRESS"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-orange-400 shadow-2xs transition-all"
          >
            <span className="text-xs font-medium text-slate-500">In Progress</span>
            <p className="text-2xl font-bold text-orange-700 mt-1">{statusCounts.IN_PROGRESS}</p>
            <span className="text-[10px] text-slate-400">Sedang ditangani</span>
          </Link>

          <Link
            href="/tickets?status=PENDING"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 shadow-2xs transition-all"
          >
            <span className="text-xs font-medium text-slate-500">Pending</span>
            <p className="text-2xl font-bold text-purple-700 mt-1">{statusCounts.PENDING}</p>
            <span className="text-[10px] text-slate-400">Menunggu info/vendor</span>
          </Link>

          <Link
            href="/tickets?status=RESOLVED"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 shadow-2xs transition-all"
          >
            <span className="text-xs font-medium text-slate-500">Resolved</span>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{statusCounts.RESOLVED}</p>
            <span className="text-[10px] text-slate-400">Menunggu user</span>
          </Link>

          <Link
            href="/tickets?status=REOPENED"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-rose-400 shadow-2xs transition-all"
          >
            <span className="text-xs font-medium text-slate-500">Reopened</span>
            <p className="text-2xl font-bold text-rose-700 mt-1">{statusCounts.REOPENED}</p>
            <span className="text-[10px] text-slate-400">Prioritas tindak lanjut</span>
          </Link>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown by Service */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-800">Tiket Berdasarkan Layanan IT</h4>
            <span className="text-xs text-slate-400">Distribusi Beban</span>
          </div>
          <div className="space-y-3">
            {serviceStats.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700">{item.name}</span>
                  <span className="font-semibold text-slate-900">{item.count} tiket</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        Math.round((item.count / Math.max(itData.totalCount, 1)) * 100),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown by Priority & Department */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-800">Tiket Berdasarkan Prioritas</h4>
            <span className="text-xs text-slate-400">Urgensi Masalah</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <span className="text-xs font-semibold text-red-700">Critical</span>
              <p className="text-2xl font-bold text-red-800 mt-1">{priorityCounts.CRITICAL}</p>
              <p className="text-[10px] text-red-600">SLA: 1 Jam</p>
            </div>
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
              <span className="text-xs font-semibold text-orange-700">High</span>
              <p className="text-2xl font-bold text-orange-800 mt-1">{priorityCounts.HIGH}</p>
              <p className="text-[10px] text-orange-600">SLA: 4 Jam</p>
            </div>
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
              <span className="text-xs font-semibold text-sky-700">Normal</span>
              <p className="text-2xl font-bold text-sky-800 mt-1">{priorityCounts.NORMAL}</p>
              <p className="text-[10px] text-sky-600">SLA: 8 Jam</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
              <span className="text-xs font-semibold text-slate-700">Low</span>
              <p className="text-2xl font-bold text-slate-800 mt-1">{priorityCounts.LOW}</p>
              <p className="text-[10px] text-slate-600">SLA: 48 Jam</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

