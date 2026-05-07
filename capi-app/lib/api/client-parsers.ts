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
      typeof input.message === "string" ? input.message : "Invalid credentials.";
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
      typeof input.message === "string" ? input.message : "Account created successfully.";
    return { success: true, message };
  }
  if (input.success === false) {
    const message =
      typeof input.message === "string" ? input.message : "Registration could not be completed.";
    return { success: false, message };
  }
  return null;
}

export type WorkspaceCreateClientPayload =
  | { success: true; redirectTo: string }
  | { success: false; message: string };

export function parseWorkspaceCreateClientPayload(
  input: unknown
): WorkspaceCreateClientPayload | null {
  if (!isJsonRecord(input)) return null;
  if (input.success === true) {
    const redirectTo =
      typeof input.redirectTo === "string" ? input.redirectTo : "/dashboard/owner";
    return { success: true, redirectTo };
  }
  if (input.success === false) {
    const message =
      typeof input.message === "string" ? input.message : "Could not create workspace.";
    return { success: false, message };
  }
  return null;
}

export type WorkspaceJoinClientPayload =
  | { success: true; alreadyMember?: boolean; redirectTo: string }
  | { success: false; message: string };

export function parseWorkspaceJoinClientPayload(
  input: unknown
): WorkspaceJoinClientPayload | null {
  if (!isJsonRecord(input)) return null;
  if (input.success === true) {
    const alreadyMember = input.alreadyMember === true;
    const redirectTo =
      typeof input.redirectTo === "string" ? input.redirectTo : "/dashboard/member";
    return { success: true, alreadyMember, redirectTo };
  }
  if (input.success === false) {
    const message =
      typeof input.message === "string" ? input.message : "Could not join workspace.";
    return { success: false, message };
  }
  return null;
}

export type WorkspaceSelectClientPayload =
  | { success: true; redirectTo: string }
  | { success: false; message: string };

export function parseWorkspaceSelectClientPayload(
  input: unknown
): WorkspaceSelectClientPayload | null {
  if (!isJsonRecord(input)) return null;
  if (input.success === true) {
    const redirectTo =
      typeof input.redirectTo === "string" ? input.redirectTo : "/dashboard/member";
    return { success: true, redirectTo };
  }
  if (input.success === false) {
    const message =
      typeof input.message === "string" ? input.message : "Could not open workspace.";
    return { success: false, message };
  }
  return null;
}
