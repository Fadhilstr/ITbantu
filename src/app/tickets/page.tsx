"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  PlusCircle,
  Ticket as TicketIcon,
  MessageSquare,
  Paperclip,
  ArrowRight,
  Clock,
  RefreshCw,
  X,
} from "lucide-react";
import { StatusBadge, PriorityBadge, TypeBadge } from "@/components/StatusBadge";

interface TicketItem {
  id: string;
  ticketNumber: string;
  type: string;
  subject: string;
  priority: string;
  status: string;
  createdAt: string;
  location: string;
  service?: { id: string; name: string };
  category?: { id: string; name: string };
  user: { id: string; name: string; email: string; department?: { name: string } };
  department?: { id: string; name: string; code: string };
  assignedStaff?: { id: string; name: string };
  assignedTeam?: { id: string; name: string };
  _count: { comments: number; attachments: number };
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [serviceId, setServiceId] = useState("ALL");
  const [myAssigned, setMyAssigned] = useState(false);

  // Meta
  const [services, setServices] = useState<Array<{ id: string; name: string }>>([]);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status !== "ALL") params.set("status", status);
      if (priority !== "ALL") params.set("priority", priority);
      if (type !== "ALL") params.set("type", type);
      if (serviceId !== "ALL") params.set("serviceId", serviceId);
      if (myAssigned) params.set("myAssigned", "true");

      const res = await fetch(`/api/tickets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
    }
  }, [search, status, priority, type, serviceId, myAssigned]);

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        if (data.services) setServices(data.services);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const resetFilters = () => {
    setSearch("");
    setStatus("ALL");
    setPriority("ALL");
    setType("ALL");
    setServiceId("ALL");
    setMyAssigned(false);
  };

  const hasActiveFilters =
    search || status !== "ALL" || priority !== "ALL" || type !== "ALL" || serviceId !== "ALL" || myAssigned;

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Daftar Tiket Layanan IT
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola, telusuri, dan periksa status penyelesaian tiket service desk
          </p>
        </div>

        <Link
          href="/tickets/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all active:scale-95 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Buat Tiket Baru
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-5 sm:p-6 bg-white rounded-3xl border-2 border-slate-200 shadow-sm space-y-4">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor tiket (#INC-2026-...), subjek masalah, atau nama pelapor..."
            className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all"
          />
        </div>

        {/* Multi-Filter Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2.5 bg-white border-2 border-slate-300 rounded-xl font-bold text-slate-950 focus:outline-hidden focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all"
          >
            <option value="ALL">Semua Status</option>
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PENDING">Pending</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="REOPENED">Reopened</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="px-3 py-2.5 bg-white border-2 border-slate-300 rounded-xl font-bold text-slate-950 focus:outline-hidden focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all"
          >
            <option value="ALL">Semua Prioritas</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>

          {/* Type Filter */}
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-2.5 bg-white border-2 border-slate-300 rounded-xl font-bold text-slate-950 focus:outline-hidden focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all"
          >
            <option value="ALL">Semua Jenis</option>
            <option value="INCIDENT">Incident</option>
            <option value="REQUEST">Service Request</option>
            <option value="COMPLAINT">Complaint</option>
          </select>

          {/* Service Catalog Filter */}
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="px-3 py-2.5 bg-white border-2 border-slate-300 rounded-xl font-bold text-slate-950 focus:outline-hidden focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all"
          >
            <option value="ALL">Semua Layanan</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Reset Filters / Refresh */}
          <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-medium flex items-center justify-center gap-1 transition-colors"
                title="Reset filter"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={loadTickets}
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition-colors"
              title="Refresh daftar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Tickets Table / List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span>Memuat data tiket...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <TicketIcon className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada tiket yang cocok</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Tidak ditemukan tiket dengan filter yang dipilih atau belum ada tiket baru yang diajukan.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-semibold text-indigo-600 hover:underline pt-2 block mx-auto"
              >
                Bersihkan filter pencarian
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-100 text-slate-900 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 sm:px-6">Tiket</th>
                  <th className="py-3.5 px-4">Layanan & Kategori</th>
                  <th className="py-3.5 px-4">Pelapor</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Prioritas</th>
                  <th className="py-3.5 px-4">Teknisi</th>
                  <th className="py-3.5 px-4 text-right">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-indigo-50/50 transition-colors group cursor-pointer"
                    onClick={() => (window.location.href = `/tickets/${t.id}`)}
                  >
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex flex-col gap-1 max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            #{t.ticketNumber}
                          </span>
                          <TypeBadge type={t.type} />
                          {t._count.comments > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-slate-400 text-[10px]">
                              <MessageSquare className="w-3 h-3" />
                              {t._count.comments}
                            </span>
                          )}
                          {t._count.attachments > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-slate-400 text-[10px]">
                              <Paperclip className="w-3 h-3" />
                              {t._count.attachments}
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-sm text-slate-950 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {t.subject}
                        </p>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900">{t.service?.name}</p>
                      <p className="text-[11px] font-semibold text-slate-600">{t.category?.name}</p>
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900">{t.user.name}</p>
                      <p className="text-[11px] font-medium text-slate-600">{t.department?.name || "Operations"}</p>
                    </td>

                    <td className="py-4 px-4">
                      <StatusBadge status={t.status} size="sm" />
                    </td>

                    <td className="py-4 px-4">
                      <PriorityBadge priority={t.priority} size="sm" />
                    </td>

                    <td className="py-4 px-4">
                      {t.assignedStaff ? (
                        <span className="font-bold text-slate-900">{t.assignedStaff.name}</span>
                      ) : (
                        <span className="text-slate-500 italic font-medium">Belum di-assign</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right text-slate-700 font-semibold">
                      {new Date(t.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

