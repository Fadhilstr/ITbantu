"use client";

import React, { useEffect } from "react";
import { X, Download, ExternalLink, FileText } from "lucide-react";

interface AttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: {
    id: string;
    originalFilename: string;
    mimeType: string;
    fileSize: number;
  } | null;
}

export function AttachmentModal({ isOpen, onClose, attachment }: AttachmentModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !attachment) return null;

  const isImage = attachment.mimeType.startsWith("image/");
  const fileUrl = `/api/attachments/${attachment.id}`;
  const downloadUrl = `/api/attachments/${attachment.id}?download=true`;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 truncate">
            {isImage ? (
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
            ) : (
              <FileText className="w-4 h-4 text-rose-500" />
            )}
            <h3 className="text-sm font-semibold text-slate-800 truncate" title={attachment.originalFilename}>
              {attachment.originalFilename}
            </h3>
            <span className="text-xs text-slate-400">
              ({(attachment.fileSize / (1024 * 1024)).toFixed(2)} MB)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <a
              href={downloadUrl}
              download={attachment.originalFilename}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-indigo-600 px-2.5 py-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-indigo-600 px-2.5 py-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Buka Tab Baru
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Preview */}
        <div className="flex-1 bg-slate-950/5 flex items-center justify-center p-4 overflow-auto min-h-[300px]">
          {isImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={fileUrl}
              alt={attachment.originalFilename}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-sm"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 p-8 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
              <FileText className="w-16 h-16 text-rose-500 stroke-1" />
              <div>
                <p className="font-semibold text-slate-800">{attachment.originalFilename}</p>
                <p className="text-xs text-slate-500 mt-1">Dokumen PDF / Berkas non-gambar</p>
              </div>
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Lihat di Tab Baru
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

