import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { generateTelegramVerificationCode } from "@/lib/telegram";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const telegramAccount = await prisma.telegramAccount.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      isLinked: Boolean(telegramAccount?.telegramChatId && telegramAccount?.isVerified),
      telegramUsername: telegramAccount?.telegramUsername || null,
      isNotificationsEnabled: telegramAccount?.isNotificationsEnabled ?? true,
      botUsername: process.env.TELEGRAM_BOT_USERNAME || "ITbantuBot",
      hasActiveCode: Boolean(
        telegramAccount?.verificationCode &&
          telegramAccount?.verificationExpiresAt &&
          telegramAccount.verificationExpiresAt > new Date()
      ),
      verificationCode: telegramAccount?.verificationExpiresAt && telegramAccount.verificationExpiresAt > new Date()
        ? telegramAccount.verificationCode
        : null,
    });
  } catch (error) {
    console.error("Error checking telegram status:", error);
    return NextResponse.json(
      { error: "Gagal memeriksa status Telegram." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, telegramChatId, telegramUsername, code } = body;

    // Action 1: Generate verification code
    if (action === "GENERATE_CODE") {
      const { code: newCode, expiresAt } = generateTelegramVerificationCode();

      await prisma.telegramAccount.upsert({
        where: { userId: user.id },
        update: {
          verificationCode: newCode,
          verificationExpiresAt: expiresAt,
        },
        create: {
          userId: user.id,
          verificationCode: newCode,
          verificationExpiresAt: expiresAt,
        },
      });

      return NextResponse.json({
        success: true,
        code: newCode,
        botUsername: process.env.TELEGRAM_BOT_USERNAME || "ITbantuBot",
        expiresAt,
        message: `Kirim perintah /link ${newCode} ke Telegram Bot @${process.env.TELEGRAM_BOT_USERNAME || "ITbantuBot"}`,
      });
    }

    // Action 2: Link Chat ID directly (for web configuration / simulation / manual pairing)
    if (action === "LINK_DIRECT") {
      if (!telegramChatId) {
        return NextResponse.json(
          { error: "Telegram Chat ID wajib diisi." },
          { status: 400 }
        );
      }

      await prisma.telegramAccount.upsert({
        where: { userId: user.id },
        update: {
          telegramChatId: String(telegramChatId).trim(),
          telegramUsername: telegramUsername?.trim() || null,
          isVerified: true,
          verificationCode: null,
          verificationExpiresAt: null,
          isNotificationsEnabled: true,
          linkedAt: new Date(),
        },
        create: {
          userId: user.id,
          telegramChatId: String(telegramChatId).trim(),
          telegramUsername: telegramUsername?.trim() || null,
          isVerified: true,
          isNotificationsEnabled: true,
          linkedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Akun Telegram berhasil ditautkan.",
      });
    }

    // Action 3: Unlink account
    if (action === "UNLINK") {
      await prisma.telegramAccount.deleteMany({
        where: { userId: user.id },
      });

      return NextResponse.json({
        success: true,
        message: "Akun Telegram berhasil diputuskan.",
      });
    }

    // Action 4: Toggle notifications
    if (action === "TOGGLE_NOTIFICATIONS") {
      const account = await prisma.telegramAccount.findUnique({
        where: { userId: user.id },
      });

      if (!account) {
        return NextResponse.json({ error: "Akun Telegram belum ditautkan." }, { status: 400 });
      }

      const updated = await prisma.telegramAccount.update({
        where: { userId: user.id },
        data: {
          isNotificationsEnabled: !account.isNotificationsEnabled,
        },
      });

      return NextResponse.json({
        success: true,
        isNotificationsEnabled: updated.isNotificationsEnabled,
        message: updated.isNotificationsEnabled
          ? "Notifikasi Telegram diaktifkan."
          : "Notifikasi Telegram dinonaktifkan.",
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (error) {
    console.error("Error managing telegram:", error);
    return NextResponse.json(
      { error: "Gagal memproses pengaturan Telegram." },
      { status: 500 }
    );
  }
}

