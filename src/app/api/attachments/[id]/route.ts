import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { canViewTicket } from "@/lib/rbac";
import { readAttachmentFile } from "@/lib/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get("download") === "true";

    const attachment = await prisma.ticketAttachment.findUnique({
      where: { id },
      include: {
        ticket: {
          select: {
            userId: true,
            assignedStaffId: true,
            assignedTeamId: true,
          },
        },
      },
    });

    if (!attachment) {
      return NextResponse.json({ error: "Lampiran tidak ditemukan." }, { status: 404 });
    }

    // Check authorization: user must have permission to view the parent ticket
    if (!canViewTicket(user, attachment.ticket)) {
      return NextResponse.json(
        { error: "Anda tidak berhak mengakses lampiran ini." },
        { status: 403 }
      );
    }

    // Read file from private storage
    const fileBuffer = await readAttachmentFile(attachment.storagePath);

    const disposition = isDownload ? "attachment" : "inline";

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Length": attachment.fileSize.toString(),
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(attachment.originalFilename)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error serving attachment:", error);
    return NextResponse.json(
      { error: "Gagal memuat berkas lampiran." },
      { status: 500 }
    );
  }
}
