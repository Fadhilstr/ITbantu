import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { generateTicketNumber, TicketType } from "@/lib/ticket-number";
import { calculateSlaDeadlines } from "@/lib/sla";
import { logAuditEvent } from "@/lib/audit";
import { isItStaff } from "@/lib/rbac";
import { broadcastToItTeam } from "@/lib/telegram";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const type = searchParams.get("type");
    const serviceId = searchParams.get("serviceId");
    const departmentId = searchParams.get("departmentId");
    const assignedStaffId = searchParams.get("assignedStaffId");
    const search = searchParams.get("search")?.trim();
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    // Build Prisma where clause
    const where: Record<string, unknown> = {};

    // End-users can ONLY see their own tickets
    if (!isItStaff(user)) {
      where.userId = user.id;
    } else {
      // IT staff can filter by assigned to me
      if (searchParams.get("myAssigned") === "true") {
        where.assignedStaffId = user.id;
      }
      if (assignedStaffId) {
        where.assignedStaffId = assignedStaffId;
      }
    }

    if (status && status !== "ALL") {
      where.status = status;
    }
    if (priority && priority !== "ALL") {
      where.priority = priority;
    }
    if (type && type !== "ALL") {
      where.type = type;
    }
    if (serviceId && serviceId !== "ALL") {
      where.serviceId = serviceId;
    }
    if (departmentId && departmentId !== "ALL") {
      where.departmentId = departmentId;
    }

    if (search) {
      where.OR = [
        { ticketNumber: { contains: search } },
        { subject: { contains: search } },
        { description: { contains: search } },
        { user: { name: { contains: search } } },
      ];
    }

    const [tickets, totalCount] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          service: { select: { id: true, name: true, icon: true } },
          category: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true, department: true } },
          department: { select: { id: true, name: true, code: true } },
          assignedStaff: { select: { id: true, name: true, email: true } },
          assignedTeam: { select: { id: true, name: true } },
          _count: {
            select: { comments: true, attachments: true },
          },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    return NextResponse.json({
      tickets,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar tiket." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      serviceId,
      categoryId,
      subject,
      description,
      priority = "NORMAL",
      location,
      departmentId,
      contactPhone,
    } = body;

    if (!type || !serviceId || !categoryId || !subject || !description || !location) {
      return NextResponse.json(
        { error: "Semua field bertanda bintang wajib diisi." },
        { status: 400 }
      );
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      return NextResponse.json({ error: "Layanan IT tidak ditemukan." }, { status: 400 });
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return NextResponse.json({ error: "Kategori masalah tidak valid." }, { status: 400 });
    }

    const ticketNumber = await generateTicketNumber(type as TicketType);
    const now = new Date();
    const sla = await calculateSlaDeadlines(priority, now);

    const userDeptId = departmentId || user.departmentId;

    const newTicket = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          ticketNumber,
          type,
          subject: subject.trim(),
          description: description.trim(),
          location: location.trim(),
          contactPhone: contactPhone?.trim() || user.phone || null,
          serviceId: service.id,
          categoryId: category.id,
          userId: user.id,
          departmentId: userDeptId || null,
          assignedTeamId: service.itTeamId || null,
          priority,
          status: "OPEN",
          responseDueAt: sla.responseDueAt,
          resolutionDueAt: sla.resolutionDueAt,
          createdAt: now,
        },
        include: {
          service: true,
          category: true,
          user: true,
        },
      });

      // Initial status history
      await tx.ticketStatusHistory.create({
        data: {
          ticketId: ticket.id,
          actorId: user.id,
          fromStatus: "NONE",
          toStatus: "OPEN",
          note: "Tiket berhasil dibuat oleh pengguna",
          createdAt: now,
        },
      });

      return ticket;
    });

    // Audit logging
    await logAuditEvent({
      actorId: user.id,
      action: "CREATE",
      entityType: "TICKET",
      entityId: newTicket.id,
      ticketId: newTicket.id,
      newValue: {
        ticketNumber: newTicket.ticketNumber,
        type: newTicket.type,
        subject: newTicket.subject,
        priority: newTicket.priority,
        status: newTicket.status,
      },
      metadata: { location: newTicket.location },
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || undefined,
    });

    // Queue non-blocking Telegram notification to IT team
    broadcastToItTeam({
      ticketId: newTicket.id,
      ticketNumber: newTicket.ticketNumber,
      subject: newTicket.subject,
      priority: newTicket.priority,
      status: newTicket.status,
      actorName: user.name,
      eventType: "TICKET_CREATED",
    }).catch((err) => console.warn("Telegram broadcast error:", err));

    return NextResponse.json({
      success: true,
      ticket: newTicket,
      message: `Tiket #${newTicket.ticketNumber} berhasil dibuat.`,
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "Gagal membuat tiket. Silakan coba kembali." },
      { status: 500 }
    );
  }
}

