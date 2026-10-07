import prisma from "./prisma";

export interface CreateNotificationParams {
  userId: string;
  ticketId?: string | null;
  title: string;
  message: string;
  type:
    | "TICKET_CREATED"
    | "TICKET_ASSIGNED"
    | "STATUS_CHANGED"
    | "NEW_COMMENT"
    | "TICKET_RESOLVED"
    | "TICKET_REOPENED"
    | "SLA_WARNING";
  linkUrl: string;
}

export async function createInAppNotification(params: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        ticketId: params.ticketId || null,
        title: params.title,
        message: params.message,
        type: params.type,
        linkUrl: params.linkUrl,
      },
    });
  } catch (error) {
    console.error("Failed to create in-app notification:", error);
    return null;
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  } catch {
    return 0;
  }
}

export async function getUserNotifications(userId: string, limit = 20) {
  try {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch {
    return [];
  }
}

export async function markNotificationAsRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

