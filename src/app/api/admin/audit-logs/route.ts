import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "30", 10);
    const skip = (page - 1) * limit;

    const [logs, totalCount] = await Promise.all([
      prisma.ticketAuditLog.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: { select: { displayName: true } },
            },
          },
          ticket: {
            select: {
              ticketNumber: true,
              subject: true,
            },
          },
        },
      }),
      prisma.ticketAuditLog.count(),
    ]);

    return NextResponse.json({
      logs,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Admin audit logs GET error:", error);
    return NextResponse.json({ error: "Gagal memuat log audit." }, { status: 500 });
  }
}

