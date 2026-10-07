import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isItStaff } from "@/lib/rbac";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isStaff = isItStaff(user);

    if (!isStaff) {
      // 1. User dashboard stats (scoped to current user's tickets)
      const userTickets = await prisma.ticket.groupBy({
        by: ["status"],
        where: { userId: user.id },
        _count: { id: true },
      });

      const counts: Record<string, number> = {
        OPEN: 0,
        ASSIGNED: 0,
        IN_PROGRESS: 0,
        PENDING: 0,
        RESOLVED: 0,
        CLOSED: 0,
        REOPENED: 0,
        TOTAL: 0,
      };

      userTickets.forEach((item) => {
        counts[item.status] = item._count.id;
        counts.TOTAL += item._count.id;
      });

      const recentTickets = await prisma.ticket.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          service: { select: { name: true, icon: true } },
          category: { select: { name: true } },
          assignedStaff: { select: { name: true } },
        },
      });

      return NextResponse.json({
        role: "USER",
        counts,
        recentTickets,
      });
    }

    // 2. IT Staff / Supervisor / Admin dashboard stats (system-wide)
    const [
      byStatus,
      byPriority,
      byService,
      byDepartment,
      allActiveTickets,
      resolvedTickets,
      totalCount,
    ] = await Promise.all([
      prisma.ticket.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.ticket.groupBy({
        by: ["priority"],
        _count: { id: true },
      }),
      prisma.ticket.findMany({
        include: {
          service: { select: { id: true, name: true } },
        },
      }),
      prisma.ticket.findMany({
        include: {
          department: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.ticket.findMany({
        where: {
          status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS", "PENDING", "REOPENED"] },
        },
        select: {
          id: true,
          resolutionDueAt: true,
          responseDueAt: true,
          createdAt: true,
          respondedAt: true,
          isSlaResponseBreached: true,
          isSlaResolutionBreached: true,
        },
      }),
      prisma.ticket.findMany({
        where: {
          status: { in: ["RESOLVED", "CLOSED"] },
          resolvedAt: { not: null },
        },
        select: {
          createdAt: true,
          resolvedAt: true,
          isSlaResolutionBreached: true,
        },
      }),
      prisma.ticket.count(),
    ]);

    const statusCounts: Record<string, number> = {
      OPEN: 0,
      ASSIGNED: 0,
      IN_PROGRESS: 0,
      PENDING: 0,
      RESOLVED: 0,
      CLOSED: 0,
      REOPENED: 0,
    };
    byStatus.forEach((s) => {
      statusCounts[s.status] = s._count.id;
    });

    const priorityCounts: Record<string, number> = {
      LOW: 0,
      NORMAL: 0,
      HIGH: 0,
      CRITICAL: 0,
    };
    byPriority.forEach((p) => {
      priorityCounts[p.priority] = p._count.id;
    });

    // Count by service
    const serviceMap: Record<string, number> = {};
    byService.forEach((t) => {
      const name = t.service?.name || "Lainnya";
      serviceMap[name] = (serviceMap[name] || 0) + 1;
    });
    const serviceStats = Object.entries(serviceMap).map(([name, count]) => ({
      name,
      count,
    }));

    // Count by department
    const deptMap: Record<string, number> = {};
    byDepartment.forEach((t) => {
      const name = t.department?.name || "General";
      deptMap[name] = (deptMap[name] || 0) + 1;
    });
    const departmentStats = Object.entries(deptMap).map(([name, count]) => ({
      name,
      count,
    }));

    // Calculate SLA At Risk and Breached in active tickets
    const now = Date.now();
    let slaAtRiskCount = 0;
    let slaBreachedCount = 0;

    allActiveTickets.forEach((t) => {
      if (t.resolutionDueAt) {
        const due = new Date(t.resolutionDueAt).getTime();
        const created = new Date(t.createdAt).getTime();
        const total = Math.max(due - created, 1);
        const elapsed = now - created;

        if (now > due) {
          slaBreachedCount++;
        } else if (elapsed / total >= 0.75) {
          slaAtRiskCount++;
        }
      }
    });

    // Average resolution time (in hours)
    let totalResolutionHours = 0;
    let breachedResolved = 0;
    resolvedTickets.forEach((t) => {
      if (t.resolvedAt) {
        const diffMs = new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime();
        totalResolutionHours += diffMs / (1000 * 60 * 60);
      }
      if (t.isSlaResolutionBreached) {
        breachedResolved++;
      }
    });

    const avgResolutionHours = resolvedTickets.length > 0
      ? Math.round((totalResolutionHours / resolvedTickets.length) * 10) / 10
      : 0;

    const complianceRate = resolvedTickets.length > 0
      ? Math.round(((resolvedTickets.length - breachedResolved) / resolvedTickets.length) * 100)
      : 100;

    return NextResponse.json({
      role: "IT_STAFF",
      totalCount,
      statusCounts,
      priorityCounts,
      serviceStats,
      departmentStats,
      sla: {
        slaAtRiskCount,
        slaBreachedCount,
        complianceRate,
        avgResolutionHours,
        totalResolved: resolvedTickets.length,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Gagal memuat statistik sistem." },
      { status: 500 }
    );
  }
}

