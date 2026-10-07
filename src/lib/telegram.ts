import prisma from "./prisma";

export interface TelegramNotificationPayload {
  ticketId: string;
  ticketNumber: string;
  subject: string;
  priority?: string;
  status?: string;
  actorName?: string;
  comment?: string;
  solution?: string;
  eventType:
    | "TICKET_CREATED"
    | "TICKET_ASSIGNED"
    | "STATUS_CHANGED"
    | "NEW_REPLY"
    | "TICKET_RESOLVED"
    | "TICKET_REOPENED";
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.APP_URL || "http://localhost:3000";

export async function queueTelegramNotification(
  recipientUserId: string,
  payload: TelegramNotificationPayload
): Promise<void> {
  try {
    // 1. Check if recipient has linked telegram account with notifications enabled
    const telegramAccount = await prisma.telegramAccount.findUnique({
      where: { userId: recipientUserId },
    });

    if (!telegramAccount || !telegramAccount.telegramChatId || !telegramAccount.isNotificationsEnabled) {
      // User hasn't linked Telegram or disabled it - skip silently
      return;
    }

    // 2. Format Telegram message
    const messageText = formatTelegramMessage(payload);
    const inlineKeyboard = getInlineKeyboard(payload);

    // 3. Create queue record
    const queueItem = await prisma.telegramQueue.create({
      data: {
        ticketId: payload.ticketId,
        eventType: payload.eventType,
        recipientChatId: telegramAccount.telegramChatId,
        payload: JSON.stringify({
          text: messageText,
          reply_markup: inlineKeyboard ? { inline_keyboard: inlineKeyboard } : undefined,
        }),
        status: "PENDING",
        attempts: 0,
      },
    });

    // 4. Dispatch immediately in background (non-blocking)
    dispatchQueueItem(queueItem.id, telegramAccount.telegramChatId, messageText, inlineKeyboard).catch((err) => {
      console.warn("Async Telegram dispatch error:", err);
    });
  } catch (error) {
    console.warn("Failed to queue Telegram notification:", error);
  }
}

// Broadcast to all IT Staff / Admins (e.g. for new tickets)
export async function broadcastToItTeam(payload: TelegramNotificationPayload): Promise<void> {
  try {
    const itUsers = await prisma.user.findMany({
      where: {
        role: {
          name: { in: ["IT_STAFF", "IT_SUPERVISOR", "ADMIN"] },
        },
        isActive: true,
      },
      select: { id: true },
    });

    for (const u of itUsers) {
      await queueTelegramNotification(u.id, payload);
    }
  } catch (err) {
    console.warn("Broadcast to IT team failed:", err);
  }
}

function formatTelegramMessage(p: TelegramNotificationPayload): string {
  switch (p.eventType) {
    case "TICKET_CREATED":
      return (
        `🛎 *ITbantu — Ticket Baru*\n\n` +
        `*#${p.ticketNumber}*\n` +
        `${escapeMarkdown(p.subject)}\n\n` +
        `*Priority:* ${p.priority || "NORMAL"}\n` +
        `*Status:* ${p.status || "OPEN"}\n` +
        `*Pelapor:* ${escapeMarkdown(p.actorName || "Karyawan")}`
      );

    case "TICKET_ASSIGNED":
      return (
        `👤 *ITbantu — Ticket Ditugaskan*\n\n` +
        `*#${p.ticketNumber}*\n` +
        `${escapeMarkdown(p.subject)}\n\n` +
        `*Ditugaskan Kepada:* ${escapeMarkdown(p.actorName || "IT Staff")}\n` +
        `*Status:* ASSIGNED`
      );

    case "STATUS_CHANGED":
      return (
        `🔄 *ITbantu — Status Ticket Diperbarui*\n\n` +
        `*#${p.ticketNumber}*\n` +
        `${escapeMarkdown(p.subject)}\n\n` +
        `*Status Baru:* *${p.status}*\n` +
        `*Diubah Oleh:* ${escapeMarkdown(p.actorName || "Tim IT")}`
      );

    case "NEW_REPLY":
      return (
        `💬 *ITbantu — Balasan Baru*\n\n` +
        `*#${p.ticketNumber}*\n` +
        `${escapeMarkdown(p.subject)}\n\n` +
        `*${escapeMarkdown(p.actorName || "Pengguna")}:*\n` +
        `"${escapeMarkdown(p.comment || "")}"`
      );

    case "TICKET_RESOLVED":
      return (
        `✅ *ITbantu — Ticket Selesai Dikerjakan*\n\n` +
        `*#${p.ticketNumber}*\n` +
        `${escapeMarkdown(p.subject)}\n\n` +
        `*Solusi / Catatan:* \n` +
        `${escapeMarkdown(p.solution || "Masalah telah diselesaikan oleh tim IT.")}\n\n` +
        `Apakah masalah Anda sudah benar-benar selesai?`
      );

    case "TICKET_REOPENED":
      return (
        `⚠️ *ITbantu — Ticket Dibuka Kembali*\n\n` +
        `*#${p.ticketNumber}*\n` +
        `${escapeMarkdown(p.subject)}\n\n` +
        `*Alasan:* ${escapeMarkdown(p.comment || "Masalah masih belum terselesaikan.")}\n` +
        `*Status:* REOPENED`
      );

    default:
      return `📢 *ITbantu Notifikasi*\n*#${p.ticketNumber}* - ${escapeMarkdown(p.subject)}`;
  }
}

function getInlineKeyboard(p: TelegramNotificationPayload): Array<Array<{ text: string; url: string }>> {
  const ticketUrl = `${APP_URL}/tickets/${p.ticketId}`;

  if (p.eventType === "TICKET_RESOLVED") {
    return [
      [
        { text: "✅ Sudah Selesai", url: `${ticketUrl}?action=confirm` },
        { text: "🔄 Masih Bermasalah", url: `${ticketUrl}?action=reopen` },
      ],
      [{ text: "📄 Buka di ITbantu", url: ticketUrl }],
    ];
  }

  return [[{ text: "🔍 Lihat Ticket", url: ticketUrl }]];
}

async function dispatchQueueItem(
  queueId: string,
  chatId: string,
  text: string,
  inlineKeyboard?: Array<Array<{ text: string; url: string }>>
): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) {
    // If bot token is not configured in .env, record notice without crashing
    await prisma.telegramQueue.update({
      where: { id: queueId },
      data: {
        status: "FAILED",
        lastError: "TELEGRAM_BOT_TOKEN belum dikonfigurasi di file .env",
      },
    });
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        reply_markup: inlineKeyboard ? { inline_keyboard: inlineKeyboard } : undefined,
      }),
    });

    const result = (await response.json()) as { ok: boolean; description?: string };

    if (result.ok) {
      await prisma.telegramQueue.update({
        where: { id: queueId },
        data: {
          status: "SENT",
          sentAt: new Date(),
          attempts: { increment: 1 },
        },
      });
    } else {
      await prisma.telegramQueue.update({
        where: { id: queueId },
        data: {
          status: "FAILED",
          lastError: result.description || "Telegram API returned ok: false",
          attempts: { increment: 1 },
        },
      });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await prisma.telegramQueue.update({
      where: { id: queueId },
      data: {
        status: "FAILED",
        lastError: errorMsg,
        attempts: { increment: 1 },
      },
    });
  }
}

function escapeMarkdown(text: string): string {
  if (!text) return "";
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

export function generateTelegramVerificationCode(): { code: string; expiresAt: Date } {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
  return { code, expiresAt };
}

