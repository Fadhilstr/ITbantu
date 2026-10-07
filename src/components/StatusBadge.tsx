import React from "react";
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Archive,
  UserCheck,
  Zap,
  HelpCircle,
  FileText,
  AlertTriangle,
} from "lucide-react";

export function StatusBadge({ status, size = "md" }: { status: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-xs font-bold gap-1",
    md: "px-3 py-1 text-xs font-bold gap-1.5",
    lg: "px-3.5 py-1.5 text-sm font-bold gap-2",
  }[size];

  switch (status) {
    case "OPEN":
      return (
        <span className={`inline-flex items-center rounded-full bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs ${sizeClasses}`}>
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          Open
        </span>
      );
    case "ASSIGNED":
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs ${sizeClasses}`}>
          <UserCheck className="w-3.5 h-3.5 text-amber-800" />
          Assigned
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span className={`inline-flex items-center rounded-full bg-orange-100 text-orange-950 border border-orange-300 shadow-2xs ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-orange-800 animate-spin" />
          In Progress
        </span>
      );
    case "PENDING":
      return (
        <span className={`inline-flex items-center rounded-full bg-purple-100 text-purple-950 border border-purple-300 shadow-2xs ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-purple-800" />
          Pending
        </span>
      );
    case "RESOLVED":
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-2xs ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
          Resolved
        </span>
      );
    case "CLOSED":
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-200 text-slate-800 border border-slate-300 shadow-2xs ${sizeClasses}`}>
          <Archive className="w-3.5 h-3.5 text-slate-700" />
          Closed
        </span>
      );
    case "REOPENED":
      return (
        <span className={`inline-flex items-center rounded-full bg-rose-100 text-rose-950 border border-rose-300 shadow-2xs ${sizeClasses}`}>
          <RefreshCw className="w-3.5 h-3.5 text-rose-800" />
          Reopened
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-200 text-slate-800 border border-slate-300 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
}

export function PriorityBadge({ priority, size = "md" }: { priority: string; size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs font-bold" : "px-2.5 py-1 text-xs font-bold";

  switch (priority) {
    case "CRITICAL":
      return (
        <span className={`inline-flex items-center gap-1 rounded-lg bg-red-100 text-red-950 border border-red-300 shadow-2xs ${sizeClasses}`}>
          <Zap className="w-3.5 h-3.5 text-red-700 fill-red-700" />
          Critical
        </span>
      );
    case "HIGH":
      return (
        <span className={`inline-flex items-center gap-1 rounded-lg bg-orange-100 text-orange-950 border border-orange-300 shadow-2xs ${sizeClasses}`}>
          <AlertCircle className="w-3.5 h-3.5 text-orange-700" />
          High
        </span>
      );
    case "NORMAL":
      return (
        <span className={`inline-flex items-center gap-1 rounded-lg bg-sky-100 text-sky-950 border border-sky-300 shadow-2xs ${sizeClasses}`}>
          Normal
        </span>
      );
    case "LOW":
      return (
        <span className={`inline-flex items-center gap-1 rounded-lg bg-slate-200 text-slate-800 border border-slate-300 ${sizeClasses}`}>
          Low
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1 rounded-lg bg-slate-200 text-slate-800 border border-slate-300 ${sizeClasses}`}>
          {priority}
        </span>
      );
  }
}

export function TypeBadge({ type }: { type: string }) {
  switch (type) {
    case "INCIDENT":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-950 border border-rose-300">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
          Incident
        </span>
      );
    case "REQUEST":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-950 border border-indigo-300">
          <FileText className="w-3.5 h-3.5 text-indigo-700" />
          Service Request
        </span>
      );
    case "COMPLAINT":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300">
          <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
          Complaint
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300">
          {type}
        </span>
      );
  }
}
