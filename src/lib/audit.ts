import prisma from "./prisma";

export interface AuditLogParams {
  actorId: string;
  action:
    | "CREATE"
    | "UPDATE"
    | "STATUS_CHANGE"
    | "ASSIGN"
    | "COMMENT"
    | "ATTACHMENT_UPLOAD"
    | "ATTACHMENT_DELETE"
    | "RESOLVE"
    | "REOPEN"
    | "CLOSE"
    | "USER_CHANGE"
    | "PERMISSION_CHANGE"
    | "LOGIN";
  entityType: "TICKET" | "COMMENT" | "ATTACHMENT" | "USER" | "SERVICE" | "SLA" | "AUTH";
  entityId: string;
  ticketId?: string | null;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

// Strip sensitive fields
function sanitizeData(data?: Record<string, unknown> | null): string | null {
  if (!data) return null;
  const clone = { ...data };
  delete clone.password;
  delete clone.passwordHash;
  delete clone.token;
  delete clone.secret;
  return JSON.stringify(clone);
}

export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  try {
    await prisma.ticketAuditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        ticketId: params.ticketId || null,
        oldValue: sanitizeData(params.oldValue),
        newValue: sanitizeData(params.newValue),
        metadata: sanitizeData(params.metadata),
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // Non-blocking: Do not crash the caller if audit logging fails
  }
}

