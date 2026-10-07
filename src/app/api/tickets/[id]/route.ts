import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  canViewTicket,
  canViewInternalNotes,
  isItStaff,
  canCloseTicket,
  canReopenTicket,
} from "@/lib/rbac";
import { getSlaStatus } from "@/lib/sla";
import { logAuditEvent } from "@/lib/audit";
import { createInAppNotification } from "@/lib/notifications";
import { queueTelegramNotification } from "@/lib/telegram";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        service: true,
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            department: true,
          },
        },
        department: true,
        assignedStaff: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        assignedTeam: true,
        attachments: {
          orderBy: { createdAt: "desc" },
        },
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: { select: { name: true, displayName: true } },
              },
            },
            attachments: true,
          },
        },
        statusHistories: {
          orderBy: { createdAt: "asc" },
          include: {
            actor: {
              select: {
                id: true,
                name: true,
                role: { select: { displayName: true } },
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Tiket tidak ditemukan." }, { status: 404 });
    }

    // Check authorization
    if (!canViewTicket(user, ticket)) {
      return NextResponse.json(
        { error: "Anda tidak memiliki izin untuk melihat tiket ini." },
        { status: 403 }
      );
    }

    // Filter internal notes: regular users MUST NOT see internal notes!
    const allowInternalNotes = canViewInternalNotes(user);
    const filteredComments = ticket.comments.filter((comment) => {
      if (comment.isInternalNote && !allowInternalNotes) {
        return false;
      }
      return true;
    });

    // Calculate SLA metrics
    const responseSla = getSlaStatus(ticket.responseDueAt, ticket.respondedAt, ticket.createdAt);
    const resolutionSla = getSlaStatus(ticket.resolutionDueAt, ticket.resolvedAt, ticket.createdAt);

    return NextResponse.json({
      ticket: {
        ...ticket,
        comments: filteredComments,
        sla: {
          response: responseSla,
          resolution: resolutionSla,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching ticket detail:", error);
    return NextResponse.json(
      { error: "Gagal memuat detail tiket." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, priority, resolutionNote, reopenReason, pendingReason, note } = body;

    const currentTicket = await prisma.ticket.findUnique({
      where: { id },
      include: { user: true, assignedStaff: true },
    });

    if (!currentTicket) {
      return NextResponse.json({ error: "Tiket tidak ditemukan." }, { status: 404 });
    }

    const oldStatus = currentTicket.status;
    const updateData: Record<string, unknown> = {};
    const now = new Date();

    // 1. Status Transition Validation
    if (status && status !== oldStatus) {
      // Validate transitions
      const validTransitions: Record<string, string[]> = {
        OPEN: ["ASSIGNED", "IN_PROGRESS"],
        ASSIGNED: ["IN_PROGRESS", "OPEN"],
        IN_PROGRESS: ["PENDING", "RESOLVED"],
        PENDING: ["IN_PROGRESS"],
        RESOLVED: ["CLOSED", "REOPENED"],
        REOPENED: ["IN_PROGRESS"],
        CLOSED: [], // Closed tickets cannot transition directly unless reopen policy
      };

      const allowedNext = validTransitions[oldStatus] || [];
      if (!allowedNext.includes(status)) {
        return NextResponse.json(
          { error: `Transisi status tidak valid dari ${oldStatus} ke ${status}.` },
          { status: 400 }
        );
      }

      // Role check for specific transitions
      if (status === "RESOLVED") {
        if (!isItStaff(user)) {
          return NextResponse.json(
            { error: "Hanya staf IT yang dapat menyelesaikan tiket." },
            { status: 403 }
          );
        }
        if (!resolutionNote?.trim()) {
          return NextResponse.json(
            { error: "Catatan solusi/resolusi wajib diisi saat menyelesaikan tiket." },
            { status: 400 }
          );
        }
        updateData.resolvedAt = now;
        updateData.resolutionNote = resolutionNote.trim();
        // Check if resolution SLA was breached
        if (currentTicket.resolutionDueAt && now > currentTicket.resolutionDueAt) {
          updateData.isSlaResolutionBreached = true;
        }
      }

      if (status === "CLOSED") {
        if (!canCloseTicket(user, currentTicket.userId)) {
          return NextResponse.json(
            { error: "Hanya pembuat tiket atau supervisor yang dapat menutup tiket." },
            { status: 403 }
          );
        }
        updateData.closedAt = now;
      }

      if (status === "REOPENED") {
        if (!canReopenTicket(user, currentTicket.userId)) {
          return NextResponse.json(
            { error: "Hanya pembuat tiket yang dapat membuka kembali tiket ini." },
            { status: 403 }
          );
        }
        if (!reopenReason?.trim()) {
          return NextResponse.json(
            { error: "Alasan membuka kembali tiket wajib diisi." },
            { status: 400 }
          );
        }
        updateData.reopenedAt = now;
        updateData.reopenReason = reopenReason.trim();
        updateData.resolvedAt = null; // Reset resolved timestamp
      }

      if (status === "PENDING") {
        if (!isItStaff(user)) {
          return NextResponse.json(
            { error: "Hanya staf IT yang dapat mengubah status menjadi PENDING." },
            { status: 403 }
          );
        }
        if (!pendingReason?.trim()) {
          return NextResponse.json(
            { error: "Alasan penundaan tiket wajib diisi." },
            { status: 400 }
          );
        }
        updateData.pendingReason = pendingReason.trim();
      }

      if (status === "IN_PROGRESS" && !currentTicket.respondedAt) {
        // Mark first response SLA
        updateData.respondedAt = now;
        if (currentTicket.responseDueAt && now > currentTicket.responseDueAt) {
          updateData.isSlaResponseBreached = true;
        }
      }

      updateData.status = status;
    }

    if (priority && priority !== currentTicket.priority) {
      if (!isItStaff(user)) {
        return NextResponse.json(
          { error: "Hanya tim IT yang dapat mengubah prioritas tiket." },
          { status: 403 }
        );
      }
      updateData.priority = priority;
    }

    const updatedTicket = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.update({
        where: { id },
        data: updateData,
        include: {
          user: true,
          assignedStaff: true,
        },
      });

      if (status && status !== oldStatus) {
        await tx.ticketStatusHistory.create({
          data: {
            ticketId: id,
            actorId: user.id,
            fromStatus: oldStatus,
            toStatus: status,
            note: note || resolutionNote || reopenReason || pendingReason || null,
            createdAt: now,
          },
        });
      }

      return ticket;
    });

    // Audit log
    await logAuditEvent({
      actorId: user.id,
      action: status ? "STATUS_CHANGE" : "UPDATE",
      entityType: "TICKET",
      entityId: id,
      ticketId: id,
      oldValue: { status: oldStatus, priority: currentTicket.priority },
      newValue: { status: updatedTicket.status, priority: updatedTicket.priority },
      metadata: { reason: note || resolutionNote || reopenReason },
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || undefined,
    });

    // In-App Notifications & Telegram Notifications
    if (status && status !== oldStatus) {
      if (status === "RESOLVED") {
        // Notify ticket creator
        await createInAppNotification({
          userId: currentTicket.userId,
          ticketId: currentTicket.id,
          title: `Tiket #${currentTicket.ticketNumber} Selesai Dikerjakan`,
          message: `Solusi: ${resolutionNote}. Silakan konfirmasi penyelesaian.`,
          type: "TICKET_RESOLVED",
          linkUrl: `/tickets/${currentTicket.id}`,
        });
        queueTelegramNotification(currentTicket.userId, {
          ticketId: currentTicket.id,
          ticketNumber: currentTicket.ticketNumber,
          subject: currentTicket.subject,
          actorName: user.name,
          solution: resolutionNote,
          eventType: "TICKET_RESOLVED",
        }).catch((err) => console.warn(err));
      } else if (status === "REOPENED") {
        // Notify assigned staff
        if (currentTicket.assignedStaffId) {
          await createInAppNotification({
            userId: currentTicket.assignedStaffId,
            ticketId: currentTicket.id,
            title: `Tiket #${currentTicket.ticketNumber} Dibuka Kembali`,
            message: `Alasan: ${reopenReason}`,
            type: "TICKET_REOPENED",
            linkUrl: `/tickets/${currentTicket.id}`,
          });
          queueTelegramNotification(currentTicket.assignedStaffId, {
            ticketId: currentTicket.id,
            ticketNumber: currentTicket.ticketNumber,
            subject: currentTicket.subject,
            actorName: user.name,
            comment: reopenReason,
            eventType: "TICKET_REOPENED",
          }).catch((err) => console.warn(err));
        }
      } else {
        // General status change notification to creator
        await createInAppNotification({
          userId: currentTicket.userId,
          ticketId: currentTicket.id,
          title: `Status Tiket #${currentTicket.ticketNumber} Diperbarui`,
          message: `Status baru: ${status}`,
          type: "STATUS_CHANGED",
          linkUrl: `/tickets/${currentTicket.id}`,
        });
        queueTelegramNotification(currentTicket.userId, {
          ticketId: currentTicket.id,
          ticketNumber: currentTicket.ticketNumber,
          subject: currentTicket.subject,
          status,
          actorName: user.name,
          eventType: "STATUS_CHANGED",
        }).catch((err) => console.warn(err));
      }
    }

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
      message: "Tiket berhasil diperbarui.",
    });
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui tiket." },
      { status: 500 }
    );
  }
}

