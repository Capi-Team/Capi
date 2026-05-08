import type { NextRequest } from "next/server";

export function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Lee el cuerpo de un Request y devuelve un objeto JSON plano o error (sin `any`). */
export async function readJsonRecordFromRequest(
  request: NextRequest | Request
): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false };
  }
  if (!isJsonRecord(raw)) {
    return { ok: false };
  }
  return { ok: true, body: raw };
}

/** Lee `Response.json()` y devuelve `unknown` (el llamador debe acotar con parsers). */
export async function readJsonUnknownFromResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}
