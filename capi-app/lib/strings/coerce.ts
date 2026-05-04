export function toTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function toEmailAddress(value: unknown): string {
  return toTrimmedString(value).toLowerCase();
}
