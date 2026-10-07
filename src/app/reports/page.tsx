"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  BarChart3,
  CheckCircle2,
  AlertOctagon,
  Clock,
  TrendingUp,
  Download,
  Calendar,
  Layers,
  Building2,
  RefreshCw,
} from "lucide-react";

interface StatsData {
  totalCount: number;
  statusCounts: Record<string, number>;
  priorityCounts: Record<string, number>;
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

const PRIORITY_COLORS = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  NORMAL: "#0ea5e9",
  LOW: "#64748b",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#3b82f6",
  ASSIGNED: "#f59e0b",
  IN_PROGRESS: "#f97316",
  PENDING: "#a855f7",
  RESOLVED: "#10b981",
  CLOSED: "#64748b",
  REOPENED: "#f43f5e",
};

export default function ReportsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-12 text-center text-slate-400 space-y-2">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
        <p className="text-xs">Memuat laporan analitik...</p>
      </div>
    );
  }

  const { statusCounts, priorityCounts, serviceStats, departmentStats, sla } = data;

  const statusChartData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    count: value,
    color: STATUS_COLORS[name] || "#6366f1",
  }));

  const priorityChartData = Object.entries(priorityCounts).map(([name, value]) => ({
    name,
    count: value,
    color: PRIORITY_COLORS[name as keyof typeof PRIORITY_COLORS] || "#64748b",
  }));

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Laporan & Analitik SLA Layanan IT
              </h1>
              <p className="text-xs text-slate-500">
                Statistik volume tiket, efisiensi kerja tim, kepatuhan SLA, dan tren insiden
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          Cetak Laporan (Print / PDF)
        </button>
      </div>

      {/* SLA Key Performance Indicators (KPI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Tiket Terdaftar
            </span>
            <p className="text-3xl font-bold text-slate-900 mt-1">{data.totalCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Seluruh kategori layanan</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
              Kepatuhan SLA (Compliance)
            </span>
            <p className="text-3xl font-bold text-emerald-700 mt-1">{sla.complianceRate}%</p>
            <p className="text-xs text-slate-500 mt-0.5">Tercapai tepat waktu</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">
              Rata-rata Waktu Resolusi
            </span>
            <p className="text-3xl font-bold text-indigo-700 mt-1">{sla.avgResolutionHours} Jam</p>
            <p className="text-xs text-slate-500 mt-0.5">Durasi pengerjaan teknis</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
              Tiket Melewati SLA (Breached)
            </span>
            <p className="text-3xl font-bold text-rose-700 mt-1">{sla.slaBreachedCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Perlu perhatian manajemen</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Tiket Berdasarkan Status */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-800">Distribusi Tiket Berdasarkan Status</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "0.75rem",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Tiket Berdasarkan Prioritas (Donut) */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-800">Komposisi Tiket Berdasarkan Prioritas</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`cell-priority-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "0.75rem",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table/Bar 3: Tiket Berdasarkan Layanan IT */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Beban Layanan IT (Katalog Layanan)
          </h3>
          <div className="space-y-3">
            {serviceStats.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700">{item.name}</span>
                  <span className="font-bold text-slate-900">{item.count} tiket</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        Math.round((item.count / Math.max(data.totalCount, 1)) * 100),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Table/Bar 4: Tiket Berdasarkan Departemen */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            Asal Tiket (Departemen Pengirim)
          </h3>
          <div className="space-y-3">
            {departmentStats.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700">{item.name}</span>
                  <span className="font-bold text-slate-900">{item.count} tiket</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-sky-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        Math.round((item.count / Math.max(data.totalCount, 1)) * 100),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

