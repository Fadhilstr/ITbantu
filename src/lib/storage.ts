import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".pdf"]);

const MAX_SIZE_MB = parseInt(process.env.UPLOAD_MAX_FILE_SIZE_MB || "10", 10);
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export const UPLOAD_BASE_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "storage/attachments");

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(file: {
  name: string;
  size: number;
  type: string;
}): FileValidationResult {
  if (file.size > MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `Ukuran file melebihi batas maksimal ${MAX_SIZE_MB} MB.`,
    };
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `Format ekstensi ${ext} tidak diizinkan. Gunakan JPG, PNG, WEBP, atau PDF.`,
    };
  }

  if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Tipe MIME ${file.type} tidak diizinkan.`,
    };
  }

  return { valid: true };
}

export async function saveUploadedFile(file: File): Promise<{
  originalFilename: string;
  storedFilename: string;
  mimeType: string;
  fileSize: number;
  storagePath: string;
}> {
  const validation = validateFile({
    name: file.name,
    size: file.size,
    type: file.type,
  });

  if (!validation.valid) {
    throw new Error(validation.error || "Validasi berkas gagal.");
  }

  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");

  const targetDir = path.join(UPLOAD_BASE_DIR, year, month);
  await fs.mkdir(targetDir, { recursive: true });

  const ext = path.extname(file.name).toLowerCase();
  const randomId = crypto.randomUUID();
  const storedFilename = `${randomId}${ext}`;
  const absoluteFilePath = path.join(targetDir, storedFilename);
  const relativeStoragePath = path.join(year, month, storedFilename);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await fs.writeFile(absoluteFilePath, buffer);

  return {
    originalFilename: file.name,
    storedFilename,
    mimeType: file.type,
    fileSize: file.size,
    storagePath: relativeStoragePath,
  };
}

export async function readAttachmentFile(storagePath: string): Promise<Buffer> {
  // Prevent directory traversal attacks
  const safeRelativePath = path.normalize(storagePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const absolutePath = path.join(UPLOAD_BASE_DIR, safeRelativePath);

  if (!absolutePath.startsWith(UPLOAD_BASE_DIR)) {
    throw new Error("Akses direktori tidak sah.");
  }

  return await fs.readFile(absolutePath);
}

