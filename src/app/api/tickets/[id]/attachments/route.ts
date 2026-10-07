import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { canViewTicket } from "@/lib/rbac";
import { saveUploadedFile } from "@/lib/storage";
import { logAuditEvent } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Tiket tidak ditemukan." }, { status: 404 });
    }

    if (!canViewTicket(user, ticket)) {
      return NextResponse.json(
        { error: "Anda tidak berhak mengupload berkas ke tiket ini." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const commentId = formData.get("commentId") as string | null;
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada berkas yang dipilih untuk diupload." },
        { status: 400 }
      );
    }

    const uploadedRecords = [];

    for (const file of files) {
      if (!file.name || file.size === 0) continue;

      const fileResult = await saveUploadedFile(file);

      const record = await prisma.ticketAttachment.create({
        data: {
          ticketId: id,
          commentId: commentId || null,
          originalFilename: fileResult.originalFilename,
          storedFilename: fileResult.storedFilename,
          mimeType: fileResult.mimeType,
          fileSize: fileResult.fileSize,
          storagePath: fileResult.storagePath,
          uploadedBy: user.id,
        },
      });

      uploadedRecords.push(record);

      await logAuditEvent({
        actorId: user.id,
        action: "ATTACHMENT_UPLOAD",
        entityType: "ATTACHMENT",
        entityId: record.id,
        ticketId: id,
        newValue: {
          filename: record.originalFilename,
          size: record.fileSize,
          mime: record.mimeType,
        },
        ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: request.headers.get("user-agent") || undefined,
      });
    }

    return NextResponse.json({
      success: true,
      attachments: uploadedRecords,
      message: `${uploadedRecords.length} berkas berhasil diupload.`,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Gagal mengupload berkas.";
    console.error("Error uploading attachments:", error);
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}

