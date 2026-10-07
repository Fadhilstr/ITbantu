import test from "node:test";
import assert from "node:assert/strict";
import path from "path";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".pdf"]);
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function validateFile(file) {
  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: "Ukuran file melebihi batas 10 MB." };
  }
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { valid: false, error: "Format ekstensi tidak diizinkan." };
  }
  if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
    return { valid: false, error: "Tipe MIME tidak diizinkan." };
  }
  return { valid: true };
}

function sanitizeStoragePath(storagePath, baseDir = "/app/storage/attachments") {
  const safeRelativePath = path.normalize(storagePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const absolutePath = path.join(baseDir, safeRelativePath);
  if (!absolutePath.startsWith(baseDir)) {
    throw new Error("Akses direktori tidak sah.");
  }
  return absolutePath;
}

test("Storage: File validation rules", () => {
  // Valid image
  assert.equal(
    validateFile({ name: "error.png", size: 500 * 1024, type: "image/png" }).valid,
    true
  );

  // Valid PDF
  assert.equal(
    validateFile({ name: "invoice.pdf", size: 2 * 1024 * 1024, type: "application/pdf" }).valid,
    true
  );

  // File too large (> 10MB)
  assert.equal(
    validateFile({ name: "large.jpg", size: 12 * 1024 * 1024, type: "image/jpeg" }).valid,
    false
  );

  // Dangerous extension (e.g. .exe / .sh / .php)
  assert.equal(
    validateFile({ name: "script.php", size: 100, type: "application/x-php" }).valid,
    false
  );

  // Spoofed MIME vs extension
  assert.equal(
    validateFile({ name: "malware.exe", size: 100, type: "image/png" }).valid,
    false
  );
});

test("Storage: Path traversal security", () => {
  const baseDir = "/app/storage/attachments";

  // Normal safe path
  const safe = sanitizeStoragePath("2026/10/file-uuid.png", baseDir);
  assert.equal(safe, "/app/storage/attachments/2026/10/file-uuid.png");

  // Attempted path traversal (../../../etc/passwd)
  const sanitized = sanitizeStoragePath("../../../etc/passwd", baseDir);
  assert.ok(sanitized.startsWith(baseDir));
  assert.notEqual(sanitized, "/etc/passwd");
});

