import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting ITbantu database seeding...");

  // 1. Seed Roles
  const rolesData = [
    {
      name: "ADMIN",
      displayName: "Administrator",
      description: "Akses penuh konfigurasi sistem, kelola pengguna, layanan, SLA, dan laporan",
      permissions: JSON.stringify([
        "users:manage",
        "departments:manage",
        "teams:manage",
        "services:manage",
        "sla:manage",
        "tickets:all",
        "tickets:assign",
        "tickets:resolve",
        "tickets:reopen",
        "tickets:close",
        "notes:internal",
        "reports:view",
        "settings:manage",
      ]),
    },
    {
      name: "IT_SUPERVISOR",
      displayName: "IT Supervisor",
      description: "Supervisi tiket masuk, eskalasi, penugasan staf, monitoring SLA dan performa tim",
      permissions: JSON.stringify([
        "tickets:all",
        "tickets:assign",
        "tickets:resolve",
        "tickets:reopen",
        "tickets:close",
        "notes:internal",
        "reports:view",
        "sla:monitor",
      ]),
    },
    {
      name: "IT_STAFF",
      displayName: "IT Support / Staff",
      description: "Menangani tiket sesuai penugasan, update status, resolusi masalah, dan catatan internal",
      permissions: JSON.stringify([
        "tickets:view_assigned",
        "tickets:claim",
        "tickets:update_status",
        "tickets:resolve",
        "notes:internal",
        "comments:create",
      ]),
    },
    {
      name: "USER",
      displayName: "Employee (End User)",
      description: "Karyawan perusahaan pembuat permohonan tiket, complaint, insiden, dan service request",
      permissions: JSON.stringify([
        "tickets:create",
        "tickets:view_own",
        "comments:create",
        "tickets:confirm_resolved",
        "tickets:reopen_own",
      ]),
    },
  ];

  const roleMap = {};
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: r,
      create: r,
    });
    roleMap[r.name] = role.id;
  }
  console.log("✅ Roles seeded");

  // 2. Seed Departments
  const departmentsData = [
    { name: "Operations", code: "OPS", description: "Divisi Operasional Lapangan & Logistik" },
    { name: "Finance & Accounting", code: "FIN", description: "Divisi Keuangan dan Akuntansi" },
    { name: "Human Resources", code: "HR", description: "Divisi Sumber Daya Manusia & Personalia" },
    { name: "Marketing & Sales", code: "MKT", description: "Divisi Pemasaran dan Penjualan" },
    { name: "Engineering & Product", code: "ENG", description: "Divisi Rekayasa Perangkat Lunak & Produk" },
    { name: "General Affairs", code: "GA", description: "Divisi Fasilitas & Urusan Umum" },
  ];

  const departmentMap = {};
  for (const d of departmentsData) {
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      update: d,
      create: d,
    });
    departmentMap[d.code] = dept.id;
  }
  console.log("✅ Departments seeded");

  // 3. Seed IT Teams
  const itTeamsData = [
    { name: "Network & Infrastructure", description: "Tim jaringan, WiFi, VPN, router, server lokal" },
    { name: "Hardware & Device Support", description: "Tim perawatan laptop, PC, monitor, printer, peripheral" },
    { name: "Application & Enterprise Systems", description: "Tim aplikasi internal, ERP, CRM, database masalah akun" },
    { name: "IT Security & Compliance", description: "Tim keamanan informasi, investigasi akun, malware, audit" },
  ];

  const itTeamMap = {};
  for (const t of itTeamsData) {
    const team = await prisma.itTeam.upsert({
      where: { name: t.name },
      update: t,
      create: t,
    });
    itTeamMap[t.name] = team.id;
  }
  console.log("✅ IT Teams seeded");

  // 4. Seed SLA Rules
  const slaRulesData = [
    { priority: "CRITICAL", responseTimeMinutes: 15, resolutionTimeMinutes: 60, escalationLevel: 3 },
    { priority: "HIGH", responseTimeMinutes: 30, resolutionTimeMinutes: 240, escalationLevel: 2 },
    { priority: "NORMAL", responseTimeMinutes: 120, resolutionTimeMinutes: 480, escalationLevel: 1 },
    { priority: "LOW", responseTimeMinutes: 240, resolutionTimeMinutes: 2880, escalationLevel: 1 },
  ];

  for (const s of slaRulesData) {
    await prisma.slaRule.upsert({
      where: { priority: s.priority },
      update: s,
      create: s,
    });
  }
  console.log("✅ SLA Rules seeded");

  // 5. Seed Users
  const passwordHash = await bcrypt.hash("Password123!", 10);
  const usersData = [
    {
      name: "Super Administrator",
      email: "admin@itbantu.local",
      passwordHash,
      roleId: roleMap["ADMIN"],
      departmentId: departmentMap["OPS"],
      phone: "081200000001",
    },
    {
      name: "Bambang Supervisor",
      email: "supervisor@itbantu.local",
      passwordHash,
      roleId: roleMap["IT_SUPERVISOR"],
      itTeamId: itTeamMap["Network & Infrastructure"],
      phone: "081200000002",
    },
    {
      name: "Andi Pratama",
      email: "andi@itbantu.local",
      passwordHash,
      roleId: roleMap["IT_STAFF"],
      itTeamId: itTeamMap["Network & Infrastructure"],
      phone: "081200000003",
    },
    {
      name: "Budi Santoso",
      email: "budi@itbantu.local",
      passwordHash,
      roleId: roleMap["IT_STAFF"],
      itTeamId: itTeamMap["Application & Enterprise Systems"],
      phone: "081200000004",
    },
    {
      name: "Fadhil Karyawan",
      email: "fadhil@itbantu.local",
      passwordHash,
      roleId: roleMap["USER"],
      departmentId: departmentMap["OPS"],
      phone: "081200000005",
    },
    {
      name: "Siti Rahma",
      email: "siti@itbantu.local",
      passwordHash,
      roleId: roleMap["USER"],
      departmentId: departmentMap["FIN"],
      phone: "081200000006",
    },
  ];

  const userMap = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: u,
      create: u,
    });
    userMap[u.email] = user.id;
  }
  console.log("✅ Default Users seeded (Password: Password123!)");

  // 6. Seed Service Catalog & Categories
  const servicesCatalog = [
    {
      name: "Network & Internet",
      slug: "network-internet",
      icon: "Wifi",
      description: "Konektivitas jaringan kabel LAN, WiFi kantor, VPN, dan akses firewall",
      itTeamId: itTeamMap["Network & Infrastructure"],
      sortOrder: 1,
      categories: [
        { name: "Internet Tidak Terhubung", slug: "internet-down", defaultPriority: "HIGH", estimatedSlaHours: 4 },
        { name: "WiFi Bermasalah / Putus-putus", slug: "wifi-problem", defaultPriority: "NORMAL", estimatedSlaHours: 8 },
        { name: "Koneksi VPN Bermasalah", slug: "vpn-issue", defaultPriority: "NORMAL", estimatedSlaHours: 8 },
        { name: "Bandwidth Lambat / RTO", slug: "slow-network", defaultPriority: "LOW", estimatedSlaHours: 16 },
        { name: "Permintaan Akses Jaringan Khusus", slug: "request-network-access", defaultPriority: "LOW", estimatedSlaHours: 24 },
      ],
    },
    {
      name: "Hardware & Device",
      slug: "hardware-device",
      icon: "Laptop",
      description: "Perangkat keras kerja: Laptop, PC, Monitor, Printer, Keyboard, Mouse",
      itTeamId: itTeamMap["Hardware & Device Support"],
      sortOrder: 2,
      categories: [
        { name: "Laptop Bermasalah / Mati Total", slug: "laptop-issue", defaultPriority: "HIGH", estimatedSlaHours: 4 },
        { name: "PC Desktop Error / Blue Screen", slug: "pc-issue", defaultPriority: "NORMAL", estimatedSlaHours: 8 },
        { name: "Monitor Blank / Rusak", slug: "monitor-issue", defaultPriority: "NORMAL", estimatedSlaHours: 8 },
        { name: "Printer & Scanner Bermasalah", slug: "printer-scanner-issue", defaultPriority: "LOW", estimatedSlaHours: 16 },
        { name: "Keyboard / Mouse / Aksesoris Rusak", slug: "peripherals-issue", defaultPriority: "LOW", estimatedSlaHours: 16 },
        { name: "Hardware Lainnya", slug: "other-hardware", defaultPriority: "NORMAL", estimatedSlaHours: 8 },
      ],
    },
    {
      name: "Software & OS",
      slug: "software-os",
      icon: "Boxes",
      description: "Sistem operasi, lisensi, instalasi software standar kantor, dan update",
      itTeamId: itTeamMap["Hardware & Device Support"],
      sortOrder: 3,
      categories: [
        { name: "Software Error / Crash", slug: "software-crash", defaultPriority: "NORMAL", estimatedSlaHours: 8 },
        { name: "Permintaan Instalasi Software Baru", slug: "software-install-request", defaultPriority: "LOW", estimatedSlaHours: 24 },
        { name: "Permintaan Lisensi Software", slug: "license-request", defaultPriority: "LOW", estimatedSlaHours: 48 },
        { name: "Pembaruan OS / Update Driver", slug: "os-update-request", defaultPriority: "LOW", estimatedSlaHours: 24 },
      ],
    },
    {
      name: "Application & ERP",
      slug: "application-erp",
      icon: "LayoutGrid",
      description: "Aplikasi operasional internal, ERP, CRM, portal HR, sistem payroll",
      itTeamId: itTeamMap["Application & Enterprise Systems"],
      sortOrder: 4,
      categories: [
        { name: "Aplikasi Internal Error / Bug", slug: "internal-app-bug", defaultPriority: "HIGH", estimatedSlaHours: 4 },
        { name: "Gagal Login Aplikasi Internal", slug: "cannot-login-app", defaultPriority: "HIGH", estimatedSlaHours: 4 },
        { name: "Data Anomali / Inkonsistensi Database", slug: "data-issue", defaultPriority: "NORMAL", estimatedSlaHours: 12 },
        { name: "Request Fitur / Modifikasi Laporan", slug: "feature-request", defaultPriority: "LOW", estimatedSlaHours: 48 },
        { name: "Bantuan Penggunaan & Edukasi Aplikasi", slug: "app-support-inquiry", defaultPriority: "LOW", estimatedSlaHours: 24 },
      ],
    },
    {
      name: "Account & Access",
      slug: "account-access",
      icon: "KeyRound",
      description: "Manajemen akun pengguna, reset sandi, izin akses folder shared, hak akses sistem",
      itTeamId: itTeamMap["Application & Enterprise Systems"],
      sortOrder: 5,
      categories: [
        { name: "Reset Password Akun", slug: "reset-password", defaultPriority: "HIGH", estimatedSlaHours: 2 },
        { name: "Permintaan Pembuatan Akun Baru (Karyawan Baru)", slug: "new-account-request", defaultPriority: "NORMAL", estimatedSlaHours: 8 },
        { name: "Permintaan Hak Akses Folder / Drive", slug: "folder-access-request", defaultPriority: "NORMAL", estimatedSlaHours: 8 },
        { name: "Penonaktifan Akun (Offboarding)", slug: "account-offboarding", defaultPriority: "HIGH", estimatedSlaHours: 4 },
        { name: "Masalah Role / Otorisasi Terkunci", slug: "permission-issue", defaultPriority: "NORMAL", estimatedSlaHours: 8 },
      ],
    },
    {
      name: "Email Services",
      slug: "email-services",
      icon: "Mail",
      description: "Email kantor, Google Workspace, Microsoft 365, spam filter, distribution list",
      itTeamId: itTeamMap["Application & Enterprise Systems"],
      sortOrder: 6,
      categories: [
        { name: "Email Tidak Bisa Mengirim / Menerima", slug: "email-send-receive-error", defaultPriority: "HIGH", estimatedSlaHours: 4 },
        { name: "Konfigurasi Email Client (Outlook/Thunderbird)", slug: "email-client-config", defaultPriority: "NORMAL", estimatedSlaHours: 8 },
        { name: "Permintaan Email Alias / Mailing List", slug: "email-alias-request", defaultPriority: "LOW", estimatedSlaHours: 24 },
        { name: "Penyimpanan Kotak Masuk (Mailbox) Penuh", slug: "mailbox-quota-issue", defaultPriority: "NORMAL", estimatedSlaHours: 8 },
      ],
    },
    {
      name: "Security & Incident",
      slug: "security-incident",
      icon: "ShieldAlert",
      description: "Insiden keamanan siber, kecurigaan malware, email phishing, kebocoran data",
      itTeamId: itTeamMap["IT Security & Compliance"],
      sortOrder: 7,
      categories: [
        { name: "Insiden Keamanan / Peretasan", slug: "security-incident", defaultPriority: "CRITICAL", estimatedSlaHours: 1 },
        { name: "Aktivitas Mencurigakan Pada Akun", slug: "suspicious-activity", defaultPriority: "CRITICAL", estimatedSlaHours: 2 },
        { name: "Indikasi Komputer Terinfeksi Malware / Virus", slug: "malware-suspicion", defaultPriority: "HIGH", estimatedSlaHours: 4 },
        { name: "Laporan Email Phishing / Penipuan", slug: "phishing-report", defaultPriority: "NORMAL", estimatedSlaHours: 8 },
      ],
    },
    {
      name: "Other IT Services",
      slug: "other-it-services",
      icon: "HelpCircle",
      description: "Permintaan bantuan teknis umum yang tidak tercantum pada katalog lainnya",
      itTeamId: itTeamMap["Hardware & Device Support"],
      sortOrder: 8,
      categories: [
        { name: "Konsultasi Teknis & IT Advice", slug: "it-consultation", defaultPriority: "LOW", estimatedSlaHours: 48 },
        { name: "Permintaan Bantuan Teknis Lainnya", slug: "other-request", defaultPriority: "NORMAL", estimatedSlaHours: 12 },
      ],
    },
  ];

  for (const s of servicesCatalog) {
    const { categories, ...serviceFields } = s;
    const service = await prisma.service.upsert({
      where: { slug: s.slug },
      update: serviceFields,
      create: serviceFields,
    });

    for (const c of categories) {
      await prisma.category.upsert({
        where: {
          serviceId_slug: {
            serviceId: service.id,
            slug: c.slug,
          },
        },
        update: {
          name: c.name,
          defaultPriority: c.defaultPriority,
          estimatedSlaHours: c.estimatedSlaHours,
        },
        create: {
          serviceId: service.id,
          name: c.name,
          slug: c.slug,
          defaultPriority: c.defaultPriority,
          estimatedSlaHours: c.estimatedSlaHours,
        },
      });
    }
  }
  console.log("✅ Service Catalog & Categories seeded");

  // 7. Seed System Settings
  const settingsData = [
    { key: "APP_NAME", value: "ITbantu", description: "Nama sistem service desk" },
    { key: "COMPANY_NAME", value: "Nexa Corporation", description: "Nama perusahaan" },
    { key: "MAX_UPLOAD_SIZE_MB", value: "10", description: "Maksimal ukuran attachment dalam Megabyte" },
    { key: "TELEGRAM_NOTIFICATIONS_ENABLED", value: "true", description: "Status global notifikasi Telegram" },
    { key: "AUTO_CLOSE_HOURS_AFTER_RESOLVED", value: "48", description: "Otomatis close tiket setelah sekian jam resolve" },
  ];

  for (const st of settingsData) {
    await prisma.systemSetting.upsert({
      where: { key: st.key },
      update: st,
      create: st,
    });
  }
  console.log("✅ System Settings seeded");

  // 8. Seed Sample Tickets for initial realistic dashboard data
  const sampleTickets = [
    {
      ticketNumber: "INC-2026-00001",
      type: "INCIDENT",
      subject: "WiFi lantai 3 terputus mendadak dan tidak bisa konek",
      description: "Sejak pukul 09:00 WIB seluruh karyawan di area Operations lantai 3 tidak dapat terhubung ke WiFi kantor. Lampu indikator access point di plafon berkedip merah.",
      location: "Gedung Pusat - Lantai 3 Ruang Operasional",
      contactPhone: "081200000005",
      serviceSlug: "network-internet",
      categorySlug: "wifi-problem",
      userEmail: "fadhil@itbantu.local",
      departmentCode: "OPS",
      assignedTeamName: "Network & Infrastructure",
      assignedStaffEmail: "andi@itbantu.local",
      priority: "HIGH",
      status: "IN_PROGRESS",
      createdAt: new Date(Date.now() - 3600 * 1000 * 3), // 3 hours ago
    },
    {
      ticketNumber: "REQ-2026-00002",
      type: "REQUEST",
      subject: "Permintaan akses folder laporan keuangan Q3 2026",
      description: "Mohon diberikan hak akses read/write ke folder network share '\\\\fileserver\\Finance\\Reports_2026' untuk keperluan audit internal.",
      location: "Gedung Pusat - Lantai 4 Ruang Finance",
      contactPhone: "081200000006",
      serviceSlug: "account-access",
      categorySlug: "folder-access-request",
      userEmail: "siti@itbantu.local",
      departmentCode: "FIN",
      assignedTeamName: "Application & Enterprise Systems",
      assignedStaffEmail: "budi@itbantu.local",
      priority: "NORMAL",
      status: "ASSIGNED",
      createdAt: new Date(Date.now() - 3600 * 1000 * 1), // 1 hour ago
    },
    {
      ticketNumber: "CMP-2026-00003",
      type: "COMPLAINT",
      subject: "Monitor berkedip terus menerus saat membuka file spreadsheet besar",
      description: "Monitor eksternal Dell 24 inch yang dipasang di meja sering padam selama 2 detik lalu menyala kembali saat menjalankan aplikasi.",
      location: "Gedung Pusat - Lantai 3 Meja 34",
      contactPhone: "081200000005",
      serviceSlug: "hardware-device",
      categorySlug: "monitor-issue",
      userEmail: "fadhil@itbantu.local",
      departmentCode: "OPS",
      priority: "LOW",
      status: "OPEN",
      createdAt: new Date(Date.now() - 3600 * 1000 * 0.5), // 30 mins ago
    },
    {
      ticketNumber: "INC-2026-00004",
      type: "INCIDENT",
      subject: "Reset password email kantor terkunci karena salah ketik 3x",
      description: "Akun email kantor fadhil@itbantu.local terblokir sementara. Mohon dibantu reset password dan unlock akun.",
      location: "Kantor Cabang Ciputat",
      contactPhone: "081200000005",
      serviceSlug: "account-access",
      categorySlug: "reset-password",
      userEmail: "fadhil@itbantu.local",
      departmentCode: "OPS",
      assignedTeamName: "Application & Enterprise Systems",
      assignedStaffEmail: "budi@itbantu.local",
      priority: "HIGH",
      status: "RESOLVED",
      resolutionNote: "Password telah di-reset ke temporary password dan dikirimkan via SMS terverifikasi.",
      createdAt: new Date(Date.now() - 3600 * 1000 * 5),
      resolvedAt: new Date(Date.now() - 3600 * 1000 * 1),
    },
  ];

  for (const st of sampleTickets) {
    const service = await prisma.service.findUnique({ where: { slug: st.serviceSlug } });
    const category = await prisma.category.findUnique({
      where: {
        serviceId_slug: {
          serviceId: service.id,
          slug: st.categorySlug,
        },
      },
    });

    const creatorId = userMap[st.userEmail];
    const deptId = departmentMap[st.departmentCode];
    const teamId = st.assignedTeamName ? itTeamMap[st.assignedTeamName] : null;
    const staffId = st.assignedStaffEmail ? userMap[st.assignedStaffEmail] : null;

    // SLA calculations
    const now = st.createdAt;
    const responseDueAt = new Date(now.getTime() + 30 * 60 * 1000);
    const resolutionDueAt = new Date(now.getTime() + 240 * 60 * 1000);

    const ticket = await prisma.ticket.upsert({
      where: { ticketNumber: st.ticketNumber },
      update: {},
      create: {
        ticketNumber: st.ticketNumber,
        type: st.type,
        subject: st.subject,
        description: st.description,
        location: st.location,
        contactPhone: st.contactPhone,
        serviceId: service.id,
        categoryId: category.id,
        userId: creatorId,
        departmentId: deptId,
        assignedTeamId: teamId,
        assignedStaffId: staffId,
        priority: st.priority,
        status: st.status,
        responseDueAt,
        resolutionDueAt,
        resolutionNote: st.resolutionNote || null,
        resolvedAt: st.resolvedAt || null,
        createdAt: st.createdAt,
      },
    });

    // Add status history
    await prisma.ticketStatusHistory.create({
      data: {
        ticketId: ticket.id,
        actorId: creatorId,
        fromStatus: "NONE",
        toStatus: "OPEN",
        note: "Tiket dibuat oleh pengguna",
        createdAt: st.createdAt,
      },
    });

    if (st.status === "IN_PROGRESS" || st.status === "ASSIGNED" || st.status === "RESOLVED") {
      await prisma.ticketStatusHistory.create({
        data: {
          ticketId: ticket.id,
          actorId: staffId || creatorId,
          fromStatus: "OPEN",
          toStatus: st.status,
          note: `Status diperbarui menjadi ${st.status}`,
          createdAt: new Date(st.createdAt.getTime() + 15 * 60 * 1000),
        },
      });
    }

    // Add sample comments
    if (st.status === "IN_PROGRESS") {
      await prisma.ticketComment.create({
        data: {
          ticketId: ticket.id,
          userId: staffId,
          content: "Halo Mas Fadhil, tim Network sedang melakukan investigasi ke switch access point lantai 3.",
          isInternalNote: false,
          createdAt: new Date(st.createdAt.getTime() + 30 * 60 * 1000),
        },
      });
      await prisma.ticketComment.create({
        data: {
          ticketId: ticket.id,
          userId: staffId,
          content: "CATATAN INTERNAL: Switch port Gi0/12 mengalami flapping. Sedang dicek kabel patch cord dan PoE adaptor.",
          isInternalNote: true,
          createdAt: new Date(st.createdAt.getTime() + 35 * 60 * 1000),
        },
      });
    }
  }
  console.log("✅ Sample tickets with comments and history seeded");

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

