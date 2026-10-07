import React from "react";
import { Clock, AlertTriangle, AlertOctagon, CheckCircle2 } from "lucide-react";
import { formatTimeRemaining } from "@/lib/sla";

interface SlaData {
  state: "WITHIN_SLA" | "AT_RISK" | "BREACHED" | "MET";
  percentElapsed: number;
  remainingMinutes: number;
  isBreached: boolean;
}

interface SlaIndicatorProps {
  label: string; // "Response SLA" or "Resolution SLA"
  sla?: SlaData | null;
  dueAt?: string | Date | null;
  completedAt?: string | Date | null;
}

export function SlaIndicator({ label, sla, dueAt, completedAt }: SlaIndicatorProps) {
  if (!sla || !dueAt) {
    return (
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span>{label}: N/A</span>
      </div>
    );
  }

  const { state, remainingMinutes, percentElapsed } = sla;

  return (
    <div className="flex flex-col gap-1.5 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-slate-900 font-bold">{label}</span>
        {state === "MET" && (
          <span className="inline-flex items-center gap-1 font-bold text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            Tercapai
          </span>
        )}
        {state === "WITHIN_SLA" && (
          <span className="inline-flex items-center gap-1 font-bold text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300">
            <Clock className="w-3.5 h-3.5 text-emerald-700" />
            {formatTimeRemaining(remainingMinutes)}
          </span>
        )}
        {state === "AT_RISK" && (
          <span className="inline-flex items-center gap-1 font-bold text-amber-950 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            At Risk: {formatTimeRemaining(remainingMinutes)}
          </span>
        )}
        {state === "BREACHED" && (
          <span className="inline-flex items-center gap-1 font-bold text-rose-950 bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-300">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-700" />
            {formatTimeRemaining(remainingMinutes)}
          </span>
        )}
      </div>

      {!completedAt && (
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden border border-slate-300/50">
          <div
            className={`h-full transition-all duration-500 ${
              state === "BREACHED"
                ? "bg-rose-600"
                : state === "AT_RISK"
                ? "bg-amber-500"
                : "bg-emerald-600"
            }`}
            style={{ width: `${Math.min(percentElapsed, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
