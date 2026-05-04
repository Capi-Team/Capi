import { isJsonRecord } from "@/lib/http/json";

export type AuthLoginClientPayload =
  | { success: true; redirectTo: string }
  | { success: false; message: string };

export function parseAuthLoginClientPayload(input: unknown): AuthLoginClientPayload | null {
  if (!isJsonRecord(input)) return null;
  if (input.success === true) {
    const redirectTo = typeof input.redirectTo === "string" ? input.redirectTo : "/dashboard";
    return { success: true, redirectTo };
  }
  if (input.success === false) {
    const message =
      typeof input.message === "string" ? input.message : "Credenciales inválidas.";
    return { success: false, message };
  }
  return null;
}

export type AuthRegisterClientPayload =
  | { success: true; message: string }
  | { success: false; message: string };

export function parseAuthRegisterClientPayload(input: unknown): AuthRegisterClientPayload | null {
  if (!isJsonRecord(input)) return null;
  if (input.success === true) {
    const message =
      typeof input.message === "string" ? input.message : "Registro creado correctamente.";
    return { success: true, message };
  }
  if (input.success === false) {
    const message =
      typeof input.message === "string" ? input.message : "No se pudo completar el registro.";
    return { success: false, message };
  }
  return null;
}

export type WorkspaceCreateClientPayload =
  | { success: true }
  | { success: false; message: string };

export function parseWorkspaceCreateClientPayload(
  input: unknown
): WorkspaceCreateClientPayload | null {
  if (!isJsonRecord(input)) return null;
  if (input.success === true) return { success: true };
  if (input.success === false) {
    const message =
      typeof input.message === "string" ? input.message : "No se pudo crear el entorno.";
    return { success: false, message };
  }
  return null;
}

export type WorkspaceJoinClientPayload =
  | { success: true; alreadyMember?: boolean }
  | { success: false; message: string };

export function parseWorkspaceJoinClientPayload(
  input: unknown
): WorkspaceJoinClientPayload | null {
  if (!isJsonRecord(input)) return null;
  if (input.success === true) {
    const alreadyMember = input.alreadyMember === true;
    return { success: true, alreadyMember };
  }
  if (input.success === false) {
    const message =
      typeof input.message === "string" ? input.message : "No se pudo unir al entorno.";
    return { success: false, message };
  }
  return null;
}
