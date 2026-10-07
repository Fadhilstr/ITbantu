# ITbantu — Modern IT Service Desk & Ticket Management System

> **Aplikasi Service Desk & Manajemen Tiket Terpadu Perusahaan**  
> Melayani insiden teknis (*incident*), permohonan layanan (*service request*), dan keluhan (*complaint*) lintas divisi IT.

---

## 🚀 Fitur Unggulan

- **Service Catalog Komprehensif (8 Layanan Utama):**
  - Network & Internet (LAN, WiFi, VPN, Slow Bandwidth)
  - Hardware & Device (Laptop, PC, Monitor, Printer, Keyboard/Mouse)
  - Software & OS (Crash, Lisensi, Update, Instalasi)
  - Application & ERP (Internal Bug, Login Gagal, Data Issue)
  - Account & Access (Reset Password, Akun Baru, Hak Akses Folder)
  - Email Services (Send/Receive, Config, Alias, Kuota)
  - Security & Incident (Malware, Phishing, Suspicious Activity)
  - Other IT Services (Konsultasi & Permintaan Khusus)
- **Format Nomor Tiket Unik & Otomatis:**
  - `INC-2026-XXXXX` untuk Incidents
  - `REQ-2026-XXXXX` untuk Service Requests
  - `CMP-2026-XXXXX` untuk Complaints
- **Workflow Status & State Transition:**
  `OPEN` → `ASSIGNED` → `IN_PROGRESS` → `PENDING` → `RESOLVED` → `CLOSED`  
  Alur pembukaan kembali tiket: `RESOLVED` → `REOPENED` → `IN_PROGRESS`
- **SLA Engine Otomatis:**
  - Response SLA & Resolution SLA terukur per prioritas (`CRITICAL`: 1 jam, `HIGH`: 4 jam, `NORMAL`: 8 jam, `LOW`: 48 jam)
  - Status indikator real-time: `WITHIN_SLA`, `AT_RISK` (&ge;75%), `BREACHED`
- **Sistem Lampiran (File Attachment):**
  - Drag & Drop berkas + **Paste Screenshot instan via `Ctrl + V`**
  - Thumbnail preview sebelum submit
  - Fullscreen/modal image viewer dan secure streaming endpoint (`/api/attachments/:id`)
  - Validasi MIME, ekstensi, batas ukuran, dan proteksi IDOR
- **Percakapan & Catatan Internal (Internal Note):**
  - Public Reply untuk komunikasi dua arah antara pengguna dan teknisi
  - **Internal Note** khusus tim IT (staf biasa/pengguna tidak dapat melihatnya)
- **Integrasi Telegram Bot API:**
  - Notifikasi asinkron untuk Tiket Baru, Tiket Ditugaskan, Update Status, Balasan Baru, Selesai (dengan tombol inline konfirmasi), dan Tiket Dibuka Kembali
  - Toleran terhadap kegagalan jaringan Telegram (kegagalan Telegram tidak pernah membatalkan pembuatan tiket)
  - Pemasangan akun via kode verifikasi 6 digit atau input Chat ID langsung
- **Pusat Notifikasi Internal (In-App Notification Center):**
  - Lonceng notifikasi dengan counter unread otomatis dan navigasi instan ke tiket
- **Admin Control Center:**
  - Manajemen Pengguna & Peran (Role-Based Access Control)
  - Manajemen Katalog Layanan & Kategori
  - Konfigurasi Aturan Waktu SLA
  - Log Jejak Audit Trail Lengkap (*Audit Logs*)
- **Desain Frontend Anti-Slop (Linear / Enterprise Grade):**
  - Tanpa template generik AI, tipografi tajam, palet slate/zinc terkontrol, kontras WCAG AA, dan mobile-responsive.

---

## 👥 Akun Demo Siap Pakai

Semua akun demo menggunakan kata sandi: **`Password123!`**

| Peran | Nama | Alamat Email | Hak Akses Utama |
|---|---|---|---|
| **Admin** | Super Administrator | `admin@itbantu.local` | Konfigurasi penuh sistem, kelola user, layanan, SLA, dan audit trail |
| **IT Supervisor** | Bambang Supervisor | `supervisor@itbantu.local` | Supervisi tiket tim, eskalasi, penugasan staf, monitoring SLA |
| **IT Staff** | Andi Pratama (Network) | `andi@itbantu.local` | Claim/tangani tiket jaringan, update status, internal notes, resolusi |
| **IT Staff** | Budi Santoso (Application) | `budi@itbantu.local` | Tangani tiket aplikasi & akun, reset password, update status |
| **User** | Fadhil Karyawan (Operations) | `fadhil@itbantu.local` | Buat tiket, pantau tiket sendiri, konfirmasi selesai, reopen tiket |
| **User** | Siti Rahma (Finance) | `siti@itbantu.local` | Buat request akses data keuangan, kirim lampiran screenshot |

---

## 🛠️ Panduan Menjalankan Aplikasi

### 1. Prasyarat
- Node.js versi 18 atau lebih baru (direkomendasikan Node.js 20 / 24)
- npm versi 9 atau lebih baru

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Migrasi & Seeding Database SQLite
```bash
npx prisma db push
npm run prisma:seed
```

### 4. Menjalankan Unit & Integration Test
```bash
npm test
```

### 5. Menjalankan Mode Pengembangan
```bash
npm run dev
```
Buka browser pada: `http://localhost:3000`

### 6. Build Produksi
```bash
npm run build
npm start
```

---

## ⚙️ Konfigurasi Environment (`.env`)

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="itbantu-super-secret-jwt-key-2026-production-ready-64-bytes-entropy"
TELEGRAM_BOT_TOKEN="" # Isi token dari @BotFather untuk mengaktifkan notifikasi Telegram nyata
TELEGRAM_BOT_USERNAME="ITbantuBot"
UPLOAD_MAX_FILE_SIZE_MB=10
UPLOAD_DIR="./storage/attachments"
APP_NAME="ITbantu"
APP_URL="http://localhost:3000"
```

