import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const slaRules = await prisma.slaRule.findMany({
      orderBy: { responseTimeMinutes: "asc" },
    });

    return NextResponse.json({ slaRules });
  } catch (error) {
    console.error("Admin SLA GET error:", error);
    return NextResponse.json({ error: "Gagal memuat aturan SLA." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, responseTimeMinutes, resolutionTimeMinutes } = body;

    if (!id || responseTimeMinutes === undefined || resolutionTimeMinutes === undefined) {
      return NextResponse.json({ error: "Data SLA tidak lengkap." }, { status: 400 });
    }

    const oldRule = await prisma.slaRule.findUnique({ where: { id } });

    const updated = await prisma.slaRule.update({
      where: { id },
      data: {
        responseTimeMinutes: Number(responseTimeMinutes),
        resolutionTimeMinutes: Number(resolutionTimeMinutes),
      },
    });

    await logAuditEvent({
      actorId: user!.id,
      action: "UPDATE",
      entityType: "SLA",
      entityId: id,
      oldValue: {
        response: oldRule?.responseTimeMinutes,
        resolution: oldRule?.resolutionTimeMinutes,
      },
      newValue: {
        response: updated.responseTimeMinutes,
        resolution: updated.resolutionTimeMinutes,
      },
    });

    return NextResponse.json({ success: true, slaRule: updated });
  } catch (error) {
    console.error("Admin SLA PATCH error:", error);
    return NextResponse.json({ error: "Gagal memperbarui aturan SLA." }, { status: 500 });
  }
}
