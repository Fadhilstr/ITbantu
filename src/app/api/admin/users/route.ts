import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const [users, roles, departments, itTeams] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isActive: true,
          role: { select: { id: true, name: true, displayName: true } },
          department: { select: { id: true, name: true, code: true } },
          itTeam: { select: { id: true, name: true } },
          _count: {
            select: { createdTickets: true, assignedTickets: true },
          },
          createdAt: true,
        },
      }),
      prisma.role.findMany({ orderBy: { name: "asc" } }),
      prisma.department.findMany({ orderBy: { name: "asc" } }),
      prisma.itTeam.findMany({ orderBy: { name: "asc" } }),
    ]);

    return NextResponse.json({ users, roles, departments, itTeams });
  } catch (error) {
    console.error("Admin users GET error:", error);
    return NextResponse.json({ error: "Gagal memuat pengguna." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getSessionUser();
    if (!isAdmin(admin)) {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, roleId, departmentId, itTeamId, phone } = body;

    if (!name || !email || !password || !roleId) {
      return NextResponse.json(
        { error: "Nama, email, password, dan role wajib diisi." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        roleId,
        departmentId: departmentId || null,
        itTeamId: itTeamId || null,
        phone: phone?.trim() || null,
      },
      include: {
        role: true,
        department: true,
        itTeam: true,
      },
    });

    await logAuditEvent({
      actorId: admin!.id,
      action: "CREATE",
      entityType: "USER",
      entityId: newUser.id,
      newValue: { email: newUser.email, role: newUser.role.name },
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error("Admin user POST error:", error);
    return NextResponse.json({ error: "Gagal membuat pengguna." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await getSessionUser();
    if (!isAdmin(admin)) {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, roleId, departmentId, itTeamId, phone, isActive, newPassword } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID wajib disertakan." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name.trim();
    if (roleId) updateData.roleId = roleId;
    if (departmentId !== undefined) updateData.departmentId = departmentId || null;
    if (itTeamId !== undefined) updateData.itTeamId = itTeamId || null;
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    if (newPassword && newPassword.length >= 8) {
      updateData.passwordHash = await hashPassword(newPassword);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true, department: true, itTeam: true },
    });

    await logAuditEvent({
      actorId: admin!.id,
      action: "UPDATE",
      entityType: "USER",
      entityId: id,
      oldValue: { role: existing.role.name, isActive: existing.isActive },
      newValue: { role: updatedUser.role.name, isActive: updatedUser.isActive },
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Admin user PATCH error:", error);
    return NextResponse.json({ error: "Gagal memperbarui pengguna." }, { status: 500 });
  }
}
