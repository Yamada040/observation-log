import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Attachment, AttachmentKind } from "./types";

function baseStorageDir(): string {
  const envPath = process.env.OBS_STORAGE_DIR?.trim();
  if (envPath) {
    return envPath;
  }
  return join(process.cwd(), "storage");
}

function attachmentsDir(): string {
  return join(baseStorageDir(), "attachments");
}

function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function normalizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function extensionFromName(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx < 0) {
    return "";
  }
  return name.slice(idx + 1).toLowerCase();
}

export function detectAttachmentKind(fileName: string, mimeType: string): AttachmentKind | null {
  const ext = extensionFromName(fileName);
  const mime = mimeType.toLowerCase();

  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
    return "image";
  }
  if (mime === "application/pdf" || ext === "pdf") {
    return "pdf";
  }
  if (["text/csv", "application/csv", "application/vnd.ms-excel"].includes(mime) || ext === "csv") {
    return "csv";
  }
  return null;
}

export function saveAttachmentFile(params: {
  userId: string;
  observationId: string;
  fileName: string;
  mimeType: string;
  data: Uint8Array;
}): Attachment {
  const kind = detectAttachmentKind(params.fileName, params.mimeType);
  if (!kind) {
    throw new Error("Only image/PDF/CSV files are allowed");
  }

  const now = new Date().toISOString();
  const attachmentId = crypto.randomUUID();
  const ext = extensionFromName(params.fileName);

  const dir = join(attachmentsDir(), params.userId, params.observationId);
  ensureDir(dir);

  const safeName = normalizeFileName(params.fileName);
  const storedName = ext ? `${attachmentId}.${ext}` : attachmentId;
  const storagePath = join(dir, storedName);

  writeFileSync(storagePath, Buffer.from(params.data));

  return {
    id: attachmentId,
    observationId: params.observationId,
    userId: params.userId,
    fileName: safeName,
    mimeType: params.mimeType || "application/octet-stream",
    size: params.data.byteLength,
    kind,
    storagePath,
    createdAt: now
  };
}

export function readAttachmentFile(attachment: Attachment): Uint8Array {
  return readFileSync(attachment.storagePath);
}

export function removeAttachmentFile(attachment: Attachment): void {
  if (existsSync(attachment.storagePath)) {
    unlinkSync(attachment.storagePath);
  }
}
