export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export type AuthAction = "register" | "login";

export function parseAuthAction(value: unknown): AuthAction | null {
  if (value === "register" || value === "login") {
    return value;
  }
  return null;
}
