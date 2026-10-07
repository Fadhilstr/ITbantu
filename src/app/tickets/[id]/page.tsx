"use client";

import React, { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Building2,
  MapPin,
  Phone,
  Calendar,
  Clock,
  Send,
  MessageSquare,
  Lock,
  Paperclip,
  CheckCircle2,
  RefreshCw,
  Archive,
  AlertTriangle,
  UserCheck,
  Download,
  Eye,
  FileText,
  AlertCircle,
  HelpCircle,
  Layers,
} from "lucide-react";
import { StatusBadge, PriorityBadge, TypeBadge } from "@/components/StatusBadge";
import { SlaIndicator } from "@/components/SlaIndicator";
import { AttachmentUploader } from "@/components/AttachmentUploader";
import { AttachmentModal } from "@/components/AttachmentModal";

interface TicketDetailData {
  id: string;
  ticketNumber: string;
  type: string;
  subject: string;
  description: string;
  location: string;
  contactPhone?: string | null;
  priority: string;
  status: string;
  createdAt: string;
  responseDueAt?: string | null;
  respondedAt?: string | null;
  resolutionDueAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  reopenedAt?: string | null;
  resolutionNote?: string | null;
  reopenReason?: string | null;
  pendingReason?: string | null;
  service: { id: string; name: string };
  category: { id: string; name: string };
  user: { id: string; name: string; email: string; phone?: string; department?: { name: string } };
  department?: { id: string; name: string };
  assignedStaff?: { id: string; name: string; email: string } | null;
  assignedTeam?: { id: string; name: string } | null;
  attachments: Array<{
    id: string;
    originalFilename: string;
    mimeType: string;
    fileSize: number;
    createdAt: string;
  }>;
  comments: Array<{
    id: string;
    content: string;
    isInternalNote: boolean;
    createdAt: string;
    user: { id: string; name: string; role: { displayName: string } };
    attachments: Array<{
      id: string;
      originalFilename: string;
      mimeType: string;
      fileSize: number;
    }>;
  }>;
  statusHistories: Array<{
    id: string;
    fromStatus: string;
    toStatus: string;
    note?: string | null;
    createdAt: string;
    actor: { id: string; name: string; role: { displayName: string } };
  }>;
  sla: {
    response: { state: "WITHIN_SLA" | "AT_RISK" | "BREACHED" | "MET"; percentElapsed: number; remainingMinutes: number; isBreached: boolean };
    resolution: { state: "WITHIN_SLA" | "AT_RISK" | "BREACHED" | "MET"; percentElapsed: number; remainingMinutes: number; isBreached: boolean };
  };
}

interface CurrentUser {
  id: string;
  name: string;
  role: { name: string; displayName: string };
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [ticket, setTicket] = useState<TicketDetailData | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Comment state
  const [commentContent, setCommentContent] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Action Modals
  const [activeModal, setActiveModal] = useState<"RESOLVE" | "REOPEN" | "PENDING" | "ASSIGN" | null>(null);
  const [modalText, setModalText] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [staffList, setStaffList] = useState<Array<{ id: string; name: string }>>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Fullscreen Attachment Modal
  const [previewAttachment, setPreviewAttachment] = useState<{
    id: string;
    originalFilename: string;
    mimeType: string;
    fileSize: number;
  } | null>(null);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/tickets/${id}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal memuat tiket.");
      }
      const data = await res.json();
      setTicket(data.ticket);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Tiket tidak ditemukan.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();

    // Load current user profile
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(console.error);

    // Load users for assignment
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.users) {
          // Filter to IT staff & admins
          const itStaff = data.users.filter(
            (u: { role: { name: string } }) =>
              u.role.name === "IT_STAFF" || u.role.name === "IT_SUPERVISOR" || u.role.name === "ADMIN"
          );
          setStaffList(itStaff);
        }
      })
      .catch(() => {});
  }, [fetchTicket]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/tickets/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: commentContent,
          isInternalNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirimkan balasan.");

      // Upload comment attachments if any
      if (commentFiles.length > 0) {
        const formData = new FormData();
        commentFiles.forEach((f) => formData.append("files", f));
        formData.append("commentId", data.comment.id);

        await fetch(`/api/tickets/${id}/attachments`, {
          method: "POST",
          body: formData,
        });
      }

      setCommentContent("");
      setIsInternalNote(false);
      setCommentFiles([]);
      await fetchTicket();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal mengirimkan balasan.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: string, payload: Record<string, unknown> = {}) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          ...payload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah status tiket.");

      setActiveModal(null);
      setModalText("");
      await fetchTicket();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedStaffId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tickets/${id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedStaffId: selectedStaffId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menugaskan tiket.");
      }

      setActiveModal(null);
      await fetchTicket();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan saat penugasan.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaimTicket = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/tickets/${id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedStaffId: currentUser.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengambil tiket.");
      }

      await fetchTicket();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 py-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="h-40 bg-slate-200 rounded-3xl" />
        <div className="h-96 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="p-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Tiket Tidak Dapat Diakses</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">{error}</p>
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Tiket
        </Link>
      </div>
    );
  }

  const isStaffOrAdmin =
    currentUser?.role.name === "IT_STAFF" ||
    currentUser?.role.name === "IT_SUPERVISOR" ||
    currentUser?.role.name === "ADMIN";

  const isCreator = currentUser?.id === ticket.user.id;

  return (
    <div className="space-y-6 py-4">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Tiket
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTicket}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 transition-colors"
            title="Muat Ulang Tiket"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Ticket Header & Primary Metrics Card */}
      <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                #{ticket.ticketNumber}
              </span>
              <TypeBadge type={ticket.type} />
              <StatusBadge status={ticket.status} size="md" />
              <PriorityBadge priority={ticket.priority} size="md" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {ticket.subject}
            </h1>
          </div>

          {/* Quick Staff Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* IT Claim / Assign Button */}
            {isStaffOrAdmin && (
              <>
                {!ticket.assignedStaff && (
                  <button
                    onClick={handleClaimTicket}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Ambil Tiket Ini
                  </button>
                )}

                <button
                  onClick={() => setActiveModal("ASSIGN")}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Tugaskan Staf
                </button>
              </>
            )}

            {/* Workflow status transitions for IT */}
            {isStaffOrAdmin && ticket.status === "OPEN" && (
              <button
                onClick={() => handleStatusChange("IN_PROGRESS")}
                className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
              >
                Mulai Kerjakan
              </button>
            )}

            {isStaffOrAdmin && ticket.status === "ASSIGNED" && (
              <button
                onClick={() => handleStatusChange("IN_PROGRESS")}
                className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
              >
                Mulai Kerjakan
              </button>
            )}

            {isStaffOrAdmin && ticket.status === "IN_PROGRESS" && (
              <>
                <button
                  onClick={() => setActiveModal("PENDING")}
                  className="px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  Pending Tiket
                </button>
                <button
                  onClick={() => setActiveModal("RESOLVE")}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Selesaikan Tiket
                </button>
              </>
            )}

            {isStaffOrAdmin && ticket.status === "PENDING" && (
              <button
                onClick={() => handleStatusChange("IN_PROGRESS")}
                className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
              >
                Lanjutkan Pengerjaan
              </button>
            )}

            {/* User Resolution Confirmation Buttons */}
            {isCreator && ticket.status === "RESOLVED" && (
              <>
                <button
                  onClick={() => handleStatusChange("CLOSED")}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-200 transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Konfirmasi Selesai
                </button>
                <button
                  onClick={() => setActiveModal("REOPEN")}
                  className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Masih Bermasalah
                </button>
              </>
            )}
          </div>
        </div>

        {/* Info Grid (Meta & SLA) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
          {/* Metadata Block 1 */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">Pelapor & Lokasi</span>
            <div className="flex items-center gap-1.5 text-slate-800 font-medium">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{ticket.user.name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{ticket.department?.name || "Divisi Operasional"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{ticket.location}</span>
            </div>
          </div>

          {/* Metadata Block 2 */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">Layanan & Kategori</span>
            <div className="flex items-center gap-1.5 text-slate-800 font-medium">
              <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>{ticket.service?.name}</span>
            </div>
            <div className="text-slate-500 pl-5">
              <span>{ticket.category?.name}</span>
            </div>
            {ticket.contactPhone && (
              <div className="flex items-center gap-1.5 text-slate-500">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{ticket.contactPhone}</span>
              </div>
            )}
          </div>

          {/* Metadata Block 3: Assignment */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">Penugasan IT</span>
            <div className="flex items-center gap-1.5 text-slate-800 font-medium">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>{ticket.assignedStaff ? ticket.assignedStaff.name : "Belum di-assign"}</span>
            </div>
            <div className="text-slate-500 pl-5">
              <span>{ticket.assignedTeam?.name || "Tim IT Terkait"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                Dibuat:{" "}
                {new Date(ticket.createdAt).toLocaleDateString([], {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Metadata Block 4: SLA Indicators */}
          <div className="space-y-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <SlaIndicator
              label="Response SLA"
              sla={ticket.sla?.response}
              dueAt={ticket.responseDueAt}
              completedAt={ticket.respondedAt}
            />
            <SlaIndicator
              label="Resolution SLA"
              sla={ticket.sla?.resolution}
              dueAt={ticket.resolutionDueAt}
              completedAt={ticket.resolvedAt}
            />
          </div>
        </div>

        {/* Resolution Note Alert (if resolved) */}
        {ticket.resolutionNote && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Catatan Solusi dari Tim IT:
            </div>
            <p className="pl-5 leading-relaxed">{ticket.resolutionNote}</p>
          </div>
        )}

        {/* Reopen Reason Alert (if reopened) */}
        {ticket.reopenReason && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Alasan Tiket Dibuka Kembali:
            </div>
            <p className="pl-5 leading-relaxed">{ticket.reopenReason}</p>
          </div>
        )}

        {/* Pending Reason Alert (if pending) */}
        {ticket.pendingReason && ticket.status === "PENDING" && (
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-purple-800">
              <Clock className="w-4 h-4 text-purple-600" />
              Alasan Penundaan (Pending):
            </div>
            <p className="pl-5 leading-relaxed">{ticket.pendingReason}</p>
          </div>
        )}
      </div>

      {/* Main Grid: Description & Conversation vs Activity Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Description & Conversation (Col-span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Problem Description Card */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Deskripsi Masalah
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </p>

            {/* Ticket Attachments Gallery */}
            {ticket.attachments?.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-400">
                  Lampiran Berkas ({ticket.attachments.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ticket.attachments.map((att) => {
                    const isImg = att.mimeType.startsWith("image/");
                    return (
                      <div
                        key={att.id}
                        className="group relative border border-slate-200 rounded-xl p-2 bg-slate-50/50 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer overflow-hidden"
                        onClick={() => setPreviewAttachment(att)}
                      >
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden text-slate-500">
                          {isImg ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={`/api/attachments/${att.id}`}
                              alt={att.originalFilename}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText className="w-5 h-5 text-rose-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-xs font-medium text-slate-800 truncate" title={att.originalFilename}>
                            {att.originalFilename}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {(att.fileSize / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Conversation & Replies */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                Percakapan & Tindak Lanjut ({ticket.comments.length})
              </h3>
              <span className="text-xs text-slate-400">Timeline Balasan</span>
            </div>

            {/* Comment List */}
            <div className="space-y-4">
              {ticket.comments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Belum ada komentar atau balasan. Tuliskan pesan di bawah untuk berkomunikasi.
                </div>
              ) : (
                ticket.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-4 rounded-2xl border transition-colors space-y-2.5 ${
                      comment.isInternalNote
                        ? "bg-amber-50/50 border-amber-200 ring-1 ring-amber-100"
                        : "bg-slate-50/50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
                          {comment.user.name.substring(0, 2)}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-slate-800 mr-2">
                            {comment.user.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500 font-medium">
                            {comment.user.role.displayName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {comment.isInternalNote && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                            <Lock className="w-3 h-3" />
                            Internal Note (Hanya IT)
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {new Date(comment.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          •{" "}
                          {new Date(comment.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap pl-9 leading-relaxed">
                      {comment.content}
                    </p>

                    {/* Comment Attachments */}
                    {comment.attachments?.length > 0 && (
                      <div className="pl-9 pt-2 flex flex-wrap gap-2">
                        {comment.attachments.map((att) => (
                          <button
                            key={att.id}
                            type="button"
                            onClick={() => setPreviewAttachment(att)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-indigo-600 hover:text-indigo-800 shadow-2xs"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{att.originalFilename}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Post Reply Form */}
            <form onSubmit={handlePostComment} className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800 block">
                  Tambah Balasan / Catatan
                </label>

                {/* Internal note switch for IT */}
                {isStaffOrAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(false)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        !isInternalNote
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Public Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(true)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                        isInternalNote
                          ? "bg-amber-600 text-white font-semibold"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      Internal Note
                    </button>
                  </div>
                )}
              </div>

              {isInternalNote && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>
                    Catatan ini bersifat internal dan <strong>TIDAK AKAN</strong> dapat dilihat oleh pengguna biasa.
                  </span>
                </div>
              )}

              <textarea
                required
                rows={3}
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder={
                  isInternalNote
                    ? "Tulis catatan investigasi teknis untuk tim IT..."
                    : "Tulis balasan pesan untuk pengguna..."
                }
                className={`w-full p-3 text-xs sm:text-sm rounded-xl border focus:outline-hidden focus:ring-2 text-slate-900 transition-colors ${
                  isInternalNote
                    ? "border-amber-300 bg-amber-50/20 focus:ring-amber-500"
                    : "border-slate-200 bg-slate-50/50 focus:ring-indigo-500 focus:bg-white"
                }`}
              />

              {/* Comment Attachment Uploader */}
              <AttachmentUploader files={commentFiles} onChange={setCommentFiles} maxFiles={3} />

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={submittingComment || !commentContent.trim()}
                  className={`px-4 py-2.5 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50 ${
                    isInternalNote
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingComment ? "Mengirimkan..." : isInternalNote ? "Simpan Internal Note" : "Kirimkan Balasan"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Status & Activity History (Col-span 1) */}
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Riwayat Aktivitas & Audit
            </h3>
            <p className="text-[11px] text-slate-400">
              Jejak audit seluruh perubahan status dan penugasan tiket
            </p>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {ticket.statusHistories.map((h, idx) => (
                <div key={idx} className="relative text-xs space-y-0.5">
                  <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                  <p className="font-semibold text-slate-800">
                    {h.actor.name}{" "}
                    <span className="font-normal text-slate-500">
                      mengubah status ke <strong>{h.toStatus}</strong>
                    </span>
                  </p>
                  {h.note && <p className="text-slate-600 text-[11px] italic bg-slate-50 p-2 rounded-lg border border-slate-100">"{h.note}"</p>}
                  <p className="text-[10px] text-slate-400">
                    {new Date(h.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    •{" "}
                    {new Date(h.createdAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resolution Modal */}
      {activeModal === "RESOLVE" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Selesaikan Tiket #{ticket.ticketNumber}
            </h3>
            <p className="text-xs text-slate-500">
              Masukkan catatan solusi atau tindakan perbaikan yang telah dilakukan. Catatan ini akan dikirimkan kepada pelapor dan Telegram.
            </p>
            <textarea
              required
              rows={4}
              value={modalText}
              onChange={(e) => setModalText(e.target.value)}
              placeholder="Contoh: Kabel patch cord telah diganti dan switch port di-reset. Koneksi jaringan telah kembali stabil."
              className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoading || !modalText.trim()}
                onClick={() => handleStatusChange("RESOLVED", { resolutionNote: modalText })}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50"
              >
                {actionLoading ? "Memproses..." : "Selesaikan Tiket"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen Modal */}
      {activeModal === "REOPEN" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-rose-600" />
              Buka Kembali Tiket #{ticket.ticketNumber}
            </h3>
            <p className="text-xs text-slate-500">
              Jelaskan mengapa masalah belum terselesaikan agar teknisi IT dapat menindaklanjutinya kembali.
            </p>
            <textarea
              required
              rows={4}
              value={modalText}
              onChange={(e) => setModalText(e.target.value)}
              placeholder="Contoh: Koneksi internet masih terputus saat membuka aplikasi ERP..."
              className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoading || !modalText.trim()}
                onClick={() => handleStatusChange("REOPENED", { reopenReason: modalText })}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50"
              >
                {actionLoading ? "Memproses..." : "Buka Kembali Tiket"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Modal */}
      {activeModal === "PENDING" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              Tunda Pengerjaan Tiket (Pending)
            </h3>
            <p className="text-xs text-slate-500">
              Masukkan alasan penundaan (misal: menunggu suku cadang, menunggu konfirmasi vendor, dll).
            </p>
            <textarea
              required
              rows={3}
              value={modalText}
              onChange={(e) => setModalText(e.target.value)}
              placeholder="Contoh: Menunggu pengiriman kabel LAN pengganti dari vendor..."
              className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoading || !modalText.trim()}
                onClick={() => handleStatusChange("PENDING", { pendingReason: modalText })}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50"
              >
                {actionLoading ? "Memproses..." : "Ubah Jadi Pending"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {activeModal === "ASSIGN" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              Tugaskan Staf IT
            </h3>
            <p className="text-xs text-slate-500">
              Pilih personel IT yang akan bertanggung jawab menyelesaikan tiket ini.
            </p>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
            >
              <option value="">Pilih Staf IT</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoading || !selectedStaffId}
                onClick={handleAssign}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50"
              >
                {actionLoading ? "Memproses..." : "Tugaskan Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Attachment Viewer Modal */}
      <AttachmentModal
        isOpen={Boolean(previewAttachment)}
        onClose={() => setPreviewAttachment(null)}
        attachment={previewAttachment}
      />
    </div>
  );
}

