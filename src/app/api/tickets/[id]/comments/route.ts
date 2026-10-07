import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { canViewTicket, canCreateInternalNotes } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";
import { createInAppNotification } from "@/lib/notifications";
import { queueTelegramNotification } from "@/lib/telegram";

export async function POST(
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
    const { content, isInternalNote = false } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Isi komentar tidak boleh kosong." },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { user: true, assignedStaff: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Tiket tidak ditemukan." }, { status: 404 });
    }

    if (!canViewTicket(user, ticket)) {
      return NextResponse.json(
        { error: "Anda tidak memiliki akses ke tiket ini." },
        { status: 403 }
      );
    }

    // Security check: only IT staff/supervisor/admin can post internal notes
    if (isInternalNote && !canCreateInternalNotes(user)) {
      return NextResponse.json(
        { error: "Hanya tim IT yang berhak membuat internal note." },
        { status: 403 }
      );
    }

    const newComment = await prisma.ticketComment.create({
      data: {
        ticketId: id,
        userId: user.id,
        content: content.trim(),
        isInternalNote: Boolean(isInternalNote),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: { select: { displayName: true } },
          },
        },
        attachments: true,
      },
    });

    // Audit log
    await logAuditEvent({
      actorId: user.id,
      action: "COMMENT",
      entityType: "COMMENT",
      entityId: newComment.id,
      ticketId: id,
      newValue: {
        isInternalNote: newComment.isInternalNote,
        contentPreview: content.substring(0, 100),
      },
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || undefined,
    });

    // Notifications (only for public replies)
    if (!isInternalNote) {
      const isCreator = user.id === ticket.userId;
      const recipientId = isCreator ? ticket.assignedStaffId : ticket.userId;

      if (recipientId && recipientId !== user.id) {
        await createInAppNotification({
          userId: recipientId,
          ticketId: ticket.id,
          title: `Balasan Baru Pada Tiket #${ticket.ticketNumber}`,
          message: `${user.name}: "${content.substring(0, 80)}${content.length > 80 ? "..." : ""}"`,
          type: "NEW_COMMENT",
          linkUrl: `/tickets/${ticket.id}`,
        });

        queueTelegramNotification(recipientId, {
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          actorName: user.name,
          comment: content.substring(0, 150),
          eventType: "NEW_REPLY",
        }).catch((err) => console.warn(err));
      }
    }

    return NextResponse.json({
      success: true,
      comment: newComment,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Gagal mengirimkan balasan." },
      { status: 500 }
    );
  }
}

