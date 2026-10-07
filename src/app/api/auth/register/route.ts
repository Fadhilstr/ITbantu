import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, signToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, departmentId, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nama, email, dan password wajib diisi." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password minimal terdiri dari 8 karakter." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Alamat email ini sudah terdaftar." },
        { status: 409 }
      );
    }

    // Assign default role USER
    const userRole = await prisma.role.findUnique({
      where: { name: "USER" },
    });

    if (!userRole) {
      return NextResponse.json(
        { error: "Role USER belum tersedia pada konfigurasi sistem." },
        { status: 500 }
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        roleId: userRole.id,
        departmentId: departmentId || null,
        phone: phone?.trim() || null,
      },
      include: {
        role: true,
        department: true,
      },
    });

    const authUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role.name,
      departmentId: newUser.departmentId,
      itTeamId: newUser.itTeamId,
      phone: newUser.phone,
      avatarUrl: newUser.avatarUrl,
    };

    const token = await signToken(authUser);

    await logAuditEvent({
      actorId: newUser.id,
      action: "CREATE",
      entityType: "USER",
      entityId: newUser.id,
      metadata: { email: newUser.email, role: newUser.role.name },
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || undefined,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role.name,
        roleDisplayName: newUser.role.displayName,
        department: newUser.department?.name,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat pendaftaran akun." },
      { status: 500 }
    );
  }
}

