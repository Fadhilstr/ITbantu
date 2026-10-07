import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/notifications";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(user.id, limit),
      getUnreadNotificationCount(user.id),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Gagal memuat notifikasi." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAll = false } = body;

    if (markAll) {
      await markAllNotificationsAsRead(user.id);
      return NextResponse.json({ success: true, message: "Semua notifikasi ditandai dibaca." });
    }

    if (notificationId) {
      await markNotificationAsRead(notificationId, user.id);
      return NextResponse.json({ success: true, message: "Notifikasi ditandai dibaca." });
    }

    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui notifikasi." },
      { status: 500 }
    );
  }
}

