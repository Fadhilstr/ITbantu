import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, signToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { role: true, department: true, itTeam: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Kredensial tidak valid atau akun dinonaktifkan." },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Kredensial tidak valid atau akun dinonaktifkan." },
        { status: 401 }
      );
    }

    const authUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      departmentId: user.departmentId,
      itTeamId: user.itTeamId,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
    };

    const token = await signToken(authUser);

    // Audit log
    await logAuditEvent({
      actorId: user.id,
      action: "LOGIN",
      entityType: "AUTH",
      entityId: user.id,
      metadata: { email: user.email, role: user.role.name },
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || undefined,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        roleDisplayName: user.role.displayName,
        department: user.department?.name,
        itTeam: user.itTeam?.name,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal saat autentikasi." },
      { status: 500 }
    );
  }
}

