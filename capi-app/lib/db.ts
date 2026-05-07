import fs from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaAdapter?: PrismaPg;
};

function parseDotEnv(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed
      .slice(0, eq)
      .trim()
      .replace(/^export\s+/i, "");
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key) out[key] = val;
  }
  return out;
}

function dotEnvCandidateDirs(): string[] {
  const dirs = new Set<string>();
  dirs.add(process.cwd());
  dirs.add(path.resolve(process.cwd(), "capi-app"));
  dirs.add(path.resolve(process.cwd(), ".."));

  let cur = path.resolve(process.cwd());
  for (let i = 0; i < 8; i++) {
    dirs.add(cur);
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return [...dirs];
}

function connectionStringFromEnvFiles(): string | undefined {
  for (const dir of dotEnvCandidateDirs()) {
    const file = path.join(dir, ".env");
    try {
      if (!fs.statSync(file).isFile()) continue;
    } catch {
      continue;
    }
    try {
      const parsed = parseDotEnv(fs.readFileSync(file, "utf8"));
      const url =
        parsed.DIRECT_URL?.trim() || parsed.DATABASE_URL?.trim();
      if (url) return url;
    } catch {
      continue;
    }
  }
  return undefined;
}

function resolveConnectionString(): string | undefined {
  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

  const fromFile = connectionStringFromEnvFiles();
  if (fromFile) return fromFile;

  return (
    process.env["DIRECT_URL"]?.trim() ||
    process.env["DATABASE_URL"]?.trim()
  );
}

const connectionString = resolveConnectionString();

const adapter =
  globalForPrisma.prismaAdapter ??
  (connectionString ? new PrismaPg({ connectionString }) : undefined);

if (process.env.NODE_ENV !== "production" && adapter) {
  globalForPrisma.prismaAdapter = adapter;
}

if (!adapter) {
  throw new Error(
    "[db] Missing DATABASE_URL or DIRECT_URL. Add a .env file at the capi-app project root and restart the server."
  );
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
