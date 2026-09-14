/**
 * Attachments, in memory as data URLs. Mirrors the reference's rules: 15 MB
 * cap, MIME allowlist, content type derived from the validated extension and
 * never trusted from the client. Production stores these in a private bucket
 * behind signed URLs.
 */
import { singleton } from "../store";

export interface StoredFile {
  id: string;
  ownerId: string; // uploader
  scope: string; // "assignment:<id>", "test:<id>", "submission:<id>", "resource:<spaceId>"
  name: string;
  contentType: string;
  bytes: number;
  at: string;
}

export const MAX_FILE_BYTES = 15 * 1024 * 1024;

const TYPE_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  txt: "text/plain",
  zip: "application/zip",
};

export const FILES: Map<string, StoredFile> = singleton("files", () => new Map());
const BLOBS: Map<string, string> = singleton("fileBlobs", () => new Map());

export function contentTypeFor(name: string): string | null {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  return TYPE_BY_EXT[ext] ?? null;
}

export function storeFile(input: { ownerId: string; scope: string; name: string; dataUrl: string }): { file?: StoredFile; error?: string } {
  const name = input.name.replace(/[^\w.\- ()]/g, "_").slice(0, 120);
  const contentType = contentTypeFor(name);
  if (!contentType) return { error: "That file type is not allowed. Use PDF, Office, image, text or zip." };
  const m = /^data:[^;]+;base64,(.+)$/.exec(input.dataUrl);
  if (!m) return { error: "Unreadable upload." };
  const bytes = Math.floor((m[1].length * 3) / 4);
  if (bytes > MAX_FILE_BYTES) return { error: "Files must be 15 MB or smaller." };
  const file: StoredFile = { id: `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, ownerId: input.ownerId, scope: input.scope, name, contentType, bytes, at: new Date().toISOString() };
  FILES.set(file.id, file);
  BLOBS.set(file.id, m[1]);
  return { file };
}

export function fileBytes(id: string): Buffer | null {
  const b64 = BLOBS.get(id);
  return b64 ? Buffer.from(b64, "base64") : null;
}

export function filesFor(scope: string): StoredFile[] {
  return [...FILES.values()].filter((f) => f.scope === scope).sort((a, b) => a.at.localeCompare(b.at));
}

export function removeFile(id: string): boolean {
  BLOBS.delete(id);
  return FILES.delete(id);
}
