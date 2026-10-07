"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { UploadCloud, X, File, Image as ImageIcon, FileText, AlertCircle } from "lucide-react";

interface AttachmentFile {
  file: File;
  previewUrl: string;
  isImage: boolean;
}

interface AttachmentUploaderProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMb?: number;
}

export function AttachmentUploader({
  files,
  onChange,
  maxFiles = 5,
  maxSizeMb = 10,
}: AttachmentUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previews, setPreviews] = useState<AttachmentFile[]>([]);

  useEffect(() => {
    // Sync preview objects
    const newPreviews = files.map((file) => ({
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
      isImage: file.type.startsWith("image/"),
    }));
    setPreviews(newPreviews);

    return () => {
      // Clean up object URLs
      newPreviews.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
    };
  }, [files]);

  const validateAndAddFiles = useCallback((newFilesList: FileList | File[]) => {
    setErrorMessage(null);
    const validFiles: File[] = [];
    const maxSizeBytes = maxSizeMb * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

    for (let i = 0; i < newFilesList.length; i++) {
      const file = newFilesList[i];

      if (files.length + validFiles.length >= maxFiles) {
        setErrorMessage(`Maksimal ${maxFiles} berkas dapat diunggah.`);
        break;
      }

      if (file.size > maxSizeBytes) {
        setErrorMessage(`Berkas "${file.name}" melebihi batas ${maxSizeMb} MB.`);
        continue;
      }

      if (!allowedTypes.includes(file.type.toLowerCase())) {
        setErrorMessage(
          `Format berkas "${file.name}" tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF.`
        );
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onChange([...files, ...validFiles]);
    }
  }, [files, maxFiles, maxSizeMb, onChange]);

  // Handle Ctrl+V clipboard paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      const pastedFiles: File[] = [];

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const blob = items[i].getAsFile();
          if (blob) {
            const ext = items[i].type.split("/")[1] || "png";
            const file = new (window as any).File([blob], `screenshot-${Date.now()}.${ext}`, {
              type: items[i].type,
            }) as File;
            pastedFiles.push(file);
          }
        }
      }

      if (pastedFiles.length > 0) {
        validateAndAddFiles(pastedFiles);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [validateAndAddFiles]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    const next = [...files];
    next.splice(index, 1);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? "border-indigo-600 bg-indigo-50/80 scale-[1.01]"
            : "border-slate-400 hover:border-indigo-600 bg-white hover:bg-slate-50 shadow-xs"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) validateAndAddFiles(e.target.files);
          }}
        />

        <div className="flex flex-col items-center justify-center gap-2.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">
              Drag & drop berkas atau{" "}
              <span className="text-indigo-700 underline font-extrabold">pilih dari perangkat</span>
            </p>
            <p className="text-xs font-medium text-slate-700 mt-1">
              Dapat paste screenshot langsung dengan{" "}
              <kbd className="px-2 py-0.5 bg-slate-200 border border-slate-300 rounded font-mono text-[11px] font-bold text-slate-900 shadow-2xs">
                Ctrl + V
              </kbd>{" "}
              • JPG, PNG, WEBP, PDF (Maks. {maxSizeMb} MB)
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Thumbnails preview list */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
          {previews.map((item, idx) => (
            <div
              key={idx}
              className="relative group border border-slate-200 rounded-lg p-2 bg-white shadow-sm flex items-center gap-2 overflow-hidden"
            >
              {item.isImage ? (
                <div className="w-12 h-12 rounded bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center border border-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded bg-rose-50 text-rose-600 shrink-0 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1 min-w-0 pr-6">
                <p className="text-xs font-medium text-slate-800 truncate" title={item.file.name}>
                  {item.file.name}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(idx);
                }}
                className="absolute top-1.5 right-1.5 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Hapus lampiran"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
