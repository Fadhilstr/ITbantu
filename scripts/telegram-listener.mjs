import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN tidak ditemukan di file .env");
  process.exit(1);
}

const API_BASE = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function sendMessage(chatId, text, replyMarkup) {
  try {
    const res = await fetch(`${API_BASE}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        reply_markup: replyMarkup,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.warn("⚠️ Telegram Markdown failed, retrying plain text:", data.description);
      // Fallback without Markdown
      await fetch(`${API_BASE}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text.replace(/[*_`\[\]()~>#+\-=|{}.!]/g, ""),
          reply_markup: replyMarkup,
        }),
      });
    }
  } catch (err) {
    console.error("Gagal mengirim pesan Telegram:", err);
  }
}

async function handleUpdate(update) {
  if (!update.message || !update.message.text) return;

  const msg = update.message;
  const chatId = String(msg.chat.id);
  const text = msg.text.trim();
  const username = msg.from.username || msg.from.first_name || "Pengguna";

  console.log(`📩 Pesan masuk dari @${username} (Chat ID: ${chatId}): "${text}"`);

  // 1. Command /start
  if (text.startsWith("/start")) {
    const parts = text.split(" ");
    if (parts.length > 1) {
      const code = parts[1].trim();
      await processLinking(chatId, username, code);
      return;
    }

    await sendMessage(
      chatId,
      `👋 *Halo ${escapeMarkdown(username)}!*\n\n` +
      `Saya adalah bot resmi *ITbantu Service Desk*.\n\n` +
      `🔑 *Telegram Chat ID Anda:* \`${chatId}\`\n\n` +
      `*Cara Menghubungkan Akun ITbantu:*\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `*Cara 1 (Paling Mudah):*\n` +
      `1. Buka web ITbantu: http://localhost:3000/settings/telegram\n` +
      `2. Masukkan Chat ID \`${chatId}\` pada form *Tautkan Manual dengan Chat ID* dan simpan.\n\n` +
      `*Cara 2 (Gunakan Kode OTP):*\n` +
      `1. Di web ITbantu, klik tombol *Generate Kode Verifikasi* (akan muncul 6 angka).\n` +
      `2. Kirim perintah: \`/link <6-angka>\` (contoh: \`/link 849201\`)\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Ketik /help untuk melihat daftar perintah.`
    );
    return;
  }

  // 2. Command /myid
  if (text === "/myid") {
    await sendMessage(
      chatId,
      `🆔 *Telegram Chat ID Anda:*\n\`${chatId}\`\n\n` +
      `💡 Salin angka di atas dan tempelkan di menu *Pengaturan > Integrasi Telegram* di aplikasi ITbantu web untuk menghubungkan akun secara instan.`
    );
    return;
  }

  // 3. Command /link <code>
  if (text.startsWith("/link")) {
    const parts = text.split(/\s+/);
    if (parts.length < 2) {
      await sendLinkHelp(chatId);
      return;
    }

    let code = parts[1].trim();
    // Bersihkan karakter pembungkus jika user menulis <123456> atau [123456]
    code = code.replace(/[<>\[\]()]/g, "").trim();

    if (!code || code.toLowerCase().includes("kode") || !/^\d+$/.test(code)) {
      await sendLinkHelp(chatId);
      return;
    }

    await processLinking(chatId, username, code);
    return;
  }

  // 4. Command /status
  if (text === "/status") {
    const account = await prisma.telegramAccount.findFirst({
      where: { telegramChatId: chatId, isVerified: true },
      include: { user: true },
    });

    if (account) {
      await sendMessage(
        chatId,
        `✅ *Status Akun: Terhubung!*\n\n` +
        `👤 *Nama:* ${escapeMarkdown(account.user.name)}\n` +
        `📧 *Email:* \`${account.user.email}\`\n` +
        `🔔 *Notifikasi Ticket:* ${account.isNotificationsEnabled ? "Aktif" : "Nonaktif"}\n\n` +
        `Anda akan menerima notifikasi otomatis ketika tiket baru dibuat, ditugaskan, atau dibalas teknisi.`
      );
    } else {
      await sendMessage(
        chatId,
        `❌ *Status: Belum Terhubung*\n\n` +
        `Telegram Chat ID Anda adalah: \`${chatId}\`\n` +
        `Tautkan akun Anda via web ITbantu (http://localhost:3000/settings/telegram) atau gunakan \`/link <kode>\`.`
      );
    }
    return;
  }

  // 5. Default help
  await sendMessage(
    chatId,
    `🤖 *ITbantu Bot Assistant*\n\n` +
    `Daftar Perintah:\n` +
    `• \`/start\` — Buka petunjuk dan Chat ID Anda\n` +
    `• \`/myid\` — Cek Chat ID Telegram Anda\n` +
    `• \`/link <kode>\` — Tautkan dengan kode OTP dari web ITbantu\n` +
    `• \`/status\` — Cek status koneksi akun ITbantu Anda\n\n` +
    `🔑 *Chat ID Anda:* \`${chatId}\``
  );
}

async function sendLinkHelp(chatId) {
  await sendMessage(
    chatId,
    `⚠️ *Format Perintah Salah!*\n\n` +
    `*Apa itu Kode 6 Digit?*\n` +
    `Kode 6 digit adalah kode OTP acak (contoh: \`849201\`) yang dibuat dari aplikasi web ITbantu.\n\n` +
    `*Langkah:* \n` +
    `1. Buka Web ITbantu: http://localhost:3000/settings/telegram\n` +
    `2. Klik tombol *Generate Kode Verifikasi*\n` +
    `3. Ketikkan di sini: \`/link <angka-dari-web>\` (misal: \`/link 849201\`)\n\n` +
    `💡 *Atau cara langsung tanpa kode:*\n` +
    `Chat ID Anda adalah: \`${chatId}\`\n` +
    `Cukup salin angka tersebut dan paste pada kolom *Tautkan Manual dengan Chat ID* di halaman web ITbantu!`
  );
}

async function processLinking(chatId, username, code) {
  const account = await prisma.telegramAccount.findFirst({
    where: {
      verificationCode: code,
      verificationExpiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!account) {
    await sendMessage(
      chatId,
      `❌ *Kode verifikasi "${escapeMarkdown(code)}" tidak valid atau sudah kedaluwarsa.*\n\n` +
      `Silakan klik "Generate Kode Verifikasi" baru di halaman Web ITbantu:\n` +
      `http://localhost:3000/settings/telegram\n\n` +
      `Atau masukkan langsung Chat ID Anda (\`${chatId}\`) di web.`
    );
    return;
  }

  await prisma.telegramAccount.update({
    where: { id: account.id },
    data: {
      telegramChatId: chatId,
      telegramUsername: username,
      isVerified: true,
      verificationCode: null,
      verificationExpiresAt: null,
      isNotificationsEnabled: true,
      linkedAt: new Date(),
    },
  });

  await sendMessage(
    chatId,
    `🎉 *Selamat ${escapeMarkdown(account.user.name)}!*\n\n` +
    `Akun ITbantu Anda (\`${account.user.email}\`) *berhasil ditautkan* dengan Telegram!\n\n` +
    `Mulai sekarang Anda akan menerima notifikasi setiap kali tiket dibuat, di-assign ke teknisi, diberi status baru, atau dibalas.`
  );

  console.log(`✅ Berhasil menautkan akun user ${account.user.name} (${account.user.email}) ke Telegram Chat ID ${chatId}`);
}

function escapeMarkdown(text) {
  if (!text) return "";
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

let offset = 0;

async function pollUpdates() {
  try {
    const res = await fetch(`${API_BASE}/getUpdates?offset=${offset}&timeout=20`);
    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          await handleUpdate(update);
        }
      }
    } else {
      const errText = await res.text();
      console.warn("Poll response not ok:", res.status, errText);
    }
  } catch (err) {
    // Non-blocking timeout/network error
  }
}

async function start() {
  console.log(`🤖 Telegram Bot Listener aktif untuk @${process.env.TELEGRAM_BOT_USERNAME || "ITbantuBot"}...`);
  console.log("Menunggu pesan masuk dari Telegram...");

  while (true) {
    await pollUpdates();
  }
}

start().catch(console.error);
