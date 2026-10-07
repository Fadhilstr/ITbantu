import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
        itTeam: {
          select: { id: true, name: true },
        },
      },
    });

    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ services, departments });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Gagal memuat katalog layanan." },
      { status: 500 }
    );
  }
}

