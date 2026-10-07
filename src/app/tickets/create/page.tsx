"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LifeBuoy,
  Wifi,
  Laptop,
  Boxes,
  LayoutGrid,
  KeyRound,
  Mail,
  ShieldAlert,
  HelpCircle,
  AlertTriangle,
  FileText,
  AlertCircle,
  ArrowRight,
  Check,
  Send,
  Building2,
  MapPin,
  Phone,
} from "lucide-react";
import { AttachmentUploader } from "@/components/AttachmentUploader";

interface Service {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    defaultPriority: string;
    estimatedSlaHours: number;
  }>;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function CreateTicketPage() {
  const router = useRouter();

  // Form State
  const [ticketType, setTicketType] = useState<"INCIDENT" | "REQUEST" | "COMPLAINT">("INCIDENT");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [location, setLocation] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  // Metadata
  const [services, setServices] = useState<Service[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/services");
        if (res.ok) {
          const data = await res.json();
          setServices(data.services || []);
          setDepartments(data.departments || []);

          if (data.services?.length > 0) {
            setSelectedServiceId(data.services[0].id);
            if (data.services[0].categories?.length > 0) {
              setSelectedCategoryId(data.services[0].categories[0].id);
              setPriority(data.services[0].categories[0].defaultPriority || "NORMAL");
            }
          }
        }
      } catch (err) {
        console.error("Failed to load catalog:", err);
      } finally {
        setLoadingServices(false);
      }
    }
    loadData();
  }, []);

  const activeService = services.find((s) => s.id === selectedServiceId);
  const activeCategory = activeService?.categories?.find((c) => c.id === selectedCategoryId);

  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const s = services.find((srv) => srv.id === serviceId);
    if (s && s.categories?.length > 0) {
      setSelectedCategoryId(s.categories[0].id);
      setPriority(s.categories[0].defaultPriority || "NORMAL");
    } else {
      setSelectedCategoryId("");
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    const c = activeService?.categories?.find((cat) => cat.id === categoryId);
    if (c) {
      setPriority(c.defaultPriority || "NORMAL");
    }
  };

  const getServiceIcon = (iconName?: string) => {
    switch (iconName) {
      case "Wifi":
        return <Wifi className="w-5 h-5" />;
      case "Laptop":
        return <Laptop className="w-5 h-5" />;
      case "Boxes":
        return <Boxes className="w-5 h-5" />;
      case "LayoutGrid":
        return <LayoutGrid className="w-5 h-5" />;
      case "KeyRound":
        return <KeyRound className="w-5 h-5" />;
      case "Mail":
        return <Mail className="w-5 h-5" />;
      case "ShieldAlert":
        return <ShieldAlert className="w-5 h-5" />;
      default:
        return <HelpCircle className="w-5 h-5" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedServiceId || !selectedCategoryId) {
      setError("Silakan pilih layanan dan kategori masalah.");
      return;
    }

    if (!subject.trim() || !description.trim() || !location.trim()) {
      setError("Subjek, deskripsi masalah, dan lokasi wajib diisi.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Create ticket
      const ticketRes = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: ticketType,
          serviceId: selectedServiceId,
          categoryId: selectedCategoryId,
          subject,
          description,
          priority,
          location,
          departmentId: departmentId || undefined,
          contactPhone,
        }),
      });

      const ticketData = await ticketRes.json();
      if (!ticketRes.ok) {
        throw new Error(ticketData.error || "Gagal membuat tiket.");
      }

      const ticketId = ticketData.ticket.id;

      // 2. Upload attachments if any
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));

        const uploadRes = await fetch(`/api/tickets/${ticketId}/attachments`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          console.warn("Attachment upload warning:", await uploadRes.json());
        }
      }

      // Redirect to newly created ticket detail page
      router.push(`/tickets/${ticketId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses tiket.";
      setError(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/tickets" className="hover:text-indigo-600">
            Tiket
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">Buat Tiket Baru</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Formulir Permohonan Layanan IT
        </h1>
        <p className="text-xs text-slate-500">
          Pilih jenis permohonan, kategori layanan, dan sertakan detail kendala beserta screenshot
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Ticket Type Selector */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            1. Jenis Tiket (Ticket Type)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTicketType("INCIDENT")}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                ticketType === "INCIDENT"
                  ? "border-rose-400 bg-rose-50/50 ring-2 ring-rose-200"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  ticketType === "INCIDENT" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900">Incident</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gangguan teknis atau kerusakan sistem mendadak
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTicketType("REQUEST")}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                ticketType === "REQUEST"
                  ? "border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-200"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  ticketType === "REQUEST" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900">Service Request</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Permintaan barang, akses, instalasi, atau akun baru
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTicketType("COMPLAINT")}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                ticketType === "COMPLAINT"
                  ? "border-amber-400 bg-amber-50/50 ring-2 ring-amber-200"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  ticketType === "COMPLAINT" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900">Complaint</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Keluhan layanan atau ketidakpuasan fasilitas IT
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Step 2: Service Catalog Selector */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            2. Katalog Layanan IT (Service Catalog)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {services.map((s) => {
              const isSelected = s.id === selectedServiceId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleServiceChange(s.id)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-200"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {getServiceIcon(s.icon)}
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-slate-900 leading-snug">{s.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{s.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sub-category selection */}
          {activeService && activeService.categories?.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Pilih Kategori Masalah Terperinci:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeService.categories.map((c) => {
                  const isCatSelected = c.id === selectedCategoryId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleCategoryChange(c.id)}
                      className={`px-3 py-2.5 rounded-xl border text-left text-xs flex items-center justify-between gap-2 transition-all ${
                        isCatSelected
                          ? "border-indigo-500 bg-indigo-50 text-indigo-900 font-semibold"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-500 shrink-0">
                        SLA: ~{c.estimatedSlaHours}j
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Ticket Details */}
        <div className="p-6 sm:p-8 bg-white rounded-3xl border-2 border-slate-200 shadow-sm space-y-5">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-950 block">
            3. Rincian Masalah & Lokasi
          </label>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 block uppercase tracking-wider">
                Subjek Tiket <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Contoh: Laptop tidak bisa terhubung ke WiFi kantor lantai 3"
                className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 block uppercase tracking-wider">
                  Prioritas Masalah <span className="text-rose-600">*</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3.5 py-3 bg-white border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-950 focus:outline-hidden focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all"
                >
                  <option value="LOW">Low (SLA: 48 Jam)</option>
                  <option value="NORMAL">Normal (SLA: 8 Jam)</option>
                  <option value="HIGH">High (SLA: 4 Jam)</option>
                  <option value="CRITICAL">Critical (SLA: 1 Jam)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 block uppercase tracking-wider">
                  Lokasi Fisik / Kantor <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Contoh: Kantor Pusat Lt. 3 Meja 12"
                    className="w-full pl-10 pr-3.5 py-3 bg-white border-2 border-slate-300 rounded-xl text-xs font-semibold text-slate-950 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 block uppercase tracking-wider">
                  Nomor HP / WA (Kontak)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="0812..."
                    className="w-full pl-10 pr-3.5 py-3 bg-white border-2 border-slate-300 rounded-xl text-xs font-semibold text-slate-950 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 block uppercase tracking-wider">
                Deskripsi Lengkap Kendala <span className="text-rose-600">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan secara rinci kronologi masalah, pesan error yang muncul, atau permohonan spesifik yang Anda butuhkan..."
                className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-sm font-medium text-slate-950 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Step 4: Attachments */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            4. Lampiran Bukti / Screenshot Masalah (Wajib/Opsional)
          </label>
          <AttachmentUploader files={files} onChange={setFiles} />
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/tickets"
            className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 text-xs font-medium transition-colors"
          >
            Batalkan
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? "Memproses Tiket..." : "Kirimkan Tiket Sekarang"}
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

