import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { canAssignTicket, canClaimTicket } from "@/lib/rbac";
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
    const { assignedStaffId, assignedTeamId, note } = body;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { user: true, assignedStaff: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Tiket tidak ditemukan." }, { status: 404 });
    }

    // Permission check: if assigning to self (claiming ticket), must be IT staff
    const isSelfClaim = assignedStaffId === user.id;
    if (isSelfClaim) {
      if (!canClaimTicket(user)) {
        return NextResponse.json(
          { error: "Hanya staf IT yang dapat mengambil tiket ini." },
          { status: 403 }
        );
      }
    } else {
      // Assigning to someone else: must be supervisor or admin
      if (!canAssignTicket(user)) {
        return NextResponse.json(
          { error: "Hanya IT Supervisor atau Admin yang dapat menugaskan staf lain." },
          { status: 403 }
        );
      }
    }

    let targetStaffName = "Tim IT";
    if (assignedStaffId) {
      const staffUser = await prisma.user.findUnique({
        where: { id: assignedStaffId },
      });
      if (staffUser) targetStaffName = staffUser.name;
    }

    const oldStatus = ticket.status;
    const newStatus = oldStatus === "OPEN" ? "ASSIGNED" : oldStatus;
    const now = new Date();

    const updatedTicket = await prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({
        where: { id },
        data: {
          assignedStaffId: assignedStaffId || ticket.assignedStaffId,
          assignedTeamId: assignedTeamId || ticket.assignedTeamId,
          status: newStatus,
        },
        include: {
          assignedStaff: true,
          assignedTeam: true,
        },
      });

      await tx.ticketStatusHistory.create({
        data: {
          ticketId: id,
          actorId: user.id,
          fromStatus: oldStatus,
          toStatus: newStatus,
          note: note || `Tiket ditugaskan kepada ${targetStaffName}`,
          createdAt: now,
        },
      });

      return updated;
    });

    // Audit log
    await logAuditEvent({
      actorId: user.id,
      action: "ASSIGN",
      entityType: "TICKET",
      entityId: id,
      ticketId: id,
      oldValue: {
        assignedStaffId: ticket.assignedStaffId,
        assignedTeamId: ticket.assignedTeamId,
        status: oldStatus,
      },
      newValue: {
        assignedStaffId: updatedTicket.assignedStaffId,
        assignedTeamId: updatedTicket.assignedTeamId,
        status: newStatus,
      },
      metadata: { note },
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || undefined,
    });

    // Notify assigned staff
    if (assignedStaffId && assignedStaffId !== user.id) {
      await createInAppNotification({
        userId: assignedStaffId,
        ticketId: ticket.id,
        title: `Tiket #${ticket.ticketNumber} Ditugaskan Kepada Anda`,
        message: `${user.name} menugaskan tiket: "${ticket.subject}"`,
        type: "TICKET_ASSIGNED",
        linkUrl: `/tickets/${ticket.id}`,
      });

      queueTelegramNotification(assignedStaffId, {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        actorName: targetStaffName,
        eventType: "TICKET_ASSIGNED",
      }).catch((err) => console.warn(err));
    }

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
      message: `Tiket berhasil ditugaskan ke ${targetStaffName}.`,
    });
  } catch (error) {
    console.error("Error assigning ticket:", error);
    return NextResponse.json(
      { error: "Gagal menugaskan tiket." },
      { status: 500 }
    );
  }
}

