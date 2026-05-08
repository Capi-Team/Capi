import crypto from "node:crypto";

/** Código corto para unirse a un workspace (preparado para invitaciones). */
export function generateInviteCode(): string {
  return crypto.randomBytes(5).toString("hex").toUpperCase();
}

export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}
