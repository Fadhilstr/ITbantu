"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Layers,
  Clock,
  Shield,
  Send,
  Plus,
  Check,
  X,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  KeyRound,
  Building2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  isActive: boolean;
  role: { id: string; name: string; displayName: string };
  department?: { id: string; name: string; code: string } | null;
  itTeam?: { id: string; name: string } | null;
  _count: { createdTickets: number; assignedTickets: number };
}

interface ServiceItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    defaultPriority: string;
    estimatedSlaHours: number;
    isActive: boolean;
  }>;
}

interface SlaRuleItem {
  id: string;
  priority: string;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  escalationLevel: number;
  isActive: boolean;
}

interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  actor: { name: string; email: string; role: { displayName: string } };
  ticket?: { ticketNumber: string; subject: string } | null;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"USERS" | "SERVICES" | "SLA" | "AUDIT">("USERS");
  const [loading, setLoading] = useState(true);

  // Users state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string; displayName: string }>>([]);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [itTeams, setItTeams] = useState<Array<{ id: string; name: string }>>([]);

  // Services state
  const [services, setServices] = useState<ServiceItem[]>([]);

  // SLA state
  const [slaRules, setSlaRules] = useState<SlaRuleItem[]>([]);

  // Audit state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Modal / Form state for User Creation
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRoleId, setNewUserRoleId] = useState("");
  const [newUserDeptId, setNewUserDeptId] = useState("");
  const [newUserTeamId, setNewUserTeamId] = useState("");
  const [submittingUser, setSubmittingUser] = useState(false);

  // Modal for Service/Category creation
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatPriority, setNewCatPriority] = useState("NORMAL");
  const [newCatSla, setNewCatSla] = useState(8);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, servicesRes, slaRes, auditRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/services"),
        fetch("/api/admin/sla"),
        fetch("/api/admin/audit-logs"),
      ]);

      if (usersRes.ok) {
        const u = await usersRes.json();
        setUsers(u.users || []);
        setRoles(u.roles || []);
        setDepartments(u.departments || []);
        setItTeams(u.itTeams || []);
        if (u.roles?.length > 0) setNewUserRoleId(u.roles[0].id);
      }

      if (servicesRes.ok) {
        const s = await servicesRes.json();
        setServices(s.services || []);
      }

      if (slaRes.ok) {
        const sl = await slaRes.json();
        setSlaRules(sl.slaRules || []);
      }

      if (auditRes.ok) {
        const a = await auditRes.json();
        setAuditLogs(a.logs || []);
      }
    } catch (err) {
      console.error("Admin load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingUser(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          roleId: newUserRoleId,
          departmentId: newUserDeptId || undefined,
          itTeamId: newUserTeamId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat pengguna.");

      setIsAddUserOpen(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleToggleUserActive = async (id: string, currentStatus: boolean) => {
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isActive: !currentStatus } : u))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCategory = async (serviceId: string) => {
    if (!newCatName.trim()) return;
    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_CATEGORY",
          categoryData: {
            serviceId,
            name: newCatName,
            defaultPriority: newCatPriority,
            estimatedSlaHours: newCatSla,
          },
        }),
      });
      if (res.ok) {
        setIsAddCategoryOpen(null);
        setNewCatName("");
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSla = async (id: string, responseMinutes: number, resolutionMinutes: number) => {
    try {
      const res = await fetch("/api/admin/sla", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          responseTimeMinutes: responseMinutes,
          resolutionTimeMinutes: resolutionMinutes,
        }),
      });
      if (res.ok) {
        await loadData();
        alert("Aturan SLA berhasil diperbarui.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Pusat Kontrol Administrator
              </h1>
              <p className="text-xs text-slate-500">
                Konfigurasi pengguna, peran, katalog layanan, SLA, dan penelusuran jejak audit
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadData}
          className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition-colors self-start sm:self-auto"
          title="Muat ulang data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("USERS")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "USERS"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          Pengguna & Peran ({users.length})
        </button>

        <button
          onClick={() => setActiveTab("SERVICES")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "SERVICES"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          Katalog Layanan & Kategori ({services.length})
        </button>

        <button
          onClick={() => setActiveTab("SLA")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "SLA"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          Aturan Waktu SLA ({slaRules.length})
        </button>

        <button
          onClick={() => setActiveTab("AUDIT")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "AUDIT"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Shield className="w-4 h-4" />
          Jejak Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: USERS & ROLES */}
      {activeTab === "USERS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Daftar Pengguna Sistem</h3>
              <p className="text-xs text-slate-400">Kelola karyawan, IT staff, supervisor, dan status aktif akun</p>
            </div>
            <button
              onClick={() => setIsAddUserOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Tambah Pengguna
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[11px]">
                    <th className="py-3 px-4 sm:px-6">Nama & Email</th>
                    <th className="py-3 px-4">Peran (Role)</th>
                    <th className="py-3 px-4">Departemen / Tim</th>
                    <th className="py-3 px-4">Aktivitas Tiket</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 sm:px-6">
                        <p className="font-semibold text-slate-900">{u.name}</p>
                        <p className="text-slate-400 text-[11px]">{u.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {u.role.displayName}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">{u.department?.name || "-"}</p>
                        <p className="text-slate-400 text-[11px]">{u.itTeam?.name || ""}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {u._count.createdTickets} dibuat • {u._count.assignedTickets} ditugaskan
                      </td>
                      <td className="py-3 px-4">
                        {u.isActive ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
                            Aktif
                          </span>
                        ) : (
                          <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-medium border border-rose-200">
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleUserActive(u.id, u.isActive)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                            u.isActive
                              ? "text-rose-600 hover:bg-rose-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SERVICE CATALOG & CATEGORIES */}
      {activeTab === "SERVICES" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Manajemen Katalog Layanan IT</h3>
              <p className="text-xs text-slate-400">Atur layanan dan sub-kategori masalah yang dapat dipilih pengguna</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{service.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">slug: {service.slug}</span>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                      Aktif
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">{service.description}</p>

                  {/* Sub-categories */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Sub-Kategori Masalah ({service.categories.length})
                    </span>
                    <div className="divide-y divide-slate-100 text-xs">
                      {service.categories.map((c) => (
                        <div key={c.id} className="py-2 flex items-center justify-between">
                          <span className="font-medium text-slate-800">{c.name}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                              Pri: {c.defaultPriority}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                              ~{c.estimatedSlaHours}j
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {isAddCategoryOpen === service.id ? (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 mt-2">
                    <input
                      type="text"
                      placeholder="Nama Sub-Kategori Baru"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <select
                        value={newCatPriority}
                        onChange={(e) => setNewCatPriority(e.target.value)}
                        className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs flex-1"
                      >
                        <option value="LOW">Low</option>
                        <option value="NORMAL">Normal</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={newCatSla}
                        onChange={(e) => setNewCatSla(Number(e.target.value))}
                        className="w-16 p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        placeholder="Jam"
                      />
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        onClick={() => setIsAddCategoryOpen(null)}
                        className="px-2.5 py-1 text-slate-500 text-xs"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => handleCreateCategory(service.id)}
                        className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddCategoryOpen(service.id)}
                    className="w-full mt-2 py-2 border border-dashed border-slate-300 hover:border-indigo-400 rounded-xl text-xs text-indigo-600 hover:bg-indigo-50 flex items-center justify-center gap-1 font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Sub-Kategori
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SLA RULES */}
      {activeTab === "SLA" && (
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-800">Konfigurasi Aturan Waktu SLA</h3>
            <p className="text-xs text-slate-400">
              Tentukan target waktu respon awal dan waktu penyelesaian maksimal berdasarkan prioritas
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {slaRules.map((rule) => (
              <div
                key={rule.id}
                className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{rule.priority}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    Level {rule.escalationLevel}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-slate-500 block">Response SLA (Menit):</label>
                    <input
                      type="number"
                      defaultValue={rule.responseTimeMinutes}
                      id={`resp-${rule.id}`}
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-slate-500 block">Resolution SLA (Menit):</label>
                    <input
                      type="number"
                      defaultValue={rule.resolutionTimeMinutes}
                      id={`resol-${rule.id}`}
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const resp = (document.getElementById(`resp-${rule.id}`) as HTMLInputElement)?.value;
                    const resol = (document.getElementById(`resol-${rule.id}`) as HTMLInputElement)?.value;
                    handleUpdateSla(rule.id, Number(resp), Number(resol));
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Simpan Aturan
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL LOG */}
      {activeTab === "AUDIT" && (
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-800">Jejak Audit Trail Sistem</h3>
            <p className="text-xs text-slate-400">
              Log aktivitas seluruh perubahan tiket, status, peran, dan berkas lampiran
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[11px]">
                    <th className="py-3 px-4 sm:px-6">Waktu</th>
                    <th className="py-3 px-4">Pengguna (Aktor)</th>
                    <th className="py-3 px-4">Aksi</th>
                    <th className="py-3 px-4">Entitas / Tiket</th>
                    <th className="py-3 px-4">Nilai Perubahan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 sm:px-6 text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="font-semibold text-slate-800">{log.actor.name}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{log.actor.email}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        {log.ticket ? (
                          <span className="font-bold text-indigo-700">#{log.ticket.ticketNumber}</span>
                        ) : (
                          <span className="text-slate-500">{log.entityType} ({log.entityId.substring(0, 8)})</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-xs">
                        {log.newValue || log.oldValue || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Tambah Pengguna Baru</h3>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="Nama Lengkap"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Email Perusahaan</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="user@itbantu.local"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Kata Sandi Awal</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="Min. 8 karakter"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Peran (Role)</label>
                <select
                  value={newUserRoleId}
                  onChange={(e) => setNewUserRoleId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.displayName} ({r.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Departemen / Divisi</label>
                <select
                  value={newUserDeptId}
                  onChange={(e) => setNewUserDeptId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">Pilih Departemen (Opsional)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Tim IT Spesialis (Khusus IT)</label>
                <select
                  value={newUserTeamId}
                  onChange={(e) => setNewUserTeamId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="">Pilih Tim IT (Opsional)</option>
                  {itTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingUser}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {submittingUser ? "Menyimpan..." : "Buat Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

