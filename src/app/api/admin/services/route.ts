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

    const services = await prisma.service.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        categories: { orderBy: { name: "asc" } },
        itTeam: true,
      },
    });

    const itTeams = await prisma.itTeam.findMany({ orderBy: { name: "asc" } });

    return NextResponse.json({ services, itTeams });
  } catch (error) {
    console.error("Admin services GET error:", error);
    return NextResponse.json({ error: "Gagal memuat katalog layanan." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { action, serviceData, categoryData } = body;

    if (action === "CREATE_SERVICE") {
      const { name, description, icon, itTeamId } = serviceData;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      const newService = await prisma.service.create({
        data: {
          name,
          slug,
          description,
          icon: icon || "Layers",
          itTeamId: itTeamId || null,
        },
      });

      await logAuditEvent({
        actorId: user!.id,
        action: "CREATE",
        entityType: "SERVICE",
        entityId: newService.id,
        newValue: { name: newService.name },
      });

      return NextResponse.json({ success: true, service: newService });
    }

    if (action === "CREATE_CATEGORY") {
      const { serviceId, name, defaultPriority = "NORMAL", estimatedSlaHours = 8 } = categoryData;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      const newCategory = await prisma.category.create({
        data: {
          serviceId,
          name,
          slug,
          defaultPriority,
          estimatedSlaHours: Number(estimatedSlaHours),
        },
      });

      return NextResponse.json({ success: true, category: newCategory });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (error) {
    console.error("Admin services POST error:", error);
    return NextResponse.json({ error: "Gagal memproses layanan." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { type, id, isActive, name, description, itTeamId, defaultPriority, estimatedSlaHours } = body;

    if (type === "SERVICE") {
      const updated = await prisma.service.update({
        where: { id },
        data: {
          ...(isActive !== undefined && { isActive }),
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(itTeamId !== undefined && { itTeamId: itTeamId || null }),
        },
      });
      return NextResponse.json({ success: true, service: updated });
    }

    if (type === "CATEGORY") {
      const updated = await prisma.category.update({
        where: { id },
        data: {
          ...(isActive !== undefined && { isActive }),
          ...(name && { name }),
          ...(defaultPriority && { defaultPriority }),
          ...(estimatedSlaHours !== undefined && { estimatedSlaHours: Number(estimatedSlaHours) }),
        },
      });
      return NextResponse.json({ success: true, category: updated });
    }

    return NextResponse.json({ error: "Tipe entitas tidak valid." }, { status: 400 });
  } catch (error) {
    console.error("Admin services PATCH error:", error);
    return NextResponse.json({ error: "Gagal memperbarui data." }, { status: 500 });
  }
}
