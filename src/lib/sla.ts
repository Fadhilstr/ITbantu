import prisma from "./prisma";

export interface SlaDeadlines {
  responseDueAt: Date;
  resolutionDueAt: Date;
}

export type SlaStatusState = "WITHIN_SLA" | "AT_RISK" | "BREACHED" | "MET";

export async function calculateSlaDeadlines(
  priority: string,
  startTime: Date = new Date()
): Promise<SlaDeadlines> {
  // Query from database SLA rules if exists, or fallback to defaults
  const rule = await prisma.slaRule.findUnique({
    where: { priority },
  });

  const responseMinutes = rule ? rule.responseTimeMinutes : getDefaultResponseMinutes(priority);
  const resolutionMinutes = rule ? rule.resolutionTimeMinutes : getDefaultResolutionMinutes(priority);

  const responseDueAt = new Date(startTime.getTime() + responseMinutes * 60 * 1000);
  const resolutionDueAt = new Date(startTime.getTime() + resolutionMinutes * 60 * 1000);

  return {
    responseDueAt,
    resolutionDueAt,
  };
}

function getDefaultResponseMinutes(priority: string): number {
  switch (priority) {
    case "CRITICAL":
      return 15;
    case "HIGH":
      return 30;
    case "NORMAL":
      return 120;
    case "LOW":
      return 240;
    default:
      return 120;
  }
}

function getDefaultResolutionMinutes(priority: string): number {
  switch (priority) {
    case "CRITICAL":
      return 60;
    case "HIGH":
      return 240;
    case "NORMAL":
      return 480;
    case "LOW":
      return 2880; // 48 hours
    default:
      return 480;
  }
}

export function getSlaStatus(
  dueAt: Date | string | null | undefined,
  completedAt: Date | string | null | undefined,
  createdAt: Date | string = new Date()
): {
  state: SlaStatusState;
  percentElapsed: number;
  remainingMinutes: number;
  isBreached: boolean;
} {
  if (!dueAt) {
    return { state: "WITHIN_SLA", percentElapsed: 0, remainingMinutes: 0, isBreached: false };
  }

  const dueDate = new Date(dueAt).getTime();
  const createdDate = new Date(createdAt).getTime();
  const totalWindow = Math.max(dueDate - createdDate, 1);

  if (completedAt) {
    const compDate = new Date(completedAt).getTime();
    const isBreached = compDate > dueDate;
    return {
      state: isBreached ? "BREACHED" : "MET",
      percentElapsed: 100,
      remainingMinutes: Math.round((dueDate - compDate) / 60000),
      isBreached,
    };
  }

  const now = Date.now();
  const elapsed = Math.max(now - createdDate, 0);
  const percentElapsed = Math.min(Math.round((elapsed / totalWindow) * 100), 100);
  const remainingMinutes = Math.round((dueDate - now) / 60000);

  if (now > dueDate) {
    return { state: "BREACHED", percentElapsed: 100, remainingMinutes, isBreached: true };
  }

  if (percentElapsed >= 75) {
    return { state: "AT_RISK", percentElapsed, remainingMinutes, isBreached: false };
  }

  return { state: "WITHIN_SLA", percentElapsed, remainingMinutes, isBreached: false };
}

export function formatTimeRemaining(remainingMinutes: number): string {
  if (remainingMinutes <= 0) {
    const overdue = Math.abs(remainingMinutes);
    if (overdue < 60) return `Terlambat ${overdue} menit`;
    const hours = Math.floor(overdue / 60);
    const mins = overdue % 60;
    return `Terlambat ${hours}j ${mins}m`;
  }

  if (remainingMinutes < 60) {
    return `Sisa ${remainingMinutes} menit`;
  }

  const hours = Math.floor(remainingMinutes / 60);
  const mins = remainingMinutes % 60;
  if (hours < 24) {
    return `Sisa ${hours}j ${mins}m`;
  }

  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `Sisa ${days}h ${remHours}j`;
}

