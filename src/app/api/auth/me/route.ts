import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getUnreadNotificationCount } from "@/lib/notifications";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatarUrl: true,
      role: {
        select: {
          name: true,
          displayName: true,
        },
      },
      department: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      itTeam: {
        select: {
          id: true,
          name: true,
        },
      },
      telegramAccount: {
        select: {
          telegramUsername: true,
          isVerified: true,
          isNotificationsEnabled: true,
          linkedAt: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const unreadNotifications = await getUnreadNotificationCount(user.id);

  return NextResponse.json({
    authenticated: true,
    user: {
      ...user,
      unreadNotifications,
    },
  });
}

